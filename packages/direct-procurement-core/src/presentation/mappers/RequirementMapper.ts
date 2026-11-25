import type { RequirementReport } from "../../domain/requirement/Requirement";
import type { RequirementDto } from "../../application/dto/requirement/RequirementDto";

export class RequirementMapper {
    static toDto(entity: RequirementReport): RequirementDto {
        return {
            id: entity.id,
            reportNumber: entity.reportNumber,
            title: entity.title,
            status: entity.status,
            estimatedBudget: entity.estimatedBudget,
            itemCount: entity.items.length,
        };
    }
}
