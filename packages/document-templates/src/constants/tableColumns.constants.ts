import React from "react";

export interface ColumnDef<T = any> {
  key: keyof T | string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

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
