import React from "react";
import { CheckCircle2, FileSignature, Package, Search } from "lucide-react";
import { APP_ROUTES } from "../../../../constants/routeConstants";
import { StepConfig } from "./types";

export const STEPS: StepConfig[] = [
  {
    id: 1,
    label: "İhtiyaç Listesi & Maliyet & Onay",
    shortLabel: "Hazırlık",
    route: APP_ROUTES.HAZIRLIK_VE_IHTIYAC,
    icon: Package,
    docTemplates: [
      "ihtiyac-listesi",
      "dogrudan-temin-onay-belgesi",
      "komisyon-gorevlendirme-onayi",
      "luzum-muzekkeresi",
    ],
  },
  {
    id: 2,
    label: "Piyasa Fiyat Araştırması",
    shortLabel: "Araştırma",
    route: APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI,
    icon: Search,
    docTemplates: [
      "piyasa-fiyat-arastirma-tutanagi",
      "yaklasik-maliyet-hesap-cetveli",
      "teklif-mektubu-dagitim-cizelgesi",
      "fiyat-arastirma-mektubu",
    ],
  },
  {
    id: 3,
    label: "Yüklenici & Sipariş İşlemleri",
    shortLabel: "Yüklenici İşlemleri",
    route: APP_ROUTES.SIPARIS_VE_SOZLESME,
    icon: FileSignature,
    docTemplates: [
      "kabul-edilen-teklif",
      "dogrudan-temin-sozlesmesi",
      "harcama-talimati",
    ],
  },
  {
    id: 4,
    label: "Muayene & Kabul & Ödeme",
    shortLabel: "Muayene & Kabul & Ödeme",
    route: APP_ROUTES.KABUL_VE_ODEME,
    icon: CheckCircle2,
    docTemplates: [
      "muayene-kabul-tutanagi",
      "muayene-kabul-komisyonu",
      "fatura-ve-odeme-belgesi",
    ],
  },
];

export function findCurrentStepIndex(currentRoute: string): number {
  const idx = STEPS.findIndex((s) =>
    currentRoute.includes(s.route.replace("/dosya/", ""))
  );
  return idx >= 0 ? idx : -1;
}
