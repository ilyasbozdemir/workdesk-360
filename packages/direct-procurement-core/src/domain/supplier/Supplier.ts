/**
 * Supplier & ProcurementSupplier Domain Model
 *
 * TANIM_Firma ve DATA_TeminFirma tablolarına karşılık gelen iş modelleridir.
 */

export interface SupplierProps {
    id: number;
    title: string;
    taxNumber?: string | null;
    taxOffice?: string | null;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    postalCode?: string | null;
    country?: string | null;
    isActive?: boolean;
    isBlacklisted?: boolean;
    blacklistReason?: string | null;
    experienceScore?: number;
    qualityScore?: number;
    paymentDiscipline?: number;
    notes?: string | null;
}

/**
 * Tedarikçi / Firma Ana Kartı (TANIM_Firma)
 */
export class Supplier {
    private readonly _id: number;
    private _props: SupplierProps;

    constructor(props: SupplierProps) {
        if (!Number.isInteger(props.id) || props.id <= 0) {
            throw new Error("Supplier ID must be a positive integer.");
        }
        if (!props.title.trim()) {
            throw new Error("Supplier title cannot be empty.");
        }

        this._id = props.id;
        this._props = {
            ...props,
            title: props.title.trim(),
            isActive: props.isActive ?? true,
            isBlacklisted: props.isBlacklisted ?? false,
            experienceScore: props.experienceScore ?? 0,
            qualityScore: props.qualityScore ?? 0,
            paymentDiscipline: props.paymentDiscipline ?? 1,
        };
    }

    get id(): number {
        return this._id;
    }

    get title(): string {
        return this._props.title;
    }

    get taxNumber(): string | null | undefined {
        return this._props.taxNumber;
    }

    get taxOffice(): string | null | undefined {
        return this._props.taxOffice;
    }

    get contactPerson(): string | null | undefined {
        return this._props.contactPerson;
    }

    get phone(): string | null | undefined {
        return this._props.phone;
    }

    get email(): string | null | undefined {
        return this._props.email;
    }

    get address(): string | null | undefined {
        return this._props.address;
    }

    get city(): string | null | undefined {
        return this._props.city;
    }

    get district(): string | null | undefined {
        return this._props.district;
    }

    get isActive(): boolean {
        return this._props.isActive ?? true;
    }

    get isBlacklisted(): boolean {
        return this._props.isBlacklisted ?? false;
    }

    get blacklistReason(): string | null | undefined {
        return this._props.blacklistReason;
    }

    get experienceScore(): number {
        return this._props.experienceScore ?? 0;
    }

    get qualityScore(): number {
        return this._props.qualityScore ?? 0;
    }

    get paymentDiscipline(): number {
        return this._props.paymentDiscipline ?? 1;
    }

    updateContact(info: {
        contactPerson?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        district?: string;
    }): void {
        this._props = { ...this._props, ...info };
    }

    addToBlacklist(reason: string): void {
        this._props.isBlacklisted = true;
        this._props.blacklistReason = reason;
    }

    removeFromBlacklist(): void {
        this._props.isBlacklisted = false;
        this._props.blacklistReason = null;
    }
}

/**
 * Dosyaya Davet Edilen / Teklif Veren İstekli (DATA_TeminFirma)
 */
export interface ProcurementSupplierProps {
    id: number;
    procurementFileId: number;
    supplierId: number;
    title: string;
    taxNumber?: string | null;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    isInvited?: boolean;
    hasOffered?: boolean;
    totalOfferAmount?: number | null;
    isWinner?: boolean;
    offerStatus?: string;
    invitationDate?: Date | null;
    offerDate?: Date | null;
    deliveryTime?: string | null;
    currency?: string;
    isActive?: boolean;
    prohibitionStatus?: string;
    prohibitionDocument?: string | null;
}

export class ProcurementSupplier {
    private readonly _id: number;
    private _props: ProcurementSupplierProps;

    constructor(props: ProcurementSupplierProps) {
        if (!props.procurementFileId) {
            throw new Error("Procurement file ID is required.");
        }
        if (!props.supplierId) {
            throw new Error("Supplier ID is required.");
        }
        if (!props.title.trim()) {
            throw new Error("Supplier title cannot be empty.");
        }

        this._id = props.id;
        this._props = {
            ...props,
            title: props.title.trim(),
            isInvited: props.isInvited ?? true,
            hasOffered: props.hasOffered ?? false,
            isWinner: props.isWinner ?? false,
            offerStatus: props.offerStatus ?? "Davet Edildi",
            currency: props.currency ?? "TRY",
            isActive: props.isActive ?? true,
            prohibitionStatus: props.prohibitionStatus ?? "Sorgulanmadı",
        };
    }

    get id(): number {
        return this._id;
    }

    get procurementFileId(): number {
        return this._props.procurementFileId;
    }

    get supplierId(): number {
        return this._props.supplierId;
    }

    get title(): string {
        return this._props.title;
    }

    get taxNumber(): string | null | undefined {
        return this._props.taxNumber;
    }

    get contactPerson(): string | null | undefined {
        return this._props.contactPerson;
    }

    get phone(): string | null | undefined {
        return this._props.phone;
    }

    get email(): string | null | undefined {
        return this._props.email;
    }

    get isInvited(): boolean {
        return this._props.isInvited ?? true;
    }

    get hasOffered(): boolean {
        return this._props.hasOffered ?? false;
    }

    get totalOfferAmount(): number | null | undefined {
        return this._props.totalOfferAmount;
    }

    get isWinner(): boolean {
        return this._props.isWinner ?? false;
    }

    get offerStatus(): string {
        return this._props.offerStatus ?? "Davet Edildi";
    }

    get invitationDate(): Date | null | undefined {
        return this._props.invitationDate;
    }

    get offerDate(): Date | null | undefined {
        return this._props.offerDate;
    }

    get deliveryTime(): string | null | undefined {
        return this._props.deliveryTime;
    }

    get currency(): string {
        return this._props.currency ?? "TRY";
    }

    get prohibitionStatus(): string {
        return this._props.prohibitionStatus ?? "Sorgulanmadı";
    }

    /**
     * Teklifi kaydeder.
     */
    submitOffer(totalAmount: number, offerDate: Date = new Date()): void {
        if (totalAmount < 0) {
            throw new Error("Offer amount cannot be negative.");
        }
        this._props.hasOffered = true;
        this._props.totalOfferAmount = totalAmount;
        this._props.offerDate = offerDate;
        this._props.offerStatus = "Teklif Verdi";
    }

    /**
     * İhaleyi kazanan olarak işaretler.
     */
    markWinner(): void {
        if (!this.hasOffered) {
            throw new Error("Cannot mark winner a supplier without an offer.");
        }
        this._props.isWinner = true;
    }

    /**
     * Kazanan durumunu iptal eder.
     */
    unmarkWinner(): void {
        this._props.isWinner = false;
    }

    /**
     * Yasaklılık durumunu günceller.
     */
    updateProhibitionStatus(status: string, documentName?: string): void {
        this._props.prohibitionStatus = status;
        if (documentName !== undefined) {
            this._props.prohibitionDocument = documentName;
        }
    }
}
