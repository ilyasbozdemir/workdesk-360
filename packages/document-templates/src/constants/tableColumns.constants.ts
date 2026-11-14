import React from "react";

export interface ColumnDef<T = any> {
  key: keyof T | string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T, index: number) => React.ReactNode;
  title?: string;
  tooltip?: string;
}

/**
 * Tablo kolonlarının nereden çekildiğini ve amacını açıklayan kapsamlı rehber haritası (Tooltip Source Map).
 */
export const TABLE_COLUMN_SOURCE_INFO: Record<string, string> = {
  siraNo: "ℹ️ Kalemin listedeki sıra numarasıdır.",
  sira_no: "ℹ️ Kalemin listedeki sıra numarasıdır.",
  kodu: "ℹ️ Dosya Detayı -> İhtiyaç Listesi / Kalemler sekmesindeki Taşınır/Hizmet/Poz Kodudur.",
  tasinirKodu: "ℹ️ Malzemenin resmî Taşınır Kodudur (TANIM_TasinirKodlari veya Dosya Kalemleri).",
  tasinir_kodu: "ℹ️ Malzemenin resmî Taşınır Kodudur (TANIM_TasinirKodlari veya Dosya Kalemleri).",
  pozNo: "ℹ️ Çevre ve Şehircilik Bakanlığı poz numarası veya özel yapım işi kalemi numarasıdır.",
  poz_no: "ℹ️ Çevre ve Şehircilik Bakanlığı poz numarası veya özel yapım işi kalemi numarasıdır.",
  hizmetKodu: "ℹ️ Hizmet alımı veya danışmanlık standart faaliyet/hizmet kodudur.",
  hizmet_kodu: "ℹ️ Hizmet alımı veya danışmanlık standart faaliyet/hizmet kodudur.",
  malzemeAdi: "ℹ️ Dosya Detayı -> İhtiyaç Listesi sekmesindeki 'Malzeme Adı' alanından çekilir.",
  malzeme_adi: "ℹ️ Dosya Detayı -> İhtiyaç Listesi sekmesindeki 'Malzeme Adı' alanından çekilir.",
  kalemAdi: "ℹ️ Dosya Detayı -> Kalemler sekmesindeki 'Malzeme / Hizmet / İmalat Adı' alanından çekilir.",
  kalem_adi: "ℹ️ Dosya Detayı -> Kalemler sekmesindeki 'Malzeme / Hizmet / İmalat Adı' alanından çekilir.",
  imalatAdi: "ℹ️ Yapım işine ait imalat veya iş kalemi tanımıdır.",
  hizmetAdi: "ℹ️ Temin edilecek hizmetin adıdır.",
  danismanlikKonusu: "ℹ️ Alınacak danışmanlık hizmetinin konusudur.",
  ozelligi: "ℹ️ Dosya Detayı -> Kalemler sekmesindeki 'Açıklama / Teknik Özellik' alanından çekilir.",
  aciklama: "ℹ️ Kalemin teknik şartname, marka/model veya iş tanımı açıklamasıdır.",
  teknikTarifi: "ℹ️ Pozun veya malzemenin teknik şartname ve imalat tarif detaylarıdır.",
  birimi: "ℹ️ Dosya Detayı -> Kalemler sekmesindeki ölçü birimidir (Adet, Metre, Kg, Paket, Saat vb.).",
  birim: "ℹ️ Kalemin ölçü birimidir (Adet, Metre, Kg vb.).",
  olcuBirimi: "ℹ️ Malzemenin veya hizmetin resmî ölçü birimidir.",
  olcu_birimi: "ℹ️ Malzemenin veya hizmetin resmî ölçü birimidir.",
  kdvOrani: "ℹ️ Dosya Detayı -> Kalemler sekmesinde seçilen KDV oranıdır (%0, %1, %10, %20).",
  kdv_orani: "ℹ️ Dosya Detayı -> Kalemler sekmesinde seçilen KDV oranıdır (%0, %1, %10, %20).",
  miktar: "ℹ️ Dosya Detayı -> İhtiyaç Listesi sekmesinde girilen talep miktarıdır.",
  miktarRaw: "ℹ️ Kalemin ham sayısal miktarıdır.",
  yaklasikMaliyet: "ℹ️ Yaklaşık Maliyet Cetvelinde hesaplanan birim maliyettir.",
  birimFiyat: "ℹ️ Kalem için belirlenen veya teklif edilen KDV hariç birim fiyattır.",
  birim_fiyat: "ℹ️ Kalem için belirlenen veya teklif edilen KDV hariç birim fiyattır.",
  toplamTutar: "ℹ️ Miktar × Birim Fiyat ile hesaplanan toplam tutardır.",
  toplam_tutar: "ℹ️ Miktar × Birim Fiyat ile hesaplanan toplam tutardır.",
  tutar: "ℹ️ İlgili kalemin KDV hariç toplam tutarıdır.",
  firmaAdi: "ℹ️ Dosya Detayı -> Teklifler sekmesinde teklif veren firmanın unvanıdır.",
  firma_adi: "ℹ️ Dosya Detayı -> Teklifler sekmesinde teklif veren firmanın unvanıdır.",
  teklifFiyati: "ℹ️ Firmanın bu kalem için sunduğu birim teklif tutarıdır.",
  teklif_fiyati: "ℹ️ Firmanın bu kalem için sunduğu birim teklif tutarıdır.",
  teklifTutari: "ℹ️ Firmanın bu kalem için sunduğu toplam teklif tutarıdır.",
  teklif_tutari: "ℹ️ Firmanın bu kalem için sunduğu toplam teklif tutarıdır.",
  pursantaj: "ℹ️ İş kaleminin toplam yapım işindeki pursantaj (ağırlık) yüzdesidir.",
  marka: "ℹ️ Firmanın teklif ettiği malzemenin marka ve model bilgisidir.",
  teslimSuresi: "ℹ️ Taahhüt edilen iş/mal teslim süresidir (Gün cinsinden)."
};

