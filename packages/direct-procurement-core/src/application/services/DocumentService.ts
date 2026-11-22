import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import { ProcurementDocument } from "../../domain/approval/Approval";
import type { IApprovalRepository } from "../contracts/IApprovalRepository";

export class DocumentService {
    constructor(private readonly repo: IApprovalRepository) {}

    async freezeSnapshot(
        documentId: number,
        snapshotJson: string,
    ): Promise<Result<void, AppError>> {
        const existing = await this.repo.getById(documentId);
        if (!existing.success) return failure(existing.error);

        try {
            existing.data.saveSnapshot(snapshotJson);
            await this.repo.update(documentId, existing.data);
            return success(undefined);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "DOCUMENT_SNAPSHOT_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getDocument(
        documentId: number,
    ): Promise<Result<ProcurementDocument, AppError>> {
        return this.repo.getById(documentId);
    }
}
