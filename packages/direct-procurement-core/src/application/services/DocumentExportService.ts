import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import type { ProcurementFileDto } from "../dto/procurement-file/ProcurementFileDto";
import type { PriceOfferDto } from "../dto/price-research/PriceResearchDto";

export interface EkapRecordFormPayload {
    ihaleKayitNo?: string;
    dogrudanTeminTuru: string;
    alimTuru: string;
    alimKonusu: string;
    yaklasikMaliyet: number;
    sozlesmeBedeli: number;
    kazananIstekliVergiNo?: string;
    kazananIstekliUnvan?: string;
    teklifVerenSayisi: number;
    butceYili: number;
    kurumKodu?: string;
    onayTarihi?: string;
    teslimSuresiGun?: number;
    teklifler: Array<{
        istekliId: number;
        istekliUnvan?: string;
        toplamTeklifTutari: number;
        kazandiMi: boolean;
    }>;
}

export interface DocumentExportPayload {
    format: "pdf" | "docx" | "udf" | "html";
    fileName: string;
    htmlContent: string;
    options?: {
        pageSize?: "A4" | "A5";
        orientation?: "portrait" | "landscape";
    };
}

/**
 * DocumentExportService
 *
 * Veritabanı harici belge derleme, format dönüştürme ve KİK EKAP
 * doğrudan temin kayıt formu JSON çıktısını üreten dışa aktarım servisidir.
 */
export class DocumentExportService {
    /**
     * EKAP Doğrudan Temin Kayıt Formu (KİK Ek-1) payload'ı üretir.
     */
    generateEkapRecordForm(params: {
        fileDto: ProcurementFileDto;
        offers: PriceOfferDto[];
        winningOfferId?: number;
        winnerSupplierTitle?: string;
        winnerTaxNumber?: string;
    }): Result<EkapRecordFormPayload, AppError> {
        const { fileDto, offers, winningOfferId, winnerSupplierTitle, winnerTaxNumber } = params;

        if (!fileDto) {
            return failure(
                new AppError({
                    code: "EXPORT_NO_FILE",
                    message: "EKAP kayıt formu için dosya DTO'su zorunludur.",
                }),
            );
        }

        // İsteklilere göre gruplanmış toplam teklifler
        const supplierTotals = new Map<number, { title?: string; total: number; isWinner: boolean }>();

        for (const offer of offers) {
            const current = supplierTotals.get(offer.supplierId) || {
                title: offer.supplierName,
                total: 0,
                isWinner: false,
            };
            current.total += offer.unitPrice + (offer.vatAmount ?? 0);
            if (winningOfferId && offer.id === winningOfferId) {
                current.isWinner = true;
            }
            supplierTotals.set(offer.supplierId, current);
        }

        const formattedTeklifler = Array.from(supplierTotals.entries()).map(([supplierId, val]) => ({
            istekliId: supplierId,
            istekliUnvan: val.title || `İstekli #${supplierId}`,
            toplamTeklifTutari: Math.round(val.total * 100) / 100,
            kazandiMi: val.isWinner,
        }));

        const winningSupplier = Array.from(supplierTotals.values()).find((v) => v.isWinner);
        const sozlesmeBedeli = winningSupplier ? winningSupplier.total : fileDto.estimatedCost;

        const payload: EkapRecordFormPayload = {
            dogrudanTeminTuru: "4734 Sayılı Kanun Madde 22/d",
            alimTuru: fileDto.procurementType,
            alimKonusu: fileDto.subject,
            yaklasikMaliyet: fileDto.estimatedCost,
            sozlesmeBedeli,
            kazananIstekliUnvan: winnerSupplierTitle || winningSupplier?.title,
            kazananIstekliVergiNo: winnerTaxNumber,
            teklifVerenSayisi: supplierTotals.size,
            butceYili: fileDto.budgetYear || new Date().getFullYear(),
            teslimSuresiGun: fileDto.deliveryDays,
            teklifler: formattedTeklifler,
        };

        return success(payload);
    }

    /**
     * Belgeyi dışa aktarım için hazır payload haline getirir.
     */
    prepareExportPayload(
        documentTitle: string,
        htmlContent: string,
        format: "pdf" | "docx" | "udf" | "html" = "pdf",
    ): Result<DocumentExportPayload, AppError> {
        if (!htmlContent || !htmlContent.trim()) {
            return failure(
                new AppError({
                    code: "EXPORT_EMPTY_CONTENT",
                    message: "Dışa aktarılacak belgenin HTML içeriği boş olamaz.",
                }),
            );
        }

        const safeTitle = documentTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
        const fileName = `${safeTitle}.${format}`;

        return success({
            format,
            fileName,
            htmlContent,
            options: {
                pageSize: "A4",
                orientation: "portrait",
            },
        });
    }
}
