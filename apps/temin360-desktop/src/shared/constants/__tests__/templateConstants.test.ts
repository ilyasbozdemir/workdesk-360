import { describe, it, expect } from 'vitest'
import { TEMPLATE_NAMES } from '../templateConstants'

describe('Template Constants & Metadata Integrity', () => {
  it('should define non-empty mapping for TEMPLATE_NAMES', () => {
    expect(Object.keys(TEMPLATE_NAMES).length).toBeGreaterThan(0)
  })

  it('should map core templates to non-empty Turkish title strings', () => {
    expect(TEMPLATE_NAMES['harcama-talimati']).toContain('HARCAMA TALİMATI')
    expect(TEMPLATE_NAMES['ihtiyac-listesi']).toContain('İHTİYAÇ LİSTESİ')
    expect(TEMPLATE_NAMES['piyasa-fiyat-arastirma-tutanagi']).toContain('PİYASA FİYAT ARAŞTIRMA')
    expect(TEMPLATE_NAMES['dogrudan-temin-onay-belgesi']).toContain('DOĞRUDAN TEMİN ONAY BELGESİ')
  })

  it('should ensure all mapped values are non-empty strings', () => {
    for (const [key, value] of Object.entries(TEMPLATE_NAMES)) {
      expect(key.length).toBeGreaterThan(0)
      expect(typeof value).toBe('string')
      expect(value.trim().length).toBeGreaterThan(0)
    }
  })
})
