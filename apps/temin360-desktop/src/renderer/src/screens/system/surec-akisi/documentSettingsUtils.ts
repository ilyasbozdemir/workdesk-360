import type {
  MuhatapHiyerarsi,
  DocumentEvrakSettings,
  DocumentValidationResult,
  EvrakIlgiKalemi,
  EvrakEkKalemi
} from './documentSettings.types'
import type { TemplateType } from '@temin360/document-templates'

/**
 * Hiyerarşiye göre Resmî Yazışma Yönetmeliği kapanış ibaresini belirler.
 * - Üst makama: "Arz ederim."
 * - Eş makama: "Rica ederim." veya "Arz ve rica ederim."
 * - Alt makama: "Rica ederim."
 */
export function kapanisIbaresi(hiyerarsi?: MuhatapHiyerarsi): string {
  switch (hiyerarsi) {
    case 'ust':
      return 'Arz ederim.'
    case 'es':
      return 'Rica ederim.'
    case 'alt':
      return 'Rica ederim.'
    default:
      return 'Arz ederim.'
  }
}

/**
 * Dağıtım listesindeki kayıtları gereği ve bilgi olarak ayıran yardımcı fonksiyon
 */
export function dagitimdanAlanlar(dagitimListesi?: DocumentEvrakSettings['dagitimListesi']): {
  geregi: string[]
  bilgi: string[]
} {
  const geregi: string[] = []
  const bilgi: string[] = []

  if (!dagitimListesi || !Array.isArray(dagitimListesi)) {
    return { geregi, bilgi }
  }

  dagitimListesi.forEach((item) => {
    const text = item.muhatap?.hitap || ''
    if (!text) return
    if (item.tur === 'gereği') {
      geregi.push(text)
    } else {
      bilgi.push(text)
    }
  })

  return { geregi, bilgi }
}

/**
 * Dosyadaki önceki belgelerin başlık ve tarih bilgilerinden olası ilgi önerileri üretir
 */
export function ilgiOner(
  oncekiBelgeler: Array<{ id: string; baslik?: string; tarih?: string; sayi?: string }>,
  currentDocId?: string
): EvrakIlgiKalemi[] {
  if (!Array.isArray(oncekiBelgeler)) return []

  return oncekiBelgeler
    .filter((b) => b.id !== currentDocId)
    .map((b) => {
      const parts: string[] = []
      if (b.tarih) parts.push(`${b.tarih} tarihli`)
      if (b.sayi) parts.push(`${b.sayi} sayılı`)
      parts.push(b.baslik || b.id)
      return {
        id: `ilgi-${b.id}`,
        metin: `${parts.join(' ')} yazısı.`,
        tarih: b.tarih,
        sayi: b.sayi,
        onaylandi: false
      }
    })
}

/**
 * Alım türüne ve şablona göre önerilen ek evrak listesi üretir
 */
export function ekOner(alimTuru?: string, currentDocId?: string): EvrakEkKalemi[] {
  const commonEkler: Record<string, string[]> = {
    'luzum-muzekkeresi': [
      'İhtiyaç Malzeme Listesi',
      'Teknik Şartname Taslağı',
      'Piyasa Ön Araştırma Notu'
    ],
    'dogrudan-temin-onay-belgesi': [
      'Piyasa Fiyat Araştırma Tutanağı',
      'Yaklaşık Maliyet Hesap Cetveli',
      'Birim Fiyat Teklif Mektupları'
    ],
    'odeme-yazisi': [
      'Fatura Aslı / e-Arşiv Fatura',
      'Muayene ve Kabul Tutanağı',
      'Taşınır İşlem Fişi (TİF)'
    ]
  }

  const list = (currentDocId && commonEkler[currentDocId]) || [
    'Şartname / Açıklama Belgesi',
    'Fiyat Araştırma Evrakı'
  ]

  return list.map((ad, idx) => ({
    id: `ek-${idx + 1}`,
    ad,
    adet: 1,
    tur: 'Belge',
    onaylandi: false
  }))
}

/**
 * Belge ayarlarını DATA_DosyaSablonVeri.veri_json içindeki _evrak anahtarına birleştirir.
 */
export function mergeEvrakSettings(
  existingVeriJson: string | Record<string, any> | undefined | null,
  newEvrakSettings: DocumentEvrakSettings
): string {
  let baseData: Record<string, any> = {}

  if (typeof existingVeriJson === 'string') {
    try {
      baseData = JSON.parse(existingVeriJson)
    } catch {
      baseData = {}
    }
  } else if (existingVeriJson && typeof existingVeriJson === 'object') {
    baseData = { ...existingVeriJson }
  }

  const existingEvrak = (baseData._evrak as DocumentEvrakSettings) || {}

  const mergedEvrak: DocumentEvrakSettings = {
    ...existingEvrak,
    ...newEvrakSettings,
    sonGuncelleme: new Date().toISOString()
  }

  const updatedData = {
    ...baseData,
    _evrak: mergedEvrak
  }

  return JSON.stringify(updatedData)
}

/**
 * Belge ayarlarının eksiklik durumunu denetleyen saf fonksiyon.
 * Kurallar:
 * 1. supportsMuhatap true ise ve routing external veya firma ise: muhatap boşsa uyarı verir ("muhatap boş")
 * 2. supportsRota true ise: rota onayı veya adımı yoksa uyarı verir ("rota onaylanmadı")
 */
export function validateDocumentSettings(
  docId: string,
  evrak?: DocumentEvrakSettings,
  template?: TemplateType
): DocumentValidationResult {
  const warnings: string[] = []
  const missingFields: DocumentValidationResult['missingFields'] = []

  const caps = template?.capabilities
  const routing = template?.workflow?.routing

  // 1. Muhatap Eksikliği Kontrolü
  if (caps?.supportsMuhatap) {
    const isExternalOrFirma = routing?.mode === 'external' || routing?.mode === 'firma'
    if (isExternalOrFirma && (!evrak?.muhatap?.hitap || evrak.muhatap.hitap.trim() === '')) {
      warnings.push('muhatap boş')
      missingFields.push('muhatap')
    }
  }

  // 2. Rota Onayı Kontrolü
  if (caps?.supportsRota) {
    if (!evrak?.rotaOnaylandi && (!evrak?.rotaAdimlari || evrak.rotaAdimlari.length === 0)) {
      warnings.push('rota onaylanmadı')
      missingFields.push('rota')
    }
  }

  return {
    docId,
    isValid: warnings.length === 0,
    warnings,
    missingFields
  }
}
