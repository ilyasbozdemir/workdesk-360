import type { TemplateRouteDefinition } from "@temin360/contracts";

export const yaklasikMaliyetRoute: TemplateRouteDefinition = {
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

