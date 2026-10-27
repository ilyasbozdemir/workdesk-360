import { describe, it, expect, beforeEach } from 'vitest'
import { FlowEngine } from '../engine.js'
import {
  FLOW_DEFINITION_2886,
  FORM_SCHEMAS_2886,
  DOCUMENT_TEMPLATES_2886
} from '../module2886.js'

describe('FlowEngine — Genel Süreç ve Belge Yürütme Motoru (2886 İhale Entegrasyonu)', () => {
  let engine: FlowEngine

  beforeEach(() => {
    engine = new FlowEngine()
    engine.registerFlowDefinition(FLOW_DEFINITION_2886)
    for (const schema of FORM_SCHEMAS_2886) {
      engine.registerFormSchema(schema)
    }
    for (const template of DOCUMENT_TEMPLATES_2886) {
      engine.registerTemplate(template)
    }
  })

  it('2886 Taşınmaz İhale Sürecini başlatmalı ve ilk adımı aktif yapmalıdır', () => {
    const instance = engine.startProcess({
      definitionId: FLOW_DEFINITION_2886.id,
      title: 'Kadıköy 104 Ada 12 Parsel Taşınmaz Satış İhalesi',
      initiatorId: 'user-emlak-01',
      initiatorName: 'Emlak İstimlak Md. Ahmet Bey'
    })

    expect(instance.id).toBeDefined()
    expect(instance.status).toBe('active')
    expect(instance.flowDefinitionId).toBe('flow-2886-tasinmaz-ihale')
    expect(instance.currentStepId).toBe('step-tasinmaz-bilgileri')

    // İlk adım in_progress olmalı
    const currentExec = instance.stepExecutions['step-tasinmaz-bilgileri']
    expect(currentExec?.status).toBe('in_progress')
  })

  it('Form adımını yürütmeli, verileri kaydetmeli ve sonraki belge adımına ilerlemelidir', () => {
    const instance = engine.startProcess({
      definitionId: FLOW_DEFINITION_2886.id,
      title: 'Beşiktaş Taşınmaz Kiralama İhalesi',
      initiatorId: 'user-01',
      initiatorName: 'Müdür Ali Bey'
    })

    // Adım 1: Form Verilerini Gir
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-tasinmaz-bilgileri',
      actorId: 'user-01',
      actorName: 'Müdür Ali Bey',
      formData: {
        tasinmaz_adi: 'Akaretler Dükkan No: 4',
        islem_turu: 'kiralama',
        ada_parsel: '204 / 15',
        yuzolcumu: 450,
        tahmini_bedel: 1500000,
        gecici_teminat: 45000,
        ihale_usulu: 'AcikTeklif_45',
        organizationName: 'Beşiktaş Belediyesi'
      }
    })

    // Adım 1 tamamlanmış olmalı, sonraki adım belge adımı olmalı
    expect(instance.currentStepId).toBe('step-baskanlik-oluru-belge')
    const step1Exec = instance.stepExecutions['step-tasinmaz-bilgileri']
    expect(step1Exec?.status).toBe('completed')
    expect(step1Exec?.data?.tasinmaz_adi).toBe('Akaretler Dükkan No: 4')
  })

  it('Belge adımında şablonu süreç verileriyle birleştirip A4 EBYS matbu evrak üretmelidir', () => {
    const instance = engine.startProcess({
      definitionId: FLOW_DEFINITION_2886.id,
      title: 'Kadıköy Taşınmaz İhalesi',
      initiatorId: 'user-01',
      initiatorName: 'Müdür Ali'
    })

    // 1. Formu doldur
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-tasinmaz-bilgileri',
      actorId: 'user-01',
      actorName: 'Müdür Ali',
      formData: {
        tasinmaz_adi: 'Moda Sahil Büfe',
        islem_turu: 'satis',
        ada_parsel: '105 / 8',
        yuzolcumu: 320,
        tahmini_bedel: 850000,
        gecici_teminat: 25500,
        ihale_usulu: 'KapaliTeklif_36',
        organizationName: 'Kadıköy Belediyesi'
      }
    })

    // 2. Belge üret (2886-EVR-01 Başkanlık Oluru)
    const { document } = engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-baskanlik-oluru-belge',
      actorId: 'user-01',
      actorName: 'Müdür Ali',
      customOverrides: {
        sayiNo: '2886-2026/044',
        tarih: '27.10.2026'
      }
    })

    expect(document.id).toBeDefined()
    expect(document.templateId).toBe('2886-EVR-01')
    expect(document.renderedHtml).toContain('Kadıköy Belediyesi')
    expect(document.renderedHtml).toContain('Moda Sahil Büfe')
    expect(document.renderedHtml).toContain('105 / 8') // Ada no
    expect(document.renderedHtml).toContain('850000') // Tahmini bedel

    // Sonraki adım onay adımı olmalı
    expect(instance.currentStepId).toBe('step-encumen-yetki-onay')

    // Kayıtlı belgelerde yer almalı
    const docs = engine.getDocuments(instance.id)
    expect(docs.length).toBe(1)
    expect(docs[0].id).toBe(document.id)
  })

  it('Onay adımında encümen yetki onayını işlemeli ve sonraki aşamaya (Kıymet Takdiri) geçmelidir', () => {
    const instance = engine.startProcess({
      definitionId: FLOW_DEFINITION_2886.id,
      title: 'İhale Onay Testi',
      initiatorId: 'user-01',
      initiatorName: 'Müdür Ali'
    })

    // Form
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-tasinmaz-bilgileri',
      actorId: 'user-01',
      actorName: 'Müdür Ali',
      formData: {
        tasinmaz_adi: 'Merkez Arsa',
        islem_turu: 'satis',
        ada_parsel: '10 / 2',
        yuzolcumu: 100,
        tahmini_bedel: 500000,
        gecici_teminat: 15000,
        ihale_usulu: 'AcikTeklif_45',
        organizationName: 'Test Belediyesi'
      }
    })

    // Belge
    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-baskanlik-oluru-belge',
      actorId: 'user-01',
      actorName: 'Müdür Ali'
    })

    // Onay: Encümen Onayı
    engine.executeApprovalStep({
      instanceId: instance.id,
      stepId: 'step-encumen-yetki-onay',
      decision: 'approved',
      notes: 'Encümenin 2026/12 sayılı kararıyla uygun bulunmuştur.',
      actorId: 'encumen-baskani',
      actorName: 'Baskan Yard. Veli Bey'
    })

    // 1. Aşama tamamlanıp 2. Aşama (Kıymet Takdiri) grubundaki ilk adıma geçmeli
    expect(instance.currentStepId).toBe('step-komisyon-atamasi')

    // Tarihçede tüm hareketler izlenebilir olmalı
    const history = engine.getHistory(instance.id)
    expect(history.length).toBeGreaterThanOrEqual(4)
    expect(history.some(h => h.action === 'process_started')).toBe(true)
    expect(history.some(h => h.action === 'step_approved')).toBe(true)
  })

  it('Onay adımı reddedilirse süreci cancelled durumuna getirmeli ve sonraki adımlara geçmemelidir', () => {
    const instance = engine.startProcess({
      definitionId: FLOW_DEFINITION_2886.id,
      title: 'Reddedilecek İhale Talebi',
      initiatorId: 'user-01',
      initiatorName: 'Müdür Ali'
    })

    // Form
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-tasinmaz-bilgileri',
      actorId: 'user-01',
      actorName: 'Müdür Ali',
      formData: {
        tasinmaz_adi: 'Reddedilecek Arsa',
        islem_turu: 'satis',
        ada_parsel: '10 / 2',
        yuzolcumu: 100,
        tahmini_bedel: 500000,
        gecici_teminat: 15000,
        ihale_usulu: 'AcikTeklif_45',
        organizationName: 'Test Belediyesi'
      }
    })

    // Belge
    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-baskanlik-oluru-belge',
      actorId: 'user-01',
      actorName: 'Müdür Ali'
    })

    // Onay: Red
    engine.executeApprovalStep({
      instanceId: instance.id,
      stepId: 'step-encumen-yetki-onay',
      decision: 'rejected',
      notes: 'Kamu yararı bulunmadığından encümence reddedilmiştir.',
      actorId: 'encumen-baskani',
      actorName: 'Baskan Veli'
    })

    expect(instance.status).toBe('cancelled')
    const rejectedExec = instance.stepExecutions['step-encumen-yetki-onay']
    expect(rejectedExec?.status).toBe('returned')
    expect(rejectedExec?.notes).toContain('Kamu yararı bulunmadığından')
  })
})
