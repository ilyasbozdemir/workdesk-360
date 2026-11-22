import { describe, it, expect } from "vitest";
import { ProcurementFileListViewModel } from "../../../src/presentation/view-models/ProcurementFileListViewModel";
import { ProcurementFileDetailViewModel } from "../../../src/presentation/view-models/ProcurementFileDetailViewModel";
import { CommissionViewModel } from "../../../src/presentation/view-models/CommissionViewModel";
import { RequirementViewModel } from "../../../src/presentation/view-models/RequirementViewModel";
import { PriceResearchViewModel } from "../../../src/presentation/view-models/PriceResearchViewModel";
import { ApprovalViewModel } from "../../../src/presentation/view-models/ApprovalViewModel";
import type { ProcurementFileDto } from "../../../src/application/dto/procurement-file/ProcurementFileDto";

describe("Presentation ViewModels", () => {
    it("ProcurementFileListViewModel listeyi formatlanmış para birimi ve Türkçe etiketlerle döner", () => {
        const dto: ProcurementFileDto = {
            id: 1,
            subject: "Boya Alımı",
            procurementNumber: "2026/01",
            procurementType: "mal",
            status: "in_progress",
            isLocked: false,
            estimatedCost: 85000,
            unitName: "Destek Hizmetleri",
            budgetYear: 2026,
        };

        const [item] = ProcurementFileListViewModel.toList([dto]);
        expect(item.id).toBe(1);
        expect(item.statusLabel).toBe("Devam Ediyor");
        expect(item.formattedCost).toContain("85.000");
        expect(item.unitName).toBe("Destek Hizmetleri");
    });

    it("ProcurementFileDetailViewModel rozet renklerini ve detay durumunu doğru eşleştirir", () => {
        const dto: ProcurementFileDto = {
            id: 2,
            subject: "Danışmanlık Hizmeti",
            procurementNumber: "2026/02",
            documentNumber: "EVR-999",
            procurementType: "hizmet",
            status: "completed",
            isLocked: true,
            estimatedCost: 120000,
            budgetYear: 2026,
            budgetType: "Öz Bütçe",
            contractType: "Doğrudan Temin",
            deliveryDays: 15,
        };

        const view = ProcurementFileDetailViewModel.toDetailView(dto);
        expect(view.statusBadgeColor).toBe("green");
        expect(view.statusLabel).toBe("Sonuçlandırıldı");
        expect(view.isLocked).toBe(true);
        expect(view.procurementTypeLabel).toBe("Hizmet Alımı");
    });

    it("CommissionViewModel komisyon başkanı ayrımını yapar", () => {
        const view = CommissionViewModel.toMemberView({
            id: 5,
            fullName: "Ali Veli",
            duty: "Komisyon Başkanı",
            role: "Asil",
        });

        expect(view.isChairman).toBe(true);
        expect(view.duty).toBe("Komisyon Başkanı");
    });

    it("RequirementViewModel ve PriceResearchViewModel formatlamalarını yapar", () => {
        const reqView = RequirementViewModel.toView({
            id: 10,
            reportNumber: "İHT-01",
            title: "Yedek Parça",
            status: "onaylandi",
            estimatedBudget: 35000,
            itemCount: 4,
        });

        expect(reqView.statusLabel).toBe("Onaylandı");
        expect(reqView.formattedBudget).toContain("35.000");

        const offerView = PriceResearchViewModel.toOfferView({
            id: 1,
            procurementFileId: 10,
            itemId: 10,
            supplierId: 2,
            unitPrice: 500,
        }, true);

        expect(offerView.isLowestOffer).toBe(true);
        expect(offerView.formattedUnitPrice).toContain("500");
    });

    it("ApprovalViewModel onay belgeleri için doğru rozet ve durum metinlerini döner", () => {
        const view = ApprovalViewModel.toView({
            id: 15,
            procurementFileId: 101,
            documentName: "Onay Belgesi",
            isSigned: true,
            status: "signed",
            signedFilePath: "/docs/onay.pdf",
        });

        expect(view.statusBadgeColor).toBe("green");
        expect(view.statusLabel).toBe("İmzalandı");
        expect(view.isSigned).toBe(true);
        expect(view.signedFilePath).toBe("/docs/onay.pdf");
    });
});
