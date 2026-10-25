/**
 * Uygulama sürümü (edition).
 *
 * - `full`            : Tüm modüller (4734 m.22/d, 4734 ihale, 2886, EBYS, Personel izin vb.)
 * - `dogrudan-temin`  : Yalnızca 4734 sayılı Kanun m.22 (Doğrudan Temin) kapsamındaki veriler.
 *
 * Sürüm derleme anında `electron-vite build --mode dogrudan-temin` ile seçilir
 * (bkz. electron.vite.config.ts → `VITE_APP_EDITION`).
 */
export type AppEdition = 'full' | 'dogrudan-temin'

const rawEdition =
  (typeof process !== 'undefined' && process.env?.VITE_APP_EDITION) ||
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_APP_EDITION

export const APP_EDITION: AppEdition = rawEdition === 'dogrudan-temin' ? 'dogrudan-temin' : 'full'

/** Yalnızca Doğrudan Temin (4734 m.22) sürümü mü? */
export const IS_DT_EDITION: boolean = APP_EDITION === 'dogrudan-temin'

/** Doğrudan Temin sürümünde kullanılabilen modül paketleri (ModulPaketi.id). */
export const DT_EDITION_MODULE_IDS: readonly string[] = ['kik-dogrudan-temin-22d']

/** Doğrudan Temin sürümünde kullanılamayan rotalar (2886 ve EBYS kapsam dışı). */
export const DT_EDITION_BLOCKED_ROUTES: readonly string[] = ['/devlet-ihale-2886', '/ebys']

/** Verilen modül bu sürümde kullanılabilir mi? */
export function isModuleAllowedInEdition(moduleId: string): boolean {
  return !IS_DT_EDITION || DT_EDITION_MODULE_IDS.includes(moduleId)
}
