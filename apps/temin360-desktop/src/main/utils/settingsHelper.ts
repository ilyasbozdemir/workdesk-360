import { workspaceManager } from '../database/workspace'

/**
 * Veritabanındaki 'settings' tablosundan belirtilen anahtarın değerini çeker.
 */
export function getSetting(key: string, defaultValue: string = ''): string {
  try {
    const db = workspaceManager.getDb()
    if (!db) return defaultValue
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      | { value?: string }
      | undefined
    return row?.value !== undefined && row?.value !== null ? row.value : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * İki alternatif anahtar adından (camelCase veya snake_case) birini arayarak ayar değerini çeker.
 */
export function getSmtpSetting(k1: string, k2: string, defaultValue: string = ''): string {
  try {
    const db = workspaceManager.getDb()
    if (!db) return defaultValue
    const row = db.prepare('SELECT value FROM settings WHERE key = ? OR key = ?').get(k1, k2) as
      | { value?: string }
      | undefined
    return row?.value !== undefined && row?.value !== null ? row.value : defaultValue
  } catch {
    return defaultValue
  }
}
