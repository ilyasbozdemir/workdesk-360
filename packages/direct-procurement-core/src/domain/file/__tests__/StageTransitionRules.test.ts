import { describe, it, expect } from 'vitest'
import {
  STAGE_TRANSITION_RULES,
  getRequiredRulesForStage,
  evaluateStageRules,
  StageEvaluationContext,
  PROCUREMENT_STAGE_IDS,
  STAGE_RULE_IDS,
  STAGE_DOCUMENT_CODES,
  STAGE_QUALIFYING_DOCUMENTS,
  normalizeDocumentCode,
  hasAnyDocumentSnapshot
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
    const result = evaluateStageRules(PROCUREMENT_STAGE_IDS.HAZIRLIK, emptyCtx)
    expect(result.isUnlocked).toBe(true)
    expect(result.missingRules.length).toBe(0)
  })

  it('2. Aşama 2 (Araştırma) için kalem eklenmemişse kilitli olmalı, kalem eklendiğinde açılmalıdır', () => {
    const emptyCtx = createEmptyContext()
    const resultBefore = evaluateStageRules(PROCUREMENT_STAGE_IDS.ARASTIRMA, emptyCtx)
    expect(resultBefore.isUnlocked).toBe(false)
    expect(resultBefore.missingRules.some((r) => r.id === STAGE_RULE_IDS.STEP1_HAS_ITEMS)).toBe(true)

    // Kalem eklenince resmî belge snapshot'ı aranmaksızın açılmalıdır
    const ctxWithItem: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10, birim: 'Kutu' }]
    }
    const resultAfter = evaluateStageRules(PROCUREMENT_STAGE_IDS.ARASTIRMA, ctxWithItem)
    expect(resultAfter.isUnlocked).toBe(true)
    expect(resultAfter.missingRules.length).toBe(0)
  })

  it('3. Aşama 3 (Yüklenici) için firma yoksa kilitli olmalı, istekli eklendiğinde açılmalıdır', () => {
    const ctxWithoutFirm: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      firmalar: []
    }
    const resWithoutFirm = evaluateStageRules(PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI, ctxWithoutFirm)
    expect(resWithoutFirm.isUnlocked).toBe(false)
    expect(resWithoutFirm.missingRules.some((r) => r.id === STAGE_RULE_IDS.STEP2_HAS_FIRMS)).toBe(true)

    // En az 1 firma eklendiğinde Aşama 3 açılmalıdır
    const ctxWithFirm: StageEvaluationContext = {
      ...ctxWithoutFirm,
      firmalar: [{ id: 10, firma_id: 10, unvan: 'Tedarikçi A.Ş.' }]
    }
    const resWithFirm = evaluateStageRules(PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI, ctxWithFirm)
    expect(resWithFirm.isUnlocked).toBe(true)
    expect(resWithFirm.missingRules.length).toBe(0)
  })

  it('4. Aşama 4 (Kabul & Ödeme) süreç akışında erişilebilir olmalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      firmalar: [{ id: 10, firma_id: 10, unvan: 'Tedarikçi A.Ş.' }]
    }
    const res4 = evaluateStageRules(PROCUREMENT_STAGE_IDS.MUAYENE_KABUL_ODEME, ctx)
    expect(res4.isUnlocked).toBe(true)
    expect(res4.missingRules.length).toBe(0)
  })

  it('5. Şablon kod normalizasyonu ve snapshot doğrulama yardımcıları tutarlı çalışmalıdır', () => {
    expect(normalizeDocumentCode('Ihtiyac_Listesi')).toBe('ihtiyac-listesi')
    expect(normalizeDocumentCode('dogrudan-temin-onay-belgesi')).toBe('dogrudan-temin-onay-belgesi')
    expect(normalizeDocumentCode('  piyasa_fiyat_arastirma_tutanagi  ')).toBe('piyasa-fiyat-arastirma-tutanagi')

    const testSnaps = ['ihtiyac_listesi', 'piyasa_fiyat_arastirma_tutanagi']
    expect(hasAnyDocumentSnapshot(testSnaps, STAGE_QUALIFYING_DOCUMENTS.STAGE_1_PREPARATION)).toBe(true)
    expect(hasAnyDocumentSnapshot(testSnaps, STAGE_QUALIFYING_DOCUMENTS.STAGE_3_CONTRACT_AND_ORDER)).toBe(false)
  })
})
