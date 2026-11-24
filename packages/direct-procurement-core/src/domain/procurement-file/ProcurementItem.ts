export type ProcurementItemType =
    | "Mal"
    | "Hizmet"
    | "Yapım"
    | "Danışmanlık";

export interface ProcurementItemProps {
    id: number;
    procurementFileId: number;

    sequenceNumber: number;

    name: string;
    type: ProcurementItemType;

    quantity: number;
    unit: string;
    vatRate: number;

    description?: string;

    barcodeId?: number;
    movableCode?: string;
    okasCode?: string;

    construction?: {
        positionNumber?: string;
        positionYear?: number;
        positionDescription?: string;
        positionGroupReferenceId?: number;
        measurementUnit?: string;
        buildingClass?: string;
    };

    service?: {
        serviceCode?: string;
        serviceClass?: string;
        duration?: number;
        personnelCount?: number;
        professionCode?: string;
    };

    pricePeriod?: string;

    imageUrl?: string;
    images?: string[];

    createdAt?: string;
    updatedAt?: string;
}

export class ProcurementItem {
    private constructor(
        private readonly props: ProcurementItemProps,
    ) {}

    static create(props: ProcurementItemProps): ProcurementItem {
        this.validate(props);

        return new ProcurementItem({
            ...props,
            images: [...(props.images ?? [])],
        });
    }

    private static validate(props: ProcurementItemProps): void {
        if (!props.procurementFileId) {
            throw new Error("Satın alma dosyası belirtilmelidir.");
        }

        if (!props.name.trim()) {
            throw new Error("Kalem adı boş olamaz.");
        }

        if (!Number.isFinite(props.quantity) || props.quantity <= 0) {
            throw new Error("Kalem miktarı sıfırdan büyük olmalıdır.");
        }

        if (!Number.isFinite(props.vatRate) || props.vatRate < 0) {
            throw new Error("KDV oranı negatif olamaz.");
        }

        if (
            !Number.isInteger(props.sequenceNumber) || props.sequenceNumber < 1
        ) {
            throw new Error("Kalem sıra numarası geçersizdir.");
        }

        if (!["Mal", "Hizmet", "Yapım", "Danışmanlık"].includes(props.type)) {
            throw new Error("Geçersiz satın alma kalemi türü.");
        }
    }

    get id(): number {
        return this.props.id;
    }

    get procurementFileId(): number {
        return this.props.procurementFileId;
    }

    get sequenceNumber(): number {
        return this.props.sequenceNumber;
    }

    get name(): string {
        return this.props.name;
    }

    get type(): ProcurementItemType {
        return this.props.type;
    }

    get quantity(): number {
        return this.props.quantity;
    }

    get unit(): string {
        return this.props.unit;
    }

    get vatRate(): number {
        return this.props.vatRate;
    }

    get description(): string | undefined {
        return this.props.description;
    }

    get images(): readonly string[] {
        return this.props.images ?? [];
    }

    get construction(): ProcurementItemProps["construction"] {
        return this.props.construction;
    }

    get service(): ProcurementItemProps["service"] {
        return this.props.service;
    }

    get pricePeriod(): string | undefined {
        return this.props.pricePeriod;
    }

    get imageUrl(): string | undefined {
        return this.props.imageUrl;
    }

    get createdAt(): string | undefined {
        return this.props.createdAt;
    }

    get updatedAt(): string | undefined {
        return this.props.updatedAt;
    }

    updateQuantity(quantity: number): void {
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error("Kalem miktarı sıfırdan büyük olmalıdır.");
        }

        this.props.quantity = quantity;
    }

    updateName(name: string): void {
        if (!name.trim()) {
            throw new Error("Kalem adı boş olamaz.");
        }

        this.props.name = name.trim();
    }

    updateDescription(description?: string): void {
        this.props.description = description;
    }

    toPrimitives(): ProcurementItemProps {
        return {
            ...this.props,
            images: [...(this.props.images ?? [])],
        };
    }
}
