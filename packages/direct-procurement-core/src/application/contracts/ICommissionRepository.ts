import type { IRepository } from "@worksuite-360/core";
import type { Commission } from "../../domain/commission/Commission";
import type { ProcurementCommissionMember } from "../../domain/commission/ProcurementCommission";

export interface ICommissionRepository extends IRepository<Commission, number> {
    findMembersByProcurementFileId(fileId: number): Promise<ProcurementCommissionMember[]>;
    saveMember(member: ProcurementCommissionMember): Promise<void>;
    removeMember(memberId: number): Promise<void>;
}
