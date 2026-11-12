import { useMemo } from "react";
import {
  ColumnDef,
  getTemplateTableColumns,
} from "../../document/DocumentTable";
import {
  DEFAULT_LIMITS,
  LANDSCAPE_LIMITS,
  PageLimitConfig,
  paginateData,
} from "../../document/DynamicPaginatedTable";
import { IhtiyacListesiType } from "./IhtiyacListesi.schema";

import { ALIM_USULLERI, KANUN_MADDELERI } from "@temin360/contracts";

export interface ProcessedIhtiyacKalem {
  id?: number | string;
  siraNo: number;
  kodu: string;
  malzemeAdi: string;
  ozelligi: string;
  birimi: string;
  kdvOrani: string;
  miktar: string;
  miktarRaw: number;
  [key: string]: any;
}

export interface UseIhtiyacListesiParams {
  data?: Partial<IhtiyacListesiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export interface UseIhtiyacListesiResult {
  tableColumns: ColumnDef[];
  limits: PageLimitConfig;
  items: ProcessedIhtiyacKalem[];
  pages: ProcessedIhtiyacKalem[][];
  tarih: string;
  dosyaKonusu: string;
  sunulacakMakam: string;
  onayTarihi: string;
  fLimit: number | null;
  getStartIndex: (pageIdx: number) => number;
  KANUN_DAYANAGI: string;
}

/**
 * Sayısal miktar ve tutarları Türk Lirası / Türkçe sayı formatına (binlik nokta, ondalık virgül) çevirir.
 * Örn: 1000 -> "1.000", 1250.5 -> "1.250,5", "1000" -> "1.000"
 */
export function formatTurkishNumber(val: any): string {
  if (val === undefined || val === null || val === "") return "0";

  // Zaten Türkçe formatlanmışsa (örn: "1.000" veya "1.250,50") elleme
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.includes(".") && trimmed.includes(",")) {
      return trimmed;
    }
    // "1000" veya "1250.50" gibi ham sayı string'i ise parse et
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

/**
 * Farklı kaynaklardan gelen (ihtiyacKalemleri, kalemler, malzemeler, items) kalem verisini tekilleştirip standartlaştırır.
 */
export function normalizeIhtiyacKalemleri(
  data: Record<string, any> = {},
): ProcessedIhtiyacKalem[] {
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
    const kdvRaw = k.kdvOrani !== undefined && k.kdvOrani !== null
      ? String(k.kdvOrani).replace("%", "")
      : "20";

    const koduVal = k.pozNo ||
      k.kodu ||
      k.tasinirKodu ||
      k.tasinir_kodu ||
      k.hizmetKodu ||
      k.hizmet_kodu ||
      k.kod ||
      "-";
    const adiVal = k.imalatAdi ||
      k.hizmetAdi ||
      k.danismanlikKonusu ||
      k.malzemeAdi ||
      k.kalemAdi ||
      k.kalem_adi ||
      k.ad ||
      "";
    const ozellikVal = k.teknikTarifi ||
      k.kapsam ||
      k.ozelligi ||
      k.aciklama ||
      k.tanim ||
      "";
    const birimVal = k.olcuBirimi || k.birimi || k.birim || "Adet";

    return {
      ...k,
      id: k.id ?? idx + 1,
      siraNo: k.siraNo ?? (idx + 1),
      pozNo: k.pozNo || (koduVal !== "-" ? koduVal : ""),
      hizmetKodu: k.hizmetKodu || (koduVal !== "-" ? koduVal : ""),
      kodu: koduVal,
      tasinirKodu: k.tasinirKodu || k.tasinir_kodu ||
        (koduVal !== "-" ? koduVal : ""),
      malzemeAdi: adiVal,
      kalemAdi: adiVal,
      imalatAdi: k.imalatAdi || adiVal,
      hizmetAdi: k.hizmetAdi || adiVal,
      danismanlikKonusu: k.danismanlikKonusu || adiVal,
      ozelligi: ozellikVal,
      teknikTarifi: k.teknikTarifi || ozellikVal,
      aciklama: k.aciklama || ozellikVal,
      kapsam: k.kapsam || ozellikVal,
      birimi: birimVal,
      birim: birimVal,
      olcuBirimi: birimVal,
      kdvOrani: kdvRaw,
      miktar: miktarFormatted,
      miktarRaw,
    };
  });
}

