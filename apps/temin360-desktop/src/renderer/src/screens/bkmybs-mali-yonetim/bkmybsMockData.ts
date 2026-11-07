import {
  ButceTertip,
  KikKotaModel,
  MifKayit,
  TkysZimmetKayit,
  EmanetTeminatKayit,
  SozlesmeTaahhutKayit
} from './types'

export const INITIAL_BUTCE_TERTIPLERI: ButceTertip[] = [
  {
    id: 'tert-1',
    kurumsalKod: '46.06.01.05',
    fonksiyonelKod: '01.3.1.00',
    finansmanKod: '5',
    ekonomikKod: '03.2.1.01',
    aciklama: 'Kırtasiye ve Büro Malzemesi Alımları',
    baslangicOdenegi: 450000,
    harcananTutar: 185400,
    blokeEdilenTutar: 42500,
    kullanilabilirOdenek: 222100,
    yil: 2026
  },
  {
    id: 'tert-2',
    kurumsalKod: '46.06.01.05',
    fonksiyonelKod: '01.3.1.00',
    finansmanKod: '5',
    ekonomikKod: '03.2.1.02',
    aciklama: 'Yazılı Materyal, Kitap ve Süreli Yayın Alımları',
    baslangicOdenegi: 180000,
    harcananTutar: 64200,
    blokeEdilenTutar: 15000,
    kullanilabilirOdenek: 100800,
    yil: 2026
  },
  {
    id: 'tert-3',
    kurumsalKod: '46.06.01.05',
    fonksiyonelKod: '01.3.1.00',
    finansmanKod: '5',
    ekonomikKod: '03.7.1.01',
    aciklama: 'Büro Mefruşatı ve Donanım Malzemesi Alımları',
    baslangicOdenegi: 650000,
    harcananTutar: 320000,
    blokeEdilenTutar: 95000,
    kullanilabilirOdenek: 235000,
    yil: 2026
  },
  {
    id: 'tert-4',
    kurumsalKod: '46.06.01.05',
    fonksiyonelKod: '01.3.2.00',
    finansmanKod: '5',
    ekonomikKod: '03.5.2.02',
    aciklama: 'Bilgisayar Yazılım Alımları ve Lisans Giderleri',
    baslangicOdenegi: 980000,
    harcananTutar: 410000,
    blokeEdilenTutar: 120000,
    kullanilabilirOdenek: 450000,
    yil: 2026
  },
  {
    id: 'tert-5',
    kurumsalKod: '46.06.01.05',
    fonksiyonelKod: '01.3.9.00',
    finansmanKod: '5',
    ekonomikKod: '03.8.1.01',
    aciklama: 'Hizmet Binası Küçük Onarım ve Bakım Giderleri',
    baslangicOdenegi: 750000,
    harcananTutar: 290000,
    blokeEdilenTutar: 80000,
    kullanilabilirOdenek: 380000,
    yil: 2026
  }
]

export const INITIAL_KIK_KOTA: KikKotaModel = {
  idareTuru: 'buyuksehir',
  esikDeger: 864500, // Büyükşehir için 2026 parametresi
  toplamMalHizmetButcesi: 6850000,
  yuzde10TavanTutari: 685000, // Madde 62/ı tavanı (%10)
  gerceklesen22dToplami: 412500,
  kalanKotaTutari: 272500,
  kullanimOrani: 60.2,
  kikIzinRiski: false,
  birimDagitimlari: [
    { birimAdi: 'Destek Hizmetleri Dairesi', tahsisEdilen: 280000, harcanan: 195000, oran: 69.6 },
    { birimAdi: 'Bilgi İşlem Dairesi', tahsisEdilen: 180000, harcanan: 112000, oran: 62.2 },
    { birimAdi: 'Fen İşleri Dairesi', tahsisEdilen: 125000, harcanan: 68500, oran: 54.8 },
    { birimAdi: 'İnsan Kaynakları Dairesi', tahsisEdilen: 100000, harcanan: 37000, oran: 37.0 }
  ]
}

