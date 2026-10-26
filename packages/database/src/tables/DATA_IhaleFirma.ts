import type { TableSchema } from '../types'

/**
 * DATA_IhaleFirma: İhaleye Teklif Veren veya Davet Edilen Firmalar
 */
export const DATA_IhaleFirma: TableSchema = {
  name: 'DATA_IhaleFirma',
  description: 'İhale dosyasına bağlı teklif veren veya davet edilen firmalar',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true, description: 'Sıra / ID' },
    { name: 'ihale_dosya_id', type: 'INTEGER', notNull: true, description: 'Bağlı Olduğu İhale Dosya ID' },
    { name: 'temin_dosya_id', type: 'INTEGER', description: 'Geriye dönük uyumluluk alias' },
    { name: 'firma_id', type: 'INTEGER', notNull: true, description: 'Bağlı Olduğu Firma ID (TANIM_Firma)' },
    { name: 'kazanan_mi', type: 'INTEGER', default: 0, description: 'İhaleyi Kazanan Firma mı?' },
    { name: 'toplam_teklif', type: 'REAL', default: 0, description: 'Toplam Teklif Tutarı' },
    { name: 'indirim_orani', type: 'REAL', default: 0, description: 'İndirim Oranı (%)' },
    { name: 'gecici_teminat_tutari', type: 'REAL', default: 0, description: 'Geçici Teminat Tutarı' },
    { name: 'kesin_teminat_tutari', type: 'REAL', default: 0, description: 'Kesin Teminat Tutarı' },
    { name: 'teklif_tarihi', type: 'DATE', description: 'Teklif Tarihi' },
    { name: 'aciklama', type: 'TEXT', description: 'Açıklama / Notlar' }
  ]
}
