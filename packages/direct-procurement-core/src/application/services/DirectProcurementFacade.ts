import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import type { ProcurementFileService } from "./ProcurementFileService";
import type { RequirementService } from "./RequirementService";
import type { CommissionService } from "./CommissionService";
import type { PriceResearchService } from "./PriceResearchService";
import type { ApprovalService } from "./ApprovalService";
import type { DocumentService } from "./DocumentService";
import type { PrinterService } from "./PrinterService";
import type { CompliancePolicyService, LimitCheckResult } from "./CompliancePolicyService";
import type { DocumentExportService, EkapRecordFormPayload } from "./DocumentExportService";
import type { DirectProcurementService } from "../../dependency-injection/DirectProcurementService";
import type {
    CreateProcurementFileDto,
    ProcurementFileDto,
} from "../dto/procurement-file/ProcurementFileDto";
import type { ProcurementFileListMapper } from "../../presentation/mappers/ProcurementFileListMapper";
import type { ProcurementFileDetailMapper } from "../../presentation/mappers/ProcurementFileDetailMapper";
import type { ProcurementFileListItemView } from "../../presentation/view-models/ProcurementFileListViewModel";
import type { ProcurementFileDetailView } from "../../presentation/view-models/ProcurementFileDetailViewModel";
import type {
    PrinterInfo,
    PrintJobOptions,
    PrintJobResult,
} from "../ports/IPrinterPort";
import { ProcurementFileMapper } from "../../presentation/mappers/ProcurementFileMapper";

export interface DirectProcurementFacadeDeps {
    fileService: ProcurementFileService;
    requirementService: RequirementService;
    commissionService: CommissionService;
    priceResearchService: PriceResearchService;
    approvalService: ApprovalService;
    documentService: DocumentService;
    printerService: PrinterService;
    complianceService: CompliancePolicyService;
    exportService: DocumentExportService;
    coreProcurementService?: DirectProcurementService;
}

/**
 * DirectProcurementFacade (Doğrudan Temin En Üst Seviye Orkestrasyon Servisi)
 *
 * Tüm alt servisleri (Dosya, İhtiyaç, Komisyon, Fiyat Araştırma, Onay, Belge,
 * Yazıcı, Mevzuat Uyumluluk, EKAP Dışa Aktarım) tek bir çatı altında birleştiren
 * en üst seviye uygulama cephesidir (Master Application Facade).
 *
 * Kullanıcı arayüzü (React), Masaüstü (Electron IPC), REST veya CLI bileşenleri
 * doğrudan temin yaşam döngüsünü bu tek servis üzerinden uçtan uca yönetir.
 */
export class DirectProcurementFacade {
    constructor(private readonly deps: DirectProcurementFacadeDeps) {}

    // ─── 1. DOSYA YÖNETİMİ & LİSTELEME / DETAY GÖRÜNÜMÜ ──────────────────────

    /**
     * Yeni bir doğrudan temin dosyası açar ve 4734 md. 22/d parasal limit kontrolünü yapar.
     */
    async openFile(
        dto: CreateProcurementFileDto,
        options?: { isMetropolitan?: boolean },
    ): Promise<Result<{ file: ProcurementFileDto; limitInfo: LimitCheckResult }, AppError>> {
        // Mevzuat Limit Kontrolü
        const estimated = dto.estimatedCost ?? 0;
        const limitCheck = this.deps.complianceService.checkMd22dLimit(
            estimated,
            options?.isMetropolitan ?? true,
            dto.budgetYear,
        );
        if (!limitCheck.success) return failure(limitCheck.error);

        // Dosya Oluşturma
        const createResult = await this.deps.fileService.createFile(dto);
        if (!createResult.success) return failure(createResult.error);

        const fileDto = ProcurementFileMapper.toDto(createResult.data);
        return success({
            file: fileDto,
            limitInfo: limitCheck.data,
        });
    }

    /**
     * Dosyayı ID ile getirir ve DTO olarak döner.
     */
    async getFile(fileId: number): Promise<Result<ProcurementFileDto, AppError>> {
        const res = await this.deps.fileService.getFileById(fileId);
        if (!res.success) return failure(res.error);
        return success(ProcurementFileMapper.toDto(res.data));
    }

