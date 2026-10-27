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
  // 2. 2886 DEVLET İHALE KANUNU (SATIŞ & KİRALAMA GELİR MASASI)
  // =========================================================================
  {
    id: 'dik-devlet-ihale-2886',
    kod: 'DİK-2886',
    paketTipi: 'modul',
    baslik: '2886 Devlet İhale Masası (Taşınmaz Satış & Kiralama)',
    kisaAciklama:
      'Kamu ve belediye taşınmazlarının satış, kiralama, trampa ve irtifak hakkı tesisine yönelik encümen onaylı gelir ihaleleri.',
    detayliAciklama:
      '2886 Sayılı Kanun Madde 35, 36, 45 ve 51 kapsamında ihale açılışı, kıymet takdiri, muhammen bedel, geçici teminat, encümen kararı ve kira sözleşmesi yönetimi.',
    mevzuat: '2886 Sayılı DİK m.35-51',
    kategori: 'satis_kiralama',
    ikon: 'Landmark',
    renk: 'emerald',
    versiyon: 'v2.1.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['2886', 'Gelir İhalesi', 'Taşınmaz Satışı', 'Kira', 'Encümen'],
    routePath: '/devlet-ihale-2886',
    removable: true,
    silinebilir: true,
    araclar: [
      'Muhammen Bedel & %3 Geçici Teminat Hesabı',
      'Yİ-ÜFE Kira Artış Robotu',
      'İhale Usul Karar Matrisi'
    ],
    asamalar: [
      {
        sira: 1,
        baslik: 'Taşınmaz Tespiti & Tapu Kaydı',
        aciklama: 'Ada, parsel, yüzölçümü ve mülkiyet bilgilerinin tescili.'
      },
      {
        sira: 2,
        baslik: 'Kıymet Takdiri (Muhammen Bedel)',
        aciklama: 'Takdir komisyonunca tahmini bedel ve geçici teminatın belirlenmesi.'
      },
      {
        sira: 3,
        baslik: 'İhale Onayı & Usul Seçimi',
        aciklama: 'Encümen / İta amirinden alınan onay ve 45/36/51 usul tespiti.'
      },
      {
        sira: 4,
        baslik: 'Şartname ve İlan Yayını',
        aciklama: 'Resmi Gazete veya yerel gazetede ilan metninin yayınlanması.'
      },
      {
        sira: 5,
        baslik: 'İhale Günü & Teklifler',
        aciklama: 'Zarf açımı, açık artırma peyleri ve komisyon kararının yazımı.'
      },
      {
        sira: 6,
        baslik: 'Onay, Tebligat & Kesinleşme',
        aciklama: 'İta amiri onayı ve istekliye noter/iadeli taahhütlü tebligat.'
      }
    ],
    belgeler: [
      {
        ad: '2886 İhale Onay Belgesi',
        kod: 'DİK-01',
        aciklama: 'Encümene sunulacak ihale açılış onayı.',
        zorunluMu: true
      },
      {
        ad: 'Kıymet Takdir Komisyonu Raporu',
        kod: 'DİK-02',
        aciklama: 'Taşınmazın muhammen bedelinin tespit edildiği gerekçeli rapor.',
        zorunluMu: true
      },
      {
        ad: 'Taşınmaz Satış / Kira İdari Şartnamesi',
        kod: 'DİK-03',
        aciklama: 'İhaleye katılma koşullarını belirten şartname metni.',
        zorunluMu: true
      },
      {
        ad: 'Basın ve Gazete İlan Metni Taslağı',
        kod: 'DİK-04',
        aciklama: '2886 m.17 gereğince yayınlanacak standart ilan metni.',
        zorunluMu: true
      },
      {
        ad: 'İhale Komisyonu (Encümen) Kararı',
        kod: 'DİK-05',
        aciklama: 'İhalenin kime kaldığını bildiren resmi karar zaptı.',
        zorunluMu: true
      }
    ]
  },

  // =========================================================================
  // 3. EBYS RESMİ YAZIŞMA ŞABLONLARI & EDİTÖRÜ
  // =========================================================================
  {
    id: 'ebys-resmi-yazisma-studyosu',
    kod: 'EBYS-STD',
    paketTipi: 'modul',
    baslik: 'EBYS Resmî Yazışma Şablonları & Editörü',
    kisaAciklama:
      'Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik ve EYP 2.0 uyumlu hazır resmi yazı şablonları ve A4 editörü.',
    detayliAciklama:
      'Tüm kamu kurum ve kuruluşları için Resmî Yazışma Yönetmeliğine tam uyumlu üst yazı, iç yazışma, olur/onay, dağıtımlı yazılar ve dinamik antetli TipTap A4 editörü.',
    mevzuat: 'Resmî Yazışma Yönetmeliği & EYP 2.0',
    kategori: 'entegrasyon',
    ikon: 'FileText',
    renk: 'indigo',
    versiyon: 'v2.0.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['EBYS', 'Resmî Yazışma', 'Üst Yazı', 'Olur/Onay', 'TipTap'],
    routePath: '/ebys',
    removable: true,
    silinebilir: true,
    araclar: ['EYP 2.0 Doğrulayıcı', 'Dinamik Makam Hitap Üretici', 'EBYS Rota & Paraf Motoru'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Taslak Hazırlama & Şablon Seçimi',
        aciklama: 'Resmî yazı tipine göre uygun şablonun seçilmesi.'
      },
      {
        sira: 2,
        baslik: 'Muhatap & Dağıtım Belirleme',
        aciklama: 'Gereği ve bilgi muhataplarının belirlenmesi.'
      },
      {
        sira: 3,
        baslik: 'Paraf & İmza Rotası',
        aciklama: 'Hazırlayan, kontrol eden ve imza makamı adımları.'
      },
      { sira: 4, baslik: 'Baskı & Çıktı', aciklama: 'Resmi antetli A4 çıktısının üretilmesi.' }
    ],
    belgeler: [
      {
        ad: 'Resmî Üst Yazı Şablonu',
        kod: 'EBYS-01',
        aciklama: 'Kurumlar arası giden evrak standart şablonu.',
        zorunluMu: true
      },
      {
        ad: 'Birim İçi Olur / Onay Yazısı',
        kod: 'EBYS-02',
        aciklama: 'Makam onayına sunulan teklif ve olur belgesi.',
        zorunluMu: true
      },
      {
        ad: 'Dağıtımlı Genelge / Duyuru Yazısı',
        kod: 'EBYS-03',
        aciklama: 'Çoklu birim veya dış idarelere hitap eden dağıtımlı yazı.',
        zorunluMu: false
      },
      {
        ad: 'İç Yazışma / Müzekkere',
        kod: 'EBYS-04',
        aciklama: 'Birimler arası bilgi ve koordinasyon yazısı.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 4. PERSONEL İZİN & GÖREV TAKİP SİSTEMİ
  // =========================================================================
  {
    id: 'modul-personel-izin',
    kod: 'PERS-İZİN',
    paketTipi: 'modul',
    baslik: 'Personel & İzin / Görev Takip Sistemi (657 & 4857)',
    kisaAciklama:
      '657 DMK ve 4857 İş Kanunu uyarınca memur ve sürekli işçi izin hak edişi, sağlık raporu, mazeret ve görevlendirme yönetimi.',
    detayliAciklama:
      'Kamu kurumlarında görev yapan personellerin kıdemine göre yıllık izin gün hesaplaması, mazeret izinleri, sağlık rapor intikalleri ve resmi izin onay belgesi üreticisi.',
    mevzuat: '657 Sayılı DMK & 4857 Sayılı İş Kanunu',
    kategori: 'entegrasyon',
    ikon: 'Users',
    renk: 'blue',
    versiyon: 'v2.0.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Personel', 'İzin Takibi', '657 Memur', '4857 İşçi', 'Kıdem Hesabı'],
    routePath: '/personel?tab=izinler',
    removable: true,
    silinebilir: true,
    araclar: ['657 / 4857 İzin Gün Hesabı Motoru', 'Otomatik İzin Onay Belgesi Üretici'],
    asamalar: [
      {
        sira: 1,
        baslik: 'İzin / Rapor Talebi',
        aciklama: 'Personelin gerekçeli talep dilekçesi veya sağlık raporu.'
      },
      {
        sira: 2,
        baslik: 'İdare ve Görev Taksimi',
        aciklama: 'Vekil personel belirlenmesi ve birim amiri parafı.'
      },
      {
        sira: 3,
        baslik: 'Harcama Yetkilisi Onayı',
        aciklama: 'Resmi izin onay belgesi imza süreci.'
      }
    ],
    belgeler: [
      {
        ad: '657 Memur Yıllık İzin Onay Belgesi',
        kod: 'İZN-01',
        aciklama: 'Harcama yetkilisi onaylı standart resmi memur izin formu.',
        zorunluMu: true
      },
      {
        ad: '4857 Sürekli İşçi Yıllık İzin Talep Formu',
        kod: 'İZN-02',
        aciklama: 'İş günü esasına göre hesaplanan sürekli işçi izin belgesi.',
        zorunluMu: true
      },
      {
        ad: 'Mazeret İzni Talep Dilekçesi',
        kod: 'İZN-03',
        aciklama: 'Babalık, evlilik, vefat gibi yasal mazeret dilekçesi.',
        zorunluMu: false
      },
      {
        ad: 'Hastalık / Sağlık Raporu İntikal Yazısı',
        kod: 'İZN-04',
        aciklama: 'İstirahat raporunun izne dönüştürülme formu.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 5. DİNAMİK FORM ÜRETİCİ & BELGE ŞABLON STÜDYOSU
  // =========================================================================
  {
    id: 'dinamik-form-builder-studyosu',
    kod: 'FORM-BLD',
    paketTipi: 'modul',
    baslik: 'Dinamik Form Üretici & Belge Şablon Stüdyosu',
    kisaAciklama:
      'Doğrudan temin, onay belgeleri, piyasa araştırma mektupları ve kurum içi yazışmalar için sürükle-bırak dinamik form ve şablon üretici.',
    detayliAciklama:
      'Kamu alımlarında ihtiyaç duyulan tüm talep, onay, tutanak ve resmi formların dinamik olarak tasarlanması, değişken eşleştirme ve anında A4/PDF baskı motoru.',
    mevzuat: '4734 Sayılı KİK & Standart Form Yönetmeliği',
    kategori: 'form_belge',
    ikon: 'FileSpreadsheet',
    renk: 'emerald',
    versiyon: 'v2.2.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Form Builder', 'Dinamik Şablon', 'Belge Tasarımı', 'Değişkenler', 'Resmi Yazı'],
    routePath: '/form-builder',
    removable: true,
    silinebilir: true,
    araclar: ['Sürükle-Bırak Form Editörü', 'Dinamik Değişken Motoru', 'A4 Belge İhracı'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Form & Alan Tasarımı',
        aciklama: 'Metin, sayı, tablo ve tarih alanlarının form şablonuna yerleştirilmesi.'
      },
      {
        sira: 2,
        baslik: 'Değişken Eşleştirme',
        aciklama: 'Dosya no, yüklenici, tutar ve birim değişkenlerinin bağlanması.'
      },
      {
        sira: 3,
        baslik: 'Önizleme & Dağıtım',
        aciklama: 'KİK standartlarına uygun canlı A4 önizleme ve şablon kaydı.'
      }
    ],
    belgeler: [
      {
        ad: 'Dinamik İhtiyaç & Talep Form Şablonu',
        kod: 'DF-01',
        aciklama: 'Özelleştirilebilir dinamik birim talep formu.',
        zorunluMu: true
      },
      {
        ad: 'Dinamik Muayene Kabul Tutanağı',
        kod: 'DF-02',
        aciklama: 'Alım türüne göre uyarlanabilir kabul tutanak formu.',
        zorunluMu: true
      },
      {
        ad: 'Dinamik Teklif İsteme Mektubu Taslağı',
        kod: 'DF-03',
        aciklama: 'Şart ve şartname maddeleri içeren dinamik teklif mektubu.',
        zorunluMu: false
      }
    ]
  },

  // =========================================================================
  // 6. HARCAMA MERKEZİ & KİK PARASAL LİMİT TAKİBİ
  // =========================================================================
  {
    id: 'harcama-kik-limit-takibi',
    kod: 'HARC-LMT',
    paketTipi: 'modul',
    baslik: 'Harcama Merkezi & KİK Parasal Limit Takibi',
    kisaAciklama:
      '4734 Sayılı Kanun Madde 22/d yıllık parasal harcama tavanı ve birim bazlı doğrudan temin bütçe tüketim kontrol paneli.',
    detayliAciklama:
      'Büyükşehir ve diğer idareler için güncel KİK tebliğ parasal limitleri, harcama birimleri bazında bütçe tüketim tavanı, kalan limit ve mevzuat uyarı motoru.',
    mevzuat: '4734 Sayılı KİK m.22/d & KİK Tebliği',
    kategori: 'finans_hesap',
    ikon: 'Scale',
    renk: 'amber',
    versiyon: 'v2.1.0',
    surumAsamasi: 'Kararlı',
    etiketler: ['Harcama Merkezi', 'KİK Limit', '22/d Tavanı', 'Bütçe Takibi', 'Birim Analizi'],
    routePath: '/harcama-merkezi',
    removable: true,
    silinebilir: true,
    araclar: ['KİK Parasal Limit Denetleyicisi', 'Birim Bütçe Tüketim Analizi', 'Limit Aşım Uyarısı'],
    asamalar: [
      {
        sira: 1,
        baslik: 'Kurumsal Limit Tanımı',
        aciklama: 'Büyükşehir veya diğer idare KİK tebliğ parasal tavanının tespiti.'
      },
      {
        sira: 2,
        baslik: 'Birim Bazlı Tüketim İzleme',
        aciklama: 'Harcama birimlerinin kümülatif doğrudan temin harcamalarının dökümü.'
      },
      {
        sira: 3,
        baslik: 'Risk & Tavan Raporlama',
        aciklama: 'Limit aşım riskleri ve harcama yetkilisi mevzuat denetim özeti.'
      }
    ],
    belgeler: [
      {
        ad: 'KİK 22/d Yıllık Parasal Limit Tüketim Raporu',
        kod: 'KIK-RAP-01',
        aciklama: 'Mevzuat uyumlu kümülatif harcama ve tavan tüketim raporu.',
        zorunluMu: true
      },
      {
        ad: 'Birimler Harcama Dağılım İcmali',
        kod: 'KIK-RAP-02',
        aciklama: 'Birim bazlı harcama ve kalan ödenek çizelgesi.',
        zorunluMu: false
      }
    ]
  }
]

/**
 * S�r�me g�re g�r�n�r katalog: Do�rudan Temin s�r�m�nde yaln�zca 4734 m.22 paketi,
 * tam s�r�mde t�m paketler.
 */
export const RESMI_MODUL_PAKETLERI: ModulPaketi[] = IS_DT_EDITION
  ? TUM_MODUL_PAKETLERI.filter((m) => isModuleAllowedInEdition(m.id))
  : TUM_MODUL_PAKETLERI

