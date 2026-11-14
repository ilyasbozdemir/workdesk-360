import type { TemplateRouteDefinition } from "@temin360/contracts";

export const luzumMuzekkeresiOnayEkiRoute = {
  templateId: "luzum-muzekkeresi-onay-eki",
  version: 1,
  slots: [
    {
      id: "talepEden",
      label: "Talep Eden Personel",
      kind: "person",
      defaultSource: "document",
      required: true,
      fieldKey: "talepEdenPersonelAdi",
      titleFieldKey: "talepEdenPersonelUnvan",
      sourceFieldKeys: ["talepEdenPersonelAdi", "hazirlayanPersonelAdi"],
      sourceTitleFieldKeys: ["talepEdenPersonelUnvan", "hazirlayanPersonelUnvan"],
      description: "İhtiyacı bildiren ve onay ekini imzalayan personel",
    },
    {
      id: "hazirlayan",
      label: "Hazırlayan Personel",
      kind: "person",
      defaultSource: "document",
      required: false,
      fieldKey: "hazirlayanPersonelAdi",
      titleFieldKey: "hazirlayanPersonelUnvan",
      sourceFieldKeys: ["hazirlayanPersonelAdi", "talepEdenPersonelAdi"],
      sourceTitleFieldKeys: ["hazirlayanPersonelUnvan", "talepEdenPersonelUnvan"],
      description: "Onay ekini teknik olarak hazırlayan görevli personel",
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
      description: "Onay ekinin sunulduğu harcama birimi veya makam",
    },
  ],
} satisfies TemplateRouteDefinition;