    /**
     * Dosyanın Liste Ekranı ViewModel'ini üretir (Dosya no, Durum etiketi, Toplam tutar, Oluşturulma tarihi).
     */
    async getFileListItem(fileId: number): Promise<Result<ProcurementFileListItemView, AppError>> {
        const fileRes = await this.getFile(fileId);
        if (!fileRes.success) return failure(fileRes.error);
        return success(ProcurementFileMapper.toListItem(fileRes.data));
    }

    /**
     * Dosyanın Detay Ekranı ViewModel'ini üretir (Dosya bilgileri, Alım türü, Kilit durumu, Düzenleme yetkisi).
     */
    async getFileDetailView(fileId: number): Promise<Result<ProcurementFileDetailView, AppError>> {
        const fileRes = await this.getFile(fileId);
        if (!fileRes.success) return failure(fileRes.error);
        return success(ProcurementFileMapper.toDetailView(fileRes.data));
    }

    /**
     * Dosyayı tamamlar ve kilitler.
     */
    async completeAndLockFile(
        fileId: number,
        reason?: string,
    ): Promise<Result<ProcurementFileDetailView, AppError>> {
        const completeRes = await this.deps.fileService.completeFile(fileId);
        if (!completeRes.success) return failure(completeRes.error);

        if (reason) {
            await this.deps.fileService.lockFile(fileId, reason);
        }

        return this.getFileDetailView(fileId);
    }

    // ─── 2. MEVZUAT UYUMLULUK & KOMİSYON KURMA (TEBLİĞ 40666) ────────────────

    /**
     * Alım türüne göre mevzuatça zorunlu kabul belgelerini listeler.
     */
    getRequiredAcceptanceDocuments(fileId: number, procurementType: any) {
        return this.deps.complianceService.getRequiredAcceptanceDocuments(procurementType);
    }

    /**
     * Rol izolasyonu (Separation of Duties) denetimi yaparak komisyon atamalarını doğrular.
     */
    validateCommissionRoles(params: {
        spendingAuthorizerId?: number;
        realizationOfficerId?: number;
        pfaMembers: Array<{ id: number; name?: string }>;
        acceptanceMembers: Array<{ id: number; name?: string; isChairman?: boolean }>;
    }) {
        return this.deps.complianceService.validateSeparationOfDuties(params);
    }

    // ─── 3. YAZICI & BASKI SERVİSİ (DB HARİCİ) ──────────────────────────────

    /**
     * İşletim sisteminde tanımlı kullanılabilir yazıcıları listeler.
     */
    async listAvailablePrinters(): Promise<Result<PrinterInfo[], AppError>> {
        return this.deps.printerService.listPrinters();
    }

    /**
     * Varsayılan yazıcıyı döner.
     */
    async getDefaultPrinter(): Promise<Result<PrinterInfo | null, AppError>> {
        return this.deps.printerService.getDefaultPrinter();
    }

    /**
     * Doğrudan temin belgesini seçili yazıcıya veya varsayılan yazıcıya basar.
     */
    async printDocument(
        documentTitle: string,
        htmlContent: string,
        options?: PrintJobOptions,
    ): Promise<Result<PrintJobResult, AppError>> {
        return this.deps.printerService.printDocument(documentTitle, htmlContent, options);
    }

    // ─── 4. EKAP & DIŞA AKTARIM (DB HARİCİ) ──────────────────────────────────

    /**
     * Dosya için EKAP Doğrudan Temin Kayıt Formu (KİK Ek-1) verisini derler.
     */
    async generateEkapForm(
        fileId: number,
        extra?: { winnerSupplierTitle?: string; winnerTaxNumber?: string },
    ): Promise<Result<EkapRecordFormPayload, AppError>> {
        const fileRes = await this.getFile(fileId);
        if (!fileRes.success) return failure(fileRes.error);

        const offersRes = await this.deps.priceResearchService.getOffersByFileId(fileId);
        const offers = offersRes.success ? offersRes.data : [];

        return this.deps.exportService.generateEkapRecordForm({
            fileDto: fileRes.data,
            offers: offers as any,
            winnerSupplierTitle: extra?.winnerSupplierTitle,
            winnerTaxNumber: extra?.winnerTaxNumber,
        });
    }

    /**
     * Belgeyi PDF / DOCX / UDF dışa aktarımı için paketler.
     */
    prepareDocumentExport(
        documentTitle: string,
        htmlContent: string,
        format: "pdf" | "docx" | "udf" | "html" = "pdf",
    ) {
        return this.deps.exportService.prepareExportPayload(documentTitle, htmlContent, format);
    }
}
