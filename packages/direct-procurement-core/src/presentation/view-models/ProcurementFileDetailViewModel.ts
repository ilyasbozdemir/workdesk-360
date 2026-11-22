import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";

export interface ProcurementFileDetailView {
    id: number;
    procurementNumber: string;
    documentNumber: string;
    subject: string;
    status: string;
    statusBadgeColor: "gray" | "blue" | "green" | "red";
    statusLabel: string;
    procurementType: string;
    procurementTypeLabel: string;
    budgetYear: number;
    budgetType: string;
    unitName: string;
    contractType: string;
    estimatedCost: number;
    formattedEstimatedCost: string;
    deliveryDays: number | null;
    isLocked: boolean;
}

export class ProcurementFileDetailViewModel {
    static toDetailView(dto: ProcurementFileDto): ProcurementFileDetailView {
        const badgeColors: Record<string, "gray" | "blue" | "green" | "red"> = {
            draft: "gray",
            in_progress: "blue",
            completed: "green",
            cancelled: "red",
        };

        const statusLabels: Record<string, string> = {
            draft: "Taslak",
            in_progress: "Süreç Devam Ediyor",
            completed: "Sonuçlandırıldı",
            cancelled: "İptal Edildi",
        };

        const typeLabels: Record<string, string> = {
            mal: "Mal Alımı",
            hizmet: "Hizmet Alımı",
            yapim_isi: "Yapım İşi",
            danismanlik: "Danışmanlık Hizmet Alımı",
        };

        const formattedCost = new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(dto.estimatedCost || 0);

        return {
            id: dto.id,
            procurementNumber: dto.procurementNumber || "—",
            documentNumber: dto.documentNumber || "—",
            subject: dto.subject,
            status: dto.status,
            statusBadgeColor: badgeColors[dto.status] || "gray",
            statusLabel: statusLabels[dto.status] || dto.status,
            procurementType: dto.procurementType,
            procurementTypeLabel: typeLabels[dto.procurementType] || dto.procurementType,
            budgetYear: dto.budgetYear || new Date().getFullYear(),
            budgetType: dto.budgetType || "Öz Bütçe",
            unitName: dto.unitName || "Belirtilmemiş Birim",
            contractType: dto.contractType || "Doğrudan Temin",
            estimatedCost: dto.estimatedCost || 0,
            formattedEstimatedCost: formattedCost,
            deliveryDays: dto.deliveryDays ?? null,
            isLocked: dto.status === "completed" || dto.status === "cancelled",
        };
    }
}
