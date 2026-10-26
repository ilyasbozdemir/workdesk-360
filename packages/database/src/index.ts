/* eslint-disable */
import Database from 'better-sqlite3'

// ============================================================================
// 1. KURUM, TEŞKİLAT VE PERSONEL TANIMLARI
// ============================================================================
import { TANIM_Kurum } from './tables/TANIM_Kurum'
import { TANIM_Birim } from './tables/TANIM_Birim'
import { TANIM_Personel } from './tables/TANIM_Personel'
import { TANIM_PersonelUnvanGecmisi } from './tables/TANIM_PersonelUnvanGecmisi'
import { TANIM_Roller } from './tables/TANIM_Roller'

// ============================================================================
// 2. MEVZUAT, SÜREÇ AŞAMALARI VE LİMİTLER
// ============================================================================
import { TANIM_Mevzuat } from './tables/TANIM_Mevzuat'
import { TANIM_Asama } from './tables/TANIM_Asama'
import { TANIM_AlimTuru } from './tables/TANIM_AlimTuru'
import { TANIM_KikLimitDonemleri } from './tables/TANIM_KikLimitDonemleri'
import { TANIM_SurecTaslak } from './tables/TANIM_SurecTaslak'

// ============================================================================
// 3. FİRMA VE TEDARİKÇİ YÖNETİMİ
// ============================================================================
import { TANIM_Firma } from './tables/TANIM_Firma'
import { TANIM_FirmaIletisimNotu } from './tables/TANIM_FirmaIletisimNotu'

// ============================================================================
// 4. MALZEME, POZ, TAŞINIR VE BÜTÇE KODLARI
// ============================================================================
import { TANIM_Kalem } from './tables/TANIM_Kalem'
import { TANIM_Poz } from './tables/TANIM_Poz'
import { TANIM_OlcuBirimi } from './tables/TANIM_OlcuBirimi'
import { TANIM_BirimDonusum } from './tables/TANIM_BirimDonusum'
import { TANIM_TasinirKod } from './tables/TANIM_TasinirKod'
import { TANIM_OkasKod } from './tables/TANIM_OkasKod'
import { TANIM_ButceKod } from './tables/TANIM_ButceKod'
import { TANIM_ButceOdenek } from './tables/TANIM_ButceOdenek'
import { TANIM_KodSozlugu } from './tables/TANIM_KodSozlugu'
import { TANIM_Proje } from './tables/TANIM_Proje'

// ============================================================================
// 5. KOMİSYON VE HEYET TANIMLARI
// ============================================================================
import { TANIM_KomisyonGorevi } from './tables/TANIM_KomisyonGorevi'
import { TANIM_Komisyon } from './tables/TANIM_Komisyon'
import { TANIM_KomisyonUye } from './tables/TANIM_KomisyonUye'
import { TANIM_Komisyon_Sablon } from './tables/TANIM_Komisyon_Sablon'

// ============================================================================
// 6. AMBAR VE DEPO YÖNETİMİ TANIMLARI
// ============================================================================
import { TANIM_Ambar } from './tables/TANIM_Ambar'

// ============================================================================
// 7. ŞABLON VE YER TUTUCU (PLACEHOLDER) TANIMLARI
// ============================================================================
import { TANIM_Sablon } from './tables/TANIM_Sablon'
import { TANIM_Placeholder } from './tables/TANIM_Placeholder'
import { TANIM_AlimTuru_Sablon } from './tables/TANIM_AlimTuru_Sablon'
import { SABLON_Placeholder } from './tables/SABLON_Placeholder'

// ============================================================================
// 8. TEMİN DOSYASI VE İHALE SÜREÇ VERİLERİ (DATA_)
// ============================================================================
import { DATA_TeminDosyasi } from './tables/DATA_TeminDosyasi'
import { DATA_TeminKalem } from './tables/DATA_TeminKalem'
import { DATA_TeminFirma } from './tables/DATA_TeminFirma'
import { DATA_TeminKalemTeklif } from './tables/DATA_TeminKalemTeklif'
import { DATA_TeminKomisyon } from './tables/DATA_TeminKomisyon'
import { DATA_TeminBelge } from './tables/DATA_TeminBelge'
import { DATA_DosyaSablonVeri } from './tables/DATA_DosyaSablonVeri'
import { DATA_DosyaRevizyon } from './tables/DATA_DosyaRevizyon'
import { DATA_IhtiyacRaporu } from './tables/DATA_IhtiyacRaporu'
import { DATA_IhtiyacRaporuKalem } from './tables/DATA_IhtiyacRaporuKalem'
import { DATA_IhaleDosyasi } from './tables/DATA_IhaleDosyasi'
import { DATA_IhaleKalem } from './tables/DATA_IhaleKalem'
import { DATA_IhaleFirma } from './tables/DATA_IhaleFirma'

// ============================================================================
// 9. TAŞINIR (TİF) VE AMBAR STOK HAREKETLERİ (DATA_)
// ============================================================================
import { DATA_TIF } from './tables/DATA_TIF'
import { DATA_TIF_Kalem } from './tables/DATA_TIF_Kalem'
import { DATA_AmbarStok } from './tables/DATA_AmbarStok'
import { DATA_AmbarHareket } from './tables/DATA_AmbarHareket'

// ============================================================================
// 10. GÖREVLER, NOTLAR VE SERBEST KÜTÜPHANE VERİLERİ (DATA_)
// ============================================================================
import { DATA_NotVeGorev } from './tables/DATA_NotVeGorev'
import { DATA_KutuphaneGrup } from './tables/DATA_KutuphaneGrup'
import { DATA_KutuphaneBelge } from './tables/DATA_KutuphaneBelge'
import { DATA_KutuphaneBelgeSurum } from './tables/DATA_KutuphaneBelgeSurum'
import { DATA_KutuphaneYerTutucu } from './tables/DATA_KutuphaneYerTutucu'

// ============================================================================
// 11. SİSTEM DENETİM VE GÜNLÜK KAYITLARI (LOG_)
// ============================================================================
import { LOG_SystemLog } from './tables/LOG_SystemLog'

import { runMigrations, CURRENT_SCHEMA_VERSION, getAppSchemaMax } from './migrate'
import { defineTable } from './BaseTable'

/**
 * Sistemde kayıtlı tüm veritabanı tablo tanımları listesi.
 * Kurumsal tanımlar (`TANIM_*`), süreç verileri (`DATA_*`) ve denetim loglarını (`LOG_*`) kapsar.
 * Her tanım SQLite DDL oluşturucu (`defineTable`) tarafından işlenir.
 */
