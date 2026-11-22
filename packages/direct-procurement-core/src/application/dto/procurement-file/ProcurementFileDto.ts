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

export interface ProcurementFileDto {
    id: number;
    subject: string;
    procurementNumber?: string;
    documentNumber?: string;
    procurementType: string;
    status: string;
    isLocked: boolean;
    estimatedCost: number;
    budgetYear?: number;
    unitName?: string;
}
