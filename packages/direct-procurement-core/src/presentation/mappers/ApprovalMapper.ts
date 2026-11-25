import type { ProcurementDocument } from "../../domain/approval/Approval";
import type { ApprovalDto } from "../../application/dto/approval/ApprovalDto";

export class ApprovalMapper {
    static toDto(entity: ProcurementDocument): ApprovalDto {
        return {
            id: entity.id,
            procurementFileId: entity.procurementFileId,
            documentName: entity.documentName,
            isSigned: entity.isSigned,
            status: entity.status,
            signedFilePath: entity.signedFilePath,
        };
    }
}