const rawTables = [
  // =========================================================================
  // 1. KURUM, TEŞKİLAT VE PERSONEL TANIMLARI
  // =========================================================================

  /**
   * **TANIM_Kurum**: İdari Kurum Kimlik Bilgileri
   * - **İş İhtiyacı:** Resmi yazışma antetleri, vergi no/dairesi, harcama ve muhasebe birimi kodları ile kurum logosunu saklar.
   * - **Kritik Sütunlar:** `id` (PK), `kurum_adi`, `vergi_no`, `harcama_birimi_kodu`, `muhasebe_birimi_kodu`, `antet_satir_1`, `antet_satir_2`, `aktif_mi`.
   * - **İlişkiler:** Evrak üretiminde `settings.activeKurumId` üzerinden tekil aktif idare olarak referans alınır.
   */
  TANIM_Kurum,

  /**
   * **TANIM_Mevzuat**: Kamu İhale Mevzuatı Parametreleri
   * - **İş İhtiyacı:** 4734, 4735, 5018 ve 2886 sayılı kanunların maddeleri, açıklamaları ve geçerlilik kurallarını tutar.
   * - **Kritik Sütunlar:** `id` (PK), `kanun_adi`, `madde_no`, `baslik`, `icerik`, `parametreler_json`, `aktif_mi`.
   */
  TANIM_Mevzuat,

  /**
   * **TANIM_Birim**: Kurum Harcama ve Talep Birimleri
   * - **İş İhtiyacı:** Müdürlükler, şube müdürlükleri ve alt servisleri tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `ad`, `kod`, `muhasebe_birimi_kodu`, `harcama_birimi_kodu`, `aktif_mi`.
   * - **İlişkiler:** `DATA_TeminDosyasi.birim_id` ve `DATA_IhtiyacRaporu.talep_eden_birim_id` buraya bağlanır.
   */
  TANIM_Birim,

  /**
   * **TANIM_Personel**: Kurum Personel Sicil Havuzu
   * - **İş İhtiyacı:** İhale yetkilisi, gerçekleştirme görevlisi, komisyon üyeleri ve muayene kabul raportörlerini tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `ad_soyad`, `unvan`, `tc_kimlik`, `telefon`, `eposta`, `aktif_mi`.
   * - **İlişkiler:** `TANIM_Roller`, `TANIM_KomisyonUye` ve `DATA_TeminKomisyon` tablolarının birincil personel kaynağıdır.
   */
  TANIM_Personel,

  /**
   * **TANIM_PersonelUnvanGecmisi**: Personel Kadro ve Unvan Geçmişi
   * - **İş İhtiyacı:** Personelin terfi veya unvan değişikliklerini tarihsel olarak izler; geçmiş tarihli belgelerde o tarihteki unvanın korunmasını sağlar.
   * - **Kritik Sütunlar:** `id` (PK), `personel_id` (FK), `unvan`, `baslangic_tarihi`, `bitis_tarihi`, `aktif_mi`.
   * - **İlişkiler:** `personel_id` -> `TANIM_Personel(id)` ON DELETE CASCADE.
   */
  TANIM_PersonelUnvanGecmisi,

  /**
   * **TANIM_Roller**: Süreç ve İmza Rolleri Eşleştirme
   * - **İş İhtiyacı:** İhale/temin süreçlerindeki standart rollerin (Harcama Yetkilisi, Gerçekleştirme Görevlisi, vb.) varsayılan personelle eşleştirilmesini sağlar.
   * - **Kritik Sütunlar:** `id` (PK), `rol_kodu` (UNIQUE), `rol_adi`, `varsayilan_personel_id` (FK), `sira`.
   * - **İlişkiler:** `varsayilan_personel_id` -> `TANIM_Personel(id)`.
   */
  TANIM_Roller,

  // =========================================================================
  // 2. SÜREÇ AŞAMALARI, ALIM TÜRLERİ VE LİMİTLER
  // =========================================================================

  /**
   * **TANIM_Asama**: İş Akışı Süreç Aşamaları (Status)
   * - **İş İhtiyacı:** Bir dosyanın baştan sona ilerlediği standart aşamaları (Hazırlık, Piyasa Fiyat Araştırması, Onay, Sipariş/Sözleşme, Muayene/Ödeme) tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE, örn: 'HAZIRLIK'), `ad`, `sira`, `zorunlu_mu`, `aktif_mi`.
   * - **İlişkiler:** `DATA_TeminDosyasi.asama` ile eşleşir.
   */
  TANIM_Asama,

  /**
   * **TANIM_Firma**: İstekli ve Tedarikçi Firma Havuzu
   * - **İş İhtiyacı:** Teklif veren, ihalelere katılan ve sözleşme yapılan tedarikçi firmaların yasal ve iletişim kayıtlarını saklar.
   * - **Kritik Sütunlar:** `id` (PK), `unvan`, `vergi_no` (indeksli), `vergi_dairesi`, `adres`, `telefon`, `eposta`, `iban`, `kara_listede_mi`.
   * - **İlişkiler:** `DATA_TeminFirma.firma_id` üzerinden dosyalara bağlanır.
   */
  TANIM_Firma,

  /**
   * **TANIM_FirmaIletisimNotu**: Firma Görüşme ve Teklif İletişim Notları
   * - **İş İhtiyacı:** Tedarikçi firmalarla yapılan telefon, e-posta ve yüz yüze görüşmelerin tarihsel kaydını tutar.
   * - **Kritik Sütunlar:** `id` (PK), `firma_id` (FK), `tarih`, `gorusulen_kisi`, `konu`, `notlar`, `hatirlatici_tarihi`.
   * - **İlişkiler:** `firma_id` -> `TANIM_Firma(id)`.
   */
  TANIM_FirmaIletisimNotu,

  /**
   * **TANIM_Ambar**: Kurum Depo ve Ambarları
   * - **İş İhtiyacı:** Malzeme giriş-çıkışının yapıldığı ana ambar, demirbaş deposu ve kırtasiye ambarlarını tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `birim_id` (FK), `sorumlu_personel_id` (FK), `aktif_mi`.
   * - **İlişkiler:** `DATA_TIF` ve `DATA_AmbarStok` tabloları bu depolara referans verir.
   */
  TANIM_Ambar,

  /**
   * **TANIM_Proje**: Yatırım ve Alım Projeleri
   * - **İş İhtiyacı:** Birden fazla doğrudan temin veya ihale dosyasını üst bir yatırım/faaliyet projesi altında toplar.
   * - **Kritik Sütunlar:** `id` (PK), `proje_no`, `proje_adi`, `baslangic_yili`, `bitis_yili`, `toplam_butce`, `durum`.
   * - **İlişkiler:** `DATA_TeminDosyasi.project_id` bu tabloya bağlanır.
   */
  TANIM_Proje,

  // =========================================================================
  // 3. KOD HİYERARŞİLERİ, BÜTÇE VE POZ KATALOĞU
  // =========================================================================

  /**
   * **TANIM_TasinirKod**: Taşınır Kod Listesi Hiyerarşisi
   * - **İş İhtiyacı:** Taşınır Mal Yönetmeliği'ne uygun 150, 253, 255 gibi detay hesap kodlarını (Düzey 1-5) barındırır.
   * - **Kritik Sütunlar:** `id` (PK), `tam_kod` (UNIQUE, indeksli), `ad`, `hesap_kodu` (indeksli), `duzey`, `aktif_mi`.
   * - **İlişkiler:** TİF fişi üretiminde (`DATA_TIF_Kalem.tasinir_kod_id`) zorunlu sınıflandırmadır.
   */
  TANIM_TasinirKod,

  /**
   * **TANIM_OkasKod**: Ortak Kamu Alımları Sözlüğü (OKAS / CPV) Kodları
   * - **İş İhtiyacı:** EKAP ve kamu alımları mevzuatına uygun 8 haneli CPV/OKAS kod sınıflandırmasını tutar.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE, indeksli), `tanim`, `kategori`.
   */
  TANIM_OkasKod,

  /**
   * **TANIM_ButceKod**: Analitik Bütçe Ekonomik Kodları (1-4 Düzey)
   * - **İş İhtiyacı:** Harcama tertiplerini ve analitik bütçe sınıflandırmasını (örn: 03.2.1.01 Kırtasiye) yönetir.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `duzey`, `ust_kod`.
   * - **İş Kuralı:** İhale onay belgesi ve harcama talimatında bütçe tertibini doğrular.
   */
  TANIM_ButceKod,

  /**
   * **TANIM_ButceOdenek**: Birim Yıllık Bütçe Ödenek ve %10 Limit Takibi
   * - **İş İhtiyacı:** Harcama birimlerinin bütçe tertiplerine ayrılan ödeneklerini ve 4734 Md. 22/d doğrudan temin %10 parasal limit tüketimini izler.
   * - **Kritik Sütunlar:** `id` (PK), `birim_id` (FK), `butce_yili`, `ekonomik_kod`, `tahsis_edilen_odenek`, `bloke_edilen`, `harcanan`.
   */
  TANIM_ButceOdenek,

  /**
   * **TANIM_Kalem**: Ortak Malzeme ve Hizmet Kataloğu
   * - **İş İhtiyacı:** Sıkça satın alınan standart malzemeleri, varsayılan ölçü birimi ve taşınır kodlarıyla önceden tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `ad`, `varsayilan_olcu_birimi_id` (FK), `tasinir_kod_id` (FK), `kategori`, `kdv_orani`.
   */
  TANIM_Kalem,

  /**
   * **TANIM_Poz**: Resmi Birim Fiyat ve Poz Kataloğu (ÇŞB / Rayiçler)
   * - **İş İhtiyacı:** Çevre ve Şehircilik Bakanlığı ile diğer idarelerin yapım/hizmet analiz pozlarını ve yıllık fiyatlarını tutar.
   * - **Kritik Sütunlar:** `id` (PK), `poz_no` (UNIQUE), `tanimi`, `birimi`, `birim_fiyat`, `yil`, `kurum`, `analiz_json`.
   * - **İş Kuralı:** Yaklaşık maliyet cetveli ve hakediş icmallerinde doğrudan poz no üzerinden hesaplama yapar.
   */
  TANIM_Poz,

  /**
   * **TANIM_OlcuBirimi**: Standart Ölçü Birimleri Havuzu
   * - **İş İhtiyacı:** Malzeme ve hizmet kalemlerinde geçerli metrik/ticari ölçü birimlerini (Adet, Kg, Metre, Litre vb.) tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `sembol`, `kategori`, `ondalik_basamak`.
   */
  TANIM_OlcuBirimi,

  /**
   * **TANIM_BirimDonusum**: Ölçü Birimleri Arası Dönüşüm Katsayıları
   * - **İş İhtiyacı:** Ölçü birimleri arasındaki doğrusal katsayı ve formüllü dönüşümleri yönetir (örn: 1 Ton = 1000 Kg).
   * - **Kritik Sütunlar:** `id` (PK), `kaynak_birim_id` (FK), `hedef_birim_id` (FK), `katsayi`, `formul`.
   * - **İlişkiler:** `kaynak_birim_id`, `hedef_birim_id` -> `TANIM_OlcuBirimi(id)`.
   */
  TANIM_BirimDonusum,

  // =========================================================================
  // 4. ALIM TÜRLERİ, ŞABLON VE DİNAMİK YER TUTUCULAR
  // =========================================================================

  /**
   * **TANIM_AlimTuru**: Alım Türleri (Mal / Hizmet / Yapım / Danışmanlık)
   * - **İş İhtiyacı:** 4734 sayılı Kanun kapsamındaki 4 ana ihale türünü ve varsayılan yasal kesinti oranlarını belirler.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE: 'mal', 'hizmet', 'yapim_isi', 'danismanlik'), `ad`, `kdv_orani_varsayilan`, `damga_vergisi_orani`.
   * - **İlişkiler:** `DATA_TeminDosyasi.tur` alanı ile doğrudan eşleşir; kullanılacak belge setini sınırlar.
   */
  TANIM_AlimTuru,

  /**
   * **TANIM_Sablon**: Resmi Evrak Şablonları Kataloğu
   * - **İş İhtiyacı:** Onay Belgesi, Piyasa Araştırması Tutanağı, Sözleşme gibi resmi şablon dosyalarının metaverilerini saklar.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE, örn: 'onay_belgesi'), `ad`, `kategori`, `dosya_adi`, `versiyon`, `aktif_mi`.
   */
  TANIM_Sablon,

  /**
   * **TANIM_Placeholder**: Sistem Genelindeki Dinamik Değişkenler Sözlüğü
   * - **İş İhtiyacı:** Şablonlara gömülen `{{KURUM_ADI}}`, `{{YAKLASIK_MALIYET}}` gibi yer tutucuların veri kaynağını açıklar.
   * - **Kritik Sütunlar:** `id` (PK), `anahtar` (UNIQUE), `ad`, `veri_tipi`, `varsayilan_deger`, `kaynak_tablo`, `kaynak_kolon`.
   */
  TANIM_Placeholder,

  /**
   * **TANIM_AlimTuru_Sablon**: Alım Türü - Belge Şablonu Eşleştirme Matrisi
   * - **İş İhtiyacı:** Hangi alım türünde (örn: Yapım İşi) hangi belgelerin (örn: Keşif Özeti, Yer Teslim Tutanağı) üretileceğini tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `alim_turu_id` (FK), `sablon_id` (FK), `zorunlu_mu`, `sira`.
   * - **İlişkiler:** `alim_turu_id` -> `TANIM_AlimTuru(id)`, `sablon_id` -> `TANIM_Sablon(id)`.
   */
  TANIM_AlimTuru_Sablon,

  /**
   * **TANIM_SurecTaslak**: Özel İşlem Akışı ve Hızlı Şablon Taslakları
   * - **İş İhtiyacı:** Kurumun sık kullandığı özel alım akışlarını ve atlanacak evrak kurallarını saklar.
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `alim_turu`, `adimlar_json`, `atlanacak_evraklar_json`.
   */
  TANIM_SurecTaslak,

  /**
   * **SABLON_Placeholder**: Şablon ile Yer Tutucu İlişki Tablosu
   * - **İş İhtiyacı:** Hangi evrak şablonunun hangi değişkenleri içerdiğini eşleştirir.
   * - **Kritik Sütunlar:** `id` (PK), `sablon_id` (FK), `placeholder_id` (FK).
   * - **İlişkiler:** `sablon_id` -> `TANIM_Sablon(id)`, `placeholder_id` -> `TANIM_Placeholder(id)`.
   */
  SABLON_Placeholder,

  /**
   * **TANIM_KodSozlugu**: Mali ve Kurumsal Genel Kod Sözlüğü
   * - **İş İhtiyacı:** Fonksiyonel kodlar, muhasebe birimi listesi ve finansman tipleri gibi taksonomik değerleri tutar.
   * - **Kritik Sütunlar:** `id` (PK), `grup_kodu`, `kod`, `ad`, `deger_json`, `sira`.
   */
  TANIM_KodSozlugu,

  // =========================================================================
  // 5. KOMİSYON VE HEYET ŞABLONLARI
  // =========================================================================

  /**
   * **TANIM_KomisyonGorevi**: Komisyon Üye Görev Unvanları
   * - **İş İhtiyacı:** Heyetlerdeki resmi görevleri tanımlar (Komisyon Başkanı, Asıl Üye, Yedek Üye, Raportör).
   * - **Kritik Sütunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `sira`.
   */
  TANIM_KomisyonGorevi,

  /**
   * **TANIM_Komisyon**: Standart Kurumsal Komisyon Tanımları
   * - **İş İhtiyacı:** Muayene ve Kabul Komisyonu, Piyasa Fiyat Araştırma Görevlileri gibi tekrar kullanılabilir kurulları tanımlar.
   * - **Kritik Sütunlar:** `id` (PK), `ad`, `komisyon_turu`, `aciklama`, `aktif_mi`.
   */
  TANIM_Komisyon,

  /**
   * **TANIM_KomisyonUye**: Komisyon Üyeleri ve Görev Dağılımı
   * - **İş İhtiyacı:** Standart komisyonlara atanan personeli ve rollerini eşleştirir.
   * - **Kritik Sütunlar:** `id` (PK), `komisyon_id` (FK), `personel_id` (FK), `gorev_id` (FK), `asil_mi`, `sira`.
   * - **İlişkiler:** `komisyon_id` -> `TANIM_Komisyon(id)`, `personel_id` -> `TANIM_Personel(id)`, `gorev_id` -> `TANIM_KomisyonGorevi(id)`.
   */
  TANIM_KomisyonUye,

  /**
   * **TANIM_Komisyon_Sablon**: Komisyon - Şablon Bağlantı Matrisi
   * - **İş İhtiyacı:** Komisyonların hangi evrak şablonlarına (Piyasa Araştırma Tutanağı, Muayene Kabul Tutanağı) otomatik dahil edileceğini belirler.
   * - **Kritik Sütunlar:** `id` (PK), `komisyon_id` (FK), `sablon_kodu`.
   */
  TANIM_Komisyon_Sablon,

  /**
   * **TANIM_KikLimitDonemleri**: KİK Madde 22/d Doğrudan Temin Parasal Limitleri
   * - **İş İhtiyacı:** Yıllık KİK tebliğlerine göre Büyükşehir ve diğer idareler için belirlenen doğrudan temin üst sınırlarını saklar.
   * - **Kritik Sütunlar:** `id` (PK), `yil`, `donem_adi`, `baslangic_tarihi`, `bitis_tarihi`, `limit_buyuksehir`, `limit_diger`, `limit_22a`.
   */
  TANIM_KikLimitDonemleri,

  // =========================================================================
  // 6. TEMİN VE İHALE DOSYALARI ÇEKİRDEK VERİLERİ (DATA_)
  // =========================================================================

  /**
   * **DATA_TeminDosyasi**: Kamu Alımı ve İhale Dosyası Ana Kayıt Tablosu
   * - **İş İhtiyacı:** Doğrudan temin ve ihale süreçlerinin kalbidir. Dosya numarası, konusu, alım türü, sunulacak makam, aşaması ve maliyetini tutar.
   * - **Kritik Sütunlar:** `id` (PK), `temin_no`, `dosya_acilis_tarihi`, `butce_yili`, `konu`, `birim_id`, `sunulacak_makam`, `tur`, `ihale_tipi`, `ihale_sekli`, `yaklasik_maliyet`, `asama`, `tamamlandi_mi`, `tags`.
   * - **İlişkiler:** Kalemler, firmalar, teklifler, evraklar ve TİF fişleri bu kayda bağlanır. `.temin` dosya yapısı bu tabloyu merkez alır.
   */
  DATA_TeminDosyasi,

  /**
   * **DATA_TeminKalem**: Dosya İhtiyaç Kalemleri (Mal / Hizmet / Yapım)
   * - **İş İhtiyacı:** Satın alma dosyasına ait ihtiyaç kalemlerini, miktar, birim ve yaklaşık maliyet tutarlarını saklar.
   * - **Kritik Sütunlar:** `id` (PK), `temin_dosya_id` (FK), `sira_no`, `malzeme_adi`, `miktar`, `birim`, `yaklasik_maliyet_birim_fiyat`, `yaklasik_maliyet_toplam`, `tasinir_kod`.
   * - **İlişkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)` ON DELETE CASCADE.
   */
  DATA_TeminKalem,

  /**
   * **DATA_TeminFirma**: Dosyaya Davet Edilen / Teklif Veren İstekliler
   * - **İş İhtiyacı:** Bir dosya için piyasa fiyat araştırmasına davet edilen veya teklif veren firmaları eşleştirir.
   * - **Kritik Sütunlar:** `id` (PK), `temin_dosya_id` (FK), `firma_id` (FK), `teklif_verdi_mi`, `kazandi_mi`, `toplam_teklif_tutari`.
   * - **İlişkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`, `firma_id` -> `TANIM_Firma(id)`.
   */
  DATA_TeminFirma,

  /**
   * **DATA_TeminKalemTeklif**: Firmaların Kalem Bazlı Teklif Fiyat Matrisi
   * - **İş İhtiyacı:** İstekli firmaların her bir kalem için sunduğu birim fiyat ve toplam tutar tekliflerini tutar.
   * - **Kritik Sütunlar:** `id` (PK), `temin_kalem_id` (FK), `temin_firma_id` (FK), `birim_fiyat`, `toplam_tutar`, `para_birimi`.
   * - **İlişkiler:** `temin_kalem_id` -> `DATA_TeminKalem(id)`, `temin_firma_id` -> `DATA_TeminFirma(id)`. Piyasa Fiyat Araştırması Tutanağı ve en avantajlı teklif bu tablodan hesaplanır.
   */
  DATA_TeminKalemTeklif,

  /**
   * **DATA_TeminKomisyon**: Dosyaya Özel Görevlendirilen Komisyon Üyeleri
   * - **İş İhtiyacı:** İlgili doğrudan temin veya ihale dosyasına atanmış onay belgesi/piyasa araştırma/muayene kabul heyet üyelerini tutar.
   * - **Kritik Sütunlar:** `id` (PK), `temin_dosya_id` (FK), `personel_id` (FK), `gorev`, `komisyon_turu`, `sira`.
   * - **İlişkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`, `personel_id` -> `TANIM_Personel(id)`.
   */
  DATA_TeminKomisyon,

  /**
   * **DATA_TeminBelge**: Dosya Kapsamında Üretilen ve Yüklenen Belgeler
   * - **İş İhtiyacı:** Dosyada otomatik üretilen resmi evrakların loglarını ve dışarıdan eklenen taranmış PDF belgelerini saklar.
   * - **Kritik Sütunlar:** `id` (PK), `temin_dosya_id` (FK), `sablon_kodu`, `belge_adi`, `dosya_yolu`, `mime_type`, `olusturma_tarihi`.
   * - **İlişkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`.
   */
  DATA_TeminBelge,

  /**
   * **DATA_IhaleDosyasi**: Kamu İhalesi (4734 Md. 19/21 vb.) Dosyaları Ana Tablosu
   */
  DATA_IhaleDosyasi,

  /**
   * **DATA_IhaleKalem**: Kamu İhalesi İhtiyaç ve Malzeme/Hizmet Kalemleri
   */
  DATA_IhaleKalem,

  /**
   * **DATA_IhaleFirma**: İhaleye Katılan veya Teklif Veren İstekliler
   */
  DATA_IhaleFirma,

  // =========================================================================
  // 7. TAŞINIR MAL YÖNETİMİ (TİF) VE AMBAR STOK HAREKETLERİ
  // =========================================================================

  /**
   * **DATA_TIF**: Taşınır İşlem Fişleri (TİF) Ana Kayıtları
   * - **İş İhtiyacı:** Muayene kabulü yapılan malların kurumsal ambarlara giriş veya birimlere çıkış fişlerini (Taşınır Mal Yönetmeliği) tutar.
   * - **Kritik Sütunlar:** `id` (PK), `temin_dosya_id` (FK), `ambar_id` (FK), `tif_no`, `tif_turu` ('giris', 'cikis'), `fis_tarihi`, `toplam_tutar`.
   * - **İlişkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`, `ambar_id` -> `TANIM_Ambar(id)`.
   */
  DATA_TIF,

  /**
   * **DATA_TIF_Kalem**: Taşınır İşlem Fişi Kalem Detayları
   * - **İş İhtiyacı:** TİF fişindeki her bir malzeme satırını, taşınır kodunu, miktarını ve birim fiyatını tutar.
   * - **Kritik Sütunlar:** `id` (PK), `tif_id` (FK), `sira_no`, `malzeme_adi`, `tasinir_kod_id` (FK), `miktar`, `birim_fiyat`, `toplam_tutar`.
   * - **İlişkiler:** `tif_id` -> `DATA_TIF(id)` ON DELETE CASCADE.
   */
  DATA_TIF_Kalem,

  /**
   * **DATA_AmbarStok**: Depo Anlık Stok Bakiyesi
   * - **İş İhtiyacı:** Depolardaki malzemelerin anlık mevcut miktarını, rezerve miktarını ve ortalama birim maliyetini izler.
   * - **Kritik Sütunlar:** `id` (PK), `ambar_id` (FK), `kalem_id` (FK), `mevcut_miktar`, `rezerve_miktar`, `ortalama_birim_fiyat`.
   * - **Bütünlük Kuralı:** `UNIQUE(ambar_id, kalem_id)` kısıtı ile her ambarda bir malzeme için tek stok kaydı bulunur.
   */
  DATA_AmbarStok,

  /**
   * **DATA_AmbarHareket**: Ambar Giriş / Çıkış Stok Hareket Günlüğü
   * - **İş İhtiyacı:** Malzeme giriş, çıkış, zimmet verme, devir veya hurdaya ayırma işlemlerinin tarihsel denetim izini oluşturur.
   * - **Kritik Sütunlar:** `id` (PK), `ambar_id` (FK), `kalem_id` (FK), `hareket_turu` ('giris', 'cikis', 'zimmet', 'devir'), `miktar`, `belge_ref`, `tarih`.
   */
  DATA_AmbarHareket,

  // =========================================================================
  // 8. BELGE SNAPSHOT VERİLERİ VE REVİZYON ARŞİVİ
  // =========================================================================

  /**
   * **DATA_DosyaSablonVeri**: Belge ve Şablon Snapshot Verileri
   * - **İş İhtiyacı:** Kullanıcının belge önizleme stüdyosunda yaptığı özel değişiklikleri dosya ve şablon bazında JSON olarak kalıcı saklar.
   * - **Kritik Sütunlar:** `id` (PK), `temin_dosya_id` (FK), `sablon_kodu`, `veri_json`, `sablon_versiyon`, `updated_at`.
   * - **Bütünlük Kuralı:** `UNIQUE(temin_dosya_id, sablon_kodu)`. Her dosya ve her şablon birbirinden izole kayıt altında tutulur; İhtiyaç Listesi ile Lüzum Müzekkeresi birbirinin verisini ezmez.
   */
  DATA_DosyaSablonVeri,

  /**
   * **DATA_DosyaRevizyon**: Belge Sıfırlama ve Revizyon Arşivi
   * - **İş İhtiyacı:** Kullanıcı belgeyi varsayılana sıfırladığında (`belge:reset-document`) önceki veriyi kaybetmemek için JSON yedeğini arşivler.
   * - **Kritik Sütunlar:** `id` (PK), `temin_dosya_id` (FK), `modul_adi`, `surec_kodu`, `belge_kodu`, `versiyon`, `baslik`, `veri_json`, `created_at`.
   */
  DATA_DosyaRevizyon,

  // =========================================================================
  // 9. GÖREVLER, NOTLAR VE SERBEST KÜTÜPHANE MODÜLÜ
  // =========================================================================

  /**
   * **DATA_NotVeGorev**: Dosya ve Süreç Görev / Not Listesi
   * - **İş İhtiyacı:** Dosyaya bağlı veya bağımsız yapılacaklar (To-Do), hatırlatıcılar ve operasyonel notları yönetir.
   * - **Kritik Sütunlar:** `id` (PK), `dosya_id` (FK, opsiyonel), `baslik`, `icerik`, `oncelik`, `tamamlandi_mi`, `sabitlendi_mi`, `hatirlatici_tarihi`.
   */
  DATA_NotVeGorev,

  /**
   * **DATA_KutuphaneGrup**: Özel Şablon ve Belge Klasör Ağacı
   * - **İş İhtiyacı:** "Belgelerim" modülünde kullanıcıların resmi şablonlarını hiyerarşik klasörler altında gruplamasını sağlar.
   * - **Kritik Sütunlar:** `id` (PK), `parent_id` (FK, öz-referans), `ad`, `renk`, `ikon`, `sira`.
   */
  DATA_KutuphaneGrup,

  /**
   * **DATA_KutuphaneBelge**: Özel Belge ve Şablon Kartları
   * - **İş İhtiyacı:** Kullanıcı tarafından üretilen serbest resmi yazıların üst bilgilerini ve etiketlerini saklar.
   * - **Kritik Sütunlar:** `id` (PK), `grup_id` (FK), `ad`, `etiketler` (JSON array), `aktif_surum_id` (FK), `favori_mi`, `arsiv_mi`.
   */
  DATA_KutuphaneBelge,

  /**
   * **DATA_KutuphaneBelgeSurum**: Değişmez Belge Sürümleri ve HTML İçerik
   * - **İş İhtiyacı:** Kullanıcı belgelerinin her bir kayıt/revizyon sürümündeki HTML içeriğini ve koşullu mantık JSON'ını tutar.
   * - **Kritik Sütunlar:** `id` (PK), `belge_id` (FK), `surum_no`, `etiket`, `icerik_html`, `kosullar_json`.
   * - **İlişkiler:** `belge_id` -> `DATA_KutuphaneBelge(id)` ON DELETE CASCADE.
   */
  DATA_KutuphaneBelgeSurum,

  /**
   * **DATA_KutuphaneYerTutucu**: Kullanıcı Belgeleri Dinamik Değişkenleri
   * - **İş İhtiyacı:** Genel, grup veya belge düzeyinde dinamik değişken tanımlarını (`genel`, `grup`, `belge`) barındırır.
   * - **Kritik Sütunlar:** `id` (PK), `kapsam`, `kapsam_id`, `anahtar`, `etiket`, `tip`, `varsayilan`.
   */
  DATA_KutuphaneYerTutucu,

  // =========================================================================
  // 10. BAĞIMSIZ İHTİYAÇ RAPORLARI VE LÜZUM MÜZEKKERESİ
  // =========================================================================

  /**
   * **DATA_IhtiyacRaporu**: Bağımsız İhtiyaç Raporu ve Talep Havuzu
   * - **İş İhtiyacı:** Birimlerden gelen satın alma öncesi ihtiyaç raporlarını, talep gerekçelerini ve onay durumlarını saklar.
   * - **Kritik Sütunlar:** `id` (PK), `rapor_no`, `talep_eden_birim_id` (FK), `konu`, `gerekce`, `durum`, `dosya_id` (FK, temin dosyasına dönüştürüldüğünde bağlanır).
   */
  DATA_IhtiyacRaporu,

  /**
   * **DATA_IhtiyacRaporuKalem**: İhtiyaç Raporu Talep Kalemleri
   * - **İş İhtiyacı:** İhtiyaç raporuna bağlı malzeme/hizmet kalemlerini, tahmini tutarları ve miktarları tutar.
   * - **Kritik Sütunlar:** `id` (PK), `ihtiyac_raporu_id` (FK), `sira_no`, `malzeme_adi`, `miktar`, `birim`, `tahmini_tutar`.
   * - **İlişkiler:** `ihtiyac_raporu_id` -> `DATA_IhtiyacRaporu(id)` ON DELETE CASCADE.
   */
  DATA_IhtiyacRaporuKalem,

  // =========================================================================
  // 11. SİSTEM GÜNLÜK VE DENETİM İZİ (AUDIT LOG)
  // =========================================================================

  /**
   * **LOG_SystemLog**: Sistem İşlem Günlüğü ve Denetim İzi (Audit Log)
   * - **İş İhtiyacı:** Veri tabanı güncellemeleri, hata logları, dışa aktarım ve kritik kullanıcı eylemlerini izlenebilirlik için saklar.
   * - **Kritik Sütunlar:** `id` (PK), `seviye` ('INFO', 'WARN', 'ERROR'), `modul`, `islem`, `mesaj`, `detay_json`, `created_at`.
   */
  LOG_SystemLog
]

