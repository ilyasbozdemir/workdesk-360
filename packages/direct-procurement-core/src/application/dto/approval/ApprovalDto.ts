export interface CreateApprovalDto {
    procurementFileId: number;
    documentName: string;
    templateId?: number;
    documentDate?: string;
}

export interface SignApprovalDto {
    documentId: number;
    signedFilePath: string;
}

export interface ApprovalDto {
    id: number;
    procurementFileId: number;
    documentName: string;
    isSigned: boolean;
    status: string;
    signedFilePath?: string | null;
}
