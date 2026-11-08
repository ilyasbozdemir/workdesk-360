import { describe, it, expect } from 'vitest'
import {
  DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
  evaluateTransition,
  resolveNextActions,
  evaluateRules,
  WorkflowContext
} from '../index'

describe('Workflow & Rule Engine — Unit Tests', () => {
  it('1. Geçerli durum geçişi: Onay belgesi varsa DRAFT -> MARKET_RESEARCH geçişine izin verilmeli', async () => {
    const ctx: WorkflowContext = {
      dosyaId: 101,
      dosyaNo: '2026/DT-001',
      currentState: 'PROCUREMENT_DRAFT',
      hasOnayBelgesi: true,
      butceTertibi: '03.2.1.01',
      actorRole: 'satin_alma'
    }

    const res = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_START_MARKET_RESEARCH',
      ctx
    )

    expect(res.canTransition).toBe(true)
    expect(res.blockingReasons.length).toBe(0)
    expect(res.transition?.toState).toBe('MARKET_RESEARCH')
  })

  it('2. Geçersiz durum: Onay belgesi yoksa BLOCKING kural nedeniyle geçiş engellenmeli', async () => {
    const ctx: WorkflowContext = {
      dosyaId: 102,
      dosyaNo: '2026/DT-002',
      currentState: 'PROCUREMENT_DRAFT',
      hasOnayBelgesi: false, // EKSİK!
      actorRole: 'satin_alma'
    }

    const res = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_START_MARKET_RESEARCH',
      ctx
    )

    expect(res.canTransition).toBe(false)
    expect(res.blockingReasons.some((m) => m.toLowerCase().includes('onay belgesi'))).toBe(true)
  })

  it('3. Durum uyuşmazlığı: Dosya DRAFT aşamasındayken muayene kabul geçişi çağrılamaz', async () => {
    const ctx: WorkflowContext = {
      dosyaId: 103,
      currentState: 'PROCUREMENT_DRAFT',
      actorRole: 'satin_alma'
    }

    const res = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_SEND_TO_FINANCE', // fromState: INSPECTION_ACCEPTANCE
      ctx
    )

    expect(res.canTransition).toBe(false)
    expect(res.blockingReasons.some((m) => m.includes('Bu işlem mevcut durum'))).toBe(true)
  })

  it('4. Yetki kontrolü: Muhasebe rolü satın alma geçişini doğrudan tetikleyemez', async () => {
    const ctx: WorkflowContext = {
      dosyaId: 104,
      currentState: 'PROCUREMENT_DRAFT',
      hasOnayBelgesi: true,
      actorRole: 'muhasebe' // YETKİSİZ
    }

    const res = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_START_MARKET_RESEARCH',
      ctx
    )

    expect(res.canTransition).toBe(false)
    expect(res.blockingReasons.some((m) => m.includes('Yetki yetersiz'))).toBe(true)
  })

  it('5. Admin rolü her aşama geçişini gerçekleştirebilir', async () => {
    const ctx: WorkflowContext = {
      dosyaId: 105,
      currentState: 'PROCUREMENT_DRAFT',
      hasOnayBelgesi: true,
      actorRole: 'admin' // MASTER
    }

    const res = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_START_MARKET_RESEARCH',
      ctx
    )

    expect(res.canTransition).toBe(true)
  })

  it('6. Uyarı niteliğindeki kural (WARNING) geçişi engellememeli, sadece uyarı döndürmeli', async () => {
    const ctx: WorkflowContext = {
      dosyaId: 106,
      currentState: 'MARKET_RESEARCH',
      kazananFirmaId: 15,
      kazananFirmaUnvan: 'Test Kırtasiye Ltd.',
      teklifSayisi: 2, // 3'ten az -> WARNING
      actorRole: 'satin_alma'
    }

    const res = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_ASSIGN_WINNER_AND_ORDER',
      ctx
    )

    expect(res.canTransition).toBe(true)
    expect(res.warningReasons.length).toBeGreaterThan(0)
    expect(res.warningReasons.some((w) => w.includes('3 teklif alınması önerilir'))).toBe(true)
  })

  it('7. Mali Hizmetlere sevk için Muayene & Kabul zorunluluğu doğrulanmalı', async () => {
    const ctxWithoutAcceptance: WorkflowContext = {
      dosyaId: 107,
      currentState: 'INSPECTION_ACCEPTANCE',
      hasMuayeneKabul: false,
      hasFatura: true,
      actorRole: 'satin_alma'
    }

    const res = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_SEND_TO_FINANCE',
      ctxWithoutAcceptance
    )

    expect(res.canTransition).toBe(false)
    expect(res.blockingReasons.some((b) => b.includes('muayene ve kabul'))).toBe(true)

    // Kabul tamamlandığında:
    const ctxWithAcceptance = { ...ctxWithoutAcceptance, hasMuayeneKabul: true }
    const res2 = await evaluateTransition(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      'T_SEND_TO_FINANCE',
      ctxWithAcceptance
    )
    expect(res2.canTransition).toBe(true)
  })

  it('8. Sonraki aksiyonlar (resolveNextActions) mevcut duruma uygun seçenekleri listelemeli', async () => {
    const ctx: WorkflowContext = {
      dosyaId: 108,
      currentState: 'FINANCE_REVIEW',
      actorRole: 'mali_hizmetler'
    }

    const actions = await resolveNextActions(
      DIRECT_PROCUREMENT_WORKFLOW_DEFINITION,
      ctx
    )

    expect(actions.length).toBe(2)
    const actionIds = actions.map((a) => a.transition.id)
    expect(actionIds).toContain('T_APPROVE_FINANCE_SEND_TO_ACCOUNTING')
    expect(actionIds).toContain('T_RETURN_FROM_FINANCE')
  })
})
