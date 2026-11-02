import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { TemplateRegistry, DocumentRenderer } from '@worksuite-360/document-engine'
import {
  registerTeminTemplates,
  LuzumMuzekkeresiResolver,
  IhtiyacListesiResolver,
  DefaultDocumentResolver
} from '../index'

describe('registerTeminTemplates — IoC Şablon Enjeksiyonu', () => {
  beforeEach(() => {
    TemplateRegistry.clear()
    registerTeminTemplates()
  })

  it('1. Temin 360 şablonlarını TemplateRegistry içine başarıyla enjekte etmelidir', () => {
    expect(TemplateRegistry.has('luzum_muzekkeresi')).toBe(true)
    expect(TemplateRegistry.has('ihtiyac_listesi')).toBe(true)
    expect(TemplateRegistry.has('harcama_talimati')).toBe(true)
    expect(TemplateRegistry.has('piyasa_fiyat_arastirma_tutanagi')).toBe(true)

    const all = TemplateRegistry.getAll()
    expect(all.length).toBeGreaterThan(10)
  })

  it('2. Pilot şablonlar (luzum_muzekkeresi, ihtiyac_listesi) özel resolver ve renderer ile donatılmalıdır', () => {
    const luzumDef = TemplateRegistry.get('luzum_muzekkeresi')
    expect(luzumDef.resolver).toBeInstanceOf(LuzumMuzekkeresiResolver)
    expect(luzumDef.renderer).toBeDefined()

    const ihtiyacDef = TemplateRegistry.get('ihtiyac_listesi')
    expect(ihtiyacDef.resolver).toBeInstanceOf(IhtiyacListesiResolver)
    expect(ihtiyacDef.renderer).toBeDefined()

    const digerDef = TemplateRegistry.get('harcama_talimati')
    expect(digerDef.resolver).toBeInstanceOf(DefaultDocumentResolver)
  })

  it('3. DocumentRenderer kayıtlı şablonları sorunsuz render etmelidir', () => {
    const htmlLuzum = renderToString(
      React.createElement(DocumentRenderer, {
        templateKey: 'luzum_muzekkeresi',
        data: {
          antetSatirlari: ['T.C.', 'ANKARA BÜYÜKŞEHİR BELEDİYESİ'],
          sunulacakMakamAdi: 'GENEL SEKRETERLİK MAKAMINA',
          ihtiyacYeri: 'Destek Hizmetleri Şube Müdürlüğü',
          ihtiyacKalemleri: [
            { siraNo: 1, malzemeAdi: 'A4 Fotokopi Kağıdı', miktar: 50, birimi: 'Koli' }
          ]
        }
      })
    )

    expect(htmlLuzum).toContain('ANKARA BÜYÜKŞEHİR BELEDİYESİ')
    expect(htmlLuzum).toContain('GENEL SEKRETERLİK MAKAMINA')
    expect(htmlLuzum).toContain('Destek Hizmetleri Şube Müdürlüğü')
    expect(htmlLuzum).toContain('A4 Fotokopi Kağıdı')
  })

  it('4. İzole bir TemplateRegistry örneğine de başarıyla enjekte edilebilmelidir', () => {
    const customRegistry = new TemplateRegistry()
    registerTeminTemplates(customRegistry)

    expect(customRegistry.has('luzum_muzekkeresi')).toBe(true)
    expect(customRegistry.has('ihtiyac_listesi')).toBe(true)
  })
})

