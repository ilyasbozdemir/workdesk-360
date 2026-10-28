/* eslint-disable */
import Database from 'better-sqlite3'
import { initSessionContext, registerDefaultAuditTriggers } from './audit-trail'

// ============================================================================
// 1. KURUM, TEÅKÄ°LAT VE PERSONEL TANIMLARI
// ============================================================================
import { TANIM_Kurum } from './tables/TANIM_Kurum'
import { TANIM_Birim } from './tables/TANIM_Birim'
import { TANIM_Personel } from './tables/TANIM_Personel'
import { TANIM_PersonelUnvanGecmisi } from './tables/TANIM_PersonelUnvanGecmisi'
import { TANIM_Roller } from './tables/TANIM_Roller'

// ============================================================================
// 2. MEVZUAT, SÃREÃ AÅAMALARI VE LÄ°MÄ°TLER
// ============================================================================
import { TANIM_Mevzuat } from './tables/TANIM_Mevzuat'
import { TANIM_Asama } from './tables/TANIM_Asama'
import { TANIM_AlimTuru } from './tables/TANIM_AlimTuru'
import { TANIM_KikLimitDonemleri } from './tables/TANIM_KikLimitDonemleri'
import { TANIM_SurecTaslak } from './tables/TANIM_SurecTaslak'

// ============================================================================
// 3. FÄ°RMA VE TEDARÄ°KÃÄ° YÃNETÄ°MÄ°
// ============================================================================
import { TANIM_Firma } from './tables/TANIM_Firma'
import { TANIM_FirmaIletisimNotu } from './tables/TANIM_FirmaIletisimNotu'

// ============================================================================
// 4. MALZEME, POZ, TAÅINIR VE BÃTÃE KODLARI
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
// 5. KOMÄ°SYON VE HEYET TANIMLARI
// ============================================================================
import { TANIM_KomisyonGorevi } from './tables/TANIM_KomisyonGorevi'
import { TANIM_Komisyon } from './tables/TANIM_Komisyon'
import { TANIM_KomisyonUye } from './tables/TANIM_KomisyonUye'
import { TANIM_Komisyon_Sablon } from './tables/TANIM_Komisyon_Sablon'

// ============================================================================
// 6. AMBAR VE DEPO YÃNETÄ°MÄ° TANIMLARI
// ============================================================================
import { TANIM_Ambar } from './tables/TANIM_Ambar'

// ============================================================================
// 7. ÅABLON VE YER TUTUCU (PLACEHOLDER) TANIMLARI
// ============================================================================
import { TANIM_Sablon } from './tables/TANIM_Sablon'
import { TANIM_Placeholder } from './tables/TANIM_Placeholder'
import { TANIM_AlimTuru_Sablon } from './tables/TANIM_AlimTuru_Sablon'
import { SABLON_Placeholder } from './tables/SABLON_Placeholder'

// ============================================================================
// 8. TEMÄ°N DOSYASI VE Ä°HALE SÃREÃ VERÄ°LERÄ° (DATA_)
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
// 9. TAÅINIR (TÄ°F) VE AMBAR STOK HAREKETLERÄ° (DATA_)
// ============================================================================
import { DATA_TIF } from './tables/DATA_TIF'
import { DATA_TIF_Kalem } from './tables/DATA_TIF_Kalem'
import { DATA_AmbarStok } from './tables/DATA_AmbarStok'
import { DATA_AmbarHareket } from './tables/DATA_AmbarHareket'

// ============================================================================
// 10. GÃREVLER, NOTLAR VE SERBEST KÃTÃPHANE VERÄ°LERÄ° (DATA_)
// ============================================================================
import { DATA_NotVeGorev } from './tables/DATA_NotVeGorev'
import { DATA_KutuphaneGrup } from './tables/DATA_KutuphaneGrup'
import { DATA_KutuphaneBelge } from './tables/DATA_KutuphaneBelge'
import { DATA_KutuphaneBelgeSurum } from './tables/DATA_KutuphaneBelgeSurum'
import { DATA_KutuphaneYerTutucu } from './tables/DATA_KutuphaneYerTutucu'

// ============================================================================
// 11. SÄ°STEM DENETÄ°M VE GÃNLÃK KAYITLARI (LOG_)
// ============================================================================
import { LOG_SystemLog } from './tables/LOG_SystemLog'

import { runMigrations, CURRENT_SCHEMA_VERSION, getAppSchemaMax } from './migrate'
import { defineTable } from './BaseTable'

/**
 * Sistemde kayÄ±tlÄ± tÃ¼m veritabanÄ± tablo tanÄ±mlarÄ± listesi.
 * Kurumsal tanÄ±mlar (`TANIM_*`), sÃ¼reÃ§ verileri (`DATA_*`) ve denetim loglarÄ±nÄ± (`LOG_*`) kapsar.
 * Her tanÄ±m SQLite DDL oluÅturucu (`defineTable`) tarafÄ±ndan iÅlenir.
 */
