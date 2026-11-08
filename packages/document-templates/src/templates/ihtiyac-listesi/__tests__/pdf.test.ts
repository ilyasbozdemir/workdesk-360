import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DocumentEngine } from "@worksuite-360/document-engine";
import { registerTeminTemplates } from "../../../engine/registerTeminTemplates";
import {
  createSyntheticDocumentData,
  extractRenderedPages,
} from "../../__tests__/fixtures";

describe("İhtiyaç Listesi — HTML / PDF Üretim Sözleşmesi ve Mimari Sınır Testleri (pdf.test.ts)", () => {
  it("1. DocumentEngine.compileHtml dikey (portrait) ve yatay (landscape) A4 sayfa boyutlarını ve yazdırma kurallarını üretir", () => {
    registerTeminTemplates();
    const data = createSyntheticDocumentData();

    const portraitHtml = DocumentEngine.compileHtml({
      templateKey: "ihtiyac-listesi",
      data,
      orientation: "portrait",
    });

    expect(portraitHtml).toContain("<!DOCTYPE html>");
    expect(portraitHtml).toContain("size: 210mm 297mm;");
    expect(portraitHtml).toContain(".screen-page-badge");
    expect(portraitHtml).toContain("display: none !important;");

    const landscapeHtml = DocumentEngine.compileHtml({
      templateKey: "ihtiyac-listesi",
      data,
      orientation: "landscape",
    });

    expect(landscapeHtml).toContain("size: 297mm 210mm;");
    const pages = extractRenderedPages(landscapeHtml);
    expect(pages).toHaveLength(1);
    expect(pages[0].orientation).toBe("landscape");
  });

  it("2. Çok sayfalı derlenen HTML çıktısında ara sayfalarda page-break-after:always, son sayfada page-break-after:avoid uygulanır", () => {
    registerTeminTemplates();
    const cokluKalemler = Array.from({ length: 18 }, (_, i) => ({
      id: i + 1,
      siraNo: i + 1,
      kodu: `150.01.${String(i + 1).padStart(2, "0")}`,
      malzemeAdi: `PDF Kalemi ${i + 1}`,
      ozelligi: "Standart",
      birimi: "Adet",
      kdvOrani: 20,
      miktar: 5,
    }));

    const fullHtml = DocumentEngine.compileHtml({
      templateKey: "ihtiyac-listesi",
      data: createSyntheticDocumentData({
        ihtiyacKalemleri: cokluKalemler,
        firstPageLimit: 8,
        middlePageLimit: 8,
        lastPageLimit: 8,
      }),
      orientation: "portrait",
    });

    const pages = extractRenderedPages(fullHtml);
    expect(pages.length).toBeGreaterThan(1);

    for (let i = 0; i < pages.length - 1; i++) {
      expect(pages[i].html).toContain("page-break-after:always");
    }
    expect(pages[pages.length - 1].html).toContain("page-break-after:avoid");
    expect(pages[pages.length - 1].html).toContain("Selin YILMAZ");
  });

  it("3. Sorumluluk ayrımı: IhtiyacListesi.template.tsx yalnızca çizimden sorumludur; veritabanı sorgusu, DocumentEngine veya parasal çarpım içermez", () => {
    const templatePath = path.resolve(
      __dirname,
      "../IhtiyacListesi.template.tsx",
    );
    const source = fs.readFileSync(templatePath, "utf-8");

    expect(source).not.toContain("SELECT ");
    expect(source).not.toContain("ipcRenderer");
    expect(source).not.toContain("DocumentEngine");
    expect(source).not.toMatch(/birimFiyat\s*\*\s*miktar/);
  });
});

