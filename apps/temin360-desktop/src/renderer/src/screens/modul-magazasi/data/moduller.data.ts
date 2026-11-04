import type { ModulPaketi } from '../modulMagazasi.types'
import { IS_DT_EDITION, isModuleAllowedInEdition } from '../../../../../shared/edition'

const TUM_MODUL_PAKETLERI: ModulPaketi[] = [
  // =========================================================================
  // 1. 4734 DOĞRUDAN TEMİN (ÇEKİRDEK SÜREÇ & STANDART ŞABLON KATALOĞU)
  // =========================================================================
  {
    id: 'kik-dogrudan-temin-22d',
    kod: 'KİK-22-D',
    paketTipi: 'modul',
    baslik: '4734 Doğrudan Temin Süreç & Standart Formlar',
    kisaAciklama:
      '4734 Sayılı Kanun Madde 22/d uyarınca parasal limitler dahilinde mal, hizmet ve yapım alımları uçtan uca dosya ve resmi evrak yönetimi.',
    detayliAciklama:
      'Belediyeler, il özel idareleri, üniversiteler ve kamu kurumları için 4734 sayılı Kamu İhale Kanunu Madde 22/d uyarınca ihtiyaç tespitinden muayene kabul ve ödeme aşamasına kadar tüm resmi standart formları (KİK ve MYHBY) içeren ana çalışma modülü.',
    mevzuat: '4734 Sayılı KİK m.22/d & MYHBY',
    kategori: 'alim_ihale',
    ikon: 'FileCheck',
    renk: 'blue',
    versiyon: 'v2.4.0',
    surumAsamasi: 'Kararlı',
    etiketler: [
      'Doğrudan Temin',
      '22/d',
      'Piyasa Araştırması',
      'KİK Standart Formlar',
      'Muayene Kabul'
    ],
    routePath: '/dosyalar',
    removable: false,
    silinebilir: false,
    araclar: [
      'KİK Parasal Limit Denetleyicisi',
      'KDV Tevkifat Hesaplama',
      'EKAP Yasaklılık Kontrol'
    ],
    asamalar: [
      {
        sira: 1,
        baslik: 'İhtiyaç Tespiti & Talep',
        aciklama: 'Birim talep fişi ve ihtiyaç gerekçesinin oluşturulması.'
      },
      {
        sira: 2,
        baslik: 'Harcama Yetkilisi Onayı',
        aciklama: '22/d Onay Belgesi ve bütçe ödeneği bloke işlemi.'
      },
      {
        sira: 3,
        baslik: 'Piyasa Fiyat Araştırması',
        aciklama: 'Firmalara teklif isteme mektubu ve tekliflerin toplanması.'
      },
      {
        sira: 4,
        baslik: 'Piyasa Araştırma Tutanağı',
        aciklama: 'En avantajlı teklifin tespiti ve komisyon/görevli imzaları.'
      },
      {
        sira: 5,
        baslik: 'Sipariş veya Sözleşme',
        aciklama: 'Yükleniciye sipariş mektubu veya doğrudan temin sözleşmesi.'
      },
      {
        sira: 6,
        baslik: 'Muayene & Kabul',
        aciklama: 'Malın/hizmetin teslim alınarak kabul tutanağının düzenlenmesi.'
      },
      {
        sira: 7,
        baslik: 'Ödeme Emri & Muhasebe',
        aciklama: 'Fatura tahakkuk müzekkeresi ve harcama evraklarının teslimi.'
      }
    ],
    belgeler: [
      {
        ad: 'Standart Form: İhtiyaç Belgesi ve Harcama Talep Müzekkeresi (4734 Sayılı KİK m.22 / )',
        kod: 'DT-01 / MYHBY-4/e',
        aciklama: 'Harcama birimi tarafından düzenlenen gerekçeli talep ve alım başlatma belgesi.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK024.0/M: Doğrudan Temin Onay Belgesi (Harcama Talimatı)',
        kod: 'DT-02 / KİK024.0/M',
        aciklama: 'Harcama yetkilisinden alınan bütçe ödeneği bloke ve resmi harcama talimatı.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK027.0/M: Birim Fiyat Teklif Mektubu ve Fiyat İsteme Formu',
        kod: 'DT-03 / KİK027.0/M',
        aciklama: 'İsteklilerden kaşeli/imzalı teklif almak için gönderilen resmi mektup.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form (MYHBY Örnek No: 2): Piyasa Fiyat Araştırması Tutanağı',
        kod: 'DT-04 / MYHBY Örnek:2',
        aciklama: 'Fiyatların kıyaslandığı, en avantajlı teklifin belirlendiği tutanak.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK054.0/M: Muayene ve Kabul Komisyon Kararı ve Tutanağı',
        kod: 'DT-05 / KİK054.0/M',
        aciklama:
          'Mal veya hizmet alımlarında şartnameye uygunluğu tescil eden muayene kabul tutanağı.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK048.0/Y: Yapım İşleri Geçici Kabul Teklif Belgesi',
        kod: 'KİK048.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde geçici kabul heyeti teşkili teklif belgesi.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK049.0/Y: Yapım İşleri Geçici Kabul Tutanağı',
        kod: 'KİK049.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde geçici kabul komisyonu inceleme tutanağı.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK050.0/Y: Yapım İşleri Kesin Kabul Teklif Belgesi',
        kod: 'KİK050.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde teminat süresi sonu kesin kabul teklif belgesi.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK051.0/Y: Yapım İşleri Kesin Kabul Tutanağı',
        kod: 'KİK051.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde kesin kabul komisyonu tutanağı.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK: Doğrudan Temin Tip Sözleşmesi',
        kod: 'DT-06 / KİK-SÖZ',
        aciklama: 'Gerektiğinde firma ile idare arasında imzalanan taahhüt sözleşmesi.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form (KİK Tebliği m.22): Sipariş ve Tebliğ-Tebellüğ Mektubu',
        kod: 'DT-07 / KİK Tebliğ m.22',
        aciklama: 'Alımın kazanan istekliye bildirildiği resmi sipariş yazısı.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form (MYHBY Örnek No: 3): Harcama Pusulası ve Klasör Dizi Fihristi',
        kod: 'DT-08 / MYHBY Örnek:3',
        aciklama: 'Fatura kesemeyen esnaftan yapılan alımların belgesi ve klasör dizi pusulası.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 2. PİYASA FİYAT ARAŞTIRMASI & İSTEKLİ FİRMA HAVUZU (4734 m.22 / MYHBY m.4/e)
  // =========================================================================
  {
    id: 'piyasa-fiyat-istekli-havuzu',
    kod: 'DT-PİYASA',
    paketTipi: 'modul',
    baslik: 'Piyasa Fiyat Araştırması & İstekli Havuzu',
    kisaAciklama:
      'Doğrudan temin piyasa fiyat araştırmalarında istekli firma havuzu yönetimi, otomatik teklif isteme mektupları ve karşılaştırma cetvelleri.',
    detayliAciklama:
      '4734 Sayılı Kanun Madde 22 kapsamında gerçekleştirilen mal, hizmet ve yapım alımlarında en avantajlı fiyatın tespiti için istekli firmaların sektörel sınıflandırması, kaşeli tekliflerin toplanması, otomatik teklif karşılaştırma cetveli ve EKAP yasaklılık teyidi.',
    mevzuat: '4734 Sayılı KİK m.22 & MYHBY m.4/e',
    kategori: 'alim_ihale',
    ikon: 'Building2',
    renk: 'cyan',
    versiyon: 'v2.4.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Piyasa Araştırması', 'Teklif İsteme', 'Firma Havuzu', 'EKAP Yasaklılık', 'Fiyat Karşılaştırma'],
    routePath: '/firmalar',
    removable: true,
    silinebilir: true,
    araclar: ['Otomatik Teklif Karşılaştırma Matrisi', 'EKAP Yasaklılık Teyit Bağlantısı', 'İstekli Firma İletişim & Kaşe Kaydı'],
    asamalar: [
      {
        sira: 1,
        baslik: 'İstekli Firma Seçimi & Sınıflandırma',
        aciklama: 'Sektöre ve OKAS koduna uygun firmaların istekli havuzundan filtrelenmesi.'
      },
      {
        sira: 2,
        baslik: 'Teklif İsteme Mektubu Dağıtımı',
        aciklama: 'Firmalara teknik şartname ve birim fiyat teklif mektubunun iletilmesi.'
      },
      {
        sira: 3,
        baslik: 'Tekliflerin Toplanması & Karşılaştırma',
        aciklama: 'Gelen tekliflerin matrise girilerek en avantajlı fiyatın tespiti.'
      },
      {
        sira: 4,
        baslik: 'Piyasa Araştırma Tutanağı Onayı',
        aciklama: 'Fiyat araştırma görevlileri tarafından tutanağın imzalanması.'
      }
    ],
    belgeler: [
      {
        ad: 'Standart Form-KİK027.0/M: Birim Fiyat Teklif İsteme Mektubu ve Şartname',
        kod: 'DT-03 / KİK027.0/M',
        aciklama: 'İsteklilerden kaşeli/imzalı teklif almak için gönderilen resmi mektup.',
        zorunluMu: true
      },
      {
        ad: 'İstekliler Fiyat Karşılaştırma ve Değerlendirme Cetveli',
        kod: 'DT-PİYASA-01',
        aciklama: 'Tüm isteklilerin birim fiyat tekliflerinin kalem kalem kıyaslandığı matris.',
        zorunluMu: true
      },
      {
        ad: 'İstekli Firma EKAP / KİK Yasaklı Olmadığına Dair Teyit Belgesi',
        kod: 'DT-PİYASA-02',
        aciklama: 'Teklifi en uygun bulunan isteklinin EKAP yasaklı teyit çıktısı.',
        zorunluMu: true
      },
      {
        ad: 'Piyasa Fiyat Araştırma Görevlileri Heyet İnceleme ve Tespit Zaptı',
        kod: 'DT-PİYASA-03',
        aciklama: 'En avantajlı teklifin gerekçeli seçim kararı ve heyet imzaları.',
        zorunluMu: true
      }
    ]
  },

  // =========================================================================
  // 3. SATIN ALMA GÖREVLİLERİ, KOMİSYON & HEYET YÖNETİMİ (KİK m.6, m.22 & DMK)
  // =========================================================================
  {
    id: 'modul-personel-izin',
    kod: 'DT-HEYET',
    paketTipi: 'modul',
    baslik: 'Satın Alma Görevlileri, Komisyon & Heyet Masası',
    kisaAciklama:
      'Doğrudan temin piyasa araştırma görevlileri, muayene kabul komisyon üyeleri ve imza yetkililerinin görev ve vekalet yönetimi.',
    detayliAciklama:
      'Harcama yetkilisi, gerçekleştirme görevlisi, piyasa araştırma personeli ve muayene kabul heyetlerinin resmi görevlendirme olurları, imza sirküleri, izin ve vekalet süreçlerinin takibi.',
    mevzuat: '4734 Sayılı KİK m.6, m.22 & 657 Sayılı DMK',
    kategori: 'alim_ihale',
    ikon: 'Users',
    renk: 'indigo',
    versiyon: 'v2.3.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Görevlendirme', 'Piyasa Araştırma Görevlileri', 'Muayene Kabul Komisyonu', 'İmza Yetkisi', 'İzin & Vekalet'],
    routePath: '/personel',
    removable: true,
    silinebilir: true,
    araclar: ['Görevlendirme Olur Sihirbazı', 'İmza Yetki & Vekalet Matrisi', 'İzin & Rapor Çakışma Uyarısı'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Görevli Personel Tespiti',
        aciklama: 'Piyasa araştırması ve kabul işlemleri için teknik/idari personelin seçimi.'
      },
      {
        sira: 2,
        baslik: 'Harcama Yetkilisi Oluru',
        aciklama: 'Resmi görevlendirme yazısının hazırlanması ve onaylanması.'
      },
      {
        sira: 3,
        baslik: 'Komisyon Asıl & Yedek Teşkili',
        aciklama: '4734 mevzuatına uygun tek sayılı heyet yapısının kurulması.'
      },
      {
        sira: 4,
        baslik: 'Tebliğ & Vekalet İşlemleri',
        aciklama: 'Görev yazılarının personele tebliği ve izin durumunda vekil ataması.'
      }
    ],
    belgeler: [
      {
        ad: 'Doğrudan Temin Piyasa Fiyat Araştırması Görevlendirme Oluru',
        kod: 'DT-GÖREV-01',
        aciklama: 'Harcama yetkilisince görevlendirilen en az iki personelin resmi olur yazısı.',
        zorunluMu: true
      },
      {
        ad: 'Muayene ve Kabul Komisyonu Teşekkülü Görevlendirme Yazısı',
        kod: 'DT-GÖREV-02',
        aciklama: 'Mal/hizmet kabulünde görevli asıl ve yedek üyelerin atama belgesi.',
        zorunluMu: true
      },
      {
        ad: 'Görev Tebliğ ve Tebellüğ Belgesi',
        kod: 'DT-GÖREV-03',
        aciklama: 'Görevlendirme kararının ilgili personele tebliğ edildiğini gösteren imzalı evrak.',
        zorunluMu: false
      },
      {
        ad: 'Harcama Yetkilisi & Gerçekleştirme Görevlisi İmza Beyannamesi',
        kod: 'DT-GÖREV-04',
        aciklama: 'Mali işlemlerde geçerli yetkili imza örnekleri cetveli.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 4. DİNAMİK FORM ÜRETİCİ & BELGE ŞABLON STÜDYOSU (FORM & BELGE)
  // =========================================================================
  {
    id: 'dinamik-form-builder-studyosu',
    kod: 'FORM-BLD',
    paketTipi: 'modul',
    baslik: 'Dinamik Form Üretici & Belge Şablon Stüdyosu',
    kisaAciklama:
      'Doğrudan temin onay belgeleri, piyasa araştırma mektupları ve özel tutanaklar için sürükle-bırak dinamik form ve şablon üretici.',
    detayliAciklama:
      'Kamu alımlarında ihtiyaç duyulan tüm talep, onay, tutanak ve resmi formların dinamik olarak tasarlanması, dosya değişkenleri ile anında otomatik doldurulması ve A4/PDF baskı motoru.',
    mevzuat: '4734 Sayılı KİK & Standart Form Yönetmeliği',
    kategori: 'form_belge',
    ikon: 'FileSpreadsheet',
    renk: 'emerald',
    versiyon: 'v2.4.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Form Builder', 'Dinamik Şablon', 'Belge Tasarımı', 'Değişkenler', 'A4 Baskı'],
    routePath: '/form-builder',
    removable: true,
    silinebilir: true,
    araclar: ['Sürükle-Bırak Form Editörü', 'Dinamik Değişken Eşleştirici', 'Canlı A4 Önizleme & PDF Dışa Aktarım'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Form & Alan Tasarımı',
        aciklama: 'Metin, sayı, tablo ve imza kutusu alanlarının sürükle-bırak yerleşimi.'
      },
      {
        sira: 2,
        baslik: 'Değişken Eşleştirme',
        aciklama: 'Dosya no, yüklenici, tutar ve birim değişkenlerinin forma bağlanması.'
      },
      {
        sira: 3,
        baslik: 'Önizleme & Dağıtım',
        aciklama: 'Standartlara uygun A4 önizleme, şablon kütüphanesine kayıt ve dosyalara uygulama.'
      }
    ],
    belgeler: [
      {
        ad: 'Dinamik İhtiyaç & Harcama Talep Form Şablonu',
        kod: 'DF-01',
        aciklama: 'Özelleştirilebilir dinamik birim talep formu.',
        zorunluMu: true
      },
      {
        ad: 'Dinamik Muayene ve Kabul Tutanak Taslağı',
        kod: 'DF-02',
        aciklama: 'Alım türüne göre uyarlanabilir kabul tutanak formu.',
        zorunluMu: true
      },
      {
        ad: 'Özelleştirilebilir Birim Fiyat Teklif İsteme Mektubu',
        kod: 'DF-03',
        aciklama: 'Şart ve şartname maddeleri içeren dinamik teklif mektubu.',
        zorunluMu: false
      },
      {
        ad: 'Kuruma Özel Doğrudan Temin Tip Sözleşme Tasarımı',
        kod: 'DF-04',
        aciklama: 'İdare ile yüklenici arasında imzalanacak tip sözleşme şablonu.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 5. MUAYENE KABUL, TAŞINIR (TİF) & HAKEDİŞ MASASI
  // =========================================================================
  {
    id: 'muayene-kabul-tasinir-tif',
    kod: 'DT-KABUL-TİF',
    paketTipi: 'modul',
    baslik: 'Muayene Kabul, Taşınır (TİF) & Hakediş Masası',
    kisaAciklama:
      'Teslim alınan mal, hizmet veya yapım işlerinin şartnameye uygunluk kontrolü, kabul tutanakları ve Taşınır İşlem Fişi (TİF) entegrasyonu.',
    detayliAciklama:
      'Doğrudan temin kapsamında yükleniciden teslim alınan mal ve hizmetlerin kabul heyetince incelenmesi, numune testi, kabul tutanağının tanzimi, Taşınır Kod Listesi (TİF) eşleştirmesi ve saymanlık tahakkuk paketi.',
    mevzuat: '4734 Sayılı KİK m.22, Mal/Hizmet Muayene Kabul Yönetmeliği & TKYS',
    kategori: 'form_belge',
    ikon: 'CheckCircle2',
    renk: 'blue',
    versiyon: 'v2.2.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Muayene Kabul', 'Taşınır (TİF)', 'Kabul Tutanağı', 'Ambar Giriş', 'Fatura Tahakkuk'],
    routePath: '/dosyalar',
    removable: true,
    silinebilir: true,
    araclar: ['Muayene Kabul Komisyon Tutanak Sihirbazı', 'Taşınır Kod (TİF) Eşleştirici', 'Tahakkuk Müzekkeresi Üretici'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Teslim Alma & Fiziksel Muayene',
        aciklama: 'İrsaliye, fatura ve ürünlerin şartname kriterlerine göre kontrolü.'
      },
      {
        sira: 2,
        baslik: 'Heyet İncelemesi & Tutanak',
        aciklama: 'Komisyon üyelerince mal/hizmet kabul tutanağının ıslak/e-imzayla tanzimi.'
      },
      {
        sira: 3,
        baslik: 'Taşınır (TİF) Giriş Kaydı',
        aciklama: 'Mal alımlarında ambar girişi ve Taşınır İşlem Fişi (TİF) düzenlenmesi.'
      },
      {
        sira: 4,
        baslik: 'Tahakkuk & Ödeme Emri Sevk',
        aciklama: 'Fatura, kabul tutanağı ve TİF evraklarının muhasebeye sevki.'
      }
    ],
    belgeler: [
      {
        ad: 'Standart Form-KİK054.0/M: Mal Alımları Muayene ve Kabul Komisyonu Tutanağı',
        kod: 'DT-KABUL-01 / KİK054.0/M',
        aciklama: 'Mal alımlarında şartnameye uygunluğu tescil eden muayene kabul tutanağı.',
        zorunluMu: true
      },
      {
        ad: 'Hizmet İşleri Kabul Tutanağı (Hizmet Muayene Kabul Yönetmeliği)',
        kod: 'DT-KABUL-02',
        aciklama: 'Hizmet işlerinde işin eksiksiz tamamlandığını belirten kabul belgesi.',
        zorunluMu: true
      },
      {
        ad: 'Taşınır İstek Belgesi ve Ambar Giriş TİF Çizelgesi',
        kod: 'DT-TİF-01',
        aciklama: 'TKYS uyumlu ambar giriş ve taşınır işlem fişi dökümü.',
        zorunluMu: false
      },
      {
        ad: 'Fatura Tahakkuk Müzekkeresi ve Muhasebe Teslim Yazısı',
        kod: 'DT-ÖDEME-01',
        aciklama: 'Ödeme emri belgesi ekine girecek tahakkuk teslim müzekkeresi.',
        zorunluMu: true
      }
    ]
  },

  // =========================================================================
  // 6. EBYS RESMİ YAZIŞMA ŞABLONLARI & EDİTÖRÜ (ENTEGRASYON)
  // =========================================================================
  {
    id: 'ebys-resmi-yazisma-studyosu',
    kod: 'EBYS-STD',
    paketTipi: 'modul',
    baslik: 'EBYS Resmî Yazışma Şablonları & Editörü',
    kisaAciklama:
      'Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Yönetmeliği ve EYP 2.0 uyumlu hazır doğrudan temin resmi yazı şablonları ve A4 editörü.',
    detayliAciklama:
      'Tüm kamu kurum ve kuruluşları için doğrudan temin süreçlerinde ihtiyaç duyulan harcama yetkilisi oluru, saymanlık üst yazıları, teklif tebligatları ve antetli TipTap A4 zengin metin editörü.',
    mevzuat: 'Resmî Yazışma Yönetmeliği & EYP 2.0',
    kategori: 'entegrasyon',
    ikon: 'FileText',
    renk: 'indigo',
    versiyon: 'v2.3.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['EBYS', 'Resmî Yazışma', 'EYP 2.0', 'Üst Yazı', 'Dağıtımlı Yazı', 'A4 Editör'],
    routePath: '/ebys',
    removable: true,
    silinebilir: true,
    araclar: ['EYP 2.0 Resmî Yazı Editörü', 'DETSİS / KAYSİS Kurum Kodlayıcı', 'Karekod & E-İmza Alanı Üretici'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Şablon Seçimi',
        aciklama: 'Doğrudan temin oluru, saymanlık teslimi veya kurumlar arası müzekkere seçimi.'
      },
      {
        sira: 2,
        baslik: 'DETSİS & Muhatap Bilgileri',
        aciklama: 'Sayı, konu, muhatap idare ve imza bloklarının yapılandırılması.'
      },
      {
        sira: 3,
        baslik: 'Yönetmelik Uygunluk Denetimi',
        aciklama: 'Paragraf girintileri, font standartları ve ek listesi kontrolü.'
      },
      {
        sira: 4,
        baslik: 'EBYS / PDF Dışa Aktarım',
        aciklama: 'Kurumsal EBYS sistemlerine aktarım veya e-imzalı PDF çıktısı.'
      }
    ],
    belgeler: [
      {
        ad: 'Doğrudan Temin Harcama Yetkilisi Olur / Onay Yazısı',
        kod: 'EBYS-DT-01',
        aciklama: 'Birim harcama yetkilisinden alınan resmi harcama onay üst yazısı.',
        zorunluMu: true
      },
      {
        ad: 'Muhasebe ve Mali Hizmetler Birimi Tahakkuk Teslim Üst Yazısı',
        kod: 'EBYS-DT-02',
        aciklama: 'Ödeme emri belgelerinin saymanlığa sevkinde kullanılan resmi üst yazı.',
        zorunluMu: true
      },
      {
        ad: 'İstekli Firmaya Resmî Sipariş ve Tebliğ-Tebellüğ Mektubu',
        kod: 'EBYS-DT-03',
        aciklama: 'Teklifi kazanan firmaya işe başlama ve teslimat bildirim yazısı.',
        zorunluMu: true
      },
      {
        ad: 'Kurum İçi Harcama Birimleri Arası Bilgi ve Belge Müzekkeresi',
        kod: 'EBYS-DT-04',
        aciklama: 'Teknik birimler ile satın alma birimi arasındaki koordinasyon yazısı.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 7. HARCAMA MERKEZİ & KİK PARASAL LİMİT TAKİBİ (FİNANS & HESAP)
  // =========================================================================
  {
    id: 'harcama-kik-limit-takibi',
    kod: 'HARC-LMT',
    paketTipi: 'modul',
    baslik: 'Harcama Merkezi & KİK Parasal Limit Takibi',
    kisaAciklama:
      '4734 Sayılı Kanun Madde 22/d yıllık parasal harcama tavanı ve birim bazlı doğrudan temin bütçe tüketim kontrol paneli.',
    detayliAciklama:
      'Büyükşehir ve diğer idareler için güncel KİK tebliğ parasal limitleri, harcama birimleri bazında bütçe tüketim tavanı, %10 bütçe kuralı kontrolü, kalan limit ve limit aşım uyarı motoru.',
    mevzuat: '4734 Sayılı KİK m.22/d & Güncel KİK Tebliği',
    kategori: 'finans_hesap',
    ikon: 'Scale',
    renk: 'amber',
    versiyon: 'v2.4.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Harcama Merkezi', 'KİK Limit', '22/d Tavanı', 'Bütçe Takibi', '%10 Sınırı', 'Limit Uyarısı'],
    routePath: '/harcama-merkezi',
    removable: true,
    silinebilir: true,
    araclar: ['KİK Parasal Limit Denetleyicisi', 'Birim Bütçe Kümülatif Analizi', '%10 Tavan Uygunluk Robotu'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Kurumsal Limit Tanımı',
        aciklama: 'Büyükşehir belediyesi sınırları dahilinde veya haricinde KİK limit tespiti.'
      },
      {
        sira: 2,
        baslik: 'Birim Bazlı Tüketim İzleme',
        aciklama: 'Harcama birimlerinin kümülatif 22/d doğrudan temin harcamalarının dökümü.'
      },
      {
        sira: 3,
        baslik: 'Bütçe Ödeneği %10 Denetimi',
        aciklama: 'Yıllık toplam mal ve hizmet alımı bütçesinin %10 tavan kontrolü.'
      },
      {
        sira: 4,
        baslik: 'Risk & Tavan Raporlama',
        aciklama: 'Harcama yetkilisi için limit aşım riskleri ve denetim icmali.'
      }
    ],
    belgeler: [
      {
        ad: 'KİK 22/d Yıllık Parasal Limit Tüketim ve Kalan Bütçe Raporu',
        kod: 'KIK-RAP-01',
        aciklama: 'Mevzuat uyumlu kümülatif harcama ve tavan tüketim raporu.',
        zorunluMu: true
      },
      {
        ad: 'Harcama Birimleri Doğrudan Temin Dağılım İcmali',
        kod: 'KIK-RAP-02',
        aciklama: 'Birim bazlı harcama ve kalan ödenek çizelgesi.',
        zorunluMu: true
      },
      {
        ad: '4734 Sayılı Kanun Madde 22/d Bütçe %10 Tavan Denetim Çizelgesi',
        kod: 'KIK-RAP-03',
        aciklama: 'Bütçenin %10 aşım durumunu gösteren mevzuat uygunluk tablosu.',
        zorunluMu: false
      },
      {
        ad: 'Yıl Sonu Doğrudan Temin Gerçekleşme ve Denetim Özeti',
        kod: 'KIK-RAP-04',
        aciklama: 'Sayıştay ve iç denetim için yıl sonu harcama konsolide tablosu.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 8. MALİ HESAPLAR, FİYAT FARKI & TEVKİFAT MASASI (FİNANS & HESAP)
  // =========================================================================
  {
    id: 'mali-analiz-hakedis-fiyat-farki',
    kod: 'DT-MALİ',
    paketTipi: 'modul',
    baslik: 'Mali Hesaplar, Fiyat Farkı & Tevkifat Masası',
    kisaAciklama:
      'Doğrudan temin alımlarında KDV tevkifatı, damga vergisi, gecikme cezası ve TÜİK fiyat farkı hassas hesaplama motoru.',
    detayliAciklama:
      'Küçük yapım, bakım onarım ve hizmet alımlarında Decimal.js yüksek hassasiyetli KDV kısmi/tam tevkifat hesaplama (5/10, 7/10 vb.), sözleşme ve karar damga vergisi, gecikme cezası ve Yİ-ÜFE fiyat farkı hesaplama süiti.',
    mevzuat: '4734 Sayılı KİK, KDV Genel Uygulama Tebliği & Yİ-ÜFE Endeksleri',
    kategori: 'finans_hesap',
    ikon: 'Calculator',
    renk: 'purple',
    versiyon: 'v2.2.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Fiyat Farkı', 'KDV Tevkifat', 'Damga Vergisi', 'Gecikme Cezası', 'Hassas Hesaplama'],
    routePath: '/hesaplama-araclari',
    removable: true,
    silinebilir: true,
    araclar: ['Decimal.js Yüksek Hassasiyetli Finans Motoru', 'KDV Tevkifat Hesaplayıcı', 'Gecikme Cezası & Damga Vergisi Robotu'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Alım Türü & Matrah Girişi',
        aciklama: 'Mal, hizmet veya yapım alımı brüt bedelinin tanımlanması.'
      },
      {
        sira: 2,
        baslik: 'Tevkifat & Kesinti Seçimi',
        aciklama: 'KDV Genel Uygulama Tebliğine göre tevkifat oranı seçimi.'
      },
      {
        sira: 3,
        baslik: 'Yasal Kesintiler Hesaplama',
        aciklama: 'Damga vergisi (‰9.48 / ‰5.69), tevkifat ve varsa gecikme cezası hesabı.'
      },
      {
        sira: 4,
        baslik: 'Kesinti & Tahakkuk Çizelgesi',
        aciklama: 'Muhasebeye verilecek net ödenecek tutar ve kesinti icmalinin basımı.'
      }
    ],
    belgeler: [
      {
        ad: 'KDV Tevkifatı ve Kesintiler Hesaplama Tablosu',
        kod: 'DT-HESAP-01',
        aciklama: 'Tevkifat oranları ve net ödenecek tutar döküm cetveli.',
        zorunluMu: true
      },
      {
        ad: 'Karar ve Sözleşme Damga Vergisi Tahakkuk Çizelgesi',
        kod: 'DT-HESAP-02',
        aciklama: 'Mevzuat damga vergisi oranlarına göre kesinti tablosu.',
        zorunluMu: true
      },
      {
        ad: 'Gecikme Cezası ve Yasal Faiz Hesap Raporu',
        kod: 'DT-HESAP-03',
        aciklama: 'Teslimatta gecikilen günler için yasal kesinti hesabı.',
        zorunluMu: false
      },
      {
        ad: 'TÜİK Yİ-ÜFE Endeksli Fiyat Farkı Hesap Tablosu',
        kod: 'DT-HESAP-04',
        aciklama: 'Yapım ve hizmet işlerinde endekslere göre fiyat farkı cetveli.',
        zorunluMu: false
      }
    ]
  },


]

export const RESMI_MODUL_PAKETLERI: ModulPaketi[] = IS_DT_EDITION
  ? TUM_MODUL_PAKETLERI.filter((m) => isModuleAllowedInEdition(m.id))
  : TUM_MODUL_PAKETLERI

