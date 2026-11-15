import type { TemplateRouteDefinition } from "@temin360/contracts";

export const harcamaPusulasiRoute: TemplateRouteDefinition = {
  templateId: "harcama-pusulasi",
  version: 1,
  slots: [
    {
      id: "onaylayan",
      label: "Harcama Yetkilisi (Onaylayan)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      targetFieldKeys: ["harcamaYetkilisiAdi", "onaylayanPersonelAdi"],
      targetTitleFieldKeys: ["harcamaYetkilisiUnvan", "onaylayanPersonelUnvan"],
      sourceFieldKeys: ["onaylayanPersonelAdi", "harcamaYetkilisiAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan", "harcamaYetkilisiUnvan"],
      description: "Harcama pusulasını onaylayan harcama yetkilisi",
    },
    {
      id: "sunulacakMakam",
      label: "İdare / Harcama Birimi",
      kind: "unit",
      defaultSource: "document",
      required: false,
      fieldKey: "idareAdi",
      targetFieldKeys: ["idareAdi", "harcamaBirimi", "birimAdi"],
      sourceFieldKeys: ["idareAdi", "harcamaBirimi", "birimAdi"],
      description: "Harcama pusulasını düzenleyen idare veya birim",
    },
  ],
};
