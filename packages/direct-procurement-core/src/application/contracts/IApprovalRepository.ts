import type { IRepository } from "@worksuite-360/core";
import type { ProcurementDocument } from "../../domain/approval/Approval";

export interface IApprovalRepository extends IRepository<ProcurementDocument, number> {
    findByProcurementFileId(fileId: number): Promise<ProcurementDocument[]>;
    findByStatus(status: string): Promise<ProcurementDocument[]>;
}
