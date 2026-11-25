import type { IRepository } from "@worksuite-360/core";
import type { RequirementReport } from "../../domain/requirement/Requirement";

export interface IRequirementRepository extends IRepository<RequirementReport, number> {
    findByReportNumber(reportNumber: string): Promise<RequirementReport | null>;
    findByUnitId(unitId: number): Promise<RequirementReport[]>;
}
