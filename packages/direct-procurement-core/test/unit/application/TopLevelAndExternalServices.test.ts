import { describe, it, expect } from "vitest";
import { PrinterService } from "../../../src/application/services/PrinterService";
import { CompliancePolicyService } from "../../../src/application/services/CompliancePolicyService";
import { DocumentExportService } from "../../../src/application/services/DocumentExportService";
import { DirectProcurementFacade } from "../../../src/application/services/DirectProcurementFacade";
import { SystemPrinterAdapter } from "../../../src/infrastructure/adapters/PrinterAdapter";
import type { IPrinterPort, PrinterInfo } from "../../../src/application/ports/IPrinterPort";
import { ProcurementFileService } from "../../../src/application/services/ProcurementFileService";
import { RequirementService } from "../../../src/application/services/RequirementService";
import { CommissionService } from "../../../src/application/services/CommissionService";
import { PriceResearchService } from "../../../src/application/services/PriceResearchService";
import { ApprovalService } from "../../../src/application/services/ApprovalService";
import { DocumentService } from "../../../src/application/services/DocumentService";
import { ProcurementFile } from "../../../src/domain/procurement-file/ProcurementFile";
import { ProcurementFileStatus } from "../../../src/domain/procurement-file/ProcurementFileStatus";
import { success } from "@worksuite-360/core";

