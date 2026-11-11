import React from "react";
import {
  DocumentEngine,
  TemplateRegistry,
} from "@worksuite-360/document-engine";
import { InstitutionalHeaderProvider } from "../header";
import { resolveTemplateKey, TemplateKey, templateRegistry } from "../registry";
import { DocumentValidationService } from "../services/documentValidationService";
import { resolveEvrakSayisi } from "../resolver/helpers/resolveEvrakSayisi";
import { LuzumMuzekkeresiResolver } from "./resolvers/LuzumMuzekkeresiResolver";
import { LuzumMuzekkeresiRenderer } from "./renderers/LuzumMuzekkeresiRenderer";
import { IhtiyacListesiResolver } from "./resolvers/IhtiyacListesiResolver";
import { IhtiyacListesiRenderer } from "./renderers/IhtiyacListesiRenderer";
import { IhtiyacTalepFormuResolver } from "./resolvers/IhtiyacTalepFormuResolver";
import { IhtiyacTalepFormuRenderer } from "./renderers/IhtiyacTalepFormuRenderer";
import { DefaultDocumentResolver } from "./resolvers/DefaultDocumentResolver";
import { DefaultDocumentRenderer } from "./renderers/DefaultDocumentRenderer";

/**
 * TEMİN 360 Belge Şablonlarını ve Çözümleyicilerini Document Engine'e Enjekte Eder (IoC)
 * - Uygulama açılışında veya test ortamında çalıştırılır.
 * - Document Engine'in Temin 360'a bağımlı olmasını önler; şablonları dışarıdan kayıt eder.
 */
export interface ConfigureTeminEngineOptions {
  registry?: TemplateRegistry;
}

/**
 * Document Engine'i Temin 360 ortamına göre tek elden yapılandırır.
 * - DETSİS Evrak Sayısı üreticisini bağlar
 * - Zod validatörünü bağlar
 * - Kurumsal Antet sağlayıcısını bağlar (InstitutionalHeaderProvider)
 * - Tüm şablon tanımlarını kayıt defterine yükler
 */
export function configureTeminEngine(opts: ConfigureTeminEngineOptions = {}): void {
  // 1. Kurumsal antet sağlayıcısına DETSİS evrak sayısı üreticiyi bağla
  InstitutionalHeaderProvider.setEvrakSayisiResolver(resolveEvrakSayisi);

  // 2. Document Engine'e Zod şema validatörünü bağla
  DocumentEngine.setValidator((templateKey, data) => {
    const canonicalKey = (resolveTemplateKey(templateKey) as string) || templateKey;
    const report = DocumentValidationService.validate(canonicalKey, data);
    return {
      isValid: !report.hasErrors,
      errors: report.errors.map((e) => ({
        path: e.field || "",
        message: e.message,
        code: e.code,
      })),
      warnings: report.warnings.map((w) => ({
        path: w.field || "",
        message: w.message,
      })),
    };
  });

  // 3. Document Engine'e kurumsal antet sağlayıcısını bağla (IoC)
  DocumentEngine.setHeaderProvider(new InstitutionalHeaderProvider());

  // 4. Şablonları kayıt defterine enjekte et
  registerTeminTemplates(opts.registry);
}

export function registerTeminTemplates(
  registry: TemplateRegistry = TemplateRegistry.default,
): void {
  // 1. Pilot Belge: Lüzum Müzekkeresi (Tam İzolasyonlu Resolver & Renderer)
  registry.register(
    {
      templateKey: "luzum_muzekkeresi",
      name: "LuzumMuzekkeresi",
      title: "Standart Form: Lüzum Müzekkeresi",
      category: "1-ihtiyac-tespiti-ve-baslangic",
      categoryLabel: "Hazırlık & İhtiyaç",
      description:
        "Harcama yetkilisinden alım onayının talep edildiği resmî başlangıç müzekkeresi",
      orientation: "portrait",
      resolver: new LuzumMuzekkeresiResolver(),
      renderer: LuzumMuzekkeresiRenderer,
      requiredProviders: ["institutionalHeader", "items"],
    },
    { allowOverride: true },
  );

  // 4. Çekirdek Belge: İhtiyaç Listesi (Tam İzolasyonlu Resolver & Renderer)
  registry.register(
    {
      templateKey: "ihtiyac_listesi",
      name: "IhtiyacListesi",
      title: "Standart Form: İhtiyaç Listesi Cetveli",
      category: "1-ihtiyac-tespiti-ve-baslangic",
      categoryLabel: "Hazırlık & İhtiyaç",
      description:
        "Alımı yapılacak mal/hizmet kalemlerinin detaylı ihtiyaç tablosu",
      orientation: "portrait",
      resolver: new IhtiyacListesiResolver(),
      renderer: IhtiyacListesiRenderer,
      requiredProviders: ["institutionalHeader", "items"],
    },
    { allowOverride: true },
  );

  // 4.1 İhtiyaç Talep Formu (Tam İzolasyonlu Resolver & Renderer)
  registry.register(
    {
      templateKey: "ihtiyac_talep_formu",
      name: "IhtiyacTalepFormu",
      title: "Standart Form: İhtiyaç Belgesi ve Harcama Talep Müzekkeresi",
      category: "1-ihtiyac-tespiti-ve-baslangic",
      categoryLabel: "Hazırlık & İhtiyaç",
      description:
        "Birimlerin mal/hizmet taleplerini yetkili makama ilettiği resmi form",
      orientation: "portrait",
      resolver: new IhtiyacTalepFormuResolver(),
      renderer: IhtiyacTalepFormuRenderer,
      requiredProviders: ["institutionalHeader", "items"],
    },
    { allowOverride: true },
  );

  // 5. Diğer Şablonlar (Kademeli Geçiş Adaptörü)
  if (templateRegistry) {
    const baseKeys = Object.keys(templateRegistry) as TemplateKey[];
    for (const key of baseKeys) {
      const canonicalKey = (resolveTemplateKey(key) as string) || key;
      if (!registry.has(canonicalKey)) {
        const baseDef = (templateRegistry as any)[key];
        if (baseDef) {
          const defaultResolver = new DefaultDocumentResolver();
          const defaultRenderer = (props: any) =>
            React.createElement(DefaultDocumentRenderer, {
              ...props,
              templateKey: key,
            });

          registry.register(
            {
              templateKey: key,
              name: baseDef.name || key,
              title: baseDef.title || key,
              category: baseDef.category || "diger",
              categoryLabel: baseDef.categoryLabel || "Diğer",
              description: baseDef.description || "",
              orientation: baseDef.orientation || "portrait",
              resolver: defaultResolver,
              renderer: defaultRenderer,
            },
            { allowOverride: true },
          );
        }
      }
    }

    // 6. Şablon kimliği (definition.id) registry anahtarından farklıysa alias olarak bağla
    //    (örn. luzum_onay_eki ↔ luzum-muzekkeresi-onay-eki). Mevcut ID'ler değişmez.
    for (const key of baseKeys) {
      const baseDef = (templateRegistry as any)[key];
      const canonicalKey = (resolveTemplateKey(key) as string) || key;
      if (baseDef?.id && registry.has(canonicalKey)) {
        registry.registerAlias(baseDef.id, canonicalKey);
      }
    }
  }
}
