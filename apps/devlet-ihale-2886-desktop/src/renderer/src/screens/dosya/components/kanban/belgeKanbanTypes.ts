import { Sablon } from '../../../sablonlar/sablonlar.hooks'

export type BelgeKanbanStatus = 'hazirlanacak' | 'hazirlaniyor' | 'beklemede' | 'tamamlandi'

export interface BelgeKanbanColumnDef {
  status: BelgeKanbanStatus
  title: string
  subtitle: string
  badgeColor: string
  borderColor: string
  headerBg: string
  accentColor: string
}

export const BELGE_KANBAN_COLUMNS: BelgeKanbanColumnDef[] = [
  {
    status: 'hazirlanacak',
    title: 'Hazırlanacak',
    subtitle: 'Henüz Üretilmemiş Şablonlar',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-900/40',
    headerBg: 'bg-amber-50/60 dark:bg-amber-950/20',
    accentColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    status: 'hazirlaniyor',
    title: 'Hazırlanıyor',
    subtitle: 'Taslak & Düzenleme Aşaması',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-900/40',
    headerBg: 'bg-blue-50/60 dark:bg-blue-950/20',
    accentColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    status: 'beklemede',
    title: 'Beklemede',
    subtitle: 'İmza, Onay veya Bilgi Bekliyor',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-900/40',
    headerBg: 'bg-purple-50/60 dark:bg-purple-950/20',
    accentColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    status: 'tamamlandi',
    title: 'Tamamlandı',
    subtitle: 'Hazır, İmzalı & Çıktısı Alınmış',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-900/40',
    headerBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    accentColor: 'text-emerald-600 dark:text-emerald-400'
  }
]

export interface BelgeKanbanItem {
  id: string
  dbId: number | null
  sablonId: number | null
  belgeAdi: string
  dosyaAdi: string
  kategori: string
  durum: BelgeKanbanStatus
  beklemeNedeni: string | null
  isProduced: boolean
  isSigned: boolean
  isLocked: boolean
  missingMsg: string | null
  updatedAt: string | null
  sablon: Sablon | null
}
