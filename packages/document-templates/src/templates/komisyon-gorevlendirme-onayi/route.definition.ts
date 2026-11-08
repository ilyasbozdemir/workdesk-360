import type { TemplateRouteDefinition } from "@temin360/contracts";

export const komisyonGorevlendirmeRoute: TemplateRouteDefinition = {
  templateId: "komisyon-gorevlendirme-onayi",
  version: 1,
  isAppointmentDocument: true,
  slots: [
    {
      id: "komisyon",
      label: "Görevlendirilen Personel / Komisyon Üyeleri",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "gorevlendirilenler",
      targetFieldKeys: ["fiyatKomisyonu", "muayeneKomisyonu", "komisyonUyeleri"],
      sourceFieldKeys: [
        "gorevlendirilenler",
        "fiyatKomisyonu",
        "muayeneKomisyonu",
        "komisyonUyeleri",
      ],
      description: "Görevlendirme onayında atanan asıl/yedek görevliler",
    },
    {
      id: "onaylayan",
      label: "Onay Makamı (Harcama Yetkilisi)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      targetFieldKeys: ["baskanAdi"],
      targetTitleFieldKeys: ["baskanUnvan"],
      sourceFieldKeys: ["onaylayanPersonelAdi", "baskanAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan", "baskanUnvan"],
      description: "Görevlendirmeyi onaylayan harcama yetkilisi",
    },
  ],
};