const rawTables = [
  // =========================================================================
  // 1. KURUM, TEÅKÄ°LAT VE PERSONEL TANIMLARI
  // =========================================================================

  /**
   * **TANIM_Kurum**: Ä°dari Kurum Kimlik Bilgileri
   * - **Ä°Å Ä°htiyacÄ±:** Resmi yazÄ±Åma antetleri, vergi no/dairesi, harcama ve muhasebe birimi kodlarÄ± ile kurum logosunu saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kurum_adi`, `vergi_no`, `harcama_birimi_kodu`, `muhasebe_birimi_kodu`, `antet_satir_1`, `antet_satir_2`, `aktif_mi`.
   * - **Ä°liÅkiler:** Evrak Ã¼retiminde `settings.activeKurumId` Ã¼zerinden tekil aktif idare olarak referans alÄ±nÄ±r.
   */
  TANIM_Kurum,

  /**
   * **TANIM_Mevzuat**: Kamu Ä°hale MevzuatÄ± Parametreleri
   * - **Ä°Å Ä°htiyacÄ±:** 4734, 4735, 5018 ve 2886 sayÄ±lÄ± kanunlarÄ±n maddeleri, aÃ§Ä±klamalarÄ± ve geÃ§erlilik kurallarÄ±nÄ± tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kanun_adi`, `madde_no`, `baslik`, `icerik`, `parametreler_json`, `aktif_mi`.
   */
  TANIM_Mevzuat,

  /**
   * **TANIM_Birim**: Kurum Harcama ve Talep Birimleri
   * - **Ä°Å Ä°htiyacÄ±:** MÃ¼dÃ¼rlÃ¼kler, Åube mÃ¼dÃ¼rlÃ¼kleri ve alt servisleri tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `ad`, `kod`, `muhasebe_birimi_kodu`, `harcama_birimi_kodu`, `aktif_mi`.
   * - **Ä°liÅkiler:** `DATA_TeminDosyasi.birim_id` ve `DATA_IhtiyacRaporu.talep_eden_birim_id` buraya baÄlanÄ±r.
   */
  TANIM_Birim,

  /**
   * **TANIM_Personel**: Kurum Personel Sicil Havuzu
   * - **Ä°Å Ä°htiyacÄ±:** Ä°hale yetkilisi, gerÃ§ekleÅtirme gÃ¶revlisi, komisyon Ã¼yeleri ve muayene kabul raportÃ¶rlerini tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `ad_soyad`, `unvan`, `tc_kimlik`, `telefon`, `eposta`, `aktif_mi`.
   * - **Ä°liÅkiler:** `TANIM_Roller`, `TANIM_KomisyonUye` ve `DATA_TeminKomisyon` tablolarÄ±nÄ±n birincil personel kaynaÄÄ±dÄ±r.
   */
  TANIM_Personel,

  /**
   * **TANIM_PersonelUnvanGecmisi**: Personel Kadro ve Unvan GeÃ§miÅi
   * - **Ä°Å Ä°htiyacÄ±:** Personelin terfi veya unvan deÄiÅikliklerini tarihsel olarak izler; geÃ§miÅ tarihli belgelerde o tarihteki unvanÄ±n korunmasÄ±nÄ± saÄlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `personel_id` (FK), `unvan`, `baslangic_tarihi`, `bitis_tarihi`, `aktif_mi`.
   * - **Ä°liÅkiler:** `personel_id` -> `TANIM_Personel(id)` ON DELETE CASCADE.
   */
  TANIM_PersonelUnvanGecmisi,

  /**
   * **TANIM_Roller**: SÃ¼reÃ§ ve Ä°mza Rolleri EÅleÅtirme
   * - **Ä°Å Ä°htiyacÄ±:** Ä°hale/temin sÃ¼reÃ§lerindeki standart rollerin (Harcama Yetkilisi, GerÃ§ekleÅtirme GÃ¶revlisi, vb.) varsayÄ±lan personelle eÅleÅtirilmesini saÄlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `rol_kodu` (UNIQUE), `rol_adi`, `varsayilan_personel_id` (FK), `sira`.
   * - **Ä°liÅkiler:** `varsayilan_personel_id` -> `TANIM_Personel(id)`.
   */
  TANIM_Roller,

  // =========================================================================
  // 2. SÃREÃ AÅAMALARI, ALIM TÃRLERÄ° VE LÄ°MÄ°TLER
  // =========================================================================

  /**
   * **TANIM_Asama**: Ä°Å AkÄ±ÅÄ± SÃ¼reÃ§ AÅamalarÄ± (Status)
   * - **Ä°Å Ä°htiyacÄ±:** Bir dosyanÄ±n baÅtan sona ilerlediÄi standart aÅamalarÄ± (HazÄ±rlÄ±k, Piyasa Fiyat AraÅtÄ±rmasÄ±, Onay, SipariÅ/SÃ¶zleÅme, Muayene/Ãdeme) tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE, Ã¶rn: 'HAZIRLIK'), `ad`, `sira`, `zorunlu_mu`, `aktif_mi`.
   * - **Ä°liÅkiler:** `DATA_TeminDosyasi.asama` ile eÅleÅir.
   */
  TANIM_Asama,

  /**
   * **TANIM_Firma**: Ä°stekli ve TedarikÃ§i Firma Havuzu
   * - **Ä°Å Ä°htiyacÄ±:** Teklif veren, ihalelere katÄ±lan ve sÃ¶zleÅme yapÄ±lan tedarikÃ§i firmalarÄ±n yasal ve iletiÅim kayÄ±tlarÄ±nÄ± saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `unvan`, `vergi_no` (indeksli), `vergi_dairesi`, `adres`, `telefon`, `eposta`, `iban`, `kara_listede_mi`.
   * - **Ä°liÅkiler:** `DATA_TeminFirma.firma_id` Ã¼zerinden dosyalara baÄlanÄ±r.
   */
  TANIM_Firma,

  /**
   * **TANIM_FirmaIletisimNotu**: Firma GÃ¶rÃ¼Åme ve Teklif Ä°letiÅim NotlarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** TedarikÃ§i firmalarla yapÄ±lan telefon, e-posta ve yÃ¼z yÃ¼ze gÃ¶rÃ¼Åmelerin tarihsel kaydÄ±nÄ± tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `firma_id` (FK), `tarih`, `gorusulen_kisi`, `konu`, `notlar`, `hatirlatici_tarihi`.
   * - **Ä°liÅkiler:** `firma_id` -> `TANIM_Firma(id)`.
   */
  TANIM_FirmaIletisimNotu,

  /**
   * **TANIM_Ambar**: Kurum Depo ve AmbarlarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** Malzeme giriÅ-Ã§Ä±kÄ±ÅÄ±nÄ±n yapÄ±ldÄ±ÄÄ± ana ambar, demirbaÅ deposu ve kÄ±rtasiye ambarlarÄ±nÄ± tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `birim_id` (FK), `sorumlu_personel_id` (FK), `aktif_mi`.
   * - **Ä°liÅkiler:** `DATA_TIF` ve `DATA_AmbarStok` tablolarÄ± bu depolara referans verir.
   */
  TANIM_Ambar,

  /**
   * **TANIM_Proje**: YatÄ±rÄ±m ve AlÄ±m Projeleri
   * - **Ä°Å Ä°htiyacÄ±:** Birden fazla doÄrudan temin veya ihale dosyasÄ±nÄ± Ã¼st bir yatÄ±rÄ±m/faaliyet projesi altÄ±nda toplar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `proje_no`, `proje_adi`, `baslangic_yili`, `bitis_yili`, `toplam_butce`, `durum`.
   * - **Ä°liÅkiler:** `DATA_TeminDosyasi.project_id` bu tabloya baÄlanÄ±r.
   */
  TANIM_Proje,

  // =========================================================================
  // 3. KOD HÄ°YERARÅÄ°LERÄ°, BÃTÃE VE POZ KATALOÄU
  // =========================================================================

  /**
   * **TANIM_TasinirKod**: TaÅÄ±nÄ±r Kod Listesi HiyerarÅisi
   * - **Ä°Å Ä°htiyacÄ±:** TaÅÄ±nÄ±r Mal YÃ¶netmeliÄi'ne uygun 150, 253, 255 gibi detay hesap kodlarÄ±nÄ± (DÃ¼zey 1-5) barÄ±ndÄ±rÄ±r.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `tam_kod` (UNIQUE, indeksli), `ad`, `hesap_kodu` (indeksli), `duzey`, `aktif_mi`.
   * - **Ä°liÅkiler:** TÄ°F fiÅi Ã¼retiminde (`DATA_TIF_Kalem.tasinir_kod_id`) zorunlu sÄ±nÄ±flandÄ±rmadÄ±r.
   */
  TANIM_TasinirKod,

  /**
   * **TANIM_OkasKod**: Ortak Kamu AlÄ±mlarÄ± SÃ¶zlÃ¼ÄÃ¼ (OKAS / CPV) KodlarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** EKAP ve kamu alÄ±mlarÄ± mevzuatÄ±na uygun 8 haneli CPV/OKAS kod sÄ±nÄ±flandÄ±rmasÄ±nÄ± tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE, indeksli), `tanim`, `kategori`.
   */
  TANIM_OkasKod,

  /**
   * **TANIM_ButceKod**: Analitik BÃ¼tÃ§e Ekonomik KodlarÄ± (1-4 DÃ¼zey)
   * - **Ä°Å Ä°htiyacÄ±:** Harcama tertiplerini ve analitik bÃ¼tÃ§e sÄ±nÄ±flandÄ±rmasÄ±nÄ± (Ã¶rn: 03.2.1.01 KÄ±rtasiye) yÃ¶netir.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `duzey`, `ust_kod`.
   * - **Ä°Å KuralÄ±:** Ä°hale onay belgesi ve harcama talimatÄ±nda bÃ¼tÃ§e tertibini doÄrular.
   */
  TANIM_ButceKod,

  /**
   * **TANIM_ButceOdenek**: Birim YÄ±llÄ±k BÃ¼tÃ§e Ãdenek ve %10 Limit Takibi
   * - **Ä°Å Ä°htiyacÄ±:** Harcama birimlerinin bÃ¼tÃ§e tertiplerine ayrÄ±lan Ã¶deneklerini ve 4734 Md. 22/d doÄrudan temin %10 parasal limit tÃ¼ketimini izler.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `birim_id` (FK), `butce_yili`, `ekonomik_kod`, `tahsis_edilen_odenek`, `bloke_edilen`, `harcanan`.
   */
  TANIM_ButceOdenek,

  /**
   * **TANIM_Kalem**: Ortak Malzeme ve Hizmet KataloÄu
   * - **Ä°Å Ä°htiyacÄ±:** SÄ±kÃ§a satÄ±n alÄ±nan standart malzemeleri, varsayÄ±lan Ã¶lÃ§Ã¼ birimi ve taÅÄ±nÄ±r kodlarÄ±yla Ã¶nceden tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `ad`, `varsayilan_olcu_birimi_id` (FK), `tasinir_kod_id` (FK), `kategori`, `kdv_orani`.
   */
  TANIM_Kalem,

  /**
   * **TANIM_Poz**: Resmi Birim Fiyat ve Poz KataloÄu (ÃÅB / RayiÃ§ler)
   * - **Ä°Å Ä°htiyacÄ±:** Ãevre ve Åehircilik BakanlÄ±ÄÄ± ile diÄer idarelerin yapÄ±m/hizmet analiz pozlarÄ±nÄ± ve yÄ±llÄ±k fiyatlarÄ±nÄ± tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `poz_no` (UNIQUE), `tanimi`, `birimi`, `birim_fiyat`, `yil`, `kurum`, `analiz_json`.
   * - **Ä°Å KuralÄ±:** YaklaÅÄ±k maliyet cetveli ve hakediÅ icmallerinde doÄrudan poz no Ã¼zerinden hesaplama yapar.
   */
  TANIM_Poz,

  /**
   * **TANIM_OlcuBirimi**: Standart ÃlÃ§Ã¼ Birimleri Havuzu
   * - **Ä°Å Ä°htiyacÄ±:** Malzeme ve hizmet kalemlerinde geÃ§erli metrik/ticari Ã¶lÃ§Ã¼ birimlerini (Adet, Kg, Metre, Litre vb.) tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `sembol`, `kategori`, `ondalik_basamak`.
   */
  TANIM_OlcuBirimi,

  /**
   * **TANIM_BirimDonusum**: ÃlÃ§Ã¼ Birimleri ArasÄ± DÃ¶nÃ¼ÅÃ¼m KatsayÄ±larÄ±
   * - **Ä°Å Ä°htiyacÄ±:** ÃlÃ§Ã¼ birimleri arasÄ±ndaki doÄrusal katsayÄ± ve formÃ¼llÃ¼ dÃ¶nÃ¼ÅÃ¼mleri yÃ¶netir (Ã¶rn: 1 Ton = 1000 Kg).
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kaynak_birim_id` (FK), `hedef_birim_id` (FK), `katsayi`, `formul`.
   * - **Ä°liÅkiler:** `kaynak_birim_id`, `hedef_birim_id` -> `TANIM_OlcuBirimi(id)`.
   */
  TANIM_BirimDonusum,

  // =========================================================================
  // 4. ALIM TÃRLERÄ°, ÅABLON VE DÄ°NAMÄ°K YER TUTUCULAR
  // =========================================================================

  /**
   * **TANIM_AlimTuru**: AlÄ±m TÃ¼rleri (Mal / Hizmet / YapÄ±m / DanÄ±ÅmanlÄ±k)
   * - **Ä°Å Ä°htiyacÄ±:** 4734 sayÄ±lÄ± Kanun kapsamÄ±ndaki 4 ana ihale tÃ¼rÃ¼nÃ¼ ve varsayÄ±lan yasal kesinti oranlarÄ±nÄ± belirler.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE: 'mal', 'hizmet', 'yapim_isi', 'danismanlik'), `ad`, `kdv_orani_varsayilan`, `damga_vergisi_orani`.
   * - **Ä°liÅkiler:** `DATA_TeminDosyasi.tur` alanÄ± ile doÄrudan eÅleÅir; kullanÄ±lacak belge setini sÄ±nÄ±rlar.
   */
  TANIM_AlimTuru,

  /**
   * **TANIM_Sablon**: Resmi Evrak ÅablonlarÄ± KataloÄu
   * - **Ä°Å Ä°htiyacÄ±:** Onay Belgesi, Piyasa AraÅtÄ±rmasÄ± TutanaÄÄ±, SÃ¶zleÅme gibi resmi Åablon dosyalarÄ±nÄ±n metaverilerini saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE, Ã¶rn: 'onay_belgesi'), `ad`, `kategori`, `dosya_adi`, `versiyon`, `aktif_mi`.
   */
  TANIM_Sablon,

  /**
   * **TANIM_Placeholder**: Sistem Genelindeki Dinamik DeÄiÅkenler SÃ¶zlÃ¼ÄÃ¼
   * - **Ä°Å Ä°htiyacÄ±:** Åablonlara gÃ¶mÃ¼len `{{KURUM_ADI}}`, `{{YAKLASIK_MALIYET}}` gibi yer tutucularÄ±n veri kaynaÄÄ±nÄ± aÃ§Ä±klar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `anahtar` (UNIQUE), `ad`, `veri_tipi`, `varsayilan_deger`, `kaynak_tablo`, `kaynak_kolon`.
   */
  TANIM_Placeholder,

  /**
   * **TANIM_AlimTuru_Sablon**: AlÄ±m TÃ¼rÃ¼ - Belge Åablonu EÅleÅtirme Matrisi
   * - **Ä°Å Ä°htiyacÄ±:** Hangi alÄ±m tÃ¼rÃ¼nde (Ã¶rn: YapÄ±m Ä°Åi) hangi belgelerin (Ã¶rn: KeÅif Ãzeti, Yer Teslim TutanaÄÄ±) Ã¼retileceÄini tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `alim_turu_id` (FK), `sablon_id` (FK), `zorunlu_mu`, `sira`.
   * - **Ä°liÅkiler:** `alim_turu_id` -> `TANIM_AlimTuru(id)`, `sablon_id` -> `TANIM_Sablon(id)`.
   */
  TANIM_AlimTuru_Sablon,

  /**
   * **TANIM_SurecTaslak**: Ãzel Ä°Ålem AkÄ±ÅÄ± ve HÄ±zlÄ± Åablon TaslaklarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** Kurumun sÄ±k kullandÄ±ÄÄ± Ã¶zel alÄ±m akÄ±ÅlarÄ±nÄ± ve atlanacak evrak kurallarÄ±nÄ± saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `alim_turu`, `adimlar_json`, `atlanacak_evraklar_json`.
   */
  TANIM_SurecTaslak,

  /**
   * **SABLON_Placeholder**: Åablon ile Yer Tutucu Ä°liÅki Tablosu
   * - **Ä°Å Ä°htiyacÄ±:** Hangi evrak Åablonunun hangi deÄiÅkenleri iÃ§erdiÄini eÅleÅtirir.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `sablon_id` (FK), `placeholder_id` (FK).
   * - **Ä°liÅkiler:** `sablon_id` -> `TANIM_Sablon(id)`, `placeholder_id` -> `TANIM_Placeholder(id)`.
   */
  SABLON_Placeholder,

  /**
   * **TANIM_KodSozlugu**: Mali ve Kurumsal Genel Kod SÃ¶zlÃ¼ÄÃ¼
   * - **Ä°Å Ä°htiyacÄ±:** Fonksiyonel kodlar, muhasebe birimi listesi ve finansman tipleri gibi taksonomik deÄerleri tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `grup_kodu`, `kod`, `ad`, `deger_json`, `sira`.
   */
  TANIM_KodSozlugu,

  // =========================================================================
  // 5. KOMÄ°SYON VE HEYET ÅABLONLARI
  // =========================================================================

  /**
   * **TANIM_KomisyonGorevi**: Komisyon Ãye GÃ¶rev UnvanlarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** Heyetlerdeki resmi gÃ¶revleri tanÄ±mlar (Komisyon BaÅkanÄ±, AsÄ±l Ãye, Yedek Ãye, RaportÃ¶r).
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kod` (UNIQUE), `ad`, `sira`.
   */
  TANIM_KomisyonGorevi,

  /**
   * **TANIM_Komisyon**: Standart Kurumsal Komisyon TanÄ±mlarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** Muayene ve Kabul Komisyonu, Piyasa Fiyat AraÅtÄ±rma GÃ¶revlileri gibi tekrar kullanÄ±labilir kurullarÄ± tanÄ±mlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `ad`, `komisyon_turu`, `aciklama`, `aktif_mi`.
   */
  TANIM_Komisyon,

  /**
   * **TANIM_KomisyonUye**: Komisyon Ãyeleri ve GÃ¶rev DaÄÄ±lÄ±mÄ±
   * - **Ä°Å Ä°htiyacÄ±:** Standart komisyonlara atanan personeli ve rollerini eÅleÅtirir.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `komisyon_id` (FK), `personel_id` (FK), `gorev_id` (FK), `asil_mi`, `sira`.
   * - **Ä°liÅkiler:** `komisyon_id` -> `TANIM_Komisyon(id)`, `personel_id` -> `TANIM_Personel(id)`, `gorev_id` -> `TANIM_KomisyonGorevi(id)`.
   */
  TANIM_KomisyonUye,

  /**
   * **TANIM_Komisyon_Sablon**: Komisyon - Åablon BaÄlantÄ± Matrisi
   * - **Ä°Å Ä°htiyacÄ±:** KomisyonlarÄ±n hangi evrak ÅablonlarÄ±na (Piyasa AraÅtÄ±rma TutanaÄÄ±, Muayene Kabul TutanaÄÄ±) otomatik dahil edileceÄini belirler.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `komisyon_id` (FK), `sablon_kodu`.
   */
  TANIM_Komisyon_Sablon,

  /**
   * **TANIM_KikLimitDonemleri**: KÄ°K Madde 22/d DoÄrudan Temin Parasal Limitleri
   * - **Ä°Å Ä°htiyacÄ±:** YÄ±llÄ±k KÄ°K tebliÄlerine gÃ¶re BÃ¼yÃ¼kÅehir ve diÄer idareler iÃ§in belirlenen doÄrudan temin Ã¼st sÄ±nÄ±rlarÄ±nÄ± saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `yil`, `donem_adi`, `baslangic_tarihi`, `bitis_tarihi`, `limit_buyuksehir`, `limit_diger`, `limit_22a`.
   */
  TANIM_KikLimitDonemleri,

  // =========================================================================
  // 6. TEMÄ°N VE Ä°HALE DOSYALARI ÃEKÄ°RDEK VERÄ°LERÄ° (DATA_)
  // =========================================================================

  /**
   * **DATA_TeminDosyasi**: Kamu AlÄ±mÄ± ve Ä°hale DosyasÄ± Ana KayÄ±t Tablosu
   * - **Ä°Å Ä°htiyacÄ±:** DoÄrudan temin ve ihale sÃ¼reÃ§lerinin kalbidir. Dosya numarasÄ±, konusu, alÄ±m tÃ¼rÃ¼, sunulacak makam, aÅamasÄ± ve maliyetini tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_no`, `dosya_acilis_tarihi`, `butce_yili`, `konu`, `birim_id`, `sunulacak_makam`, `tur`, `ihale_tipi`, `ihale_sekli`, `yaklasik_maliyet`, `asama`, `tamamlandi_mi`, `tags`.
   * - **Ä°liÅkiler:** Kalemler, firmalar, teklifler, evraklar ve TÄ°F fiÅleri bu kayda baÄlanÄ±r. `.temin` dosya yapÄ±sÄ± bu tabloyu merkez alÄ±r.
   */
  DATA_TeminDosyasi,

  /**
   * **DATA_TeminKalem**: Dosya Ä°htiyaÃ§ Kalemleri (Mal / Hizmet / YapÄ±m)
   * - **Ä°Å Ä°htiyacÄ±:** SatÄ±n alma dosyasÄ±na ait ihtiyaÃ§ kalemlerini, miktar, birim ve yaklaÅÄ±k maliyet tutarlarÄ±nÄ± saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_dosya_id` (FK), `sira_no`, `malzeme_adi`, `miktar`, `birim`, `yaklasik_maliyet_birim_fiyat`, `yaklasik_maliyet_toplam`, `tasinir_kod`.
   * - **Ä°liÅkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)` ON DELETE CASCADE.
   */
  DATA_TeminKalem,

  /**
   * **DATA_TeminFirma**: Dosyaya Davet Edilen / Teklif Veren Ä°stekliler
   * - **Ä°Å Ä°htiyacÄ±:** Bir dosya iÃ§in piyasa fiyat araÅtÄ±rmasÄ±na davet edilen veya teklif veren firmalarÄ± eÅleÅtirir.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_dosya_id` (FK), `firma_id` (FK), `teklif_verdi_mi`, `kazandi_mi`, `toplam_teklif_tutari`.
   * - **Ä°liÅkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`, `firma_id` -> `TANIM_Firma(id)`.
   */
  DATA_TeminFirma,

  /**
   * **DATA_TeminKalemTeklif**: FirmalarÄ±n Kalem BazlÄ± Teklif Fiyat Matrisi
   * - **Ä°Å Ä°htiyacÄ±:** Ä°stekli firmalarÄ±n her bir kalem iÃ§in sunduÄu birim fiyat ve toplam tutar tekliflerini tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_kalem_id` (FK), `temin_firma_id` (FK), `birim_fiyat`, `toplam_tutar`, `para_birimi`.
   * - **Ä°liÅkiler:** `temin_kalem_id` -> `DATA_TeminKalem(id)`, `temin_firma_id` -> `DATA_TeminFirma(id)`. Piyasa Fiyat AraÅtÄ±rmasÄ± TutanaÄÄ± ve en avantajlÄ± teklif bu tablodan hesaplanÄ±r.
   */
  DATA_TeminKalemTeklif,

  /**
   * **DATA_TeminKomisyon**: Dosyaya Ãzel GÃ¶revlendirilen Komisyon Ãyeleri
   * - **Ä°Å Ä°htiyacÄ±:** Ä°lgili doÄrudan temin veya ihale dosyasÄ±na atanmÄ±Å onay belgesi/piyasa araÅtÄ±rma/muayene kabul heyet Ã¼yelerini tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_dosya_id` (FK), `personel_id` (FK), `gorev`, `komisyon_turu`, `sira`.
   * - **Ä°liÅkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`, `personel_id` -> `TANIM_Personel(id)`.
   */
  DATA_TeminKomisyon,

  /**
   * **DATA_TeminBelge**: Dosya KapsamÄ±nda Ãretilen ve YÃ¼klenen Belgeler
   * - **Ä°Å Ä°htiyacÄ±:** Dosyada otomatik Ã¼retilen resmi evraklarÄ±n loglarÄ±nÄ± ve dÄ±ÅarÄ±dan eklenen taranmÄ±Å PDF belgelerini saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_dosya_id` (FK), `sablon_kodu`, `belge_adi`, `dosya_yolu`, `mime_type`, `olusturma_tarihi`.
   * - **Ä°liÅkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`.
   */
  DATA_TeminBelge,

  /**
   * **DATA_IhaleDosyasi**: Kamu Ä°halesi (4734 Md. 19/21 vb.) DosyalarÄ± Ana Tablosu
   */
  DATA_IhaleDosyasi,

  /**
   * **DATA_IhaleKalem**: Kamu Ä°halesi Ä°htiyaÃ§ ve Malzeme/Hizmet Kalemleri
   */
  DATA_IhaleKalem,

  /**
   * **DATA_IhaleFirma**: Ä°haleye KatÄ±lan veya Teklif Veren Ä°stekliler
   */
  DATA_IhaleFirma,

  // =========================================================================
  // 7. TAÅINIR MAL YÃNETÄ°MÄ° (TÄ°F) VE AMBAR STOK HAREKETLERÄ°
  // =========================================================================

  /**
   * **DATA_TIF**: TaÅÄ±nÄ±r Ä°Ålem FiÅleri (TÄ°F) Ana KayÄ±tlarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** Muayene kabulÃ¼ yapÄ±lan mallarÄ±n kurumsal ambarlara giriÅ veya birimlere Ã§Ä±kÄ±Å fiÅlerini (TaÅÄ±nÄ±r Mal YÃ¶netmeliÄi) tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_dosya_id` (FK), `ambar_id` (FK), `tif_no`, `tif_turu` ('giris', 'cikis'), `fis_tarihi`, `toplam_tutar`.
   * - **Ä°liÅkiler:** `temin_dosya_id` -> `DATA_TeminDosyasi(id)`, `ambar_id` -> `TANIM_Ambar(id)`.
   */
  DATA_TIF,

  /**
   * **DATA_TIF_Kalem**: TaÅÄ±nÄ±r Ä°Ålem FiÅi Kalem DetaylarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** TÄ°F fiÅindeki her bir malzeme satÄ±rÄ±nÄ±, taÅÄ±nÄ±r kodunu, miktarÄ±nÄ± ve birim fiyatÄ±nÄ± tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `tif_id` (FK), `sira_no`, `malzeme_adi`, `tasinir_kod_id` (FK), `miktar`, `birim_fiyat`, `toplam_tutar`.
   * - **Ä°liÅkiler:** `tif_id` -> `DATA_TIF(id)` ON DELETE CASCADE.
   */
  DATA_TIF_Kalem,

  /**
   * **DATA_AmbarStok**: Depo AnlÄ±k Stok Bakiyesi
   * - **Ä°Å Ä°htiyacÄ±:** Depolardaki malzemelerin anlÄ±k mevcut miktarÄ±nÄ±, rezerve miktarÄ±nÄ± ve ortalama birim maliyetini izler.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `ambar_id` (FK), `kalem_id` (FK), `mevcut_miktar`, `rezerve_miktar`, `ortalama_birim_fiyat`.
   * - **BÃ¼tÃ¼nlÃ¼k KuralÄ±:** `UNIQUE(ambar_id, kalem_id)` kÄ±sÄ±tÄ± ile her ambarda bir malzeme iÃ§in tek stok kaydÄ± bulunur.
   */
  DATA_AmbarStok,

  /**
   * **DATA_AmbarHareket**: Ambar GiriÅ / ÃÄ±kÄ±Å Stok Hareket GÃ¼nlÃ¼ÄÃ¼
   * - **Ä°Å Ä°htiyacÄ±:** Malzeme giriÅ, Ã§Ä±kÄ±Å, zimmet verme, devir veya hurdaya ayÄ±rma iÅlemlerinin tarihsel denetim izini oluÅturur.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `ambar_id` (FK), `kalem_id` (FK), `hareket_turu` ('giris', 'cikis', 'zimmet', 'devir'), `miktar`, `belge_ref`, `tarih`.
   */
  DATA_AmbarHareket,

  // =========================================================================
  // 8. BELGE SNAPSHOT VERÄ°LERÄ° VE REVÄ°ZYON ARÅÄ°VÄ°
  // =========================================================================

  /**
   * **DATA_DosyaSablonVeri**: Belge ve Åablon Snapshot Verileri
   * - **Ä°Å Ä°htiyacÄ±:** KullanÄ±cÄ±nÄ±n belge Ã¶nizleme stÃ¼dyosunda yaptÄ±ÄÄ± Ã¶zel deÄiÅiklikleri dosya ve Åablon bazÄ±nda JSON olarak kalÄ±cÄ± saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_dosya_id` (FK), `sablon_kodu`, `veri_json`, `sablon_versiyon`, `updated_at`.
   * - **BÃ¼tÃ¼nlÃ¼k KuralÄ±:** `UNIQUE(temin_dosya_id, sablon_kodu)`. Her dosya ve her Åablon birbirinden izole kayÄ±t altÄ±nda tutulur; Ä°htiyaÃ§ Listesi ile LÃ¼zum MÃ¼zekkeresi birbirinin verisini ezmez.
   */
  DATA_DosyaSablonVeri,

  /**
   * **DATA_DosyaRevizyon**: Belge SÄ±fÄ±rlama ve Revizyon ArÅivi
   * - **Ä°Å Ä°htiyacÄ±:** KullanÄ±cÄ± belgeyi varsayÄ±lana sÄ±fÄ±rladÄ±ÄÄ±nda (`belge:reset-document`) Ã¶nceki veriyi kaybetmemek iÃ§in JSON yedeÄini arÅivler.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `temin_dosya_id` (FK), `modul_adi`, `surec_kodu`, `belge_kodu`, `versiyon`, `baslik`, `veri_json`, `created_at`.
   */
  DATA_DosyaRevizyon,

  // =========================================================================
  // 9. GÃREVLER, NOTLAR VE SERBEST KÃTÃPHANE MODÃLÃ
  // =========================================================================

  /**
   * **DATA_NotVeGorev**: Dosya ve SÃ¼reÃ§ GÃ¶rev / Not Listesi
   * - **Ä°Å Ä°htiyacÄ±:** Dosyaya baÄlÄ± veya baÄÄ±msÄ±z yapÄ±lacaklar (To-Do), hatÄ±rlatÄ±cÄ±lar ve operasyonel notlarÄ± yÃ¶netir.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `dosya_id` (FK, opsiyonel), `baslik`, `icerik`, `oncelik`, `tamamlandi_mi`, `sabitlendi_mi`, `hatirlatici_tarihi`.
   */
  DATA_NotVeGorev,

  /**
   * **DATA_KutuphaneGrup**: Ãzel Åablon ve Belge KlasÃ¶r AÄacÄ±
   * - **Ä°Å Ä°htiyacÄ±:** "Belgelerim" modÃ¼lÃ¼nde kullanÄ±cÄ±larÄ±n resmi ÅablonlarÄ±nÄ± hiyerarÅik klasÃ¶rler altÄ±nda gruplamasÄ±nÄ± saÄlar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `parent_id` (FK, Ã¶z-referans), `ad`, `renk`, `ikon`, `sira`.
   */
  DATA_KutuphaneGrup,

  /**
   * **DATA_KutuphaneBelge**: Ãzel Belge ve Åablon KartlarÄ±
   * - **Ä°Å Ä°htiyacÄ±:** KullanÄ±cÄ± tarafÄ±ndan Ã¼retilen serbest resmi yazÄ±larÄ±n Ã¼st bilgilerini ve etiketlerini saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `grup_id` (FK), `ad`, `etiketler` (JSON array), `aktif_surum_id` (FK), `favori_mi`, `arsiv_mi`.
   */
  DATA_KutuphaneBelge,

  /**
   * **DATA_KutuphaneBelgeSurum**: DeÄiÅmez Belge SÃ¼rÃ¼mleri ve HTML Ä°Ã§erik
   * - **Ä°Å Ä°htiyacÄ±:** KullanÄ±cÄ± belgelerinin her bir kayÄ±t/revizyon sÃ¼rÃ¼mÃ¼ndeki HTML iÃ§eriÄini ve koÅullu mantÄ±k JSON'Ä±nÄ± tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `belge_id` (FK), `surum_no`, `etiket`, `icerik_html`, `kosullar_json`.
   * - **Ä°liÅkiler:** `belge_id` -> `DATA_KutuphaneBelge(id)` ON DELETE CASCADE.
   */
  DATA_KutuphaneBelgeSurum,

  /**
   * **DATA_KutuphaneYerTutucu**: KullanÄ±cÄ± Belgeleri Dinamik DeÄiÅkenleri
   * - **Ä°Å Ä°htiyacÄ±:** Genel, grup veya belge dÃ¼zeyinde dinamik deÄiÅken tanÄ±mlarÄ±nÄ± (`genel`, `grup`, `belge`) barÄ±ndÄ±rÄ±r.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `kapsam`, `kapsam_id`, `anahtar`, `etiket`, `tip`, `varsayilan`.
   */
  DATA_KutuphaneYerTutucu,

  // =========================================================================
  // 10. BAÄIMSIZ Ä°HTÄ°YAÃ RAPORLARI VE LÃZUM MÃZEKKERESÄ°
  // =========================================================================

  /**
   * **DATA_IhtiyacRaporu**: BaÄÄ±msÄ±z Ä°htiyaÃ§ Raporu ve Talep Havuzu
   * - **Ä°Å Ä°htiyacÄ±:** Birimlerden gelen satÄ±n alma Ã¶ncesi ihtiyaÃ§ raporlarÄ±nÄ±, talep gerekÃ§elerini ve onay durumlarÄ±nÄ± saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `rapor_no`, `talep_eden_birim_id` (FK), `konu`, `gerekce`, `durum`, `dosya_id` (FK, temin dosyasÄ±na dÃ¶nÃ¼ÅtÃ¼rÃ¼ldÃ¼ÄÃ¼nde baÄlanÄ±r).
   */
  DATA_IhtiyacRaporu,

  /**
   * **DATA_IhtiyacRaporuKalem**: Ä°htiyaÃ§ Raporu Talep Kalemleri
   * - **Ä°Å Ä°htiyacÄ±:** Ä°htiyaÃ§ raporuna baÄlÄ± malzeme/hizmet kalemlerini, tahmini tutarlarÄ± ve miktarlarÄ± tutar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `ihtiyac_raporu_id` (FK), `sira_no`, `malzeme_adi`, `miktar`, `birim`, `tahmini_tutar`.
   * - **Ä°liÅkiler:** `ihtiyac_raporu_id` -> `DATA_IhtiyacRaporu(id)` ON DELETE CASCADE.
   */
  DATA_IhtiyacRaporuKalem,

  // =========================================================================
  // 11. SÄ°STEM GÃNLÃK VE DENETÄ°M Ä°ZÄ° (AUDIT LOG)
  // =========================================================================

  /**
   * **LOG_SystemLog**: Sistem Ä°Ålem GÃ¼nlÃ¼ÄÃ¼ ve Denetim Ä°zi (Audit Log)
   * - **Ä°Å Ä°htiyacÄ±:** Veri tabanÄ± gÃ¼ncellemeleri, hata loglarÄ±, dÄ±Åa aktarÄ±m ve kritik kullanÄ±cÄ± eylemlerini izlenebilirlik iÃ§in saklar.
   * - **Kritik SÃ¼tunlar:** `id` (PK), `seviye` ('INFO', 'WARN', 'ERROR'), `modul`, `islem`, `mesaj`, `detay_json`, `created_at`.
   */
  LOG_SystemLog
]

