import {
    AppError,
    failure,
    NotFoundError,
    type Result,
    success,
} from "@worksuite-360/core";
import { ProcurementFile } from "../../domain/procurement-file/ProcurementFile";
import type { IProcurementFileRepository } from "../contracts/IProcurementFileRepository";
import type {
    CreateProcurementFileDto,
    UpdateProcurementFileDto,
} from "../dto/procurement-file/ProcurementFileDto";

export class ProcurementFileService {
    constructor(private readonly repo: IProcurementFileRepository) {}

    async createFile(
        dto: CreateProcurementFileDto,
    ): Promise<Result<ProcurementFile, AppError>> {
        try {
            const nextId = Date.now(); // or auto-increment handled by persistence
            const file = new ProcurementFile({
                id: nextId,
                subject: dto.subject,
                procurementType: dto.procurementType,
                procurementNumber: dto.procurementNumber,
                documentNumber: dto.documentNumber,
                budgetYear: dto.budgetYear,
                budgetType: dto.budgetType,
                unitId: dto.unitId,
                unitName: dto.unitName,
                contractType: dto.contractType,
                estimatedCost: dto.estimatedCost ?? 0,
            });

            const saved = await this.repo.create(file);
            return saved;
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PROCUREMENT_FILE_CREATE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getFileById(id: number): Promise<Result<ProcurementFile, AppError>> {
        return this.repo.getById(id);
    }

    async updateFile(
        id: number,
        dto: UpdateProcurementFileDto,
    ): Promise<Result<ProcurementFile, AppError>> {
        const existing = await this.repo.getById(id);
        if (!existing.success) return existing;

        try {
            const file = existing.data;
            if (dto.subject) file.changeSubject(dto.subject);
            if (dto.unitId || dto.unitName) {
                file.updateAdministrativeInfo({
                    unitId: dto.unitId,
                    unitName: dto.unitName,
                });
            }
            if (dto.budgetCode) {
                file.updateFinancialCodes({ budgetCode: dto.budgetCode });
            }
            if (dto.estimatedCost !== undefined) {
                file.updateEstimatedCost(dto.estimatedCost);
            }
            if (dto.deliveryDays !== undefined) {
                file.updateDates({ deliveryDays: dto.deliveryDays });
            }

            return this.repo.update(id, file);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PROCUREMENT_FILE_UPDATE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async completeFile(id: number): Promise<Result<void, AppError>> {
        const existing = await this.repo.getById(id);
        if (!existing.success) return failure(existing.error);

        try {
            existing.data.complete();
            await this.repo.update(id, existing.data);
            return success(undefined);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PROCUREMENT_FILE_COMPLETE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async lockFile(id: number, reason?: string): Promise<Result<void, AppError>> {
        const existing = await this.repo.getById(id);
        if (!existing.success) return failure(existing.error);

        try {
            existing.data.lock(reason);
            await this.repo.update(id, existing.data);
            return success(undefined);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PROCUREMENT_FILE_LOCK_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }
}
