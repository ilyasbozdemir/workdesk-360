import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";
import { ProcurementFileDetailMapper } from "../mappers/ProcurementFileDetailMapper";

/**
 * Düzenleme Yetkisi Göstergesi
 */
export interface EditPermissionIndicator {
    canEdit: boolean;
    badgeText: string; // "Düzenlenebilir" | "Salt Okunur (Kilitli)" | "Yetki Yok"
    badgeColor: "green" | "amber" | "red" | "gray";
    reason?: string;
}

/**
 * Detay Ekranı ViewModel Kontratı
 *
 * İstenen temel alan grupları:
 * - Dosya bilgileri (subject, procurementNumber, documentNumber, unitName, budget vb.)
 * - Alım türü (procurementType, procurementTypeLabel)
 * - Kilit durumu (isLocked, lockStatusLabel, lockBadgeColor, lockReason)
 * - Düzenleme yetkisi göstergesi (canEdit, editPermissionIndicator)
 */
export interface ProcurementFileDetailView {
    // 1. Dosya bilgileri
    id: number;
    procurementNumber: string;
    documentNumber: string;
    subject: string;
    unitName: string;
    budgetYear: number;
    budgetType: string;
    contractType: string;
    deliveryDays: number | null;
    estimatedCost: number;
    formattedEstimatedCost: string;
    status: string;
    statusLabel: string;
    statusBadgeColor: "gray" | "blue" | "green" | "red";
    createdAt?: string | Date;
    formattedCreatedAt?: string;

    // 2. Alım türü
    procurementType: string;
    procurementTypeLabel: string;

    // 3. Kilit durumu
    isLocked: boolean;
    lockStatusLabel: string;
    lockBadgeColor: "red" | "green";
    lockReason?: string;

    // 4. Düzenleme yetkisi göstergesi
    canEdit: boolean;
    canApprove: boolean;
    canDelete: boolean;
    editPermissionIndicator: EditPermissionIndicator;
}

export class ProcurementFileDetailViewModel {
    static toDetailView(dto: ProcurementFileDto): ProcurementFileDetailView {
        return ProcurementFileDetailMapper.toDetailView(dto);
    }
}
