import type {
  AyirSonuc,
  DosyaListeItem,
  DtDosyaNorm,
  DtKabulTutonagi,
  DtMalzemeSatiri,
  DtPersonelSatiri,
  DtYedekRoot,
  SaglikRaporuItem,
  Seviye
} from './types'

const TARIH = /^\d{4}-\d{2}-\d{2}$/
const TARSAAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

const MAT: (keyof DtMalzemeSatiri)[] = [
  'sira',
  'kod',
  'ad',
  'aciklama',
  'birim',
  'kdvOrani',
  'miktar',
  'birimFiyat',
  'kazananFirma',
  'tasinirKodu',
  'okas'
]

const WIN = ['firmaNo', 'unvan', 'telefon', 'yer'] as const
const KAB = ['ad', 'aciklama', 'birim', 'miktar', 'kabulMiktar', 'hesapMiktar'] as const

function adlandir<T extends object>(row: unknown[], keys: readonly (keyof T)[]): T {
  const o = {} as T
  keys.forEach((k, i) => {
    if (row[i] !== undefined) {
      o[k] = row[i] as T[keyof T]
    }
  })
  return o
}

function kisi(r: unknown[]): DtPersonelSatiri {
  return {
    rol: typeof r[1] === 'string' ? r[1] : '',
    adSoyad: typeof r[2] === 'string' ? r[2] : ''
  }
}

export function normDosya(d: DtYedekRoot['files'][0]): DtDosyaNorm {
  return {
    id: d.id,
    f: d.f || {},
    malzemeler: (d.mat || []).map((r) => adlandir<DtMalzemeSatiri>(r, MAT)),
    firmalar: (d.win || []).map((r) => adlandir(r.slice(1), WIN)),
    adaylar: (d.con || []).map((r) => ({ unvan: typeof r[0] === 'string' ? r[0] : '' })),
    yaklasikMaliyetKomisyonu: (d.yak || []).map(kisi),
    muayeneKomisyonu: (d.muay || []).map(kisi),
    kabuller: (d.kab || []).map((k) => ({
      id: k.id,
      baslik: k.h || {},
      kalemler: (k.m || []).map((r) => adlandir(r.slice(1), KAB))
    })),
    teklifler: d.tek || [],
    sablon: d.sablon || {},
    ek: d.ek || [],
    kabulFirmalari: d.kfirma || [],
    kabulFirmaBilgi: d.kfirmaBilgi || {}
  }
}

export function saglik(b: DtYedekRoot): SaglikRaporuItem[] {
  const u: SaglikRaporuItem[] = []
  function w(s: Seviye, m: string): void {
    u.push({ seviye: s, mesaj: m })
  }

  const expectedKeys: (keyof DtYedekRoot)[] = ['files', 'defs', 'kurum', 'firmalar', 'katalog']
  expectedKeys.forEach((k) => {
    if (b[k] === undefined) w('hata', 'Eksik anahtar: ' + String(k))
  })

  const fid: Record<string, boolean> = {}
  ;(b.firmalar || []).forEach((f) => {
    fid[f.id] = true
  })

  const ids: Record<string, boolean> = {}
  ;(b.files || []).forEach((d, i) => {
    const f = d.f || {}
    const e = 'Dosya ' + (f['Dosya No'] || d.id || i + 1)
    if (ids[d.id]) w('hata', e + ': tekrar eden id (' + d.id + ')')
    ids[d.id] = true

    const dateKeys = ['Dosya Açılış Tarihi', 'İhale Tarihi', 'Tahmini Bitiş Tarihi']
    dateKeys.forEach((k) => {
      if (f[k] && !TARIH.test(f[k])) w('uyari', e + ': ' + k + ' biçimi bozuk (' + f[k] + ')')
    })

    if (f['Son Teklif Verme Tarih/Saati'] && !TARSAAT.test(f['Son Teklif Verme Tarih/Saati'])) {
      w('uyari', e + ': son teklif tarihi biçimi bozuk')
    }

    ;(d.mat || []).forEach((r, j) => {
      if (r.length < 9 || r.length > 11) {
        w('hata', e + ': ' + (j + 1) + '. malzeme satırı ' + r.length + ' elemanlı (9-11 beklenir)')
      }
    })

    ;(d.tek || []).forEach((t) => {
      if (t.dosyaId !== d.id) w('uyari', e + ': ' + t.firma + ' teklifinin dosyaId’si bu dosyayla eşleşmiyor')
      if ((t.kalemler || []).length !== (d.mat || []).length) {
        w('uyari', e + ': ' + t.firma + ' teklifinde ' + (t.kalemler || []).length + ' fiyat var, malzeme sayısı ' + (d.mat || []).length)
      }
      if (t.firmaId && !fid[t.firmaId]) w('bilgi', e + ': ' + t.firma + ' firma listesinde yok (serbest firma olabilir)')
      if (t.istekTarihi && !TARIH.test(t.istekTarihi)) w('uyari', e + ': ' + t.firma + ' istek tarihi biçimi bozuk (' + t.istekTarihi + ')')
      if (t.teklifTarihi && !TARIH.test(t.teklifTarihi)) w('uyari', e + ': ' + t.firma + ' teklif tarihi biçimi bozuk (' + t.teklifTarihi + ')')
    })

    ;(d.kab || []).forEach((k, ki) => {
      const kh = k.h || {}
      if (kh['Kabul Tarihi'] && !TARIH.test(kh['Kabul Tarihi'])) {
        w('uyari', e + ': ' + (ki + 1) + '. kabul tutanağı tarihi biçimi bozuk (' + kh['Kabul Tarihi'] + ')')
      }
      if (kh['Fatura Tarihi'] && !TARIH.test(kh['Fatura Tarihi'])) {
        w('uyari', e + ': ' + (ki + 1) + '. kabul fatura tarihi biçimi bozuk (' + kh['Fatura Tarihi'] + ')')
      }
      ;(k.m || []).forEach((mr, mj) => {
        if (mr.length !== 7) {
          w('uyari', e + ': ' + (ki + 1) + '. kabul ' + (mj + 1) + '. kalemi ' + mr.length + ' elemanlı (7 beklenir)')
        }
      })
    })
  })

  return u
}

