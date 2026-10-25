import type { RehberMaddesi } from '../modulMagazasi.types'

/**
 * Modül Bazlı Mevzuat, Sayıştay Denetimi ve Uygulama Rehberi Maddeleri
 */
export const REHBERLER_DATA: Record<string, RehberMaddesi[]> = {
  // =========================================================================
  // 1. 4734 DOĞRUDAN TEMİN (KİK-22-D)
  // =========================================================================
  'kik-dogrudan-temin-22d': [
    {
      baslik: 'KİK Parasal Limitlere Dikkat Edin',
      icerik:
        '4734 Sayılı Kanunun 22/d bendi için her yıl KİK tarafından ilan edilen parasal limit (Büyükşehirler ve diğer idareler için farklıdır) KDV hariç olarak hesaplanır. Alımları kısımlara bölerek limit altına çekmek Sayıştay denetiminde zimmet sebebidir.',
      tip: 'onemli'
    },
    {
      baslik: 'Piyasa Araştırmasında En Az 3 Teklif',
      icerik:
        'Kanunda sayı sınırlaması olmasa da İçişleri ve Maliye Bakanlığı tebliğleri uyarınca rekabet ve kamu yararı ilkeleri gereği en az 3 geçerli teklif toplanması önerilir.',
      tip: 'ipucu'
    },
    {
      baslik: 'Vergi ve SGK Borcu Teyidi (6183 m.22/A)',
      icerik:
        'Harcama yetkilisi onayından sonra ödeme aşamasında Hazine ve Maliye Bakanlığı genelgesi uyarınca firmanın vergi dairesinden vadesi geçmiş borcu olmadığına dair belge kontrol edilmelidir.',
      tip: 'mevzuat'
    },
    {
      baslik: 'Tutanaklarda Tarih, Saat ve Heyet İmzası Mecburiyeti',
      icerik:
        'Muayene ve kabul tutanakları hukuki tespit belgesidir. Mutlaka düzenlendiği gün, saat ve heyet üyelerinin (en az 2-3 kişi) imzasıyla tanzim edilmelidir.',
      tip: 'onemli'
    },
    {
      baslik: 'EKAP Doğrudan Temin Kayıt Bildirimi',
      icerik:
        'Yapılan tüm 22/d doğrudan temin alımları takip eden ayın 10. gününe kadar EKAP üzerinden doğrudan temin kayıt modülüne girilmelidir.',
      tip: 'mevzuat'
    }
  ],

  // =========================================================================
  // 2. 2886 DEVLET İHALE KANUNU (DİK-2886)
  // =========================================================================
  'dik-devlet-ihale-2886': [
    {
      baslik: '2886 m.35 ve m.45 Açık Teklif İhale Kararı',
      icerik:
        'Taşınmaz satış ve kiralamalarında 2886 Sayılı Kanun m.45 uyarınca açık teklif usulü esastır. İhale günü katılımcıların huzurunda teklif zarfları açılır ve pey sürümü yaptırılarak karar zaptına bağlanır.',
      tip: 'mevzuat'
    },
    {
      baslik: '%3 Geçici Teminat ve %6 Kesin Teminat Oranı',
      icerik:
        "İhaleye katılabilmek için muhammen bedelin en az %3'ü oranında geçici teminat yatırılması zorunludur. İhale üzerinde kalan istekli sözleşme öncesinde bedelin %6'sı oranında kesin teminat yatırmakla mükelleftir.",
      tip: 'onemli'
    },
    {
      baslik: 'Basın İlan Kurumu ve Yerel Gazete Süreleri',
      icerik:
        'İlanlar ihale tarihinden en az 10 gün önce Resmî Gazete veya Basın İlan Kurumu aracılığıyla yerel gazetede yayımlanmalıdır. İlan yapılmadan gerçekleştirilen ihaleler Sayıştay denetiminde usulsüzlük gerekçesiyle iptal edilir.',
      tip: 'ipucu'
    },
    {
      baslik: 'İta Amirinin 15 Günlük Onay Süresi',
      icerik:
        'İhale komisyonu (encümen) tarafından alınan ihale kararı, ita amirince (Belediye Başkanı / Kaymakam) karar tarihinden itibaren en geç 15 iş günü içinde onaylanır veya iptal edilir.',
      tip: 'mevzuat'
    },
    {
      baslik: '2886 m.75 Ecrimisil ve Fuzuli Şagil Tahliyesi',
      icerik:
        'Sözleşmesi biten veya kira ödemeyen taşınmazlar için genel mahkemelerde dava açılmasına gerek olmaksızın 2886 Sayılı Kanun m.75 uyarınca Kaymakamlık/Valilik oluruyla zabıta ve kolluk marifetiyle doğrudan tahliye sağlanır.',
      tip: 'mevzuat'
    }
  ],

  // =========================================================================
  // 3. EBYS RESMİ YAZIŞMA STÜDYOSU (EBYS-STD)
  // =========================================================================
  'ebys-resmi-yazisma-studyosu': [
    {
      baslik: 'Yazışmalarda "Arz Ederim" ve "Rica Ederim" Kuralı',
      icerik:
        'Resmî Yazışma Yönetmeliğine göre; ast veya muadil kurumlara "Rica ederim", üst makamlara "Arz ederim", hem üst hem ast makamlara dağıtımlı yazılarda ise "Arz ve rica ederim" ibaresi kullanılır.',
      tip: 'onemli'
    },
    {
      baslik: 'DETSİS ve Dosya Planı Numaralama Mecburiyeti',
      icerik:
        'Her resmi evrakın sayı bloğunda İdarenin Devlet Teşkilatı Merkezi Kayıt Sistemi (DETSİS) kodu ve Standart Dosya Planı kodu bulunmalıdır.',
      tip: 'mevzuat'
    },
    {
      baslik: 'Karekod ve Belge Doğrulama Kodu',
      icerik:
        'E-imza ile imzalanan resmi yazıların alt bilgi kısmında evrak doğrulama linki ve karekod (QR kod) yer alması Resmî Yazışma Yönetmeliği m.26 gereğince zorunludur.',
      tip: 'ipucu'
    },
    {
      baslik: 'Paraf ve E-İmza Hiyerarşisi',
      icerik:
        'Belgeyi hazırlayan raportör/uzmandan başlayarak şube müdürü, daire başkanı paraf açar; en üst yetkili makam ise e-imza ile evrakı onaylar. Yetki devri olmaksızın vekaleten imza atılamaz.',
      tip: 'mevzuat'
    }
  ],

  // =========================================================================
  // 4. PERSONEL İZİN & GÖREV TAKİP (PERS-İZİN)
  // =========================================================================
  'modul-personel-izin': [
    {
      baslik: '657 m.102 Yıllık İzin Hak Ediş Süreleri',
      icerik:
        'Hizmeti 1 yıldan 10 yıla kadar (10 yıl dahil) olan memurlar için 20 gün, hizmeti 10 yıldan fazla olanlar için 30 gün yıllık izin verilir. Zorunlu hallerde bu sürelere gidiş ve dönüş için en çok ikişer gün yol izni eklenebilir.',
      tip: 'mevzuat'
    },
    {
      baslik: 'Mazeret İzinleri Paraya Çevrilemez ve Ertelenemez',
      icerik:
        '657 m.104 kapsamında verilen evlilik (7 gün), babalık (10 gün) ve vefat (7 gün) mazeret izinleri olayın gerçekleştiği tarihten itibaren kullanılmak zorundadır; sonraki yıla devredilemez.',
      tip: 'onemli'
    },
    {
      baslik: 'Hastalık Raporlarının İntikal Süresi',
      icerik:
        'Memurlar, sağlık kurumlarınca verilen istirahat raporlarını raporun düzenlendiği günü takip eden mesai saati bitimine kadar kurumlarına intikal ettirmekle yükümlüdür.',
      tip: 'onemli'
    },
    {
      baslik: 'Vekalet Belirlenmeden Görev Mahallinden Ayrılma Yasağı',
      icerik:
        'İmza yetkisi veya mali sorumluluğu olan memurların izne ayrılmadan önce görevlerini vekaleten yürütecek personeli birim amirine bildirip onaylatmaları hizmetin aksamaması için zorunludur.',
      tip: 'ipucu'
    },
    {
      baslik: '4857 Sürekli İşçi İzin Hak Ediş Farkları',
      icerik:
        '4857 Sayılı Kanun kapsamındaki işçilerin yıllık izinleri takvim günü değil iş günü esasına göre hesaplanır; genel tatil ve hafta tatili günleri izin gün sayısına dahil edilmez.',
      tip: 'mevzuat'
    }
  ]
}
