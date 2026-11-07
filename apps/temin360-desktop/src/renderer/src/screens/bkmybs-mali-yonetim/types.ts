export type KamuRole =
  | 'satin_alma'
  | 'mali_hizmetler'
  | 'muayene_kabul'
  | 'harcama_yetkilisi'

export interface RoleDefinition {
  id: KamuRole
  title: string
  law: string
  description: string
  badgeColor: string
  permissions: Permission[]
}

export type Permission =
  | 'procurement.prepare'
  | 'procurement.submit'
  | 'budget.view'
  | 'budget.reserve'
  | 'asset.accept'
  | 'asset.register'
  | 'payment.prepare'
  | 'payment.approve'
  | 'payment.export'

export const KAMU_ROLES: Record<KamuRole, RoleDefinition> = {
  satin_alma: {
    id: 'satin_alma',
    title: 'Satın Alma & Piyasa Araştırma',
    law: '4734 KİK',
    description: 'İhtiyaç tespiti, piyasa fiyat araştırması ve yaklaşık maliyet hazırlama yetkisi.',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300',
    permissions: ['procurement.prepare', 'procurement.submit', 'budget.view']
  },
  mali_hizmetler: {
    id: 'mali_hizmetler',
    title: 'Mali Hizmetler & Bütçe Mutemedi',
    law: '5018 & BKMYBS',
    description: 'Bütçe tertibi bloke koyma, yasal kesinti hesaplama, MİF ve ÖEB düzenleme.',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300',
    permissions: ['budget.view', 'budget.reserve', 'payment.prepare', 'payment.export']
  },
  muayene_kabul: {
    id: 'muayene_kabul',
    title: 'Muayene Kabul & TKYS Taşınır Yetkilisi',
    law: 'TKYS Yönetmeliği',
    description: 'Fiziki muayene kabul tutanağı, TİF düzenleme, ambar giriş ve zimmet senetleri.',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300',
    permissions: ['asset.accept', 'asset.register', 'procurement.prepare']
  },
  harcama_yetkilisi: {
    id: 'harcama_yetkilisi',
    title: 'Harcama Yetkilisi & Gerçekleştirme Görevlisi',
    law: '5018 m. 31/33',
    description: 'Tahakkuk cetveli inceleme, harcama talimatı ve Ödeme Emri Belgesi kesin onayı.',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300',
    permissions: ['budget.view', 'payment.approve', 'payment.export']
  }
}

export type BkmybsTabKey = 'butce' | 'limit' | 'mif' | 'tkys' | 'emanet' | 'sozlesme'

export interface ButceTertip {
  id: string
  kurumsalKod: string
  fonksiyonelKod: string
  finansmanKod: string
  ekonomikKod: string
  aciklama: string
  baslangicOdenegi: number
  harcananTutar: number
  blokeEdilenTutar: number
  kullanilabilirOdenek: number
  yil: number
}

export interface KikKotaModel {
  idareTuru: 'buyuksehir' | 'diger'
  esikDeger: number // Örn. 864.500 veya 288.100 (yapılandırılabilir)
  toplamMalHizmetButcesi: number
  yuzde10TavanTutari: number
  gerceklesen22dToplami: number
  kalanKotaTutari: number
  kullanimOrani: number // % cinsinden
  kikIzinRiski: boolean
  birimDagitimlari: {
    birimAdi: string
    tahsisEdilen: number
    harcanan: number
    oran: number
  }[]
}

export interface MifKayit {
  id: string
  mifNo: string
  dosyaId?: number
  dosyaNo?: string
  alacakliUnvan: string
  alacakliVkn: string
  alacakliIban: string
  faturaNo: string
  faturaTarihi: string
  butceTertibi: string
  brutTutar: number
  kdvOrani: number
  kdvTutari: number
  kdvTevkifatOrani?: string // Örn: '5/10' veya 'Yok'
  kdvTevkifatTutari: number
  damgaVergisiOrani: number // Binde 9,48 = 0.00948
  damgaVergisiTutari: number
  kararPuluTutari: number
  digerKesintiler: number
  netOdenecekTutar: number
  durum: 'taslak' | 'bloke_edildi' | 'muayene_tamam' | 'onaylandi' | 'muhasebeye_sevk'
  hazirlayan: string
  onaylayan?: string
  tifNo?: string
  tarih: string
  aciklama: string
}

export interface TkysZimmetKayit {
  id: string
  tifNo: string
  dosyaNo?: string
  malzemeAdi: string
  tasinirKodu: string // 255.02.01 vb.
  miktar: number
  olcuBirimi: string
  birimFiyat: number
  toplamTutar: number
  ambarAdi: string
  zimmetliPersonel?: string
  odaNo?: string
  muayeneKabulTarihi: string
  muayeneRaporNo: string
  durum: 'ambarda' | 'tuketildi' | 'zimmetlendi'
}

export interface EmanetTeminatKayit {
  id: string
  dosyaNo: string
  istekliUnvan: string
  istekliVkn: string
  teminatTuru: 'gecici' | 'kesin' | 'ek_kesin'
  bankaAdi: string
  mektupNo: string
  tutar: number
  vadeTarihi: string
  teyitDurumu: 'teyit_edildi' | 'teyit_bekliyor' | 'gecersiz'
  iadeDurumu: 'emanette' | 'iade_edildi' | 'nakde_cevrilecek'
  alinisTarihi: string
}

export interface SozlesmeTaahhutKayit {
  id: string
  sozlesmeNo: string
  dosyaNo: string
  yukleniciUnvan: string
  yukleniciVkn: string
  sozlesmeTarihi: string
  isBitisTarihi: string
  sozlesmeBedeli: number
  damgaVergisiTutari: number
  hakedisToplami: number
  kalanTaahhut: number
  durum: 'yururlukte' | 'tamamlandi' | 'feshedildi'
}

