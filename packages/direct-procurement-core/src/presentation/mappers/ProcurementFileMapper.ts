import type { ProcurementFile } from "../../domain/procurement-file/ProcurementFile";
import type { ProcurementFileDto } from "../../application/dto/procurement-file/ProcurementFileDto";

export class ProcurementFileMapper {
    static toDto(entity: ProcurementFile): ProcurementFileDto {
        return {
            id: entity.id,
            subject: entity.subject,
            procurementNumber: entity.procurementNumber,
            documentNumber: entity.documentNumber,
            procurementType: entity.procurementType,
            status: entity.status,
            isLocked: entity.isLocked,
            estimatedCost: entity.estimatedCost,
            budgetYear: entity.budgetYear,
            unitName: entity.unitName,
        };
    }
}
