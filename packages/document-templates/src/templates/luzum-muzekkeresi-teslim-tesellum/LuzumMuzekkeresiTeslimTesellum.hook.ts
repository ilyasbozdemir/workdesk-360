import { useMemo } from "react";
import {
  ColumnDef,
  getTemplateTableColumns,
} from "../../document/DocumentTable";
import {
  PageLimitConfig,
  paginateData,
} from "../../document/DynamicPaginatedTable";
import { toTrDate } from "../../document/ApprovalSignature";
import { LuzumMuzekkeresiTeslimTesellumType } from "./LuzumMuzekkeresiTeslimTesellum.schema";

export interface ProcessedTeslimKalem {
  id?: number | string;
  siraNo: number;
  kodu: string;
  tasinirKodu?: string;
  pozNo?: string;
  hizmetKodu?: string;
  malzemeAdi: string;
  kalemAdi?: string;
  imalatAdi?: string;
  hizmetAdi?: string;
  danismanlikKonusu?: string;
  ozelligi: string;
  teknikTarifi?: string;
  aciklama?: string;
  birimi: string;
  birim?: string;
  olcuBirimi?: string;
  kdvOrani: string;
  miktar: string;
  miktarRaw: number;
  [key: string]: any;
}

export interface UseLuzumTeslimTesellumParams {
  data?: Partial<LuzumMuzekkeresiTeslimTesellumType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export interface UseLuzumTeslimTesellumResult {
  tableColumns: ColumnDef[];
  limits: PageLimitConfig;
  items: ProcessedTeslimKalem[];
  pages: ProcessedTeslimKalem[][];
  tarih: string;
  defaultToday: string;
  dosyaKonusuMetni: string;
  fallbackKurum: string;
  kurumumuzMetni: string;
  isinAdiMetni: string;
  firmaUnvan: string;
  teslimEdenlerList: Array<{ adSoyad: string; unvan: string; [key: string]: any }>;
  teslimAlanlarList: Array<{ adSoyad: string; unvan: string; [key: string]: any }>;
  getStartIndex: (pageIdx: number) => number;
}

export function formatTurkishNumber(val: any): string {
  if (val === undefined || val === null || val === "") return "0";

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.includes(".") && trimmed.includes(",")) {
      return trimmed;
    }
    const parsed = Number(trimmed.replace(",", "."));
    if (!Number.isNaN(parsed)) {
      return parsed.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
    }
    return trimmed;
  }

  if (typeof val === "number") {
    return val.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  }

  return String(val);
}

export function normalizeTeslimKalemleri(
  data: Record<string, any> = {},
): ProcessedTeslimKalem[] {
  const rawList: any[] =
    (Array.isArray(data.ihtiyacKalemleri) && data.ihtiyacKalemleri.length > 0 &&
      data.ihtiyacKalemleri) ||
    (Array.isArray(data.kalemler) && data.kalemler.length > 0 &&
      data.kalemler) ||
    (Array.isArray(data.malzemeler) && data.malzemeler.length > 0 &&
      data.malzemeler) ||
    (Array.isArray(data.items) && data.items.length > 0 && data.items) ||
    [];

  return rawList.map((k: any, idx: number) => {
    const miktarFormatted = formatTurkishNumber(k.miktar ?? 1);
    const miktarRaw = typeof k.miktar === "number"
      ? k.miktar
      : Number(String(k.miktar || "1").replace(",", ".")) || 1;

    const rawKdv = k.kdvOrani ?? k.kdv ?? k.kdv_orani;
    const kdvFormatted = rawKdv !== undefined && rawKdv !== null && String(rawKdv).trim() !== ""
      ? `%${String(rawKdv).replace("%", "")}`
      : "-";

    const ad = k.malzemeAdi || k.kalemAdi || k.hizmetAdi || k.imalatAdi || k.danismanlikKonusu || k.ad || "";
    const kod = k.kodu || k.tasinirKodu || k.pozNo || k.hizmetKodu || "";
    const ozellik = k.ozelligi || k.teknikTarifi || k.aciklama || "";
    const birim = k.birimi || k.birim || k.olcuBirimi || "Adet";

    return {
      ...k,
      siraNo: k.siraNo || idx + 1,
      kodu: kod,
      malzemeAdi: ad,
      ozelligi: ozellik,
      birimi: birim,
      kdvOrani: kdvFormatted,
      miktar: miktarFormatted,
      miktarRaw,
    };
  });
}

