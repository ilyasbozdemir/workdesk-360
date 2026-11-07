/* eslint-disable */
/**
 * TEMİN 360 (Doğrudan Temin - 4734 KİK Md. 22) Şema Manifesti
 */
export const temin360Manifest = {
  app: "temin360-desktop",
  target: "temin360-desktop",
  target_scope: "dogrudan-temin",
  version: "1.0.0-rc.11",
  suite: "workdesk-360",
  schema_min: 1,
  schema_max: 46,
  release_date: "2026-11-07",
  inheritsHistoricalSuiteManifests: true,
  shared_schema_scope: "dogrudan-temin",
  changes: [
    {
      schema: 46,
      type: "column_added",
      description: "DATA_TeminDosyasi tablosuna kilit/aktarım takip kolonları; TANIM_KomisyonUye ve DATA_TeminKomisyon tablolarına birim ve imza türü kolonları (imza_turu, birim_id, birim) eklendi.",
      columns_added: [
        { table: "DATA_TeminDosyasi", column: "is_locked" },
        { table: "DATA_TeminDosyasi", column: "lock_reason" },
        { table: "DATA_TeminDosyasi", column: "kayit_kaynagi" },
        { table: "DATA_TeminDosyasi", column: "aktarim_grubu_id" },
        { table: "DATA_TeminDosyasi", column: "kaynak_kayit_id" },
        { table: "TANIM_KomisyonUye", column: "imza_turu" },
        { table: "TANIM_KomisyonUye", column: "birim_id" },
        { table: "TANIM_KomisyonUye", column: "birim" },
        { table: "DATA_TeminKomisyon", column: "imza_turu" },
        { table: "DATA_TeminKomisyon", column: "birim_id" },
        { table: "DATA_TeminKomisyon", column: "birim" }
      ]
    }
  ]
};

export default temin360Manifest;
