import type { TableSchema } from '../types'

/**
 * DATA_IhaleKalem: İhale Dosyasına Bağlı Kalemler (Malzeme, Hizmet, Yapım İşi)
 */
export const DATA_IhaleKalem: TableSchema = {
  name: 'DATA_IhaleKalem',
  description: 'İhale dosyasına bağlı malzeme, hizmet veya yapım işi kalemleri',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true, description: 'Sıra / ID' },
    { name: 'ihale_dosya_id', type: 'INTEGER', notNull: true, description: 'Bağlı Olduğu İhale Dosya ID' },
    { name: 'temin_dosya_id', type: 'INTEGER', description: 'Geriye dönük uyumluluk için dosya ID alias' },
    { name: 'dosya_id', type: 'INTEGER', description: 'Geriye dönük uyumluluk için dosya ID alias' },
    { name: 'sira_no', type: 'INTEGER', description: 'Kalem Sıra No' },
    { name: 'barkod_id', type: 'TEXT', description: 'Barkod ID' },
    { name: 'tasinir_kodu', type: 'TEXT', description: 'Taşınır Kodu' },
    { name: 'okas_kodu', type: 'TEXT', description: 'OKAS Kodu' },
    { name: 'kalem_adi', type: 'TEXT', notNull: true, description: 'Malzeme / Hizmet / İş Adı' },
    { name: 'tipi', type: 'TEXT', notNull: true, default: "'Mal'", description: 'Alım Tipi (Mal/Hizmet/Yapım/Danışmanlık)' },
    { name: 'birim', type: 'TEXT', default: "'Adet'", description: 'Ölçü Birimi (Adet, Kg, Lt vb.)' },
    { name: 'miktar', type: 'REAL', notNull: true, default: 1, description: 'Miktar' },
    { name: 'kdv_orani', type: 'REAL', default: 20, description: 'KDV Oranı (%)' },
    { name: 'aciklama', type: 'TEXT', description: 'Kalem Açıklaması' },
    { name: 'poz_no', type: 'TEXT', description: 'Poz No (Yapım İşi)' },
    { name: 'poz_yili', type: 'INTEGER', description: 'Poz Yılı (Yapım İşi)' },
    { name: 'poz_tanimi', type: 'TEXT', description: 'Poz Tanımı' },
    { name: 'olcu_birimi', type: 'TEXT', description: 'Ölçü Birimi' },
    { name: 'yapi_sinifi', type: 'TEXT', description: 'Yapı Sınıfı' },
    { name: 'fiyat_donemi', type: 'TEXT', description: 'Fiyat Dönemi' },
    { name: 'gorsel_url', type: 'TEXT', description: 'Kalem Görseli' },
    { name: 'gorseller', type: 'TEXT', description: 'Ek Görseller (JSON Array)' }
  ]
}
