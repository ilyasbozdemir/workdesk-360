/**
 * ProcurementFile
 *
 * Doğrudan temin dosyasının domain modelidir.
 *
 * DATA_TeminDosyasi tablosundaki iş alanlarını temsil eder.
 * Veritabanı kolon isimlerinden ve SQLite altyapısından bağımsızdır.
 *
 * Sorumlulukları:
 * - Doğrudan temin dosyasının temel bilgilerini taşımak.
 * - Dosyanın bütçe ve alım bilgilerini temsil etmek.
 * - İdari ve mali bilgileri yönetmek.
 * - Dosyanın süreç durumunu kontrol etmek.
 * - Dosyanın kilit ve tamamlanma davranışlarını yönetmek.
 *
 * Kullanım örneği:
 *
 * const file = new ProcurementFile({
 *     id: 1,
 *     subject: "Kırtasiye Malzemesi Alımı",
 *     procurementNumber: "2026/DT-001",
 *     procurementType: "mal",
 * });
 *
 * file.complete();
 */

import { ProcurementFileStatus } from "./ProcurementFileStatus";

/**
 * Doğrudan temin dosyasının alım türü.
 */
export type ProcurementFileType =
    | "mal"
    | "hizmet"
    | "yapim_isi"
    | "danismanlik";

/**
 * Bütçe türü.
 */
export type BudgetType =
    | "genel_butce"
    | "doner_sermaye"
    | "diger";

/**
 * Teklif ve sözleşme türü.
 */
export type ContractType =
    | "birim_fiyat"
    | "goturu_bedel";

/**
 * Kayıt kaynağı.
 */
export type ProcurementFileSource =
    | "yeni"
    | "eski_sistem"
    | "ice_aktarim";

/**
 * Doğrudan temin dosyasının temel bilgileri.
 */
export interface ProcurementFileProps {
    id: number;

    procurementNumber?: string;
    documentNumber?: string;

    openingDate?: Date;
    budgetYear?: number;
    budgetType?: BudgetType;

    subject: string;
    description?: string;

    unitId?: number;
    unitName?: string;

    additionalHeaderLine?: string;
    showUnitInHeader?: boolean;

    presentedAuthority?: string;
    placeOfNeed?: string;

    // Mali bilgiler
    eBudget?: string;
    say2000i?: string;
    functionalCode?: string;
    accountingUnit?: string;
    spendingUnit?: string;
    financingCode?: string;
    economicCode?: string;
    budgetCode?: string;

    // Alım bilgileri
    procurementType: ProcurementFileType;
    procurementMethod?: string;
    tenderMethod?: string;
    supplyMethod?: string;

    contractType?: ContractType;
    hasSubcontractor?: boolean;
    allowsPartialOffers?: boolean;

    investmentProjectNumber?: string;
    projectId?: number;
    projectName?: string;

    tags?: string[];
    hasAdvancePayment?: boolean;
    isMultiYear?: boolean;
    requiresContract?: boolean;

    commissionSeedStatus?: number;
    workDescriptionItems?: string[];

    // Yaklaşık maliyet
    estimatedCostCalculation?: string;
    estimatedCostIncludesVat?: boolean;
    vatRate?: string;
    calculationBasis?: string;
    commissionOpinion?: string;
    isMedicalDeviceProcurement?: boolean;

    // Süreç ve kişiler
    contactPersonId?: number;
    offerDeadline?: Date;
    deliveryDate?: Date;
    deliveryDays?: number;

    estimatedCost?: number;
    stampDutyDeduction?: number;
    decisionStampDeduction?: number;
    vatWithholdingDeduction?: number;
    netPayment?: number;

    procurementDate?: Date;
    winningCompanyId?: number;

    approvingPersonnelId?: number;
    preparingPersonnelId?: number;
    requestingPersonnelId?: number;
    presentingPersonnelId?: number;

    stageId?: number;
    legislationId?: number;
    processTemplateId?: number;

    orderedDocuments?: string[];
    starredDocuments?: string[];
    skippedDocuments?: string[];
    templatePreferences?: Record<string, unknown>;

    notes?: string;
    repetitionNumber?: number;

    status?: ProcurementFileStatus;

    ekapNumber?: string;
    isEkapSent?: boolean;

    isLocked?: boolean;
    lockReason?: string;

    source?: ProcurementFileSource;
}

/**
 * Doğrudan temin dosyasının domain modeli.
 */
export class ProcurementFile {
    private readonly _id: number;
    private _props: ProcurementFileProps;

