import {
    AppError,
    failure,
    NotFoundError,
    type Result,
    success,
} from "@worksuite-360/core";
import type { FileRepository } from "../application/ports";
import type {
    EnterQuoteCommand,
    EnterQuoteUseCase,
} from "../application/usecases/EnterQuote";
import type { SelectWinnerUseCase } from "../application/usecases/SelectWinner";
import type { ApproveResultUseCase } from "../application/usecases/ApproveResult";
import type {
    ApproveAcceptanceUseCase,
    RecordAcceptanceUseCase,
} from "../application/usecases/Acceptance";
import type { CalculateDeductionsUseCase } from "../application/usecases/CalculateDeductions";
import type { DirectProcurementFile } from "../domain/file/DirectProcurementFile";
import type { WinnerResult } from "../domain/winner/WinnerSelectionStrategy";
import type { AcceptanceLine } from "../domain/file/AcceptanceRecord";
import type { DeductionLine } from "../domain/profile/DeductionRule";

export interface DirectProcurementServiceDeps {
    repo: FileRepository;
    enterQuote: EnterQuoteUseCase;
    selectWinner: SelectWinnerUseCase;
    approveResult: ApproveResultUseCase;
    recordAcceptance: RecordAcceptanceUseCase;
    approveAcceptance: ApproveAcceptanceUseCase;
    calculateDeductions: CalculateDeductionsUseCase;
}

/**
 * DirectProcurementService
 *
 * Doğrudan temin süreçlerini tek bir çatı altında toplayan merkezi uygulama servisidir (Application Service).
 * Hata yakalama, Result<T, AppError> pattern sarmalama ve kullanım senaryolarını koordine eder.
 */
export class DirectProcurementService {
    constructor(private readonly deps: DirectProcurementServiceDeps) {}

    /**
     * Dosya detayını getirir.
     */
    async getFile(
        fileId: number,
    ): Promise<Result<DirectProcurementFile, AppError>> {
        try {
            const file = await this.deps.repo.findById(fileId);
            if (!file) {
                return failure(
                    new NotFoundError({
                        resource: "DirectProcurementFile",
                        resourceId: String(fileId),
                        message: `Doğrudan temin dosyası bulunamadı: #${fileId}`,
                    }),
                );
            }
            return success(file);
        } catch (error) {
            return failure(this.toAppError(error));
        }
    }

    /**
     * İsteklinin kaleme verdiği teklif fiyatını kaydeder.
     */
    async enterQuote(
        command: EnterQuoteCommand,
    ): Promise<Result<void, AppError>> {
        try {
            await this.deps.enterQuote.execute(command);
            return success(undefined);
        } catch (error) {
            return failure(this.toAppError(error));
        }
    }

    /**
     * Dosyada en avantajlı kazanan istekliyi belirler.
     */
    async selectWinner(
        fileId: number,
        at: string = new Date().toISOString(),
    ): Promise<Result<WinnerResult, AppError>> {
        try {
            const result = await this.deps.selectWinner.execute({ fileId, at });
            return success(result);
        } catch (error) {
            return failure(this.toAppError(error));
        }
    }

    /**
     * Karar/sonuç onayını gerçekleştirir.
     */
    async approveResult(
        fileId: number,
        at: string = new Date().toISOString(),
    ): Promise<Result<void, AppError>> {
        try {
            await this.deps.approveResult.execute({ fileId, at });
            return success(undefined);
        } catch (error) {
            return failure(this.toAppError(error));
        }
    }

    /**
     * Muayene kabul tutanağı kaydeder.
     */
    async recordAcceptance(params: {
        fileId: number;
        lines: AcceptanceLine[];
        date?: string;
    }): Promise<Result<number, AppError>> {
        try {
            const date = params.date ?? new Date().toISOString().slice(0, 10);
            const seqNo = await this.deps.recordAcceptance.execute({
                fileId: params.fileId,
                lines: params.lines,
                date,
            });
            return success(seqNo);
        } catch (error) {
            return failure(this.toAppError(error));
        }
    }

    /**
     * Muayene kabul tutanağını onaylar.
     */
    async approveAcceptance(params: {
        fileId: number;
        seqNo: number;
        at?: string;
    }): Promise<Result<void, AppError>> {
        try {
            const at = params.at ?? new Date().toISOString();
            await this.deps.approveAcceptance.execute({
                fileId: params.fileId,
                seqNo: params.seqNo,
                at,
            });
            return success(undefined);
        } catch (error) {
            return failure(this.toAppError(error));
        }
    }

    /**
     * Yasal kesintileri hesaplar.
     */
    async calculateDeductions(
        fileId: number,
        date?: string,
    ): Promise<Result<DeductionLine[], AppError>> {
        try {
            const calcDate = date ?? new Date().toISOString().slice(0, 10);
            const deductions = await this.deps.calculateDeductions.execute({
                fileId,
                date: calcDate,
            });
            return success(deductions);
        } catch (error) {
            return failure(this.toAppError(error));
        }
    }

    private toAppError(error: unknown): AppError {
        if (error instanceof AppError) return error;
        return new AppError({
            code: "PROCUREMENT_SERVICE_ERROR",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
        });
    }
}
