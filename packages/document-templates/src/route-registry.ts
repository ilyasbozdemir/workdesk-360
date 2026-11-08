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
import { resolveTemplateKey } from "./registry";

export { ihtiyacListesiRoute, piyasaFiyatRoute };

function normalizeRouteTemplateKey(templateId: string): string {
  const resolved = resolveTemplateKey(templateId);
  const raw = resolved || templateId;
  return String(raw).trim().toLowerCase().replace(/_/g, "-");
}

const yaklasikMaliyetRoute: TemplateRouteDefinition = {
  templateId: "yaklasik-maliyet-cetveli",
  version: 1,
  slots: [
    {
      id: "komisyon",
      label: "Yaklaşık Maliyet Görevlileri / Komisyonu",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "komisyonUyeleri",
      targetFieldKeys: ["komisyon"],
      sourceFieldKeys: ["komisyonUyeleri", "komisyon", "gorevlendirilenler"],
      description: "Yaklaşık maliyet hesap cetvelini imzalayan görevliler",
    },
    {
      id: "onaylayan",
      label: "Onaylayan (Harcama Yetkilisi / OLUR)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      targetFieldKeys: ["baskanAdi"],
      targetTitleFieldKeys: ["baskanUnvan"],
      sourceFieldKeys: ["onaylayanPersonelAdi", "baskanAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan", "baskanUnvan"],
      description: "Cetveli onaylayan harcama yetkilisi",
    },
  ],
};

const onayBelgesiRoute: TemplateRouteDefinition = {
  templateId: "dogrudan-temin-onay-belgesi",
  version: 1,
  slots: [
    {
      id: "gerceklestirmeGorevlisi",
      label: "Gerçekleştirme Görevlisi (Arz Eden)",
      kind: "person",
      defaultSource: "document",
      required: true,
      fieldKey: "hazirlayanPersonelAdi",
      titleFieldKey: "hazirlayanPersonelUnvan",
      targetFieldKeys: ["gerceklestirmeGorevlisiAdi"],
      targetTitleFieldKeys: ["gerceklestirmeGorevlisiUnvani", "gerceklestirmeGorevlisiUnvan"],
      sourceFieldKeys: ["gerceklestirmeGorevlisiAdi", "hazirlayanPersonelAdi"],
      sourceTitleFieldKeys: [
        "gerceklestirmeGorevlisiUnvani",
        "gerceklestirmeGorevlisiUnvan",
        "hazirlayanPersonelUnvan",
      ],
      description: "Onay belgesini hazırlayıp onaya arz eden gerçekleştirme görevlisi",
    },
    {
      id: "onaylayan",
      label: "Harcama Yetkilisi (UYGUNDUR / Onaylayan)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      targetFieldKeys: ["harcamaYetkilisiAdi"],
      targetTitleFieldKeys: ["harcamaYetkilisiUnvan"],
      sourceFieldKeys: ["onaylayanPersonelAdi", "harcamaYetkilisiAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan", "harcamaYetkilisiUnvan"],
      description: "Onay belgesini UYGUNDUR diyerek onaylayan harcama yetkilisi",
    },
    {
      id: "sunulacakMakam",
      label: "Onay Makamı Başlığı",
      kind: "unit",
      defaultSource: "document",
      required: false,
      fieldKey: "sunulacakMakamAdi",
      targetFieldKeys: ["sunulacakMakam", "muhatapBirim"],
      sourceFieldKeys: ["sunulacakMakamAdi", "sunulacakMakam", "muhatapBirim"],
      description: "Belgenin sunulduğu makam başlığı",
    },
  ],
};

