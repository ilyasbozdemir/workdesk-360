import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DocumentRenderer } from '../DocumentRenderer'

describe('DocumentRenderer Compile-Time Type Safety & Runtime Rendering', () => {
  it('geçerli şablon ve veri ile tip güvenliği doğrulanmalı ve DOM üretilmeli', () => {
    // 1. Doğru kullanım: luzum_muzekkeresi geçerli verisiyle tipi sorunsuz derlenir
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

  it('TypeScript derleme aşamasında geçersiz şablon anahtarını ve uyumsuz veriyi reddetmeli', () => {
    // 2. Tip güvenliği: Geçersiz şablon anahtarı verildiğinde TypeScript compile hatası üretir
    // @ts-expect-error - 'gecersiz_olmayan_anahtar' geçerli bir TemplateKey değildir
    const _invalidKeyTest = <DocumentRenderer templateKey="gecersiz_olmayan_anahtar" data={{}} />
    expect(_invalidKeyTest).toBeDefined()

    // 3. Tip güvenliği: Yanlış şablona uyumsuz data tipi verildiğinde TypeScript compile hatası üretir
    const _invalidDataTypeTest = (
      <DocumentRenderer
        templateKey="luzum_muzekkeresi"
        // @ts-expect-error - number tipi LuzumMuzekkeresi data nesnesi olarak verilemez
        data={12345}
      />
    )
    expect(_invalidDataTypeTest).toBeDefined()

    // 4. Tip güvenliği: String tipinde uyumsuz veri verildiğinde TypeScript compile hatası üretir
    const _invalidStringDataTest = (
      <DocumentRenderer
        templateKey="ihtiyac_listesi"
        // @ts-expect-error - string tipi IhtiyacListesi data nesnesi olarak verilemez
        data="gecersiz_string_veri"
      />
    )
    expect(_invalidStringDataTest).toBeDefined()
  })
})
