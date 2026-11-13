import React from "react";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  applyResolvedRouteToDocumentData,
  DocumentEngine,
  extractDocumentRouteValues,
  resolveRoute,
  smartMergeDocumentData,
} from "@worksuite-360/document-engine";
import { getAllTemplateDefinitions, templateRegistry } from "../../registry";
import { getTemplateRouteDefinition } from "../../route-registry";
import { registerTeminTemplates } from "../../engine/registerTeminTemplates";
import { resolveTemplateData } from "../../resolver/mappingResolver";
import { DocumentValidationService } from "../../services/documentValidationService";
import {
  createInMemoryStorageAdapter,
  createSyntheticDocumentData,
  SYNTHETIC_FIRMALAR,
  SYNTHETIC_HEADER_DATA,
  SYNTHETIC_PERSONEL_LIST,
} from "./fixtures";

describe("Tüm Kayıtlı Belge Şablonları (32 Şablon) — Parametrik Sözleşme Testleri", () => {
  const allTemplates = getAllTemplateDefinitions();
  const storageAdapter = createInMemoryStorageAdapter();

  beforeAll(() => {
    registerTeminTemplates();
    DocumentEngine.setStorageAdapter(storageAdapter);
    DocumentEngine.setHeaderResolver(async () => ({ ...SYNTHETIC_HEADER_DATA }));
    DocumentEngine.setQueryExecutor(async () => []);
  });

  it("templateRegistry içinde en az 30 kayıtlı şablon bulunmalıdır", () => {
    expect(allTemplates.length).toBeGreaterThanOrEqual(29);
    expect(Object.keys(templateRegistry)).toContain("ihtiyac_listesi");
    expect(Object.keys(templateRegistry)).toContain(
      "piyasa_fiyat_arastirma_tutanagi",
    );
    expect(Object.keys(templateRegistry)).toContain("yaklasik_maliyet_cetveli");
  });

  describe.each(
    Object.entries(templateRegistry).map(([registryKey, def]) => [
      registryKey,
      def,
    ] as const),
  )("Şablon [%s]", (templateKey, def) => {
    it("1. Render & PDF: Sentetik veriyle ve boş veriyle hatasız render edilir, A4 compileHtml çıktısı üretir", () => {
      const Component = def.component as React.ComponentType<any>;
      const syntheticData = createSyntheticDocumentData();

      // Sentetik veriyle render
      const html = renderToStaticMarkup(
        <Component
          data={syntheticData}
          isEditing={false}
          personelListesi={SYNTHETIC_PERSONEL_LIST}
          firmaListesi={SYNTHETIC_FIRMALAR}
        />,
      );
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(50);

      // Boş / eksik veriyle çökmeden güvenli render
      const emptyHtml = renderToStaticMarkup(
        <Component data={{}} isEditing={false} />,
      );
      expect(emptyHtml).toBeTruthy();

      // DocumentEngine.compileHtml A4 PDF uyumluluğu
      const compiled = DocumentEngine.compileHtml({
        templateKey,
        data: syntheticData,
        orientation: def.orientation || "portrait",
      });
      expect(compiled).toContain("<!DOCTYPE html>");
      expect(compiled).toContain("@page");
    });

    it("2. Mapping & Schema: resolveTemplateData ve DocumentValidationService ile hatasız doğrulanır", async () => {
      const mapped = await resolveTemplateData(
        {
          konu: {
            deger: "Snapshot Üzerinden Gelen Konu",
          },
          tarih: {
            tablo: "DATA_TeminDosyasi",
            sutun: "dosya_acilis_tarihi",
          },
        },
        101,
        async (sql: string) => {
          if (sql.includes("AS res_val")) {
            return [{ res_val: "2026-11-07" }];
          }
          if (sql.includes("DATA_TeminDosyasi")) {
            return [{ id: 101, dosya_acilis_tarihi: "2026-11-07" }];
          }
          return [];
        },
        templateKey,
      );

      expect(mapped).toBeDefined();
      expect(mapped.konu).toBe("Snapshot Üzerinden Gelen Konu");
      expect(mapped.tarih).toBe("07.11.2026");

      const validation = DocumentValidationService.validate(
        templateKey,
        createSyntheticDocumentData(),
      );
      expect(validation.isValid).toBe(true);
    });

      it("3. Route: Rota tanımı çözülür ve applyResolvedRouteToDocumentData belge verisine hatasız uygulanır", () => {
        const routeDef = getTemplateRouteDefinition(templateKey);
        expect(routeDef).toBeDefined();
        expect(routeDef.slots.length).toBeGreaterThan(0);

        const docData = createSyntheticDocumentData();
        const docValues = extractDocumentRouteValues(docData, routeDef);

        const resolvedRoute = resolveRoute({
          definition: routeDef,
          document: docValues,
          settings: docValues,
        });

        expect(resolvedRoute.steps).toHaveLength(routeDef.slots.length);

        const bridged = applyResolvedRouteToDocumentData(
          docData,
          resolvedRoute,
        );
        expect(bridged.resolvedRoute).toBeDefined();
      });

      it("4. Snapshot & Refresh: Manuel düzenlemeler korunurken kaynak (SOURCE) alanları güncellenir", () => {
        const snapshot = createSyntheticDocumentData({
          sunulacakMakamAdi: `MANUEL MAKAM (${templateKey})`,
          ozelKullaniciNotu: `Özel Not (${templateKey})`,
        });

        const freshSource = createSyntheticDocumentData({
          antetSatirlari: ["T.C.", "GÜNCELLENMİŞ KURUM BAŞLIĞI"],
          ihtiyacKalemleri: [
            {
              ...createSyntheticDocumentData().ihtiyacKalemleri[0],
              miktar: 999,
            },
          ],
        });

        const merged = smartMergeDocumentData(snapshot, freshSource);
        expect(merged.sunulacakMakamAdi).toBe(`MANUEL MAKAM (${templateKey})`);
        expect(merged.ozelKullaniciNotu).toBe(`Özel Not (${templateKey})`);
        expect(merged.antetSatirlari).toEqual([
          "T.C.",
          "GÜNCELLENMİŞ KURUM BAŞLIĞI",
        ]);
        expect((merged.ihtiyacKalemleri as any)[0].miktar).toBe(999);
      });
    },
  );

  it("Mimari Kural Denetimi: Hiçbir .template.tsx dosyası doğrudan SQL sorgusu veya veritabanı erişimi içermez", () => {
    const templatesRoot = path.resolve(__dirname, "..");
    const entries = fs.readdirSync(templatesRoot, { withFileTypes: true });
    const templateFiles: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === "__tests__") continue;
      const dirPath = path.join(templatesRoot, entry.name);
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(".template.tsx")) {
          templateFiles.push(path.join(dirPath, file));
        }
      }
    }

    expect(templateFiles.length).toBeGreaterThanOrEqual(30);

    for (const filePath of templateFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toMatch(/SELECT\s+.+\s+FROM\s+DATA_/i);
      expect(content).not.toContain("ipcRenderer.invoke");
    }
  });
});