/**
 * 4734 SayÄ±lÄ± Kanun Madde 22 DoÄrudan Temin SÃ¼recine Ãzel Tablolar Listesi.
 * Ä°hale 360 (Md. 19/21 AÃ§Ä±k/PazarlÄ±k) ve Devlet Ä°hale 2886 (SatÄ±Å/Kira/Trampa)
 * veritabanlarÄ±nda yer almaz; yalnÄ±zca Temin 360'a aittir.
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
 * YalnÄ±zca DoÄrudan Temin modÃ¼lÃ¼ne ait tablolar
 */
export const dogrudanTeminTables = rawTables.filter((t) => DOGRUDAN_TEMIN_TABLE_NAMES.has(t.name))

/**
 * YalnÄ±zca Kamu Ä°halesi (Ä°hale 360 ve 2886) modÃ¼lÃ¼ne ait tablolar
 */
export const ihaleSpecificTables = rawTables.filter((t) => IHALE_SPECIFIC_TABLE_NAMES.has(t.name))

/**
 * WorkDesk 360 Suite tüm masaüstü uygulamaları (Temin 360, İhale 360, Devlet İhale 2886)
 * tarafından paylaşılan kurumsal teşkilat, personel, mevzuat, firma, bütçe ve ortak tablolar.
 */
