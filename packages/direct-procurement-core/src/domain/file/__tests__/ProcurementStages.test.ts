import { describe, it, expect } from 'vitest'
import {
  DOCUMENT_STAGES,
  IHTIYAC_RAPORU_STAGE,
  getStageById,
  getStageForTemplate,
  filterTemplatesByStage,
  getAdjacentStageTemplate
} from '../ProcurementStages'

describe('ProcurementStages (Direct Procurement Core)', () => {
  it('tüm 5 ana aşamayı ve ihtiyaç raporu aşamasını doğru tanımlar', () => {
    expect(DOCUMENT_STAGES).toHaveLength(5)
    expect(IHTIYAC_RAPORU_STAGE.id).toBe(0)
    expect(DOCUMENT_STAGES.map((s) => s.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('getStageById: sayı veya anahtar string ile aşamayı doğru bulur', () => {
    expect(getStageById(0)).toEqual(IHTIYAC_RAPORU_STAGE)
    expect(getStageById('ihtiyac-raporu')).toEqual(IHTIYAC_RAPORU_STAGE)
    expect(getStageById(1)?.key).toBe('1-ihtiyac-tespiti-ve-baslangic')
    expect(getStageById('3-siparis-ve-sozlesme')?.id).toBe(3)
    expect(getStageById(4)?.shortName).toBe('4. Kabul & Ödeme')
    expect(getStageById(null)).toBeUndefined()
  })

  it('getStageForTemplate: kategori ve şablon adına göre doğru aşamayı çözer', () => {
    expect(getStageForTemplate(null, null, 'ihtiyacRaporu')).toEqual(IHTIYAC_RAPORU_STAGE)
    expect(getStageForTemplate('ihtiyac-listesi')).toMatchObject({ id: 1 })
    expect(getStageForTemplate('piyasa-fiyat-arastirma-tutanagi')).toMatchObject({ id: 2 })
    expect(getStageForTemplate('kabul-edilen-teklif')).toMatchObject({ id: 3 })
    expect(getStageForTemplate('muayene-kabul-tutanagi')).toMatchObject({ id: 4 })
    expect(getStageForTemplate('dogrudan-temin-dosyasi')).toMatchObject({ id: 5 })
  })

  it('filterTemplatesByStage: aşama şablonlarını kategori ve id üzerinden filtreler', () => {
    const mockTemplates = [
      { id: 'ihtiyac-listesi', category: '1-ihtiyac-tespiti-ve-baslangic' },
      { id: 'fiyat-arastirma-mektubu', category: '2-piyasa-fiyat-arastirmasi' },
      { id: 'kabul-edilen-teklif', category: '3-siparis-ve-sozlesme' },
      { id: 'muayene-kabul-tutanagi', category: '4-kabul-ve-odeme-islemleri' }
    ]

    const stage1Templates = filterTemplatesByStage(1, mockTemplates)
    expect(stage1Templates).toHaveLength(1)
    expect(stage1Templates[0].id).toBe('ihtiyac-listesi')

    const stage3Templates = filterTemplatesByStage(3, mockTemplates)
    expect(stage3Templates).toHaveLength(1)
    expect(stage3Templates[0].id).toBe('kabul-edilen-teklif')
  })

  it('getAdjacentStageTemplate: önceki ve sonraki şablonu doğru belirler', () => {
    const mockTemplates = [
      { id: 'ihtiyac-listesi', category: '1-ihtiyac-tespiti-ve-baslangic' },
      { id: 'luzum-muzekkeresi', category: '1-ihtiyac-tespiti-ve-baslangic' },
      { id: 'harcama-talimati', category: '1-ihtiyac-tespiti-ve-baslangic' }
    ]

    const next = getAdjacentStageTemplate('ihtiyac-listesi', 1, mockTemplates, 'next')
    expect(next?.id).toBe('luzum-muzekkeresi')

    const prev = getAdjacentStageTemplate('harcama-talimati', 1, mockTemplates, 'prev')
    expect(prev?.id).toBe('luzum-muzekkeresi')
  })
})
