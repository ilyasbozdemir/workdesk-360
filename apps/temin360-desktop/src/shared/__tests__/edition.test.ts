import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEdition(): Promise<typeof import('../edition')> {
  vi.resetModules()
  return import('../edition')
}

describe('edition (sürüm bayrağı)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('varsayılan olarak tam sürümdür ve tüm modüller serbesttir', async () => {
    const e = await loadEdition()
    expect(e.APP_EDITION).toBe('full')
    expect(e.IS_DT_EDITION).toBe(false)
    expect(e.isModuleAllowedInEdition('dik-devlet-ihale-2886')).toBe(true)
  })

  it('dogrudan-temin sürümünde yalnızca 4734 m.22 modülüne izin verir', async () => {
    vi.stubEnv('VITE_APP_EDITION', 'dogrudan-temin')
    const e = await loadEdition()
    expect(e.IS_DT_EDITION).toBe(true)
    expect(e.isModuleAllowedInEdition('kik-dogrudan-temin-22d')).toBe(true)
    expect(e.isModuleAllowedInEdition('dik-devlet-ihale-2886')).toBe(false)
    expect(e.isModuleAllowedInEdition('ebys-resmi-yazisma-studyosu')).toBe(false)
    expect(e.isModuleAllowedInEdition('modul-personel-izin')).toBe(false)
    expect(e.DT_EDITION_BLOCKED_ROUTES).toEqual(['/devlet-ihale-2886', '/ebys'])
  })
})
