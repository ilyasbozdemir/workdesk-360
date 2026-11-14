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
import { toTrDate } from "../../document/ApprovalSignature";
import { LuzumMuzekkeresiType } from "./LuzumMuzekkeresi.schema";

export interface ProcessedLuzumKalem {
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

export interface UseLuzumMuzekkeresiParams {
  data?: Partial<LuzumMuzekkeresiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export interface UseLuzumMuzekkeresiResult {
  tableColumns: ColumnDef[];
  limits: PageLimitConfig;
  items: ProcessedLuzumKalem[];
  pages: ProcessedLuzumKalem[][];
  tarih: string;
  defaultToday: string;
  sunulacakMakam: string;
  onayTarihi: string;
  fLimit: number | null;
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

export function normalizeLuzumKalemleri(
  data: Record<string, any> = {},
): ProcessedLuzumKalem[] {
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
      : parseFloat(
        String(k.miktar || "1").replace(/\./g, "").replace(",", "."),
      ) || 1;

    const rawKdv = k.kdvOrani ?? k.kdv_orani ?? k.kdv ?? "";
    const kdvOraniFormatted =
      rawKdv !== "" && rawKdv !== undefined && rawKdv !== null
        ? `%${String(rawKdv).replace("%", "").trim()}`
        : "%20";

    const siraNo = k.siraNo !== undefined && k.siraNo !== null
      ? Number(k.siraNo) || idx + 1
      : idx + 1;

    const kodu = String(
      k.kodu || k.tasinirKodu || k.tasinir_kodu || k.hizmetKodu || k.pozNo ||
        "-",
    );
    const malzemeAdi = String(
      k.malzemeAdi || k.kalemAdi || k.kalem_adi || k.imalatAdi || k.hizmetAdi ||
        k.danismanlikKonusu || k.ad || "",
    );
    const ozelligi = String(
      k.ozelligi || k.aciklama || k.teknikTarifi || k.kapsam || "",
    );
    const birimi = String(
      k.birimi || k.birim || k.olcuBirimi || "Adet",
    );

    return {
      ...k,
      id: k.id ?? idx + 1,
      siraNo,
      kodu,
      tasinirKodu: k.tasinirKodu || k.tasinir_kodu || kodu,
      pozNo: k.pozNo || k.isKalemiNo || kodu,
      hizmetKodu: k.hizmetKodu || kodu,
      malzemeAdi,
      kalemAdi: malzemeAdi,
      imalatAdi: malzemeAdi,
      hizmetAdi: malzemeAdi,
      danismanlikKonusu: malzemeAdi,
      ozelligi,
      teknikTarifi: ozelligi,
      aciklama: ozelligi,
      birimi,
      birim: birimi,
      olcuBirimi: birimi,
      kdvOrani: kdvOraniFormatted,
      miktar: miktarFormatted,
      miktarRaw,
    };
  });
}

export function useLuzumMuzekkeresi(
  params: UseLuzumMuzekkeresiParams,
): UseLuzumMuzekkeresiResult {
  const {
    data = {},
    columns,
    orientation = "portrait",
    firstPageLimit,
    middlePageLimit,
    lastPageLimit,
  } = params;

  const defaultToday = useMemo(() => {
    return toTrDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fLimit = firstPageLimit ?? (data as any).firstPageLimit ?? null;
  const mLimit = middlePageLimit ?? (data as any).middlePageLimit ?? null;
  const lLimit = lastPageLimit ?? (data as any).lastPageLimit ?? null;

  const limits: PageLimitConfig = useMemo(() => {
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
  }, [orientation, fLimit, mLimit, lLimit]);

  const items = useMemo(() => {
    return normalizeLuzumKalemleri(data);
  }, [data]);

  const pages = useMemo(() => {
    return paginateData(items, limits);
  }, [items, limits]);

  const defaultColumns: ColumnDef[] = useMemo(() => [
    { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
    { key: "kodu", label: "Kodu", width: "12%", align: "left" },
    { key: "malzemeAdi", label: "Malzeme Adı", width: "25%", align: "left" },
    { key: "ozelligi", label: "Özelliği", width: "20%", align: "left" },
    { key: "birimi", label: "Birimi", width: "10%", align: "center" },
    { key: "kdvOrani", label: "KDV  Oranı %", width: "8%", align: "center" },
    { key: "miktar", label: "Miktar", width: "12%", align: "right" },
  ], []);

  const tableColumns = useMemo(() => {
    if (columns && columns.length > 0) return columns;
    const fromTemplate = getTemplateTableColumns("luzum-muzekkeresi");
    return fromTemplate && fromTemplate.length > 0 ? fromTemplate : defaultColumns;
  }, [columns, defaultColumns]);

  const tarih = useMemo(() => {
    return data.tarih ||
      (data as any).dosya_acilis_tarihi ||
      data.dosyaAcilisTarihi ||
      data.dosyaTarihi ||
      defaultToday;
  }, [data, defaultToday]);

  const sunulacakMakam = useMemo(() => {
    return data.sunulacakMakamAdi ||
      (data as any).sunulacakMakam ||
      (data as any).sunulacak_makam ||
      (data as any).muhatap ||
      "";
  }, [data]);

  const onayTarihi = useMemo(() => {
    return data.onayTarihi || data.tarih || data.dosyaTarihi || defaultToday;
  }, [data, defaultToday]);

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
    defaultToday,
    sunulacakMakam,
    onayTarihi,
    fLimit: fLimit ? Number(fLimit) : null,
    getStartIndex,
  };
}
