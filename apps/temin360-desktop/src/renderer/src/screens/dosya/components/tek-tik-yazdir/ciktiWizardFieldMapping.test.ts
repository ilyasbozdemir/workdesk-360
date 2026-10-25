import { describe, it, expect } from 'vitest'
import {
  getTemplateFieldMapping,
  getTemplateSupportedFlags,
  applyCommonDataToTemplate
} from './ciktiWizardFieldMapping'
import { getEvrakWarnings } from './getEvrakWarnings'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'

describe('ciktiWizardFieldMapping', () => {
  it('şablonlar için kanonik alan eşlemelerini doğru döndürür', () => {
    // 1. dogrudan-temin-onay-belgesi
    const dtMapping = getTemplateFieldMapping('dogrudan-temin-onay-belgesi')
    expect(dtMapping.muhatapKey).toBe('makam')
    expect(dtMapping.eklerKey).toBe('ekler')
    expect(dtMapping.ilgiKey).toBeUndefined()
    expect(dtMapping.dagitimKey).toBeUndefined()

    // 2. odeme-yazisi
    const odemeMapping = getTemplateFieldMapping('odeme-yazisi')
    expect(odemeMapping.muhatapKey).toBe('makamAdi')
    expect(odemeMapping.dagitimKey).toBe('dagitimListesi')
    expect(odemeMapping.ilgiKey).toBeUndefined()
    expect(odemeMapping.eklerKey).toBeUndefined()

    // 3. luzum-muzekkeresi
    const luzumMapping = getTemplateFieldMapping('luzum-muzekkeresi')
    expect(luzumMapping.muhatapKey).toBe('sunulacakMakamAdi')
    expect(luzumMapping.talepEdenAdiKey).toBe('talepEdenPersonelAdi')

    // 4. arastirma-mektubu
    const arastirmaMapping = getTemplateFieldMapping('arastirma-mektubu')
    expect(arastirmaMapping.muhatapKey).toBe('sayinIlgili')
    expect(arastirmaMapping.tarihKey).toBe('dosyaTarihi')
  })

  it('görünürlük bayraklarını doğru tanımlar ve statutory alanları işaretler', () => {
    const odemeFlags = getTemplateSupportedFlags('odeme-yazisi')
    expect(odemeFlags.some((f) => f.key === 'olurGoster')).toBe(true)

    const sonAlimFlags = getTemplateSupportedFlags('son-alim-fiyat-cetveli')
    expect(sonAlimFlags.some((f) => f.key === 'ekGoster')).toBe(true)
    expect(sonAlimFlags.some((f) => f.key === 'olurYazisi')).toBe(true)

    const komisyonFlags = getTemplateSupportedFlags('komisyon-gorevlendirme-onayi')
    const statutoryFlag = komisyonFlags.find((f) => f.key === 'olurYazisi')
    expect(statutoryFlag?.isStatutory).toBe(true)
  })

  describe('applyCommonDataToTemplate (Ezme Koruması)', () => {
    it('overwriteExisting false iken dolu alanların üzerine yazmaz', () => {
      const existingData = {
        makam: 'Önceden Girilmiş Makam',
        dosyaTarihi: '2026-01-01'
      }

      const { updatedData, overwrittenFields, appliedFields } = applyCommonDataToTemplate(
        existingData,
        'dogrudan-temin-onay-belgesi',
        {
          muhatap: 'Yeni Makam',
          tarih: '2026-10-10',
          hazirlayanAdi: 'Ali Veli'
        },
        false
      )

      // Dolu alanlar korunmalı
      expect(updatedData.makam).toBe('Önceden Girilmiş Makam')
      expect(updatedData.dosyaTarihi).toBe('2026-01-01')
      // Boş olan alan eklenmeli
      expect(updatedData.hazirlayanPersonelAdi).toBe('Ali Veli')

      expect(overwrittenFields).toHaveLength(0)
      expect(appliedFields).toContain('Hazırlayan Adı')
    })

    it('overwriteExisting true iken dolu alanların üzerine yazar ve ezilen alanları raporlar', () => {
      const existingData = {
        makam: 'Eski Makam'
      }

      const { updatedData, overwrittenFields, appliedFields } = applyCommonDataToTemplate(
        existingData,
        'dogrudan-temin-onay-belgesi',
        {
          muhatap: 'Güncel Makam'
        },
        true
      )

      expect(updatedData.makam).toBe('Güncel Makam')
      expect(overwrittenFields).toContain('Muhatap')
      expect(appliedFields).toContain('Muhatap')
    })
  })

  describe('getEvrakWarnings', () => {
    it('muhatap boşsa engellemeyen uyarı üretir', () => {
      const mockSablon = {
        id: 1,
        ad: 'Doğrudan Temin Onay Belgesi',
        dosya_adi: 'dogrudan-temin-onay-belgesi.html'
      } as unknown as Sablon

      const warnings = getEvrakWarnings(mockSablon, {})
      expect(warnings.some((w) => w.type === 'muhatap')).toBe(true)
    })

    it('dağıtım listesinde mükerrer kurum varsa uyarı üretir', () => {
      const mockSablon = {
        id: 2,
        ad: 'Ödeme Yazısı',
        dosya_adi: 'odeme-yazisi.html'
      } as unknown as Sablon

      const warnings = getEvrakWarnings(mockSablon, {
        makamAdi: 'Mali Hizmetler',
        dagitimListesi: ['Destek Hizmetleri', 'Destek Hizmetleri']
      })
      expect(warnings.some((w) => w.type === 'dagitim')).toBe(true)
    })
  })
})