const komisyonGorevlendirmeRoute: TemplateRouteDefinition = {
  templateId: "komisyon-gorevlendirme-onayi",
  version: 1,
  isAppointmentDocument: true,
  slots: [
    {
      id: "komisyon",
      label: "Görevlendirilen Komisyon Üyeleri",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "komisyonUyeleri",
      targetFieldKeys: ["komisyon"],
      sourceFieldKeys: [
        "komisyonUyeleri",
        "fiyatArastirmaGorevlileri",
        "komisyon",
        "gorevlendirilenler",
      ],
      description: "Komisyonda görevlendirilen başkan ve üyeler",
    },
    {
      id: "hazirlayan",
      label: "Hazırlayan / Teklif Eden",
      kind: "person",
      defaultSource: "document",
      required: false,
      fieldKey: "hazirlayanPersonelAdi",
      titleFieldKey: "hazirlayanPersonelUnvan",
      sourceFieldKeys: ["hazirlayanPersonelAdi", "talepEdenPersonelAdi"],
      sourceTitleFieldKeys: ["hazirlayanPersonelUnvan", "talepEdenPersonelUnvan"],
      description: "Görevlendirme yazısını hazırlayan personel",
    },
    {
      id: "onaylayan",
      label: "Onaylayan Makam (OLUR)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      targetFieldKeys: ["harcamaYetkilisiAdi"],
      targetTitleFieldKeys: ["harcamaYetkilisiUnvan"],
      sourceFieldKeys: ["onaylayanPersonelAdi", "harcamaYetkilisiAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan", "harcamaYetkilisiUnvan"],
      description: "Görevlendirmeyi onaylayan harcama yetkilisi",
    },
    {
      id: "sunulacakMakam",
      label: "Sunulacak Makam",
      kind: "unit",
      defaultSource: "document",
      required: false,
      fieldKey: "sunulacakMakamAdi",
      targetFieldKeys: ["sunulacakMakam"],
      sourceFieldKeys: ["sunulacakMakamAdi", "sunulacakMakam", "muhatapBirim"],
    },
  ],
};

const muayeneKabulRoute: TemplateRouteDefinition = {
  templateId: "muayene-kabul-tutanagi",
  version: 1,
  slots: [
    {
      id: "muayeneKomisyonu",
      label: "Muayene ve Kabul Komisyonu Görevlileri",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "muayeneKomisyonu",
      targetFieldKeys: ["komisyon"],
      sourceFieldKeys: ["muayeneKomisyonu", "komisyon", "komisyonUyeleri"],
      description: "Mal/hizmet muayene ve kabulünü yapan komisyon üyeleri",
    },
    {
      id: "onaylayan",
      label: "Onaylayan (Harcama Yetkilisi / OLUR)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      targetFieldKeys: ["baskanAdi"],
      targetTitleFieldKeys: ["baskanUnvan"],
      sourceFieldKeys: ["onaylayanPersonelAdi", "baskanAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan", "baskanUnvan"],
      description: "Muayene ve kabul tutanağını onaylayan yetkili",
    },
  ],
};

const globalDefaultRoute: TemplateRouteDefinition = {
  templateId: "__global__",
  version: 1,
  slots: [
    {
      id: "hazirlayan",
      label: "Hazırlayan / Düzenleyen Personel",
      kind: "person",
      defaultSource: "document",
      required: true,
      fieldKey: "hazirlayanPersonelAdi",
      titleFieldKey: "hazirlayanPersonelUnvan",
      sourceFieldKeys: ["hazirlayanPersonelAdi", "talepEdenPersonelAdi"],
      sourceTitleFieldKeys: ["hazirlayanPersonelUnvan", "talepEdenPersonelUnvan"],
      description: "Belgeleri hazırlayan varsayılan görevli personel",
    },
    {
      id: "gerceklestirmeGorevlisi",
      label: "Gerçekleştirme Görevlisi",
      kind: "person",
      defaultSource: "document",
      required: false,
      fieldKey: "gerceklestirmeGorevlisiAdi",
      titleFieldKey: "gerceklestirmeGorevlisiUnvani",
      targetFieldKeys: ["gerceklestirmeGorevlisiUnvan"],
      sourceFieldKeys: ["gerceklestirmeGorevlisiAdi"],
      sourceTitleFieldKeys: ["gerceklestirmeGorevlisiUnvani", "gerceklestirmeGorevlisiUnvan"],
      description: "Onay ve harcama belgelerindeki gerçekleştirme görevlisi",
    },
    {
      id: "onaylayan",
      label: "Onaylayan / Harcama Yetkilisi (OLUR)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      sourceFieldKeys: ["onaylayanPersonelAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan"],
      description: "Belgeleri onaylayan varsayılan harcama yetkilisi",
    },
    {
      id: "komisyon",
      label: "Komisyon / Araştırma Görevlileri",
      kind: "person-list",
      defaultSource: "document",
      required: false,
      fieldKey: "komisyonUyeleri",
      targetFieldKeys: ["komisyon"],
      sourceFieldKeys: ["komisyonUyeleri", "komisyon", "gorevlendirilenler"],
      description: "Komisyon ve tutanak belgelerinde görev alacak varsayılan heyet",
    },
    {
      id: "sunulacakMakam",
      label: "Sunulacak Makam",
      kind: "unit",
      defaultSource: "document",
      required: false,
      fieldKey: "sunulacakMakamAdi",
      targetFieldKeys: ["sunulacakMakam"],
      sourceFieldKeys: ["sunulacakMakamAdi", "sunulacakMakam", "muhatapBirim"],
      description: "Belgelerin arz edildiği varsayılan makam adı",
    },
  ],
};

