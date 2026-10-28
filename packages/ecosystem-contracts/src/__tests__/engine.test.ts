import { describe, it, expect, beforeEach } from 'vitest'
import { FlowEngine } from '../engine.js'
import {
  GENERIC_FLOW_DEFINITION,
  FORM_SCHEMA_KURUMSAL_TALEP,
  DOCUMENT_TEMPLATE_TALEP_ONAY_YAZISI
} from '../genericSampleFlows.js'
import {
  MODULE_IMAR_KACAK_YAPI_3194,
  MODULE_DEVLET_IHALE_2886
} from '../statutoryProcessModules.js'

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

  it('3194 İmar Kanunu Md. 32/42 Kaçak Yapı Modülü: 30 günlük süre, Md. 42 ceza algoritması ve Yıkım/Savcılık (TCK 184) dalını yürütmelidir', () => {
    engine.registerModule(MODULE_IMAR_KACAK_YAPI_3194)

    const instance = engine.startProcess({
      definitionId: 'flow-imar-kacak-yapi-3194',
      title: 'Cumhuriyet Mah. 142 Ada 8 Parsel Kaçak Yapı Dosyası',
      initiatorId: 'kontrol-01',
      initiatorName: 'Yapı Kontrol Mühendisi'
    })

    // 1. Saha Tespiti ve Mühürleme (2026-10-01 -> +30 gün = 2026-10-31)
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-imar-saha-tespit',
      actorId: 'kontrol-01',
      actorName: 'Yapı Kontrol Mühendisi',
      formData: {
        ada_parsel: 'Cumhuriyet Mah. 142 Ada 8 Parsel',
        yapi_sahibi: 'Hasan Kaya',
        aykirilik_turu: 'ruhsatsiz',
        aykirilik_alani_m2: 100,
        yapi_sinifi: 'III',
        birim_maliyet_tl: 15000,
        imar_durumu: 'plansiz',
        kamu_tehlikesi_var_mi: false,
        muhurleme_tarihi: '2026-10-01'
      }
    })

    const aggregatedAfterStep1 = engine.getAggregatedData(instance)
    // 30 günlük kanuni süre hesabı: 2026-10-01 + 30 gün = 2026-10-31
    expect(aggregatedAfterStep1.yasal_sure_bitis_tarihi).toBe('2026-10-31')
    // Md. 42 Ceza: 100 m² * 15000 TL * 0.06 (III. Sınıf) = 90.000 TL temel ceza
    // Artırım: ruhsatsiz (+1.0) + plansiz (+0.5) = 2.5x -> 225.000 TL
    expect(aggregatedAfterStep1.temel_idari_para_cezasi).toBe(90000)
    expect(aggregatedAfterStep1.hesaplanan_idari_para_cezasi).toBe(225000)

    // 2. Yapı Tatil Zaptı ve Encümen Ceza Kararı Belgeleri
    const { document: zaptDoc } = engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-imar-yapi-tatil-zapti',
      actorId: 'kontrol-01',
      actorName: 'Yapı Kontrol Mühendisi'
    })
    expect(zaptDoc.renderedHtml).toContain('2026-10-31')

    const { document: cezaDoc } = engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-imar-encumen-ceza-belgesi',
      actorId: 'encumen-01',
      actorName: 'Encümen Yazı İşleri'
    })
    expect(cezaDoc.renderedHtml).toContain('225000')

    // 3. 30 Günlük Süre Sonu Kontrol: Ruhsata bağlanmadı ('hayir') -> Dal A (Mühür Fekki) atlanmalı, Dal B (Yıkım ve Savcılık) seçilmeli!
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-imar-30-gun-kontrol',
      actorId: 'kontrol-01',
      actorName: 'Yapı Kontrol Mühendisi',
      formData: {
        kontrol_tarihi: '2026-11-02',
        ruhsata_baglandi_mi: 'hayir',
        kontrol_ozeti: '30 günlük yasal sürede ruhsat alınmadığı ve kaçak inşaatın durduğu tespit edildi.'
      }
    })

    // Mühür fekki adımı 'skipped' olmalı ve aktif adım 'step-imar-yikim-ve-savcilik' olmalı
    expect(instance.stepExecutions['step-imar-muhur-fekki']?.status).toBe('skipped')
    expect(instance.currentStepId).toBe('step-imar-yikim-ve-savcilik')

    // 4. Yıkım Kararı + TCK 184 Suç Duyurusu Belgesi ve Fen İşleri Yıkım İnfaz Görevi
    const { document: yikimDoc } = engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-imar-yikim-ve-savcilik',
      actorId: 'hukuk-01',
      actorName: 'Hukuk İşleri'
    })
    expect(yikimDoc.renderedHtml).toContain('184. maddesi')

    engine.executeTaskStep({
      instanceId: instance.id,
      stepId: 'step-imar-yikim-infaz',
      actorId: 'fen-01',
      actorName: 'Fen İşleri Yıkım Ekibi',
      notes: 'Yıkım gerçekleştirildi ve masraf tahsil müzekkeresi Mali Hizmetlere gönderildi.'
    })

    expect(instance.status).toBe('completed')
  })

  it('3194 İmar Kanunu Md. 32: 30 gün içinde ruhsat alındığında Mühür Fekki dalını çalıştırıp Yıkım dalını atlamalıdır', () => {
    engine.registerModule(MODULE_IMAR_KACAK_YAPI_3194)

    const instance = engine.startProcess({
      definitionId: 'flow-imar-kacak-yapi-3194',
      title: 'Ruhsata Bağlanan Yapı Dosyası',
      initiatorId: 'kontrol-01',
      initiatorName: 'Mühendis'
    })

    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-imar-saha-tespit',
      actorId: 'kontrol-01',
      actorName: 'Mühendis',
      formData: {
        ada_parsel: 'Yeni Mah. 10 Ada 2 Parsel',
        yapi_sahibi: 'Ayşe Demir',
        aykirilik_turu: 'ruhsata_aykiri',
        aykirilik_alani_m2: 40,
        yapi_sinifi: 'III',
        birim_maliyet_tl: 15000,
        imar_durumu: 'planli',
        muhurleme_tarihi: '2026-10-05'
      }
    })
    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-imar-yapi-tatil-zapti',
      actorId: 'kontrol-01',
      actorName: 'Mühendis'
    })
    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-imar-encumen-ceza-belgesi',
      actorId: 'kontrol-01',
      actorName: 'Mühendis'
    })

    // 30 gün içinde ruhsat alındı ('evet') -> Mühür fekki dalına geçmeli
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-imar-30-gun-kontrol',
      actorId: 'kontrol-01',
      actorName: 'Mühendis',
      formData: {
        kontrol_tarihi: '2026-10-20',
        ruhsata_baglandi_mi: 'evet',
        kontrol_ozeti: 'Tadilat ruhsatı onaylandı, aykırılık giderildi.'
      }
    })

    expect(instance.currentStepId).toBe('step-imar-muhur-fekki')

    // Mühür Fekki sonlandırıcı dal (terminalStep: true) olduğu için tamamlandığında Yıkım adımları 'skipped' olup süreç tamamlanmalı
    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-imar-muhur-fekki',
      actorId: 'kontrol-01',
      actorName: 'Mühendis'
    })

    expect(instance.status).toBe('completed')
    expect(instance.stepExecutions['step-imar-yikim-ve-savcilik']?.status).toBe('skipped')
    expect(instance.stepExecutions['step-imar-yikim-infaz']?.status).toBe('skipped')
  })

  it('2886 Devlet İhale Kanunu Modülü: %3/%6 teminat, Kapalı Teklif usulü ve 15 iş günü onay süresi algoritmasını şablon üzerinden yürütmelidir', () => {
    engine.registerModule(MODULE_DEVLET_IHALE_2886)

    const instance = engine.startProcess({
      definitionId: 'flow-devlet-ihale-2886',
      title: 'Belediye İşhanı No:12 Kiralama İhalesi',
      initiatorId: 'emlak-01',
      initiatorName: 'Emlak Şefi'
    })

    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-2886-kiymet-takdiri',
      actorId: 'emlak-01',
      actorName: 'Emlak Şefi',
      formData: {
        tasinmaz_tanimi: 'Merkez İşhanı 12 Nolu İşyeri',
        islem_turu: 'kiralama',
        tahmini_bedel: 4000000,
        parasal_limit: 2500000
      }
    })

    const data1 = engine.getAggregatedData(instance)
    // %3 Geçici Teminat: 4.000.000 * 0.03 = 120.000 TL
    expect(data1.gecici_teminat_tutari).toBe(120000)
    // 4.000.000 >= 2.500.000 -> Kapalı Teklif Usulü (2886 Md. 36)
    expect(data1.belirlenen_ihale_usulu).toContain('Kapalı Teklif Usulü')

    engine.executeDocumentStep({
      instanceId: instance.id,
      stepId: 'step-2886-onay-belgesi',
      actorId: 'emlak-01',
      actorName: 'Emlak Şefi'
    })

    engine.executeApprovalStep({
      instanceId: instance.id,
      stepId: 'step-2886-ita-amiri-ihale-onayi',
      decision: 'approved',
      actorId: 'baskan-01',
      actorName: 'İta Amiri'
    })

    // Komisyon kararı: Uygun teklif var (4.500.000 TL), karar tarihi 2026-10-01 (+15 iş günü = 2026-10-22)
    engine.executeFormStep({
      instanceId: instance.id,
      stepId: 'step-2886-komisyon-karari',
      actorId: 'komisyon-01',
      actorName: 'İhale Komisyonu Başkanı',
      formData: {
        karar_tarihi: '2026-10-01',
        ihale_sonucu: 'uygun_teklif_var',
        kazanan_istekli: 'Anadolu Ticaret A.Ş.',
        ihale_bedeli: 4500000
      }
    })

    const data2 = engine.getAggregatedData(instance)
    expect(data2.kesin_teminat_tutari).toBe(270000) // %6 Kesin Teminat
    expect(data2.ita_amiri_onay_son_tarihi).toBe('2026-10-22') // 15 iş günü
    // Pazarlığa dönüşüm adımı atlanmalı, kesinleşen karar tebligatı aktif olmalı
    expect(instance.stepExecutions['step-2886-pazarlik-donusum']?.status).toBe('skipped')
    expect(instance.currentStepId).toBe('step-2886-kesinlesen-karar-belgesi')
  })
})