export const sharedFoundationTables = rawTables.filter(
  (t) => !DOGRUDAN_TEMIN_TABLE_NAMES.has(t.name) && !IHALE_SPECIFIC_TABLE_NAMES.has(t.name)
)

export const ihaleSharedFoundationTables = sharedFoundationTables.map((t) => {
  if (t.name === 'DATA_NotVeGorev') {
    return {
      ...t,
      constraints: [
        'FOREIGN KEY(temin_dosya_id) REFERENCES DATA_IhaleDosyasi(id) ON DELETE SET NULL'
      ]
    }
  }
  return t
})

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

export const temin360Schema = {
  database: 'DOGRUDAN_TEMIN_DB',
  app_title: 'TEMÄ°N 360',
  app_id: 'temin360-desktop',
  version: '1.0.0-rc.8',
  schema_version: CURRENT_SCHEMA_VERSION,
  tables: [...sharedFoundationTables, ...dogrudanTeminTables].map(defineTable)
}

/**
 * Ä°HALE 360 VeritabanÄ± ÅemasÄ± (Kamu Ä°halesi KÄ°K Md. 19/21 - v1 / 1.0.0-beta.1 1. AdÄ±m)
 * DoÄrudan temin tablolarÄ±ndan tamamen arÄ±ndÄ±rÄ±lmÄ±Å baÄÄ±msÄ±z kamu ihale ÅemasÄ±.
 */
