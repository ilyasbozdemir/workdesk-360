export const PRINTER_PREFERENCES_KEY = 'temin_printer_preferences'

export interface PersistedPrinterPreferences {
  printerName?: string
  copies?: number
  orientation?: 'portrait' | 'landscape'
  color?: boolean
  silent?: boolean
}

export function loadPrinterPreferences(): PersistedPrinterPreferences {
  try {
    const raw = localStorage.getItem(PRINTER_PREFERENCES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('[PrinterPreferences] Tercihler okunamadı:', e)
  }
  return {}
}

export function savePrinterPreferences(prefs: Partial<PersistedPrinterPreferences>): void {
  try {
    const existing = loadPrinterPreferences()
    const merged: PersistedPrinterPreferences = { ...existing, ...prefs }
    localStorage.setItem(PRINTER_PREFERENCES_KEY, JSON.stringify(merged))

    // Veritabanına asenkron olarak yedekle (varsa)
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke(
        'db:run',
        `INSERT OR REPLACE INTO DATA_KullaniciAyar (ayar_key, ayar_val, updated_at)
         VALUES ('printer_preferences', ?, datetime('now', 'localtime'))`,
        [JSON.stringify(merged)]
      )
    }
  } catch (e) {
    console.warn('[PrinterPreferences] Tercihler kaydedilemedi:', e)
  }
}