const BASE_ROUTE_DEFINITIONS: ReadonlyArray<TemplateRouteDefinition> = [
  globalDefaultRoute,
  ihtiyacListesiRoute,
  piyasaFiyatRoute,
  { ...piyasaFiyatRoute, templateId: "piyasa-fiyat-arastirma" },
  { ...piyasaFiyatRoute, templateId: "teklif_cetveli" },
  yaklasikMaliyetRoute,
  { ...yaklasikMaliyetRoute, templateId: "yaklasik_maliyet" },
  { ...yaklasikMaliyetRoute, templateId: "son-alim-fiyat-cetveli" },
  onayBelgesiRoute,
  { ...onayBelgesiRoute, templateId: "onay_belgesi" },
  { ...onayBelgesiRoute, templateId: "harcama-talimati" },
  { ...onayBelgesiRoute, templateId: "harcama_talimati" },
  { ...onayBelgesiRoute, templateId: "harcama-pusulasi" },
  { ...onayBelgesiRoute, templateId: "odeme-yazisi" },
  komisyonGorevlendirmeRoute,
  { ...komisyonGorevlendirmeRoute, templateId: "komisyon-gorevlendirme-onayi-eki" },
  {
    ...komisyonGorevlendirmeRoute,
    templateId: "piyasa-fiyat-arastirma-gorevlendirmesi",
    slots: [
      {
        id: "komisyon",
        label: "Görevlendirilen Araştırma Görevlileri",
        kind: "person-list",
        defaultSource: "document",
        required: true,
        fieldKey: "fiyatArastirmaGorevlileri",
        targetFieldKeys: ["komisyon", "fiyatKomisyonu"],
        sourceFieldKeys: [
          "fiyatArastirmaGorevlileri",
          "komisyon",
          "fiyatKomisyonu",
          "gorevliler",
        ],
        description: "Piyasa fiyat araştırması için görevlendirilen personeller",
      },
      ...komisyonGorevlendirmeRoute.slots.slice(1),
    ],
  },
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
  registryMap.set(def.templateId, def);
  registryMap.set(def.templateId.replace(/_/g, "-"), def);
  registryMap.set(def.templateId.replace(/-/g, "_"), def);
}

/**
 * Verilen templateId için şablon bazlı rota tanımını döndürür.
 * Özel tanımı olmayan standart yazışma/talep şablonları için
 * (Hazırlayan + Onaylayan + Sunulacak Makam) şemasını üretir.
 */
export function getTemplateRouteDefinition(
  templateId?: string | null,
): TemplateRouteDefinition {
  if (!templateId || templateId === "__global__") {
    return globalDefaultRoute;
  }

  const direct =
    registryMap.get(templateId) ||
    registryMap.get(normalizeRouteTemplateKey(templateId));
  if (direct) {
    return direct;
  }

  const clean = normalizeRouteTemplateKey(templateId);
  if (clean.includes("piyasa-fiyat") && clean.includes("tutanak")) {
    return { ...piyasaFiyatRoute, templateId };
  }
  if (clean.includes("yaklasik") || clean.includes("maliyet")) {
    return { ...yaklasikMaliyetRoute, templateId };
  }
  if (clean.includes("muayene") || clean.includes("kabul")) {
    return {
      ...muayeneKabulRoute,
      templateId,
      isAppointmentDocument: clean.includes("komisyon"),
    };
  }
  if (clean.includes("komisyon")) {
    return { ...komisyonGorevlendirmeRoute, templateId };
  }
  if (clean.includes("onay-belgesi") || clean.includes("harcama")) {
    return { ...onayBelgesiRoute, templateId };
  }

  return {
    ...ihtiyacListesiRoute,
    templateId,
  };
}
