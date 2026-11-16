import { useMemo } from "react";
import { HarcamaTalimatiType } from "./HarcamaTalimati.schema";
import { formatCurrency, getDativeSuffix } from "../../utils/textHelpers";

export const HARCAMA_BUDGET_PRESETS = [
  { kod: "03.2.1.01", ad: "Kırtasiye ve Büro Malzemesi Alımları" },
  { kod: "03.2.1.02", ad: "Büro Mefruşatı ve Donanım Alımları" },
  { kod: "03.2.1.05", ad: "Baskı ve Cilt Giderleri" },
  { kod: "03.2.2.01", ad: "Su ve Temizlik Malzemesi Alımları" },
  { kod: "03.2.3.01", ad: "Akaryakıt ve Yağ Alımları" },
  { kod: "03.2.3.02", ad: "Elektrik Alımları" },
  { kod: "03.5.2.01", ad: "Hizmet Binası Bakım ve Onarım Giderleri" },
  { kod: "03.5.2.02", ad: "Taşıt ve İş Makinesi Bakım Onarımı" },
  { kod: "03.5.2.90", ad: "Diğer Bakım ve Onarım Giderleri" },
  { kod: "03.7.1.01", ad: "Büro ve İşyeri Mal ve Malzeme Alımları" },
  { kod: "03.7.2.01", ad: "Bilgisayar ve Yazılım Alımları" },
];

export interface UseHarcamaTalimatiParams {
  data?: Partial<HarcamaTalimatiType> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export interface UseHarcamaTalimatiResult {
  cleanMutemet: string;
  mutemetSuffix: string;
  formattedYaklasikMaliyet: string;
  formattedIsTutari: string;
  shouldHideHeader: boolean;
  shouldHideFooter: boolean;
  idareAdi: string;
  harcamaYetkilisiAdi: string;
  harcamaYetkilisiUnvani: string;
  gerceklestirmeGorevlisiAdi: string;
  gerceklestirmeGorevlisiUnvani: string;
  mutemetAdi: string;
}

export function useHarcamaTalimati(
  params: UseHarcamaTalimatiParams = {}
): UseHarcamaTalimatiResult {
  const { data = {}, hideHeader, hideFooter } = params;

  return useMemo(() => {
    const rawMutemet =
      data.mutemetAdi ||
      data.muhasebeYetkilisiAdi ||
      data.muhasebeYetkilisi ||
      "";
    const cleanMutemet = typeof rawMutemet === "string"
      ? rawMutemet.split("(")[0].trim()
      : "";
    const mutemetSuffix = cleanMutemet ? getDativeSuffix(cleanMutemet) : "’a";

    const rawYaklasikMaliyet = data.yaklasikMaliyet;
    const formattedYaklasikMaliyet =
      rawYaklasikMaliyet !== undefined && rawYaklasikMaliyet !== null && rawYaklasikMaliyet !== ""
        ? `${formatCurrency(rawYaklasikMaliyet)} ₺`
        : "-";

    const rawTutari = data.isTutari ?? data.yaklasikMaliyet;
    const formattedIsTutari =
      rawTutari !== undefined && rawTutari !== null && rawTutari !== ""
        ? formatCurrency(rawTutari, "")
        : "";

    const shouldHideHeader =
      hideHeader !== undefined
        ? hideHeader
        : (data as any)?.hideHeader !== undefined
        ? (data as any).hideHeader
        : true;

    const shouldHideFooter =
      hideFooter !== undefined
        ? hideFooter
        : (data as any)?.hideFooter !== undefined
        ? (data as any).hideFooter
        : true;

    const idareAdi =
      data.idareAdi ||
      (data.antetSatirlari && data.antetSatirlari[1]) ||
      "KURUM / BİRİM ADI";

    const harcamaYetkilisiAdi = String(
      data.harcamaYetkilisiAdi || data.onaylayanPersonelAdi || data.baskanAdi || ""
    ).trim();

    const harcamaYetkilisiUnvani = String(
      data.harcamaYetkilisiUnvani || data.onaylayanPersonelUnvan || "Harcama Yetkilisi"
    ).trim();

    const gerceklestirmeGorevlisiAdi = String(
      data.gerceklestirmeGorevlisiAdi || data.hazirlayanPersonelAdi || ""
    ).trim();

    const gerceklestirmeGorevlisiUnvani = String(
      data.gerceklestirmeGorevlisiUnvani || data.hazirlayanPersonelUnvan || "Gerçekleştirme Görevlisi"
    ).trim();

    const mutemetAdi = String(
      data.mutemetAdi || data.muhasebeYetkilisiAdi || data.muhasebeYetkilisi || ""
    ).trim();

    return {
      cleanMutemet,
      mutemetSuffix,
      formattedYaklasikMaliyet,
      formattedIsTutari,
      shouldHideHeader,
      shouldHideFooter,
      idareAdi,
      harcamaYetkilisiAdi,
      harcamaYetkilisiUnvani,
      gerceklestirmeGorevlisiAdi,
      gerceklestirmeGorevlisiUnvani,
      mutemetAdi,
    };
  }, [data, hideHeader, hideFooter]);
}
