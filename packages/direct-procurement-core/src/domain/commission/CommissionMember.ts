/**
 * Kullanım:
 *
 * const member = new CommissionMember({
 *   id: null,
 *   commissionId: 1,
 *   personnelId: 25,
 *   roleId: 1,
 *   isPrincipal: true,
 *   order: 0,
 *   showInDocument: true,
 *   documentScope: "tumu",
 *   targetDocuments: ["*"],
 *   signatureType: "İmza",
 *   unitId: 3,
 *   unitName: "Fen İşleri Müdürlüğü",
 * });
 *
 * member.setPrincipal(false);
 * member.setOrder(1);
 * member.setSignatureType("Paraf");
 */

export interface CommissionMemberProps {
    id: number | null;
    commissionId: number;
    personnelId?: number | null;
    roleId: number;
    isPrincipal?: boolean;
    order?: number;
    showInDocument?: boolean;
    documentScope?: string;
    targetDocuments?: string[];
    signatureType?: string;
    unitId?: number | null;
    unitName?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

export class CommissionMember {
    private _id: number | null;
    private _commissionId: number;
    private _personnelId: number | null;
    private _roleId: number;
    private _isPrincipal: boolean;
    private _order: number;
    private _showInDocument: boolean;
    private _documentScope: string;
    private _targetDocuments: string[];
    private _signatureType: string;
    private _unitId: number | null;
    private _unitName: string | null;
    private _createdAt: Date | null;
    private _updatedAt: Date | null;

    constructor(props: CommissionMemberProps) {
        this._id = props.id;
        this._commissionId = props.commissionId;
        this._personnelId = props.personnelId ?? null;
        this._roleId = props.roleId;
        this._isPrincipal = props.isPrincipal ?? true;
        this._order = props.order ?? 0;
        this._showInDocument = props.showInDocument ?? true;
        this._documentScope = props.documentScope ?? "tumu";
        this._targetDocuments = [...(props.targetDocuments ?? ["*"])];
        this._signatureType = props.signatureType ?? "İmza";
        this._unitId = props.unitId ?? null;
        this._unitName = props.unitName ?? null;
        this._createdAt = props.createdAt ?? null;
        this._updatedAt = props.updatedAt ?? null;

        this.validate();
    }

    get id(): number | null {
        return this._id;
    }

    get commissionId(): number {
        return this._commissionId;
    }

    get personnelId(): number | null {
        return this._personnelId;
    }

    get roleId(): number {
        return this._roleId;
    }

    get isPrincipal(): boolean {
        return this._isPrincipal;
    }

    get order(): number {
        return this._order;
    }

    get showInDocument(): boolean {
        return this._showInDocument;
    }

    get documentScope(): string {
        return this._documentScope;
    }

    get targetDocuments(): readonly string[] {
        return this._targetDocuments;
    }

    get signatureType(): string {
        return this._signatureType;
    }

    get unitId(): number | null {
        return this._unitId;
    }

    get unitName(): string | null {
        return this._unitName;
    }

    get createdAt(): Date | null {
        return this._createdAt;
    }

    get updatedAt(): Date | null {
        return this._updatedAt;
    }

    assignPersonnel(personnelId: number): void {
        this._personnelId = personnelId;
    }

    removePersonnel(): void {
        this._personnelId = null;
    }

    changeRole(roleId: number): void {
        this._roleId = roleId;
    }

    setPrincipal(isPrincipal: boolean): void {
        this._isPrincipal = isPrincipal;
    }

    setOrder(order: number): void {
        if (!Number.isInteger(order) || order < 0) {
            throw new Error(
                "Üye sırası negatif olmayan bir tam sayı olmalıdır.",
            );
        }

        this._order = order;
    }

    setDocumentVisibility(show: boolean): void {
        this._showInDocument = show;
    }

    setDocumentScope(scope: string): void {
        this._documentScope = scope;
    }

    setTargetDocuments(documents: string[]): void {
        this._targetDocuments = [...documents];
    }

    setSignatureType(signatureType: string): void {
        this._signatureType = signatureType;
    }

    updateUnit(unitId: number | null, unitName: string | null): void {
        this._unitId = unitId;
        this._unitName = unitName;
    }

    private validate(): void {
        if (!Number.isInteger(this._commissionId) || this._commissionId <= 0) {
            throw new Error("Geçerli bir komisyon ID gereklidir.");
        }

        if (!Number.isInteger(this._roleId) || this._roleId <= 0) {
            throw new Error("Geçerli bir komisyon görevi gereklidir.");
        }

        if (!Number.isInteger(this._order) || this._order < 0) {
            throw new Error(
                "Üye sırası negatif olmayan bir tam sayı olmalıdır.",
            );
        }
    }
}
