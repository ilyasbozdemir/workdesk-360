import type { TemplateRouteDefinition } from "@temin360/contracts";

export const muayeneKabulRoute: TemplateRouteDefinition = {
  templateId: "muayene-kabul-komisyonu",
  version: 1,
  slots: [
    {
      id: "komisyon",
      label: "Muayene ve Kabul Komisyon Üyeleri",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "muayeneKomisyonu",
      targetFieldKeys: ["komisyonUyeleri", "komisyon"],
      sourceFieldKeys: ["muayeneKomisyonu", "komisyonUyeleri", "komisyon"],
      description: "Muayene ve kabul işlemlerini gerçekleştiren komisyon üyeleri",
    },
    {
      id: "onaylayan",
      label: "Onay Makamı (Harcama Yetkilisi)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      targetFieldKeys: ["harcamaYetkilisiAdi"],
      targetTitleFieldKeys: ["harcamaYetkilisiUnvan"],
      sourceFieldKeys: ["onaylayanPersonelAdi", "harcamaYetkilisiAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan", "harcamaYetkilisiUnvan"],
      description: "Muayene kabul tutanağını onaylayan harcama yetkilisi",
    },
  ],
};

