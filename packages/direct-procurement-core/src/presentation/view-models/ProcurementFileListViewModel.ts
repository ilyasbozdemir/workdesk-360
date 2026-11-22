import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";

export interface ProcurementFileListItem {
    id: number;
    procurementNumber: string;
    subject: string;
    status: string;
    statusLabel: string;
    procurementType: string;
    formattedCost: string;
    unitName: string;
    budgetYear: number;
}

export class ProcurementFileListViewModel {
    static toListItem(dto: ProcurementFileDto): ProcurementFileListItem {
        const statusLabels: Record<string, string> = {
            draft: "Taslak",
            in_progress: "Devam Ediyor",
            completed: "Tamamlandı",
            cancelled: "İptal Edildi",
        };

        const formattedCost = new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(dto.estimatedCost || 0);

        return {
            id: dto.id,
            procurementNumber: dto.procurementNumber || "—",
            subject: dto.subject,
            status: dto.status,
            statusLabel: statusLabels[dto.status] || dto.status,
            procurementType: dto.procurementType,
            formattedCost,
            unitName: dto.unitName || "Genel Birim",
            budgetYear: dto.budgetYear || new Date().getFullYear(),
        };
    }

    static toList(dtos: ProcurementFileDto[]): ProcurementFileListItem[] {
        return dtos.map(this.toListItem);
    }
}
