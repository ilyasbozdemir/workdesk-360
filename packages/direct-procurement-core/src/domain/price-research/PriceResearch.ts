/**
 * PriceResearch Aggregate
 *
 * Piyasa Fiyat Araştırması sürecinin aggregate modelidir.
 * 4734 Sayılı Kamu İhale Kanunu Madde 22 ve Doğrudan Temin Tebliği (40666)
 * kurallarına uygun olarak tekliflerin toplanması, karşılaştırılması ve
 * en avantajlı teklifin tespiti süreçlerini yönetir.
 */

import { PriceOffer } from "./PriceOffer";

export interface PriceResearchProps {
    procurementFileId: number;
    researchDate: Date;
    offers: PriceOffer[];
    isCompleted?: boolean;
    notes?: string;
}

export class PriceResearch {
    private readonly _procurementFileId: number;
    private _researchDate: Date;
    private _offers: PriceOffer[];
    private _isCompleted: boolean;
    private _notes?: string;

    constructor(props: PriceResearchProps) {
        if (!props.procurementFileId) {
            throw new Error("Procurement file ID is required.");
        }

        this._procurementFileId = props.procurementFileId;
        this._researchDate = props.researchDate;
        this._offers = [...props.offers];
        this._isCompleted = props.isCompleted ?? false;
        this._notes = props.notes;
    }

    get procurementFileId(): number {
        return this._procurementFileId;
    }

    get researchDate(): Date {
        return this._researchDate;
    }

    get offers(): readonly PriceOffer[] {
        return this._offers;
    }

    get isCompleted(): boolean {
        return this._isCompleted;
    }

    get notes(): string | undefined {
        return this._notes;
    }

    /**
     * Araştırmaya yeni bir kalem teklifi ekler.
     */
    addOffer(offer: PriceOffer): void {
        if (this._isCompleted) {
            throw new Error("Cannot add offer to a completed price research.");
        }
        this._offers.push(offer);
    }

    /**
     * Belirli bir kalem için en düşük geçerli teklifi bulur.
     */
    getLowestOfferForItem(itemId: number): PriceOffer | null {
        const itemOffers = this._offers.filter(
            (o) => o.itemId === itemId && o.hasOffer && o.unitPrice > 0,
        );
        if (itemOffers.length === 0) return null;

        return itemOffers.reduce((lowest, current) =>
            current.unitPrice < lowest.unitPrice ? current : lowest,
        );
    }

    /**
     * Belirli bir isteklinin tüm kalemler için toplam teklif tutarını hesaplar.
     */
    getTotalOfferForSupplier(supplierId: number): number {
        return this._offers
            .filter((o) => o.supplierId === supplierId && o.hasOffer)
            .reduce((sum, o) => sum + o.unitPrice, 0);
    }

    /**
     * Araştırmayı tamamlandı olarak işaretler.
     */
    complete(notes?: string): void {
        this._isCompleted = true;
        if (notes !== undefined) {
            this._notes = notes;
        }
    }
}