/**
 * 4734 Sayılı Kanun Madde 22 Doğrudan Temin Sürecine Özel Tablolar Listesi.
 * İhale 360 (Md. 19/21 Açık/Pazarlık) ve Devlet İhale 2886 (Satış/Kira/Trampa)
 * veritabanlarında yer almaz; yalnızca Temin 360'a aittir.
 */
export const DOGRUDAN_TEMIN_TABLE_NAMES = new Set([
  'DATA_TeminDosyasi',
  'DATA_TeminKalem',
  'DATA_TeminFirma',
  'DATA_TeminKalemTeklif',
  'DATA_TeminKomisyon',
  'DATA_TeminBelge',
  'DATA_DosyaSablonVeri',
  'DATA_DosyaRevizyon',
  'DATA_IhtiyacRaporu',
  'DATA_IhtiyacRaporuKalem',
  'TANIM_AlimTuru',
  'TANIM_AlimTuru_Sablon'
])

export const IHALE_SPECIFIC_TABLE_NAMES = new Set([
  'DATA_IhaleDosyasi',
  'DATA_IhaleKalem',
  'DATA_IhaleFirma'
])

/**
 * Yalnızca Doğrudan Temin modülüne ait tablolar
 */
export const dogrudanTeminTables = rawTables.filter((t) => DOGRUDAN_TEMIN_TABLE_NAMES.has(t.name))

