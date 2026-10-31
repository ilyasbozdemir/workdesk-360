import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  resolveTemplateKey,
  getTemplateDefinition,
  TemplateKey
} from '@temin360/document-templates'
import { DocumentPreviewCanvas } from '../components/DocumentPreviewCanvas'
import { compileDocumentHtml } from '../hooks/helpers/previewExportUtils'
import { DocumentRenderer } from '../document-engine/DocumentRenderer'

describe('DocumentPreview & PDF Export Regression Test Suite', () => {
  // 1. Template Key Resolution: Snake_case, kebab-case, aliases & invalid
  describe('Template Key Resolution (resolveTemplateKey)', () => {
    it('snake_case ve kebab-case anahtarları doğru TemplateKey değerine çözümler', () => {
      expect(resolveTemplateKey('luzum_muzekkeresi')).toBe('luzum_muzekkeresi')
      expect(resolveTemplateKey('luzum-muzekkeresi')).toBe('luzum_muzekkeresi')
      expect(resolveTemplateKey('ihtiyac_listesi')).toBe('ihtiyac_listesi')
      expect(resolveTemplateKey('ihtiyac-listesi')).toBe('ihtiyac_listesi')
      expect(resolveTemplateKey('harcama_talimati')).toBe('harcama_talimati')
      expect(resolveTemplateKey('harcama-talimati')).toBe('harcama_talimati')
      expect(resolveTemplateKey('yaklasik_maliyet_cetveli')).toBe('yaklasik_maliyet_cetveli')
      expect(resolveTemplateKey('yaklasik-maliyet-cetveli')).toBe('yaklasik_maliyet_cetveli')
    })

    it('alias anahtarlarını doğru hedef TemplateKeye yönlendirir', () => {
      expect(resolveTemplateKey('luzum-muzekkeresi-onay-eki')).toBe('luzum_onay_eki')
      expect(resolveTemplateKey('piyasa-fiyat-arastirma-tutanagi')).toBe(
        'piyasa_fiyat_arastirma_tutanagi'
      )
    })

    it('geçersiz veya tanımsız şablon kimliğinde undefined döner', () => {
      expect(resolveTemplateKey('tamamen_gecersiz_kimlik_12345')).toBeUndefined()
      expect(resolveTemplateKey('')).toBeUndefined()
      expect(resolveTemplateKey(null)).toBeUndefined()
      expect(resolveTemplateKey(undefined)).toBeUndefined()
    })
  })

  // 2. DocumentPreviewCanvas Rendering & Document Switching
  describe('DocumentPreviewCanvas Component Interaction', () => {
    const dummyRef = { current: null }
    const defaultFormData = {
      kurumAdi: 'İstanbul İl Sağlık Müdürlüğü',
      antetSatirlari: ['T.C.', 'İSTANBUL İL SAĞLIK MÜDÜRLÜĞÜ'],
      sunulacakMakamAdi: 'İL SAĞLIK MÜDÜRLÜĞÜ MAKAMINA',
      gerekce: 'Tıbbi cihaz bakım onarım alımı',
      yaklasikMaliyet: 250000,
      tarih: '2026-10-18'
    }

    it('seçili geçerli bir şablon olduğunda doğru bileşeni ve veriyi render eder', () => {
      const { container } = render(
        <DocumentPreviewCanvas
          previewContainerRef={dummyRef}
          previewScale={1}
          orientation="portrait"
          selectedDocId="luzum-muzekkeresi"
          isEditingMode={false}
          formData={defaultFormData}
          setFormData={() => {}}
          personelListesi={[]}
          firmaListesi={[]}
          localShowLogoLeft={false}
          localShowLogoRight={false}
        />
      )

      const page = container.querySelector('[data-document-page="true"]')
      expect(page).not.toBeNull()
      expect(page?.getAttribute('data-template-key')).toBe('luzum_muzekkeresi')
      expect(container.textContent).toContain('İSTANBUL İL SAĞLIK MÜDÜRLÜĞÜ')
      expect(container.textContent).toContain('LÜZUM MÜZEKKERESİ')
    })

    it('kullanıcı başka bir belge seçtiğinde (seçim değiştiğinde) yeni şablonun içeriğini gösterir', () => {
      const { container, rerender } = render(
        <DocumentPreviewCanvas
          previewContainerRef={dummyRef}
          previewScale={1}
          orientation="portrait"
          selectedDocId="luzum_muzekkeresi"
          isEditingMode={false}
          formData={defaultFormData}
          setFormData={() => {}}
          personelListesi={[]}
          firmaListesi={[]}
          localShowLogoLeft={false}
          localShowLogoRight={false}
        />
      )

      expect(
        container.querySelector('[data-document-page="true"]')?.getAttribute('data-template-key')
      ).toBe('luzum_muzekkeresi')

      // Kullanıcı İhtiyaç Listesi şablonuna geçiyor:
      rerender(
        <DocumentPreviewCanvas
          previewContainerRef={dummyRef}
          previewScale={1}
          orientation="portrait"
          selectedDocId="ihtiyac-listesi"
          isEditingMode={false}
          formData={defaultFormData}
          setFormData={() => {}}
          personelListesi={[]}
          firmaListesi={[]}
          localShowLogoLeft={false}
          localShowLogoRight={false}
        />
      )

      expect(
        container.querySelector('[data-document-page="true"]')?.getAttribute('data-template-key')
      ).toBe('ihtiyac_listesi')
    })

    it('selectedDocId ve ActiveComponent yokken şablon seçim boş durum ekranını (Görüntülenecek Belge Şablonunu Seçin) gösterir', () => {
      const { container } = render(
        <DocumentPreviewCanvas
          previewContainerRef={dummyRef}
          previewScale={1}
          orientation="portrait"
          selectedDocId={undefined}
          ActiveComponent={null}
          isEditingMode={false}
          formData={defaultFormData}
          setFormData={() => {}}
          personelListesi={[]}
          firmaListesi={[]}
          localShowLogoLeft={false}
          localShowLogoRight={false}
          templateOptions={[
            {
              id: 'luzum_muzekkeresi',
              name: 'LuzumMuzekkeresi',
              title: 'Lüzum Müzekkeresi',
              category: '1-talep',
              categoryLabel: 'Talep Belgeleri'
            }
          ]}
        />
      )

      expect(container.textContent).toContain('Görüntülenecek Belge Şablonunu Seçin')
    })
  })

  // 3. compileDocumentHtml & PDF/Print Output Integrity
  describe('compileDocumentHtml Export Integrity', () => {
    const testFormData = {
      kurumAdi: 'Ankara Büyükşehir Belediyesi',
      antetSatirlari: ['T.C.', 'ANKARA BÜYÜKŞEHİR BELEDİYESİ'],
      sunulacakMakamAdi: 'BİLGİ İŞLEM DAİRESİ BAŞKANLIĞINA',
      isinAdi: 'Bilgi İşlem Donanım Tedariği',
      ihtiyacYeri: 'Bilgi İşlem Dairesi',
      belgeSayi: '2026/987',
      solLogo: 'data:image/png;base64,solLogoData',
      sagLogo: 'data:image/png;base64,sagLogoData'
    }

    it('ekrandaki önizleme ile compileDocumentHtml çıktısı aynı şablon anahtarını ve içeriği üretir', () => {
      const templateConf = getTemplateDefinition('luzum_muzekkeresi')
      expect(templateConf).toBeDefined()

      const compiledHtml = compileDocumentHtml({
        activeTemplateConf: templateConf,
        formData: testFormData,
        personelListesi: [],
        firmaListesi: [],
        localShowLogoLeft: true,
        localShowLogoRight: true,
        logoLeft: null,
        logoRight: null,
        institutionLogo: null,
        orientation: 'portrait'
      })

      // Hem önizleme HTML özniteliği hem de şablon kimliği tutarlı olmalı
      expect(compiledHtml).toContain('data-document-page="true"')
      expect(compiledHtml).toContain('data-template-key="luzum_muzekkeresi"')
      expect(compiledHtml).toContain('ANKARA BÜYÜKŞEHİR BELEDİYESİ')
      expect(compiledHtml).toContain('LÜZUM MÜZEKKERESİ')
      expect(compiledHtml).toContain('solLogoData')
      expect(compiledHtml).toContain('sagLogoData')
    })

    it('kebab-case şablon kimliği ile dışa aktarımda doğru şablon derlenir', () => {
      const compiledHtml = compileDocumentHtml({
        activeTemplateConf: { id: 'harcama-talimati', name: 'HarcamaTalimati' },
        formData: testFormData,
        personelListesi: [],
        firmaListesi: [],
        localShowLogoLeft: false,
        localShowLogoRight: false,
        logoLeft: null,
        logoRight: null,
        institutionLogo: null,
        orientation: 'portrait'
      })

      expect(compiledHtml).toContain('data-template-key="harcama_talimati"')
    })

    it('şablon yapılandırması eksik olduğunda sessizce yanlış belge üretmez, açık hata fırlatır', () => {
      expect(() => {
        compileDocumentHtml({
          activeTemplateConf: null,
          formData: testFormData,
          personelListesi: [],
          firmaListesi: [],
          localShowLogoLeft: false,
          localShowLogoRight: false,
          logoLeft: null,
          logoRight: null,
          institutionLogo: null,
          orientation: 'portrait'
        })
      }).toThrowError('Dışa aktarılacak aktif şablon yapılandırması bulunamadı.')
    })

    it('şablon kimliği geçersiz olduğunda sessizce ihtiyaç listesi üretmez, açık hata fırlatır', () => {
      expect(() => {
        compileDocumentHtml({
          activeTemplateConf: { id: 'tanimsiz_gecersiz_sablon_xyz', name: 'Bilinmeyen' },
          formData: testFormData,
          personelListesi: [],
          firmaListesi: [],
          localShowLogoLeft: false,
          localShowLogoRight: false,
          logoLeft: null,
          logoRight: null,
          institutionLogo: null,
          orientation: 'portrait'
        })
      }).toThrowError(/Geçersiz şablon kimliği: "tanimsiz_gecersiz_sablon_xyz"/)
    })

    it('yatay (landscape) mod ayarlandığında HTML ve CSS çıktıları yatay yönelimi yansıtır', () => {
      const templateConf = getTemplateDefinition('yaklasik_maliyet_cetveli')
      const compiledHtml = compileDocumentHtml({
        activeTemplateConf: templateConf,
        formData: testFormData,
        personelListesi: [],
        firmaListesi: [],
        localShowLogoLeft: false,
        localShowLogoRight: false,
        logoLeft: null,
        logoRight: null,
        institutionLogo: null,
        orientation: 'landscape'
      })

      expect(compiledHtml).toContain('data-orientation="landscape"')
      expect(compiledHtml).toContain('size: A4 landscape')
    })
  })

  // 4. Multiple Templates Isolation
  describe('Multiple Distinct Templates Isolation', () => {
    const templatesToTest: { key: TemplateKey; expectedBadgeOrTitle: string }[] = [
      { key: 'luzum_muzekkeresi', expectedBadgeOrTitle: 'LÜZUM MÜZEKKERESİ' },
      {
        key: 'ihtiyac_listesi',
        expectedBadgeOrTitle: 'ihtiyacı olan aşağıda yazılı mal/hizmet kalemlerinin'
      },
      { key: 'harcama_talimati', expectedBadgeOrTitle: 'HARCAMA TALİMATI' },
      { key: 'yaklasik_maliyet_cetveli', expectedBadgeOrTitle: 'YAKLAŞIK MALİYET' }
    ]

    templatesToTest.forEach(({ key, expectedBadgeOrTitle }) => {
      it(`şablon [${key}] kendi özel bileşeni ve verisiyle doğru biçimde render edilmelidir`, () => {
        const { container } = render(
          <DocumentRenderer
            templateKey={key}
            data={{
              kurumAdi: `Test İdaresi - ${key}`,
              antetSatirlari: ['T.C.', `Test İdaresi - ${key}`],
              tarih: '2026-10-18'
            }}
            chrome="bare"
          />
        )

        const page = container.querySelector('[data-document-page="true"]')
        expect(page).not.toBeNull()
        expect(page?.getAttribute('data-template-key')).toBe(key)
        expect(container.textContent).toContain(expectedBadgeOrTitle)
      })
    })
  })
})
