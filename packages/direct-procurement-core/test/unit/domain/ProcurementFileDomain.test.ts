import { describe, expect, it } from "vitest";
import {
    ProcurementFile,
    ProcurementFileStatus,
    ProcurementItem,
    Supplier,
    ProcurementSupplier,
    PriceOffer,
    PriceResearch,
    RequirementReport,
    RequirementItem,
    ProcurementDocument,
} from "../../../src/domain/procurement-file";

describe("Procurement Domain Aggregates & Models", () => {
    describe("ProcurementFile (DATA_TeminDosyasi Domain Mapping)", () => {
        it("başarıyla oluşturulur ve tüm alanları doğru taşır", () => {
            const file = new ProcurementFile({
                id: 1,
                subject: "Yazıcı ve Tarayıcı Alımı",
                procurementNumber: "2026/DT-001",
                documentNumber: "EBYS-12345",
                procurementType: "mal",
                tenderType: "Doğrudan Temin",
                unitId: 5,
                unitName: "Bilgi İşlem Daire Başkanlığı",
                budgetYear: 2026,
                budgetType: "genel_butce",
                estimatedCost: 150000,
            });

            expect(file.id).toBe(1);
            expect(file.subject).toBe("Yazıcı ve Tarayıcı Alımı");
            expect(file.procurementNumber).toBe("2026/DT-001");
            expect(file.documentNumber).toBe("EBYS-12345");
            expect(file.procurementType).toBe("mal");
            expect(file.status).toBe(ProcurementFileStatus.InProgress);
            expect(file.isLocked).toBe(false);
            expect(file.estimatedCost).toBe(150000);
        });

        it("iş kuralları (mutations) ile idari ve mali bilgiler güncellenebilir", () => {
            const file = new ProcurementFile({
                id: 1,
                subject: "İlk Başlık",
                procurementType: "hizmet",
            });

            file.changeSubject("Yeni Temin Başlığı");
            expect(file.subject).toBe("Yeni Temin Başlığı");

            file.updateFinancialCodes({
                budgetCode: "03.2.1.01",
                eBudget: "E-100",
                functionalCode: "01.3.9",
            });
            expect(file.budgetCode).toBe("03.2.1.01");
            expect(file.eBudget).toBe("E-100");

            file.updateEstimatedCost(120000, {
                calculationBasis: "Piyasa Araştırması",
                vatRate: "%20",
            });
            expect(file.estimatedCost).toBe(120000);
            expect(file.calculationBasis).toBe("Piyasa Araştırması");
        });

        it("dosya kilitlendiğinde veya tamamlandığında değişiklik yapılamaz", () => {
            const file = new ProcurementFile({
                id: 2,
                subject: "Test Dosyası",
                procurementType: "mal",
            });

            file.lock("Onaylandı ve kilitlendi.");
            expect(file.isLocked).toBe(true);
            expect(() => file.changeSubject("Değişiklik")).toThrow(
                "Locked procurement files cannot be modified.",
            );

            file.unlock();
            expect(file.isLocked).toBe(false);
            file.complete();
            expect(file.status).toBe(ProcurementFileStatus.Completed);
            expect(() => file.changeSubject("Yeni Başlık")).toThrow(
                "Completed or cancelled files cannot be modified.",
            );
        });
    });

    describe("ProcurementItem (DATA_TeminKalem Domain Mapping)", () => {
        it("satın alma kalemi oluşturulur ve doğrulanır", () => {
            const item = ProcurementItem.create({
                id: 10,
                procurementFileId: 1,
                sequenceNumber: 1,
                name: "A4 Fotokopi Kağıdı",
                type: "Mal",
                quantity: 100,
                unit: "Koli",
                vatRate: 20,
            });

            expect(item.id).toBe(10);
            expect(item.name).toBe("A4 Fotokopi Kağıdı");
            expect(item.quantity).toBe(100);
            expect(item.unit).toBe("Koli");
        });
    });

    describe("Supplier & ProcurementSupplier (TANIM_Firma & DATA_TeminFirma)", () => {
        it("firma ana kartı ve dosya istekli modeli çalışır", () => {
            const supplier = new Supplier({
                id: 50,
                title: "Örnek Teknoloji A.Ş.",
                taxNumber: "1234567890",
                city: "Ankara",
            });
            expect(supplier.title).toBe("Örnek Teknoloji A.Ş.");
            expect(supplier.isBlacklisted).toBe(false);

            const fileSupplier = new ProcurementSupplier({
                id: 1,
                procurementFileId: 10,
                supplierId: 50,
                title: "Örnek Teknoloji A.Ş.",
            });

            expect(fileSupplier.isInvited).toBe(true);
            expect(fileSupplier.hasOffered).toBe(false);

            fileSupplier.submitOffer(45000);
            expect(fileSupplier.hasOffered).toBe(true);
            expect(fileSupplier.totalOfferAmount).toBe(45000);

            fileSupplier.markWinner();
            expect(fileSupplier.isWinner).toBe(true);
        });
    });

    describe("PriceResearch & PriceOffer (DATA_TeminKalemTeklif)", () => {
        it("teklifler toplanır ve en düşük teklif tespit edilir", () => {
            const offer1 = new PriceOffer({
                id: 1,
                procurementFileId: 1,
                itemId: 101,
                supplierId: 10,
                unitPrice: 500,
            });
            const offer2 = new PriceOffer({
                id: 2,
                procurementFileId: 1,
                itemId: 101,
                supplierId: 20,
                unitPrice: 450,
            });

            const research = new PriceResearch({
                procurementFileId: 1,
                researchDate: new Date(),
                offers: [offer1, offer2],
            });

            const lowest = research.getLowestOfferForItem(101);
            expect(lowest).not.toBeNull();
            expect(lowest?.supplierId).toBe(20);
            expect(lowest?.unitPrice).toBe(450);
        });
    });

    describe("Requirement & Approval (DATA_IhtiyacRaporu & DATA_TeminBelge)", () => {
        it("ihtiyaç raporu oluşturulur ve onaylanır", () => {
            const report = new RequirementReport({
                id: 1,
                reportNumber: "IR-2026/001",
                title: "Laboratuvar Malzemesi Talebi",
            });

            const item = new RequirementItem({
                id: 1,
                reportId: 1,
                sequenceNumber: 1,
                itemName: "Deney Tüpü",
                itemType: "Mal",
                unit: "Adet",
                quantity: 500,
                estimatedUnitPrice: 10,
            });

            report.addItem(item);
            expect(report.items).toHaveLength(1);
            expect(item.estimatedTotal).toBe(5000);

            report.approve();
            expect(report.status).toBe("onaylandi");
        });

        it("belge oluşturulur ve imzalandı olarak işaretlenir", () => {
            const doc = new ProcurementDocument({
                id: 1,
                procurementFileId: 1,
                documentName: "Onay Belgesi",
            });

            expect(doc.isSigned).toBe(false);
            doc.markSigned("/belgeler/onay-belgesi-imzali.pdf");
            expect(doc.isSigned).toBe(true);
            expect(doc.signedFilePath).toBe("/belgeler/onay-belgesi-imzali.pdf");
            expect(doc.status).toBe("tamamlandi");
        });
    });
});
