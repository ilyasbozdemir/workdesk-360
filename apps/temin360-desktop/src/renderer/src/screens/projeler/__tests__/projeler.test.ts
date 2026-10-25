import { describe, it, expect } from 'vitest'
import { COLOR_PRESETS, DURUM_CONFIG, generateDefaultProjectCode } from '../constants'

describe('projeler constants and helpers', () => {
  it('generateDefaultProjectCode produces valid project code', () => {
    const code = generateDefaultProjectCode()
    const currentYear = new Date().getFullYear().toString()
    expect(code.startsWith('PRJ-')).toBe(true)
    expect(code).toContain(currentYear)
  })

  it('COLOR_PRESETS has preset hex colors', () => {
    expect(COLOR_PRESETS.length).toBeGreaterThanOrEqual(5)
    for (const color of COLOR_PRESETS) {
      expect(color.startsWith('#')).toBe(true)
    }
  })

  it('DURUM_CONFIG covers all statuses with labels and colors', () => {
    expect(DURUM_CONFIG.planlama.label).toBe('Planlama Aşamasında')
    expect(DURUM_CONFIG.devam.label).toBe('Devam Ediyor')
    expect(DURUM_CONFIG.tamamlandi.label).toBe('Tamamlandı')
  })
})