    constructor(props: ProcurementFileProps) {
        if (!Number.isInteger(props.id) || props.id <= 0) {
            throw new Error("Procurement file ID must be a positive integer.");
        }

        if (!props.subject.trim()) {
            throw new Error("Procurement file subject cannot be empty.");
        }

        this._id = props.id;

        this._props = {
            ...props,
            subject: props.subject.trim(),
            status: props.status ?? ProcurementFileStatus.InProgress,
            showUnitInHeader: props.showUnitInHeader ?? true,
            deliveryDays: props.deliveryDays ?? 7,
            estimatedCost: props.estimatedCost ?? 0,
            stampDutyDeduction: props.stampDutyDeduction ?? 0,
            decisionStampDeduction: props.decisionStampDeduction ?? 0,
            vatWithholdingDeduction: props.vatWithholdingDeduction ?? 0,
            netPayment: props.netPayment ?? 0,
            repetitionNumber: props.repetitionNumber ?? 1,
            isLocked: props.isLocked ?? false,
            isEkapSent: props.isEkapSent ?? false,
            hasSubcontractor: props.hasSubcontractor ?? false,
            allowsPartialOffers: props.allowsPartialOffers ?? false,
            hasAdvancePayment: props.hasAdvancePayment ?? false,
            isMultiYear: props.isMultiYear ?? false,
            requiresContract: props.requiresContract ?? false,
            estimatedCostIncludesVat: props.estimatedCostIncludesVat ?? false,
            isMedicalDeviceProcurement: props.isMedicalDeviceProcurement ??
                false,
            tags: [...(props.tags ?? [])],
            workDescriptionItems: [...(props.workDescriptionItems ?? [])],
            orderedDocuments: [...(props.orderedDocuments ?? [])],
            starredDocuments: [...(props.starredDocuments ?? [])],
            skippedDocuments: [...(props.skippedDocuments ?? [])],
            templatePreferences: { ...(props.templatePreferences ?? {}) },
        };

        this.validate();
    }

    get id(): number {
        return this._id;
    }

    get subject(): string {
        return this._props.subject;
    }

    get procurementNumber(): string | undefined {
        return this._props.procurementNumber;
    }

    get procurementType(): ProcurementFileType {
        return this._props.procurementType;
    }

    get status(): ProcurementFileStatus {
        return this._props.status!;
    }

    get isLocked(): boolean {
        return this._props.isLocked!;
    }

    get properties(): Readonly<ProcurementFileProps> {
        return { ...this._props };
    }

    /**
     * Dosya konusunu günceller.
     */
    changeSubject(subject: string): void {
        this.ensureEditable();

        if (!subject.trim()) {
            throw new Error("Procurement file subject cannot be empty.");
        }

        this._props.subject = subject.trim();
    }

    /**
     * Dosyanın durumunu tamamlandı olarak değiştirir.
     */
    complete(): void {
        this.ensureEditable();

        if (this.status !== ProcurementFileStatus.InProgress) {
            throw new Error("Only in-progress files can be completed.");
        }

        this._props.status = ProcurementFileStatus.Completed;
    }

    /**
     * Dosyayı iptal eder.
     */
    cancel(): void {
        this.ensureEditable();

        if (
            this.status === ProcurementFileStatus.Completed ||
            this.status === ProcurementFileStatus.Cancelled
        ) {
            throw new Error(
                "Completed or cancelled files cannot be cancelled.",
            );
        }

        this._props.status = ProcurementFileStatus.Cancelled;
    }

    /**
     * Dosyayı kilitler.
     */
    lock(reason?: string): void {
        if (this.isLocked) {
            throw new Error("Procurement file is already locked.");
        }

        this._props.isLocked = true;
        this._props.lockReason = reason;
    }

    /**
     * Dosyanın kilidini kaldırır.
     */
    unlock(): void {
        if (!this.isLocked) {
            throw new Error("Procurement file is not locked.");
        }

        this._props.isLocked = false;
        this._props.lockReason = undefined;
    }

    /**
     * Dosyanın düzenlenebilir olup olmadığını kontrol eder.
     */
    private ensureEditable(): void {
        if (this.isLocked) {
            throw new Error("Locked procurement files cannot be modified.");
        }

        if (
            this.status === ProcurementFileStatus.Completed ||
            this.status === ProcurementFileStatus.Cancelled
        ) {
            throw new Error("Completed or cancelled files cannot be modified.");
        }
    }

    /**
     * Dosya alanlarının temel doğrulamasını yapar.
     */
    private validate(): void {
        const { deliveryDays, budgetYear, estimatedCost, repetitionNumber } =
            this._props;

        if (deliveryDays !== undefined && deliveryDays < 0) {
            throw new Error("Delivery days cannot be negative.");
        }

        if (
            budgetYear !== undefined &&
            (!Number.isInteger(budgetYear) || budgetYear < 1900)
        ) {
            throw new Error("Budget year is invalid.");
        }

        if (estimatedCost !== undefined && estimatedCost < 0) {
            throw new Error("Estimated cost cannot be negative.");
        }

        if (
            repetitionNumber !== undefined &&
            (!Number.isInteger(repetitionNumber) || repetitionNumber < 1)
        ) {
            throw new Error("Repetition number must be at least 1.");
        }
    }
}