export const INITIAL_MIF_LISTESI: MifKayit[] = [
  {
    id: 'mif-1',
    mifNo: '2026/MIF-0042',
    dosyaId: 101,
    dosyaNo: '2026/001-DT',
    alacakliUnvan: 'Mega Ofis & Kırtasiye San. Tic. Ltd. Şti.',
    alacakliVkn: '6140529811',
    alacakliIban: 'TR330006200000000123456789',
    faturaNo: 'GIB202600000124',
    faturaTarihi: '2026-03-12',
    butceTertibi: '46.06.01.05 - 01.3.1.00 - 5 - 03.2.1.01',
    brutTutar: 42500,
    kdvOrani: 20,
    kdvTutari: 8500,
    kdvTevkifatOrani: 'Yok',
    kdvTevkifatTutari: 0,
    damgaVergisiOrani: 0.00948,
    damgaVergisiTutari: 402.9,
    kararPuluTutari: 240.5,
    digerKesintiler: 0,
    netOdenecekTutar: 50356.6,
    durum: 'onaylandi',
    hazirlayan: 'Kemal Aksoy (Mali Mutemet)',
    onaylayan: 'Hüseyin Erdem (Harcama Yetkilisi)',
    tifNo: 'TİF-2026/088',
    tarih: '2026-03-14',
    aciklama: '2026/001-DT sayılı doğrudan temin kırtasiye alımı kesin hakediş ödemesi.'
  },
  {
    id: 'mif-2',
    mifNo: '2026/MIF-0043',
    dosyaId: 102,
    dosyaNo: '2026/002-DT',
    alacakliUnvan: 'Anadolu Bilişim Sistemleri A.Ş.',
    alacakliVkn: '0680194823',
    alacakliIban: 'TR620001500000000987654321',
    faturaNo: 'EAR202600000592',
    faturaTarihi: '2026-03-18',
    butceTertibi: '46.06.01.05 - 01.3.2.00 - 5 - 03.5.2.02',
    brutTutar: 95000,
    kdvOrani: 20,
    kdvTutari: 19000,
    kdvTevkifatOrani: '5/10',
    kdvTevkifatTutari: 9500,
    damgaVergisiOrani: 0.00948,
    damgaVergisiTutari: 900.6,
    kararPuluTutari: 538.0,
    digerKesintiler: 0,
    netOdenecekTutar: 103061.4,
    durum: 'bloke_edildi',
    hazirlayan: 'Kemal Aksoy (Mali Mutemet)',
    tifNo: 'TİF-2026/092',
    tarih: '2026-03-20',
    aciklama: 'Veritabanı lisans uzatımı ve bakım hizmeti tahakkuku.'
  },
  {
    id: 'mif-3',
    mifNo: '2026/MIF-0044',
    dosyaId: 103,
    dosyaNo: '2026/005-DT',
    alacakliUnvan: 'Özdemir Teknik Hırdavat Ltd. Şti.',
    alacakliVkn: '7190334812',
    alacakliIban: 'TR880001000000000456789123',
    faturaNo: 'FAT202600000911',
    faturaTarihi: '2026-03-22',
    butceTertibi: '46.06.01.05 - 01.3.9.00 - 5 - 03.8.1.01',
    brutTutar: 28400,
    kdvOrani: 20,
    kdvTutari: 5680,
    kdvTevkifatOrani: 'Yok',
    kdvTevkifatTutari: 0,
    damgaVergisiOrani: 0.00948,
    damgaVergisiTutari: 269.23,
    kararPuluTutari: 160.75,
    digerKesintiler: 0,
    netOdenecekTutar: 33650.02,
    durum: 'taslak',
    hazirlayan: 'Ahmet Karaca (Satın Alma Sorumlusu)',
    tarih: '2026-03-22',
    aciklama: 'Hizmet binası aydınlatma ve elektrik bakım malzemesi alımı.'
  }
]