/**
 * Kolon anahtarları için dinamik eşleşme haritası (Alias Map).
 * Gelen veri objesindeki farklı isimlendirmeleri (birimi/birim, kodu/tasinirKodu vb.) dinamik olarak çözümler.
 */
export const COLUMN_ALIAS_MAP: Record<string, string[]> = {
  birimi: ["birim", "olcuBirimi", "olcu_birimi"],
  birim: ["birimi", "olcuBirimi", "olcu_birimi"],
  olcuBirimi: ["birimi", "birim", "olcu_birimi"],
  kodu: ["tasinirKodu", "tasinir_kodu", "kod", "pozNo", "poz_no", "hizmetKodu", "hizmet_kodu"],
  tasinirKodu: ["kodu", "tasinir_kodu", "kod"],
  pozNo: ["kodu", "poz_no", "tasinirKodu", "kod"],
  hizmetKodu: ["kodu", "hizmet_kodu", "kod"],
  ozelligi: ["aciklama", "ozellik", "teknikTarifi", "pozTanimi", "tanim"],
  aciklama: ["ozelligi", "ozellik", "teknikTarifi", "tanim"],
  teknikTarifi: ["ozelligi", "aciklama", "pozTanimi"],
  malzemeAdi: [
    "kalemAdi",
    "malzeme_adi",
    "kalem_adi",
    "imalatAdi",
    "hizmetAdi",
    "danismanlikKonusu",
    "ad",
  ],
  kalemAdi: [
    "malzemeAdi",
    "malzeme_adi",
    "kalem_adi",
    "imalatAdi",
    "hizmetAdi",
    "danismanlikKonusu",
    "ad",
  ],
  imalatAdi: ["kalemAdi", "malzemeAdi", "kalem_adi", "malzeme_adi", "ad"],
  hizmetAdi: ["kalemAdi", "malzemeAdi", "kalem_adi", "ad"],
  danismanlikKonusu: ["kalemAdi", "malzemeAdi", "kalem_adi", "ad"],
  miktar: ["miktarFormatted", "miktar"],
  siraNo: ["siraNo", "sira_no"],
};

/**
 * Tablo satırından ilgili kolonun değerini alias haritası üzerinden dinamik olarak okur.
 */
export function resolveRowCellValue(
  row: any,
  colKey: string,
  rowNum?: number,
): any {
  if (!row || colKey === "custom") return null;

  const direct = row[colKey];
  if (direct !== undefined && direct !== null && String(direct).trim() !== "") {
    return direct;
  }

  const aliases = COLUMN_ALIAS_MAP[colKey];
  if (aliases && aliases.length > 0) {
    for (const alias of aliases) {
      const val = row[alias];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return val;
      }
    }
  }

  if (colKey === "siraNo") {
    return row.siraNo ?? rowNum;
  }

  return direct;
}

/**
 * Şablon ID bazlı standart tablo kolon tanımları (Constants).
 */
