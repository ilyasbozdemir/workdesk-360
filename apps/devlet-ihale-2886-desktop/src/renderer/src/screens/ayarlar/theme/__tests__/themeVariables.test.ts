import { describe, it, expect } from 'vitest'
import {
  parseCssVariables,
  stringifyCssVariables,
  parseRgba,
  toRgbaStr,
  themeVariablesMeta
} from '../themeVariables'
import { THEME_PRESETS } from '../themePresets'

describe('TemaScreen Modularization', () => {
  it('correctly parses and stringifies CSS variables', () => {
    const rawCss = '--primary-100: #e4e4e7;\n--text-100: #09090b;'
    const parsed = parseCssVariables(rawCss)
    expect(parsed['--primary-100']).toBe('#e4e4e7')
    expect(parsed['--text-100']).toBe('#09090b')

    const stringified = stringifyCssVariables(parsed)
    expect(stringified).toContain('--primary-100: #e4e4e7;')
    expect(stringified).toContain('--text-100: #09090b;')
  })

  it('handles rgba to hex and back conversion', () => {
    const rgba = 'rgba(255, 128, 0, 0.5)'
    const parsed = parseRgba(rgba)
    expect(parsed.isRgba).toBe(true)
    expect(parsed.opacity).toBe(0.5)

    const reconstructed = toRgbaStr(parsed.hex, parsed.opacity)
    expect(reconstructed).toBe('rgba(255, 128, 0, 0.5)')
  })

  it('provides all default theme variable metadata definitions', () => {
    expect(themeVariablesMeta.length).toBeGreaterThanOrEqual(15)
    const keys = themeVariablesMeta.map((v) => v.key)
    expect(keys).toContain('--primary-100')
    expect(keys).toContain('--bg-100')
    expect(keys).toContain('--sidebar-bg')
  })

  it('contains expected presets with light and dark themes', () => {
    expect(Object.keys(THEME_PRESETS)).toContain('turkuaz')
    expect(Object.keys(THEME_PRESETS)).toContain('yesil')
    expect(THEME_PRESETS.turkuaz.light).toContain('--primary-100')
  })
})
