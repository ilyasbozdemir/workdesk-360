export interface PriceOfferDto {
    id: number;
    procurementFileId?: number;
    itemId: number;
    supplierId: number;
    supplierName?: string;
    unitPrice: number;
    vatAmount?: number;
    hasOffer?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface PriceResearchSummaryDto {
    procurementFileId: number;
    totalOffersCount: number;
    lowestOfferTotal: number;
    offers: PriceOfferDto[];
}