export const ihale360Schema = {
  database: 'IHALE_360_DB',
  app_title: 'Ä°HALE 360',
  app_id: 'ihale360-desktop',
  version: '1.0.0-beta.1',
  schema_version: 1,
  tables: [...ihaleSharedFoundationTables, ...ihale360SpecificTables].map(defineTable)
}

/**
 * DEVLET Ä°HALE 2886 VeritabanÄ± ÅemasÄ± (2886 SayÄ±lÄ± Kanun SatÄ±Å/Kira/Trampa - v1 / 1.0.0-beta.1 1. AdÄ±m)
 * DoÄrudan temin tablolarÄ±ndan tamamen arÄ±ndÄ±rÄ±lmÄ±Å baÄÄ±msÄ±z devlet ihale ÅemasÄ±.
 */
export const devletIhale2886Schema = {
  database: 'DEVLET_IHALE_2886_DB',
  app_title: 'DEVLET Ä°HALE 2886',
  app_id: 'devlet-ihale-2886-desktop',
  version: '1.0.0-beta.1',
  schema_version: 1,
  tables: [...ihaleSharedFoundationTables, ...devletIhale2886SpecificTables].map(defineTable)
}

/**
 * UygulamanÄ±n varsayÄ±lan veritabanÄ± Åema ve tablo tanÄ±mlarÄ± kataloÄu (Geriye dÃ¶nÃ¼k uyumluluk).
 */