export function useLuzumMuzekkeresiTeslimTesellum(
  params: UseLuzumTeslimTesellumParams = {},
): UseLuzumTeslimTesellumResult {
  const {
    data = {},
    columns: customColumns,
    firstPageLimit,
    middlePageLimit,
    lastPageLimit,
  } = params;

  const defaultToday = useMemo(
    () => toTrDate(new Date().toISOString().split("T")[0]),
    [],
  );

  const tarih = useMemo(() => {
    return (data as any).tarih || data.dosyaTarihi || (data as any).onayaSunulanTarih || defaultToday;
  }, [data, defaultToday]);

  const limits: PageLimitConfig = useMemo(() => {
    return {
      firstPage: firstPageLimit ?? 10,
      middle: middlePageLimit ?? 15,
      lastPage: lastPageLimit ?? 8,
    };
  }, [firstPageLimit, middlePageLimit, lastPageLimit]);

  const items = useMemo(() => normalizeTeslimKalemleri(data), [data]);
  const pages = useMemo(() => paginateData(items, limits), [items, limits]);

  const tableColumns = useMemo(() => {
    if (customColumns && customColumns.length > 0) {
      return customColumns;
    }
    return [
      { key: "siraNo", label: "S.No", width: "6%", align: "center" as const },
      { key: "kodu", label: "Kodu", width: "12%", align: "left" as const },
      { key: "malzemeAdi", label: "Malzeme Adı", width: "30%", align: "left" as const },
      { key: "ozelligi", label: "Özelliği", width: "20%", align: "left" as const },
      { key: "birimi", label: "Birimi", width: "10%", align: "center" as const },
      { key: "kdvOrani", label: "KDV Oranı (%)", width: "12%", align: "center" as const },
      { key: "miktar", label: "Miktar", width: "10%", align: "center" as const },
    ];
  }, [customColumns]);

  const dosyaKonusuMetni = data.dosyaKonusu ?? data.isinAdi ?? "TESLİM TESELLÜM BELGESİ";
  const fallbackKurum = (data as any).altKurumBizim || (data as any).kurumBizim || "İdaremiz";
  const kurumumuzMetni = data.kurumumuz && data.kurumumuz !== "Belediyemiz" ? data.kurumumuz : fallbackKurum;
  const isinAdiMetni = data.isinAdi ?? "Doğrudan Temin";

  const firmaListesi: any[] = (data as any).firmaListesi || [];
  const winnerFirm = firmaListesi.find((f: any) => f.isWinner || f.kazandi_mi) || firmaListesi[0];
  const firmaUnvan = data.yukleniciFirma || (data as any).kazananFirma || (data as any).firmaAdi || winnerFirm?.unvan || "";

  const teslimEdenlerList = useMemo(() => {
    const raw = data.teslimEdenler && data.teslimEdenler.length > 0
      ? data.teslimEdenler
      : [
        {
          adSoyad: (data as any).teslimEden_0_adSoyad || (data as any).teslimEdenPersonelAdi || firmaUnvan || "",
          unvan: (data as any).teslimEden_0_unvan || (data as any).teslimEdenPersonelUnvan || (firmaUnvan ? "Yüklenici Firma / Yetkilisi" : ""),
        },
      ];

    return raw.map((item: any, idx: number) => {
      const overrideAd = (data as any)[`teslimEden_${idx}_adSoyad`];
      const overrideUnvan = (data as any)[`teslimEden_${idx}_unvan`];
      const ad =
        overrideAd !== undefined
          ? overrideAd
          : item.adSoyad || firmaUnvan || "";
      const unv =
        overrideUnvan !== undefined
          ? overrideUnvan
          : item.unvan || (ad ? "Yüklenici Firma / Yetkilisi" : "");
      return { ...item, adSoyad: ad, unvan: unv };
    });
  }, [data, firmaUnvan]);

  const teslimAlanlarList = useMemo(() => {
    const raw =
      data.teslimAlanlar && data.teslimAlanlar.length > 0
        ? data.teslimAlanlar
        : [
            {
              adSoyad:
                (data as any).teslimAlan_0_adSoyad !== undefined
                  ? (data as any).teslimAlan_0_adSoyad
                  : (data as any).teslimAlanPersonelAdi ||
                    (data as any).teslimAlanAd ||
                    "",
              unvan:
                (data as any).teslimAlan_0_unvan !== undefined
                  ? (data as any).teslimAlan_0_unvan
                  : (data as any).teslimAlanPersonelUnvan ||
                    (data as any).teslimAlanUnvan ||
                    "",
            },
          ];

    return raw.map((item: any, idx: number) => {
      const overrideAd = (data as any)[`teslimAlan_${idx}_adSoyad`];
      const overrideUnvan = (data as any)[`teslimAlan_${idx}_unvan`];
      const ad =
        overrideAd !== undefined
          ? overrideAd
          : item.adSoyad ||
            item.name ||
            item.ad_soyad ||
            "";
      const unv =
        overrideUnvan !== undefined
          ? overrideUnvan
          : item.unvan ||
            item.title ||
            item.gorev ||
            item.komisyonGorevi ||
            "";
      return {
        ...item,
        adSoyad: String(ad),
        unvan: String(unv),
      };
    });
  }, [data]);

  const getStartIndex = (pageIdx: number): number => {
    if (pageIdx === 0) return 0;
    return (limits.firstPage || 10) + (pageIdx - 1) * (limits.middle || 15);
  };

  return {
    tableColumns,
    limits,
    items,
    pages,
    tarih,
    defaultToday,
    dosyaKonusuMetni,
    fallbackKurum,
    kurumumuzMetni,
    isinAdiMetni,
    firmaUnvan,
    teslimEdenlerList,
    teslimAlanlarList,
    getStartIndex,
  };
}