/**
 * Yalnızca Kamu İhalesi (İhale 360 ve 2886) modülüne ait tablolar
 */
export const ihaleSpecificTables = rawTables.filter((t) => IHALE_SPECIFIC_TABLE_NAMES.has(t.name))

/**
 * WorkDesk 360 Suite tüm masaüstü uygulamaları (Temin 360, İhale 360, Devlet İhale 2886)
 * tarafından paylaşılan kurumsal teşkilat, personel, mevzuat, firma, bütçe, ambar,
 * şablon kütüphanesi ve log ortak tabloları.
 */
export const sharedFoundationTables = rawTables.filter(
  (t) => !DOGRUDAN_TEMIN_TABLE_NAMES.has(t.name) && !IHALE_SPECIFIC_TABLE_NAMES.has(t.name)
)

export const ihale360SpecificTables = ihaleSpecificTables.map((t) => {
  if (t.name === 'DATA_IhaleDosyasi') {
    return {
      ...t,
      columns: t.columns.map((c: any) => {
        if (c.name === 'madde') return { ...c, default: "'4734 Sayılı Kanun (Kamu İhalesi)'" }
        if (c.name === 'ihale_tipi') return { ...c, default: "'Kamu İhalesi'" }
        return c
      })
    }
  }
  return t
})