export function ayir(b: DtYedekRoot): AyirSonuc {
  const dos = (b.files || []).map(normDosya)
  const liste: DosyaListeItem[] = dos.map((d) => {
    const f = d.f
    return {
      id: d.id,
      dosyaNo: f['Dosya No'] || '',
      dtNo: f['Doğrudan Temin Numarası'] || '',
      isinAdi: f['İşin Adı / Tanımı'] || '',
      butceYili: f['Bütçe Yılı'] || '',
      asama: f['İhale Aşaması'] || '',
      malzeme: d.malzemeler.length,
      teklif: d.teklifler.length,
      kabul: d.kabuller.length
    }
  })

  const genel = {
    kurum: b.kurum || { kurumAdi: '' },
    firmalar: b.firmalar || [],
    katalog: b.katalog || [],
    varsayilanlar: b.defs || {}
  }

  const rapor = saglik(b)
  const manifest = {
    schemaVersion: 1,
    uretim: new Date().toISOString(),
    dosyaSayisi: dos.length,
    firmaSayisi: genel.firmalar.length,
    katalogKalemi: genel.katalog.length,
    uygulamaDurumu: {
      aktifIndeks: b.cur,
      winV2: b.winV2,
      mockTemizlendi: b.mockTemizlendi
    },
    saglik: {
      hata: rapor.filter((x) => x.seviye === 'hata').length,
      uyari: rapor.filter((x) => x.seviye === 'uyari').length
    }
  }

  return { manifest, genel, liste, dosyalar: dos, rapor }
}

export function denormDosya(nd: DtDosyaNorm): DtYedekRoot['files'][0] {
  const mat = (nd.malzemeler || []).map((m) => {
    const r: (string | number)[] = [
      m.sira !== undefined ? String(m.sira) : '',
      m.kod !== undefined ? String(m.kod) : '',
      m.ad !== undefined ? String(m.ad) : '',
      m.aciklama !== undefined ? String(m.aciklama) : '',
      m.birim !== undefined ? String(m.birim) : '',
      m.kdvOrani !== undefined ? String(m.kdvOrani) : '',
      m.miktar !== undefined ? String(m.miktar) : '',
      m.birimFiyat !== undefined ? String(m.birimFiyat) : '',
      m.kazananFirma !== undefined ? String(m.kazananFirma) : ''
    ]
    if (m.tasinirKodu !== undefined || m.okas !== undefined) {
      r.push(m.tasinirKodu !== undefined ? String(m.tasinirKodu) : '')
      if (m.okas !== undefined) {
        r.push(String(m.okas))
      }
    }
    return r
  })

  const win = (nd.firmalar || []).map((w) => [
    '',
    w.firmaNo !== undefined ? String(w.firmaNo) : '',
    w.unvan !== undefined ? String(w.unvan) : '',
    w.telefon !== undefined ? String(w.telefon) : '',
    w.yer !== undefined ? String(w.yer) : ''
  ])

  const con = (nd.adaylar || []).map((c) => [c.unvan !== undefined ? String(c.unvan) : '', ''])

  const yak = (nd.yaklasikMaliyetKomisyonu || []).map((k) => [
    '',
    k.rol || '',
    k.adSoyad || '',
    ''
  ])

  const muay = (nd.muayeneKomisyonu || []).map((k) => [
    '',
    k.rol || '',
    k.adSoyad || '',
    ''
  ])

  const kab = (nd.kabuller || []).map((k) => {
    const m = (k.kalemler || []).map((row) => [
      '',
      row.ad !== undefined ? String(row.ad) : '',
      row.aciklama !== undefined ? String(row.aciklama) : '',
      row.birim !== undefined ? String(row.birim) : '',
      row.miktar !== undefined ? String(row.miktar) : '',
      row.kabulMiktar !== undefined ? String(row.kabulMiktar) : '',
      row.hesapMiktar !== undefined ? String(row.hesapMiktar) : ''
    ])
    return {
      id: k.id,
      h: k.baslik || {},
      m: m
    }
  })

  return {
    id: nd.id,
    f: nd.f || {},
    mat,
    win,
    con,
    yak,
    muay,
    kab,
    ek: nd.ek || [],
    tek: nd.teklifler || [],
    sablon: nd.sablon || {},
    kfirma: nd.kabulFirmalari || [],
    kfirmaBilgi: nd.kabulFirmaBilgi || {}
  }
}
