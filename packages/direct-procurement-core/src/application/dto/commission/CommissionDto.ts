export interface CreateCommissionDto {
    name: string;
    type?: string;
    description?: string;
}

export interface AssignCommissionMemberDto {
    procurementFileId: number;
    commissionId: number;
    personnelId: number;
    fullName: string;
    title?: string;
    duty?: string; // Başkan | Üye
    role?: string; // Asil | Yedek
    commissionType?: string;
    unitId?: number;
    unitName?: string;
}

export interface CommissionMemberDto {
    id: number | null;
    fullName: string;
    title?: string | null;
    duty?: string | null;
    role?: string | null;
    commissionType?: string | null;
    unitName?: string | null;
}
