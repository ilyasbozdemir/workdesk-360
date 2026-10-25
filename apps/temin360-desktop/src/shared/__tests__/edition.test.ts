import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEdition(): Promise<typeof import('../edition')> {
  vi.resetModules()
  return import('../edition')
}

describe('edition (sürüm bayrağı)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('temin360-desktop uygulamasında varsayılan doğrudan-temin sürümüdür', async () => {
    const e = await loadEdition()
    expect(e.APP_EDITION).toBe('dogrudan-temin')
    expect(e.IS_DT_EDITION).toBe(true)
    expect(e.isModuleAllowedInEdition('kik-dogrudan-temin-22d')).toBe(true)
    expect(e.isModuleAllowedInEdition('dik-devlet-ihale-2886')).toBe(false)
    expect(e.isModuleAllowedInEdition('ebys-resmi-yazisma-studyosu')).toBe(false)
    expect(e.isModuleAllowedInEdition('modul-personel-izin')).toBe(false)
    expect(e.DT_EDITION_BLOCKED_ROUTES).toEqual(['/devlet-ihale-2886', '/ebys'])
  })

  it('VITE_APP_EDITION=full verildiğinde tam sürüm davranışını korur', async () => {
    vi.stubEnv('VITE_APP_EDITION', 'full')
    const e = await loadEdition()
    expect(e.APP_EDITION).toBe('full')
    expect(e.IS_DT_EDITION).toBe(false)
    expect(e.isModuleAllowedInEdition('dik-devlet-ihale-2886')).toBe(true)
  })
})
