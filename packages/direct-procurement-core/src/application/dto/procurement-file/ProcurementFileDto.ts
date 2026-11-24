import type {
    BudgetType,
    ContractType,
    ProcurementFileType,
} from "../../../domain/procurement-file/ProcurementFile";

export interface CreateProcurementFileDto {
    subject: string;
    procurementType: ProcurementFileType;
    procurementNumber?: string;
    documentNumber?: string;
    budgetYear?: number;
    budgetType?: BudgetType;
    unitId?: number;
    unitName?: string;
    contractType?: ContractType;
    estimatedCost?: number;
}

export interface UpdateProcurementFileDto {
    subject?: string;
    description?: string;
    unitId?: number;
    unitName?: string;
    budgetCode?: string;
    estimatedCost?: number;
    deliveryDays?: number;
}

export interface ProcurementFilePermissionsDto {
    canEdit?: boolean;
    canApprove?: boolean;
    canDelete?: boolean;
    reason?: string;
}

/**
 * ProcurementFileDto
 *
 * Hem liste hem detay ekranının ortak tükettiği temel DTO.
 * Farklı mapper'lar bu DTO'dan farklı ViewModel'ler üretir.
 */
export interface ProcurementFileDto {
    id: number;
    subject: string;
    procurementNumber?: string;
    documentNumber?: string;
    procurementType: string;
    status: string;
    isLocked: boolean;
    lockReason?: string;
    estimatedCost: number;
    totalAmount?: number;
    budgetYear?: number;
    budgetType?: string;
    contractType?: string;
    deliveryDays?: number;
    unitName?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    permissions?: ProcurementFilePermissionsDto;
}
