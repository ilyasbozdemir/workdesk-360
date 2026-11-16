import { useMemo } from "react";
import { DogrudanTeminOnayBelgesiType } from "./DogrudanTeminOnayBelgesi.schema";
import { formatCurrency as formatCurrencyHelper } from "../../utils/textHelpers";

export const TEMIN_SEKLI_OPTIONS = [
  "4734 Sayılı K.İ.K. Madde 22/d (Doğrudan Temin - Parasal Limit)",
  "4734 Sayılı K.İ.K. Madde 22/a (Tek Kaynak / İhtiyacın Sadece Gerçek/Tüzel Tek Kişiden Temini)",
  "4734 Sayılı K.İ.K. Madde 22/b (Özel Hak / Fikri-Sınai Mülkiyet)",
  "4734 Sayılı K.İ.K. Madde 22/c (Mevcut Mal/Ekipman/Hizmet Uyum Zorunluluğu)",
  "4734 Sayılı K.İ.K. Madde 22/e (Taşınmaz Mal Alımı / Kiralanması)",
  "4734 Sayılı K.İ.K. Madde 22/f (Sağlık Hizmetleri & İlaç/Tıbbi Cihaz Alımları)",
];

export const ALIM_TURU_OPTIONS = [
  "Mal Alımı",
  "Hizmet Alımı",
  "Yapım İşi",
  "Danışmanlık Hizmet Alımı",
];

export const AVANS_OPTIONS = [
  "Avans verilmeyecektir.",
  "Avans verilecektir.",
  "Şartname ve sözleşmede belirtilen esaslar dahilinde avans verilecektir.",
];

export const FIYAT_FARKI_OPTIONS = [
  "Fiyat Farkı Ödenmeyecek.",
  "Fiyat Farkı Ödenmeyecek",
  "31.08.2013 Tarih ve 2013/5216 Sayılı Mal Alımı Bakanlar Kurulu Kararına Göre",
  "31.08.2013 Tarih ve 2013/5215 Sayılı Hizmet Alımı Bakanlar Kurulu Kararına Göre",
  "Fiyat farkı verilecektir.",
  "Yürürlükteki Fiyat Farkı Kararnamesi esaslarına göre fiyat farkı hesaplanacaktır.",
];

export const DOKUMAN_OPTIONS = [
  "Hazırlanmayacaktır.",
  "İdari ve teknik şartname hazırlanacaktır.",
  "Sadece teknik şartname hazırlanacaktır.",
];

export interface OnayBelgesiRowItem {
  id: string;
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  isBold?: boolean;
  selectOptions?: string[];
  renderValue?: () => React.ReactNode;
}

function formatCurrency(val: any, fallback = "-"): string {
  return formatCurrencyHelper(val, fallback, true);
}

export interface UseDogrudanTeminOnayBelgesiParams {
  data?: Partial<DogrudanTeminOnayBelgesiType> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
}

export interface UseDogrudanTeminOnayBelgesiResult {
  idareAdi: string;
  vmakamina: string;
  butceTertibiList: string[];
  eklerList: any[];
  rows: OnayBelgesiRowItem[];
  onayTarihi: string;
  hazirlayanAdi: string;
  hazirlayanUnvan: string;
  onaylayanAdi: string;
  onaylayanUnvan: string;
}

