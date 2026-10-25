/* eslint-disable */
/**
 * RC SÜRÜM ŞEMA MANİFESTİ (1.0.0-rc.7)
 * Yeni: DATA_TeminDosyasi kilit ve harici aktarım takip kolonları (schema 46)
 */
export default {
  app: "1.0.0-rc.7",
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
