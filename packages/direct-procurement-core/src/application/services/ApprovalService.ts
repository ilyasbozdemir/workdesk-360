import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import { ProcurementDocument } from "../../domain/approval/Approval";
import type { IApprovalRepository } from "../contracts/IApprovalRepository";
import type {
    CreateApprovalDto,
    SignApprovalDto,
} from "../dto/approval/ApprovalDto";

export class ApprovalService {
    constructor(private readonly repo: IApprovalRepository) {}

    async createApprovalDocument(
        dto: CreateApprovalDto,
    ): Promise<Result<ProcurementDocument, AppError>> {
        try {
            const nextId = Date.now();
            const doc = new ProcurementDocument({
                id: nextId,
                procurementFileId: dto.procurementFileId,
                documentName: dto.documentName,
                templateId: dto.templateId,
                documentDate: dto.documentDate ?? new Date().toISOString().slice(0, 10),
            });

            return this.repo.create(doc);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "APPROVAL_CREATE_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async signDocument(
        dto: SignApprovalDto,
    ): Promise<Result<void, AppError>> {
        const existing = await this.repo.getById(dto.documentId);
        if (!existing.success) return failure(existing.error);

        try {
            existing.data.markSigned(dto.signedFilePath);
            await this.repo.update(dto.documentId, existing.data);
            return success(undefined);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "APPROVAL_SIGN_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getDocumentsForFile(
        fileId: number,
    ): Promise<Result<ProcurementDocument[], AppError>> {
        try {
            const docs = await this.repo.findByProcurementFileId(fileId);
            return success(docs);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "APPROVAL_FETCH_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }
}
