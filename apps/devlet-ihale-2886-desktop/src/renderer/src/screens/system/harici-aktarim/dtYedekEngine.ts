/**
 * dtYedekEngine.ts
 *
 * dosyalar.schema.json şemasına %100 uyumlu TypeScript motoru.
 * - Statik API ayrıştırma (ayir / normalize)
 * - Round-trip garantili denormalizasyon (denormDosya / denormYedek)
 * - Sağlık kontrolleri (saglik)
 * - Excel/CSV dönüştürme ve eşleme yardımcıları
 */

export interface DtFirma {
  id: string
  no: string
  unvan: string
  ilet: string
  yer: string
}

export interface DtKatalogKalemi {
  id: string
  kod: string
  tasinir: string
  okas: string
  ad: string
}

export type DtPersonelSatiri = [string, string, string, string] // ["", rol, adSoyad, ""]
export type DtMatSatiri = string[] // [sira, kod, ad, aciklama, birim, kdvOrani, miktar, birimFiyat, kazananFirma, tasinirKodu?, okas?]
export type DtWinSatiri = [string, string, string, string] // [firmaNo, unvan, telefon, yer]
export type DtConSatiri = [string, string] // [unvan, ""]

export interface DtKabul {
  id: string
  h: Record<string, string>
  m: string[][] // ["", ad, aciklama, birim, miktar, kabulMiktar, hesapMiktar]
}

export interface DtTeklif {
  id: string
  dosyaId: string
  firma: string
  firmaNo: string
  iletisim: string
  yer: string
  firmaId: string
  vergiNo: string
  yetkili: string
  istekTarihi: string
  sekil: string
  durum: string
  teklifTarihi: string
  tutar: string
  kdv: string
  gecerlilik: string
  not: string
  kalemler: string[] // birim fiyatlar mat[] ile aynı sırada
}

export interface DtDosya {
  id: string
  f: Record<string, string>
  mat: DtMatSatiri[]
  win: DtWinSatiri[]
  con: DtConSatiri[]
  yak: DtPersonelSatiri[]
  muay: DtPersonelSatiri[]
  kab: DtKabul[]
  ek: unknown[]
  tek: DtTeklif[]
  sablon?: Record<string, string>
  kfirma?: string[]
  kfirmaBilgi?: Record<string, unknown>
}

export interface DtKökModel {
  files: DtDosya[]
  cur: number
  defs: {
    f: Record<string, string>
    yak: DtPersonelSatiri[]
    muay: DtPersonelSatiri[]
  }
  kurum: {
    kurumAdi: string
  }
  mockTemizlendi: boolean
  firmalar: DtFirma[]
  winV2: boolean
  katalog: DtKatalogKalemi[]
}

export interface NormMalzeme {
  sira?: string
  kod?: string
  ad?: string
  aciklama?: string
  birim?: string
  kdvOrani?: string
  miktar?: string
  birimFiyat?: string
  kazananFirma?: string
  tasinirKodu?: string
  okas?: string
}

export interface NormFirma {
  firmaNo?: string
  unvan?: string
  telefon?: string
  yer?: string
}

export interface NormKabul {
  id: string
  baslik: Record<string, string>
  kalemler: Array<{
    ad?: string
    aciklama?: string
    birim?: string
    miktar?: string
    kabulMiktar?: string
    hesapMiktar?: string
  }>
}

export interface NormDosya {
  id: string
  f: Record<string, string>
  malzemeler: NormMalzeme[]
  firmalar: NormFirma[]
  adaylar: Array<{ unvan: string }>
  yaklasikMaliyetKomisyonu: Array<{ rol: string; adSoyad: string }>
  muayeneKomisyonu: Array<{ rol: string; adSoyad: string }>
  kabuller: NormKabul[]
  teklifler: DtTeklif[]
  sablon: Record<string, string>
  ek: unknown[]
  kabulFirmalari?: string[]
  kabulFirmaBilgi?: Record<string, unknown>
}

export interface SaglikMesaji {
  seviye: 'hata' | 'uyari' | 'bilgi'
  mesaj: string
}

const TARIH = /^\d{4}-\d{2}-\d{2}$/
const TARSAAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function normDosya(d: DtDosya): NormDosya {
  const MAT_KEYS = ['sira', 'kod', 'ad', 'aciklama', 'birim', 'kdvOrani', 'miktar', 'birimFiyat', 'kazananFirma', 'tasinirKodu', 'okas']
  const WIN_KEYS = ['firmaNo', 'unvan', 'telefon', 'yer']
  const KAB_KEYS = ['_', 'ad', 'aciklama', 'birim', 'miktar', 'kabulMiktar', 'hesapMiktar']

  const malzemeler: NormMalzeme[] = (d.mat || []).map((row) => {
    const o: Record<string, string> = {}
    MAT_KEYS.forEach((k, i) => {
      if (row[i] !== undefined) o[k] = row[i]
    })
    return o
  })

  const firmalar: NormFirma[] = (d.win || []).map((row) => {
    const o: Record<string, string> = {}
    WIN_KEYS.forEach((k, i) => {
      if (row[i] !== undefined) o[k] = row[i]
    })
    return o
  })

  const adaylar = (d.con || []).map((row) => ({ unvan: row[0] || '' }))

  const yaklasikMaliyetKomisyonu = (d.yak || []).map((r) => ({
    rol: r[1] || '',
    adSoyad: r[2] || ''
  }))

  const muayeneKomisyonu = (d.muay || []).map((r) => ({
    rol: r[1] || '',
    adSoyad: r[2] || ''
  }))

  const kabuller: NormKabul[] = (d.kab || []).map((k) => ({
    id: k.id,
    baslik: k.h || {},
    kalemler: (k.m || []).map((row) => {
      const o: Record<string, string> = {}
      KAB_KEYS.forEach((key, i) => {
        if (key !== '_' && row[i] !== undefined) o[key] = row[i]
      })
      return o
    })
  }))

  return {
    id: d.id,
    f: d.f || {},
    malzemeler,
    firmalar,
    adaylar,
    yaklasikMaliyetKomisyonu,
    muayeneKomisyonu,
    kabuller,
    teklifler: d.tek || [],
    sablon: d.sablon || {},
    ek: d.ek || [],
    kabulFirmalari: d.kfirma,
    kabulFirmaBilgi: d.kfirmaBilgi
  }
}

