import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  TemplateRegistry,
  DuplicateTemplateRegistrationError,
  InvalidTemplateKeyError,
  DocumentRenderer,
  DocumentDefinition
} from '../index'

describe('TemplateRegistry — Instance Tabanlı, Generic ve Duplicate Korumalı Mimari', () => {
  beforeEach(() => {
    TemplateRegistry.clear()
  })

  it('1. Registry İzolasyonu: İki bağımsız TemplateRegistry örneği birbirinden tamamen izole çalışmalıdır', () => {
    const regApp1 = new TemplateRegistry()
    const regApp2 = new TemplateRegistry()

    const mockRenderer = (props: any) => React.createElement('div', null, `App: ${props.data.app}`)
    const defApp1: DocumentDefinition = {
      templateKey: 'ihale_ilani',
      name: 'IhaleIlani',
      title: 'İhale İlanı',
      category: 'ihale',
      categoryLabel: 'İhale 360',
      orientation: 'portrait',
      renderer: mockRenderer
    }

    regApp1.register(defApp1)

    // regApp1'de olmalı, regApp2'de ve global default'ta kesinlikle OLMAMALIDIR
    expect(regApp1.has('ihale_ilani')).toBe(true)
    expect(regApp2.has('ihale_ilani')).toBe(false)
    expect(TemplateRegistry.has('ihale_ilani')).toBe(false)

    expect(() => regApp2.get('ihale_ilani')).toThrow(InvalidTemplateKeyError)
  })

  it('2. Duplicate Kayıt Koruması: Aynı şablon anahtarı ikinci kez kaydedilmeye çalışıldığında hata fırlatmalıdır', () => {
    const registry = new TemplateRegistry()
    const mockRenderer = () => React.createElement('div', null, 'Test')

    const def1: DocumentDefinition = {
      templateKey: 'teklif_mektubu',
      name: 'TeklifMektubuV1',
      title: 'Teklif Mektubu V1',
      category: 'teklif',
      categoryLabel: 'Teklifler',
      orientation: 'portrait',
      renderer: mockRenderer
    }

    registry.register(def1)

    const def2: DocumentDefinition = {
      templateKey: 'teklif_mektubu',
      name: 'TeklifMektubuV2',
      title: 'Teklif Mektubu V2',
      category: 'teklif',
      categoryLabel: 'Teklifler',
      orientation: 'portrait',
      renderer: mockRenderer
    }

    // Varsayılan olarak mükerrer kaydı reddetmeli
    expect(() => registry.register(def2)).toThrow(DuplicateTemplateRegistrationError)
    expect(() => registry.register(def2)).toThrowError(/Aynı anahtarla mükerrer kayıt yapılamaz/)

    // allowOverride: true ile üzerine yazmaya izin verilmeli
    expect(() => registry.register(def2, { allowOverride: true })).not.toThrow()
    expect(registry.get('teklif_mektubu').title).toBe('Teklif Mektubu V2')
  })

  it('3. Bilinmeyen Şablon Hatası: Tanımsız veya boş şablon anahtarlarında InvalidTemplateKeyError fırlatmalıdır', () => {
    const registry = new TemplateRegistry()

    expect(() => registry.get('olmayan_sablon')).toThrow(InvalidTemplateKeyError)
    expect(() => registry.get('')).toThrow(InvalidTemplateKeyError)
    expect(() => registry.get(null as any)).toThrow(InvalidTemplateKeyError)
    expect(registry.has('olmayan_sablon')).toBe(false)
  })

  it('4. Kanonik Anahtar Çözümleme: Kebab-case, snake_case, .html uzantısı ve büyük/küçük harf doğru çözümlenmelidir', () => {
    const registry = new TemplateRegistry()
    const mockRenderer = () => React.createElement('div', null, 'Canonical')

    registry.register({
      templateKey: 'piyasa_fiyat_tutanagi',
      name: 'PiyasaFiyatTutanagi',
      title: 'Piyasa Fiyat Tutanağı',
      category: 'piyasa',
      categoryLabel: 'Piyasa',
      orientation: 'landscape',
      renderer: mockRenderer
    })

    // snake_case
    expect(registry.has('piyasa_fiyat_tutanagi')).toBe(true)
    // kebab-case
    expect(registry.has('piyasa-fiyat-tutanagi')).toBe(true)
    // .html uzantısı
    expect(registry.has('piyasa_fiyat_tutanagi.html')).toBe(true)
    // Büyük harf
    expect(registry.has('PIYASA_FIYAT_TUTANAGI')).toBe(true)

    const resolved = registry.get('piyasa-fiyat-tutanagi.html')
    expect(resolved.name).toBe('PiyasaFiyatTutanagi')
    expect(resolved.orientation).toBe('landscape')
  })

  it('5. Instance Tabanlı DocumentRenderer: Özel registry ile React DOM üretimi hatasız çalışmalıdır', () => {
    const customRegistry = new TemplateRegistry()
    const mockRenderer = (props: any) =>
      React.createElement('article', { 'data-testid': 'custom-doc' }, `Konu: ${props.data.konu}`)

    customRegistry.register({
      templateKey: 'ozel_sozlesme',
      name: 'OzelSozlesme',
      title: 'Özel Sözleşme',
      category: 'sozlesmeler',
      categoryLabel: 'Sözleşme',
      orientation: 'portrait',
      renderer: mockRenderer
    })

    const html = renderToString(
      React.createElement(DocumentRenderer, {
        registry: customRegistry,
        templateKey: 'ozel_sozlesme',
        data: { konu: 'Hizmet Alımı Sözleşmesi' }
      })
    )

    expect(html).toContain('data-testid="custom-doc"')
    expect(html).toContain('Konu: Hizmet Alımı Sözleşmesi')
  })

  it('6. Unregister ve Clear İşlemleri: Şablon çıkarma ve defteri temizleme doğru çalışmalıdır', () => {
    const registry = new TemplateRegistry()
    const mockRenderer = () => React.createElement('div', null, 'Item')

    registry.register({
      templateKey: 'gecici_belge',
      name: 'GeciciBelge',
      title: 'Geçici Belge',
      category: 'test',
      categoryLabel: 'Test',
      orientation: 'portrait',
      renderer: mockRenderer
    })

    expect(registry.has('gecici_belge')).toBe(true)
    expect(registry.getAll()).toHaveLength(1)

    const unregResult = registry.unregister('gecici_belge')
    expect(unregResult).toBe(true)
    expect(registry.has('gecici_belge')).toBe(false)
    expect(registry.getAll()).toHaveLength(0)

    // Clear testi
    registry.register({
      templateKey: 'test_a',
      name: 'A',
      title: 'A',
      category: 'c',
      categoryLabel: 'C',
      orientation: 'portrait',
      renderer: mockRenderer
    })
    registry.register({
      templateKey: 'test_b',
      name: 'B',
      title: 'B',
      category: 'c',
      categoryLabel: 'C',
      orientation: 'portrait',
      renderer: mockRenderer
    })
    expect(registry.getAll()).toHaveLength(2)

    registry.clear()
    expect(registry.getAll()).toHaveLength(0)
    expect(registry.has('test_a')).toBe(false)
  })
})

