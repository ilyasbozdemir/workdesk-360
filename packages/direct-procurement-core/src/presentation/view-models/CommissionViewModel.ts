import type { CommissionMemberDto } from "../../application/dto/commission/CommissionDto";

export interface CommissionMemberView {
    id: number | null;
    fullName: string;
    title: string;
    duty: string; // Başkan | Üye
    role: string; // Asil | Yedek
    commissionType: string;
    unitName: string;
    isChairman: boolean;
}

export class CommissionViewModel {
    static toMemberView(dto: CommissionMemberDto): CommissionMemberView {
        const isChairman = (dto.duty || "").toLowerCase().includes("başkan");
        return {
            id: dto.id,
            fullName: dto.fullName,
            title: dto.title || "Personel",
            duty: dto.duty || "Üye",
            role: dto.role || "Asil",
            commissionType: dto.commissionType || "Piyasa Fiyat Araştırma Komisyonu",
            unitName: dto.unitName || "—",
            isChairman,
        };
    }

    static toMemberList(dtos: CommissionMemberDto[]): CommissionMemberView[] {
        return dtos.map(this.toMemberView);
    }
}
