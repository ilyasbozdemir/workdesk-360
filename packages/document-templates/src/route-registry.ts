/**
 * ŞABLON BAZLI ROTA REGISTRY
 * Her belge şablonunun (templateId) kendi içerdiği personel, komisyon (person-list) ve
 * birim (unit) slotlarının şemasını tanımlar.
 * Ortak rota paneli (DocumentPreviewRotaSection & RotaYonetimiScreen) seçili
 * şablonun buradaki tanımına göre dinamik form üretir.
 */
import type { TemplateRouteDefinition } from "@temin360/contracts";
import { ihtiyacListesiRoute } from "./templates/ihtiyac-listesi/route.definition";
import { piyasaFiyatRoute } from "./templates/piyasa-fiyat-arastirma-tutanagi/route.definition";
import { yaklasikMaliyetRoute } from "./templates/yaklasik-maliyet-cetveli/route.definition";
import { onayBelgesiRoute } from "./templates/dogrudan-temin-onay-belgesi/route.definition";
import { komisyonGorevlendirmeRoute } from "./templates/komisyon-gorevlendirme-onayi/route.definition";
import { muayeneKabulRoute } from "./templates/muayene-kabul-komisyonu/route.definition";
import { luzumMuzekkeresiRoute } from "./templates/luzum-muzekkeresi/route.definition";
import { toCanonicalDocId } from "./constants/template-constants";
import { resolveTemplateKey } from "./registry";

export {
  ihtiyacListesiRoute,
  piyasaFiyatRoute,
  yaklasikMaliyetRoute,
  onayBelgesiRoute,
  komisyonGorevlendirmeRoute,
  muayeneKabulRoute,
  luzumMuzekkeresiRoute,
};

function normalizeRouteTemplateKey(templateId: string): string {
  const canonical = toCanonicalDocId(templateId);
  const resolved = resolveTemplateKey(canonical || templateId);
  const raw = resolved || canonical || templateId;
  return String(raw).trim().toLowerCase().replace(/_/g, "-");
}

const globalDefaultRoute: TemplateRouteDefinition = {
  templateId: "global-default",
  version: 1,
  slots: [
    {
      id: "hazirlayan",
      label: "Hazırlayan / Düzenleyen",
      kind: "person",
      defaultSource: "document",
      required: false,
      fieldKey: "hazirlayanPersonelAdi",
      titleFieldKey: "hazirlayanPersonelUnvan",
      sourceFieldKeys: ["hazirlayanPersonelAdi", "talepEdenPersonelAdi"],
      sourceTitleFieldKeys: ["hazirlayanPersonelUnvan", "talepEdenPersonelUnvan"],
      description: "Belgeyi hazırlayan yetkili personel",
    },
    {
      id: "onaylayan",
      label: "Onaylayan / Harcama Yetkilisi",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      sourceFieldKeys: ["onaylayanPersonelAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan"],
      description: "Belgeyi onaylayan harcama yetkilisi",
    },
    {
      id: "sunulacakMakam",
      label: "Sunulacak Makam",
      kind: "unit",
      defaultSource: "document",
      required: false,
      fieldKey: "sunulacakMakamAdi",
      targetFieldKeys: ["sunulacakMakam"],
      sourceFieldKeys: ["sunulacakMakamAdi", "sunulacakMakam"],
    },
  ],
};

const BASE_ROUTE_DEFINITIONS: ReadonlyArray<TemplateRouteDefinition> = [
  ihtiyacListesiRoute,
  luzumMuzekkeresiRoute,
  { ...luzumMuzekkeresiRoute, templateId: "luzum_muzekkeresi" },
  yaklasikMaliyetRoute,
  { ...yaklasikMaliyetRoute, templateId: "yaklasik_maliyet" },
  { ...yaklasikMaliyetRoute, templateId: "son-alim-fiyat-cetveli" },
  piyasaFiyatRoute,
  { ...piyasaFiyatRoute, templateId: "piyasa-fiyat-arastirma" },
  { ...piyasaFiyatRoute, templateId: "teklif_cetveli" },
  onayBelgesiRoute,
  { ...onayBelgesiRoute, templateId: "onay_belgesi" },
  { ...onayBelgesiRoute, templateId: "harcama-talimati" },
  { ...onayBelgesiRoute, templateId: "harcama_talimati" },
  { ...onayBelgesiRoute, templateId: "harcama-pusulasi" },
  { ...onayBelgesiRoute, templateId: "odeme-yazisi" },
  komisyonGorevlendirmeRoute,
  { ...komisyonGorevlendirmeRoute, templateId: "komisyon-gorevlendirme-onayi-eki" },
  muayeneKabulRoute,
  { ...muayeneKabulRoute, templateId: "muayene_kabul" },
  { ...muayeneKabulRoute, templateId: "muayene-kabul-komisyonu", isAppointmentDocument: true },
  { ...muayeneKabulRoute, templateId: "kik048-yapim-gecici-kabul-teklif" },
  { ...muayeneKabulRoute, templateId: "kik049-yapim-gecici-kabul-tutanagi" },
  { ...muayeneKabulRoute, templateId: "kik050-yapim-kesin-kabul-teklif" },
  { ...muayeneKabulRoute, templateId: "kik051-yapim-kesin-kabul-tutanagi" },
];

const registryMap = new Map<string, TemplateRouteDefinition>();

for (const def of BASE_ROUTE_DEFINITIONS) {
  if (!registryMap.has(def.templateId)) {
    registryMap.set(def.templateId, def);
  }
  const norm = normalizeRouteTemplateKey(def.templateId);
  if (norm && !registryMap.has(norm)) {
    registryMap.set(norm, def);
  }
}

// Global default
registryMap.set("global-default", globalDefaultRoute);

export function getTemplateRouteDefinition(
  templateId: string | null | undefined,
): TemplateRouteDefinition {
  if (!templateId) return globalDefaultRoute;
  const direct = registryMap.get(templateId);
  if (direct) return direct;

  const normalized = normalizeRouteTemplateKey(templateId);
  const byNorm = registryMap.get(normalized);
  if (byNorm) return byNorm;

  return {
    ...globalDefaultRoute,
    templateId,
  };
}
