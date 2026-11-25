/**
 * Requirement & RequirementItem Domain Models
 *
 * DATA_IhtiyacRaporu ve DATA_IhtiyacRaporuKalem tablolarına karşılık gelen iş modelleridir.
 * Lüzum müzekkeresi ve harcama birimi ihtiyaç talebi kayıtları.
 */

export type RequirementStatus =
    | "taslak"
    | "onaylandi"
    | "dosyaya_aktarildi"
    | "iptal";

export interface RequirementItemProps {
    id: number;
    reportId: number;
    sequenceNumber: number;
    itemName: string;
    itemType: string;
    unit: string;
    quantity: number;
    vatRate?: number;
    movableCode?: string | null;
    okasCode?: string | null;
    positionNumber?: string | null;
    description?: string | null;
    estimatedUnitPrice?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export class RequirementItem {
    private readonly _id: number;
    private _props: RequirementItemProps;

    constructor(props: RequirementItemProps) {
        if (!props.reportId) {
            throw new Error("Report ID is required.");
        }
        if (!props.itemName.trim()) {
            throw new Error("Item name cannot be empty.");
        }
        if (props.quantity <= 0) {
            throw new Error("Quantity must be greater than zero.");
        }

        this._id = props.id;
        this._props = {
            ...props,
            itemName: props.itemName.trim(),
            vatRate: props.vatRate ?? 20,
            estimatedUnitPrice: props.estimatedUnitPrice ?? 0,
        };
    }

    get id(): number {
        return this._id;
    }

    get reportId(): number {
        return this._props.reportId;
    }

    get sequenceNumber(): number {
        return this._props.sequenceNumber;
    }

    get itemName(): string {
        return this._props.itemName;
    }

    get itemType(): string {
        return this._props.itemType;
    }

    get unit(): string {
        return this._props.unit;
    }

    get quantity(): number {
        return this._props.quantity;
    }

    get vatRate(): number {
        return this._props.vatRate ?? 20;
    }

    get movableCode(): string | null | undefined {
        return this._props.movableCode;
    }

    get okasCode(): string | null | undefined {
        return this._props.okasCode;
    }

    get positionNumber(): string | null | undefined {
        return this._props.positionNumber;
    }

    get description(): string | null | undefined {
        return this._props.description;
    }

    get estimatedUnitPrice(): number {
        return this._props.estimatedUnitPrice ?? 0;
    }

    get estimatedTotal(): number {
        return this.quantity * this.estimatedUnitPrice;
    }
}

export interface RequirementReportProps {
    id: number;
    reportNumber: string;
    title: string;
    justification?: string | null;
    unitId?: number | null;
    unitName?: string | null;
    requestingPersonnelId?: number | null;
    requestingPersonnelName?: string | null;
    requestingPersonnelTitle?: string | null;
    status?: RequirementStatus;
    procurementFileId?: number | null;
    reportDate?: Date;
    approvalDate?: Date | null;
    estimatedBudget?: number;
    notes?: string | null;
    items?: RequirementItem[];
}

export class RequirementReport {
    private readonly _id: number;
    private _props: RequirementReportProps;
    private _items: RequirementItem[];

    constructor(props: RequirementReportProps) {
        if (!props.reportNumber.trim()) {
            throw new Error("Report number cannot be empty.");
        }
        if (!props.title.trim()) {
            throw new Error("Report title cannot be empty.");
        }

        this._id = props.id;
        this._props = {
            ...props,
            reportNumber: props.reportNumber.trim(),
            title: props.title.trim(),
            status: props.status ?? "taslak",
            estimatedBudget: props.estimatedBudget ?? 0,
            reportDate: props.reportDate ?? new Date(),
        };
        this._items = [...(props.items ?? [])];
    }

    get id(): number {
        return this._id;
    }

    get reportNumber(): string {
        return this._props.reportNumber;
    }

    get title(): string {
        return this._props.title;
    }

    get justification(): string | null | undefined {
        return this._props.justification;
    }

    get unitId(): number | null | undefined {
        return this._props.unitId;
    }

    get unitName(): string | null | undefined {
        return this._props.unitName;
    }

    get requestingPersonnelId(): number | null | undefined {
        return this._props.requestingPersonnelId;
    }

    get requestingPersonnelName(): string | null | undefined {
        return this._props.requestingPersonnelName;
    }

    get status(): RequirementStatus {
        return this._props.status!;
    }

    get procurementFileId(): number | null | undefined {
        return this._props.procurementFileId;
    }

    get reportDate(): Date {
        return this._props.reportDate!;
    }

    get approvalDate(): Date | null | undefined {
        return this._props.approvalDate;
    }

    get estimatedBudget(): number {
        return this._props.estimatedBudget ?? 0;
    }

    get items(): readonly RequirementItem[] {
        return this._items;
    }

    addItem(item: RequirementItem): void {
        if (this.status !== "taslak") {
            throw new Error("Cannot add items to a non-draft requirement report.");
        }
        this._items.push(item);
    }

    approve(approvalDate: Date = new Date()): void {
        if (this.status !== "taslak") {
            throw new Error("Only draft reports can be approved.");
        }
        this._props.status = "onaylandi";
        this._props.approvalDate = approvalDate;
    }

    linkToProcurementFile(fileId: number): void {
        this._props.procurementFileId = fileId;
        this._props.status = "dosyaya_aktarildi";
    }

    cancel(): void {
        this._props.status = "iptal";
    }
}
