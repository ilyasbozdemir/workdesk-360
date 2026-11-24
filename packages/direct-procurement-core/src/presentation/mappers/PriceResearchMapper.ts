import type { PriceOffer } from "../../domain/price-research/PriceOffer";
import type { PriceOfferDto } from "../../application/dto/price-research/PriceResearchDto";

export class PriceResearchMapper {
    static toOfferDto(entity: PriceOffer): PriceOfferDto {
        return {
            id: entity.id,
            procurementFileId: entity.procurementFileId,
            itemId: entity.itemId,
            supplierId: entity.supplierId,
            unitPrice: entity.unitPrice,
            vatAmount: entity.vatAmount,
            hasOffer: entity.hasOffer,
            createdAt: entity.createdAt ? String(entity.createdAt) : undefined,
            updatedAt: entity.updatedAt ? String(entity.updatedAt) : undefined,
        };
    }
}
