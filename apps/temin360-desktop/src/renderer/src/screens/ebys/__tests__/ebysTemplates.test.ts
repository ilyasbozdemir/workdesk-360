import { describe, it, expect } from 'vitest'
import { EBYS_TEMPLATES } from '../data/ebysTemplates.data'
import { EBYS_RESOURCES } from '../data/ebysMevzuat.data'

describe('EBYS Resmî Yazışma Şablonları Testleri', () => {
  it('En az 8 adet temel Türkçe EBYS şablonu tanımlı olmalıdır', () => {
    expect(EBYS_TEMPLATES.length).toBeGreaterThanOrEqual(8)
  })

  it('Tüm şablonlar geçerli ID, isim, kategori ve complianceNotes taşımalıdır', () => {
    EBYS_TEMPLATES.forEach((tpl) => {
      expect(tpl.id).toBeTruthy()
      expect(tpl.name).toBeTruthy()
      expect(tpl.category).toBeTruthy()
      expect(tpl.complianceNotes.length).toBeGreaterThan(0)
      expect(tpl.defaultVariables.kurumAdi).toBeTruthy()
      expect(tpl.defaultVariables.sayi).toBeTruthy()
    })
  })

  it('HTML ve CSS üretimi geçerli ve Türkçe karakter uyumlu olmalıdır', () => {
    const standartTpl = EBYS_TEMPLATES.find((t) => t.id === 'ust_yazi_standart')
    expect(standartTpl).toBeDefined()
    if (!standartTpl) return

    const html = standartTpl.generateHtml(standartTpl.defaultVariables)
    const css = standartTpl.generateCss()

    expect(html).toContain('T.C.')
    expect(html).toContain(standartTpl.defaultVariables.kurumAdi)
    expect(html).toContain(standartTpl.defaultVariables.sayi)
    expect(html).toContain('ebys-a4-page')
    expect(css).toContain('Times New Roman')
  })

  it('Resmî mevzuat ve e-Yazışma (EYP 2.0) kaynakları eksiksiz olmalıdır', () => {
    expect(EBYS_RESOURCES.length).toBeGreaterThanOrEqual(5)
    const yonetmelik = EBYS_RESOURCES.find((r) => r.isOfficial)
    expect(yonetmelik).toBeDefined()
    expect(yonetmelik?.name).toContain('Resmî Yazışmalarda Uygulanacak Usul ve Esaslar')
  })
})
