/**
 * Kullanım:
 *
 * const member = new ProcurementCommissionMember({
 *   id: null,
 *   procurementFileId: 10,
 *   commissionId: 1,
 *   personnelId: 25,
 *   fullName: "Ahmet Yılmaz",
 *   title: "Mühendis",
 *   duty: "Başkan",
 *   role: "Asil",
 *   commissionType: "Yaklaşık Maliyet Tespit Komisyonu",
 *   showInDocument: true,
 *   actingTitle: null,
 *   startDate: null,
 *   endDate: null,
 *   documentScope: "tumu",
 *   targetDocuments: ["*"],
 *   memberType: "Asil",
 *   signatureType: "İmza",
 *   unitId: 3,
 *   unitName: "Fen İşleri Müdürlüğü",
 *   source: "kurumsal",
 * });
 *
 * member.updateDuty("Üye");
 * member.setMemberType("Yedek");
 * member.setDocumentVisibility(false);
 */

export interface ProcurementCommissionMemberProps {
    id: number | null;
    procurementFileId: number;
    commissionId: number;
    personnelId: number;
    fullName: string;
    title?: string | null;
    duty?: string | null;
    role?: string | null;
    commissionType?: string | null;
    showInDocument?: boolean;
    actingTitle?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    documentScope?: string;
    targetDocuments?: string[];
    memberType?: string;
    signatureType?: string;
    unitId?: number | null;
    unitName?: string | null;
    source?: string;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

export class ProcurementCommissionMember {
    private _id: number | null;
    private _procurementFileId: number;
    private _commissionId: number;
    private _personnelId: number;
    private _fullName: string;
    private _title: string | null;
    private _duty: string | null;
    private _role: string | null;
    private _commissionType: string | null;
    private _showInDocument: boolean;
    private _actingTitle: string | null;
    private _startDate: string | null;
    private _endDate: string | null;
    private _documentScope: string;
    private _targetDocuments: string[];
    private _memberType: string;
    private _signatureType: string;
    private _unitId: number | null;
    private _unitName: string | null;
    private _source: string;
    private _createdAt: Date | null;
    private _updatedAt: Date | null;

    constructor(props: ProcurementCommissionMemberProps) {
        this._id = props.id;
        this._procurementFileId = props.procurementFileId;
        this._commissionId = props.commissionId;
        this._personnelId = props.personnelId;
        this._fullName = props.fullName.trim();
        this._title = props.title ?? null;
        this._duty = props.duty ?? null;
        this._role = props.role ?? null;
        this._commissionType = props.commissionType ?? null;
        this._showInDocument = props.showInDocument ?? true;
        this._actingTitle = props.actingTitle ?? null;
        this._startDate = props.startDate ?? null;
        this._endDate = props.endDate ?? null;
        this._documentScope = props.documentScope ?? "tumu";
        this._targetDocuments = [...(props.targetDocuments ?? ["*"])];
        this._memberType = props.memberType ?? "Asil";
        this._signatureType = props.signatureType ?? "İmza";
        this._unitId = props.unitId ?? null;
        this._unitName = props.unitName ?? null;
        this._source = props.source ?? "kurumsal";
        this._createdAt = props.createdAt ?? null;
        this._updatedAt = props.updatedAt ?? null;

        this.validate();
    }

    get id(): number | null {
        return this._id;
    }

    get procurementFileId(): number {
        return this._procurementFileId;
    }

    get commissionId(): number {
        return this._commissionId;
    }

    get personnelId(): number {
        return this._personnelId;
    }

    get fullName(): string {
        return this._fullName;
    }

    get title(): string | null {
        return this._title;
    }

    get duty(): string | null {
        return this._duty;
    }

    get role(): string | null {
        return this._role;
    }

    get commissionType(): string | null {
        return this._commissionType;
    }

    get showInDocument(): boolean {
        return this._showInDocument;
    }

    get actingTitle(): string | null {
        return this._actingTitle;
    }

    get startDate(): string | null {
        return this._startDate;
    }

    get endDate(): string | null {
        return this._endDate;
    }

    get documentScope(): string {
        return this._documentScope;
    }

    get targetDocuments(): readonly string[] {
        return this._targetDocuments;
    }

    get memberType(): string {
        return this._memberType;
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

    get source(): string {
        return this._source;
    }

    get createdAt(): Date | null {
        return this._createdAt;
    }

    get updatedAt(): Date | null {
        return this._updatedAt;
    }

    updateDuty(duty: string | null): void {
        this._duty = duty;
    }

    updateRole(role: string | null): void {
        this._role = role;
    }

    updateTitle(title: string | null): void {
        this._title = title;
    }

    setMemberType(memberType: string): void {
        this._memberType = memberType;
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

    updateActingTitle(title: string | null): void {
        this._actingTitle = title;
    }

    updateAssignmentDates(
        startDate: string | null,
        endDate: string | null,
    ): void {
        if (startDate && endDate && startDate > endDate) {
            throw new Error(
                "Görevlendirme başlangıç tarihi bitiş tarihinden sonra olamaz.",
            );
        }

        this._startDate = startDate;
        this._endDate = endDate;
    }

    updateUnit(unitId: number | null, unitName: string | null): void {
        this._unitId = unitId;
        this._unitName = unitName;
    }

    private validate(): void {
        if (
            !Number.isInteger(this._procurementFileId) ||
            this._procurementFileId <= 0
        ) {
            throw new Error("Geçerli bir temin dosyası ID gereklidir.");
        }

        if (!Number.isInteger(this._commissionId) || this._commissionId <= 0) {
            throw new Error("Geçerli bir komisyon ID gereklidir.");
        }

        if (!Number.isInteger(this._personnelId) || this._personnelId <= 0) {
            throw new Error("Geçerli bir personel ID gereklidir.");
        }

        if (!this._fullName) {
            throw new Error("Komisyon üyesinin adı soyadı boş olamaz.");
        }
    }
}
