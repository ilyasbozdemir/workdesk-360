import { describe, it, expect, vi } from "vitest";
import { ProcurementFileService } from "../../../src/application/services/ProcurementFileService";
import { CommissionService } from "../../../src/application/services/CommissionService";
import { ApprovalService } from "../../../src/application/services/ApprovalService";
import { RequirementService } from "../../../src/application/services/RequirementService";
import { PriceResearchService } from "../../../src/application/services/PriceResearchService";
import { DocumentService } from "../../../src/application/services/DocumentService";
import { success, failure, NotFoundError } from "@worksuite-360/core";
import { ProcurementFile } from "../../../src/domain/procurement-file/ProcurementFile";
import { Commission } from "../../../src/domain/commission/Commission";
import { ProcurementDocument } from "../../../src/domain/approval/Approval";
import { RequirementReport } from "../../../src/domain/requirement/Requirement";
import { PriceOffer } from "../../../src/domain/price-research/PriceOffer";

describe("Application Services", () => {
    describe("ProcurementFileService", () => {
        it("dosya oluşturur ve başarıyla döner", async () => {
            const mockRepo = {
                create: vi.fn().mockImplementation((entity) => Promise.resolve(success(entity))),
                getById: vi.fn(),
                getAll: vi.fn(),
                exists: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                findByNumber: vi.fn(),
                findByYear: vi.fn(),
                findActiveFiles: vi.fn(),
            };

            const service = new ProcurementFileService(mockRepo);
            const result = await service.createFile({
                subject: "Kırtasiye Alımı",
                procurementType: "mal",
                estimatedCost: 15000,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.subject).toBe("Kırtasiye Alımı");
                expect(result.data.estimatedCost).toBe(15000);
            }
        });

        it("olmayan dosyayı sorgularken NotFoundError döner", async () => {
            const mockRepo = {
                create: vi.fn(),
                getById: vi.fn().mockResolvedValue(failure(new NotFoundError({ resource: "ProcurementFile", resourceId: "99" }))),
                getAll: vi.fn(),
                exists: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                findByNumber: vi.fn(),
                findByYear: vi.fn(),
                findActiveFiles: vi.fn(),
            };

            const service = new ProcurementFileService(mockRepo);
            const result = await service.getFileById(99);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe("NOT_FOUND");
            }
        });
    });

    describe("CommissionService", () => {
        it("komisyon tanımlar ve üyeleri atar", async () => {
            const mockRepo = {
                create: vi.fn().mockImplementation((entity) => Promise.resolve(success(entity))),
                getById: vi.fn(),
                getAll: vi.fn(),
                exists: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                findMembersByProcurementFileId: vi.fn().mockResolvedValue([]),
                saveMember: vi.fn().mockResolvedValue(undefined),
                removeMember: vi.fn().mockResolvedValue(undefined),
            };

            const service = new CommissionService(mockRepo);
            const result = await service.createCommission({
                name: "Piyasa Fiyat Araştırma Komisyonu",
                type: "piyasa_fiyat",
            });

            expect(result.success).toBe(true);

            const memberResult = await service.assignMember({
                procurementFileId: 100,
                commissionId: 1,
                personnelId: 5,
                fullName: "Mehmet Demir",
                role: "Asil",
                duty: "Başkan",
            });

            expect(memberResult.success).toBe(true);
            if (memberResult.success) {
                expect(memberResult.data.fullName).toBe("Mehmet Demir");
                expect(mockRepo.saveMember).toHaveBeenCalledTimes(1);
            }
        });
    });

    describe("ApprovalService & DocumentService", () => {
        it("belge oluşturur, imzalar ve snapshot saklar", async () => {
            const mockDoc = new ProcurementDocument({
                id: 1,
                procurementFileId: 10,
                documentName: "Harcama Talimatı",
                templateId: 5,
            });

            const mockRepo = {
                create: vi.fn().mockResolvedValue(success(mockDoc)),
                getById: vi.fn().mockResolvedValue(success(mockDoc)),
                getAll: vi.fn(),
                exists: vi.fn(),
                update: vi.fn().mockResolvedValue(success(mockDoc)),
                delete: vi.fn(),
                findByProcurementFileId: vi.fn().mockResolvedValue([mockDoc]),
                findByStatus: vi.fn().mockResolvedValue([mockDoc]),
            };

            const service = new ApprovalService(mockRepo);
            const signResult = await service.signDocument({
                documentId: 1,
                signedFilePath: "/path/to/signed.pdf",
            });

            expect(signResult.success).toBe(true);
            expect(mockDoc.isSigned).toBe(true);
            expect(mockDoc.signedFilePath).toBe("/path/to/signed.pdf");

            const docService = new DocumentService(mockRepo);
            const snapResult = await docService.freezeSnapshot(1, '{"version":1}');
            expect(snapResult.success).toBe(true);
            expect(mockDoc.snapshotDataJson).toBe('{"version":1}');
        });
    });
});
