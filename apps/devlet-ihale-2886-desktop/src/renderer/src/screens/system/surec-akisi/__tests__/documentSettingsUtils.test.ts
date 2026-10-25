import { describe, it, expect } from 'vitest'
import {
  kapanisIbaresi,
  dagitimdanAlanlar,
  ilgiOner,
  ekOner,
  mergeEvrakSettings,
  validateDocumentSettings
} from '../documentSettingsUtils'
import type { TemplateType } from '@temin360/document-templates'

describe('Document Settings Utilities & Validation Rules', () => {
  describe('1. kapanisIbaresi', () => {
    it('hiyerarşi değerine göre doğru Resmî Yazışma kapanış ibaresini dönmelidir', () => {
      expect(kapanisIbaresi('ust')).toBe('Arz ederim.')
      expect(kapanisIbaresi('es')).toBe('Rica ederim.')
      expect(kapanisIbaresi('alt')).toBe('Rica ederim.')
      expect(kapanisIbaresi(undefined)).toBe('Arz ederim.')
    })
  })

  describe('2. dagitimdanAlanlar', () => {
    it('gereği ve bilgi dağıtım muhataplarını doğru ayrıştırmalıdır', () => {
      const dagitim = [
        {
          muhatap: { hitap: 'İç Denetim Birimi', hiyerarsi: 'es' as const },
          tur: 'bilgi' as const
        },
        {
          muhatap: { hitap: 'Destek Hizmetleri Dairesi', hiyerarsi: 'alt' as const },
          tur: 'gereği' as const
        },
        { muhatap: { hitap: 'Mali Hizmetler', hiyerarsi: 'es' as const }, tur: 'gereği' as const }
      ]

      const result = dagitimdanAlanlar(dagitim)
      expect(result.geregi).toEqual(['Destek Hizmetleri Dairesi', 'Mali Hizmetler'])
      expect(result.bilgi).toEqual(['İç Denetim Birimi'])
    })

    it('boş listede güvenli boş diziler dönmelidir', () => {
      expect(dagitimdanAlanlar(undefined)).toEqual({ geregi: [], bilgi: [] })
    })
  })

  describe('3. ilgiOner & ekOner', () => {
    it('aynı dosyadaki önceki belgelerden ilgi önerileri oluşturmalı ve mevcut belgeyi hariç tutmalıdır', () => {
      const docs = [
        { id: 'luzum-muzekkeresi', baslik: 'Lüzum Müzekkeresi', tarih: '10.05.2026', sayi: '101' },
        {
          id: 'dogrudan-temin-onay-belgesi',
          baslik: 'Onay Belgesi',
          tarih: '12.05.2026',
          sayi: '102'
        }
      ]

      const oneriler = ilgiOner(docs, 'dogrudan-temin-onay-belgesi')
      expect(oneriler.length).toBe(1)
      expect(oneriler[0].id).toBe('ilgi-luzum-muzekkeresi')
      expect(oneriler[0].metin).toContain('10.05.2026 tarihli 101 sayılı Lüzum Müzekkeresi yazısı.')
    })

    it('ekOner şablona özel varsayılan ekleri sunmalıdır', () => {
      const ekler = ekOner('mal_alimi', 'luzum-muzekkeresi')
      expect(ekler.length).toBeGreaterThan(0)
      expect(ekler[0].ad).toBe('İhtiyaç Malzeme Listesi')
    })
  })

  describe('4. mergeEvrakSettings (veri_json kalıcılık)', () => {
    it('mevcut veri_json içindeki _evrak alanını derinlemesine birleştirmelidir', () => {
      const originalJson = JSON.stringify({
        konu: 'Tıbbi Sarf Malzeme Alımı',
        toplamTutar: 50000,
        _evrak: {
          kapanisIbaresi: 'Arz ederim.'
        }
      })

      const newSettings = {
        muhatap: {
          hitap: 'ANKARA İL SAĞLIK MÜDÜRLÜĞÜNE',
          hiyerarsi: 'ust' as const
        }
      }

      const mergedStr = mergeEvrakSettings(originalJson, newSettings)
      const parsed = JSON.parse(mergedStr)

      // Eski alanlar korunmalı
      expect(parsed.konu).toBe('Tıbbi Sarf Malzeme Alımı')
      expect(parsed.toplamTutar).toBe(50000)
      // _evrak alanları birleştirilmeli
      expect(parsed._evrak.kapanisIbaresi).toBe('Arz ederim.')
      expect(parsed._evrak.muhatap.hitap).toBe('ANKARA İL SAĞLIK MÜDÜRLÜĞÜNE')
      expect(parsed._evrak.sonGuncelleme).toBeDefined()
    })

    it('boş veya geçersiz json geldiğinde güvenli biçimde sıfırdan oluşturmalıdır', () => {
      const mergedStr = mergeEvrakSettings(null, { kapanisIbaresi: 'Rica ederim.' })
      const parsed = JSON.parse(mergedStr)
      expect(parsed._evrak.kapanisIbaresi).toBe('Rica ederim.')
    })
  })

  describe('5. validateDocumentSettings (Eksiklik Kuralları Saf Fonksiyonu)', () => {
    it('supportsMuhatap olan ve external rotalı belgede muhatap boşsa "muhatap boş" uyarısı vermelidir', () => {
      const template: Partial<TemplateType> = {
        id: 'odeme-yazisi',
        capabilities: {
          supportsOlur: true,
          supportsCommission: false,
          supportedCommissionTypes: ['none'],
          supportsPersonnelList: true,
          supportsKalemListesi: true,
          supportsFirmaListesi: true,
          supportsMuhatap: true,
          supportsRota: false
        },
        workflow: {
          routing: { mode: 'external' }
        }
      }

      const result = validateDocumentSettings('odeme-yazisi', {}, template as TemplateType)
      expect(result.isValid).toBe(false)
      expect(result.warnings).toContain('muhatap boş')
      expect(result.missingFields).toContain('muhatap')
    })

    it('muhatap dolu olduğunda eksik uyarısı vermemelidir', () => {
      const template: Partial<TemplateType> = {
        id: 'odeme-yazisi',
        capabilities: {
          supportsOlur: true,
          supportsCommission: false,
          supportedCommissionTypes: ['none'],
          supportsPersonnelList: true,
          supportsKalemListesi: true,
          supportsFirmaListesi: true,
          supportsMuhatap: true
        },
        workflow: {
          routing: { mode: 'external' }
        }
      }

      const result = validateDocumentSettings(
        'odeme-yazisi',
        { muhatap: { hitap: 'Muhasebe Müdürlüğü', hiyerarsi: 'alt' } },
        template as TemplateType
      )
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBe(0)
    })

    it('supportsRota aktif olan belgede rota onaylanmadığında "rota onaylanmadı" uyarısı vermelidir', () => {
      const template: Partial<TemplateType> = {
        id: 'ozel-belge',
        capabilities: {
          supportsOlur: false,
          supportsCommission: false,
          supportedCommissionTypes: ['none'],
          supportsPersonnelList: true,
          supportsKalemListesi: true,
          supportsFirmaListesi: false,
          supportsRota: true
        }
      }

      const result = validateDocumentSettings(
        'ozel-belge',
        { rotaOnaylandi: false },
        template as TemplateType
      )
      expect(result.isValid).toBe(false)
      expect(result.warnings).toContain('rota onaylanmadı')
      expect(result.missingFields).toContain('rota')
    })
  })
})
