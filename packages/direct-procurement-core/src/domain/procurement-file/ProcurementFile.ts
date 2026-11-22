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
 * DATA_TeminDosyasi tablosuyla tam uyumlu alan seti.
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
    tenderType?: string;
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
    isDeleted?: boolean;
    transferGroupId?: string;
    sourceRecordId?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

/**
 * Doğrudan temin dosyasının domain modeli (Aggregate Root).
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
            tenderType: props.tenderType ?? "Doğrudan Temin",
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
            isDeleted: props.isDeleted ?? false,
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

    // ─── Temel Getters ────────────────────────────────────────────────────────
    get id(): number {
        return this._id;
    }

    get subject(): string {
        return this._props.subject;
    }

    get procurementNumber(): string | undefined {
        return this._props.procurementNumber;
    }

    get documentNumber(): string | undefined {
        return this._props.documentNumber;
    }

    get openingDate(): Date | undefined {
        return this._props.openingDate;
    }

    get budgetYear(): number | undefined {
        return this._props.budgetYear;
    }

    get budgetType(): BudgetType | undefined {
        return this._props.budgetType;
    }

    get description(): string | undefined {
        return this._props.description;
    }

    // ─── İdari Alanlar ────────────────────────────────────────────────────────
    get unitId(): number | undefined {
        return this._props.unitId;
    }

    get unitName(): string | undefined {
        return this._props.unitName;
    }

    get additionalHeaderLine(): string | undefined {
        return this._props.additionalHeaderLine;
    }

    get showUnitInHeader(): boolean {
        return this._props.showUnitInHeader ?? true;
    }

    get presentedAuthority(): string | undefined {
        return this._props.presentedAuthority;
    }

    get placeOfNeed(): string | undefined {
        return this._props.placeOfNeed;
    }

    // ─── Mali Kodlar ──────────────────────────────────────────────────────────
    get eBudget(): string | undefined {
        return this._props.eBudget;
    }

    get say2000i(): string | undefined {
        return this._props.say2000i;
    }

    get functionalCode(): string | undefined {
        return this._props.functionalCode;
    }

    get accountingUnit(): string | undefined {
        return this._props.accountingUnit;
    }

    get spendingUnit(): string | undefined {
        return this._props.spendingUnit;
    }

    get financingCode(): string | undefined {
        return this._props.financingCode;
    }

    get economicCode(): string | undefined {
        return this._props.economicCode;
    }

    get budgetCode(): string | undefined {
        return this._props.budgetCode;
    }

    // ─── Alım ve İhale Bilgileri ─────────────────────────────────────────────
    get procurementType(): ProcurementFileType {
        return this._props.procurementType;
    }

    get tenderType(): string {
        return this._props.tenderType ?? "Doğrudan Temin";
    }

    get procurementMethod(): string | undefined {
        return this._props.procurementMethod;
    }

    get tenderMethod(): string | undefined {
        return this._props.tenderMethod;
    }

    get supplyMethod(): string | undefined {
        return this._props.supplyMethod;
    }

    get contractType(): ContractType | undefined {
        return this._props.contractType;
    }

    get hasSubcontractor(): boolean {
        return this._props.hasSubcontractor ?? false;
    }

    get allowsPartialOffers(): boolean {
        return this._props.allowsPartialOffers ?? false;
    }

    get investmentProjectNumber(): string | undefined {
        return this._props.investmentProjectNumber;
    }

    get projectId(): number | undefined {
        return this._props.projectId;
    }

    get projectName(): string | undefined {
        return this._props.projectName;
    }

    get tags(): readonly string[] {
        return this._props.tags ?? [];
    }

    get hasAdvancePayment(): boolean {
        return this._props.hasAdvancePayment ?? false;
    }

    get isMultiYear(): boolean {
        return this._props.isMultiYear ?? false;
    }

    get requiresContract(): boolean {
        return this._props.requiresContract ?? false;
    }

    get commissionSeedStatus(): number | undefined {
        return this._props.commissionSeedStatus;
    }

    get workDescriptionItems(): readonly string[] {
        return this._props.workDescriptionItems ?? [];
    }

    // ─── Yaklaşık Maliyet & Hesaplamalar ─────────────────────────────────────
    get estimatedCostCalculation(): string | undefined {
        return this._props.estimatedCostCalculation;
    }

    get estimatedCostIncludesVat(): boolean {
        return this._props.estimatedCostIncludesVat ?? false;
    }

    get vatRate(): string | undefined {
        return this._props.vatRate;
    }

    get calculationBasis(): string | undefined {
        return this._props.calculationBasis;
    }

    get commissionOpinion(): string | undefined {
        return this._props.commissionOpinion;
    }

    get isMedicalDeviceProcurement(): boolean {
        return this._props.isMedicalDeviceProcurement ?? false;
    }

    get estimatedCost(): number {
        return this._props.estimatedCost ?? 0;
    }

    get stampDutyDeduction(): number {
        return this._props.stampDutyDeduction ?? 0;
    }

    get decisionStampDeduction(): number {
        return this._props.decisionStampDeduction ?? 0;
    }

    get vatWithholdingDeduction(): number {
        return this._props.vatWithholdingDeduction ?? 0;
    }

    get netPayment(): number {
        return this._props.netPayment ?? 0;
    }

    // ─── Süreç, Tarihler ve Kişiler ──────────────────────────────────────────
    get contactPersonId(): number | undefined {
        return this._props.contactPersonId;
    }

    get offerDeadline(): Date | undefined {
        return this._props.offerDeadline;
    }

    get deliveryDate(): Date | undefined {
        return this._props.deliveryDate;
    }

    get deliveryDays(): number {
        return this._props.deliveryDays ?? 7;
    }

    get procurementDate(): Date | undefined {
        return this._props.procurementDate;
    }

    get winningCompanyId(): number | undefined {
        return this._props.winningCompanyId;
    }

    get approvingPersonnelId(): number | undefined {
        return this._props.approvingPersonnelId;
    }

    get preparingPersonnelId(): number | undefined {
        return this._props.preparingPersonnelId;
    }

    get requestingPersonnelId(): number | undefined {
        return this._props.requestingPersonnelId;
    }

    get presentingPersonnelId(): number | undefined {
        return this._props.presentingPersonnelId;
    }

    get stageId(): number | undefined {
        return this._props.stageId;
    }

    get legislationId(): number | undefined {
        return this._props.legislationId;
    }

    get processTemplateId(): number | undefined {
        return this._props.processTemplateId;
    }

    get orderedDocuments(): readonly string[] {
        return this._props.orderedDocuments ?? [];
    }

    get starredDocuments(): readonly string[] {
        return this._props.starredDocuments ?? [];
    }

    get skippedDocuments(): readonly string[] {
        return this._props.skippedDocuments ?? [];
    }

    get templatePreferences(): Readonly<Record<string, unknown>> {
        return this._props.templatePreferences ?? {};
    }

    get notes(): string | undefined {
        return this._props.notes;
    }

    get repetitionNumber(): number {
        return this._props.repetitionNumber ?? 1;
    }

    get status(): ProcurementFileStatus {
        return this._props.status!;
    }

    get isLocked(): boolean {
        return this._props.isLocked!;
    }

    get lockReason(): string | undefined {
        return this._props.lockReason;
    }

    get ekapNumber(): string | undefined {
        return this._props.ekapNumber;
    }

    get isEkapSent(): boolean {
        return this._props.isEkapSent ?? false;
    }

    get isDeleted(): boolean {
        return this._props.isDeleted ?? false;
    }

    get source(): ProcurementFileSource | undefined {
        return this._props.source;
    }

    get transferGroupId(): string | undefined {
        return this._props.transferGroupId;
    }

    get sourceRecordId(): string | undefined {
        return this._props.sourceRecordId;
    }

    get createdAt(): string | Date | undefined {
        return this._props.createdAt;
    }

    get updatedAt(): string | Date | undefined {
        return this._props.updatedAt;
    }

    get properties(): Readonly<ProcurementFileProps> {
        return { ...this._props };
    }

    // ─── İş Kuralı ve Durum Metotları (Business Mutations) ───────────────────

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
     * İdari bilgileri günceller.
     */
    updateAdministrativeInfo(info: {
        unitId?: number;
        unitName?: string;
        additionalHeaderLine?: string;
        showUnitInHeader?: boolean;
        presentedAuthority?: string;
        placeOfNeed?: string;
    }): void {
        this.ensureEditable();
        this._props = { ...this._props, ...info };
    }

    /**
     * Mali kodları günceller.
     */
    updateFinancialCodes(codes: {
        eBudget?: string;
        say2000i?: string;
        functionalCode?: string;
        accountingUnit?: string;
        spendingUnit?: string;
        financingCode?: string;
        economicCode?: string;
        budgetCode?: string;
    }): void {
        this.ensureEditable();
        this._props = { ...this._props, ...codes };
    }

    /**
     * Alım detaylarını günceller.
     */
    updateProcurementDetails(details: {
        procurementType?: ProcurementFileType;
        tenderType?: string;
        procurementMethod?: string;
        tenderMethod?: string;
        supplyMethod?: string;
        contractType?: ContractType;
        hasSubcontractor?: boolean;
        allowsPartialOffers?: boolean;
        investmentProjectNumber?: string;
        projectId?: number;
        projectName?: string;
    }): void {
        this.ensureEditable();
        this._props = { ...this._props, ...details };
    }

    /**
     * Yaklaşık maliyet ve hesaplama esaslarını günceller.
     */
    updateEstimatedCost(
        amount: number,
        options?: {
            calculation?: string;
            calculationBasis?: string;
            includesVat?: boolean;
            vatRate?: string;
            commissionOpinion?: string;
            isMedicalDevice?: boolean;
        },
    ): void {
        this.ensureEditable();
        if (amount < 0) {
            throw new Error("Estimated cost cannot be negative.");
        }

        this._props.estimatedCost = amount;
        if (options?.calculation !== undefined) {
            this._props.estimatedCostCalculation = options.calculation;
        }
        if (options?.calculationBasis !== undefined) {
            this._props.calculationBasis = options.calculationBasis;
        }
        if (options?.includesVat !== undefined) {
            this._props.estimatedCostIncludesVat = options.includesVat;
        }
        if (options?.vatRate !== undefined) {
            this._props.vatRate = options.vatRate;
        }
        if (options?.commissionOpinion !== undefined) {
            this._props.commissionOpinion = options.commissionOpinion;
        }
        if (options?.isMedicalDevice !== undefined) {
            this._props.isMedicalDeviceProcurement = options.isMedicalDevice;
        }
    }

    /**
     * Vergi ve yasal kesinti tutarlarını günceller.
     */
    updateDeductions(deductions: {
        stampDuty?: number;
        decisionStamp?: number;
        vatWithholding?: number;
        netPayment?: number;
    }): void {
        this.ensureEditable();
        if (deductions.stampDuty !== undefined) {
            this._props.stampDutyDeduction = deductions.stampDuty;
        }
        if (deductions.decisionStamp !== undefined) {
            this._props.decisionStampDeduction = deductions.decisionStamp;
        }
        if (deductions.vatWithholding !== undefined) {
            this._props.vatWithholdingDeduction = deductions.vatWithholding;
        }
        if (deductions.netPayment !== undefined) {
            this._props.netPayment = deductions.netPayment;
        }
    }

    /**
     * İlgili ve yetkili personel rollerini günceller.
     */
    updatePersonnel(personnel: {
        contactPersonId?: number;
        approvingPersonnelId?: number;
        preparingPersonnelId?: number;
        requestingPersonnelId?: number;
        presentingPersonnelId?: number;
    }): void {
        this.ensureEditable();
        this._props = { ...this._props, ...personnel };
    }

    /**
     * Süreç tarihlerini ve teslim gününü günceller.
     */
    updateDates(dates: {
        openingDate?: Date;
        offerDeadline?: Date;
        deliveryDate?: Date;
        deliveryDays?: number;
        procurementDate?: Date;
    }): void {
        this.ensureEditable();
        if (dates.deliveryDays !== undefined && dates.deliveryDays < 0) {
            throw new Error("Delivery days cannot be negative.");
        }
        this._props = { ...this._props, ...dates };
    }

    /**
     * Kazanan istekli firmayı atar.
     */
    assignWinningSupplier(supplierId: number): void {
        this.ensureEditable();
        if (!Number.isInteger(supplierId) || supplierId <= 0) {
            throw new Error("Winning supplier ID must be a positive integer.");
        }
        this._props.winningCompanyId = supplierId;
    }

    /**
     * EKAP bilgi ve durumunu günceller.
     */
    updateEkapInfo(ekapNumber?: string, isSent?: boolean): void {
        this.ensureEditable();
        if (ekapNumber !== undefined) {
            this._props.ekapNumber = ekapNumber;
        }
        if (isSent !== undefined) {
            this._props.isEkapSent = isSent;
        }
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
     * Dosyayı silinmiş olarak işaretler (Soft Delete).
     */
    softDelete(): void {
        this.ensureEditable();
        this._props.isDeleted = true;
    }

    /**
     * Silinmiş dosyayı geri yükler.
     */
    restore(): void {
        this._props.isDeleted = false;
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
