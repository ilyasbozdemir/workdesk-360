
var TARIH=/^\d{4}-\d{2}-\d{2}$/, TARSAAT=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
var MAT=['sira','kod','ad','aciklama','birim','kdvOrani','miktar','birimFiyat','kazananFirma','tasinirKodu','okas'];
var WIN=['_','firmaNo','unvan','telefon','yer'].slice(1);
var KAB=['_','ad','aciklama','birim','miktar','kabulMiktar','hesapMiktar'];
function adlandir(row,keys){var o={};keys.forEach(function(k,i){if(k[0]!=='_'&&row[i]!==undefined)o[k]=row[i]});return o}
function kisi(r){return {rol:r[1]||'',adSoyad:r[2]||''}}
function normDosya(d){
  return {id:d.id,f:d.f||{},
    malzemeler:(d.mat||[]).map(function(r){return adlandir(r,MAT)}),
    firmalar:(d.win||[]).map(function(r){return adlandir(r,WIN)}),
    adaylar:(d.con||[]).map(function(r){return {unvan:r[0]||''}}),
    yaklasikMaliyetKomisyonu:(d.yak||[]).map(kisi),
    muayeneKomisyonu:(d.muay||[]).map(kisi),
    kabuller:(d.kab||[]).map(function(k){return {id:k.id,baslik:k.h||{},kalemler:(k.m||[]).map(function(r){return adlandir(r,KAB)})}}),
    teklifler:d.tek||[],sablon:d.sablon||{},ek:d.ek||[],
    kabulFirmalari:d.kfirma||[],kabulFirmaBilgi:d.kfirmaBilgi||{}};
}
function saglik(b){
  var u=[];function w(s,m){u.push({seviye:s,mesaj:m})}
  ['files','defs','kurum','firmalar','katalog'].forEach(function(k){if(b[k]===undefined)w('hata','Eksik anahtar: '+k)});
  var fid={};(b.firmalar||[]).forEach(function(f){fid[f.id]=1});
  var ids={};
  (b.files||[]).forEach(function(d,i){
    var f=d.f||{},e='Dosya '+(f['Dosya No']||d.id||(i+1));
    if(ids[d.id])w('hata',e+': tekrar eden id ('+d.id+')');ids[d.id]=1;
    ['Dosya Açılış Tarihi','İhale Tarihi','Tahmini Bitiş Tarihi'].forEach(function(k){if(f[k]&&!TARIH.test(f[k]))w('uyari',e+': '+k+' biçimi bozuk ('+f[k]+')')});
    if(f['Son Teklif Verme Tarih/Saati']&&!TARSAAT.test(f['Son Teklif Verme Tarih/Saati']))w('uyari',e+': son teklif tarihi biçimi bozuk');
    (d.mat||[]).forEach(function(r,j){if(r.length<9||r.length>11)w('hata',e+': '+(j+1)+'. malzeme satırı '+r.length+' elemanlı (9-11 beklenir)')});
    (d.tek||[]).forEach(function(t){
      if(t.dosyaId!==d.id)w('uyari',e+': '+t.firma+' teklifinin dosyaId’si bu dosyayla eşleşmiyor');
      if((t.kalemler||[]).length!==(d.mat||[]).length)w('uyari',e+': '+t.firma+' teklifinde '+(t.kalemler||[]).length+' fiyat var, malzeme sayısı '+(d.mat||[]).length);
      if(t.firmaId&&!fid[t.firmaId])w('bilgi',e+': '+t.firma+' firma listesinde yok (serbest firma olabilir)');
      if(t.istekTarihi&&!TARIH.test(t.istekTarihi))w('uyari',e+': '+t.firma+' istek tarihi biçimi bozuk ('+t.istekTarihi+')');
      if(t.teklifTarihi&&!TARIH.test(t.teklifTarihi))w('uyari',e+': '+t.firma+' teklif tarihi biçimi bozuk ('+t.teklifTarihi+')');
    });
    (d.kab||[]).forEach(function(k,ki){
      var kh=k.h||{};
      if(kh['Kabul Tarihi']&&!TARIH.test(kh['Kabul Tarihi']))w('uyari',e+': '+(ki+1)+'. kabul tutanağı tarihi biçimi bozuk ('+kh['Kabul Tarihi']+')');
      if(kh['Fatura Tarihi']&&!TARIH.test(kh['Fatura Tarihi']))w('uyari',e+': '+(ki+1)+'. kabul fatura tarihi biçimi bozuk ('+kh['Fatura Tarihi']+')');
      (k.m||[]).forEach(function(mr,mj){if(mr.length!==7)w('uyari',e+': '+(ki+1)+'. kabul '+(mj+1)+'. kalemi '+mr.length+' elemanlı (7 beklenir)')});
    });
  });
  return u;
}
function ayir(b){
  var dos=(b.files||[]).map(normDosya);
  var liste=dos.map(function(d){var f=d.f;return {id:d.id,dosyaNo:f['Dosya No']||'',dtNo:f['Doğrudan Temin Numarası']||'',isinAdi:f['İşin Adı / Tanımı']||'',butceYili:f['Bütçe Yılı']||'',asama:f['İhale Aşaması']||'',malzeme:d.malzemeler.length,teklif:d.teklifler.length,kabul:d.kabuller.length}});
  var genel={kurum:b.kurum||{},firmalar:b.firmalar||[],katalog:b.katalog||[],varsayilanlar:b.defs||{}};
  var rapor=saglik(b);
  var manifest={schemaVersion:1,uretim:new Date().toISOString(),dosyaSayisi:dos.length,firmaSayisi:genel.firmalar.length,katalogKalemi:genel.katalog.length,
    uygulamaDurumu:{aktifIndeks:b.cur,winV2:b.winV2,mockTemizlendi:b.mockTemizlendi},
    saglik:{hata:rapor.filter(function(x){return x.seviye==='hata'}).length,uyari:rapor.filter(function(x){return x.seviye==='uyari'}).length}};
  return {manifest:manifest,genel:genel,liste:liste,dosyalar:dos,rapor:rapor};
}
function denormDosya(nd){
  var mat=(nd.malzemeler||[]).map(function(m){
    var r=[
      m.sira!==undefined?String(m.sira):'',
      m.kod!==undefined?String(m.kod):'',
      m.ad!==undefined?String(m.ad):'',
      m.aciklama!==undefined?String(m.aciklama):'',
      m.birim!==undefined?String(m.birim):'',
      m.kdvOrani!==undefined?String(m.kdvOrani):'',
      m.miktar!==undefined?String(m.miktar):'',
      m.birimFiyat!==undefined?String(m.birimFiyat):'',
      m.kazananFirma!==undefined?String(m.kazananFirma):''
    ];
    if(m.tasinirKodu!==undefined||m.okas!==undefined){
      r.push(m.tasinirKodu!==undefined?String(m.tasinirKodu):'');
      if(m.okas!==undefined){
        r.push(String(m.okas));
      }
    }
    return r;
  });

  var win=(nd.firmalar||[]).map(function(w){
    return [
      w.firmaNo!==undefined?String(w.firmaNo):'',
      w.unvan!==undefined?String(w.unvan):'',
      w.telefon!==undefined?String(w.telefon):'',
      w.yer!==undefined?String(w.yer):''
    ];
  });

  var con=(nd.adaylar||[]).map(function(c){
    return [c.unvan!==undefined?String(c.unvan):'',''];
  });

  var yak=(nd.yaklasikMaliyetKomisyonu||[]).map(function(k){
    return ['',k.rol||'',k.adSoyad||'',''];
  });

  var muay=(nd.muayeneKomisyonu||[]).map(function(k){
    return ['',k.rol||'',k.adSoyad||'',''];
  });

  var kab=(nd.kabuller||[]).map(function(k){
    var m=(k.kalemler||[]).map(function(row){
      return [
        '',
        row.ad!==undefined?String(row.ad):'',
        row.aciklama!==undefined?String(row.aciklama):'',
        row.birim!==undefined?String(row.birim):'',
        row.miktar!==undefined?String(row.miktar):'',
        row.kabulMiktar!==undefined?String(row.kabulMiktar):'',
        row.hesapMiktar!==undefined?String(row.hesapMiktar):''
      ];
    });
    return {id:k.id,h:k.baslik||{},m:m};
  });

  var d={
    id:nd.id,
    f:nd.f||{},
    mat:mat,
    win:win,
    con:con,
    yak:yak,
    muay:muay,
    kab:kab,
    ek:nd.ek||[],
    tek:nd.teklifler||[],
    sablon:nd.sablon||{}
  };
  if(nd.kabulFirmalari&&nd.kabulFirmalari.length) d.kfirma=nd.kabulFirmalari;
  if(nd.kabulFirmaBilgi&&Object.keys(nd.kabulFirmaBilgi).length) d.kfirmaBilgi=nd.kabulFirmaBilgi;
  return d;
}

