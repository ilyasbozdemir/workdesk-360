import type { HazirMetinKalibi } from '../modulMagazasi.types'

/**
 * Modül Bazlı Standart Hazır Metin Kalıpları
 * Kamu idareleri (Belediye, Üniversite, Bakanlık, İl Özel İdareleri) için
 * 4734 KİK, 2886 DİK, Resmî Yazışma Yönetmeliği ve 657/4857 Personel mevzuatına
 * tam uyumlu hazır dilekçe, tutanak, onay belgesi, ihtarname ve resmi yazı kalıpları.
 */
export const HAZIR_METINLER_DATA: Record<string, HazirMetinKalibi[]> = {
  // =========================================================================
  // 1. 4734 DOĞRUDAN TEMİN (KİK-22-D) HAZIR METİN KALIPLARI
  // =========================================================================
  'kik-dogrudan-temin-22d': [
    {
      id: 'dt-metin-ihtiyac',
      kategori: 'İhtiyaç & Gerekçe',
      baslik: 'Mal Alımı İhtiyaç & Talep Gerekçesi',
      kisaAciklama:
        'Birimce acil ihtiyaç duyulan sarf malzeme veya demirbaş alımı için standart gerekçe metni.',
      varsayilanHitap: 'DESTEK HİZMETLERİ DAİRESİ BAŞKANLIĞINA',
      varsayilanKonu: 'Doğrudan Temin Usulü İle Malzeme Alımı Talebi',
      tamMetin:
        'Birimimizin yürütmekte olduğu kamu hizmetlerinin aksamadan sürdürülebilmesi ve iş ve işlemlerin kesintiye uğramaması amacıyla, aşağıda teknik özellikleri ve adetleri belirtilen malzemelerin 4734 Sayılı Kamu İhale Kanununun 22/d maddesi kapsamında doğrudan temin usulüyle satın alınması hususunda gereğini tensiplerinize arz ederim.',
      rehberNotu:
        'Bu metin harcama birimi üst yazısına bağlanır. İhtiyaç listesi ek olarak iliştirilmelidir.',
      etiket: 'Gerekçe',
      formTipi: 'dilekce'
    },
    {
      id: 'dt-metin-teklif-isteme',
      kategori: 'Piyasa Araştırması',
      baslik: 'Piyasa Fiyat Araştırması Teklif İsteme Yazısı',
      kisaAciklama: 'Firmalara fiyat teklifi vermeleri için gönderilen resmi davet mektubu.',
      varsayilanHitap: 'İLGİLİ FİRMA YETKİLİSİNE',
      varsayilanKonu: 'Fiyat Teklifi İstemi (4734 / 22-d)',
      tamMetin:
        'İdaremiz ihtiyacı olan ve ekli şartnamede/listede cinsi, miktarı ve özellikleri belirtilen mal/hizmet alımı işi 4734 Sayılı Kamu İhale Kanununun 22/d maddesi gereğince doğrudan temin yöntemiyle yaptırılacaktır. Söz konusu alıma ilişkin KDV hariç birim ve toplam fiyat teklifinizin kaşeli ve imzalı olarak en geç belirtilen tarih ve saate kadar İdaremize ulaştırılmasını rica ederiz.',
      rehberNotu:
        'Faks veya e-posta ile gönderilecekse teyit alındı belgesinin dosyaya eklenmesi Sayıştay denetiminde aranır.',
      etiket: 'Teklif',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dt-metin-yaklasik-maliyet',
      kategori: 'Maliyet & Onay',
      baslik: 'Yaklaşık Maliyet Tespit Tutanağı Açıklaması',
      kisaAciklama:
        'Fiyat araştırması verilerine dayanılarak tahmini bedelin nasıl hesaplandığını açıklayan şerh.',
      varsayilanHitap: 'HARCAMA YETKİLİSİNE',
      varsayilanKonu: 'Yaklaşık Maliyet Tespit Kararı',
      tamMetin:
        '4734 Sayılı Kamu İhale Kanununun 9. maddesi ve Doğrudan Temin Esasları uyarınca yapılan piyasa araştırmasında, en az 3 farklı yetkili tedarikçiden alınan proforma faturalar ve piyasa rayiçleri incelenmiş; aritmetik ortalaması ve piyasa koşulları dikkate alınarak işin yaklaşık maliyeti KDV hariç olarak tespit edilerek onayınıza sunulmuştur.',
      rehberNotu:
        'Yaklaşık maliyet gizlidir; piyasa araştırma görevlileri ve harcama yetkilisi haricinde kimseyle paylaşılmaz.',
      etiket: 'Maliyet',
      formTipi: 'tutanak'
    },
    {
      id: 'dt-metin-tek-kaynak',
      kategori: 'İhtiyaç & Gerekçe',
      baslik: 'Tek Kaynaktan Alım Gerekçe Raporu (22/a - 22/c)',
      kisaAciklama: 'Tekel niteliğindeki veya fikri hak sahibi olan tek firmadan alım gerekçesi.',
      varsayilanHitap: 'HARCAMA YETKİLİĞİ MAKAMINA',
      varsayilanKonu: 'Tek Kaynak Gerekçeli Alım Onayı',
      tamMetin:
        'Alımı planlanan ürünün/yazılımın Türkiye yetkili tek dağıtıcısı ve patent/telif hakları sahibi olduğu belgelendirildiğinden; başka bir kaynaktan temini teknik ve hukuki açıdan mümkün bulunmamaktadır. Bu nedenle alımın 4734 Sayılı Kanunun 22/a (veya 22/c) bendi uyarınca tek kaynaktan temin edilmesi hususunu olurlarınıza arz ederim.',
      rehberNotu:
        'Telif/patent veya tek yetkili satıcılık belgesinin onay belgesine eklenmesi mecburidir.',
      etiket: 'Tek Kaynak',
      formTipi: 'onay_belgesi'
    },
    {
      id: 'dt-metin-muayene-kabul',
      kategori: 'Kabul & Muayene',
      baslik: 'Muayene ve Kabul Eksiklik / İhtar Metni',
      kisaAciklama: 'Teslimatta şartnameye uymayan kalemler için firmaya verilen düzeltme ihtarı.',
      varsayilanHitap: 'YÜKLENİCİ FİRMA YÖNETİMİNE',
      varsayilanKonu: 'Teslim Edilen Mallardaki Ayıplar ve Düzeltme İhtarı',
      tamMetin:
        'İdaremiz ile firmanız arasında akdedilen doğrudan temin siparişi kapsamında teslim edilen malların Muayene ve Kabul Komisyonumuzca yapılan fiziki ve fonksiyonel incelenmesinde; bazı kalemlerin teknik şartnamede belirtilen kriterleri karşılamadığı tespit edilmiştir. Söz konusu eksikliklerin sözleşme şartları gereği 3 (üç) iş günü içerisinde giderilerek uygun ürünlerle değiştirilmesi, aksi halde siparişin iptal edilerek gecikme cezası uygulanacağı hususu ihtaren bildirilir.',
      rehberNotu:
        'Bu metin noterden veya iadeli taahhütlü/imzalı tebligat yoluyla firmaya ulaştırılmalıdır.',
      etiket: 'İhtar',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dt-metin-odeme-tahakkuk',
      kategori: 'Maliyet & Onay',
      baslik: 'Ödeme Emri Belgesi Tahakkuk Açıklama Notu',
      kisaAciklama:
        'Muhasebe servisine gönderilen ödeme emri belgesi üzerindeki standart gerekçe şerhi.',
      varsayilanHitap: 'STRATEJİ GELİŞTİRME DAİRESİ BAŞKANLIĞINA (Muhasebe Birimi)',
      varsayilanKonu: 'Ödeme Emri ve Hakediş Tahakkuku',
      tamMetin:
        'İdaremiz 4734 sayılı Kanunun 22/d maddesi gereğince gerçekleştirilen alıma ait fatura, muayene kabul tutanağı, piyasa fiyat araştırması tutanağı ve onay belgesi ekte sunulmuştur. İş eksiksiz teslim alınmış olup, ilgili mevzuat ve vergi kesintileri tatbik edilerek hakediş bedelinin yüklenicinin kayıtlı IBAN hesabına ödenmesini arz ederim.',
      rehberNotu:
        'Vergi borcu sorgulaması (6183 m.22/A) 5.000 TL üzerindeki tüm kamu ödemelerinde eklenmelidir.',
      etiket: 'Ödeme',
      formTipi: 'dilekce'
    },
    {
      id: 'ttn-mal-kabul',
      kategori: 'Kabul & Muayene',
      baslik: 'Standart Mal Kabul ve Muayene Tutanak Metni',
      kisaAciklama: 'Malın şartnameye tam uygun teslim alındığını gösteren metin.',
      varsayilanHitap: 'TUTANAKTIR',
      varsayilanKonu: 'Mal Alımı Muayene ve Kabul Tutanağı',
      tamMetin:
        'İdaremiz Doğrudan Temin Kararı kapsamında yüklenici firma tarafından faturası ile teslim edilen malzemelerin fiziksel kontrolleri, parça sayımları ve teknik şartnameye uygunluk tetkikleri tarafımızca yapılmıştır. Teslim edilen malların evsafına uygun, noksansız ve çalışır durumda olduğu anlaşılmış olup işbu tutanak mahallinde 3 nüsha olarak tanzimle imza altına alınmıştır.',
      rehberNotu: 'En az 1 komisyon başkanı ve 2 asil üye tarafından imzalanmalıdır.',
      etiket: 'Kabul',
      formTipi: 'tutanak'
    },
    {
      id: 'ttn-hasar-tespit',
      kategori: 'Hasar & Ayıp',
      baslik: 'Kusurlu / Hasarlı Malzeme Tespit Tutanağı',
      kisaAciklama: 'Ambalajı hasarlı veya içeriği bozuk ürünlerin zabıt altına alınması.',
      varsayilanHitap: 'TUTANAKTIR',
      varsayilanKonu: 'Ayıplı Malzeme Tespit Tutanağı',
      tamMetin:
        'Yüklenici firma tarafından idaremize teslim edilmek üzere getirilen kolilerin açılması esnasında; ambalajın ezilmiş olduğu ve içerisindeki malzemenin kırık/kullanılamaz vaziyette bulunduğu tespit edilmiştir. İlgili mal teslim alınmamış, durum tespit edilerek işbu tutanak kurye ve ambar görevlileri huzurunda müştereken imza altına alınmıştır.',
      rehberNotu:
        'Fotoğraf çekilip tutanak ekine konulması hukuki uyuşmazlıklarda ispat kolaylığı sağlar.',
      etiket: 'Hasar',
      formTipi: 'tutanak'
    },
    {
      id: 'dt-metin-hizmet-is-artisi',
      kategori: 'İş Artışı & Süre',
      baslik: 'Hizmet / Yapım Alımı İş Artışı ve Süre Uzatımı Raporu',
      kisaAciklama:
        'Doğrudan temin kapsamında öngörülemeyen durumlar için yasal sınır dahilinde iş artışı gerekçesi.',
      varsayilanHitap: 'HARCAMA YETKİLİSİNE',
      varsayilanKonu: 'İş Artışı ve Ek Süre Talebi',
      tamMetin:
        'İdaremizce 4734 Sayılı Kanunun 22/d maddesi kapsamında temin edilen hizmetin ifası sırasında; sözleşme/sipariş konusu işin öngörülemeyen teknik zorunluluklar sebebiyle kanuni oranlar (%20) dahilinde artırılması ve ek süre verilmesi zorunluluğu hasıl olmuştur. Gerekli ödenek mevcut olup, iş artışının ve süre uzatımının onaylanmasını arz ederim.',
      rehberNotu: 'Doğrudan temin limitini aşacak şekilde iş artışı yapılamaz.',
      etiket: 'İş Artışı',
      formTipi: 'onay_belgesi'
    },
    {
      id: 'dt-metin-yasaklilik-teyit',
      kategori: 'Piyasa Araştırması',
      baslik: 'EKAP İhale Yasaklılık Teyit Tutanağı',
      kisaAciklama: 'Sipariş veya sözleşme öncesi yüklenicinin yasaklılık sorgusunun tescili.',
      varsayilanHitap: 'TUTANAKTIR',
      varsayilanKonu: 'EKAP Yasaklılık Kontrol Kaydı',
      tamMetin:
        '4734 Sayılı Kamu İhale Kanununun 22. maddesi kapsamında doğrudan temin yöntemiyle alım yapılması kararlaştırılan yüklenici firmanın / isteklinin, Elektronik Kamu Alımları Platformu (EKAP) üzerinden yapılan sorgulamasında kamu ihalelerine katılmaktan yasaklı bulunmadığı tespit edilmiş olup işbu tutanak tanzim edilmiştir.',
      rehberNotu: 'EKAP sorgulama ekran çıktısı doğrudan temin dosyasında muhafaza edilmelidir.',
      etiket: 'EKAP',
      formTipi: 'tutanak'
    },
    {
      id: 'dt-metin-gecikme-ceza',
      kategori: 'Ceza & Kesinti',
      baslik: 'Gecikme Cezası Kesintisi ve Tahakkuk Müzekkeresi',
      kisaAciklama:
        'Mal veya hizmeti süresinde teslim etmeyen firmaya sözleşme gereği uygulanan ceza bildirimi.',
      varsayilanHitap: 'MUHASEBE VE MALİ HİZMETLER SERVİSİNE',
      varsayilanKonu: 'Gecikme Cezası Kesintisi Uygulanması',
      tamMetin:
        'İdaremiz Doğrudan Temin siparişi kapsamında [YÜKLENİCİ FİRMA] tarafından taahhüt edilen teslim süresi [SÖZLEŞME TARİHİ] olmasına rağmen, teslimat [GECİKME GÜN] gün gecikmeyle [FİİLİ TESLİM TARİHİ] tarihinde yapılmıştır. Şartname/sözleşme hükmü gereği günlük % [CEZA ORANI] oranında hesaplanan toplam [CEZA TUTARI] TL gecikme cezasının firmanın hakedişinden mahsup edilerek irat kaydedilmesini arz ederim.',
      rehberNotu:
        'Gecikme cezası KDV hariç hakediş bedeli üzerinden hesaplanmalı ve kesinti dekontu dosyalanmalıdır.',
      etiket: 'Ceza',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dt-metin-fiyat-farki',
      kategori: 'Maliyet & Hesap',
      baslik: 'Akaryakıt / Mal Alımı Fiyat Farkı Hesap Kararı',
      kisaAciklama: 'TÜİK veya EPDK fiyat endeksleri doğrultusunda hesaplanan fiyat farkı şerhi.',
      varsayilanHitap: 'HARCAMA YETKİLİSİNE',
      varsayilanKonu: 'Fiyat Farkı Tahakkuku Kararı',
      tamMetin:
        'Kamu İhale Kanununa İlişkin Fiyat Farkı Esasları ve sözleşme hükümleri uyarınca; [TESLİM DÖNEMİ] ayında teslim edilen akaryakıt/malzeme için temel endeks ile cari endeks farkı uygulanarak toplam [FARK TUTARI] TL fiyat farkı tahakkuk ettirilmiş olup ödeme emrine bağlanması olurlarınıza sunulur.',
      rehberNotu:
        'Fiyat farkı hesabı tablosu ve EPDK/TÜİK resmi bülten çıktısı ödeme evrakına eklenmelidir.',
      etiket: 'Fiyat Farkı',
      formTipi: 'tutanak'
    },
    {
      id: 'dt-metin-siparis-iptal',
      kategori: 'Fesih & İptal',
      baslik: 'Taahhüdün İfa Edilmemesi Sebebiyle Sipariş İptali ve Fesih',
      kisaAciklama:
        'Verilen ihtara rağmen ifada bulunmayan yükleniciye doğrudan temin siparişinin iptal bildirimi.',
      varsayilanHitap: 'YÜKLENİCİ SAYIN [FİRMA YETKİLİSİNE]',
      varsayilanKonu: 'Doğrudan Temin Siparişinin İptali ve Fesih Bildirimi',
      tamMetin:
        'İdaremizce tarafınıza verilen doğrudan temin siparişine ait mal ve hizmetlerin süresi içerisinde teslim edilmediği ve gönderilen düzeltme/ihtar yazısına rağmen ifada bulunulmadığı tespit edilmiştir. Söz konusu sipariş tek taraflı olarak feshedilerek iptal edilmiş olup; İdaremizin uğradığı menfi ve müspet zararları talep hakkı saklı tutulmuştur.',
      rehberNotu:
        'Fesih yazısı tebliğ edildikten sonra ihtiyaç başka bir tedarikçiden piyasa araştırmasıyla temin edilir.',
      etiket: 'Fesih',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dt-metin-numune-degerlendirme',
      kategori: 'Kabul & Muayene',
      baslik: 'Numune İnceleme ve Teknik Uygunluk Kararı',
      kisaAciklama:
        'Satın alma öncesi isteklinin sunduğu prototip/numunenin şartnameye uygunluk kontrolü.',
      varsayilanHitap: 'TUTANAKTIR',
      varsayilanKonu: 'Numune Uygunluk İnceleme Tutanağı',
      tamMetin:
        'Doğrudan temin usulüyle alımı planlanan ürünlere ilişkin olarak istekli tarafından sunulan [NUMUNE KALEMLERİ] teknik şartnamedeki fiziksel dayanıklılık, malzeme kalitesi ve ölçü kriterleri yönünden incelenmiş; kurumumuz ihtiyaçlarına ve şartnameye tam uygun olduğu heyetimizce oy birliğiyle tespit edilmiştir.',
      rehberNotu: 'Uygun görülen numuneler kesin kabule kadar mühürlü ambarında muhafaza edilir.',
      etiket: 'Numune',
      formTipi: 'tutanak'
    },
    {
      id: 'dt-metin-komisyon-teskili',
      kategori: 'Komisyon & Yetki',
      baslik: 'Piyasa Araştırması ve Muayene Kabul Görevlendirme Oluru',
      kisaAciklama:
        '4734 m.22 uyarınca alım sürecini yürütecek personellerin resmi yetkilendirilmesi.',
      varsayilanHitap: 'HARCAMA YETKİLİSİNE',
      varsayilanKonu: 'Piyasa Araştırma ve Muayene Komisyonu Teşkili',
      tamMetin:
        'Birimimizce 4734 Sayılı Kanunun 22/d maddesi kapsamında gerçekleştirilecek alıma ilişkin piyasa fiyat araştırmasını yürütmek ve teslim edilecek malzemelerin şartnameye uygunluk kontrollerini yapmak üzere aşağıda ad-soyad ve unvanları yazılı personellerin görevlendirilmesini olurlarınıza arz ederim.',
      rehberNotu:
        'Doğrudan teminde komisyon kurulması kanunen zorunlu olmayıp bir görevli de yetebilir, ancak heyet önerilir.',
      etiket: 'Görevlendirme',
      formTipi: 'onay_belgesi'
    }
  ],

  // =========================================================================
  // 2. 2886 DEVLET İHALE KANUNU (DİK-2886) HAZIR METİN KALIPLARI
  // =========================================================================
  'dik-devlet-ihale-2886': [
    {
      id: 'dik-ihale-talep',
      kategori: 'İhale Onayı',
      baslik: 'Taşınmaz Satış / Kira İhale Açılış Talep Müzekkeresi',
      kisaAciklama: 'Belediye Encümeni veya İta Amirine sunulan ihale açılış gerekçeli üst yazısı.',
      varsayilanHitap: 'BELEDİYE BAŞKANLIĞINA (Encümen Başkanlığı)',
      varsayilanKonu: '2886 Sayılı Kanun Uyarınca İhale Açılışı',
      tamMetin:
        'Mülkiyeti İdaremize ait olan ve tapunun [İLÇE / MAHALLE], [ADA] ada [PARSEL] parsel numarasında kayıtlı taşınmazın; kamu yararı ve gelir getirici amaçla 2886 Sayılı Devlet İhale Kanununun ilgili maddesi (m.35/m.45) gereğince [SATIŞ / KİRALAMA] ihalesine çıkarılması hususunu Encümeninizin tensiplerine arz ederim.',
      rehberNotu: 'Tapu takyidat belgesi ve imar çapı müzekkereye eklenmelidir.',
      etiket: 'İhale Talebi',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dik-kiymet-takdir',
      kategori: 'Kıymet Takdiri',
      baslik: 'Kıymet Takdir Komisyonu Muhammen Bedel Tespit Kararı',
      kisaAciklama:
        'Taşınmazın muhammen bedelinin ve %3 geçici teminatının belirlendiği karar zaptı.',
      varsayilanHitap: 'KIYMET TAKDİR KOMİSYONU KARARIDIR',
      varsayilanKonu: 'Muhammen Bedel Tespit Tutanağı',
      tamMetin:
        '2886 Sayılı Devlet İhale Kanununun 9 ve 13. maddeleri uyarınca teşekkül eden Kıymet Takdir Komisyonumuzca mahallinde yapılan inceleme, emsal rayiçler ve piyasa araştırmaları sonucunda; söz konusu taşınmazın tahmini (muhammen) bedeli KDV hariç [BEDEL] TL, %3 oranındaki geçici teminat miktarı ise [TEMİNAT] TL olarak oy birliğiyle tespit edilmiştir.',
      rehberNotu: 'Komisyon başkanı ve tüm üyelerin ıslak imzası zorunludur.',
      etiket: 'Muhammen Bedel',
      formTipi: 'tutanak'
    },
    {
      id: 'dik-istekli-dilekce',
      kategori: 'İstekli Başvurusu',
      baslik: 'İhale Şartnamesi Alma ve İştirak Başvuru Dilekçesi',
      kisaAciklama: 'İhaleye katılmak isteyen istekli tarafından sunulan resmi katılım dilekçesi.',
      varsayilanHitap: 'İHALE KOMİSYONU BAŞKANLIĞINA',
      varsayilanKonu: 'İhaleye Katılma Başvurusu',
      tamMetin:
        'İdarenizce 2886 Sayılı Kanun kapsamında ihalesi ilan edilen taşınmaza ait idari şartname ve eklerini okudum, aynen kabul ettim. İhaleye iştirak için gereken geçici teminat makbuzu ve istenilen tüm belgeler ekte eksiksiz olarak sunulmuştur. İhaleye kabulümü arz ederim.',
      rehberNotu: 'Geçici teminat makbuzu aslı ve imza sirküleri mutlaka ekte olmalıdır.',
      etiket: 'İştirak',
      formTipi: 'dilekce'
    },
    {
      id: 'dik-teminat-iade',
      kategori: 'Teminat İşlemleri',
      baslik: 'Geçici Teminat İadesi Talep Dilekçesi',
      kisaAciklama:
        'İhaleyi kazanamayan veya çekilen isteklinin yatırdığı teminatı geri alma dilekçesi.',
      varsayilanHitap: 'MALİ HİZMETLER MÜDÜRLÜĞÜNE',
      varsayilanKonu: 'Geçici Teminatın İadesi',
      tamMetin:
        '2886 Sayılı Kanun uyarınca [TARİH] tarihinde yapılan ihaleye katılmak amacıyla yatırmış olduğum [MİKTAR] TL tutarındaki geçici teminatımın; ihale uhdemde kalmadığından dolayı aşağıda belirtmiş olduğum banka IBAN hesabıma iade edilmesini saygılarımla arz ederim.',
      rehberNotu:
        'İade yalnızca geçici teminatı yatıran şahıs veya şirketin kendi hesabına yapılabilir.',
      etiket: 'Teminat İade',
      formTipi: 'dilekce'
    },
    {
      id: 'dik-sozlesme-davet',
      kategori: 'Tebligat & Sözleşme',
      baslik: 'İhale Kararı Tebligatı ve Kesin Teminat / Sözleşmeye Davet Mektubu',
      kisaAciklama:
        'İhaleyi kazanan istekliye noter veya tebligat yoluyla gönderilen resmi davet mektubu.',
      varsayilanHitap: 'SAYIN [YÜKLENİCİ / İSTEKLİ]',
      varsayilanKonu: 'İhale Kararı ve Sözleşmeye Davet (2886 m.31 & m.57)',
      tamMetin:
        'İdaremizce 2886 Sayılı Devlet İhale Kanunu uyarınca gerçekleştirilen ihale, İta Amirinin onayıyla kesinleşmiş olup uhdenizde kalmıştır. Kanunun 57. maddesi gereğince, tebligat tarihinden itibaren 15 (on beş) gün içerisinde ihale bedeli üzerinden hesaplanan kesin teminatı yatırarak noter tasdikli kira/satış sözleşmesini imzalamak üzere İdaremize müracaat etmeniz hususu tebliğ olunur.',
      rehberNotu: '15 günlük yasal süre tebligatın tebellüğ edildiği tarihten itibaren başlar.',
      etiket: 'Davet',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dik-teslim-tutanak',
      kategori: 'Teslim & Kabul',
      baslik: 'Taşınmaz Yer Teslim ve Tahliye Tespit Tutanağı',
      kisaAciklama:
        'Taşınmazın fiziki durumunun taraflarca tespit edilerek anahtarlarının teslim tutanağı.',
      varsayilanHitap: 'TUTANAKTIR',
      varsayilanKonu: 'Taşınmaz Yer Teslim Tutanağı',
      tamMetin:
        'İdaremiz ile kiracı/alıcı arasında imzalanan sözleşme uyarınca, bahse konu taşınmaz mahallinde incelenmiş; elektrik, su sayaç endeksleri okunmuş ve fiziki durumu fotoğraflanarak kullanıma hazır vaziyette kiracıya/alıcıya fiilen teslim edilmiştir. İşbu tutanak 3 nüsha olarak düzenlenip imza altına alınmıştır.',
      rehberNotu: 'Sayaç endeksleri ve demirbaş listesi tutanağa eklenmelidir.',
      etiket: 'Teslimat',
      formTipi: 'tutanak'
    },
    {
      id: 'dik-kira-ihtar',
      kategori: 'İhtar & Hukuk',
      baslik: 'Vadesi Geçmiş Kira Borcu ve Tahliye İhtarnamesi',
      kisaAciklama: 'Kirasını ödemeyen kiracıya yasal 30 günlük fesih ve tahliye ihtarı.',
      varsayilanHitap: 'KİRACI SAYIN [KİRACI ADI / ÜNVANI]',
      varsayilanKonu: 'Kira Borcunun Ödenmesi ve Tahliye İhtarı (TBK m.315)',
      tamMetin:
        'İdaremiz kiracısı bulunduğunuz taşınmaza ait vadesi geçmiş [DÖNEM] aylarına ait toplam [BORÇ] TL kira borcunuz bulunmaktadır. İşbu ihtarnamenin tebliğinden itibaren Türk Borçlar Kanunu gereğince 30 (otuz) gün içinde ödenmesi, aksi halde sözleşmenin feshedilerek taşınmazın tahliyesi ve icra takibi başlatılacağı ihtaren bildirilir.',
      rehberNotu:
        'Sayıştay denetiminde tahakkuk ve tahsilat takibinin zamanında yapıldığı bu ihtarlarla ispatlanır.',
      etiket: 'İhtarname',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dik-encumen-karar-zapti',
      kategori: 'Encümen Kararı',
      baslik: 'Belediye Encümeni 2886 İhale Karar Zaptı Metni',
      kisaAciklama:
        'Açık teklif veya pazarlık usulü ihale sonucunu tescil eden resmi encümen kararı.',
      varsayilanHitap: 'BELEDİYE ENCÜMENİ KARARIDIR',
      varsayilanKonu: '2886 Sayılı Kanun m.45 İhale Kararı',
      tamMetin:
        'Belediyemiz Encümeni huzurunda 2886 Sayılı Devlet İhale Kanununun 45. maddesi uyarınca açık teklif usulüyle yapılan ihalede; iştirakçilerin sunduğu peyler incelenmiş olup en yüksek pey olan KDV hariç [SON TEKLİF] TL bedeli teklif eden [İSTEKLİ/YÜKLENİCİ] üzerine ihalenin bırakılmasına ve İta Amirinin onayına sunulmasına oy birliğiyle karar verildi.',
      rehberNotu:
        'Encümen kararı alındıktan sonra 15 iş günü içinde ita amirince onaylanması şarttır.',
      etiket: 'Encümen Kararı',
      formTipi: 'tutanak'
    },
    {
      id: 'dik-kira-artis-bildirim',
      kategori: 'Kira Yönetimi',
      baslik: 'Yıllık TÜFE / Yİ-ÜFE Kira Artış Bildirim Mektubu',
      kisaAciklama:
        'Kira yenileme döneminde resmi TÜİK oranına göre yeni bedelin kiracıya tebliği.',
      varsayilanHitap: 'KİRACI SAYIN [KİRACI ADI / FİRMA]',
      varsayilanKonu: 'Yeni Dönem Kira Bedeli Artışı Bildirimi',
      tamMetin:
        'İdaremiz ile aranızda akdedilen kira sözleşmesinin ilgili maddesi gereğince; [YIL] yılı kira dönemi için TÜİK tarafından açıklanan on iki aylık ortalamalara göre TÜFE artış oranı (% [ORAN]) uygulanarak aylık kira bedeliniz [YENİ KİRA BEDELİ] TL olarak güncellenmiştir. Kira bedellerinin belirtilen tarihlerde ödenmesi rica olunur.',
      rehberNotu: 'Kira artış oranlarında kanuni üst sınır ve sözleşme hükümleri esas alınır.',
      etiket: 'Kira Artışı',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dik-ecrimisil-ihbarnamesi',
      kategori: 'Ecrimisil & İşgal',
      baslik: 'İşgalli Taşınmaz Ecrimisil İhbarnamesi ve Tahakkuk Fişi',
      kisaAciklama:
        'Kamu taşınmazını haksız işgal eden şagile geriye dönük ecrimisil bedeli bildirimi.',
      varsayilanHitap: 'SAYIN [İŞGALCİ / FUZULİ ŞAGİL]',
      varsayilanKonu: 'Ecrimisil İhbarnamesi (2886 Sayılı Kanun m.75)',
      tamMetin:
        'Mülkiyeti İdaremize ait olan [ADA/PARSEL] numaralı taşınmazı [DÖNEM] tarihleri arasında herhangi bir kira akdine dayanmaksızın fuzuli işgal ettiğiniz tespit edilmiştir. 2886 Sayılı Kanunun 75. maddesi uyarınca takdir edilen [ECRİMİSİL TUTARI] TL ecrimisil bedelinin tebliğden itibaren 30 gün içinde ödenmesi veya rızaen terk edilmesi hususu ihtaren bildirilir.',
      rehberNotu:
        'Ecrimisil geriye dönük en fazla 5 yıl için talep edilebilir; zamanaşımı süresi 5 yıldır.',
      etiket: 'Ecrimisil',
      formTipi: 'ust_yazi'
    },
    {
      id: 'dik-tahliye-zabita-tutanak',
      kategori: 'Tahliye & Güvenlik',
      baslik: '2886 Madde 75 Kolluk ve Zabıta Marifetiyle Tahliye Tutanağı',
      kisaAciklama:
        'Tahliye süresinde boşaltılmayan kamu taşınmazının mülki amir emriyle tahliye zabtı.',
      varsayilanHitap: 'TAHLİYE TUTANAĞIDIR',
      varsayilanKonu: '2886 m.75 Zorla Tahliye ve Kilit Değişimi',
      tamMetin:
        'İdaremiz taşınmazını tahliye etmesi yönünde verilen yasal sürenin dolmasına rağmen boşaltmayan fuzuli şagilin bulunduğu mahallin; Kaymakamlık Makamının oluruyla Zabıta ve Emniyet personeli eşliğinde tahliyesi gerçekleştirilmiş, kapı kilitleri değiştirilerek taşınmaz İdare yetkililerine teslim edilmiştir.',
      rehberNotu:
        'Tahliye sırasında içeride bulunan eşyalar yediemine teslim edilip zapt altına alınmalıdır.',
      etiket: 'Zorla Tahliye',
      formTipi: 'tutanak'
    }
  ],

  // =========================================================================
  // 3. EBYS RESMİ YAZIŞMA STÜDYOSU (EBYS-STD) HAZIR METİN KALIPLARI
  // =========================================================================
  'ebys-resmi-yazisma-studyosu': [
    {
      id: 'ebys-dilekce-izin',
      kategori: 'Personel & Özlük',
      baslik: 'Yıllık İzin / Mazeret İzni Talep Dilekçesi',
      kisaAciklama: 'Personelin mevzuata uygun şekilde izin kullanma talebi.',
      varsayilanHitap: 'MÜDÜRLÜĞÜNE',
      varsayilanKonu: 'Yıllık İzin Talebi',
      tamMetin:
        'Kurumunuz bünyesinde görev yapmaktayım. 657 Sayılı Devlet Memurları Kanununun ilgili maddeleri uyarınca, hakkım olan yıllık iznimden belirtilen tarihler arasında kullanmak istiyorum. İznimi geçireceğim adres ve irtibat numaram aşağıda belirtilmiş olup, gereğini müsaadelerinize arz ederim.',
      rehberNotu: 'İzin formu amir tarafından onaylanmadan görev mahallinden ayrılınmamalıdır.',
      etiket: 'İzin',
      formTipi: 'dilekce'
    },
    {
      id: 'ebys-avans-mahsup',
      kategori: 'Mali İşler',
      baslik: 'İş Avansı Mahsup ve Kapatma Dilekçesi',
      kisaAciklama:
        'Acil harcamalar için açılan iş avansının harcama belgeleriyle kapatılması dilekçesi.',
      varsayilanHitap: 'STRATEJİ GELİŞTİRME DAİRESİ BAŞKANLIĞINA',
      varsayilanKonu: 'İş Avansı Mahsubu ve Kapatılması',
      tamMetin:
        'Birimimizce yürütülen acil alım ve hizmetler kapsamında adıma açılmış bulunan iş avansına ait harcama faturaları ve kanıtlayıcı belgeler ekte eksiksiz olarak sunulmuştur. Avansın kapatılarak mahsup işlemlerinin tamamlanmasını arz ederim.',
      rehberNotu: 'Avanslar alındığı tarihten itibaren 1 ay içinde kapatılmalıdır.',
      etiket: 'Avans',
      formTipi: 'dilekce'
    },
    {
      id: 'ebys-makam-oluru',
      kategori: 'Makam Oluru',
      baslik: 'Birim İçi Harcama & Etkinlik Oluru',
      kisaAciklama: 'Amir onayına sunulan resmi olur taslağı.',
      varsayilanHitap: 'KAYMAKAMLIK MAKAMINA / HARCAMA YETKİLİSİNE',
      varsayilanKonu: 'Harcama ve Organizasyon Oluru',
      tamMetin:
        'Müdürlüğümüz çalışma takvimi kapsamında gerçekleştirilecek faaliyet için gereken mal ve hizmetlerin alımı hususunda; kamu yararı ve hizmet gerekleri doğrultusunda gerekli harcamanın yapılması ve işlemlerin yürütülmesini uygun görüşle arz ederim.',
      rehberNotu: 'Sol alt tarafa "Uygun Görüşle Arz Ederim", sağ alt tarafa "OLUR" bloğu açılır.',
      etiket: 'Makam Oluru',
      formTipi: 'onay_belgesi'
    },
    {
      id: 'ebys-kurumlar-arasi-yazi',
      kategori: 'Dış Yazışma',
      baslik: 'Kurumlar Arası Bilgi ve Görüş İsteme Resmî Yazısı',
      kisaAciklama: 'Başka bir kamu idaresine resmi bilgi, görüş veya belge sorma yazısı.',
      varsayilanHitap: 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ İL MÜDÜRLÜĞÜNE',
      varsayilanKonu: 'Teknik Görüş ve İnceleme Talebi',
      tamMetin:
        'İdaremizce yürütülmekte olan proje ve kamu hizmetleri kapsamında; mevzuat ve uygulamaya esas olmak üzere bahse konu husustaki teknik ve hukuki görüşünüz ile varsa ilgili kayıt ve belgelerin birer suretinin tarafımıza gönderilmesini arz ve rica ederim.',
      rehberNotu:
        'Üst makamlara "Arz ederim", ast veya muadillere "Rica ederim", karma dağıtımda "Arz ve rica ederim" kullanılır.',
      etiket: 'Resmi Yazı',
      formTipi: 'ust_yazi'
    },
    {
      id: 'ebys-vekalet-oluru',
      kategori: 'Makam Oluru',
      baslik: 'İmza Yetkisi Devri ve Göreve Vekalet Oluru',
      kisaAciklama: 'İzin, rapor veya görev sebebiyle ayrılan yöneticinin imza yetkisi devri.',
      varsayilanHitap: 'BAŞKANLIK MAKAMINA / KAYMAKAMLIK MAKAMINA',
      varsayilanKonu: 'Göreve Vekalet ve İmza Yetkisi',
      tamMetin:
        'Daire Başkanlığımız / Müdürlüğümüz uhdesinde görevli Harcama Yetkilisinin kanuni izin/rapor sebebiyle görevde bulunamayacağı [TARİH-1] - [TARİH-2] tarihleri arasında; kamu hizmetlerinin aksamaması adına ilgili görevin [VEKİL PERSONEL] tarafından vekaleten yürütülmesini ve imza yetkisinin devrini olurlarınıza arz ederim.',
      rehberNotu: 'Vekalet oluru olmadan atılan imzalar hukuken yetkisiz imza sayılır.',
      etiket: 'Vekalet',
      formTipi: 'onay_belgesi'
    },
    {
      id: 'ebys-dagitimli-genelge',
      kategori: 'Genelge & Dağıtım',
      baslik: 'Teşkilat İçi Uygulama Genelgesi ve Talimat Yazısı',
      kisaAciklama: 'Tüm harcama birimlerine gönderilen tasarruf ve harcama talimatı.',
      varsayilanHitap: 'DAĞITIM YERLERİNE',
      varsayilanKonu: 'Harcama ve Tasarruf Tedbirleri Uygulama Talimatı',
      tamMetin:
        "Resmî Gazete'de yayımlanarak yürürlüğe giren Tasarruf Tedbirleri Genelgesi gereğince; kurumumuz tüm birimlerince doğrudan temin, kırtasiye, akaryakıt ve temsil ağırlama giderlerinde azami tasarruf ilkelerine riayet edilmesi ve her üç ayda bir harcama icmallerinin Başkanlığımıza bildirilmesi hususunda gereğini önemle rica ederim.",
      rehberNotu:
        'Dağıtımlı yazılarda yazının sonunda DAĞITIM: Gereği ve Bilgi listesi ayrı ayrı belirtilmelidir.',
      etiket: 'Genelge',
      formTipi: 'ust_yazi'
    },
    {
      id: 'ebys-sayistay-savunma',
      kategori: 'Denetim & Hukuk',
      baslik: 'Sayıştay Denetim Sorgusuna Karşı Resmî Savunma ve Cevap',
      kisaAciklama: 'Sayıştay denetçisinin sorgu zaptına kanun maddeleriyle verilen resmi cevap.',
      varsayilanHitap: 'SAYIŞTAY BAŞKANLIĞI DENETÇİLİĞİNE',
      varsayilanKonu: '[YIL] Yılı Denetim Sorgusu No: [SORGU NO] Cevabı',
      tamMetin:
        'Sayıştay Denetçiliğinizce düzenlenen [SORGU NO] numaralı sorgu zaptı incelenmiştir. Bahse konu doğrudan temin alımında kamu zararı oluşmadığı, piyasa fiyat araştırmasında en uygun fiyatın tercih edildiği ve işlemlerin 4734 Sayılı Kanun m.22/d hükümlerine tam uygun gerçekleştirildiği ekli kanıtlayıcı belgelerle teyit edilmiş olup sorgunun kaldırılmasını arz ederim.',
      rehberNotu:
        'Sorgu tebliğinden itibaren 30 gün içinde cevap verilmezse sorgu zimmet zaptına dönüşebilir.',
      etiket: 'Sayıştay',
      formTipi: 'ust_yazi'
    },
    {
      id: 'ebys-cimer-cevap',
      kategori: 'CİMER & Koordinasyon',
      baslik: 'CİMER Başvurusu İnceleme ve Sonuç Bildirme Müzekkeresi',
      kisaAciklama:
        'Vatandaşın Cumhurbaşkanlığı İletişim Merkezine yaptığı başvuruya verilen resmi cevap.',
      varsayilanHitap: 'T.C. İLETİŞİM BAŞKANLIĞI CİMER BİRİMİNE',
      varsayilanKonu: 'CİMER Başvuru No: [CİMER NO] İnceleme Sonucu',
      tamMetin:
        '[BAŞVURU SAHİBİ] tarafından CİMER üzerinden İdaremize yönlendirilen başvuru mahallinde tetkik edilmiştir. İddia ve talep konusu husus ekiplerimizce incelenmiş, mevzuat doğrultusunda gerekli işlem ve denetim tamamlanmış olup başvuru sahibine sistem üzerinden bilgilendirme yapılmıştır.',
      rehberNotu: 'CİMER başvuruları yasal olarak en geç 30 gün içinde sonuçlandırılmalıdır.',
      etiket: 'CİMER',
      formTipi: 'ust_yazi'
    }
  ],

  // =========================================================================
  // 4. PERSONEL İZİN & GÖREV TAKİP (PERS-İZİN) HAZIR METİN KALIPLARI
  // =========================================================================
  'modul-personel-izin': [
    {
      id: 'pers-mazeret-evlilik-dogum',
      kategori: 'Mazeret İzni',
      baslik: '657 DMK Madde 104 Mazeret İzni Talep Dilekçesi',
      kisaAciklama:
        'Memurun evlilik, doğum, babalık veya birinci derece yakın vefatı mazeret izni dilekçesi.',
      varsayilanHitap: 'İNSAN KAYNAKLARI VE EĞİTİM MÜDÜRLÜĞÜNE',
      varsayilanKonu: 'Mazeret İzni Talebi (657 Sayılı Kanun m.104)',
      tamMetin:
        'Müdürlüğünüz bünyesinde görev yapmaktayım. 657 Sayılı Devlet Memurları Kanununun 104. maddesi gereğince, [EVLİLİK / DOĞUM / VEFAT] mazeretim dolayısıyla tarafıma kanunda belirtilen sürede (7 veya 10 gün) mazeret izni verilmesini saygılarımla arz ederim.',
      rehberNotu: 'Evlilik cüzdanı, doğum raporu veya ölüm belgesi dilekçe ekine iliştirilmelidir.',
      etiket: 'Mazeret',
      formTipi: 'dilekce'
    },
    {
      id: 'pers-saglik-rapor-intikal',
      kategori: 'Sağlık & Rapor',
      baslik: 'İstirahat / Sağlık Raporu İntikal ve İzne Çevrilme Müzekkeresi',
      kisaAciklama:
        'Personelin sağlık tesisinden aldığı istirahat raporunun resmi izne dönüştürülmesi.',
      varsayilanHitap: 'HARCAMA YETKİLİĞİ MAKAMINA',
      varsayilanKonu: 'Sağlık Raporunun İzne Çevrilmesi',
      tamMetin:
        "Birimimiz personeli [AD SOYAD]'ın [SAĞLIK KURULUŞU] tarafından tanzim edilen ve [GÜN] gün istirahatini uygun gören sağlık raporu ekte sunulmuştur. Devlet Memurlarına Verilecek Hastalık Raporları Yönetmeliği uyarınca söz konusu raporun hastalık iznine dönüştürülmesini olurlarınıza arz ederim.",
      rehberNotu:
        'Tek hekim raporu en fazla 10 gün verilebilir; kontrol muayenesiyle toplam 20 günü geçemez.',
      etiket: 'Sağlık Raporu',
      formTipi: 'ust_yazi'
    },
    {
      id: 'pers-gorev-devir-tutanak',
      kategori: 'Görev Devri',
      baslik: 'Yıllık İzin Öncesi İş ve Dosya Teslim-Tesellüm Tutanağı',
      kisaAciklama:
        'İzne çıkan personelin devam eden işlerini vekalet eden personele devir tutanağı.',
      varsayilanHitap: 'TUTANAKTIR',
      varsayilanKonu: 'İş ve Dosya Devir-Teslim Tutanağı',
      tamMetin:
        "Müdürlüğümüzde yürütülmekte olan doğrudan temin ve satın alma dosyaları ile evrak kayıt defteri; kanuni izne ayrılan [DEVREDEN PERSONEL] tarafından, izin süresince takip edilmek üzere [TESLİM ALAN VEKİL PERSONEL]'e noksansız ve tüm ekleriyle birlikte teslim edilmiş ve işbu tutanak mahallinde imza altına alınmıştır.",
      rehberNotu:
        'Sayıştay denetiminde acil sürelerin kaçırılmaması ve sorumluluk tespiti için hayati önem taşır.',
      etiket: 'Teslim Tutanağı',
      formTipi: 'tutanak'
    },
    {
      id: 'pers-fazla-mesai-idari-izin',
      kategori: 'Fazla Çalışma',
      baslik: 'Fazla Çalışma / Nöbet Karşılığı İdari İzin Talep Dilekçesi',
      kisaAciklama: 'Hafta sonu veya bayram mesaisi karşılığında idari izin kullanma dilekçesi.',
      varsayilanHitap: 'BİRİM MÜDÜRLÜĞÜNE',
      varsayilanKonu: 'Fazla Mesai Karşılığı İzin Talebi',
      tamMetin:
        'Kurumumuz bünyesinde [TARİHLERDE] acil hizmet ve projelerin tamamlanması maksadıyla mesai saatleri haricinde ifa etmiş olduğum [SAAT] saatlik fazla çalışmama istinaden; mevzuat gereğince tarafıma idari izin verilmesi hususunu müsaadelerinize arz ederim.',
      rehberNotu: 'Fazla mesai çizelgesi veya nöbet defteri fotokopisi dilekçeye eklenmelidir.',
      etiket: 'Mesai İzni',
      formTipi: 'dilekce'
    },
    {
      id: 'pers-gecici-gorev-yolluk',
      kategori: 'Görevlendirme',
      baslik: 'Geçici Görevlendirme ve Harcırah / Avans Talep Oluru',
      kisaAciklama: 'Birim dışı veya şehir dışı göreve giden personelin resmi yolluk onayı.',
      varsayilanHitap: 'HARCAMA YETKİLİSİNE',
      varsayilanKonu: 'Geçici Görevlendirme ve Yolluk Onayı (6245 Sayılı Kanun)',
      tamMetin:
        "Birimimiz personeli [AD SOYAD / UNVAN]'ın [GÖREV YERİ] mahallinde gerçekleştirilecek inceleme, eğitim veya koordinasyon toplantısına katılmak üzere [TARİHLER] arasında geçici olarak görevlendirilmesini; 6245 Sayılı Harcırah Kanunu gereğince yolluk ve yevmiyesinin ilgili bütçe tertibinden ödenmesini uygun görüşle arz ederim.",
      rehberNotu: 'Ulaşım aracı (otobüs, uçak, resmi araç) onay belgesinde açıkça belirtilmelidir.',
      etiket: 'Görevlendirme',
      formTipi: 'onay_belgesi'
    },
    {
      id: 'pers-isci-ucretsiz-izin',
      kategori: 'İşçi İzinleri',
      baslik: '4857 Sayılı İş Kanunu Sürekli İşçi Ücretsiz Mazeret İzni Dilekçesi',
      kisaAciklama: 'Sürekli işçi ve sözleşmeli personelin yasal ücretsiz izin talebi.',
      varsayilanHitap: 'İNSAN KAYNAKLARI MÜDÜRLÜĞÜNE',
      varsayilanKonu: 'Ücretsiz Mazeret İzni Talebi (4857 Sayılı Kanun)',
      tamMetin:
        'Kurumunuzda 4857 Sayılı İş Kanunu kapsamında sürekli işçi kadrosunda görev yapmaktayım. Ailevi ve şahsi mazeretim sebebiyle [TARİH-1] ile [TARİH-2] tarihleri arasında tarafıma [GÜN] gün ücretsiz izin verilmesini saygılarımla arz ederim.',
      rehberNotu:
        'İşverenin onayı olmadan ücretsiz izne çıkılamaz; SGK prim bildirgeleri buna göre düzenlenir.',
      etiket: 'İşçi İzni',
      formTipi: 'dilekce'
    },
    {
      id: 'pers-sut-izni-dilekcesi',
      kategori: 'Analık & Çocuk',
      baslik: '657 m.104/D Analık ve Günlük Süt İzni Talep Dilekçesi',
      kisaAciklama: 'Doğum sonrası memur annenin günlük süt izni saatlerini bildirme dilekçesi.',
      varsayilanHitap: 'BİRİM AMİRLİĞİNE',
      varsayilanKonu: 'Günlük Süt İzni Kullanım Saatleri Talebi',
      tamMetin:
        'Doğum iznim [TARİH] itibarıyla sona ermiş olup fiilen görevime başlamış bulunmaktayım. 657 Sayılı Kanunun 104/D maddesi uyarınca çocuğumun bir yaşını dolduracağı tarihe kadar; mesai saatleri içerisinde günlük [1.5 veya 3] saatlik süt iznimi [SAATLER] arasında kullanmak istediğimi müsaadelerinize arz ederim.',
      rehberNotu: 'Süt izninin hangi saatler arasında kullanılacağını memur anne kendisi belirler.',
      etiket: 'Süt İzni',
      formTipi: 'dilekce'
    },
    {
      id: 'pers-ayliksiz-izin-oluru',
      kategori: 'Aylıksız İzin',
      baslik: '657 m.108 5 Yıllık Hizmet Karşılığı Aylıksız İzin Oluru',
      kisaAciklama: '5 hizmet yılını dolduran memurun 1 yıla kadar ücretsiz izin makam oluru.',
      varsayilanHitap: 'ATAMAYA YETKİLİ AMİR MAKAMINA',
      varsayilanKonu: 'Aylıksız İzin Oluru (657 Sayılı Kanun m.108/E)',
      tamMetin:
        "Müdürlüğümüz personeli [AD SOYAD]'ın 657 Sayılı Devlet Memurları Kanununun 108/E maddesinde belirtilen 5 hizmet yılını tamamladığı anlaşılmıştır. İlgilinin gerekçeli talebi doğrultusunda [TARİH-1] - [TARİH-2] tarihleri arasında 1 (bir) yıl süreyle aylıksız izinli sayılmasını olurlarınıza arz ederim.",
      rehberNotu:
        'Memuriyet boyunca en fazla iki defada kullanılmak üzere toplam bir yıla kadar verilebilir.',
      etiket: 'Aylıksız İzin',
      formTipi: 'onay_belgesi'
    },
    {
      id: 'pers-goreve-baslama-yazisi',
      kategori: 'Özlük & Başlama',
      baslik: 'İzin / Rapor / Askerlik Sonrası Göreve Başlama Bildirimi',
      kisaAciklama:
        'İzin süresi biten personelin fiilen göreve başladığına dair Personel Müdürlüğüne bildirim.',
      varsayilanHitap: 'İNSAN KAYNAKLARI VE EĞİTİM MÜDÜRLÜĞÜNE',
      varsayilanKonu: 'Göreve Başlama Bildirimi',
      tamMetin:
        'Müdürlüğümüz personeli [AD SOYAD / UNVAN], kullanmış olduğu kanuni [YILLIK İZİN / SAĞLIK RAPORU / ASKERLİK] süresinin bitimini müteakip [TARİH] tarihi mesai başlangıcı itibarıyla birimimizdeki fiili görevine başlamıştır. Bilgilerinize arz ederim.',
      rehberNotu:
        'Maaş ve SGK kesintilerinin doğru tahakkuk edebilmesi için başlama tarihi gecikmeksizin intikal etmelidir.',
      etiket: 'Göreve Başlama',
      formTipi: 'ust_yazi'
    },
    {
      id: 'pers-disiplin-savunma-isteme',
      kategori: 'Disiplin & Soruşturma',
      baslik: '657 m.129 Disiplin Soruşturması Savunma İsteme Mektubu',
      kisaAciklama:
        'Soruşturma açılan personele en az 7 gün süre tanınarak savunma isteme bildirimi.',
      varsayilanHitap: 'MEMUR SAYIN [PERSONEL ADI SOYADI]',
      varsayilanKonu: 'Disiplin Savunması İstemi (657 Sayılı Kanun m.129 & m.130)',
      tamMetin:
        'Hakkınızda yürütülen disiplin soruşturması kapsamında; [OLAY TARİHİ] tarihinde vuku bulan [İSNAT EDİLEN FİİL] sebebiyle 657 Sayılı Devlet Memurları Kanununun 130. maddesi uyarınca işbu yazının tebliğinden itibaren 7 (yedi) gün içinde yazılı savunmanızı vermeniz, aksi halde savunma hakkınızdan vazgeçmiş sayılacağınız hususu tebliğ olunur.',
      rehberNotu:
        '7 günden az savunma süresi verilmesi halinde verilen tüm disiplin cezaları İdare Mahkemesince iptal edilir.',
      etiket: 'Disiplin',
      formTipi: 'ust_yazi'
    }
  ]
}
