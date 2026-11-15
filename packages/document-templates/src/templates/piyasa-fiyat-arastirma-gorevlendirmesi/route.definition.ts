import type { TemplateRouteDefinition } from "@temin360/contracts";

export const piyasaFiyatGorevlendirmeRoute: TemplateRouteDefinition = {
  templateId: "piyasa-fiyat-arastirma-gorevlendirmesi",
  version: 1,
  isAppointmentDocument: true,
  slots: [
    {
      id: "komisyon",
      label: "Piyasa Fiyat Araştırma Görevlileri",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "gorevlendirilenler",
      targetFieldKeys: [
        "fiyatKomisyonu",
        "komisyonUyeleri",
        "gorevliler",
        "dagitimListesi",
      ],
      sourceFieldKeys: [
        "gorevlendirilenler",
        "fiyatKomisyonu",
        "komisyonUyeleri",
        "gorevliler",
        "dagitimListesi",
      ],
      description:
        "Piyasa araştırması yapmak üzere görevlendirilen asıl ve yedek görevliler",
    },
    {
      id: "onaylayan",
      label: "Onay Makamı (Harcama Yetkilisi)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      sourceFieldKeys: ["onaylayanPersonelAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan"],
      description: "Görevlendirmeyi onaylayan harcama yetkilisi",
    },
    {
      id: "antetBirim",
      label: "Antet & Görevlendirme Makamı",
      kind: "unit",
      defaultSource: "settings",
      required: false,
      fieldKey: "kurumAdi",
      targetFieldKeys: ["kurumAdi", "kurumumuz", "altKurumBizim"],
      sourceFieldKeys: ["kurumAdi", "kurumumuz", "harcamaBirimi", "mudurluk"],
      description: "Görevlendirmeyi yapan kurum veya başkanlık antet makamı",
    },
  ],
};
