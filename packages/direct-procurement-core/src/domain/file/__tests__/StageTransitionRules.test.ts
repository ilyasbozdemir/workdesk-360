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

  it('2. Aşama 2 (Araştırma) için kalem ve resmi belge yoksa kilitli olmalıdır', () => {
    const emptyCtx = createEmptyContext()
    const result = evaluateStageRules(PROCUREMENT_STAGE_IDS.ARASTIRMA, emptyCtx)
    expect(result.isUnlocked).toBe(false)
    expect(result.missingRules.some((r) => r.id === STAGE_RULE_IDS.STEP1_HAS_ITEMS)).toBe(true)
    expect(result.missingRules.some((r) => r.id === STAGE_RULE_IDS.STEP1_HAS_OFFICIAL_DOC)).toBe(true)
  })

  it('3. Kalem ve İhtiyaç Listesi snapshot kaydı sağlandığında Aşama 2 kilidi açılmalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10, birim: 'Kutu' }],
      snapshots: [STAGE_DOCUMENT_CODES.IHTIYAC_LISTESI]
    }
    const result = evaluateStageRules(PROCUREMENT_STAGE_IDS.ARASTIRMA, ctx)
    expect(result.isUnlocked).toBe(true)
    expect(result.missingRules.length).toBe(0)
  })

  it('4. Aşama 3 (Yüklenici) için firma, teklif ve kazanan seçilmemişse kilitli kalmalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      snapshots: [STAGE_DOCUMENT_CODES.IHTIYAC_LISTESI],
      firmalar: [{ id: 10, firma_id: 10, teklif_toplami: 500 }],
      teklifler: { '1_10': 50 },
      kazananFirmaId: null // Kazanan seçilmedi
    }
    const result = evaluateStageRules(PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI, ctx)
    expect(result.isUnlocked).toBe(false)
    expect(result.missingRules.some((r) => r.id === STAGE_RULE_IDS.STEP2_HAS_WINNER)).toBe(true)
  })

  it('5. Kazanan seçildiğinde Aşama 3 açılmalı; sözleşme düzenlenmeden Aşama 4 açılmamalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      snapshots: [
        STAGE_DOCUMENT_CODES.IHTIYAC_LISTESI,
        STAGE_DOCUMENT_CODES.PIYASA_FIYAT_ARASTIRMA_TUTANAGI
      ],
      firmalar: [{ id: 10, firma_id: 10, teklif_toplami: 500 }],
      teklifler: { '1_10': 50 },
      kazananFirmaId: 10
    }
    // Aşama 3 açık olmalı
    const res3 = evaluateStageRules(PROCUREMENT_STAGE_IDS.YUKLENICI_ISLEMLERI, ctx)
    expect(res3.isUnlocked).toBe(true)

    // Aşama 4 henüz sözleşme/sipariş olmadığı için kilitli olmalı
    const res4 = evaluateStageRules(PROCUREMENT_STAGE_IDS.MUAYENE_KABUL_ODEME, ctx)
    expect(res4.isUnlocked).toBe(false)
    expect(res4.missingRules.some((r) => r.id === STAGE_RULE_IDS.STEP3_HAS_CONTRACT_OR_ORDER)).toBe(true)
  })

  it('6. Sipariş mektubu snapshot eklendiğinde Aşama 4 (Kabul & Ödeme) açılmalıdır', () => {
    const ctx: StageEvaluationContext = {
      ...createEmptyContext(),
      kalemler: [{ id: 1, kalem_adi: 'A4 Kağıt', miktar: 10 }],
      snapshots: [
        STAGE_DOCUMENT_CODES.IHTIYAC_LISTESI,
        STAGE_DOCUMENT_CODES.PIYASA_FIYAT_ARASTIRMA_TUTANAGI,
        STAGE_DOCUMENT_CODES.SIPARIS_MEKTUBU
      ],
      firmalar: [{ id: 10, firma_id: 10, teklif_toplami: 500 }],
      teklifler: { '1_10': 50 },
      kazananFirmaId: 10
    }
    const res4 = evaluateStageRules(PROCUREMENT_STAGE_IDS.MUAYENE_KABUL_ODEME, ctx)
    expect(res4.isUnlocked).toBe(true)
    expect(res4.missingRules.length).toBe(0)
  })

  it('7. Şablon kod normalizasyonu ve snapshot doğrulama yardımcıları tutarlı çalışmalıdır', () => {
    expect(normalizeDocumentCode('Ihtiyac_Listesi')).toBe('ihtiyac-listesi')
    expect(normalizeDocumentCode('dogrudan-temin-onay-belgesi')).toBe('dogrudan-temin-onay-belgesi')
    expect(normalizeDocumentCode('  piyasa_fiyat_arastirma_tutanagi  ')).toBe('piyasa-fiyat-arastirma-tutanagi')

    const testSnaps = ['ihtiyac_listesi', 'piyasa_fiyat_arastirma_tutanagi']
    expect(hasAnyDocumentSnapshot(testSnaps, STAGE_QUALIFYING_DOCUMENTS.STAGE_1_PREPARATION)).toBe(true)
    expect(hasAnyDocumentSnapshot(testSnaps, STAGE_QUALIFYING_DOCUMENTS.STAGE_3_CONTRACT_AND_ORDER)).toBe(false)
  })
})
