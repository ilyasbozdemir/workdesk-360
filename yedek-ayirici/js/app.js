// js/app.js - Yedek Ayırıcı Ana Arayüz Denetleyicisi
// DOM etkileşimleri, Statik API ve Excel içe aktarım entegrasyonu

var $ = function(i) { return document.getElementById(i); };
var S = null; // Aktif sonuç { manifest, genel, liste, dosyalar, rapor }
var AKTIF_DT_YEDEK = null; // Çalışılan ham/birleştirilmiş DT yedeği

// Excel çalışma durumu
var EXCEL_DURUM = {
  wb: null,
  satirlar: [],
  seciliSayfa: '',
  baslikSatiri: 0,
  eslesme: {}, // { colIndex: hedefKey }
  onizlemeSonuc: null
};

function js(o) { return JSON.stringify(o, null, 2); }

function tablo(host, basl, satirlar, onClick) {
  host.textContent = '';
  if (!satirlar.length) {
    var p = document.createElement('div');
    p.className = 'mut';
    p.textContent = 'Kayıt yok.';
    host.appendChild(p);
    return;
  }
  var t = document.createElement('table'),
      h = document.createElement('thead'),
      r = document.createElement('tr');
  basl.forEach(function(b) {
    var th = document.createElement('th');
    th.textContent = b;
    r.appendChild(th);
  });
  h.appendChild(r);
  t.appendChild(h);

  var tb = document.createElement('tbody');
  satirlar.forEach(function(s, i) {
    var tr = document.createElement('tr');
    s.forEach(function(c) {
      var td = document.createElement('td');
      td.textContent = c === undefined || c === null ? '' : c;
      tr.appendChild(td);
    });
    if (onClick) {
      tr.className = 't';
      tr.tabIndex = 0;
      tr.onclick = function() { onClick(i, tr); };
      tr.onkeydown = function(e) { if (e.key === 'Enter') onClick(i, tr); };
    }
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  host.appendChild(t);
}

function chip(t, hostId) {
  var s = document.createElement('span');
  s.className = 'chip';
  s.textContent = t;
  $(hostId || 'chips').appendChild(s);
}

function indirmeTetikle(icerik, dosyaAdi, tip) {
  var blob = new Blob([icerik], { type: tip || 'application/json;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dosyaAdi;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ----------------------------------------------------
// 1. Yedek Ayırma & Gösterme
// ----------------------------------------------------
function calistir() {
  $('err').textContent = '';
  var b;
  try {
    b = JSON.parse($('src').value);
  } catch (e) {
    $('err').textContent = 'JSON okunamadı: ' + e.message;
    return;
  }
  if (!b || typeof b !== 'object' || !Array.isArray(b.files)) {
    $('err').textContent = 'Bu bir DT yedeğine benzemiyor: "files" listesi yok.';
    return;
  }
  AKTIF_DT_YEDEK = b;
  S = ayir(b);
  sonucGuncelle();
  hedefDosyaSecenekleriniDoldur();
}

function sonucGuncelle() {
  if (!S) return;
  var y = dosyaYollari(S);
  $('sonuc').className = '';
  $('chips').textContent = '';
  chip(S.dosyalar.length + ' dosya');
  chip(S.genel.firmalar.length + ' firma');
  chip(S.genel.katalog.length + ' katalog kalemi');
  chip(S.manifest.saglik.hata + ' hata');
  chip(S.manifest.saglik.uyari + ' uyarı');

  $('agac').textContent = Object.keys(y).join('\n');
  var r = $('rapor');
  r.textContent = '';
  if (!S.rapor.length) {
    r.textContent = 'Sorun bulunmadı.';
  }
  S.rapor.forEach(function(x) {
    var d = document.createElement('div');
    d.className = x.seviye;
    d.textContent = x.seviye + ': ' + x.mesaj;
    r.appendChild(d);
  });

  tablo($('liste'), ['Dosya No', 'DT No', 'İşin adı', 'Yıl', 'Aşama', 'Malzeme', 'Teklif', 'Kabul'],
    S.liste.map(function(l) {
      return [l.dosyaNo, l.dtNo, l.isinAdi, l.butceYili, l.asama, l.malzeme, l.teklif, l.kabul];
    }),
    function(i, tr) {
      [].forEach.call($('liste').querySelectorAll('tr.sel'), function(x) { x.classList.remove('sel'); });
      tr.classList.add('sel');
      goster(S.dosyalar[i]);
    }
  );

  $('detay').className = 'hide';
  $('zipn').textContent = Object.keys(y).length + ' dosya içerir';
}

function goster(d) {
  $('detay').className = '';
  $('dbas').textContent = 'Dosya bilgileri: ' + (d.f['Dosya No'] || d.id);
  tablo($('dbil'), ['Alan', 'Değer'], Object.keys(d.f).map(function(k) { return [k, d.f[k]]; }));
  tablo($('dmat'), ['Kod', 'Ad', 'Açıklama', 'Birim', 'KDV', 'Miktar', 'Birim fiyat', 'Kazanan'],
    d.malzemeler.map(function(m) {
      return [m.kod, m.ad, m.aciklama, m.birim, m.kdvOrani, m.miktar, m.birimFiyat, m.kazananFirma];
    })
  );
  var bas = ['Firma', 'Durum', 'Teklif tarihi', 'Tutar'].concat(d.malzemeler.map(function(m) { return m.ad || m.kod; }));
  tablo($('dtek'), bas,
    d.teklifler.map(function(t) {
      return [t.firma, t.durum, t.teklifTarihi, t.tutar].concat(d.malzemeler.map(function(_, i) { return (t.kalemler || [])[i]; }));
    })
  );
  var kr = [];
  d.kabuller.forEach(function(k) {
    k.kalemler.forEach(function(m) {
      kr.push([k.baslik['Kabul Tarihi'], k.baslik['Firma'], m.ad, m.birim, m.miktar, m.kabulMiktar]);
    });
  });
  tablo($('dkab'), ['Tarih', 'Firma', 'Kalem', 'Birim', 'Miktar', 'Kabul miktarı'], kr);
  tablo($('dkom'), ['Komisyon', 'Rol', 'Ad soyad'],
    d.yaklasikMaliyetKomisyonu.map(function(k) { return ['Yaklaşık maliyet', k.rol, k.adSoyad]; })
      .concat(d.muayeneKomisyonu.map(function(k) { return ['Muayene ve kabul', k.rol, k.adSoyad]; }))
  );
}

// ----------------------------------------------------
// Tab Geçişleri
// ----------------------------------------------------
$('tabApiBtn').onclick = function() {
  $('tabApiBtn').classList.add('active');
  $('tabExcelBtn').classList.remove('active');
  $('tabApiPane').classList.remove('hide');
  $('tabExcelPane').classList.add('hide');
};

$('tabExcelBtn').onclick = function() {
  $('tabExcelBtn').classList.add('active');
  $('tabApiBtn').classList.remove('active');
  $('tabExcelPane').classList.remove('hide');
  $('tabApiPane').classList.add('hide');
};

// ----------------------------------------------------
// A) Statik API İşlemleri (data.zip / klasör)
// ----------------------------------------------------
var YUKLENEN_API_VERISI = null;

async function apiZipIsle(file) {
  $('apiErr').textContent = '';
  try {
    var zip = await JSZip.loadAsync(file);
    var sonuc = await AktarAPI.oku(zip);
    apiSonucGoster(sonuc);
  } catch (err) {
    $('apiErr').textContent = 'Statik API okuma hatası: ' + err.message;
  }
}

async function apiKlasorIsle(fileList) {
  $('apiErr').textContent = '';
  try {
    var harita = {};
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      var relPath = f.webkitRelativePath || f.name;
      // Metin olarak oku
      harita[relPath] = await new Promise(function(resolve, reject) {
        var r = new FileReader();
        r.onload = function() { resolve(r.result); };
        r.onerror = reject;
        r.readAsText(f);
      });
    }
    var sonuc = await AktarAPI.oku(harita);
    apiSonucGoster(sonuc);
  } catch (err) {
    $('apiErr').textContent = 'Klasör okuma hatası: ' + err.message;
  }
}

function apiSonucGoster(sonuc) {
  YUKLENEN_API_VERISI = sonuc;
  $('apiSonucArea').classList.remove('hide');
  $('apiChips').textContent = '';
  chip(sonuc.dosyaSayisi + ' dosya çözümlendi', 'apiChips');
  chip(sonuc.genel.firmalar.length + ' firma', 'apiChips');
  chip(sonuc.genel.katalog.length + ' katalog', 'apiChips');
  chip('schemaVersion: ' + sonuc.manifest.schemaVersion, 'apiChips');

  var r = $('apiRapor');
  r.textContent = '';
  if (!sonuc.saglik.length) {
    r.className = 'bilgi';
    r.textContent = 'Doğrulama başarılı: Sağlık raporunda hata bulunmadı.';
  } else {
    sonuc.saglik.forEach(function(x) {
      var d = document.createElement('div');
      d.className = x.seviye;
      d.textContent = x.seviye + ': ' + x.mesaj;
      r.appendChild(d);
    });
  }
}

$('apiZipFil').onchange = function(e) {
  var f = e.target.files[0];
  if (f) apiZipIsle(f);
};

$('apiDirFil').onchange = function(e) {
  var files = e.target.files;
  if (files && files.length) apiKlasorIsle(files);
};

$('apiYukleBtn').onclick = function() {
  if (!YUKLENEN_API_VERISI) return;
  AKTIF_DT_YEDEK = YUKLENEN_API_VERISI.dtYedek;
  $('src').value = js(AKTIF_DT_YEDEK);
  calistir();
  window.scrollTo({ top: $('sonuc').offsetTop - 20, behavior: 'smooth' });
};

$('apiDtYedekIndirBtn').onclick = function() {
  if (!YUKLENEN_API_VERISI) return;
  indirmeTetikle(js(YUKLENEN_API_VERISI.dtYedek), 'denormalize-dt-yedek.json');
};

$('apiTestRoundTripBtn').onclick = function() {
  $('apiErr').textContent = '';
  var kaynak;
  try {
    kaynak = JSON.parse($('src').value);
  } catch (e) {
    kaynak = ORNEK;
  }
  var ayrilmis = ayir(kaynak);
  var denorm = denormYedek(ayrilmis.manifest, ayrilmis.genel, ayrilmis.dosyalar);
  var str1 = JSON.stringify(kaynak);
  var str2 = JSON.stringify(denorm);
  var basarili = (str1 === str2);

  var r = $('apiRapor');
  $('apiSonucArea').classList.remove('hide');
  r.textContent = '';
  var d = document.createElement('div');
  if (basarili) {
    d.className = 'bilgi';
    d.textContent = 'Round-Trip Testi Başarılı: DT Yedeği → Statik API → DT Yedeği tam birebir eşleşti (' + str1.length + ' bayt).';
  } else {
    d.className = 'hata';
    d.textContent = 'Round-Trip Testi Başarısız: Karakter boyutları farklı (Kaynak: ' + str1.length + ', Denorm: ' + str2.length + ')';
  }
  r.appendChild(d);
};

// ----------------------------------------------------
// B) Excel / CSV İşlemleri
// ----------------------------------------------------
function hedefDosyaSecenekleriniDoldur() {
  var sel = $('excelHedefDosya');
  sel.textContent = '';
  var optYeni = document.createElement('option');
  optYeni.value = '__yeni__';
  optYeni.textContent = '+ Yeni Dosya Olarak Ekle';
  sel.appendChild(optYeni);

  if (AKTIF_DT_YEDEK && AKTIF_DT_YEDEK.files) {
    AKTIF_DT_YEDEK.files.forEach(function(d, i) {
      var opt = document.createElement('option');
      opt.value = d.id;
      var f = d.f || {};
      opt.textContent = (f['Dosya No'] ? f['Dosya No'] + ' - ' : '') + (f['İşin Adı / Tanımı'] || d.id);
      sel.appendChild(opt);
    });
  }
}

$('excelFil').onchange = function(e) {
  var f = e.target.files[0];
  if (!f) return;
  $('excelErr').textContent = '';
  $('excelDosyaAdi').textContent = f.name;

  var r = new FileReader();
  r.onload = function(evt) {
    try {
      var arrBuf = evt.target.result;
      var res = AktarExcel.calismaKitabiOku(arrBuf);
      EXCEL_DURUM.wb = res.wb;

      var sel = $('excelSayfaSecim');
      sel.textContent = '';
      res.sayfaAdlari.forEach(function(name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });

      EXCEL_DURUM.seciliSayfa = res.sayfaAdlari[0] || '';
      $('excelAyarArea').classList.remove('hide');
      $('excelOnizlemeArea').classList.add('hide');

      excelSayfaVerisiniGuncelle();
    } catch (err) {
      $('excelErr').textContent = 'Excel dosyası okunamadı: ' + err.message;
    }
  };
  r.readAsArrayBuffer(f);
};

$('excelSayfaSecim').onchange = function() {
  EXCEL_DURUM.seciliSayfa = $('excelSayfaSecim').value;
  excelSayfaVerisiniGuncelle();
};

$('excelBaslikSatir').onchange = function() {
  EXCEL_DURUM.baslikSatiri = parseInt($('excelBaslikSatir').value, 10) || 0;
  excelSayfaVerisiniGuncelle();
};

$('excelHedefTipi').onchange = function() {
  var tip = $('excelHedefTipi').value;
  if (tip === 'malzeme') {
    $('excelHedefDosya').parentElement.classList.remove('hide');
  } else {
    $('excelHedefDosya').parentElement.classList.add('hide');
  }
  excelSayfaVerisiniGuncelle();
};

function excelSayfaVerisiniGuncelle() {
  if (!EXCEL_DURUM.wb || !EXCEL_DURUM.seciliSayfa) return;
  var satirlar = AktarExcel.sayfaSatirlari(EXCEL_DURUM.wb, EXCEL_DURUM.seciliSayfa);
  EXCEL_DURUM.satirlar = satirlar;

  var baslikSatirIndeksi = parseInt($('excelBaslikSatir').value, 10) || 0;
  var basliklar = satirlar[baslikSatirIndeksi] || [];
  if (!basliklar.length) {
    $('excelErr').textContent = (baslikSatirIndeksi + 1) + '. satırda başlık bulunamadı!';
    $('excelEslesmeTabloHost').textContent = '';
    return;
  }
  $('excelErr').textContent = '';

  var hedefTipi = $('excelHedefTipi').value;
  var otomatik = AktarExcel.otomatikEslesme(basliklar, hedefTipi);

  // Eşleştirme tablosunu çiz
  var host = $('excelEslesmeTabloHost');
  host.textContent = '';
  var t = document.createElement('table'),
      h = document.createElement('thead'),
      trH = document.createElement('tr');
  ['Excel Sütun Başlığı', 'Örnek Veri (Satır 1)', 'Eşleşecek Hedef Alan'].forEach(function(b) {
    var th = document.createElement('th'); th.textContent = b; trH.appendChild(th);
  });
  h.appendChild(trH); t.appendChild(h);

  var tb = document.createElement('tbody');
  var ornekSatir = satirlar[baslikSatirIndeksi + 1] || [];
  var alanListesi = AktarExcel.alanTanimlari[hedefTipi] || [];

  EXCEL_DURUM.eslesme = {};

  basliklar.forEach(function(b, colIdx) {
    var tr = document.createElement('tr');
    var tdB = document.createElement('td'); tdB.textContent = b || ('(Sütun ' + (colIdx + 1) + ')'); tr.appendChild(tdB);
    var tdO = document.createElement('td'); tdO.className = 'mut'; tdO.textContent = ornekSatir[colIdx] !== undefined ? ornekSatir[colIdx] : ''; tr.appendChild(tdO);

    var tdS = document.createElement('td');
    var sel = document.createElement('select');
    var optBos = document.createElement('option');
    optBos.value = '';
    optBos.textContent = '-- Atla (Eşleştirme) --';
    sel.appendChild(optBos);

    alanListesi.forEach(function(a) {
      var opt = document.createElement('option');
      opt.value = a.key;
      opt.textContent = a.etiket + ' (' + a.key + ')';
      sel.appendChild(opt);
    });

    var onerilenKey = otomatik[b] || '';
    sel.value = onerilenKey;
    EXCEL_DURUM.eslesme[colIdx] = onerilenKey;

    sel.onchange = function() {
      EXCEL_DURUM.eslesme[colIdx] = sel.value;
    };

    tdS.appendChild(sel);
    tr.appendChild(tdS);
    tb.appendChild(tr);
  });

  t.appendChild(tb);
  host.appendChild(t);
}

// Eşleştirme JSON İndir / Yükle
$('excelEslesmeIndirBtn').onclick = function() {
  indirmeTetikle(js(EXCEL_DURUM.eslesme), 'eslestirme-ayari.json');
};

$('excelEslesmeYukleFil').onchange = function(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(evt) {
    try {
      var map = JSON.parse(evt.target.result);
      if (typeof map === 'object') {
        EXCEL_DURUM.eslesme = map;
        var selects = $('excelEslesmeTabloHost').querySelectorAll('select');
        selects.forEach(function(sel, idx) {
          if (map[idx] !== undefined) sel.value = map[idx];
        });
      }
    } catch (err) {
      alert('Eşleştirme JSON yüklenemedi: ' + err.message);
    }
  };
  r.readAsText(f);
};

// Excel Dry-Run Önizleme
$('excelOnizleBtn').onclick = function() {
  $('excelErr').textContent = '';
  var baslikSatirIndeksi = parseInt($('excelBaslikSatir').value, 10) || 0;
  var hedefTipi = $('excelHedefTipi').value;

  var sonuc = AktarExcel.onizlemeYap(EXCEL_DURUM.satirlar, baslikSatirIndeksi, EXCEL_DURUM.eslesme, hedefTipi);
  if (sonuc.hata) {
    $('excelErr').textContent = sonuc.hata;
    return;
  }
  EXCEL_DURUM.onizlemeSonuc = sonuc;

  $('excelOnizlemeArea').classList.remove('hide');
  $('excelOnizlemeChips').textContent = '';
  chip('Toplam ' + sonuc.toplamSatir + ' satır veri işlenecek', 'excelOnizlemeChips');
  chip('Önizleme: İlk ' + Math.min(200, sonuc.toplamSatir) + ' satır', 'excelOnizlemeChips');
  chip(sonuc.uyarilar.length + ' uyarı', 'excelOnizlemeChips');

  var cakismaDiv = $('excelCakismaUyari');
  cakismaDiv.textContent = '';
  cakismaDiv.classList.add('hide');

  // Çakışma kuralları kontrolü
  if (hedefTipi === 'firma' && AKTIF_DT_YEDEK && AKTIF_DT_YEDEK.firmalar) {
    var varOlanNolar = {};
    AKTIF_DT_YEDEK.firmalar.forEach(function(f) { if (f.no) varOlanNolar[f.no] = f.unvan; });
    var cakisanSayisi = 0;
    sonuc.onizleme.forEach(function(item) {
      if (item.veri.no && varOlanNolar[item.veri.no]) {
        cakisanSayisi++;
      }
    });
    if (cakisanSayisi > 0) {
      cakismaDiv.classList.remove('hide');
      cakismaDiv.textContent = 'Dikkat: ' + cakisanSayisi + ' adet firmanın "Firma No"su mevcut DT yedeğinde zaten var. Çakışma kuralı: Aynı numaralı firmalar tekrar eklenmeyecektir.';
    }
  }

  // Önizleme tablosunu bas
  var ornekObj = (sonuc.onizleme[0] || {}).veri || {};
  var sutunlar = Object.keys(ornekObj);
  var basliklar = ['Satır No'].concat(sutunlar);
  var satirlar = sonuc.onizleme.map(function(item) {
    return [item.satirNo].concat(sutunlar.map(function(k) { return item.veri[k]; }));
  });
  tablo($('excelOnizlemeTabloHost'), basliklar, satirlar);
};

// Excel Onay ve DT Yedeğine Ekleme
$('excelAktarOnayBtn').onclick = function() {
  if (!EXCEL_DURUM.onizlemeSonuc) return;
  var yedek = AKTIF_DT_YEDEK ? JSON.parse(JSON.stringify(AKTIF_DT_YEDEK)) : JSON.parse(JSON.stringify(ORNEK));
  var hedefTipi = $('excelHedefTipi').value;
  var baslikSatirIndeksi = parseInt($('excelBaslikSatir').value, 10) || 0;
  var sonuc = AktarExcel.onizlemeYap(EXCEL_DURUM.satirlar, baslikSatirIndeksi, EXCEL_DURUM.eslesme, hedefTipi);

  if (hedefTipi === 'firma') {
    var mevcutNolar = {};
    yedek.firmalar.forEach(function(f) { if (f.no) mevcutNolar[f.no] = 1; });
    var eklenenFirma = 0;
    sonuc.onizleme.forEach(function(item) {
      var v = item.veri;
      if (v.no && mevcutNolar[v.no]) return; // Atla
      var yeniId = 'f-' + Math.random().toString(36).substr(2, 7);
      yedek.firmalar.push({
        id: yeniId,
        no: v.no || '',
        unvan: v.unvan || '',
        ilet: v.ilet || '',
        yer: v.yer || ''
      });
      if (v.no) mevcutNolar[v.no] = 1;
      eklenenFirma++;
    });
    alert(eklenenFirma + ' firma genel listeye eklendi.');
  } else if (hedefTipi === 'katalog') {
    var eklenenKatalog = 0;
    sonuc.onizleme.forEach(function(item) {
      var v = item.veri;
      var yeniId = 'k-' + Math.random().toString(36).substr(2, 7);
      yedek.katalog.push({
        id: yeniId,
        kod: v.kod || '',
        tasinir: v.tasinir || '',
        okas: v.okas || '',
        ad: v.ad || ''
      });
      eklenenKatalog++;
    });
    alert(eklenenKatalog + ' kalem kataloğa eklendi.');
  } else if (hedefTipi === 'malzeme') {
    var hedefDosyaId = $('excelHedefDosya').value;
    var hedefDosya = null;

    if (hedefDosyaId === '__yeni__') {
      var yeniId = 'd-' + Math.random().toString(36).substr(2, 7);
      hedefDosya = {
        id: yeniId,
        f: {
          'İhalesi Yapılacak Birim': 'İçe Aktarılan Birim',
          'İhale Tipi': 'Doğrudan Temin',
          'Bütçe': 'Genel Bütçe',
          'KDV': 'Hariç',
          'Sunulacak Makam': 'Başkanlık Makamı',
          'İhtiyaç Yeri': 'Depo',
          'Hesaplama Esası': 'Birim Fiyat',
          'Hesaplamada': 'KDV Hariç',
          'Alım Türü': 'Mal Alımı',
          'Dosya Açılış Tarihi': new Date().toISOString().slice(0, 10),
          'İşin Adı / Tanımı': 'Excelden İçe Aktarılan Dosya',
          'Dosya No': 'IMP-' + Math.floor(Math.random() * 9000 + 1000),
          'Doğrudan Temin Numarası': '1',
          'Bütçe Yılı': String(new Date().getFullYear())
        },
        mat: [],
        win: [],
        con: [],
        yak: [],
        muay: [],
        kab: [],
        ek: [],
        tek: [],
        sablon: {}
      };
      yedek.files.push(hedefDosya);
    } else {
      for (var i = 0; i < yedek.files.length; i++) {
        if (yedek.files[i].id === hedefDosyaId) {
          hedefDosya = yedek.files[i];
          break;
        }
      }
    }

    if (hedefDosya) {
      if (!Array.isArray(hedefDosya.mat)) hedefDosya.mat = [];
      sonuc.onizleme.forEach(function(item) {
        var v = item.veri;
        var sira = '';
        var matSatiri = [
          sira,
          v.kod || '',
          v.ad || '',
          v.aciklama || '',
          v.birim || '',
          v.kdvOrani || '20',
          v.miktar || '1',
          v.birimFiyat || '',
          v.kazananFirma || ''
        ];
        if (v.tasinirKodu || v.okas) {
          matSatiri.push(v.tasinirKodu || '');
          if (v.okas) matSatiri.push(v.okas);
        }
        hedefDosya.mat.push(matSatiri);
      });
      alert(sonuc.onizleme.length + ' malzeme dosyaya eklendi.');
    }
  }

  // DT yedeğini ana kutuya yaz ve güncelle
  AKTIF_DT_YEDEK = yedek;
  $('src').value = js(yedek);
  calistir();
  window.scrollTo({ top: $('sonuc').offsetTop - 20, behavior: 'smooth' });
};

$('excelVazgecBtn').onclick = function() {
  $('excelOnizlemeArea').classList.add('hide');
};

// ----------------------------------------------------
// Dışa Aktarımlar (data.zip ve DT JSON)
// ----------------------------------------------------
$('ayir').onclick = calistir;
$('ornek').onclick = function() { $('src').value = js(ORNEK); calistir(); };
$('fil').onchange = function(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function() { $('src').value = r.result; calistir(); };
  r.readAsText(f);
};

$('zip').onclick = function() {
  if (!S) return;
  var z = new JSZip(), y = dosyaYollari(S);
  Object.keys(y).forEach(function(k) { z.file(k, js(y[k])); });
  z.generateAsync({ type: 'blob' }).then(function(blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
};

$('dtYedekIndir').onclick = function() {
  if (!AKTIF_DT_YEDEK) return;
  indirmeTetikle(js(AKTIF_DT_YEDEK), 'dt-yedek.json');
};