export const devletIhale2886SpecificTables = ihaleSpecificTables.map((t) => {
  if (t.name === 'DATA_IhaleDosyasi') {
    return {
      ...t,
      columns: t.columns.map((c: any) => {
        if (c.name === 'madde') return { ...c, default: "'2886 Sayılı Devlet İhale Kanunu'" }
        if (c.name === 'ihale_usulu') return { ...c, default: "'2886 Sayılı Kanun'" }
        if (c.name === 'ihale_tipi') return { ...c, default: "'Devlet İhalesi (2886)'" }
        if (c.name === 'tur') return { ...c, default: "'satis_kiralama'" }
        return c
      })
    }
  }
  return t
})

/**
 * TEMİN 360 Veritabanı Şeması (Doğrudan Temin 4734 Md. 22 - v46 / 1.0.0-rc.8)
 */
export const temin360Schema = {
  database: 'DOGRUDAN_TEMIN_DB',
  app_title: 'TEMİN 360',
  app_id: 'temin360-desktop',
  version: '1.0.0-rc.8',
  schema_version: CURRENT_SCHEMA_VERSION,
  tables: [...sharedFoundationTables, ...dogrudanTeminTables].map(defineTable)
}

/**
 * İHALE 360 Veritabanı Şeması (Kamu İhalesi KİK Md. 19/21 - v1 / 1.0.0-beta.1 1. Adım)
 * Doğrudan temin tablolarından tamamen arındırılmış bağımsız kamu ihale şeması.
 */