function denormYedek(manifest,genel,dosyalar){
  var u=manifest&&manifest.uygulamaDurumu?manifest.uygulamaDurumu:{};
  return {
    files:(dosyalar||[]).map(denormDosya),
    cur:typeof u.aktifIndeks==='number'?u.aktifIndeks:0,
    defs:genel&&genel.varsayilanlar?genel.varsayilanlar:{f:{},yak:[],muay:[]},
    kurum:genel&&genel.kurum?genel.kurum:{kurumAdi:''},
    mockTemizlendi:Boolean(u.mockTemizlendi),
    firmalar:genel&&genel.firmalar?genel.firmalar:[],
    winV2:Boolean(u.winV2),
    katalog:genel&&genel.katalog?genel.katalog:[]
  };
}

function dosyaYollari(s){
  var o={'data/manifest.json':s.manifest,'data/genel/kurum.json':s.genel.kurum,'data/genel/firmalar.json':s.genel.firmalar,'data/genel/katalog.json':s.genel.katalog,'data/genel/varsayilanlar.json':s.genel.varsayilanlar,'data/dosyalar/liste.json':s.liste,'data/rapor/saglik.json':s.rapor};
  s.dosyalar.forEach(function(d){o['data/dosyalar/'+String(d.id).replace(/[^\w.-]/g,'_')+'.json']=d});
  return o;
}


