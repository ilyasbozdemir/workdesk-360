import type { TemplateRouteDefinition } from "@temin360/contracts";

export const onayBelgesiRoute: TemplateRouteDefinition = {
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