export const ihale360Schema = {
  database: 'IHALE_360_DB',
  app_title: 'İHALE 360',
  app_id: 'ihale360-desktop',
  version: '1.0.0-beta.1',
  schema_version: 1,
  tables: [...sharedFoundationTables, ...ihale360SpecificTables].map(defineTable)
}

/**
 * DEVLET İHALE 2886 Veritabanı Şeması (2886 Sayılı Kanun Satış/Kira/Trampa - v1 / 1.0.0-beta.1 1. Adım)
 * Doğrudan temin tablolarından tamamen arındırılmış bağımsız devlet ihale şeması.
 */
export const devletIhale2886Schema = {
  database: 'DEVLET_IHALE_2886_DB',
  app_title: 'DEVLET İHALE 2886',
  app_id: 'devlet-ihale-2886-desktop',
  version: '1.0.0-beta.1',
  schema_version: 1,
  tables: [...sharedFoundationTables, ...devletIhale2886SpecificTables].map(defineTable)
}

/**
 * Uygulamanın varsayılan veritabanı şema ve tablo tanımları kataloğu (Geriye dönük uyumluluk).
 */
export const schema = temin360Schema

/**
 * Verilen uygulama kimliğine göre ilgili uygulamanın şema tanımını döndürür.
 */
export function getAppSchema(appName: string) {
  if (appName.includes('ihale360')) {
    return ihale360Schema
  }
  if (appName.includes('2886')) {
    return devletIhale2886Schema
  }
  return temin360Schema
}

/**
 * SQLite veritabanını oluşturur; uygulamanın kendi şema tablolarını, ayarlarını, indekslerini ve ilk seed verilerini yükler.
 *
 * İşlem Sırası:
 * 1. Dahili sistem tablolarını (`settings`, `schema_migrations`, `LOG_YedekGecmisi`) oluşturur.
 * 2. Kurum adı, veritabanı sürümü, aktif kurum ID, vergi oranları ve şablon tema JSON'ını `settings` tablosuna yazar.
 * 3. Hedef uygulama şemasındaki tabloları (`CREATE TABLE IF NOT EXISTS`) ve `initialData` satırlarını işler.
 * 4. Performans indekslerini (`idx_tasinirkod_tam_kod`, `idx_okaskod_kod` vb.) oluşturur.
 * 5. Geliştirme ortamında test personellerini (`TANIM_Personel` ve `TANIM_Roller`) seed eder.
 *
 * @param db - better-sqlite3 veritabanı bağlantı nesnesi.
 * @param institutionName - Kurum adı (varsayılan ayarlara kaydedilir).
 * @param currentAppVersion - Uygulama sürüm numarası.
 * @param appName - Masaüstü uygulaması kimliği (örn: 'ihale360-desktop', 'devlet-ihale-2886-desktop', 'temin360-desktop')
 */
