/**
 * Approval & ProcurementDocument Domain Models
 *
 * DATA_TeminBelge tablosuna karşılık gelen iş modelidir.
 * Onay Belgesi (Harcama Talimatı) ve resmi süreç tutanaklarının operasyonel durumunu yönetir.
 */

export type DocumentKanbanStatus =
    | "hazirlanacak"
    | "hazirlaniyor"
    | "beklemede"
    | "tamamlandi";

export interface ProcurementDocumentProps {
    id: number;
    procurementFileId: number;
    documentName: string;
    templateId?: number | null;
    filePath?: string | null;
    isSigned?: boolean;
    signedFilePath?: string | null;
    creatingPersonnelId?: number | null;
    documentDate?: string | null;
    snapshotDataJson?: string | null;
    status?: DocumentKanbanStatus;
    waitingReason?: string | null;
    createdAt?: Date | string;
}

export class ProcurementDocument {
    private readonly _id: number;
    private _props: ProcurementDocumentProps;

    constructor(props: ProcurementDocumentProps) {
        if (!props.procurementFileId) {
            throw new Error("Procurement file ID is required.");
        }
        if (!props.documentName.trim()) {
            throw new Error("Document name cannot be empty.");
        }

        this._id = props.id;
        this._props = {
            ...props,
            documentName: props.documentName.trim(),
            isSigned: props.isSigned ?? false,
            status: props.status ?? "hazirlaniyor",
        };
    }

    get id(): number {
        return this._id;
    }

    get procurementFileId(): number {
        return this._props.procurementFileId;
    }

    get documentName(): string {
        return this._props.documentName;
    }

    get templateId(): number | null | undefined {
        return this._props.templateId;
    }

    get filePath(): string | null | undefined {
        return this._props.filePath;
    }

    get isSigned(): boolean {
        return this._props.isSigned ?? false;
    }

    get signedFilePath(): string | null | undefined {
        return this._props.signedFilePath;
    }

    get status(): DocumentKanbanStatus {
        return this._props.status ?? "hazirlaniyor";
    }

    get documentDate(): string | null | undefined {
        return this._props.documentDate;
    }

    get snapshotDataJson(): string | null | undefined {
        return this._props.snapshotDataJson;
    }

    get waitingReason(): string | null | undefined {
        return this._props.waitingReason;
    }

    /**
     * Belgeyi imzalandı olarak işaretler.
     */
    markSigned(signedPath: string): void {
        this._props.isSigned = true;
        this._props.signedFilePath = signedPath;
        this._props.status = "tamamlandi";
    }

    /**
     * Belgenin durumunu günceller.
     */
    updateStatus(status: DocumentKanbanStatus, waitingReason?: string): void {
        this._props.status = status;
        if (waitingReason !== undefined) {
            this._props.waitingReason = waitingReason;
        }
    }

    /**
     * Dondurulmuş JSON taslak verisini kaydeder.
     */
    saveSnapshot(json: string): void {
        this._props.snapshotDataJson = json;
    }
}
