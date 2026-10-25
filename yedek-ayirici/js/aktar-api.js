// js/aktar-api.js - Statik API (data.zip veya data/ klasörü) içe aktarma modülü
// JSZip ve engine.js bağımlılığı vardır. DOM'a doğrudan dokunmaz; veriyi okur, çözümler ve döner.

var AktarAPI = (function() {
  function dosyaAdiBul(dosyalar, hedef) {
    var k = Object.keys(dosyalar);
    for (var i = 0; i < k.length; i++) {
      var n = k[i].replace(/\\/g, '/');
      if (n === hedef || n.endsWith('/' + hedef) || n.endsWith(hedef)) {
        return k[i];
      }
    }
    return null;
  }

  function okuMetin(dosyalar, hedef) {
    var anahtar = dosyaAdiBul(dosyalar, hedef);
    if (!anahtar) return null;
    var d = dosyalar[anahtar];
    if (typeof d === 'string') return d;
    if (d && typeof d.async === 'function') {
      return d.async('string');
    }
    return null;
  }

  // zipObj: JSZip instance veya { dosyaYolu: metinIcerigi } haritası
  async function apiOkuVeCozumle(zipObj) {
    var dosyalar = {};
    if (zipObj && zipObj.files) {
      dosyalar = zipObj.files;
    } else {
      dosyalar = zipObj || {};
    }

    // 1. manifest.json
    var manifestStr = await okuMetin(dosyalar, 'data/manifest.json') || await okuMetin(dosyalar, 'manifest.json');
    if (!manifestStr) {
      throw new Error('manifest.json bulunamadı! Geçerli bir statik API paketi değil.');
    }
    var manifest;
    try {
      manifest = JSON.parse(manifestStr);
    } catch (e) {
      throw new Error('manifest.json geçersiz JSON: ' + e.message);
    }

    if (manifest.schemaVersion !== 1) {
      throw new Error('Desteklenmeyen schemaVersion (' + manifest.schemaVersion + '). Yalnızca schemaVersion=1 desteklenir.');
    }

    // 2. genel veriler: kurum, firmalar, katalog, varsayilanlar
    async function jsonOku(yol) {
      var s = await okuMetin(dosyalar, yol) || await okuMetin(dosyalar, yol.replace('data/', ''));
      if (!s) return null;
      try { return JSON.parse(s); } catch (e) { return null; }
    }

    var kurum = (await jsonOku('data/genel/kurum.json')) || { kurumAdi: '' };
    var firmalar = (await jsonOku('data/genel/firmalar.json')) || [];
    var katalog = (await jsonOku('data/genel/katalog.json')) || [];
    var varsayilanlar = (await jsonOku('data/genel/varsayilanlar.json')) || { f: {}, yak: [], muay: [] };
    var genel = { kurum: kurum, firmalar: firmalar, katalog: katalog, varsayilanlar: varsayilanlar };

    // 3. liste.json
    var liste = (await jsonOku('data/dosyalar/liste.json')) || [];

    // 4. Dosyalar klasöründeki her <id>.json dosyasını oku
    var dosyaObjeleri = [];
    var anahtarlar = Object.keys(dosyalar);
    for (var i = 0; i < anahtarlar.length; i++) {
      var k = anahtarlar[i].replace(/\\/g, '/');
      if (k.match(/dosyalar\/[^/]+\.json$/) && !k.endsWith('liste.json')) {
        var str = await okuMetin(dosyalar, anahtarlar[i]);
        if (str) {
          try {
            var dos = JSON.parse(str);
            if (dos && dos.id) {
              dosyaObjeleri.push(dos);
            }
          } catch (e) {
            console.warn('Dosya okunamadı:', k, e);
          }
        }
      }
    }

    // Sıralamayı liste.json'daki sıraya göre düzenle (eğer liste varsa)
    if (liste.length && dosyaObjeleri.length) {
      var sirali = [];
      var harita = {};
      dosyaObjeleri.forEach(function(d) { harita[d.id] = d; });
      liste.forEach(function(item) {
        if (harita[item.id]) {
          sirali.push(harita[item.id]);
          delete harita[item.id];
        }
      });
      // Listede olmayan kalanları da ekle
      Object.keys(harita).forEach(function(k) { sirali.push(harita[k]); });
      dosyaObjeleri = sirali;
    }

    // 5. Denormalize ederek geçerli DT yedeğine çevir (round-trip)
    var dtYedek = denormYedek(manifest, genel, dosyaObjeleri);
    var saglikRaporu = saglik(dtYedek);

    return {
      manifest: manifest,
      genel: genel,
      liste: liste,
      dosyaSayisi: dosyaObjeleri.length,
      dosyalar: dosyaObjeleri,
      dtYedek: dtYedek,
      saglik: saglikRaporu
    };
  }

  return {
    oku: apiOkuVeCozumle
  };
})();
