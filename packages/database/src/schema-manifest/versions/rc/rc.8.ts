/* eslint-disable */
/**
 * RC SÜRÜM ŞEMA MANİFESTİ (1.0.0-rc.8)
 * 
 * Bu şema manifesti, monorepo bünyesindeki tüm masaüstü uygulamalarının
 * ortak SQLite veritabanı şema standardını (Sürüm 46) ve her bir uygulamanın
 * aktif geliştirme/dağıtım sürümlerini tanımlar:
 * 
 *  1. temin360-desktop: 1.0.0-rc.7 (Doğrudan Temin ve Harcama Masası - RC)
 *  2. ihale360-desktop: 1.0.0-beta.1 (4734 Sayılı KİK Kamu İhalesi Masası - Beta)
 *  3. devlet-ihale-2886-desktop: 1.0.0-beta.1 (2886 Sayılı Devlet İhale Kanunu Masası - Beta)
 */
export default {
  app: "1.0.0-rc.8",
  suite: "workdesk-360",
  apps: {
    "temin360-desktop": "1.0.0-rc.7",
    "ihale360-desktop": "1.0.0-beta.1",
    "devlet-ihale-2886-desktop": "1.0.0-beta.1"
  },
  schema_min: 1,
  schema_max: 46,
  release_date: "2026-10-25",
  changes: [
    {
      schema: 46,
      type: "column_added",
      description: "DATA_TeminDosyasi tablosuna kilit ve harici aktarım takip kolonları eklendi (is_locked, lock_reason, kayit_kaynagi, aktarim_grubu_id, kaynak_kayit_id).",
      columns_added: [
        { table: "DATA_TeminDosyasi", column: "is_locked" },
        { table: "DATA_TeminDosyasi", column: "lock_reason" },
        { table: "DATA_TeminDosyasi", column: "kayit_kaynagi" },
        { table: "DATA_TeminDosyasi", column: "aktarim_grubu_id" },
        { table: "DATA_TeminDosyasi", column: "kaynak_kayit_id" }
      ]
    }
  ]
};
