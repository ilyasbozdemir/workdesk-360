import type { IRepository } from "@worksuite-360/core";
import type { ProcurementFile } from "../../domain/procurement-file/ProcurementFile";

export interface IProcurementFileRepository extends IRepository<ProcurementFile, number> {
    findByNumber(procurementNumber: string): Promise<ProcurementFile | null>;
    findByYear(year: number): Promise<ProcurementFile[]>;
    findActiveFiles(): Promise<ProcurementFile[]>;
}
