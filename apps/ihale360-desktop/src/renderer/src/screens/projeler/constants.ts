export const COLOR_PRESETS = [
  '#3b82f6', // Mavi
  '#10b981', // Zümrüt Yeşili
  '#8b5cf6', // Mor
  '#f59e0b', // Kehribar
  '#ef4444', // Kırmızı
  '#06b6d4', // Camgöbeği
  '#ec4899', // Pembe
  '#6366f1' // İndigo
]

export const DURUM_CONFIG: Record<
  'planlama' | 'devam' | 'tamamlandi',
  { label: string; color: string }
> = {
  planlama: {
    label: 'Planlama Aşamasında',
    color:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  devam: {
    label: 'Devam Ediyor',
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  tamamlandi: {
    label: 'Tamamlandı',
    color:
      'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  }
}

export const generateDefaultProjectCode = (): string => {
  return `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
}