export const schema = temin360Schema

/**
 * Verilen uygulama kimliÄine gÃ¶re ilgili uygulamanÄ±n Åema tanÄ±mÄ±nÄ± dÃ¶ndÃ¼rÃ¼r.
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
 * SQLite veritabanÄ±nÄ± oluÅturur; uygulamanÄ±n kendi Åema tablolarÄ±nÄ±, ayarlarÄ±nÄ±, indekslerini ve ilk seed verilerini yÃ¼kler.
 *
 * Ä°Ålem SÄ±rasÄ±:
 * 1. Dahili sistem tablolarÄ±nÄ± (`settings`, `schema_migrations`, `LOG_YedekGecmisi`) oluÅturur.
 * 2. Kurum adÄ±, veritabanÄ± sÃ¼rÃ¼mÃ¼, aktif kurum ID, vergi oranlarÄ± ve Åablon tema JSON'Ä±nÄ± `settings` tablosuna yazar.
 * 3. Hedef uygulama ÅemasÄ±ndaki tablolarÄ± (`CREATE TABLE IF NOT EXISTS`) ve `initialData` satÄ±rlarÄ±nÄ± iÅler.
 * 4. Performans indekslerini (`idx_tasinirkod_tam_kod`, `idx_okaskod_kod` vb.) oluÅturur.
 * 5. GeliÅtirme ortamÄ±nda test personellerini (`TANIM_Personel` ve `TANIM_Roller`) seed eder.
 *
 * @param db - better-sqlite3 veritabanÄ± baÄlantÄ± nesnesi.
 * @param institutionName - Kurum adÄ± (varsayÄ±lan ayarlara kaydedilir).
 * @param currentAppVersion - Uygulama sÃ¼rÃ¼m numarasÄ±.
 * @param appName - MasaÃ¼stÃ¼ uygulamasÄ± kimliÄi (Ã¶rn: 'ihale360-desktop', 'devlet-ihale-2886-desktop', 'temin360-desktop')
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
    -- Uygulama genel ayarlarÄ±nÄ± (key-value) saklar
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    -- VeritabanÄ±na uygulanan Åema versiyonlarÄ±nÄ± takip eder
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    -- Yerel ve Google Drive veritabanÄ± yedekleme arÅiv kayÄ±tlarÄ±
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
    INSERT OR REPLACE INTO settings (key, value) VALUES ('adminName', 'Ä°lyas BOZDEMÄ°R');
    INSERT OR REPLACE INTO settings (key, value) VALUES ('adminTitle', 'Sistem YÃ¶neticisi');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('activeKurumId', '1');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('rates', '[{"id":"1","ad":"Damga Vergisi","oran":"9,48","tur":"binde","hesapKodu":""},{"id":"2","ad":"Karar Pulu","oran":"5,69","tur":"binde","hesapKodu":""},{"id":"3","ad":"KDV (Genel)","oran":"20","tur":"yuzde","hesapKodu":""},{"id":"4","ad":"KDV (Ä°ndirimli)","oran":"10","tur":"yuzde","hesapKodu":""},{"id":"5","ad":"KDV (Ãzel)","oran":"1","tur":"yuzde","hesapKodu":""}]');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('documentTemplateTheme', '{"typography":{"fontFamily":"Times New Roman, Times, serif","baseFontSize":"12pt","lineHeight":1.5,"fontSize":{"xs":"8pt","sm":"10pt","base":"12pt","lg":"14pt","xl":"16pt","2xl":"18pt"},"fontWeight":{"normal":400,"semibold":600,"bold":700}},"colors":{"text":"#000000","textLight":"#333333","textMuted":"#666666","border":"#333333","borderLight":"#999999","headerBg":"#ffffff","accentLine":"#cc0000","white":"#ffffff","black":"#000000"},"page":{"format":"A4","width":"21cm","height":"29.7cm","margins":{"top":1.5,"right":1.5,"bottom":1.5,"left":1.5},"printableHeight":890},"table":{"borderCollapse":"collapse","fontSize":"10pt","cellPadding":"6px","headerBgColor":"#f2f2f2","headerFontWeight":"bold","headerTextAlign":"center","borderColor":"#333333","borderWidth":"1px"},"spacing":{"headerHeight":"80px","footerHeight":"60px","approvalSpacing":"40px","marginBottom":"20px","marginTop":"20px","titleMargin":"20px 0"},"summary":{"description":"TÃ¼m Åablonlarda tutarlÄ± gÃ¶rÃ¼nÃ¼m.","lastUpdated":"2026-09-17T00:00:00.000Z"}}');
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

  // Ä°ndeksler tablolar oluÅturulduktan sonra tanÄ±mlanmalÄ±dÄ±r
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasinirkod_tam_kod ON TANIM_TasinirKod(tam_kod);
    CREATE INDEX IF NOT EXISTS idx_tasinirkod_hesap ON TANIM_TasinirKod(hesap_kodu);
    CREATE INDEX IF NOT EXISTS idx_okaskod_kod ON TANIM_OkasKod(kod);
  `)

  // GeliÅtirme ortamÄ± iÃ§in baÅlangÄ±Ã§ test personelleri (Seed)
  try {
    const persCountRes = db.prepare('SELECT COUNT(*) as cnt FROM TANIM_Personel').get() as {
      cnt: number
    }
    if (persCountRes.cnt === 0) {
      const testPersoneller = [
        { ad_soyad: 'Ä°rtibat Yetkilisi (Test)', unvan: 'Ä°rtibat GÃ¶revlisi', rol: 'ilgili_personel' },
        { ad_soyad: 'DosyayÄ± HazÄ±rlayan (Test)', unvan: 'HazÄ±rlayan Personel', rol: 'hazirlayan' },
        { ad_soyad: 'Talep Eden (Test)', unvan: 'Birim Sorumlusu', rol: 'talep_eden' },
        { ad_soyad: 'Sunan Personel (Test)', unvan: 'Sunan GÃ¶revli', rol: 'sunan_personel' },
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
      console.log('Test personelleri (Seed) baÅarÄ±yla eklendi.')
    }
  } catch (error) {
    console.error('Test personelleri eklenirken hata oluÅtu:', error)
  }

  // Ä°hale ve Devlet Ä°hale uygulamalarÄ± iÃ§in geriye dÃ¶nÃ¼k uyumluluk (DATA_Temin... GÃ¶rÃ¼nÃ¼mleri)
  if (appName && (appName.includes('ihale360') || appName.includes('2886'))) {
    ensureIhaleCompatibilityViews(db, appName)
  }

  try {
    initSessionContext(db)
    registerDefaultAuditTriggers(db, appName || 'temin360-desktop')
  } catch (auditErr) {
    console.warn('[AuditTrail] initializeDatabase tetikleyici kaydi uyarisi:', auditErr)
  
  }
}

/**
 * Ä°hale 360 ve Devlet Ä°hale 2886 veritabanlarÄ±nda geriye dÃ¶nÃ¼k uyumluluk iÃ§in
 * DATA_TeminDosyasi, DATA_TeminKalem ve DATA_TeminFirma VIEW ve Trigger'larÄ±nÄ± tesis eder.
 * Tetikleyici varsayÄ±lanlarÄ± ilgili uygulamanÄ±n baÄlamÄ±na (2886 vs 4734) gÃ¶re izole edilir.
 */
