import { useMemo } from "react";
import { ColumnDef, getTemplateTableColumns } from "../../document/DocumentTable";
import {
  DEFAULT_LIMITS,
  LANDSCAPE_LIMITS,
  PageLimitConfig,
  paginateData,
} from "../../document/DynamicPaginatedTable";
import { toTrDate } from "../../document/ApprovalSignature";
import {
  normalizeIhtiyacKalemleri,
  ProcessedIhtiyacKalem,
  resolveIhtiyacListesiLimits,
} from "../ihtiyac-listesi/IhtiyacListesi.hook";
import { IhtiyacTalepFormuType } from "./IhtiyacTalepFormu.schema";

export const DEFAULT_TALEP_FORMU_EKLER = "EKİ: Talebe ait teknik şartnameler";

export function getDynamicAltNotlar(data: any): string {
  if (data?.altNotlar) return data.altNotlar;

  const birimAdi =
    data?.mudurluk ||
    data?.birim_adi ||
    data?.harcamaBirimAdi ||
    "Destek Hizmetleri Başkanlığı";

  let birimYonelme = birimAdi;
  if (!birimAdi.endsWith("na") && !birimAdi.endsWith("ne")) {
    if (
      /[ıi]$/i.test(birimAdi) ||
      /[uü]$/i.test(birimAdi) ||
      /ğ[ıi]$/i.test(birimAdi)
    ) {
      birimYonelme = `${birimAdi}na`;
    } else if (/[aeoö]$/i.test(birimAdi)) {
      birimYonelme = `${birimAdi}ne`;
    } else {
      birimYonelme = `${birimAdi}'ne`;
    }
  }

  return `1- Hizmet ve Yapım işi alımlarında Taşınır Kayıt Yetkilisi görüşü yazılmayacaktır.
2- İstenilen malzeme depoda var ise bu talep formu satın alma birimine gönderilmeyecektir.
3- Hizmet, Yapım İşleri ve Mal alımlarında (Demirbaş v.b. gibi) Teknik Şartname hazırlanması zorunludur. (Tüm Teknik Şartnameler hazırlayanlar tarafından eksiksiz bir şekilde doldurulup Üst yazıyla ${birimYonelme} gönderilecektir. Teknik şartname olmayan talepler değerlendirmeye alınmayacaktır. Bu hususların eksiksiz yerine getirilmesi ve Makam Onayı alınmasından sonra satın alma işlemleri başlatılacaktır.)`;
}

export interface UseIhtiyacTalepFormuParams {
  data?: Partial<IhtiyacTalepFormuType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export interface UseIhtiyacTalepFormuResult {
  tableColumns: ColumnDef[];
  limits: PageLimitConfig;
  items: ProcessedIhtiyacKalem[];
  pages: ProcessedIhtiyacKalem[][];
  personelList: any[];
  talepEdenAd: string;
  talepEdenUnvan: string;
  talepEdenSelectedId: string;
  onaylayanAd: string;
  onaylayanUnvan: string;
  onaylayanSelectedId: string;
  tarihVal: string;
  dosyaTarihiVal: string;
  talepEdenBirim: string;
  altNotlar: string;
  ekler: string;
  fLimit: number | null;
  getStartIndex: (pageIdx: number) => number;
}

export function useIhtiyacTalepFormu(
  params: UseIhtiyacTalepFormuParams
): UseIhtiyacTalepFormuResult {
  const {
    data = {},
    columns,
    orientation = "portrait",
    firstPageLimit,
    middlePageLimit,
    lastPageLimit,
  } = params;

  return useMemo(() => {
    const personelList: any[] = (data as any).personelListesi || [];

    const fLimit = firstPageLimit ?? (data as any).firstPageLimit ?? null;
    const mLimit = middlePageLimit ?? (data as any).middlePageLimit ?? null;
    const lLimit = lastPageLimit ?? (data as any).lastPageLimit ?? null;

    const limits = resolveIhtiyacListesiLimits(
      orientation,
      fLimit,
      mLimit,
      lLimit
    );

    const items = normalizeIhtiyacKalemleri(data);
    const pages = paginateData(items, limits);

    const tableColumns =
      columns && columns.length > 0
        ? columns
        : getTemplateTableColumns("ihtiyac-talep-formu");

    const defaultToday = toTrDate(new Date().toISOString().split("T")[0]);

    const talepEdenAd =
      data.talepEdenPersonelAdi || data.hazirlayanPersonelAdi || "";
    const talepEdenUnvan =
      data.talepEdenPersonelUnvan || data.hazirlayanPersonelUnvan || "";

    const onaylayanAd =
      data.onaylayanPersonelAdi ||
      data.harcamaYetkilisiAdi ||
      (data as any).baskanAdi ||
      "";
    const onaylayanUnvan =
      data.onaylayanPersonelUnvan ||
      data.harcamaYetkilisiUnvan ||
      (data as any).baskanUnvan ||
      "Harcama Yetkilisi";

    const tarihVal =
      data.tarih ||
      data.onayaSunulanTarih ||
      data.dosyaTarihi ||
      defaultToday;
    const dosyaTarihiVal =
      data.dosyaTarihi || data.onayTarihi || tarihVal || defaultToday;

    const talepEdenMatched = personelList.find(
      (p: any) =>
        p.ad_soyad &&
        String(p.ad_soyad).trim().toLowerCase() ===
          String(talepEdenAd || "").trim().toLowerCase()
    );
    const talepEdenSelectedId = talepEdenMatched
      ? String(talepEdenMatched.id)
      : "";

    const onaylayanMatched = personelList.find(
      (p: any) =>
        p.ad_soyad &&
        String(p.ad_soyad).trim().toLowerCase() ===
          String(onaylayanAd || "").trim().toLowerCase()
    );
    const onaylayanSelectedId = onaylayanMatched
      ? String(onaylayanMatched.id)
      : "";

    const talepEdenBirim =
      (data as any).talepEdenBirim ||
      (data as any).birimAdi ||
      (data as any).birim_adi ||
      (data as any).mudurluk ||
      (data as any).harcamaBirimi ||
      (data as any).harcama_birimi ||
      (data as any).ihalesiYapilacakBirim ||
      data.ihtiyacYeri ||
      (data as any).idareAdi ||
      (data as any).kurum_adi ||
      "";

    const altNotlar = getDynamicAltNotlar(data);
    const ekler = data.ekler || DEFAULT_TALEP_FORMU_EKLER;

    const getStartIndex = (pageIdx: number): number => {
      if (pageIdx === 0) return 0;
      return limits.firstPage + (pageIdx - 1) * limits.middle;
    };

    return {
      tableColumns,
      limits,
      items,
      pages,
      personelList,
      talepEdenAd,
      talepEdenUnvan,
      talepEdenSelectedId,
      onaylayanAd,
      onaylayanUnvan,
      onaylayanSelectedId,
      tarihVal,
      dosyaTarihiVal,
      talepEdenBirim,
      altNotlar,
      ekler,
      fLimit: fLimit !== null ? Number(fLimit) : null,
      getStartIndex,
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

