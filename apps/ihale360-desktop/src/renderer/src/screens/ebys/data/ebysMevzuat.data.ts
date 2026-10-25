import { EbysResource } from '../ebys.types'

export const EBYS_RESOURCES: EbysResource[] = [
  {
    name: 'Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik',
    url: 'https://www.mevzuat.gov.tr/MevzuatMetin/21.5.2646.pdf',
    type: 'Resmî Mevzuat (Cumhurbaşkanı Kararı No: 2646)',
    format: 'PDF / Resmî Gazete',
    license: 'Kamu Mevzuatı (Açık Erişim)',
    isOfficial: true,
    description:
      'Türkiye Cumhuriyeti idarelerinin tüm resmî yazışmalarında uymak zorunda olduğu hiyerarşik kurallar, yazı alanları, imza blokları, arz/rica esasları ve standart marjinleri belirleyen temel mevzuat.'
  },
  {
    name: 'T.C. Cumhurbaşkanlığı Dijital Dönüşüm Ofisi e-Yazışma Teknik Rehberi (Sürüm 2.0)',
    url: 'https://cbddo.gov.tr/projeler/e-yazisma/',
    type: 'Teknik Standart & Paketleme (EYP 2.0)',
    format: 'PDF / XML Şeması / EYP',
    license: 'T.C. Cumhurbaşkanlığı Açık Standart',
    isOfficial: true,
    description:
      'Kurumlar arası elektronik resmî belge paylaşımında kullanılan e-Yazışma Paketi (EYP 2.0) mimarisi, üstveri (metadata) alanları ve elektronik imza entegrasyonu rehberi.'
  },
  {
    name: 'Belgenet Kamu EBYS Belge Oluşturma ve Şablon Kılavuzu',
    url: 'https://www.turksat.com.tr/tr/bilisim-hizmetleri/belgenet',
    type: 'Kamu EBYS Yazılım Standardı',
    format: 'HTML / Web Dokümanı',
    license: 'TÜRKSAT A.Ş. Referans Dokümanı',
    isOfficial: true,
    description:
      'Yüzlerce kamu kurumu ve üniversitede kullanılan Belgenet sisteminin üst yazı, olur, iç yazışma ve e-imza doğrulama kodlu şablon tasarım standartları.'
  },
  {
    name: 'İçişleri Bakanlığı e-Belediye EBYS Modülü Standartları',
    url: 'https://www.e-belediye.gov.tr/',
    type: 'Yerel Yönetimler EBYS Standardı',
    format: 'Web / PDF Kılavuz',
    license: 'T.C. İçişleri Bakanlığı',
    isOfficial: true,
    description:
      'Türkiye genelindeki belediyelerin başkanlık oluru, encümen kararı, müdürlükler arası iç yazışma ve dış kurum üst yazı şablon düzeni.'
  },
  {
    name: 'Millî Eğitim Bakanlığı Belge Yönetimi ve Arşiv Standartları',
    url: 'https://meb.gov.tr/',
    type: 'Merkez ve Taşra EBYS Şablonları',
    format: 'Resmî Genelge & Şablon',
    license: 'T.C. Millî Eğitim Bakanlığı',
    isOfficial: true,
    description:
      'İl/İlçe Millî Eğitim Müdürlükleri ve okul/kurum yazışmalarında kullanılan hiyerarşik sayı blokları (DETSİS kodlu), dağıtım ve ek listesi düzenlemeleri.'
  }
]

export const MEVZUAT_KURALLARI = [
  {
    madde: 'Madde 11 — Başlık Alanı',
    icerik:
      'Belgenin hazırlandığı idarenin adını belirten alandır. Başlık; belgenin yazı alanının üst kısmına ortalanarak yazılır. İlk satırda "T.C." kısaltması, ikinci satırda idarenin adı büyük harflerle, üçüncü satırda ise birimin adı ilk harfleri büyük olmak üzere yazılır.'
  },
  {
    madde: 'Madde 12 — Sayı Alanı ve DETSİS',
    icerik:
      'Belgelerde DETSİS’te kayıtlı idare kimlik kodu, dosya planı kodu ve evrak kayıt numarası aralarına kısa çizgi (-) konularak yazılır. Örneğin: E-12345678-010.01-98765'
  },
  {
    madde: 'Madde 15 — Muhatap Alanı',
    icerik:
      'Belgenin gönderildiği idare veya kişi adının yer aldığı alandır. Muhatap, belgenin içeriğine göre sayfa genişliğine ortalanarak büyük harflerle yazılır.'
  },
  {
    madde: 'Madde 19 — Metin ve Arz/Rica Esasları',
    icerik:
      'Muhataba göre: Alt makamlara "Rica ederim.", üst ve aynı düzey makamlara "Arz ederim.", hem üst/aynı hem alt makamlara (dağıtımlı) gönderilen yazılarda ise "Arz ve rica ederim." ibaresiyle bitirilir.'
  },
  {
    madde: 'Madde 20 — İmza Alanı',
    icerik:
      'Metnin bitiminden itibaren 2-4 satır boşluk bırakılarak yazı alanının sağına yazılır. İmza atan yetkilinin adı küçük, SOYADI BÜYÜK harfle ve unvanı ilk harfleri büyük olarak alt satıra yazılır.'
  },
  {
    madde: 'Madde 21 — Olur / Onay Blokları',
    icerik:
      'Bir idari işlem için makam onayı gerekiyorsa; teklif eden makam metni hazırlar, "OLUR" ibaresi ortalanarak altına tarih, imza yetkilisinin adı ve unvanı yerleştirilir.'
  },
  {
    madde: 'Madde 26 — Altbilgi ve Doğrulama Alanı',
    icerik:
      'Sayfa alt marjininde idarenin iletişim bilgileri, internet adresi, KEP adresi, evrakı hazırlayanın unvanı ve 5070 sayılı Kanuna göre üretilen karekod/doğrulama kodu yer alır.'
  }
]
