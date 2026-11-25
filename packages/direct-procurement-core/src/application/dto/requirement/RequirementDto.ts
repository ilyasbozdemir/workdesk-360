export interface CreateRequirementDto {
    reportNumber: string;
    title: string;
    justification?: string;
    unitId?: number;
    unitName?: string;
    requestingPersonnelId?: number;
    requestingPersonnelName?: string;
    estimatedBudget?: number;
}

export interface AddRequirementItemDto {
    reportId: number;
    sequenceNumber: number;
    itemName: string;
    itemType: string;
    unit: string;
    quantity: number;
    vatRate?: number;
    estimatedUnitPrice?: number;
}

export interface RequirementDto {
    id: number;
    reportNumber: string;
    title: string;
    status: string;
    estimatedBudget: number;
    itemCount: number;
}
