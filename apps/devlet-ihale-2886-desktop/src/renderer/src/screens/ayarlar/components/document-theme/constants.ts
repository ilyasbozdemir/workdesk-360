export const FONT_OPTIONS = [
  { label: 'Times New Roman (Resmi Standart)', value: "'Times New Roman', Times, serif" },
  { label: 'Arial (Sade / Modern)', value: 'Arial, Helvetica, sans-serif' },
  {
    label: 'Calibri (Kurumsal)',
    value: 'Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif'
  },
  { label: 'Inter (Dijital / Net)', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { label: 'Georgia (Zarif Serif)', value: 'Georgia, serif' },
  { label: 'DejaVu Sans (Açık Kaynak)', value: "'DejaVu Sans', sans-serif" }
]

export type DocumentThemeSectionType = 'typography' | 'page' | 'colors' | 'table' | 'spacing'