export function initializeDatabase(
  db: Database.Database,
  institutionName: string,
  currentAppVersion: string = '1.0.0',
  appName?: string
): void {
  const targetSchema = appName ? getAppSchema(appName) : schema
  const targetSchemaVersion = appName ? getAppSchemaMax(appName) : CURRENT_SCHEMA_VERSION
  const targetAppTitle = targetSchema.app_title || schema.app_title

  db.exec(`
    -- Uygulama genel ayarlarını (key-value) saklar
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    -- Veritabanına uygulanan şema versiyonlarını takip eder
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    -- Yerel ve Google Drive veritabanı yedekleme arşiv kayıtları
    CREATE TABLE IF NOT EXISTS LOG_YedekGecmisi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hedef TEXT NOT NULL,
      dosya_adi TEXT NOT NULL,
      gdrive_file_id TEXT,
      boyut_bytes INTEGER,
      surum_no TEXT,
      tarih TEXT NOT NULL,
      aciklama TEXT
    );
    INSERT OR REPLACE INTO settings (key, value) VALUES ('institutionName', '${institutionName.replace(/'/g, "''")}');
    INSERT OR REPLACE INTO settings (key, value) VALUES ('dbVersion', '${currentAppVersion}');
    INSERT OR REPLACE INTO settings (key, value) VALUES ('dbSchemaVersion', '${targetSchemaVersion}');
    INSERT OR REPLACE INTO settings (key, value) VALUES ('appTitle', '${targetAppTitle}');
    INSERT OR REPLACE INTO settings (key, value) VALUES ('adminName', 'İlyas BOZDEMİR');
    INSERT OR REPLACE INTO settings (key, value) VALUES ('adminTitle', 'Sistem Yöneticisi');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('activeKurumId', '1');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('rates', '[{"id":"1","ad":"Damga Vergisi","oran":"9,48","tur":"binde","hesapKodu":""},{"id":"2","ad":"Karar Pulu","oran":"5,69","tur":"binde","hesapKodu":""},{"id":"3","ad":"KDV (Genel)","oran":"20","tur":"yuzde","hesapKodu":""},{"id":"4","ad":"KDV (İndirimli)","oran":"10","tur":"yuzde","hesapKodu":""},{"id":"5","ad":"KDV (Özel)","oran":"1","tur":"yuzde","hesapKodu":""}]');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('documentTemplateTheme', '{"typography":{"fontFamily":"Times New Roman, Times, serif","baseFontSize":"12pt","lineHeight":1.5,"fontSize":{"xs":"8pt","sm":"10pt","base":"12pt","lg":"14pt","xl":"16pt","2xl":"18pt"},"fontWeight":{"normal":400,"semibold":600,"bold":700}},"colors":{"text":"#000000","textLight":"#333333","textMuted":"#666666","border":"#333333","borderLight":"#999999","headerBg":"#ffffff","accentLine":"#cc0000","white":"#ffffff","black":"#000000"},"page":{"format":"A4","width":"21cm","height":"29.7cm","margins":{"top":1.5,"right":1.5,"bottom":1.5,"left":1.5},"printableHeight":890},"table":{"borderCollapse":"collapse","fontSize":"10pt","cellPadding":"6px","headerBgColor":"#f2f2f2","headerFontWeight":"bold","headerTextAlign":"center","borderColor":"#333333","borderWidth":"1px"},"spacing":{"headerHeight":"80px","footerHeight":"60px","approvalSpacing":"40px","marginBottom":"20px","marginTop":"20px","titleMargin":"20px 0"},"summary":{"description":"Tüm şablonlarda tutarlı görünüm.","lastUpdated":"2026-09-17T00:00:00.000Z"}}');
  `)

  targetSchema.tables.forEach((table: any) => {
    const columnsSql = table.columns
      .map((col: any) => {
        let colDef = '"' + col.name + '" ' + col.type
        if (col.primaryKey) colDef += ' PRIMARY KEY'
        if (col.autoIncrement) colDef += ' AUTOINCREMENT'
        if (col.unique) colDef += ' UNIQUE'
        if (col.notNull) colDef += ' NOT NULL'
        if (col.default !== undefined) {
          let defaultVal = col.default
          if (typeof defaultVal === 'string') {
            const trimmed = defaultVal.trim()
            const isSqlKeywordOrExpr =
              trimmed.toUpperCase() === 'CURRENT_TIMESTAMP' ||
              trimmed.toUpperCase() === 'NULL' ||
              trimmed.toUpperCase() === 'CURRENT_DATE' ||
              trimmed.toUpperCase() === 'CURRENT_TIME' ||
              (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
              !isNaN(Number(trimmed))
            if (!isSqlKeywordOrExpr) {
              defaultVal = `'${trimmed.replace(/'/g, "''")}'`
            }
          }
          colDef += ' DEFAULT ' + defaultVal
        }
        return colDef
      })
      .join(', ')

    const constraintsSql = table.constraints ? ', ' + table.constraints.join(', ') : ''
    db.exec('CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columnsSql + constraintsSql + ');')

    if (table.initialData && table.initialData.length > 0) {
      table.initialData.forEach((row: any) => {
        const keys = Object.keys(row)
        const values = Object.values(row).map((v) =>
          typeof v === 'string' ? "'" + (v as string).replace(/'/g, "''") + "'" : v
        )
        db.exec(
          `INSERT OR IGNORE INTO ${table.name} (${keys.join(', ')}) VALUES (${values.join(', ')});`
        )
      })
    }
  })

  // İndeksler tablolar oluşturulduktan sonra tanımlanmalıdır
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasinirkod_tam_kod ON TANIM_TasinirKod(tam_kod);
    CREATE INDEX IF NOT EXISTS idx_tasinirkod_hesap ON TANIM_TasinirKod(hesap_kodu);
    CREATE INDEX IF NOT EXISTS idx_okaskod_kod ON TANIM_OkasKod(kod);
  `)

  // Geliştirme ortamı için başlangıç test personelleri (Seed)
  try {
    const persCountRes = db.prepare('SELECT COUNT(*) as cnt FROM TANIM_Personel').get() as {
      cnt: number
    }
    if (persCountRes.cnt === 0) {
      const testPersoneller = [
        { ad_soyad: 'İrtibat Yetkilisi (Test)', unvan: 'İrtibat Görevlisi', rol: 'ilgili_personel' },
        { ad_soyad: 'Dosyayı Hazırlayan (Test)', unvan: 'Hazırlayan Personel', rol: 'hazirlayan' },
        { ad_soyad: 'Talep Eden (Test)', unvan: 'Birim Sorumlusu', rol: 'talep_eden' },
        { ad_soyad: 'Sunan Personel (Test)', unvan: 'Sunan Görevli', rol: 'sunan_personel' },
        { ad_soyad: 'Harcama Yetkilisi (Test)', unvan: 'Harcama Yetkilisi', rol: 'harcama_yetkilisi' }
      ]

      const insertPers = db.prepare(
        `INSERT INTO TANIM_Personel (ad_soyad, unvan, aktif_mi) VALUES (?, ?, 1)`
      )
      const updateRol = db.prepare(
        `UPDATE TANIM_Roller SET varsayilan_personel_id = ? WHERE rol_kodu = ?`
      )

      db.transaction(() => {
        for (const p of testPersoneller) {
          const info = insertPers.run(p.ad_soyad, p.unvan)
          const newId = info.lastInsertRowid

          const checkRol = db.prepare('SELECT id FROM TANIM_Roller WHERE rol_kodu = ?').get(p.rol)
          if (!checkRol) {
            db.prepare(
              'INSERT INTO TANIM_Roller (rol_adi, rol_kodu, varsayilan_personel_id) VALUES (?, ?, ?)'
            ).run(p.rol.replace('_', ' ').toUpperCase(), p.rol, newId)
          } else {
            updateRol.run(newId, p.rol)
          }
        }
      })()
      console.log('Test personelleri (Seed) başarıyla eklendi.')
    }
  } catch (error) {
    console.error('Test personelleri eklenirken hata oluştu:', error)
  }

  // İhale ve Devlet İhale uygulamaları için geriye dönük uyumluluk (DATA_Temin... Görünümleri)
  if (appName && (appName.includes('ihale360') || appName.includes('2886'))) {
    ensureIhaleCompatibilityViews(db)
  }
}

/**
 * İhale 360 ve Devlet İhale 2886 veritabanlarında geriye dönük uyumluluk için
 * DATA_TeminDosyasi, DATA_TeminKalem ve DATA_TeminFirma VIEW ve Trigger'larını tesis eder.
 */
export function ensureIhaleCompatibilityViews(db: Database.Database): void {
  try {
    const teminDosyasiTable = db
      .prepare("SELECT type FROM sqlite_master WHERE name = 'DATA_TeminDosyasi'")
      .get() as { type?: string } | undefined
    if (!teminDosyasiTable) {
      db.exec(`
        CREATE VIEW IF NOT EXISTS DATA_TeminDosyasi AS SELECT * FROM DATA_IhaleDosyasi;
        
        CREATE TRIGGER IF NOT EXISTS trg_view_temin_dosyasi_insert
        INSTEAD OF INSERT ON DATA_TeminDosyasi
        BEGIN
          INSERT INTO DATA_IhaleDosyasi (
            id, ihale_kayit_no, dosya_no, temin_no, konu, is_tanimi, is_adi, alim_turu, tur,
            ihale_usulu, ihale_tipi, yaklasik_maliyet, toplam_tutar, sozlesme_bedeli, durum,
            durum_asama_id, asama, birim_id, harcama_birimi, birim, firma_id, created_at,
            updated_at, is_deleted, tarih, dosya_acilis_tarihi
          ) VALUES (
            NEW.id, COALESCE(NEW.ihale_kayit_no, NEW.temin_no, NEW.dosya_no),
            COALESCE(NEW.dosya_no, NEW.temin_no), COALESCE(NEW.temin_no, NEW.dosya_no),
            COALESCE(NEW.konu, NEW.is_adi, NEW.is_tanimi),
            COALESCE(NEW.is_tanimi, NEW.is_adi, NEW.konu),
            COALESCE(NEW.is_adi, NEW.konu, NEW.is_tanimi),
            COALESCE(NEW.alim_turu, NEW.tur, 'mal'), COALESCE(NEW.tur, NEW.alim_turu, 'mal'),
            COALESCE(NEW.ihale_usulu, 'acik'), COALESCE(NEW.ihale_tipi, 'dogrudan_temin'),
            COALESCE(NEW.yaklasik_maliyet, 0), COALESCE(NEW.toplam_tutar, NEW.yaklasik_maliyet, 0),
            COALESCE(NEW.sozlesme_bedeli, 0), COALESCE(NEW.durum, 'Taslak'),
            COALESCE(NEW.durum_asama_id, 1), COALESCE(NEW.asama, 'Taslak'),
            NEW.birim_id, COALESCE(NEW.harcama_birimi, NEW.birim), COALESCE(NEW.birim, NEW.harcama_birimi),
            NEW.firma_id, COALESCE(NEW.created_at, datetime('now')),
            COALESCE(NEW.updated_at, datetime('now')), COALESCE(NEW.is_deleted, 0),
            COALESCE(NEW.tarih, date('now')), COALESCE(NEW.dosya_acilis_tarihi, date('now'))
          );
        END;

        CREATE TRIGGER IF NOT EXISTS trg_view_temin_dosyasi_update
        INSTEAD OF UPDATE ON DATA_TeminDosyasi
        BEGIN
          UPDATE DATA_IhaleDosyasi SET
            ihale_kayit_no = COALESCE(NEW.ihale_kayit_no, NEW.temin_no, NEW.dosya_no, DATA_IhaleDosyasi.ihale_kayit_no),
            dosya_no = COALESCE(NEW.dosya_no, NEW.temin_no, DATA_IhaleDosyasi.dosya_no),
            temin_no = COALESCE(NEW.temin_no, NEW.dosya_no, DATA_IhaleDosyasi.temin_no),
            konu = COALESCE(NEW.konu, DATA_IhaleDosyasi.konu),
            is_adi = COALESCE(NEW.is_adi, DATA_IhaleDosyasi.is_adi),
            yaklasik_maliyet = COALESCE(NEW.yaklasik_maliyet, DATA_IhaleDosyasi.yaklasik_maliyet),
            durum_asama_id = COALESCE(NEW.durum_asama_id, DATA_IhaleDosyasi.durum_asama_id),
            durum = COALESCE(NEW.durum, DATA_IhaleDosyasi.durum),
            firma_id = COALESCE(NEW.firma_id, DATA_IhaleDosyasi.firma_id),
            birim_id = COALESCE(NEW.birim_id, DATA_IhaleDosyasi.birim_id),
            is_deleted = COALESCE(NEW.is_deleted, DATA_IhaleDosyasi.is_deleted),
            updated_at = datetime('now')
          WHERE id = OLD.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_view_temin_dosyasi_delete
        INSTEAD OF DELETE ON DATA_TeminDosyasi
        BEGIN
          DELETE FROM DATA_IhaleDosyasi WHERE id = OLD.id;
        END;
      `)
    }

    const teminKalemTable = db
      .prepare("SELECT type FROM sqlite_master WHERE name = 'DATA_TeminKalem'")
      .get() as { type?: string } | undefined
    if (!teminKalemTable) {
      db.exec(`
        CREATE VIEW IF NOT EXISTS DATA_TeminKalem AS 
        SELECT 
          id, ihale_dosya_id, temin_dosya_id, sira_no, kalem_adi, aciklama,
          tasinir_kod_id, okas_kodu, poz_no, olcu_birimi, birim, miktar,
          yaklasik_birim_fiyat, yaklasik_toplam_tutar, kdv_orani, created_at, updated_at
        FROM DATA_IhaleKalem;
      `)
    }

    const teminFirmaTable = db
      .prepare("SELECT type FROM sqlite_master WHERE name = 'DATA_TeminFirma'")
      .get() as { type?: string } | undefined
    if (!teminFirmaTable) {
      db.exec(`
        CREATE VIEW IF NOT EXISTS DATA_TeminFirma AS 
        SELECT 
          id, ihale_dosya_id, temin_dosya_id, firma_id, teklif_tutari, kdv_haric_toplam,
          kazandi_mi, kazanan_mi, sira_no, aciklama, created_at, updated_at
        FROM DATA_IhaleFirma;
      `)
    }
  } catch (err: any) {
    console.error('[ensureIhaleCompatibilityViews] Kritik Hata:', err?.message || err)
    throw err
  }
}

export { runMigrations, CURRENT_SCHEMA_VERSION }
export { TANIM_Placeholder } from './tables/TANIM_Placeholder'
export { TANIM_OlcuBirimi } from './tables/TANIM_OlcuBirimi'
export { TANIM_BirimDonusum } from './tables/TANIM_BirimDonusum'
export { DATA_KutuphaneGrup } from './tables/DATA_KutuphaneGrup'
export { DATA_KutuphaneBelge } from './tables/DATA_KutuphaneBelge'
export { DATA_KutuphaneBelgeSurum } from './tables/DATA_KutuphaneBelgeSurum'
export { DATA_KutuphaneYerTutucu } from './tables/DATA_KutuphaneYerTutucu'
export { DATA_IhtiyacRaporu } from './tables/DATA_IhtiyacRaporu'
export { DATA_IhtiyacRaporuKalem } from './tables/DATA_IhtiyacRaporuKalem'
export {
  manifests,
  appManifests,
  temin360Manifest,
  ihale360Manifest,
  devletIhale2886Manifest
} from './schema-manifest/index'
export { defineTable } from './BaseTable'
export { auditColumns, auditColumnsNoRef } from './audit'
export * from './migrate'