describe("DB Harici Servisler & En Üst Servisler (External & Top-Level Services)", () => {
    describe("1. PrinterService (Yazıcı Yönetimi ve Baskı)", () => {
        it("Sistemdeki yazıcıları listeler ve varsayılan yazıcıyı döner", async () => {
            const mockPrinterPort: IPrinterPort = {
                async listPrinters(): Promise<PrinterInfo[]> {
                    return [
                        {
                            name: "HP_LaserJet_Pro",
                            displayName: "HP LaserJet Pro (Muhasebe)",
                            description: "Ofis Yazıcısı",
                            status: 0,
                            isDefault: true,
                        },
                        {
                            name: "Canon_LBP_2900",
                            displayName: "Canon LBP2900 (Ambar)",
                            description: "Yerel Yazıcı",
                            status: 0,
                            isDefault: false,
                        },
                    ];
                },
                async getDefaultPrinter(): Promise<PrinterInfo | null> {
                    const list = await this.listPrinters();
                    return list.find((p) => p.isDefault) || null;
                },
                async printHtml() {
                    return { success: true, jobId: "job_123" };
                },
            };

            const service = new PrinterService(mockPrinterPort);

            const listRes = await service.listPrinters();
            expect(listRes.success).toBe(true);
            if (listRes.success) {
                expect(listRes.data.length).toBe(2);
                expect(listRes.data[0].name).toBe("HP_LaserJet_Pro");
            }

            const defaultRes = await service.getDefaultPrinter();
            expect(defaultRes.success).toBe(true);
            if (defaultRes.success) {
                expect(defaultRes.data?.name).toBe("HP_LaserJet_Pro");
            }
        });

        it("Belge baskısını doğru parametrelerle yürütür ve boş içeriği engeller", async () => {
            const adapter = new SystemPrinterAdapter();
            const service = new PrinterService(adapter);

            // Başarılı yazdırma
            const printRes = await service.printDocument(
                "Piyasa Fiyat Araştırma Tutanağı",
                "<html><body><h1>Tutanak</h1></body></html>",
                { copies: 2, pageSize: "A4" },
            );
            expect(printRes.success).toBe(true);
            if (printRes.success) {
                expect(printRes.data.copies).toBe(2);
            }

            // Boş içerik engeli
            const emptyRes = await service.printDocument("Boş Belge", "");
            expect(emptyRes.success).toBe(false);
            if (!emptyRes.success) {
                expect(emptyRes.error.code).toBe("PRINT_EMPTY_CONTENT");
            }
        });
    });

    describe("2. CompliancePolicyService (Mevzuat ve Limit Politikası - Tebliğ 40666)", () => {
        const compliance = new CompliancePolicyService();

        it("4734 Madde 22/d parasal limitlerini ve uyarı eşiklerini doğru denetler", () => {
            // Limit dahilinde normal dosya
            const normal = compliance.checkMd22dLimit(150000, true);
            expect(normal.success).toBe(true);
            if (normal.success) {
                expect(normal.data.isWithinLimit).toBe(true);
                expect(normal.data.isWarningThresholdExceeded).toBe(false);
            }

            // %90 uyarı eşiğini aşan dosya
            const warning = compliance.checkMd22dLimit(600000, true);
            expect(warning.success).toBe(true);
            if (warning.success) {
                expect(warning.data.isWithinLimit).toBe(true);
                expect(warning.data.isWarningThresholdExceeded).toBe(true);
                expect(warning.data.message).toContain("DİKKAT");
            }

            // Limiti aşan dosya
            const exceeded = compliance.checkMd22dLimit(700000, true);
            expect(exceeded.success).toBe(true);
            if (exceeded.success) {
                expect(exceeded.data.isWithinLimit).toBe(false);
                expect(exceeded.data.message).toContain("aşmaktadır");
            }
        });

        it("Tebliğ 40666 Madde 5 Rol İzolasyonu (Separation of Duties) çatışmalarını tespit eder", () => {
            // Çatışma 1: Harcama Yetkilisi kabul komisyonunda yer alamaz
            const res = compliance.validateSeparationOfDuties({
                spendingAuthorizerId: 10,
                realizationOfficerId: 20,
                pfaMembers: [{ id: 30, name: "Ahmet" }],
                acceptanceMembers: [{ id: 10, name: "Müdür Bey" }], // Çakışma!
            });

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.isValid).toBe(false);
                expect(res.data.conflicts[0].violationReason).toContain("kabul komisyonunda üye olarak");
            }

            // Çatışma 2: Harcama Yetkilisi ile Gerçekleştirme Görevlisi aynı kişi olamaz
            const res2 = compliance.validateSeparationOfDuties({
                spendingAuthorizerId: 15,
                realizationOfficerId: 15, // Çakışma!
                pfaMembers: [{ id: 30 }],
                acceptanceMembers: [{ id: 40 }],
            });

            expect(res2.success).toBe(true);
            if (res2.success) {
                expect(res2.data.isValid).toBe(false);
                expect(res2.data.conflicts[0].roles).toContain("Harcama Yetkilisi");
            }
        });

        it("Tebliğ 40666 uyarınca alım türüne göre teslim-tesellüm vs kabul belgelerini ayrıştırır", () => {
            // Mal alımında: Teslim-tesellüm vardır, tek ambar görevlisi alır
            const mal = compliance.getRequiredAcceptanceDocuments("mal");
            expect(mal.hasDeliveryReceipt).toBe(true);
            expect(mal.hasTimesheet).toBe(false);
            expect(mal.deliveryReceiverAuthority).toContain("Ambar Memuru");

            // Hizmet alımında: Teslim-tesellüm ASLA yoktur, puantaj cetveli vardır
            const hizmet = compliance.getRequiredAcceptanceDocuments("hizmet");
            expect(hizmet.hasDeliveryReceipt).toBe(false);
            expect(hizmet.hasTimesheet).toBe(true);
            expect(hizmet.requiredDocuments).toContain("Puantaj Cetveli / Hizmet İfa Çizelgesi");
        });
    });

    describe("3. DocumentExportService (EKAP ve Belge Dışa Aktarımı)", () => {
        const exportService = new DocumentExportService();

        it("EKAP Doğrudan Temin Kayıt Formu (KİK Ek-1) payload'ını eksiksiz üretir", () => {
            const res = exportService.generateEkapRecordForm({
                fileDto: {
                    id: 1,
                    subject: "Temizlik Malzemesi",
                    procurementType: "mal",
                    status: "completed",
                    isLocked: true,
                    estimatedCost: 80000,
                    budgetYear: 2026,
                    deliveryDays: 10,
                },
                offers: [
                    { id: 101, itemId: 1, supplierId: 5, supplierName: "A Firması", unitPrice: 35000, vatAmount: 7000 },
                    { id: 102, itemId: 1, supplierId: 6, supplierName: "B Firması", unitPrice: 40000, vatAmount: 8000 },
                ],
                winningOfferId: 101,
                winnerSupplierTitle: "A Firması Ltd.",
                winnerTaxNumber: "1234567890",
            });

            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.data.alimKonusu).toBe("Temizlik Malzemesi");
                expect(res.data.kazananIstekliUnvan).toBe("A Firması Ltd.");
                expect(res.data.teklifVerenSayisi).toBe(2);
                expect(res.data.dogrudanTeminTuru).toContain("Madde 22/d");
            }
        });
    });

    describe("4. DirectProcurementFacade (En Üst Seviye Orkestrasyon)", () => {
        it("Tüm alt servisleri tek bir merkezden koordine eder", async () => {
            // Mock Repositories & Services
            const mockFile = new ProcurementFile({
                id: 50,
                subject: "Yazıcı Toneri Alımı",
                procurementType: "mal",
                procurementNumber: "2026/DT-12",
                status: ProcurementFileStatus.InProgress,
                estimatedCost: 45000,
                createdAt: "2026-05-01",
            });

            const mockFileRepo: any = {
                create: async (file: any) => success(file),
                getById: async () => success(mockFile),
                update: async () => success(mockFile),
            };

            const fileService = new ProcurementFileService(mockFileRepo);
            const reqService = new RequirementService({} as any);
            const commService = new CommissionService({} as any);
            const priceService = new PriceResearchService({
                findByProcurementFileId: async () => [],
            } as any);
            const appService = new ApprovalService({} as any);
            const docService = new DocumentService({} as any);
            const printerService = new PrinterService(new SystemPrinterAdapter());
            const complianceService = new CompliancePolicyService();
            const exportService = new DocumentExportService();

            const facade = new DirectProcurementFacade({
                fileService,
                requirementService: reqService,
                commissionService: commService,
                priceResearchService: priceService,
                approvalService: appService,
                documentService: docService,
                printerService,
                complianceService,
                exportService,
            });

            // 1. Yazıcıları listeleme
            const printersRes = await facade.listAvailablePrinters();
            expect(printersRes.success).toBe(true);

            // 2. Liste ViewModel'i üretme
            const listItemRes = await facade.getFileListItem(50);
            expect(listItemRes.success).toBe(true);
            if (listItemRes.success) {
                expect(listItemRes.data.procurementNumber).toBe("2026/DT-12");
                expect(listItemRes.data.statusLabel).toBe("Devam Ediyor");
                expect(listItemRes.data.totalAmount).toBe(45000);
            }

            // 3. Detay ViewModel'i üretme
            const detailRes = await facade.getFileDetailView(50);
            expect(detailRes.success).toBe(true);
            if (detailRes.success) {
                expect(detailRes.data.procurementTypeLabel).toBe("Mal Alımı");
                expect(detailRes.data.editPermissionIndicator.canEdit).toBe(true);
                expect(detailRes.data.editPermissionIndicator.badgeText).toBe("Düzenlenebilir");
            }

            // 4. Tebliğ 40666 gereksinimlerini kontrol etme
            const docs = facade.getRequiredAcceptanceDocuments(50, "mal");
            expect(docs.hasDeliveryReceipt).toBe(true);

            // 5. Belge yazdırma
            const printRes = await facade.printDocument("Onay Belgesi", "<p>Onay</p>");
            expect(printRes.success).toBe(true);
        });
    });
});
