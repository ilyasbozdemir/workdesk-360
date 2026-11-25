import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";
import type { ProcurementFileListItemView } from "../view-models/ProcurementFileListViewModel";

/**
 * ProcurementFileListMapper
 *
 * Ortak ProcurementFileDto'yu alarak Liste Ekranı için özel
 * ProcurementFileListItemView üretir.
 *
 * Sağladığı temel alanlar:
 * - Dosya numarası
 * - Durum etiketi
 * - Toplam tutar (sayısal ve para birimi formatlı)
 * - Oluşturulma tarihi (tarih ve Türkçe formatlı)
 */
export class ProcurementFileListMapper {
    private static readonly statusLabels: Record<string, string> = {
        draft: "Taslak",
        in_progress: "Devam Ediyor",
        completed: "Tamamlandı",
        cancelled: "İptal Edildi",
    };

    static toListItemView(dto: ProcurementFileDto): ProcurementFileListItemView {
        const totalAmount = dto.totalAmount ?? dto.estimatedCost ?? 0;

        const formattedTotalAmount = new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(totalAmount);

        const createdAt = dto.createdAt ?? new Date();
        const dateObj = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
        const formattedCreatedAt = !isNaN(dateObj.getTime())
            ? new Intl.DateTimeFormat("tr-TR").format(dateObj)
            : "—";

        return {
            id: dto.id,
            procurementNumber: dto.procurementNumber || "—",
            subject: dto.subject,
            status: dto.status,
            statusLabel: this.statusLabels[dto.status] || dto.status,
            totalAmount,
            formattedTotalAmount,
            formattedCost: formattedTotalAmount,
            procurementType: dto.procurementType,
            unitName: dto.unitName || "Genel Birim",
            budgetYear: dto.budgetYear || new Date().getFullYear(),
            createdAt,
            formattedCreatedAt,
        };
    }

    static toList(dtos: ProcurementFileDto[]): ProcurementFileListItemView[] {
        return dtos.map((dto) => this.toListItemView(dto));
    }
}
