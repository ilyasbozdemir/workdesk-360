import type { ProcurementCommissionMember } from "../../domain/commission/ProcurementCommission";
import type { CommissionMemberDto } from "../../application/dto/commission/CommissionDto";

export class CommissionMapper {
    static toMemberDto(entity: ProcurementCommissionMember): CommissionMemberDto {
        return {
            id: entity.id,
            fullName: entity.fullName,
            title: entity.title,
            duty: entity.duty,
            role: entity.role,
            commissionType: entity.commissionType,
            unitName: entity.unitName,
        };
    }
}
