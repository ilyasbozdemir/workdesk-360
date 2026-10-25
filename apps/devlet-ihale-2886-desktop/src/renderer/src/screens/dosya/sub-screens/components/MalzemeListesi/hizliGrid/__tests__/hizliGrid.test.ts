import { describe, it, expect } from 'vitest'
import { PRESET_PACKAGES } from '../presetPackages.data'

describe('HizliTopluKalemGrid preset packages', () => {
  it('PRESET_PACKAGES has essential preset templates', () => {
    expect(PRESET_PACKAGES.length).toBeGreaterThanOrEqual(4)
    const names = PRESET_PACKAGES.map((p) => p.name)
    expect(names.some((n) => n.includes('Kırtasiye'))).toBe(true)
    expect(names.some((n) => n.includes('Temizlik'))).toBe(true)
  })

  it('each preset package contains items with valid properties', () => {
    for (const pkg of PRESET_PACKAGES) {
      expect(pkg.items.length).toBeGreaterThan(0)
      for (const item of pkg.items) {
        expect(item.kalem_adi).toBeTruthy()
        expect(item.miktar).toBeGreaterThan(0)
        expect(item.birim).toBeTruthy()
      }
    }
  })
})
