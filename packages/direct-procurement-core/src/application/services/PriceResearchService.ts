import {
    AppError,
    failure,
    type Result,
    success,
} from "@worksuite-360/core";
import { PriceOffer } from "../../domain/price-research/PriceOffer";
import { PriceResearch } from "../../domain/price-research/PriceResearch";
import type { IPriceResearchRepository } from "../contracts/IPriceResearchRepository";

export class PriceResearchService {
    constructor(private readonly repo: IPriceResearchRepository) {}

    async recordOffer(params: {
        procurementFileId: number;
        itemId: number;
        supplierId: number;
        unitPrice: number;
        vatAmount?: number;
    }): Promise<Result<PriceOffer, AppError>> {
        try {
            const nextId = Date.now();
            const offer = new PriceOffer({
                id: nextId,
                procurementFileId: params.procurementFileId,
                itemId: params.itemId,
                supplierId: params.supplierId,
                unitPrice: params.unitPrice,
                vatAmount: params.vatAmount ?? 0,
            });

            return this.repo.create(offer);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PRICE_OFFER_RECORD_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getPriceResearchSummary(
        procurementFileId: number,
    ): Promise<Result<PriceResearch, AppError>> {
        try {
            const offers = await this.repo.findByProcurementFileId(procurementFileId);
            const research = new PriceResearch({
                procurementFileId,
                researchDate: new Date(),
                offers,
            });
            return success(research);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PRICE_RESEARCH_SUMMARY_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }

    async getOffersByFileId(
        procurementFileId: number,
    ): Promise<Result<PriceOffer[], AppError>> {
        try {
            const offers = await this.repo.findByProcurementFileId(procurementFileId);
            return success(offers);
        } catch (error) {
            return failure(
                error instanceof AppError ? error : new AppError({
                    code: "PRICE_OFFERS_GET_ERROR",
                    message: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    }
}
