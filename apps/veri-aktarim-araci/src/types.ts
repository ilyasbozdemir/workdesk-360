/**
 * DT Dosyalar (Doğrudan Temin) Kök Model Tipleri (dosyalar.schema.json ile %100 uyumlu)
 */

export interface DtPersonelSatiri {
  rol: string
  adSoyad: string
}

export interface DtMalzemeSatiri {
  sira?: string | number
  kod?: string
  ad?: string
  aciklama?: string
  birim?: string
  kdvOrani?: string | number
  miktar?: string | number
  birimFiyat?: string | number
  kazananFirma?: string
  tasinirKodu?: string
  okas?: string
}

export interface DtFirmaSatiri {
  firmaNo?: string
  unvan?: string
  telefon?: string
  yer?: string
}

export interface DtKabulKalemi {
  ad?: string
  aciklama?: string
  birim?: string
  miktar?: string | number
  kabulMiktar?: string | number
  hesapMiktar?: string | number
}

export interface DtKabulTutonagi {
  id: string
  baslik: Record<string, string>
  kalemler: DtKabulKalemi[]
}

export interface DtTeklifKaydi {
  dosyaId: string
  firmaId?: string
  firma: string
  istekTarihi?: string
  teklifTarihi?: string
  kalemler?: (number | string)[]
  [key: string]: unknown
}

export interface DtDosyaNorm {
  id: string
  f: Record<string, string>
  malzemeler: DtMalzemeSatiri[]
  firmalar: DtFirmaSatiri[]
  adaylar: { unvan: string }[]
  yaklasikMaliyetKomisyonu: DtPersonelSatiri[]
  muayeneKomisyonu: DtPersonelSatiri[]
  kabuller: DtKabulTutonagi[]
  teklifler: DtTeklifKaydi[]
  sablon: Record<string, unknown>
  ek: unknown[]
  kabulFirmalari: unknown[]
  kabulFirmaBilgi: Record<string, unknown>
}

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
  ad: string
  birim: string
  fiyat?: number
}

export interface DtYedekRoot {
  files: Array<{
    id: string
    f: Record<string, string>
    mat?: (string | number)[][]
    win?: string[][]
    con?: string[][]
    yak?: string[][]
    muay?: string[][]
    kab?: Array<{
      id: string
      h?: Record<string, string>
      m?: (string | number)[][]
    }>
    ek?: unknown[]
    tek?: DtTeklifKaydi[]
    sablon?: Record<string, unknown>
    kfirma?: unknown[]
    kfirmaBilgi?: Record<string, unknown>
  }>
  cur: number
  defs: {
    f?: Record<string, string>
    yak?: string[][]
    muay?: string[][]
  }
  kurum: {
    kurumAdi: string
  }
  mockTemizlendi?: boolean
  firmalar: DtFirma[]
  winV2?: boolean
  katalog: DtKatalogKalemi[]
}

export type Seviye = 'hata' | 'uyari' | 'bilgi'

export interface SaglikRaporuItem {
  seviye: Seviye
  mesaj: string
}

export interface DosyaListeItem {
  id: string
  dosyaNo: string
  dtNo: string
  isinAdi: string
  butceYili: string
  asama: string
  malzeme: number
  teklif: number
  kabul: number
}

export interface AyirSonuc {
  manifest: {
    schemaVersion: number
    uretim: string
    dosyaSayisi: number
    firmaSayisi: number
    katalogKalemi: number
    uygulamaDurumu: {
      aktifIndeks: number
      winV2?: boolean
      mockTemizlendi?: boolean
    }
    saglik: {
      hata: number
      uyari: number
    }
  }
  genel: {
    kurum: { kurumAdi: string }
    firmalar: DtFirma[]
    katalog: DtKatalogKalemi[]
    varsayilanlar: unknown
  }
  liste: DosyaListeItem[]
  dosyalar: DtDosyaNorm[]
  rapor: SaglikRaporuItem[]
}
