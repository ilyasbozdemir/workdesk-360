import { describe, it, expect } from 'vitest'
import { TemplateRegistry } from '@worksuite-360/document-engine'
import { registerTeminTemplates } from '../engine/registerTeminTemplates'
import { templateRegistry } from '../registry'

describe('registerTeminTemplates alias', () => {
  it('her şablonun definition.id değeri registry üzerinden çözümlenir', () => {
    const reg = new TemplateRegistry()
    registerTeminTemplates(reg)
    for (const def of Object.values(templateRegistry) as any[]) {
      expect(reg.has(def.id), def.id).toBe(true)
    }
    expect(reg.get('luzum-muzekkeresi-onay-eki')).toBe(reg.get('luzum_onay_eki'))
  })
})
