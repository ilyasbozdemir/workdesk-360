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
      id: "hazirlayan",
      label: "Teklif Eden / Hazırlayan Personel",
      kind: "person",
      defaultSource: "document",
      required: false,
      fieldKey: "hazirlayanPersonelAdi",
      titleFieldKey: "hazirlayanPersonelUnvan",
      sourceFieldKeys: ["hazirlayanPersonelAdi", "talepEdenPersonelAdi"],
      sourceTitleFieldKeys: ["hazirlayanPersonelUnvan", "talepEdenPersonelUnvan"],
      description: "Görevlendirme olurunu teklif eden / hazırlayan personel",
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
  ],
};
