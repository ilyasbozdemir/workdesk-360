import type { TableSchema } from '../types'

/**
 * DATA_IhaleDosyasi: 4734 Sayılı Kamu İhale Kanunu İhale Dosyaları Ana Tablosu
 * (Madde 19 Açık İhale, Madde 20 Belli İstekliler, Madde 21 Pazarlık Usulü)
 */
export const DATA_IhaleDosyasi: TableSchema = {
  name: 'DATA_IhaleDosyasi',
  description: 'Kamu ihale dosyalarının (4734 Md. 19/21 vb.) ana kayıtları',
  columns: [
    {
      name: 'id',
      type: 'INTEGER',
      primaryKey: true,
      autoIncrement: true,
      description: 'Kayıt Numarası'
    },
    { name: 'ihale_kayit_no', type: 'TEXT', description: 'EKAP İhale Kayıt Numarası (İKN - Örn: 2026/123456)' },
    { name: 'dosya_no', type: 'TEXT', description: 'Kurum İçi Dosya Numarası' },
    { name: 'temin_no', type: 'TEXT', description: 'Kurum İçi Numara / Dosya No (Geriye Dönük Uyumluluk)' },
    { name: 'dosya_acilis_tarihi', type: 'DATE', description: 'Dosya Açılış Tarihi' },
    { name: 'butce_yili', type: 'INTEGER', description: 'Bütçe Yılı' },
    { name: 'butce_tipi', type: 'TEXT', description: 'Bütçe Tipi' },
    {
      name: 'konu',
      type: 'TEXT',
      notNull: true,
      description: 'İşin Adı / İhale Konusu'
    },
    { name: 'isin_aciklamasi', type: 'TEXT', description: 'İşin Detaylı Açıklaması' },
    { name: 'isin_aciklama_maddeleri', type: 'TEXT', description: 'İşin Açıklama Maddeleri (JSON Array)' },
    { name: 'birim_id', type: 'INTEGER', description: 'İhalesi Yapılacak Birim ID (TANIM_Birim)' },
    { name: 'birim', type: 'TEXT', description: 'Birim Adı' },

    // İdari ve Antet Alanları
    { name: 'antet_ek_satir', type: 'TEXT', description: 'Antet Ek Satır' },
    { name: 'sunulacak_makam', type: 'TEXT', description: 'Sunulacak Makam' },
    { name: 'ihtiyac_yeri', type: 'TEXT', description: 'İhtiyaç Yeri' },

    // Mali Kodlar
    { name: 'e_butce', type: 'TEXT', description: 'E-Bütçe' },
    { name: 'say2000i', type: 'TEXT', description: 'Say2000i' },
    { name: 'fonksiyonel_kod', type: 'TEXT', description: 'Fonksiyonel Kod' },
    { name: 'muhasebe_birimi', type: 'TEXT', description: 'Muhasebe Birimi' },
    { name: 'harcama_birimi', type: 'TEXT', description: 'Harcama Birimi' },
    { name: 'finansman_kodu', type: 'TEXT', description: 'Finansman Kodu' },
    { name: 'ekonomik_kod', type: 'TEXT', description: 'Ekonomik Kod' },

    // İhale Usulü ve Türü
    {
      name: 'ihale_usulu',
      type: 'TEXT',
      default: "'Açık İhale (Md. 19)'",
      description: 'İhale Usulü: Açık İhale (Md. 19) | Pazarlık (Md. 21/b, 21/f) | Belli İstekliler (Md. 20)'
    },
    {
      name: 'ihale_tipi',
      type: 'TEXT',
      default: "'Açık İhale'",
      description: 'İhale Tipi'
    },
    {
      name: 'madde',
      type: 'TEXT',
      description: 'İhale Yasal Dayanağı / Mevzuat Maddesi'
    },
    {
      name: 'tur',
      type: 'TEXT',
      notNull: true,
      default: "'mal'",
      description: 'İhale Türü: mal | hizmet | yapim_isi | danismanlik'
    },
    { name: 'ihale_sekli', type: 'TEXT', description: 'İhale Şekli' },

    // Teklif ve Sözleşme Yapısı
    { name: 'teklif_sozlesme_turu', type: 'TEXT', description: 'Birim Fiyat | Götürü Bedel | Karma' },
    { name: 'alt_yuklenici_olacak_mi', type: 'INTEGER', default: 0, description: 'Alt Yüklenici Çalıştırılacak mı?' },
    { name: 'kismi_teklif_verilecek_mi', type: 'INTEGER', default: 0, description: 'Kısmi Teklif Verilecek mi?' },
    { name: 'yatirim_proje_no', type: 'TEXT', description: 'Yatırım Proje Numarası' },
    { name: 'project_id', type: 'INTEGER', description: 'Bağlı Olduğu Proje ID (TANIM_Proje)' },
    { name: 'proje_adi', type: 'TEXT', description: 'Bağlı Olduğu Proje Adı' },
    { name: 'tags', type: 'TEXT', default: "'[]'", description: 'Etiketler (JSON Array)' },

    { name: 'avans_verilecek_mi', type: 'INTEGER', default: 0, description: 'Avans Verilecek mi?' },
    { name: 'yillara_yaygin', type: 'INTEGER', default: 0, description: 'Yıllara Yaygın Hizmet Alımı mı?' },
    { name: 'sozlesme_yapilacak_mi', type: 'INTEGER', default: 1, description: 'Sözleşme Yapılacak mı?' },
    { name: 'komisyon_seed_edildi', type: 'INTEGER', description: 'Komisyon varsayılan durumu' },

    // Hesaplama ve Maliyet
    { name: 'yaklasik_maliyet_hesaplamasi', type: 'TEXT', description: 'Yaklaşık Maliyet Hesaplaması' },
    { name: 'yaklasik_maliyet_kdv_dahil_mi', type: 'INTEGER', default: 0, description: 'Yaklaşık Maliyet KDV Dahil mi?' },
    { name: 'kdv', type: 'TEXT', description: 'KDV Oranı/Metni' },
    { name: 'hesaplama_esasi', type: 'TEXT', description: 'Hesaplama Esası' },
    { name: 'komisyon_takdiri', type: 'TEXT', description: 'Komisyon Takdiri' },
    { name: 'tibbi_cihaz_alimi_mi', type: 'INTEGER', default: 0, description: 'Tıbbi Cihaz Alımı mı?' },

    // Süreç / Tarihler / Yetkililer
    { name: 'irtibat_yetkilisi_id', type: 'INTEGER', description: 'İrtibat Yetkilisi ID' },
    { name: 'ilan_tarihi', type: 'DATE', description: 'İhale İlan Tarihi' },
    { name: 'son_teklif_verme_tarihi', type: 'DATETIME', description: 'Son Teklif Verme Tarihi ve Saati' },
    { name: 'ihale_tarihi_saati', type: 'DATETIME', description: 'İhale / Oturum Tarihi ve Saati' },
    { name: 'teslim_tarihi', type: 'DATE', description: 'Teslim / İşi Bitirme Tarihi' },
    { name: 'teslim_gun', type: 'INTEGER', default: 30, description: 'Teslim Süresi (Gün)' },

    { name: 'yaklasik_maliyet', type: 'REAL', default: 0, description: 'Yaklaşık Maliyet Tutarı' },
    { name: 'sozlesme_bedeli', type: 'REAL', default: 0, description: 'Sözleşme / İhale Bedeli' },
    { name: 'kesinti_damga', type: 'REAL', default: 0, description: 'Damga Vergisi Kesintisi' },
    { name: 'kesinti_karar_pulu', type: 'REAL', default: 0, description: 'Karar Pulu Kesintisi' },
    { name: 'kesinti_kdv_tevkifat', type: 'REAL', default: 0, description: 'KDV Tevkifat Kesintisi' },
    { name: 'net_odenen', type: 'REAL', default: 0, description: 'Net Ödenen Tutar' },
    { name: 'butce_kodu', type: 'TEXT', description: 'Bütçe Kodu' },
    { name: 'temin_tarihi', type: 'DATE', description: 'İhale / Karar Tarihi' },
    { name: 'firma_id', type: 'INTEGER', description: 'Seçilen Kazanan Firma ID (TANIM_Firma)' },
    { name: 'onay_personel_id', type: 'INTEGER', description: 'İhale Onay Yetkilisi / Harcama Yetkilisi ID' },
    { name: 'hazirlayan_personel_id', type: 'INTEGER', description: 'Hazırlayan Personel ID' },
    { name: 'talep_eden_personel_id', type: 'INTEGER', description: 'Talep Eden Personel ID' },
    { name: 'sunan_personel_id', type: 'INTEGER', description: 'Sunan Personel ID' },
    { name: 'durum_asama_id', type: 'INTEGER', default: 1, description: 'Durum Aşama ID' },
    { name: 'mevzuat_id', type: 'INTEGER', description: 'Mevzuat ID (TANIM_Mevzuat)' },
    { name: 'surec_taslak_id', type: 'INTEGER', description: 'Süreç Taslak ID' },
    { name: 'ordered_docs', type: 'TEXT', description: 'Dosyaya özel belge sıralaması (JSON)' },
    { name: 'starred_docs', type: 'TEXT', description: 'Yıldızlı belgeler (JSON)' },
    { name: 'skipped_docs', type: 'TEXT', description: 'Atlanmış belgeler (JSON)' },
    { name: 'sablon_tercihleri', type: 'TEXT', default: "'{}'", description: 'Şablon tercihleri (JSON)' },
    { name: 'notlar', type: 'TEXT', description: 'Notlar' },
    { name: 'tekrar_no', type: 'INTEGER', default: 1, description: 'Tekrar Numarası' },
    { name: 'status', type: 'TEXT', default: "'devam_ediyor'", description: 'Durum (devam_ediyor, tamamlandi, iptal vb.)' },

    // Kilit ve Dış Aktarım Takibi
    { name: 'is_locked', type: 'INTEGER', default: 0, description: 'Dosya Kilitli mi?' },
    { name: 'lock_reason', type: 'TEXT', description: 'Kilit Nedeni' },
    { name: 'kayit_kaynagi', type: 'TEXT', default: "'manual'", description: 'Kayıt Kaynağı (manual | import | ekap)' },
    { name: 'aktarim_grubu_id', type: 'TEXT', description: 'Aktarım Grubu ID' },
    { name: 'kaynak_kayit_id', type: 'TEXT', description: 'Harici Sistem Kayıt ID' }
  ]
}
