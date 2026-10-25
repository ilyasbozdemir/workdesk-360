/* eslint-disable */
/**
 * İHALE 360 (4734 Sayılı Kamu İhale Kanunu Md. 19 / 21) Şema Manifesti
 */
export const ihale360Manifest = {
  app: "ihale360-desktop",
  target: "ihale360-desktop",
  target_scope: "ihale",
  version: "1.0.0-beta.1",
  suite: "workdesk-360",
  schema_min: 1,
  schema_max: 46,
  release_date: "2026-10-25",
  changes: [
    {
      schema: 46,
      type: "suite_parity",
      description: "İhale 360 Kamu İhalesi Masası (KİK Md. 19/21) v46 şema paritesi ve süreç takip desteği.",
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

export default ihale360Manifest;
