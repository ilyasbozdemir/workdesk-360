import { describe, it, expect } from "vitest";
import { ProcurementFileMapper } from "../../../src/presentation/mappers/ProcurementFileMapper";
import { CommissionMapper } from "../../../src/presentation/mappers/CommissionMapper";
import { ApprovalMapper } from "../../../src/presentation/mappers/ApprovalMapper";
import { RequirementMapper } from "../../../src/presentation/mappers/RequirementMapper";
import { ProcurementFile } from "../../../src/domain/procurement-file/ProcurementFile";
import { ProcurementFileStatus } from "../../../src/domain/procurement-file/ProcurementFileStatus";
import { ProcurementCommissionMember } from "../../../src/domain/commission/ProcurementCommission";
import { ProcurementDocument } from "../../../src/domain/approval/Approval";
import { RequirementReport } from "../../../src/domain/requirement/Requirement";

describe("Presentation Mappers", () => {
    it("ProcurementFileMapper entity -> DTO dönüşümünü eksiksiz yapar", () => {
        const file = new ProcurementFile({
            id: 101,
            subject: "Bilgisayar Alımı",
            procurementType: "mal",
            status: ProcurementFileStatus.InProgress,
            estimatedCost: 250000,
            budgetYear: 2026,
            unitName: "Bilgi İşlem",
        });

        const dto = ProcurementFileMapper.toDto(file);
        expect(dto.id).toBe(101);
        expect(dto.subject).toBe("Bilgisayar Alımı");
        expect(dto.estimatedCost).toBe(250000);
        expect(dto.status).toBe(ProcurementFileStatus.InProgress);
    });

    it("CommissionMapper üye entity -> DTO dönüşümünü yapar", () => {
        const member = new ProcurementCommissionMember({
            id: 7,
            procurementFileId: 50,
            commissionId: 1,
            personnelId: 12,
            fullName: "Ayşe Kaya",
            title: "Mimar",
            duty: "Üye",
            role: "Asil",
        });

        const dto = CommissionMapper.toMemberDto(member);
        expect(dto.id).toBe(7);
        expect(dto.fullName).toBe("Ayşe Kaya");
        expect(dto.duty).toBe("Üye");
        expect(dto.role).toBe("Asil");
    });

    it("ApprovalMapper ve RequirementMapper DTO dönüşümlerini yapar", () => {
        const doc = new ProcurementDocument({
            id: 20,
            procurementFileId: 10,
            documentName: "Piyasa Araştırma Tutanağı",
            isSigned: true,
            signedFilePath: "/docs/arastirma.pdf",
        });

        const docDto = ApprovalMapper.toDto(doc);
        expect(docDto.id).toBe(20);
        expect(docDto.isSigned).toBe(true);

        const req = new RequirementReport({
            id: 30,
            reportNumber: "İHT-2026-001",
            title: "Kırtasiye İhtiyacı",
            estimatedBudget: 45000,
            status: "onaylandi",
        });

        const reqDto = RequirementMapper.toDto(req);
        expect(reqDto.id).toBe(30);
        expect(reqDto.reportNumber).toBe("İHT-2026-001");
        expect(reqDto.estimatedBudget).toBe(45000);
    });
});
