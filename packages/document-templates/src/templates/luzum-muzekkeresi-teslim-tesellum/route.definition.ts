import type { TemplateRouteDefinition } from "@temin360/contracts";

export const luzumMuzekkeresiTeslimTesellumRoute = {
  templateId: "luzum-muzekkeresi-teslim-tesellum",
  version: 1,
  slots: [
    {
      id: "teslimEden",
      label: "Teslim Eden (Firma / Yetkili)",
      kind: "person",
      defaultSource: "document",
      required: true,
      fieldKey: "teslimEden_0_adSoyad",
      titleFieldKey: "teslimEden_0_unvan",
      sourceFieldKeys: ["teslimEden_0_adSoyad", "teslimEdenPersonelAdi", "yukleniciFirma", "firmaAdi"],
      sourceTitleFieldKeys: ["teslimEden_0_unvan", "teslimEdenPersonelUnvan"],
      description: "Malzemeyi veya işi teslim eden yüklenici firma yetkilisi",
    },
    {
      id: "teslimAlan",
      label: "Teslim Alan Görevliler / Komisyon",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "teslimAlanlar",
      targetFieldKeys: ["teslimAlanlar", "teslimAlanKomisyonu"],
      sourceFieldKeys: [
        "teslimAlanlar",
        "teslimAlanKomisyonu",
        "teslimAlanPersonelAdi",
        "teslimAlanAd",
      ],
      description: "Malzemeyi veya işi teslim alan ambar/depo personeli veya teslim alma komisyonu listesi",
    },
    {
      id: "sunulacakMakam",
      label: "Sunulacak Makam",
      kind: "unit",
      defaultSource: "document",
      required: false,
      fieldKey: "sunulacakMakamAdi",
      targetFieldKeys: ["sunulacakMakam", "muhatapBirim"],
      sourceFieldKeys: ["sunulacakMakamAdi", "sunulacakMakam", "muhatapBirim"],
      description: "Teslim tesellüm tutanağının ait olduğu idari birim veya makam",
    },
  ],
} satisfies TemplateRouteDefinition;