export function ensureIhaleCompatibilityViews(db: Database.Database, appName?: string): void {
  try {
    const is2886 = appName ? appName.includes('2886') : false
    const defaultUsul = is2886 ? '2886 Sayılı Kanun' : 'Açık İhale (Md. 19)'
    const defaultTipi = is2886 ? 'Devlet İhalesi (2886)' : 'Kamu İhalesi'
    const defaultTur = is2886 ? 'satis_kiralama' : 'mal'
    const defaultMadde = is2886 ? '2886 Sayılı Devlet İhale Kanunu' : '4734 Sayılı Kanun (Kamu İhalesi)'

    const teminDosyasiTable = db
      .prepare("SELECT type FROM sqlite_master WHERE name = 'DATA_TeminDosyasi'")
      .get() as { type?: string } | undefined
    if (!teminDosyasiTable) {
      db.exec(`
        CREATE VIEW IF NOT EXISTS DATA_TeminDosyasi AS SELECT * FROM DATA_IhaleDosyasi;
        
        DROP TRIGGER IF EXISTS trg_view_temin_dosyasi_insert;
        CREATE TRIGGER IF NOT EXISTS trg_view_temin_dosyasi_insert
        INSTEAD OF INSERT ON DATA_TeminDosyasi
        BEGIN
          INSERT INTO DATA_IhaleDosyasi (
            id, ihale_kayit_no, dosya_no, temin_no, konu, is_tanimi, is_adi, alim_turu, tur,
            ihale_usulu, ihale_tipi, madde, yaklasik_maliyet, sozlesme_bedeli, durum,
            durum_asama_id, birim_id, harcama_birimi, birim, firma_id, tarih, dosya_acilis_tarihi
          ) VALUES (
            NEW.id, COALESCE(NEW.ihale_kayit_no, NEW.temin_no, NEW.dosya_no),
            COALESCE(NEW.dosya_no, NEW.temin_no), COALESCE(NEW.temin_no, NEW.dosya_no),
            COALESCE(NEW.konu, NEW.is_adi, NEW.is_tanimi),
            COALESCE(NEW.is_tanimi, NEW.is_adi, NEW.konu),
            COALESCE(NEW.is_adi, NEW.konu, NEW.is_tanimi),
            COALESCE(NEW.alim_turu, NEW.tur, '${defaultTur}'), COALESCE(NEW.tur, NEW.alim_turu, '${defaultTur}'),
            COALESCE(NEW.ihale_usulu, '${defaultUsul}'), COALESCE(NEW.ihale_tipi, '${defaultTipi}'),
            COALESCE(NEW.madde, '${defaultMadde}'),
            COALESCE(NEW.yaklasik_maliyet, 0),
            COALESCE(NEW.sozlesme_bedeli, 0), COALESCE(NEW.durum, 'Taslak'),
            COALESCE(NEW.durum_asama_id, 1),
            NEW.birim_id, COALESCE(NEW.harcama_birimi, NEW.birim), COALESCE(NEW.birim, NEW.harcama_birimi),
            NEW.firma_id,
            COALESCE(NEW.tarih, date('now')), COALESCE(NEW.dosya_acilis_tarihi, date('now'))
          );
        END;

        DROP TRIGGER IF EXISTS trg_view_temin_dosyasi_update;
        CREATE TRIGGER IF NOT EXISTS trg_view_temin_dosyasi_update
        INSTEAD OF UPDATE ON DATA_TeminDosyasi
        BEGIN
          UPDATE DATA_IhaleDosyasi SET
            ihale_kayit_no = COALESCE(NEW.ihale_kayit_no, NEW.temin_no, NEW.dosya_no, DATA_IhaleDosyasi.ihale_kayit_no),
            dosya_no = COALESCE(NEW.dosya_no, NEW.temin_no, DATA_IhaleDosyasi.dosya_no),
            temin_no = COALESCE(NEW.temin_no, NEW.dosya_no, DATA_IhaleDosyasi.temin_no),
            konu = COALESCE(NEW.konu, DATA_IhaleDosyasi.konu),
            is_adi = COALESCE(NEW.is_adi, DATA_IhaleDosyasi.is_adi),
            madde = COALESCE(NEW.madde, DATA_IhaleDosyasi.madde),
            ihale_usulu = COALESCE(NEW.ihale_usulu, DATA_IhaleDosyasi.ihale_usulu),
            ihale_tipi = COALESCE(NEW.ihale_tipi, DATA_IhaleDosyasi.ihale_tipi),
            tur = COALESCE(NEW.tur, NEW.alim_turu, DATA_IhaleDosyasi.tur),
            alim_turu = COALESCE(NEW.alim_turu, NEW.tur, DATA_IhaleDosyasi.alim_turu),
            yaklasik_maliyet = COALESCE(NEW.yaklasik_maliyet, DATA_IhaleDosyasi.yaklasik_maliyet),
            durum_asama_id = COALESCE(NEW.durum_asama_id, DATA_IhaleDosyasi.durum_asama_id),
            durum = COALESCE(NEW.durum, DATA_IhaleDosyasi.durum),
            firma_id = COALESCE(NEW.firma_id, DATA_IhaleDosyasi.firma_id),
            birim_id = COALESCE(NEW.birim_id, DATA_IhaleDosyasi.birim_id)
          WHERE id = OLD.id;
        END;

        CREATE TRIGGER IF NOT EXISTS trg_view_temin_dosyasi_delete
        INSTEAD OF DELETE ON DATA_TeminDosyasi
        BEGIN
          DELETE FROM DATA_IhaleDosyasi WHERE id = OLD.id;
        END;
      `);
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
      `);
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
      `);
    }
  } catch (err: any) {
    console.warn('[ensureIhaleCompatibilityViews] Uyari:', err?.message || err);
  }
}

export { runMigrations, CURRENT_SCHEMA_VERSION, getAppSchemaMax }
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
export * from './audit-trail'
