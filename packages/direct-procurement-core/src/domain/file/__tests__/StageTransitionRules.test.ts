import { describe, it, expect } from 'vitest'
import {
  STAGE_TRANSITION_RULES,
  getRequiredRulesForStage,
  evaluateStageRules,
  StageEvaluationContext
} from '../StageTransitionRules'

describe('StageTransitionRules (Direct Procurement Core Domain)', () => {
  const createEmptyContext = (dosyaId = 101): StageEvaluationContext => ({
    dosyaId,
    dosya: { id: dosyaId, birim_id: null, kazanan_firma_id: null },
    kalemler: [],
    firmalar: [],
    teklifler: {},
    snapshots: [],
    kazananFirmaId: null
  })

  it('1. Aşama 1 (Hazırlık) her zaman koşulsuz açık olmalıdır', () => {
    const emptyCtx = createEmptyContext()
    const result = evaluateStageRules(1, emptyCtx)
    expect(result.isUnlocked).toBe(true)
    expect(result.missingRules.length).toBe(0)
  })

  it('2. Aşama 2 (Araştırma) için kalem ve resmi belge yoksa kilitli olmalıdır', () => {
    const emptyCtx = createEmptyContext()
    const result = evaluateStageRules(2, emptyCtx)
    expect(result.isUnlocked).toBe(false)
    expect(result.missingRules.some((r) => r.id === 'step1_has_items')).toBe(true)
    expect(result.missingRules.some((r) => r.id === 'step1_has_official_doc')).toBe(true)
  })

  it('3. Kalem ve İhtiyaç Listesi snapshot kaydı sağlandığında Aşama 2 kilidi açılmalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10, birim: 'Kutu' }],
      snapshots: ['ihtiyac_listesi']
    }
    const result = evaluateStageRules(2, ctx)
    expect(result.isUnlocked).toBe(true)
    expect(result.missingRules.length).toBe(0)
  })

  it('4. Aşama 3 (Yüklenici) için firma, teklif ve kazanan seçilmemişse kilitli kalmalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      snapshots: ['ihtiyac_listesi'],
      firmalar: [{ id: 10, firma_id: 10, teklif_toplami: 500 }],
      teklifler: { '1_10': 50 },
      kazananFirmaId: null // Kazanan seçilmedi
    }
    const result = evaluateStageRules(3, ctx)
    expect(result.isUnlocked).toBe(false)
    expect(result.missingRules.some((r) => r.id === 'step2_has_winner')).toBe(true)
  })

  it('5. Kazanan seçildiğinde Aşama 3 açılmalı; sözleşme düzenlenmeden Aşama 4 açılmamalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      snapshots: ['ihtiyac_listesi', 'piyasa_fiyat_arastirma_tutanagi'],
      firmalar: [{ id: 10, firma_id: 10, teklif_toplami: 500 }],
      teklifler: { '1_10': 50 },
      kazananFirmaId: 10
    }
    // Aşama 3 açık olmalı
    const res3 = evaluateStageRules(3, ctx)
    expect(res3.isUnlocked).toBe(true)

    // Aşama 4 henüz sözleşme/sipariş olmadığı için kilitli olmalı
    const res4 = evaluateStageRules(4, ctx)
    expect(res4.isUnlocked).toBe(false)
    expect(res4.missingRules.some((r) => r.id === 'step3_has_contract_or_order')).toBe(true)
  })

  it('6. Sipariş mektubu snapshot eklendiğinde Aşama 4 (Kabul & Ödeme) açılmalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      snapshots: ['ihtiyac_listesi', 'piyasa_fiyat_arastirma_tutanagi', 'siparis_mektubu'],
      firmalar: [{ id: 10, firma_id: 10, teklif_toplami: 500 }],
      teklifler: { '1_10': 50 },
      kazananFirmaId: 10
    }
    const res4 = evaluateStageRules(4, ctx)
    expect(res4.isUnlocked).toBe(true)
    expect(res4.missingRules.length).toBe(0)
  })
})
