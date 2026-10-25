// js/aktar-excel.js - Genel Excel / CSV içe aktarma modülü
// SheetJS (XLSX) kütüphanesini kullanır. Arayüzden bağımsızdır.

var AktarExcel = (function() {
  // Hedef alan tanımları ve Türkçe arama anahtarları
  var ALAN_TANIMLARI = {
    malzeme: [
      { key: 'kod', etiket: 'Malzeme/Stok Kodu', ornekler: ['kod', 'malzeme kodu', 'stok kodu', 'barkod'] },
      { key: 'ad', etiket: 'Malzeme Adı / Cinsi', ornekler: ['ad', 'malzeme adi', 'cinsi', 'adi', 'malzeme'] },
      { key: 'aciklama', etiket: 'Açıklama / Özellik', ornekler: ['aciklama', 'ozellik', 'tanim', 'detay'] },
      { key: 'birim', etiket: 'Ölçü Birimi', ornekler: ['birim', 'olcu', 'olcu birimi'] },
      { key: 'kdvOrani', etiket: 'KDV Oranı (%)', ornekler: ['kdv', 'kdv orani', 'kdv %', 'vergi'] },
      { key: 'miktar', etiket: 'Miktar', ornekler: ['miktar', 'adet', 'sayi'] },
      { key: 'birimFiyat', etiket: 'Birim Fiyat', ornekler: ['birim fiyat', 'fiyat', 'tutar', 'yaklasik maliyet'] },
      { key: 'kazananFirma', etiket: 'Kazanan Firma', ornekler: ['kazanan', 'kazanan firma', 'yuklenici', 'firma'] },
      { key: 'tasinirKodu', etiket: 'Taşınır Kodu', ornekler: ['tasinir', 'tasinir kodu', 'tk'] },
      { key: 'okas', etiket: 'OKAS / CPV Kodu', ornekler: ['okas', 'cpv', 'okas kodu'] }
    ],
    firma: [
      { key: 'no', etiket: 'Firma / Cari No', ornekler: ['no', 'firma no', 'cari no', 'kod', 'vergi no'] },
      { key: 'unvan', etiket: 'Firma Unvanı', ornekler: ['unvan', 'firma unvani', 'ad', 'sirket adi'] },
      { key: 'ilet', etiket: 'İletişim (Tel/E-posta)', ornekler: ['ilet', 'iletisim', 'telefon', 'tel', 'e-posta', 'email'] },
      { key: 'yer', etiket: 'Adres / Semt / Şehir', ornekler: ['yer', 'adres', 'sehir', 'ilce', 'semt'] }
    ],
    katalog: [
      { key: 'kod', etiket: 'Ürün Kodu', ornekler: ['kod', 'urun kodu', 'barkod', 'stok kodu'] },
      { key: 'ad', etiket: 'Ürün Adı', ornekler: ['ad', 'urun adi', 'tanim'] },
      { key: 'tasinir', etiket: 'Taşınır Kodu / Türü', ornekler: ['tasinir', 'tasinir kodu'] },
      { key: 'okas', etiket: 'OKAS Kodu', ornekler: ['okas', 'cpv'] }
    ]
  };

  function trKarakterTemizle(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  }

  // Başlık metninden hedef alanı otomatik tahmin et
  function otomatikEslesme(excelBasliklari, hedefTipi) {
    var hedefler = ALAN_TANIMLARI[hedefTipi] || [];
    var eslesme = {}; // { excelBaslik: hedefKey }

    excelBasliklari.forEach(function(b) {
      var temizB = trKarakterTemizle(b);
      for (var i = 0; i < hedefler.length; i++) {
        var h = hedefler[i];
        for (var j = 0; j < h.ornekler.length; j++) {
          if (temizB === trKarakterTemizle(h.ornekler[j])) {
            eslesme[b] = h.key;
            return;
          }
        }
      }
      eslesme[b] = ''; // Eşleşmeyen
    });

    return eslesme;
  }

  // Değer dönüştürme kuralları: sayı ("12,5" -> "12.5"), tarih (gg.aa.yyyy -> YYYY-MM-DD), boşluklar
  function degerDonustur(val, alanTipi) {
    if (val === null || val === undefined) return '';
    var s = String(val).trim();
    if (!s) return '';

    // Tarih dönüştürme (gg.aa.yyyy veya gg/aa/yyyy -> YYYY-MM-DD)
    var mDate = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (mDate) {
      var gun = ('0' + mDate[1]).slice(-2);
      var ay = ('0' + mDate[2]).slice(-2);
      var yil = mDate[3];
      return yil + '-' + ay + '-' + gun;
    }

    // Excel seri tarih kontrolü (eğer sayı gelmişse ve tarih bekleniyorsa)
    if (alanTipi === 'tarih' && typeof val === 'number') {
      try {
        var d = XLSX.SSF.parse_date_code(val);
        if (d) {
          return d.y + '-' + ('0' + d.m).slice(-2) + '-' + ('0' + d.d).slice(-2);
        }
      } catch (e) {}
    }

    // Ondalık sayı dönüştürme: "12,5" -> "12.5"
    if (s.match(/^-?\d+,\d+$/)) {
      s = s.replace(',', '.');
    }

    return s;
  }

  // Çalışma kitabını (Workbook) oku, sayfaları ve verileri getir
  function calismaKitabiOku(arrayBuffer) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS (XLSX) kütüphanesi yüklenemedi! vendor/xlsx.full.min.js dosyasını kontrol edin.');
    }
    var wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    return {
      sayfaAdlari: wb.SheetNames,
      wb: wb
    };
  }

  // Belirli sayfayı satırlar listesi (2D array) olarak çıkar
  function sayfaSatirlari(wb, sayfaAdi) {
    var ws = wb.Sheets[sayfaAdi];
    if (!ws) return [];
    var satirlar = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
    return satirlar;
  }

  // Önizleme ve Dry-run işlemi
  // satirlar: 2D array, baslikSatirIndeksi: 0 tabanlı, eslesme: { excelColIndex: hedefKey }
  function onizlemeYap(satirlar, baslikSatirIndeksi, eslesme, hedefTipi) {
    if (!satirlar || satirlar.length <= baslikSatirIndeksi) {
      return { hata: 'Seçilen başlık satırı veride bulunamadı.' };
    }

    var basliklar = satirlar[baslikSatirIndeksi] || [];
    var veriSatirlari = satirlar.slice(baslikSatirIndeksi + 1);
    var uyarilar = [];
    var islenenler = [];

    veriSatirlari.forEach(function(row, rIdx) {
      // Tamamen boş satırları atla
      var dolu = false;
      for (var c = 0; c < row.length; c++) {
        if (String(row[c]).trim()) { dolu = true; break; }
      }
      if (!dolu) return;

      var obj = {};
      Object.keys(eslesme).forEach(function(colIdx) {
        var hedefKey = eslesme[colIdx];
        if (!hedefKey) return;
        var hamDeger = row[colIdx];
        var donusen = degerDonustur(hamDeger, hedefKey.toLowerCase().indexOf('tarih') >= 0 ? 'tarih' : 'metin');
        obj[hedefKey] = donusen;
      });

      // Basit kontrol
      if (hedefTipi === 'malzeme' && !obj.ad && !obj.kod) {
        uyarilar.push('Satır ' + (rIdx + baslikSatirIndeksi + 2) + ': Malzeme adı veya kodu boş.');
      }
      if (hedefTipi === 'firma' && !obj.unvan) {
        uyarilar.push('Satır ' + (rIdx + baslikSatirIndeksi + 2) + ': Firma unvanı boş.');
      }

      islenenler.push({
        satirNo: rIdx + baslikSatirIndeksi + 2,
        veri: obj,
        ham: row
      });
    });

    return {
      toplamSatir: islenenler.length,
      onizleme: islenenler.slice(0, 200), // İlk 200 satır
      uyarilar: uyarilar,
      hedefTipi: hedefTipi
    };
  }

  return {
    alanTanimlari: ALAN_TANIMLARI,
    calismaKitabiOku: calismaKitabiOku,
    sayfaSatirlari: sayfaSatirlari,
    otomatikEslesme: otomatikEslesme,
    degerDonustur: degerDonustur,
    onizlemeYap: onizlemeYap
  };
})();
