/**
 * LÜZUM MÜZEKKERESİNE ÖZEL ROTA TANIMI
 * Talep Eden: aktif dosyadan tek kişi (talepEdenPersonelAdi / talepEdenPersonelUnvan).
 * Hazırlayan: aktif dosyadan tek kişi (hazirlayanPersonelAdi / hazirlayanPersonelUnvan).
 * Onaylayan: sistem/şablon ayarlarından veya dosyadan tek kişi (onaylayanPersonelAdi / onaylayanPersonelUnvan).
 * Sunulacak Makam: ilgili birim/makam (sunulacakMakamAdi).
 */
import type { TemplateRouteDefinition } from "@temin360/contracts";

export const luzumMuzekkeresiRoute = {
  templateId: "luzum-muzekkeresi",
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
      description: "İhtiyacı bildiren ve müzekkereyi üst makama arz eden personel",
    },
    {
      id: "hazirlayan",
      label: "Hazırlayan Personel",
      kind: "person",
      defaultSource: "document",
      required: true,
      fieldKey: "hazirlayanPersonelAdi",
      titleFieldKey: "hazirlayanPersonelUnvan",
      sourceFieldKeys: ["hazirlayanPersonelAdi", "talepEdenPersonelAdi"],
      sourceTitleFieldKeys: ["hazirlayanPersonelUnvan", "talepEdenPersonelUnvan"],
      description: "Müzekkereyi teknik ve idari olarak hazırlayan görevli",
    },
    {
      id: "onaylayan",
      label: "Onaylayan (OLUR Makamı)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      sourceFieldKeys: ["onaylayanPersonelAdi"],
      sourceTitleFieldKeys: ["onaylayanPersonelUnvan"],
      description: "Belge altındaki OLUR onayını veren harcama yetkilisi",
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
      description: "Müzekkerenin sunulduğu üst makam veya harcama yetkililiği",
    },
  ],
} satisfies TemplateRouteDefinition;