export function useDogrudanTeminOnayBelgesi(
  params: UseDogrudanTeminOnayBelgesiParams = {}
): UseDogrudanTeminOnayBelgesiResult {
  const { data = {} } = params;

  return useMemo(() => {
    const idareAdi =
      data.idareAdi ||
      data.kurumAdi ||
      (data.antetSatirlari && data.antetSatirlari[1]) ||
      "İDARE ADI";

    const vmakamina =
      data.vmakamina ||
      data.makam ||
      data.makamAdi ||
      data.mudurluk ||
      (data.kurumAdi
        ? `${data.kurumAdi.toUpperCase()} HARCAMA YETKİLİSİ MAKAMINA`
        : "HARCAMA YETKİLİSİ MAKAMINA");

    const rawButceTertibi =
      data.butceTertibi ||
      data.odenekTertibi ||
      data.butce_tertibi ||
      data.butceKodu ||
      data.butce_kodu ||
      [];

    const butceTertibiList: string[] =
      Array.isArray(rawButceTertibi) && rawButceTertibi.length > 0
        ? rawButceTertibi.map(String)
        : typeof rawButceTertibi === "string" && rawButceTertibi.trim() !== "" && rawButceTertibi.trim() !== "-"
        ? rawButceTertibi.split(/[\n,;]+/).map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(data.kalemler) && data.kalemler.some((k: any) => k.butce_kodu || k.butceTertibi || k.butce_tertibi)
        ? (Array.from(new Set(data.kalemler.map((k: any) => k.butce_kodu || k.butceTertibi || k.butce_tertibi).filter(Boolean))) as string[])
        : [];

    const eklerList = Array.isArray(data.ekler) ? data.ekler : [];

    const rows: OnayBelgesiRowItem[] =
      Array.isArray(data.customRows) && data.customRows.length > 0
        ? data.customRows
        : [
            {
              id: "teminNo",
              label: "Doğrudan Temin Numarası",
              name: "teminNo",
              value: data.teminNo || data.dosyaNo || data.evrakSayisi || "-",
              placeholder: "Temin Numarası",
            },
            {
              id: "isAdi",
              label: "İşin Adı",
              name: "isAdi",
              value: data.isAdi || data.dosyaKonusu || "",
              placeholder: "İşin Adı",
              isBold: true,
            },
            {
              id: "teminSekli",
              label: "Temin Şekli",
              name: "teminSekli",
              value:
                data.teminSekli ||
                "4734 Sayılı K.İ.K. Madde 22/d (Doğrudan Temin - Parasal Limit)",
              placeholder: "Temin Usulü",
              selectOptions: TEMIN_SEKLI_OPTIONS,
            },
            {
              id: "alimTuru",
              label: "Alım Türü",
              name: "alimTuru",
              value: data.alimTuru || data.teklifSozlesmeTuru || "Mal Alımı",
              placeholder: "Alım Türü",
              selectOptions: ALIM_TURU_OPTIONS,
            },
            {
              id: "yaklasikMaliyet",
              label: "Yaklaşık Maliyet",
              name: "yaklasikMaliyet",
              value: formatCurrency(data.yaklasikMaliyet),
              placeholder: "0,00 ₺",
              isBold: true,
            },
            {
              id: "odenekTutari",
              label: "Kullanılabilir Ödenek Tutarı",
              name: "odenekTutari",
              value:
                data.odenekTutari || data.kullanilabilirOdenek || data.kullanilabilir_odenek || data.odenek_tutari
                  ? formatCurrency(
                      data.odenekTutari || data.kullanilabilirOdenek || data.kullanilabilir_odenek || data.odenek_tutari
                    )
                  : data.yaklasikMaliyet
                  ? formatCurrency(data.yaklasikMaliyet)
                  : "Yeterli Ödenek Mevcuttur",
              placeholder: "Ödenek Tutarı",
            },
            {
              id: "projeNo",
              label: "Yatırım Proje Numarası (varsa)",
              name: "projeNo",
              value: data.projeNo || "-",
              placeholder: "Proje No veya -",
            },
            {
              id: "butceTertibi",
              label: "Bütçe Tertibi",
              name: "butceTertibi",
              value: butceTertibiList.join(", ") || "Belirtilmedi",
              placeholder: "Bütçe Tertibi",
            },
            {
              id: "avansSartlari",
              label: "Avans Verilecekse şartları",
              name: "avansSartlari",
              value: data.avansSartlari || "Avans verilmeyecektir.",
              placeholder: "Avans Şartları",
              selectOptions: AVANS_OPTIONS,
            },
            {
              id: "fiyatFarkiSartlari",
              label: "Fiyat Farkı Verilecekse Şartları",
              name: "fiyatFarkiSartlari",
              value:
                data.fiyatFarkiSartlari ||
                data.fiyat_farki_dayanagi ||
                data.fiyatFarkiDayanagi ||
                (data.fiyat_farki_var_mi === 0 || data.fiyatFarkiVarMi === false
                  ? "Fiyat Farkı Ödenmeyecek."
                  : undefined) ||
                "Fiyat Farkı Ödenmeyecek.",
              placeholder: "Fiyat Farkı Şartları",
              selectOptions: FIYAT_FARKI_OPTIONS,
            },
            {
              id: "dokumanHazirlik",
              label: "Doküman Hazırlanıp Hazırlanmayacağı",
              name: "dokumanHazirlik",
              value: data.dokumanHazirlik || "Hazırlanmayacaktır.",
              placeholder: "Doküman Durumu",
              selectOptions: DOKUMAN_OPTIONS,
            },
          ];

    const onayTarihi = String(
      data.onayTarihi || data.dosyaTarihi || data.tarih || "........"
    );

    const hazirlayanAdi = String(
      data.hazirlayanPersonelAdi || data.gerceklestirmeGorevlisiAdi || ""
    ).trim();
    const hazirlayanUnvan = String(
      data.hazirlayanPersonelUnvan || data.gerceklestirmeGorevlisiUnvani || "Gerçekleştirme Görevlisi"
    ).trim();

    const onaylayanAdi = String(
      data.onaylayanPersonelAdi || data.harcamaYetkilisiAdi || data.baskanAdi || ""
    ).trim();
    const onaylayanUnvan = String(
      data.onaylayanPersonelUnvan || data.harcamaYetkilisiUnvani || "Harcama Yetkilisi"
    ).trim();

    return {
      idareAdi,
      vmakamina,
      butceTertibiList,
      eklerList,
      rows,
      onayTarihi,
      hazirlayanAdi,
      hazirlayanUnvan,
      onaylayanAdi,
      onaylayanUnvan,
    };
  }, [data]);
}
