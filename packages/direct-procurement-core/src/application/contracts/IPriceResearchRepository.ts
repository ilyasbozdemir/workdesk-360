import type { IRepository } from "@worksuite-360/core";
import type { PriceOffer } from "../../domain/price-research/PriceOffer";

export interface IPriceResearchRepository extends IRepository<PriceOffer, number> {
    findByProcurementFileId(fileId: number): Promise<PriceOffer[]>;
    findByItemId(itemId: number): Promise<PriceOffer[]>;
    findBySupplierId(supplierId: number): Promise<PriceOffer[]>;
}
