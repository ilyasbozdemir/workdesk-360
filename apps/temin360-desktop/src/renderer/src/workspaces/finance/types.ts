export interface BudgetTertipItem {
  id: string
  tertipKodu: string // Örn: 06.01.00.02 - 01.3.9.00 - 1 - 03.2.1.01
  tertipAdi: string
  kurumsalKod: string
  fonksiyonelKod: string
  finansmanKod: string
  ekonomikKod: string
  baslangicOdenegi: number
  eklenenOdenek: number
  aktarilanOdenek: number
  toplamOdenek: number
  harcananTutar: number
  blokeTutar: number
  kalanSerbest: number
  dolulukOrani: number
}

export interface FinancialComplianceItem {
  id: string
  birimAdi: string
  yillikOdenek: number
  kikTavanOrani: number // %10
  kikTavanTutari: number
  kullanilanDtTutari: number
  kalanDtTutari: number
  kullanimOrani: number
  riskDurumu: 'guvenli' | 'uyari' | 'kritik' | 'asildi'
}

export interface IncomingProcurementItem {
  id: number
  dosyaNo: string
  konu: string
  harcamaBirimi: string
  aliciTur: 'mal' | 'hizmet' | 'yapim'
  kazananFirma: string
  kazananVergiNo: string
  kazananIban: string
  brutTutar: number
  damgaVergisi: number // ‰ 9,48
  kararPulu: number // ‰ 5,69
  kdvTevkifati: number
  netOdenecek: number
  butceTertibi?: string
  mifDurumu: 'bekliyor' | 'taslak' | 'onaylandi' | 'muhasebelesti'
  oebDurumu: 'hazirlanmadi' | 'taslak' | 'imza_bekliyor' | 'odendi'
  tifDurumu: 'gerekmiyor' | 'bekliyor' | 'tamamlandi'
  tarih: string
  oncelik: 'normal' | 'acil' | 'onemli'
}

export interface MifRecordItem {
  id: string
  mifNo: string
  dosyaId?: number
  dosyaNo?: string
  duzenlemeTarihi: string
  harcamaBirimi: string
  borcluHesap: string
  alacakliHesap: string
  tutar: number
  aciklama: string
  durum: 'taslak' | 'incelemede' | 'onaylandi' | 'yevmiyede'
  hazirlayan: string
}

export interface OebRecordItem {
  id: string
  oebNo: string
  dosyaId?: number
  dosyaNo: string
  harcamaBirimi: string
  hakSahibiAdi: string
  hakSahibiVkn: string
  hakSahibiIban: string
  brutTutar: number
  damgaVergisi: number
  kararPulu: number
  kdvTevkifat: number
  digerKesinti: number
  toplamKesinti: number
  netOdenecekTutar: number
  butceTertibi: string
  odemeTuru: string
  durum: 'taslak' | 'kontrol_edildi' | 'harcama_yetkilisinde' | 'e_imzali' | 'odendi'
  onaylayan?: string
  tarih: string
}

export interface GuaranteeItem {
  id: string
  dosyaNo: string
  istekliFirma: string
  teminatTuru: 'gecici' | 'kesin' | 'ek_kesin'
  tutar: number
  bankaAdi: string
  mektupNo: string
  vadeTarihi: string
  kalanGun: number
  teyitDurumu: 'teyit_edildi' | 'bekliyor' | 'red'
  durum: 'aktif' | 'iade_edildi' | 'nakde_cevrildi' | 'hukuki_surec'
}

export interface AccountingRecordItem {
  id: string
  yevmiyeNo: string
  tarih: string
  mifNo: string
  hesapKodu: string
  hesapAdi: string
  borc: number
  alacak: number
  aciklama: string
  durum: 'taslak' | 'kesinlesti'
}

