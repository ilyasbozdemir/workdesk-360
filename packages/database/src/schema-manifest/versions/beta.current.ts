/* eslint-disable */
/**
 * AKTİF GELİŞTİRME ŞEMA MANİFESTİ (Workdesk 360 Monorepo Suite)
 * 
 * Bu şema manifesti, monorepo bünyesindeki tüm masaüstü uygulamalarının
 * ortak SQLite veritabanı şema standardını (Sürüm 46) ve her bir uygulamanın
 * aktif geliştirme/dağıtım sürümlerini tanımlar:
 * 
 *  1. temin360-desktop: 1.0.0-rc.12 (Doğrudan Temin ve Harcama Masası - RC)
 *  2. ihale360-desktop: 1.0.0-beta.1 (4734 Sayılı KİK Kamu İhalesi Masası - Beta)
 *  3. devlet-ihale-2886-desktop: 1.0.0-beta.1 (2886 Sayılı Devlet İhale Kanunu Masası - Beta)
 */
export default {
  app: "1.0.0-beta.current",
  suite: "workdesk-360",
  apps: {
    "temin360-desktop": "1.0.0-rc.12",
    "ihale360-desktop": "1.0.0-beta.1",
    "devlet-ihale-2886-desktop": "1.0.0-beta.1"
  },
  schema_min: 1,
  schema_max: 46,
  release_date: "2026-11-07",
  changes: [
    {
      schema: 46,
      type: "column_added",
      description: "DATA_TeminDosyasi tablosuna kilit/aktarım takip ve antet birim görünürlük kolonları (antet_birim_gosterilsin); TANIM_KomisyonUye ve DATA_TeminKomisyon tablolarına birim ve imza türü kolonları (imza_turu, birim_id, birim) eklendi.",
      columns_added: [
        { table: "DATA_TeminDosyasi", column: "is_locked" },
        { table: "DATA_TeminDosyasi", column: "lock_reason" },
        { table: "DATA_TeminDosyasi", column: "kayit_kaynagi" },
        { table: "DATA_TeminDosyasi", column: "aktarim_grubu_id" },
        { table: "DATA_TeminDosyasi", column: "kaynak_kayit_id" },
        { table: "DATA_TeminDosyasi", column: "antet_birim_gosterilsin" },
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
