export const DATA_TeminBelgeSnapshot = {
  name: 'DATA_TeminBelgeSnapshot',
  description: 'Her TEMİN dosyasına ve şablona ait belge anlık görüntüsü (snapshot) verilerini tutar',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true, description: 'Snapshot birincil anahtarı' },
    { name: 'dosya_id', type: 'INTEGER', notNull: true, description: 'Bağlı olduğu TEMİN dosyasının ID referansı (DATA_TeminDosyasi.id)' },
    { name: 'sablon_id', type: 'INTEGER', description: 'Şablon ID (TANIM_Sablon referansı)' },
    { name: 'sablon_kodu', type: 'TEXT', notNull: true, description: 'Belge şablonunun benzersiz kodu (Örn: luzum_muzekkeresi, ihtiyac_listesi)' },
    { name: 'veri_json', type: 'TEXT', notNull: true, description: 'Anlık Görüntü JSON verisi' },
    { name: 'sablon_versiyon', type: 'INTEGER', default: 1, description: 'Şablon sürümü' },
    { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP', description: 'Oluşturulma tarihi' },
    { name: 'updated_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP', description: 'Son güncellenme tarihi' },
    { name: 'created_by', type: 'INTEGER', default: 'NULL', description: 'Oluşturan kullanıcı ID' },
    { name: 'updated_by', type: 'INTEGER', default: 'NULL', description: 'Güncelleyen kullanıcı ID' },
    { name: 'is_active', type: 'INTEGER', default: 1, description: 'Aktiflik durumu (1: aktif, 0: pasif)' },
    { name: 'is_deleted', type: 'INTEGER', default: 0, description: 'Soft delete durumu (0: silinmemiş, 1: silinmiş)' }
  ],
  constraints: [
    'FOREIGN KEY(dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE',
    'UNIQUE(dosya_id, sablon_kodu)'
  ],
  initialData: []
}

