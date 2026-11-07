/**
 * PİYASA FİYAT ARAŞTIRMASINA ÖZEL ROTA TANIMI
 * Komisyon (Araştırma Görevlileri): person-list => birden çok araştırma görevlisi.
 * Onaylayan: person => tek kişi.
 */
import type { TemplateRouteDefinition } from "@temin360/contracts";

export const piyasaFiyatRoute = {
  templateId: "piyasa-fiyat-arastirma-tutanagi",
  version: 1,
  slots: [
    {
      id: "komisyon",
      label: "Piyasa Fiyat Araştırma Görevlileri",
      kind: "person-list",
      defaultSource: "document",
      required: true,
      fieldKey: "fiyatArastirmaGorevlileri",
      description: "Piyasa fiyat araştırmasını yapan görevli/komisyon listesi",
    },
    {
      id: "onaylayan",
      label: "Onaylayan (Harcama Yetkilisi)",
      kind: "person",
      defaultSource: "settings",
      required: true,
      fieldKey: "onaylayanPersonelAdi",
      titleFieldKey: "onaylayanPersonelUnvan",
      description: "Tutanağı onaylayan harcama yetkilisi",
    },
  ],
} satisfies TemplateRouteDefinition;