export const TEMPLATE_TABLE_COLUMNS: Record<string, ColumnDef[]> = {
  "ihtiyac-listesi": [
    { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
    { key: "kodu", label: "Kodu", width: "10%", align: "left" },
    { key: "malzemeAdi", label: "Malzeme Adı", width: "30%", align: "left" },
    { key: "ozelligi", label: "Özelliği", width: "25%", align: "left" },
    { key: "birimi", label: "Birimi", width: "10%", align: "center" },
    { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
    { key: "miktar", label: "Miktar", width: "10%", align: "center" },
  ],
  "ihtiyac-listesi-mal": [
    { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
    { key: "kodu", label: "Taşınır Kodu", width: "12%", align: "left" },
    { key: "malzemeAdi", label: "Malzeme Adı", width: "28%", align: "left" },
    { key: "ozelligi", label: "Özelliği / Açıklama", width: "25%", align: "left" },
    { key: "birimi", label: "Birimi", width: "10%", align: "center" },
    { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
    { key: "miktar", label: "Miktar", width: "10%", align: "center" },
  ],
  "ihtiyac-listesi-hizmet": [
    { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
    { key: "kodu", label: "Hizmet Kodu", width: "12%", align: "left" },
    { key: "kalemAdi", label: "Hizmetin Adı", width: "28%", align: "left" },
    { key: "ozelligi", label: "Hizmetin Niteliği / Açıklama", width: "25%", align: "left" },
    { key: "birimi", label: "Birimi / Süre", width: "10%", align: "center" },
    { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
    { key: "miktar", label: "Miktar", width: "10%", align: "center" },
  ],
  "ihtiyac-listesi-danismanlik": [
    { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
    { key: "kodu", label: "Hizmet Kodu", width: "12%", align: "left" },
    { key: "kalemAdi", label: "Danışmanlık Hizmetinin Konusu", width: "28%", align: "left" },
    { key: "ozelligi", label: "Kapsam / Teknik Özellik", width: "25%", align: "left" },
    { key: "birimi", label: "Uzmanlık / Birim", width: "10%", align: "center" },
    { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
    { key: "miktar", label: "Miktar", width: "10%", align: "center" },
  ],
  "ihtiyac-listesi-yapim": [
    { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
    { key: "pozNo", label: "Poz No / İş Kalemi No", width: "14%", align: "center" },
    { key: "kalemAdi", label: "İmalat / İş Kalemi Adı", width: "26%", align: "left" },
    { key: "ozelligi", label: "Teknik Tarifi / Açıklama", width: "25%", align: "left" },
    { key: "birimi", label: "Ölçü Birimi", width: "10%", align: "center" },
    { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
    { key: "miktar", label: "Miktar", width: "10%", align: "center" },
  ],
  "luzum-muzekkeresi": [
    { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
    { key: "kodu", label: "Kodu", width: "12%", align: "left" },
    { key: "malzemeAdi", label: "Malzeme Adı", width: "25%", align: "left" },
    { key: "ozelligi", label: "Özelliği", width: "20%", align: "left" },
    { key: "birimi", label: "Birimi", width: "10%", align: "center" },
    { key: "kdvOrani", label: "KDV  Oranı %", width: "8%", align: "center" },
    { key: "miktar", label: "Miktar", width: "12%", align: "right" },
  ],
  "ihtiyac-talep-formu": [
    { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
    {
      key: "malzemeAdi",
      label: "Malzeme / Hizmet Adı",
      width: "35%",
      align: "left",
    },
    {
      key: "ozelligi",
      label: "Açıklama / Özelliği",
      width: "27%",
      align: "left",
    },
    { key: "birimi", label: "BİRİM", width: "15%", align: "center" },
    { key: "miktar", label: "MİKTAR", width: "15%", align: "right" },
  ],
  "teknik-sartname": [
    { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
    { key: "malzemeAdi", label: "Malzeme Adı", width: "30%", align: "left" },
    {
      key: "ozelligi",
      label: "Teknik Özellikleri",
      width: "35%",
      align: "left",
    },
    { key: "birimi", label: "Birimi", width: "12%", align: "center" },
    { key: "miktar", label: "Miktar", width: "15%", align: "right" },
  ],
  "tasinir-kayit-yetkilisi-gorusu": [
    { key: "siraNo", label: "Sıra No", width: "10%", align: "center" },
    { key: "kodu", label: "Taşınır Kodu", width: "20%", align: "left" },
    { key: "malzemeAdi", label: "Malzeme Tanımı", width: "36%", align: "left" },
    { key: "birimi", label: "Ölçü Birimi", width: "16%", align: "center" },
    { key: "miktar", label: "Miktar", width: "18%", align: "center" },
  ],
  default: [],
};

/**
 * Şablon ID'sine göre uygun kolon listesini getirir.
 */
export function getTemplateTableColumns(templateId?: string): ColumnDef[] {
  if (!templateId) return TEMPLATE_TABLE_COLUMNS.default;
  const clean = templateId.replace(/_/g, "-").toLowerCase();
  return TEMPLATE_TABLE_COLUMNS[clean] || TEMPLATE_TABLE_COLUMNS.default;
}
