import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import {
    RequirementItem,
    RequirementReport,
} from "../../domain/requirement/Requirement";
import type { IRequirementRepository } from "../contracts/IRequirementRepository";
import type {
    AddRequirementItemDto,
    CreateRequirementDto,
} from "../dto/requirement/RequirementDto";

export class RequirementService {
    constructor(private readonly repo: IRequirementRepository) {}

    async createReport(
        dto: CreateRequirementDto,
    ): Promise<Result<RequirementReport, AppError>> {
        try {
            const nextId = Date.now();
            const report = new RequirementReport({
                id: nextId,
                reportNumber: dto.reportNumber,
                title: dto.title,
                justification: dto.justification,
                unitId: dto.unitId,
                unitName: dto.unitName,
                requestingPersonnelId: dto.requestingPersonnelId,
                requestingPersonnelName: dto.requestingPersonnelName,
                estimatedBudget: dto.estimatedBudget ?? 0,
            });

            return this.repo.create(report);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "REQUIREMENT_CREATE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async addItemToReport(
        dto: AddRequirementItemDto,
    ): Promise<Result<void, AppError>> {
        const existing = await this.repo.getById(dto.reportId);
        if (!existing.success) return failure(existing.error);

        try {
            const item = new RequirementItem({
                id: Date.now(),
                reportId: dto.reportId,
                sequenceNumber: dto.sequenceNumber,
                itemName: dto.itemName,
                itemType: dto.itemType,
                unit: dto.unit,
                quantity: dto.quantity,
                vatRate: dto.vatRate,
                estimatedUnitPrice: dto.estimatedUnitPrice,
            });

            existing.data.addItem(item);
            await this.repo.update(dto.reportId, existing.data);
            return success(undefined);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "REQUIREMENT_ITEM_ADD_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async approveReport(reportId: number): Promise<Result<void, AppError>> {
        const existing = await this.repo.getById(reportId);
        if (!existing.success) return failure(existing.error);

        try {
            existing.data.approve();
            await this.repo.update(reportId, existing.data);
            return success(undefined);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "REQUIREMENT_APPROVE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }
}