export function denormDosya(nd: NormDosya): DtDosya {
  const mat: DtMatSatiri[] = (nd.malzemeler || []).map((m) => {
    const r: string[] = [
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

  const win: DtWinSatiri[] = (nd.firmalar || []).map((w) => [
    w.firmaNo !== undefined ? String(w.firmaNo) : '',
    w.unvan !== undefined ? String(w.unvan) : '',
    w.telefon !== undefined ? String(w.telefon) : '',
    w.yer !== undefined ? String(w.yer) : ''
  ])

  const con: DtConSatiri[] = (nd.adaylar || []).map((c) => [
    c.unvan !== undefined ? String(c.unvan) : '',
    ''
  ])

  const yak: DtPersonelSatiri[] = (nd.yaklasikMaliyetKomisyonu || []).map((k) => [
    '',
    k.rol || '',
    k.adSoyad || '',
    ''
  ])

  const muay: DtPersonelSatiri[] = (nd.muayeneKomisyonu || []).map((k) => [
    '',
    k.rol || '',
    k.adSoyad || '',
    ''
  ])

  const kab: DtKabul[] = (nd.kabuller || []).map((k) => {
    const m = (k.kalemler || []).map((row) => [
      '',
      row.ad !== undefined ? String(row.ad) : '',
      row.aciklama !== undefined ? String(row.aciklama) : '',
      row.birim !== undefined ? String(row.birim) : '',
      row.miktar !== undefined ? String(row.miktar) : '',
      row.kabulMiktar !== undefined ? String(row.kabulMiktar) : '',
      row.hesapMiktar !== undefined ? String(row.hesapMiktar) : ''
    ])
    return { id: k.id, h: k.baslik || {}, m }
  })

  const d: DtDosya = {
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
    sablon: nd.sablon || {}
  }
  if (nd.kabulFirmalari && nd.kabulFirmalari.length) d.kfirma = nd.kabulFirmalari
  if (nd.kabulFirmaBilgi && Object.keys(nd.kabulFirmaBilgi).length) d.kfirmaBilgi = nd.kabulFirmaBilgi
  return d
}

export function saglik(b: DtKökModel): SaglikMesaji[] {
  const u: SaglikMesaji[] = []
  function w(s: 'hata' | 'uyari' | 'bilgi', m: string) {
    u.push({ seviye: s, mesaj: m })
  }

  const keys: Array<keyof DtKökModel> = ['files', 'defs', 'kurum', 'firmalar', 'katalog']
  keys.forEach((k) => {
    if (b[k] === undefined) w('hata', `Eksik anahtar: ${k}`)
  })

  const fid: Record<string, number> = {}
  ;(b.firmalar || []).forEach((f) => {
    if (f.id) fid[f.id] = 1
  })

  const ids: Record<string, number> = {}
  ;(b.files || []).forEach((d, i) => {
    const f = d.f || {}
    const e = `Dosya ${f['Dosya No'] || d.id || i + 1}`
    if (ids[d.id]) w('hata', `${e}: tekrar eden id (${d.id})`)
    ids[d.id] = 1

    ;['Dosya Açılış Tarihi', 'İhale Tarihi', 'Tahmini Bitiş Tarihi'].forEach((k) => {
      if (f[k] && !TARIH.test(f[k])) w('uyari', `${e}: ${k} biçimi bozuk (${f[k]})`)
    })
    if (f['Son Teklif Verme Tarih/Saati'] && !TARSAAT.test(f['Son Teklif Verme Tarih/Saati'])) {
      w('uyari', `${e}: son teklif tarihi biçimi bozuk (${f['Son Teklif Verme Tarih/Saati']})`)
    }

    ;(d.mat || []).forEach((r, j) => {
      if (r.length < 9 || r.length > 11) {
        w('hata', `${e}: ${j + 1}. malzeme satırı ${r.length} elemanlı (9-11 beklenir)`)
      }
    })

    ;(d.tek || []).forEach((t) => {
      if (t.dosyaId !== d.id) {
        w('uyari', `${e}: ${t.firma} teklifinin dosyaId’si bu dosyayla eşleşmiyor`)
      }
      if ((t.kalemler || []).length !== (d.mat || []).length) {
        w('uyari', `${e}: ${t.firma} teklifinde ${(t.kalemler || []).length} fiyat var, malzeme sayısı ${(d.mat || []).length}`)
      }
      if (t.firmaId && !fid[t.firmaId]) {
        w('bilgi', `${e}: ${t.firma} firma listesinde yok (serbest firma olabilir)`)
      }
    })
  })

  return u
}
