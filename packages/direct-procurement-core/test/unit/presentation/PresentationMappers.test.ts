import { describe, it, expect } from "vitest";
import { ProcurementFileMapper } from "../../../src/presentation/mappers/ProcurementFileMapper";
import { ProcurementFileListMapper } from "../../../src/presentation/mappers/ProcurementFileListMapper";
import { ProcurementFileDetailMapper } from "../../../src/presentation/mappers/ProcurementFileDetailMapper";
import { CommissionMapper } from "../../../src/presentation/mappers/CommissionMapper";
import { ApprovalMapper } from "../../../src/presentation/mappers/ApprovalMapper";
import { RequirementMapper } from "../../../src/presentation/mappers/RequirementMapper";
import { PriceResearchMapper } from "../../../src/presentation/mappers/PriceResearchMapper";
import { PriceOffer } from "../../../src/domain/price-research/PriceOffer";
import { ProcurementFile } from "../../../src/domain/procurement-file/ProcurementFile";
import { ProcurementFileStatus } from "../../../src/domain/procurement-file/ProcurementFileStatus";
import { ProcurementCommissionMember } from "../../../src/domain/commission/ProcurementCommission";
import { ProcurementDocument } from "../../../src/domain/approval/Approval";
import { RequirementReport } from "../../../src/domain/requirement/Requirement";
import type { ProcurementFileDto } from "../../../src/application/dto/procurement-file/ProcurementFileDto";

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
            createdAt: "2026-03-15T10:00:00Z",
        });

        const dto = ProcurementFileMapper.toDto(file);
        expect(dto.id).toBe(101);
        expect(dto.subject).toBe("Bilgisayar Alımı");
        expect(dto.estimatedCost).toBe(250000);
        expect(dto.totalAmount).toBe(250000);
        expect(dto.status).toBe(ProcurementFileStatus.InProgress);
        expect(dto.createdAt).toBe("2026-03-15T10:00:00Z");
    });

    it("Aynı DTO'yu kullanarak farklı Mapper'lar farklı ViewModel'ler üretir (Liste vs Detay)", () => {
        // Ortak tek bir DTO
        const sharedDto: ProcurementFileDto = {
            id: 202,
            procurementNumber: "2026/DT-45",
            documentNumber: "EVR-8899",
            subject: "Laboratuvar Sarf Malzemesi Alımı",
            procurementType: "mal",
            status: "in_progress",
            isLocked: false,
            estimatedCost: 145000,
            totalAmount: 145000,
            budgetYear: 2026,
            budgetType: "Döner Sermaye",
            unitName: "Tıp Fakültesi Biyokimya",
            deliveryDays: 20,
            createdAt: "2026-04-10T09:30:00Z",
            permissions: {
                canEdit: true,
                canApprove: true,
                canDelete: false,
            },
        };

        // 1. Liste Ekranı Mapper'ı (ProcurementFileListMapper)
        const listItemView = ProcurementFileListMapper.toListItemView(sharedDto);

        // Liste ekranı kriterleri:
        // - Dosya numarası
        expect(listItemView.procurementNumber).toBe("2026/DT-45");
        // - Durum etiketi
        expect(listItemView.statusLabel).toBe("Devam Ediyor");
        // - Toplam tutar
        expect(listItemView.totalAmount).toBe(145000);
        expect(listItemView.formattedTotalAmount).toContain("145.000");
        // - Oluşturulma tarihi
        expect(listItemView.createdAt).toBe("2026-04-10T09:30:00Z");
        expect(listItemView.formattedCreatedAt).toBe("10.04.2026");

        // 2. Detay Ekranı Mapper'ı (ProcurementFileDetailMapper)
        const detailView = ProcurementFileDetailMapper.toDetailView(sharedDto);

        // Detay ekranı kriterleri:
        // - Dosya bilgileri
        expect(detailView.id).toBe(202);
        expect(detailView.procurementNumber).toBe("2026/DT-45");
        expect(detailView.documentNumber).toBe("EVR-8899");
        expect(detailView.subject).toBe("Laboratuvar Sarf Malzemesi Alımı");
        expect(detailView.unitName).toBe("Tıp Fakültesi Biyokimya");
        expect(detailView.budgetYear).toBe(2026);
        expect(detailView.budgetType).toBe("Döner Sermaye");
        expect(detailView.deliveryDays).toBe(20);
        expect(detailView.estimatedCost).toBe(145000);
        expect(detailView.formattedEstimatedCost).toContain("145.000");
        // - Alım türü
        expect(detailView.procurementType).toBe("mal");
        expect(detailView.procurementTypeLabel).toBe("Mal Alımı");
        // - Kilit durumu
        expect(detailView.isLocked).toBe(false);
        expect(detailView.lockStatusLabel).toBe("Açık (İşlem Yapılabilir)");
        expect(detailView.lockBadgeColor).toBe("green");
        // - Düzenleme yetkisi göstergesi
        expect(detailView.canEdit).toBe(true);
        expect(detailView.editPermissionIndicator.canEdit).toBe(true);
        expect(detailView.editPermissionIndicator.badgeText).toBe("Düzenlenebilir");
        expect(detailView.editPermissionIndicator.badgeColor).toBe("green");
    });

    it("Detay Mapper kilitli veya yetkisiz dosyalarda düzenleme yetkisi göstergesini doğru türetir", () => {
        // Kilitli dosya DTO'su
        const lockedDto: ProcurementFileDto = {
            id: 301,
            procurementNumber: "2026/DT-99",
            subject: "Yazılım Lisansı",
            procurementType: "hizmet",
            status: "completed",
            isLocked: true,
            lockReason: "İhale onaylandı ve arşivlendi.",
            estimatedCost: 500000,
            permissions: { canEdit: true },
        };

        const lockedDetail = ProcurementFileDetailMapper.toDetailView(lockedDto);
        expect(lockedDetail.isLocked).toBe(true);
        expect(lockedDetail.lockStatusLabel).toBe("Kilitli (Salt Okunur)");
        expect(lockedDetail.lockBadgeColor).toBe("red");
        expect(lockedDetail.canEdit).toBe(false);
        expect(lockedDetail.editPermissionIndicator.badgeText).toBe("Salt Okunur (Kilitli)");
        expect(lockedDetail.editPermissionIndicator.badgeColor).toBe("gray");
        expect(lockedDetail.editPermissionIndicator.reason).toContain("İhale onaylandı");

        // Yetkisiz kullanıcı DTO'su
        const unauthorizedDto: ProcurementFileDto = {
            id: 302,
            procurementNumber: "2026/DT-100",
            subject: "Bina Onarımı",
            procurementType: "yapim_isi",
            status: "in_progress",
            isLocked: false,
            estimatedCost: 750000,
            permissions: {
                canEdit: false,
                reason: "Bu birim için düzenleme yetkiniz yok.",
            },
        };

        const unauthorizedDetail = ProcurementFileDetailMapper.toDetailView(unauthorizedDto);
        expect(unauthorizedDetail.isLocked).toBe(false);
        expect(unauthorizedDetail.canEdit).toBe(false);
        expect(unauthorizedDetail.editPermissionIndicator.badgeText).toBe("Yetki Yok");
        expect(unauthorizedDetail.editPermissionIndicator.badgeColor).toBe("red");
        expect(unauthorizedDetail.editPermissionIndicator.reason).toBe("Bu birim için düzenleme yetkiniz yok.");
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

    it("PriceResearchMapper entity -> DTO dönüşümünü yapar", () => {
        const offer = new PriceOffer({
            id: 201,
            procurementFileId: 50,
            itemId: 12,
            supplierId: 3,
            unitPrice: 1500,
            vatAmount: 300,
            hasOffer: true,
        });

        const dto = PriceResearchMapper.toOfferDto(offer);
        expect(dto.id).toBe(201);
        expect(dto.unitPrice).toBe(1500);
        expect(dto.vatAmount).toBe(300);
        expect(dto.supplierId).toBe(3);
    });
});