/**
 * Sayfa bölme sınırlarını yön (portrait/landscape) ve özel sınırlara göre hesaplar.
 */
export function resolveIhtiyacListesiLimits(
  orientation: "portrait" | "landscape" = "portrait",
  fLimit?: any,
  mLimit?: any,
  lLimit?: any,
): PageLimitConfig {
  const baseLimits = orientation === "landscape"
    ? LANDSCAPE_LIMITS
    : DEFAULT_LIMITS;

  return {
    firstPage: fLimit !== undefined && fLimit !== null
      ? Number(fLimit)
      : baseLimits.firstPage,
    middle: mLimit !== undefined && mLimit !== null
      ? Number(mLimit)
      : baseLimits.middle,
    lastPage: lLimit !== undefined && lLimit !== null
      ? Number(lLimit)
      : baseLimits.lastPage,
  };
}

/**
 * İhtiyaç Listesi şablonu için tüm veri hazırlama, kolon çözme ve sayfalama işlemlerini yürüten ana hook.
 */
export function useIhtiyacListesi(
  params: UseIhtiyacListesiParams,
): UseIhtiyacListesiResult {
  const {
    data = {},
    columns,
    orientation = "portrait",
    firstPageLimit,
    middlePageLimit,
    lastPageLimit,
  } = params;

  return useMemo(() => {
    const ALIM_USULU = data.alimUsulu?.trim() || ALIM_USULLERI.DOGRUDAN_TEMIN;

    const MADDE_NO = data.maddeNo?.trim() || KANUN_MADDELERI.GENEL;

    //const KANUN_DAYANAGI = MADDE_NO === KANUN_MADDELERI.GENEL ? "" : MADDE_NO;
    const KANUN_DAYANAGI = "ilgili"; // default oalrka bu olucak

    const ALIM_USULU_METNI = ALIM_USULU === ALIM_USULLERI.DOGRUDAN_TEMIN
      ? ALIM_USULLERI.DOGRUDAN_TEMIN
      : ALIM_USULU;

    const tableColumns = columns && columns.length > 0
      ? columns
      : getTemplateTableColumns("ihtiyac-listesi");

    const fLimit = firstPageLimit ?? (data as any).firstPageLimit ?? null;
    const mLimit = middlePageLimit ?? (data as any).middlePageLimit ?? null;
    const lLimit = lastPageLimit ?? (data as any).lastPageLimit ?? null;

    const limits = resolveIhtiyacListesiLimits(
      orientation,
      fLimit,
      mLimit,
      lLimit,
    );
    const items = normalizeIhtiyacKalemleri(data);
    const pages = paginateData(items, limits);

    // Standart CommonDocumentFields kullanımı
    const tarih = data.dosyaTarihi || data.tarih || "";

    const dosyaKonusu = data.dosyaKonusu || data.konu || "İhtiyaç Listesi";

    const sunulacakMakam = data.sunulacakMakamAdi ||
      (data as any).sunulacakMakam || "";
    const onayTarihi = data.onayTarihi || data.dosyaTarihi || data.tarih || "";

    const getStartIndex = (pageIdx: number): number => {
      if (pageIdx === 0) return 0;
      return limits.firstPage + (pageIdx - 1) * limits.middle;
    };

    return {
      tableColumns,
      limits,
      items,
      pages,
      tarih,
      dosyaKonusu,
      sunulacakMakam,
      onayTarihi,
      fLimit: fLimit !== null ? Number(fLimit) : null,
      getStartIndex,
      KANUN_DAYANAGI,
    };
  }, [
    data,
    columns,
    orientation,
    firstPageLimit,
    middlePageLimit,
    lastPageLimit,
  ]);
}
