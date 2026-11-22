/**
 * Kullanım:
 *
 * const commission = new Commission({
 *   id: null,
 *   name: "Yaklaşık Maliyet Tespit Komisyonu",
 *   type: "yaklasik_maliyet",
 *   description: "Yaklaşık maliyet çalışmalarını yürüten komisyon.",
 *   isActive: true,
 * });
 *
 * commission.rename("Yaklaşık Maliyet Komisyonu");
 * commission.activate();
 */

export interface CommissionProps {
    id: number | null;
    name: string;
    type?: string | null;
    description?: string | null;
    isActive?: boolean;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

export class Commission {
    private _id: number | null;
    private _name: string;
    private _type: string | null;
    private _description: string | null;
    private _isActive: boolean;
    private _createdAt: Date | null;
    private _updatedAt: Date | null;

    constructor(props: CommissionProps) {
        this._id = props.id;
        this._name = props.name.trim();
        this._type = props.type ?? null;
        this._description = props.description ?? null;
        this._isActive = props.isActive ?? true;
        this._createdAt = props.createdAt ?? null;
        this._updatedAt = props.updatedAt ?? null;

        this.validate();
    }

    get id(): number | null {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get type(): string | null {
        return this._type;
    }

    get description(): string | null {
        return this._description;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get createdAt(): Date | null {
        return this._createdAt;
    }

    get updatedAt(): Date | null {
        return this._updatedAt;
    }

    rename(name: string): void {
        const normalizedName = name.trim();

        if (!normalizedName) {
            throw new Error("Komisyon adı boş olamaz.");
        }

        this._name = normalizedName;
    }

    updateDetails(
        details: {
            type?: string | null;
            description?: string | null;
        },
    ): void {
        if (details.type !== undefined) {
            this._type = details.type;
        }

        if (details.description !== undefined) {
            this._description = details.description;
        }
    }

    activate(): void {
        this._isActive = true;
    }

    deactivate(): void {
        this._isActive = false;
    }

    private validate(): void {
        if (!this._name) {
            throw new Error("Komisyon adı boş olamaz.");
        }
    }
}
