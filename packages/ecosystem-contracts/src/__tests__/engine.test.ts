import { describe, it, expect, beforeEach } from 'vitest'
import { FlowEngine } from '../engine.js'
import {
  GENERIC_FLOW_DEFINITION,
  FORM_SCHEMA_KURUMSAL_TALEP,
  DOCUMENT_TEMPLATE_TALEP_ONAY_YAZISI
} from '../genericSampleFlows.js'

describe('FlowEngine — Genel Süreç ve Belge Yürütme Motoru (FLOWDESK 360)', () => {
  let engine: FlowEngine

  beforeEach(() => {
    engine = new FlowEngine()
    engine.registerFlowDefinition(GENERIC_FLOW_DEFINITION)
    engine.registerFormSchema(FORM_SCHEMA_KURUMSAL_TALEP)
    engine.registerTemplate(DOCUMENT_TEMPLATE_TALEP_ONAY_YAZISI)
  })

  it('Genel Kurumsal Talep Sürecini başlatmalı ve ilk adımı aktif yapmalıdır', () => {
    const instance = engine.startProcess({
      definitionId: GENERIC_FLOW_DEFINITION.id,
      title: 'Bilgi İşlem Sunucu Bakım Talebi',
      initiatorId: 'user-01',
      initiatorName: 'Mühendis Ali Bey'
    })

    expect(instance.id).toBeDefined()
    expect(instance.status).toBe('active')
    expect(instance.flowDefinitionId).toBe('flow-kurumsal-talep-yonetimi')
    expect(instance.currentStepId).toBe('step-talep-formu')

    // İlk adım in_progress olmalı
    const currentExec = instance.stepExecutions['step-talep-formu']
    expect(currentExec?.status).toBe('in_progress')
  })

  it('Form adımını yürütmeli, verileri kaydetmeli ve sonraki belge adımına ilerlemelidir', () => {
    const instance = engine.startProcess({
      definitionId: GENERIC_FLOW_DEFINITION.id,
      title: 'Ofis Donanım Talebi',
      initiatorId: 'user-01',
      initiatorName: 'Ahmet Bey'
    })

    // Adım 1: Form Verilerini Gir
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-talep-formu',
      actorId: 'user-01',
      actorName: 'Ahmet Bey',
      formData: {
        talep_basligi: 'Yedek Monitör ve Klavye Talebi',
        talep_eden_birim: 'Yazılım Geliştirme Birimi',
        ihtiyac_aciklamasi: 'Yeni başlayan geliştiriciler için donanım ihtiyacı.',
        tahmini_butce: 25000,
        oncelik: 'normal'
      }
    })

    // Adım 1 tamamlanmış olmalı, sonraki adım belge adımı olmalı
    expect(instance.currentStepId).toBe('step-talep-belgesi')
    const step1Exec = instance.stepExecutions['step-talep-formu']
    expect(step1Exec?.status).toBe('completed')
    expect(step1Exec?.data?.talep_basligi).toBe('Yedek Monitör ve Klavye Talebi')
  })

  it('Belge adımında şablonu süreç verileriyle birleştirip matbu evrak üretmelidir', () => {
    const instance = engine.startProcess({
      definitionId: GENERIC_FLOW_DEFINITION.id,
      title: 'Sunucu Bakım Sözleşmesi',
      initiatorId: 'user-01',
      initiatorName: 'Mühendis Ali'
    })

    // 1. Formu doldur
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-talep-formu',
      actorId: 'user-01',
      actorName: 'Mühendis Ali',
      formData: {
        talep_basligi: 'Ana Veri Merkezi Bakım Hizmeti',
        talep_eden_birim: 'Bilgi İşlem Daire Başkanlığı',
        ihtiyac_aciklamasi: 'Yıllık periyodik veri tabanı ve donanım bakımı',
        tahmini_butce: 180000,
        oncelik: 'high'
      }
    })

    // 2. Belge üret (DOC-TALEP-01)
    const { document } = engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-talep-belgesi',
      actorId: 'user-01',
      actorName: 'Mühendis Ali'
    })

    expect(document.id).toBeDefined()
    expect(document.templateId).toBe('DOC-TALEP-01')
    expect(document.renderedHtml).toContain('Bilgi İşlem Daire Başkanlığı')
    expect(document.renderedHtml).toContain('Ana Veri Merkezi Bakım Hizmeti')
    expect(document.renderedHtml).toContain('180000')

    // Sonraki adım onay adımı olmalı
    expect(instance.currentStepId).toBe('step-amir-onayi')

    // Kayıtlı belgelerde yer almalı
    const docs = engine.getDocuments(instance.id)
    expect(docs.length).toBe(1)
    expect(docs[0].id).toBe(document.id)
  })

  it('Onay adımında amir onayını işlemeli ve sonraki aşamaya (görev atama) geçmelidir', () => {
    const instance = engine.startProcess({
      definitionId: GENERIC_FLOW_DEFINITION.id,
      title: 'Donanım Onay Testi',
      initiatorId: 'user-01',
      initiatorName: 'Ali'
    })

    // Form
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-talep-formu',
      actorId: 'user-01',
      actorName: 'Ali',
      formData: {
        talep_basligi: 'Kırtasiye Talebi',
        talep_eden_birim: 'İdari İşler',
        ihtiyac_aciklamasi: 'A4 Kağıt ve toner',
        tahmini_butce: 12000,
        oncelik: 'normal'
      }
    })

    // Belge
    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-talep-belgesi',
      actorId: 'user-01',
      actorName: 'Ali'
    })

    // Onay
    engine.executeApprovalStep({
      instanceId: instance.id,
      stepId: 'step-amir-onayi',
      decision: 'approved',
      notes: 'Bütçe dahilinde uygundur.',
      actorId: 'amir-01',
      actorName: 'Daire Başkanı Mehmet Bey'
    })

    // 1. Aşama tamamlanıp 2. Aşama (step-gorev-atama) adımına geçmeli
    expect(instance.currentStepId).toBe('step-gorev-atama')

    // Tarihçede tüm hareketler izlenebilir olmalı
    const history = engine.getHistory(instance.id)
    expect(history.length).toBeGreaterThanOrEqual(4)
    expect(history.some(h => h.action === 'process_started')).toBe(true)
    expect(history.some(h => h.action === 'step_approved')).toBe(true)
  })

  it('Onay adımı reddedilirse süreci cancelled durumuna getirmeli ve sonraki adımlara geçmemelidir', () => {
    const instance = engine.startProcess({
      definitionId: GENERIC_FLOW_DEFINITION.id,
      title: 'Reddedilecek Talep',
      initiatorId: 'user-01',
      initiatorName: 'Ali'
    })

    // Form
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-talep-formu',
      actorId: 'user-01',
      actorName: 'Ali',
      formData: {
        talep_basligi: 'Gereksiz Harcama Talebi',
        talep_eden_birim: 'Özel Büro',
        ihtiyac_aciklamasi: 'Ödenek yetersizliği',
        tahmini_butce: 999999,
        oncelik: 'urgent'
      }
    })

    // Belge
    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-talep-belgesi',
      actorId: 'user-01',
      actorName: 'Ali'
    })

    // Onay: Red
    engine.executeApprovalStep({
      instanceId: instance.id,
      stepId: 'step-amir-onayi',
      decision: 'rejected',
      notes: 'Bütçe yetersiz olduğundan onaylanmamıştır.',
      actorId: 'amir-01',
      actorName: 'Başkan Mehmet'
    })

    expect(instance.status).toBe('cancelled')
    const rejectedExec = instance.stepExecutions['step-amir-onayi']
    expect(rejectedExec?.status).toBe('returned')
    expect(rejectedExec?.notes).toContain('Bütçe yetersiz olduğundan')
  })
})
