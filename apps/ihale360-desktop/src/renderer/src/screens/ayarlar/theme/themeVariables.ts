export interface ThemeConfig {
  name?: string
  light: string
  dark: string
}

export interface VariableMeta {
  key: string
  name: string
  category: 'primary' | 'text-bg' | 'sidebar'
  description: string
  defaultLight: string
  defaultDark: string
}

export const themeVariablesMeta: VariableMeta[] = [
  {
    key: '--primary-100',
    name: 'Birincil Açık/Soft',
    category: 'primary',
    description:
      'Birincil soft renk. Seçili elemanların arka planı, rozet ve aktif kart arka planlarında kullanılır.',
    defaultLight: '#e4e4e7',
    defaultDark: '#27272a'
  },
  {
    key: '--primary-200',
    name: 'Birincil Orta/Odak',
    category: 'primary',
    description:
      'Birincil orta ton. Hover/odaklanma kenarlıkları ve aktif buton gölgelerinde tercih edilir.',
    defaultLight: '#d4d4d8',
    defaultDark: '#3f3f46'
  },
  {
    key: '--primary-300',
    name: 'Birincil Koyu/Kontrast',
    category: 'primary',
    description:
      'Birincil koyu/yüksek kontrast ton. Başlıklar, vurgulanması gereken koyu etiket metinleri için.',
    defaultLight: '#09090b',
    defaultDark: '#f4f4f5'
  },
  {
    key: '--accent-100',
    name: 'Vurgu Soft/İkincil',
    category: 'primary',
    description:
      'Vurgu/İkincil soft renk. Alternatif butonlar, etiketler veya ikincil aktif durumlar için.',
    defaultLight: '#27272a',
    defaultDark: '#fafafa'
  },
  {
    key: '--accent-200',
    name: 'Birincil Eylem Rengi',
    category: 'primary',
    description:
      'Birincil eylem rengi. Kaydet butonları, linkler ve ana eylemlerin arka plan rengi.',
    defaultLight: '#18181b',
    defaultDark: '#f4f4f5'
  },
  {
    key: '--text-100',
    name: 'Ana Metin Rengi',
    category: 'text-bg',
    description: 'Ana okuma metni (koyu/açık).',
    defaultLight: '#09090b',
    defaultDark: '#f4f4f5'
  },
  {
    key: '--text-200',
    name: 'Yardımcı Metin Rengi',
    category: 'text-bg',
    description: 'Açıklama ve alt başlık metinleri.',
    defaultLight: '#71717a',
    defaultDark: '#a1a1aa'
  },
  {
    key: '--bg-100',
    name: 'Ana Arka Plan',
    category: 'text-bg',
    description: 'Ana sayfa arka planı.',
    defaultLight: '#ffffff',
    defaultDark: '#09090b'
  },
  {
    key: '--bg-200',
    name: 'Kutu/Kart Arka Planı',
    category: 'text-bg',
    description: 'Kart ve kutuların arka plan rengi.',
    defaultLight: '#fafafa',
    defaultDark: '#18181b'
  },
  {
    key: '--bg-300',
    name: 'Kenarlık & Girdi Arka Planı',
    category: 'text-bg',
    description: 'Kenarlık çizgileri, buton/input sınırları ve girdi alanlarının arka planları.',
    defaultLight: '#f4f4f5',
    defaultDark: '#09090b'
  },
  {
    key: '--sidebar-bg',
    name: 'Menü Arka Planı',
    category: 'sidebar',
    description: 'Sol menü (Sidebar) arka plan rengi.',
    defaultLight: '#09090b',
    defaultDark: '#09090b'
  },
  {
    key: '--sidebar-text',
    name: 'Menü Metin Rengi',
    category: 'sidebar',
    description: 'Sol menü genel yazı rengi.',
    defaultLight: '#a1a1aa',
    defaultDark: '#a1a1aa'
  },
  {
    key: '--sidebar-border',
    name: 'Menü Sınır Rengi',
    category: 'sidebar',
    description: 'Sol menü sağ sınır çizgisi ve ayraç çizgilerinin rengi.',
    defaultLight: '#27272a',
    defaultDark: '#18181b'
  },
  {
    key: '--sidebar-hover-bg',
    name: 'Menü Hover Arka Planı',
    category: 'sidebar',
    description: 'Sol menü elemanlarının hover durumundaki arka plan rengi.',
    defaultLight: '#27272a',
    defaultDark: '#18181b'
  },
  {
    key: '--sidebar-hover-text',
    name: 'Menü Hover Metin Rengi',
    category: 'sidebar',
    description: 'Sol menü elemanlarının hover durumundaki yazı rengi.',
    defaultLight: '#ffffff',
    defaultDark: '#ffffff'
  },
  {
    key: '--sidebar-active-bg',
    name: 'Menü Aktif Arka Planı',
    category: 'sidebar',
    description: 'Sol menüde seçili olan elemanın aktif arka plan rengi.',
    defaultLight: 'rgba(255, 255, 255, 0.08)',
    defaultDark: 'rgba(255, 255, 255, 0.08)'
  },
  {
    key: '--sidebar-active-text',
    name: 'Menü Aktif Metin Rengi',
    category: 'sidebar',
    description: 'Sol menüde seçili olan elemanın aktif yazı rengi.',
    defaultLight: '#ffffff',
    defaultDark: '#ffffff'
  },
  {
    key: '--sidebar-active-border',
    name: 'Menü Aktif Kenarlık Rengi',
    category: 'sidebar',
    description: 'Sol menüde seçili olan elemanın aktif sol kenarlık çizgisi rengi.',
    defaultLight: 'rgba(255, 255, 255, 0.15)',
    defaultDark: 'rgba(255, 255, 255, 0.15)'
  }
]

// Helper to parse CSS variables from text to an object
export const parseCssVariables = (cssText: string): Record<string, string> => {
  const result: Record<string, string> = {}
  if (!cssText) return result
  const lines = cssText.split('\n')
  lines.forEach((line) => {
    const parts = line.split(':')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join(':').replace(';', '').trim()
      if (key.startsWith('--')) {
        result[key] = value
      }
    }
  })
  return result
}

// Helper to convert an object of CSS variables back to a CSS text block
export const stringifyCssVariables = (vars: Record<string, string>): string => {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n')
}

export const getInitialPlaygroundVars = (
  cssText: string,
  mode: 'light' | 'dark'
): Record<string, string> => {
  const parsed = parseCssVariables(cssText)
  const result: Record<string, string> = {}
  themeVariablesMeta.forEach((v) => {
    result[v.key] = parsed[v.key] || (mode === 'light' ? v.defaultLight : v.defaultDark)
  })
  return result
}

// Helper to parse rgba(r, g, b, a) to hex and opacity
export const parseRgba = (rgbaStr: string): { hex: string; opacity: number; isRgba: boolean } => {
  if (!rgbaStr) return { hex: '#000000', opacity: 1, isRgba: false }
  const match = rgbaStr.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/)
  if (match) {
    const r = parseInt(match[1], 10)
    const g = parseInt(match[2], 10)
    const b = parseInt(match[3], 10)
    const a = parseFloat(match[4])
    const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
    return { hex, opacity: a, isRgba: true }
  }
  return { hex: rgbaStr, opacity: 1, isRgba: false }
}

// Helper to convert hex and opacity back to rgba
export const toRgbaStr = (hex: string, opacity: number): string => {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
