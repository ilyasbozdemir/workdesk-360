import type { ApprovalDto } from "../../application/dto/approval/ApprovalDto";

export interface ApprovalItemView {
    id: number;
    procurementFileId: number;
    documentName: string;
    status: string;
    statusLabel: string;
    statusBadgeColor: "gray" | "blue" | "green" | "red";
    isSigned: boolean;
    signedFilePath: string | null;
}

export class ApprovalViewModel {
    static toView(dto: ApprovalDto): ApprovalItemView {
        const isSigned = Boolean(dto.isSigned);
        const status = dto.status || (isSigned ? "signed" : "pending");

        const statusLabels: Record<string, string> = {
            draft: "Taslak",
            pending: "İmza Bekliyor",
            signed: "İmzalandı",
            rejected: "Reddedildi",
        };

        const badgeColors: Record<string, "gray" | "blue" | "green" | "red"> = {
            draft: "gray",
            pending: "blue",
            signed: "green",
            rejected: "red",
        };

        return {
            id: dto.id,
            procurementFileId: dto.procurementFileId,
            documentName: dto.documentName,
            status,
            statusLabel: statusLabels[status] || status,
            statusBadgeColor: badgeColors[status] || "gray",
            isSigned,
            signedFilePath: dto.signedFilePath ?? null,
        };
    }

    static toList(dtos: ApprovalDto[]): ApprovalItemView[] {
        return dtos.map(this.toView);
    }
}
