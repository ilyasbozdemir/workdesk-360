export type EbysCategory =
  | 'hepsi'
  | 'ust_yazi'
  | 'ic_yazisma'
  | 'olur_onay'
  | 'bilgi_gorus'
  | 'cevap'
  | 'gorevlendirme'
  | 'izin_olur'
  | 'dagitimli'
  | 'ekli'
  | 'cok_sayfali'

export type MuhatapHiyerarsi = 'ust' | 'es' | 'alt'

/**
 * Gönderim / Dağıtım Türü
 * NOT: Doğrudan Temin sürecinde harici EBYS veya KEP servislerine dış gönderim yapılmaz.
 * Evraklar doğrudan temin dosyası içinde arşivlenir, paraflanır ve dosya çıktısı olarak saklanır.
 */
export type GonderimKanali = 'EBYS' | 'KEP' | 'ELDEN'

export interface EbysMuhatap {
  id?: number // TANIM_Muhatap kaydı (opsiyonel, serbest metin de olabilir)
  hitap: string // "ANKARA VALİLİĞİNE"
  ek?: string // "(Çevre, Şehircilik ... İl Müdürlüğü)"
  hiyerarsi: MuhatapHiyerarsi
  kanal?: GonderimKanali
  kepAdresi?: string
}

export interface EbysDagitimKalemi {
  muhatap: EbysMuhatap
  tur: 'gereği' | 'bilgi'
}

export type RotaTuru = 'hazirlayan' | 'paraf' | 'imza' | 'bilgi'

export interface EbysRotaAdimi {
  sira: number
  tur: RotaTuru
  rolKodu?: string // TANIM_Roller.rol_kodu
  personelId?: number // belirli kişi sabitlenecekse
  adSoyad?: string // gösterim için çözümlenmiş değer
  unvan?: string
  paralel?: boolean // komisyon imzaları gibi
  vekaleten?: 'a.' | 'v.' // adına / vekâleten imza
  durum?: 'bekliyor' | 'onayladi' | 'reddetti' | 'atlandi'
  islemTarihi?: string
}

export interface EbysTemplateVariables {
  kurumAdi: string
  birimAdi: string
  sayi: string
  tarih: string
  konu: string
  muhatap: string
  muhatapEk?: string
  ilgi?: string
  metin: string
  sonucParagrafi: string
  imzaAdi: string
  imzaUnvani: string
  imzaTuru?: string
  ekler?: string[]
  dagitimGeregi?: string[]
  dagitimBilgi?: string[]
  uygunGorusAdi?: string
  uygunGorusUnvani?: string
  olurMakamAdi?: string
  olurMakamUnvani?: string
  olurTarihi?: string
  iletisimAdres?: string
  iletisimTelefon?: string
  iletisimFaks?: string
  iletisimEposta?: string
  iletisimKep?: string
  iletisimWeb?: string
  bilgiIcinAdi?: string
  bilgiIcinUnvani?: string
  evrakDogrulamaKodu?: string
  muhatapKaydi?: EbysMuhatap
  dagitim?: EbysDagitimKalemi[]
  rota?: EbysRotaAdimi[]
}

export interface EbysTemplate {
  id: string
  name: string
  category: EbysCategory
  categoryLabel: string
  description: string
  sourceUrl: string
  sourceType:
    | 'Resmî Mevzuat'
    | 'Kamu EBYS Kılavuzu'
    | 'e-Yazışma Rehberi'
    | 'Belediye / Bakanlık Şablonu'
  format: 'HTML/CSS' | 'EBYS Şablonu' | 'EYP 2.0'
  license: string
  complianceNotes: string[]
  defaultVariables: EbysTemplateVariables
  isMultiPage?: boolean
  generateHtml: (vars: EbysTemplateVariables) => string
  generateCss: () => string
}

export interface EbysResource {
  name: string
  url: string
  type: string
  format: string
  license: string
  isOfficial: boolean
  description: string
}
