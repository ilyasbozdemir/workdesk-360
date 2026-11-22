/**
 * PriceOffer Domain Model
 *
 * DATA_TeminKalemTeklif tablosuna karşılık gelen iş modelidir.
 * İstekli firmaların her bir kaleme verdiği teklif birim fiyatları.
 */

export interface PriceOfferProps {
    id: number;
    procurementFileId: number;
    itemId: number;
    supplierId: number;
    unitPrice: number;
    vatAmount?: number;
    hasOffer?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export class PriceOffer {
    private readonly _id: number;
    private _props: PriceOfferProps;

    constructor(props: PriceOfferProps) {
        if (!props.procurementFileId) {
            throw new Error("Procurement file ID is required.");
        }
        if (!props.itemId) {
            throw new Error("Item ID is required.");
        }
        if (!props.supplierId) {
            throw new Error("Supplier ID is required.");
        }

        this._id = props.id;
        this._props = {
            ...props,
            unitPrice: props.unitPrice ?? 0,
            vatAmount: props.vatAmount ?? 0,
            hasOffer: props.hasOffer ?? true,
        };

        this.validate();
    }

    get id(): number {
        return this._id;
    }

    get procurementFileId(): number {
        return this._props.procurementFileId;
    }

    get itemId(): number {
        return this._props.itemId;
    }

    get supplierId(): number {
        return this._props.supplierId;
    }

    get unitPrice(): number {
        return this._props.unitPrice;
    }

    get vatAmount(): number {
        return this._props.vatAmount ?? 0;
    }

    get hasOffer(): boolean {
        return this._props.hasOffer ?? true;
    }

    get totalPrice(): number {
        return this.unitPrice + this.vatAmount;
    }

    /**
     * Teklif birim fiyatını günceller.
     */
    updatePrice(unitPrice: number, vatAmount: number = 0): void {
        if (unitPrice < 0) {
            throw new Error("Unit price cannot be negative.");
        }
        if (vatAmount < 0) {
            throw new Error("VAT amount cannot be negative.");
        }

        this._props.unitPrice = unitPrice;
        this._props.vatAmount = vatAmount;
        this._props.hasOffer = true;
    }

    /**
     * Teklifi geri çeker / teklif verilmedi olarak işaretler.
     */
    revokeOffer(): void {
        this._props.hasOffer = false;
        this._props.unitPrice = 0;
        this._props.vatAmount = 0;
    }

    private validate(): void {
        if (this._props.unitPrice < 0) {
            throw new Error("Unit price cannot be negative.");
        }
        if (this._props.vatAmount !== undefined && this._props.vatAmount < 0) {
            throw new Error("VAT amount cannot be negative.");
        }
    }
}
