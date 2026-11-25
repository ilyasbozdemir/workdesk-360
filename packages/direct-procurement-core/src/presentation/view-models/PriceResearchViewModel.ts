import type { PriceOfferDto } from "../../application/dto/price-research/PriceResearchDto";

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
    static toOfferView(dto: PriceOfferDto, isLowest = false): PriceOfferItemView {
        return {
            id: dto.id,
            itemId: dto.itemId,
            supplierId: dto.supplierId,
            supplierName: dto.supplierName,
            unitPrice: dto.unitPrice,
            formattedUnitPrice: new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
            }).format(dto.unitPrice),
            vatAmount: dto.vatAmount ?? 0,
            hasOffer: dto.hasOffer !== false,
            isLowestOffer: isLowest,
        };
    }

    static toOfferList(dtos: PriceOfferDto[], lowestOfferId?: number): PriceOfferItemView[] {
        return dtos.map((dto) => this.toOfferView(dto, dto.id === lowestOfferId));
    }
}
