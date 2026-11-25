import type { LogicalIndex } from '../types';

/**
 * WorkDesk 360 ekosistemi için merkezi indeks kataloğu.
 * packages/database/src/index.ts içindeki hardcoded script indekslerini ve
 * ilişkisel sorgulama için gerekli yabancı anahtar indekslerini içerir.
 */
export const INDEX_REGISTRY: Record<string, LogicalIndex[]> = {
  TANIM_TasinirKod: [
    {
      name: 'idx_tasinirkod_tam_kod',
      tableName: 'TANIM_TasinirKod',
      columns: ['tam_kod'],
      origin: 'explicit_script',
    },
    {
      name: 'idx_tasinirkod_hesap',
      tableName: 'TANIM_TasinirKod',
      columns: ['hesap_kodu'],
      origin: 'explicit_script',
    },
  ],
  TANIM_OkasKod: [
    {
      name: 'idx_okaskod_kod',
      tableName: 'TANIM_OkasKod',
      columns: ['kod'],
      origin: 'explicit_script',
    },
  ],
  DATA_TeminKalem: [
    {
      name: 'idx_teminkalem_dosya_id',
      tableName: 'DATA_TeminKalem',
      columns: ['temin_dosya_id'],
      origin: 'foreign_key_helper',
    },
  ],
  DATA_TeminFirma: [
    {
      name: 'idx_teminfirma_dosya_id',
      tableName: 'DATA_TeminFirma',
      columns: ['temin_dosya_id'],
      origin: 'foreign_key_helper',
    },
  ],
  DATA_TeminKalemTeklif: [
    {
      name: 'idx_teminteklif_dosya_kalem',
      tableName: 'DATA_TeminKalemTeklif',
      columns: ['temin_dosya_id', 'temin_kalem_id'],
      origin: 'foreign_key_helper',
    },
  ],
  DATA_TeminBelgeSnapshot: [
    {
      name: 'idx_snapshot_dosya_sablon',
      tableName: 'DATA_TeminBelgeSnapshot',
      columns: ['dosya_id', 'sablon_kodu'],
      origin: 'foreign_key_helper',
    },
  ],
};
