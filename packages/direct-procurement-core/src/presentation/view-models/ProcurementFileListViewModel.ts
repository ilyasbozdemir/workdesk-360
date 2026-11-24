import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";
import { ProcurementFileListMapper } from "../mappers/ProcurementFileListMapper";

/**
 * Liste Ekranı ViewModel Kontratı
 *
 * İstenen temel alanlar:
 * - Dosya numarası (procurementNumber)
 * - Durum etiketi (statusLabel)
 * - Toplam tutar (totalAmount & formattedTotalAmount)
 * - Oluşturulma tarihi (createdAt & formattedCreatedAt)
 */
export interface ProcurementFileListItemView {
    id: number;
    procurementNumber: string;
    subject: string;
    status: string;
    statusLabel: string;
    totalAmount: number;
    formattedTotalAmount: string;
    // Geriye dönük uyumluluk için:
    formattedCost: string;
    procurementType: string;
    unitName: string;
    budgetYear: number;
    createdAt: string | Date;
    formattedCreatedAt: string;
}

// Geriye dönük uyumluluk için alias
export type ProcurementFileListItem = ProcurementFileListItemView;

export class ProcurementFileListViewModel {
    static toListItem(dto: ProcurementFileDto): ProcurementFileListItemView {
        return ProcurementFileListMapper.toListItemView(dto);
    }

    static toList(dtos: ProcurementFileDto[]): ProcurementFileListItemView[] {
        return ProcurementFileListMapper.toList(dtos);
    }
}
