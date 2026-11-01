import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DocumentRenderer, InvalidTemplateKeyError } from '@worksuite-360/document-engine'

describe('DocumentRenderer Runtime Rendering & Template Validation', () => {
  it('geçerli şablon ve veri ile tip güvenliği doğrulanmalı ve DOM üretilmeli', () => {
    // 1. Doğru kullanım: luzum_muzekkeresi geçerli verisiyle DOM üretilir
    const { container } = render(
      <DocumentRenderer
        templateKey="luzum_muzekkeresi"
        data={{
          idareAdi: 'İstanbul İl Sağlık Müdürlüğü',
          gerekce: 'Tıbbi sarf malzeme ihtiyacı'
        }}
        chrome="bare"
      />
    )

    expect(container.querySelector('.document-renderer-bare')).not.toBeNull()
    const page = container.querySelector('[data-document-page="true"]')
    expect(page).not.toBeNull()
    expect(page?.getAttribute('data-template-key')).toBe('luzum_muzekkeresi')
  })

  it('paper chrome modunda ve ölçekleme değerinde doğru sarmalayıcı yapı üretilmeli', () => {
    const { container } = render(
      <DocumentRenderer
        templateKey="ihtiyac_listesi"
        data={{
          idareAdi: 'Destek Hizmetleri Dairesi'
        }}
        chrome="paper"
        scale={0.8}
      />
    )

    const page = container.querySelector('[data-document-page="true"]')
    expect(page).not.toBeNull()
    expect(page?.getAttribute('data-template-key')).toBe('ihtiyac_listesi')
  })

  it('kayıtlı olmayan geçersiz şablon anahtarı verildiğinde InvalidTemplateKeyError fırlatmalı', () => {
    expect(() => {
      render(<DocumentRenderer templateKey="gecersiz_olmayan_anahtar" data={{}} />)
    }).toThrow(InvalidTemplateKeyError)
  })
})
