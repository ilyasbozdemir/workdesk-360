/**
 * İHTİYAÇ LİSTESİNE ÖZEL ROTA TANIMI
 * Hazırlayan: aktif dosyadan tek kişi (hazirlayanPersonelAdi / hazirlayanPersonelUnvan).
 * Onaylayan: sistem/şablon ayarlarından veya dosyadan tek kişi (onaylayanPersonelAdi / onaylayanPersonelUnvan).
 * Sunulacak Makam: ilgili birim/makam (sunulacakMakamAdi).
 */
import type { TemplateRouteDefinition } from "@temin360/contracts";

export const ihtiyacListesiRoute = {
  templateId: "ihtiyac-listesi",
  version: 1,
  slots: [
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
      description: "İhtiyaç listesini düzenleyen / teklif eden görevli",
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
      description: "Belge altındaki OLUR bloğunu imzalayan harcama yetkilisi",
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
      description: "Belgenin arz edildiği üst makam / müdürlük",
    },
  ],
} satisfies TemplateRouteDefinition;