export const INITIAL_TKYS_LISTESI: TkysZimmetKayit[] = [
  {
    id: 'tkys-1',
    tifNo: 'TİF-2026/088',
    dosyaNo: '2026/001-DT',
    malzemeAdi: 'Fotokopi Kağıdı A4 80 gr (Koli)',
    tasinirKodu: '150.01.01.01',
    miktar: 150,
    olcuBirimi: 'Koli',
    birimFiyat: 180,
    toplamTutar: 27000,
    ambarAdi: 'Ana Kırtasiye Deposu',
    zimmetliPersonel: 'Ortak Kullanım Havuzu',
    odaNo: 'Zemin Kat Ambar',
    muayeneKabulTarihi: '2026-03-13',
    muayeneRaporNo: 'MKT-2026/012',
    durum: 'ambarda'
  },
  {
    id: 'tkys-2',
    tifNo: 'TİF-2026/089',
    dosyaNo: '2026/001-DT',
    malzemeAdi: 'Toner Kartuşu Siyah (Yüksek Kapasite)',
    tasinirKodu: '150.01.02.04',
    miktar: 25,
    olcuBirimi: 'Adet',
    birimFiyat: 620,
    toplamTutar: 15500,
    ambarAdi: 'Bilişim Sarf Deposu',
    zimmetliPersonel: 'Mehmet Salih Öztürk',
    odaNo: 'Oda 304',
    muayeneKabulTarihi: '2026-03-13',
    muayeneRaporNo: 'MKT-2026/012',
    durum: 'zimmetlendi'
  },
  {
    id: 'tkys-3',
    tifNo: 'TİF-2026/092',
    dosyaNo: '2026/002-DT',
    malzemeAdi: 'Sunucu Yedekleme Ünitesi SSD 4TB',
    tasinirKodu: '255.02.01.08',
    miktar: 4,
    olcuBirimi: 'Adet',
    birimFiyat: 23750,
    toplamTutar: 95000,
    ambarAdi: 'Sistem Odası Envanteri',
    zimmetliPersonel: 'Ali Kemal Yıldız (Sistem Uzmanı)',
    odaNo: 'Sistem Odası 101',
    muayeneKabulTarihi: '2026-03-19',
    muayeneRaporNo: 'MKT-2026/015',
    durum: 'zimmetlendi'
  }
]

export const INITIAL_EMANET_LISTESI: EmanetTeminatKayit[] = [
  {
    id: 'em-1',
    dosyaNo: '2026/004-İHALE',
    istekliUnvan: 'Kaya Mimarlık & İnşaat Taah. A.Ş.',
    istekliVkn: '5280914421',
    teminatTuru: 'kesin',
    bankaAdi: 'Vakıfbank Kurumsal Şube',
    mektupNo: 'VKF-2026-TM-00412',
    tutar: 185000,
    vadeTarihi: '2026-12-31',
    teyitDurumu: 'teyit_edildi',
    iadeDurumu: 'emanette',
    alinisTarihi: '2026-02-15'
  },
  {
    id: 'em-2',
    dosyaNo: '2026/007-İHALE',
    istekliUnvan: 'Netvizyon Güvenlik & Otomasyon Ltd.',
    istekliVkn: '6310248819',
    teminatTuru: 'gecici',
    bankaAdi: 'Ziraat Bankası Kamu Şubesi',
    mektupNo: 'ZRT-2026-GTM-9821',
    tutar: 45000,
    vadeTarihi: '2026-08-30',
    teyitDurumu: 'teyit_edildi',
    iadeDurumu: 'iade_edildi',
    alinisTarihi: '2026-01-20'
  }
]

export const INITIAL_SOZLESME_LISTESI: SozlesmeTaahhutKayit[] = [
  {
    id: 'sz-1',
    sozlesmeNo: 'SZ-2026/008',
    dosyaNo: '2026/004-İHALE',
    yukleniciUnvan: 'Kaya Mimarlık & İnşaat Taah. A.Ş.',
    yukleniciVkn: '5280914421',
    sozlesmeTarihi: '2026-02-18',
    isBitisTarihi: '2026-10-15',
    sozlesmeBedeli: 3100000,
    damgaVergisiTutari: 29388,
    hakedisToplami: 950000,
    kalanTaahhut: 2150000,
    durum: 'yururlukte'
  },
  {
    id: 'sz-2',
    sozlesmeNo: 'SZ-2026/011',
    dosyaNo: '2026/009-DT',
    yukleniciUnvan: 'Temiz Çevre Atık & Peyzaj Hizmetleri',
    yukleniciVkn: '8120491823',
    sozlesmeTarihi: '2026-01-10',
    isBitisTarihi: '2026-07-10',
    sozlesmeBedeli: 480000,
    damgaVergisiTutari: 4550.4,
    hakedisToplami: 240000,
    kalanTaahhut: 240000,
    durum: 'yururlukte'
  }
]

