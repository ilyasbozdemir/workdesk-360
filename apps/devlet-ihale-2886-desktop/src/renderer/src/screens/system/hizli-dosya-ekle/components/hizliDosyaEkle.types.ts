import {
  TEMIN_TURLERI as CANONICAL_TEMIN_TURLERI,
  teminKisaLabel,
  getTeminTuruDef
} from '../../../../constants/teminTurleri'

export interface DosyaRow {
  _key: string
  id: number | null // null => yeni kayit, number => guncelleme
  dosya_no: string
  dt_no: string
  dosya_adi: string
  aciklama: string
  temin_turu: string // Mal | Hizmet | Yapım İşi | Danışmanlık
  temin_sekli: string // 22/d | 22/a | 22/b | 22/c | 4734 KİK | Diğer
  dosya_acilis_tarihi: string // YYYY-MM-DD
  son_teklif_verme_tarihi: string // YYYY-MM-DDTHH:mm
  teslim_tarihi: string // YYYY-MM-DD (Tahmini Bitiş Tarihi)
  surec_asamasi: string
  _dirty: boolean // kullanici degistirdi mi?
}

// Canonical TEMIN_TURLERI tek kaynaktan (constants/teminTurleri.ts) türetilir
export const TEMIN_TURLERI = CANONICAL_TEMIN_TURLERI.map((t) => t.kisa)
export const TEMIN_SEKILLERI = ['22/d', '22/a', '22/b', '22/c', '4734 KİK', 'Diğer']
export const SUREC_ASAMALARI = [
  'Hazırlık',
  'Piyasa Araştırması',
  'Teklif Aşaması',
  'Sözleşme',
  'Muayene & Kabul & Ödeme',
  'Tamamlandı',
  'İptal'
]

// Geriye dönük uyumluluk aliasları
export const IHALE_TURLERI = TEMIN_TURLERI
export const IHALE_SEKILLERI = TEMIN_SEKILLERI
export const IHALE_ASAMALARI = SUREC_ASAMALARI

export const mapTur = (t: string): string => {
  const def = getTeminTuruDef(t)
  return def ? def.id : 'mal'
}

export const reverseMapTur = (t: string): string => {
  return teminKisaLabel(t, 'Mal')
}

export const mapStatus = (a: string) => {
  if (a === 'Tamamlandı') return 'tamamlandi'
  if (a === 'İptal') return 'iptal'
  return 'devam_ediyor'
}

export const reverseMapStatus = (s: string) => {
  if (s === 'tamamlandi') return 'Tamamlandı'
  if (s === 'iptal') return 'İptal'
  return 'Hazırlık'
}

export const normalizeTeminTuru = (raw?: string | null): string => {
  if (!raw) return 'Mal'
  const lower = raw.trim().toLowerCase()
  if (lower.startsWith('mal')) return 'Mal'
  if (lower.startsWith('hizmet')) return 'Hizmet'
  if (
    lower.startsWith('yap') ||
    lower.includes('yapım') ||
    lower.includes('insaat') ||
    lower.includes('inşaat')
  )
    return 'Yapım İşi'
  if (lower.startsWith('dan') || lower.includes('danışman')) return 'Danışmanlık'
  return teminKisaLabel(raw, 'Mal')
}

export function formatDateOnly(raw?: string | null): string {
  if (!raw) return ''
  const str = String(raw).trim().split('T')[0].split(' ')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const m = str.match(/^(\d{4})\d+-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  // Türkçe format desteği: GG.AA.YYYY veya GG/AA/YYYY veya GG-AA-YYYY
  const trMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (trMatch) {
    const dd = trMatch[1].padStart(2, '0')
    const mm = trMatch[2].padStart(2, '0')
    const yyyy = trMatch[3]
    return `${yyyy}-${mm}-${dd}`
  }

  return ''
}

export function formatDateTimeLocal(raw?: string | null): string {
  if (!raw) return ''
  const str = String(raw).trim()

  // Türkçe format desteği: GG.AA.YYYY HH:mm veya GG/AA/YYYY HH:mm
  const trMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2})(?::(\d{1,2}))?)?/)
  if (trMatch) {
    const dd = trMatch[1].padStart(2, '0')
    const mm = trMatch[2].padStart(2, '0')
    const yyyy = trMatch[3]
    const hh = (trMatch[4] || '10').padStart(2, '0')
    const min = (trMatch[5] || '00').padStart(2, '0')
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  const isoClean = str.replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoClean)) {
    return `${isoClean}T10:00`
  }
  const standardMatch = isoClean.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (standardMatch) {
    return `${standardMatch[1]}-${standardMatch[2]}-${standardMatch[3]}T${standardMatch[4]}:${standardMatch[5]}`
  }
  const malformedMatch = isoClean.match(/^(\d{4})\d+-(\d{2})-(\d{2})(?:T(\d{1,2})(?::(\d{1,2}))?)?/)
  if (malformedMatch) {
    const hh = (malformedMatch[4] || '10').padStart(2, '0')
    const mm = (malformedMatch[5] || '00').padStart(2, '0')
    return `${malformedMatch[1]}-${malformedMatch[2]}-${malformedMatch[3]}T${hh}:${mm}`
  }
  return ''
}

export function getDefaultDates() {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const d7 = new Date(now)
  d7.setDate(d7.getDate() + 7)
  const sonTeklifStr = `${d7.toISOString().split('T')[0]}T10:00`

  const d15 = new Date(now)
  d15.setDate(d15.getDate() + 15)
  const bitisStr = d15.toISOString().split('T')[0]

  return {
    dosya_acilis_tarihi: todayStr,
    son_teklif_verme_tarihi: sonTeklifStr,
    teslim_tarihi: bitisStr
  }
}

export const emptyRow = (customDefaults?: Partial<DosyaRow>): DosyaRow => {
  const dates = getDefaultDates()
  return {
    _key: Math.random().toString(36).slice(2),
    id: null,
    dosya_no: '',
    dt_no: '',
    dosya_adi: '',
    aciklama: '',
    temin_turu: 'Mal',
    temin_sekli: '22/d',
    dosya_acilis_tarihi: customDefaults?.dosya_acilis_tarihi ?? dates.dosya_acilis_tarihi,
    son_teklif_verme_tarihi:
      customDefaults?.son_teklif_verme_tarihi ?? dates.son_teklif_verme_tarihi,
    teslim_tarihi: customDefaults?.teslim_tarihi ?? dates.teslim_tarihi,
    surec_asamasi: 'Hazırlık',
    _dirty: false,
    ...customDefaults
  }
}
