export interface PriceOfferItemView {
    id: number;
    itemId: number;
    supplierId: number;
    supplierName?: string;
    unitPrice: number;
    formattedUnitPrice: string;
    vatAmount: number;
    hasOffer: boolean;
    isLowestOffer?: boolean;
}

export class PriceResearchViewModel {
    static toOfferView(offer: {
        id: number;
        itemId: number;
        supplierId: number;
        supplierName?: string;
        unitPrice: number;
        vatAmount?: number;
        hasOffer?: boolean;
    }, isLowest = false): PriceOfferItemView {
        return {
            id: offer.id,
            itemId: offer.itemId,
            supplierId: offer.supplierId,
            supplierName: offer.supplierName,
            unitPrice: offer.unitPrice,
            formattedUnitPrice: new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
            }).format(offer.unitPrice),
            vatAmount: offer.vatAmount ?? 0,
            hasOffer: offer.hasOffer !== false,
            isLowestOffer: isLowest,
        };
    }
}
