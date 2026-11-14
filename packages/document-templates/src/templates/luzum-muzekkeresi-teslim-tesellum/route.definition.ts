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
      label: "Teslim Alan Görevli / Komisyon",
      kind: "person",
      defaultSource: "document",
      required: true,
      fieldKey: "teslimAlan_0_adSoyad",
      titleFieldKey: "teslimAlan_0_unvan",
      sourceFieldKeys: ["teslimAlan_0_adSoyad", "teslimAlanPersonelAdi", "talepEdenPersonelAdi", "hazirlayanPersonelAdi"],
      sourceTitleFieldKeys: ["teslimAlan_0_unvan", "teslimAlanPersonelUnvan", "talepEdenPersonelUnvan", "hazirlayanPersonelUnvan"],
      description: "Malzemeyi veya işi teslim alan idare personeli veya komisyon üyesi",
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
