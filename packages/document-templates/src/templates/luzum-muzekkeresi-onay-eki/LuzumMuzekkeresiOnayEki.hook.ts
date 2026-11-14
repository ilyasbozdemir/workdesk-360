import { useMemo } from "react";
import { ColumnDef } from "../../document/DocumentTable";
import { toTrDate } from "../../document/ApprovalSignature";
import { paginateData } from "../../document/DynamicPaginatedTable";
import {
  LuzumMuzekkeresiOnayEkiType,
  LuzumOnayEkiKalemType,
} from "./LuzumMuzekkeresiOnayEki.schema";

export interface UseLuzumMuzekkeresiOnayEkiParams {
  data?: Partial<LuzumMuzekkeresiOnayEkiType>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  columns?: ColumnDef[];
}

export const DEFAULT_ONAY_EKI_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S.No", width: "6%", align: "center" },
  { key: "kodu", label: "Kodu", width: "14%", align: "left" },
  { key: "malzemeAdi", label: "Malzeme / Hizmet Adı", width: "32%", align: "left" },
  { key: "ozelligi", label: "Özelliği", width: "24%", align: "left" },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV (%)", width: "6%", align: "center" },
  { key: "miktar", label: "Miktar", width: "8%", align: "right" },
];

export function getKurumName(
  kurumAdi?: string | null,
  altKurumTipi?: string | null,
): string {
  if (!altKurumTipi || altKurumTipi === "diger") {
    return kurumAdi || "İdaremiz";
  }

  const map: Record<string, string> = {
    belediye: "Belediyemiz",
    mudurluk: "Müdürlüğümüz",
    bakanlik: "Bakanlığımız",
    valilik: "Valiliğimiz",
    kaymakamlik: "Kaymakamlığımız",
    universite: "Üniversitemiz",
    il_ozel: "İl Özel İdaremiz",
    koy: "Muhtarlığımız",
    sgk: "Müdürlüğümüz",
    kurul: "Kurulumuz",
  };

  return map[altKurumTipi] || kurumAdi || "İdaremiz";
}

export function normalizeOnayEkiKalemleri(items?: LuzumOnayEkiKalemType[]): any[] {
  if (!items || !Array.isArray(items)) return [];
  return items.map((item, idx) => ({
    ...item,
    siraNo: item.siraNo ?? idx + 1,
    kodu:
      item.kodu ||
      item.tasinirKodu ||
      item.pozNo ||
      item.hizmetKodu ||
      "-",
    malzemeAdi:
      item.malzemeAdi ||
      item.kalemAdi ||
      item.hizmetAdi ||
      item.imalatAdi ||
      item.danismanlikKonusu ||
      "-",
    ozelligi: item.ozelligi || item.teknikTarifi || item.aciklama || "-",
    birimi: item.birimi || item.birim || item.olcuBirimi || "Adet",
    kdvOrani: item.kdvOrani ?? 20,
    miktar: item.miktar ?? 0,
  }));
}

export function useLuzumMuzekkeresiOnayEki(params: UseLuzumMuzekkeresiOnayEkiParams) {
  const {
    data = {},
    firstPageLimit,
    middlePageLimit,
    lastPageLimit,
    columns = DEFAULT_ONAY_EKI_COLUMNS,
  } = params;

  const limits = useMemo(
    () => ({
      firstPage: firstPageLimit ?? 15,
      middle: middlePageLimit ?? 18,
      lastPage: lastPageLimit ?? 12,
    }),
    [firstPageLimit, middlePageLimit, lastPageLimit],
  );

  const normalizedItems = useMemo(
    () => normalizeOnayEkiKalemleri(data.ihtiyacKalemleri),
    [data.ihtiyacKalemleri],
  );

  const pages = useMemo(
    () => paginateData(normalizedItems, limits),
    [normalizedItems, limits],
  );

  const defaultToday = useMemo(
    () => toTrDate(new Date().toISOString().split("T")[0]),
    [],
  );

  const dosyaTarihiVal = data.dosyaTarihi || data.tarih || defaultToday;

  const kurumMetni = useMemo(() => {
    return (
      data.kurumMetni ??
      (data.kurumumuz ||
        (data as any).altKurumBizim ||
        getKurumName(data.kurumAdi, data.altKurumTipi))
    );
  }, [data.kurumMetni, data.kurumumuz, (data as any).altKurumBizim, data.kurumAdi, data.altKurumTipi]);

  const ekNo = data.ekNo || "1";

  const talepEdenAd =
    data.talepEdenPersonelAdi || data.hazirlayanPersonelAdi || "";
  const talepEdenUnvan =
    data.talepEdenPersonelUnvan || data.hazirlayanPersonelUnvan || "";

  const getStartIndex = (pageIdx: number) => {
    if (pageIdx === 0) return 0;
    return limits.firstPage + (pageIdx - 1) * limits.middle;
  };

  return {
    tableColumns: columns,
    limits,
    pages,
    defaultToday,
    dosyaTarihiVal,
    kurumMetni,
    ekNo,
    talepEdenAd,
    talepEdenUnvan,
    getStartIndex,
  };
}
