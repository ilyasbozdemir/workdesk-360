import type { RequirementDto } from "../../application/dto/requirement/RequirementDto";

export interface RequirementView {
    id: number;
    reportNumber: string;
    title: string;
    statusLabel: string;
    formattedBudget: string;
    itemCount: number;
}

export class RequirementViewModel {
    static toView(dto: RequirementDto): RequirementView {
        const statusMap: Record<string, string> = {
            taslak: "Taslak Talep",
            onaylandi: "Onaylandı",
            dosyaya_aktarildi: "Dosyaya Aktarıldı",
            iptal: "İptal",
        };

        const formatted = new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(dto.estimatedBudget || 0);

        return {
            id: dto.id,
            reportNumber: dto.reportNumber,
            title: dto.title,
            statusLabel: statusMap[dto.status] || dto.status,
            formattedBudget: formatted,
            itemCount: dto.itemCount,
        };
    }
}
