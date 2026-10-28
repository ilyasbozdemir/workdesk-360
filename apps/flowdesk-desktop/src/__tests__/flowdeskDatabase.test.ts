import { describe, it, expect, beforeEach } from 'vitest'
import { FlowdeskDatabase } from '../main/database/index.js'

describe('FlowdeskDatabase — Kurumsal Dinamik Süreç ve Veri İzolasyon Testleri', () => {
  let db: FlowdeskDatabase

  beforeEach(() => {
    // İzole in-memory SQLite veritabanı
    db = new FlowdeskDatabase(':memory:')
  })

  it('Veritabanı başlatıldığında genel amaçlı kurumsal şablonları tohumlamalıdır', () => {
    const templates = db.getTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(4)

    const codes = templates.map((t) => t.kod)
    expect(codes).toContain('SBL-TALEP')
    expect(codes).toContain('SBL-RESMI')
    expect(codes).toContain('SBL-SAHA')
    expect(codes).toContain('SBL-IT')
  })

  it('FLOWDESK 360 veritabanı ve şablonları ASLA 2886 İhale Kanunu veya Doğrudan Temin içermemelidir (İzolasyon Güvencesi)', () => {
    const templates = db.getTemplates()
    for (const t of templates) {
      // 2886 mevzuatı içermeme kontrolü
      expect(t.kod).not.toContain('2886')
      expect(t.ad).not.toContain('2886')
      expect(t.ad.toLowerCase()).not.toContain('ihale')
      expect(t.ad.toLowerCase()).not.toContain('doğrudan temin')

      for (const step of t.adimlar) {
        expect(step.baslik.toLowerCase()).not.toContain('2886')
        expect(step.baslik.toLowerCase()).not.toContain('muhammen bedel')
        expect(step.baslik.toLowerCase()).not.toContain('encümen kararı')
        expect(step.baslik.toLowerCase()).not.toContain('açık artırma')
      }
    }
  })

  it('Şablondan yeni bir süreç başlatmalı, adımları klonlamalı ve ilk adımı aktif yapmalıdır', () => {
    const detail = db.startProcess({
      templateId: 'sbl-talep-01',
      title: 'Bilgi İşlem 2026 Yedek Parça İhtiyaç Talebi',
      initiator: 'Ahmet Yılmaz',
      initiatorUnit: 'Bilgi İşlem Dairesi',
      initialData: { tahminiMaliyet: 45000 }
    })

    expect(detail.surec.id).toBeDefined()
    expect(detail.surec.durum).toBe('aktif')
    expect(detail.surec.baslik).toBe('Bilgi İşlem 2026 Yedek Parça İhtiyaç Talebi')
    expect(detail.surec.ilerlemeYuzdesi).toBe(0)

    // Adımlar klonlanmış olmalı
    expect(detail.adimlar.length).toBe(4)
    expect(detail.adimlar[0].durum).toBe('devam_ediyor')
    expect(detail.adimlar[1].durum).toBe('beklemede')
    expect(detail.surec.aktifAdimId).toBe(detail.adimlar[0].id)

    // Tarihçe kaydı
    expect(detail.tarihce.length).toBe(1)
    expect(detail.tarihce[0].islem).toBe('surec_baslatildi')
  })

  it('Şablon güncellense dahi daha önce başlatılmış sürecin adımları ve geçmişi değişmemelidir (İmmutability)', () => {
    // 1. Süreç başlat
    const detail = db.startProcess({
      templateId: 'sbl-talep-01',
      title: 'İmmutability Test Süreci',
      initiator: 'Test Memur'
    })

    const initialStepCount = detail.adimlar.length
    expect(initialStepCount).toBe(4)

    // 2. Şablonu değiştir (adımlardan birini silerek güncelle)
    db.updateTemplate('sbl-talep-01', {
      ad: 'Değiştirilmiş Şablon Adı',
      adimlar: [
        {
          adimKodu: 'ADM-YENI-1',
          baslik: 'Tek Adımlı Yeni Tasarım',
          adimTuru: 'form',
          sira: 1
        }
      ]
    })

    // 3. Çalışan sürecin adımlarını tekrar oku
    const reloaded = db.getProcessById(detail.surec.id)
    expect(reloaded).not.null
    // Sürecin adımları 4 olarak korunmalıdır, şablondaki 1 adıma düşmemelidir!
    expect(reloaded?.adimlar.length).toBe(4)
    expect(reloaded?.adimlar[0].adimKodu).toBe('ADM-01')
  })

  it('Form adımı veri girilerek tamamlandığında bir sonraki adıma geçmeli ve ilerleme güncellenmelidir', () => {
    const detail = db.startProcess({
      templateId: 'sbl-talep-01',
      title: 'Birim Malzeme Talebi',
      initiator: 'Fatma Kaya'
    })

    const step1 = detail.adimlar[0]
    expect(step1.durum).toBe('devam_ediyor')

    const advanceResult = db.advanceStep({
      processId: detail.surec.id,
      stepId: step1.id,
      actor: 'Fatma Kaya',
      formData: {
        talep_konusu: 'Yazıcı Toner Talebi',
        talep_edilen_malzeme: '10 Adet Siyah Lazer Toner',
        oncelik: 'acil'
      },
      notes: 'Acil ihtiyaçtır.'
    })

    expect(advanceResult.success).toBe(true)
    expect(advanceResult.processCompleted).toBe(false)

    const updated = db.getProcessById(detail.surec.id)
    expect(updated).not.null
    // 1. Adım tamamlandı, 2. Adım devam ediyor
    expect(updated?.adimlar[0].durum).toBe('tamamlandi')
    expect(updated?.adimlar[0].formVerisi?.['talep_konusu']).toBe('Yazıcı Toner Talebi')
    expect(updated?.adimlar[1].durum).toBe('devam_ediyor')
    expect(updated?.surec.aktifAdimId).toBe(updated?.adimlar[1].id)
    expect(updated?.surec.ilerlemeYuzdesi).toBe(25) // 1/4 = %25
  })

  it('Onay adımında iade edildiğinde süreç bir önceki adıma kontrollü geri dönmelidir', () => {
    const detail = db.startProcess({
      templateId: 'sbl-talep-01',
      title: 'İade Testi Süreci',
      initiator: 'Mehmet Demir'
    })

    // Adım 1'i tamamla -> Adım 2'ye geç
    db.advanceStep({
      processId: detail.surec.id,
      stepId: detail.adimlar[0].id,
      actor: 'Mehmet Demir'
    })

    const stateAfterStep1 = db.getProcessById(detail.surec.id)
    const step2 = stateAfterStep1!.adimlar[1]
    expect(step2.durum).toBe('devam_ediyor')

    // Adım 2'yi Adım 1'e iade et
    const returnResult = db.returnStep({
      processId: detail.surec.id,
      stepId: step2.id,
      actor: 'Şube Müdürü',
      reason: 'Bütçe kalemi ve miktar eksik belirtilmiş.'
    })

    expect(returnResult.success).toBe(true)

    const stateAfterReturn = db.getProcessById(detail.surec.id)
    expect(stateAfterReturn?.adimlar[1].durum).toBe('iade_edildi')
    // Önceki adım yeniden devam_ediyor oldu
    expect(stateAfterReturn?.adimlar[0].durum).toBe('devam_ediyor')
    expect(stateAfterReturn?.surec.aktifAdimId).toBe(stateAfterReturn?.adimlar[0].id)

    // Tarihçede iade logu mevcut olmalı
    const lastLog = stateAfterReturn?.tarihce[stateAfterReturn.tarihce.length - 1]
    expect(lastLog?.islem).toBe('adim_iade_edildi')
  })

  it('Onay adımında ret verildiğinde adım reddedildi ve süreç iptal durumuna geçmelidir', () => {
    const detail = db.startProcess({
      templateId: 'sbl-talep-01',
      title: 'Red Testi Süreci',
      initiator: 'Mehmet Demir'
    })

    // Adım 1'i tamamla -> Adım 2'ye geç
    db.advanceStep({
      processId: detail.surec.id,
      stepId: detail.adimlar[0].id,
      actor: 'Mehmet Demir'
    })

    const stateAfterStep1 = db.getProcessById(detail.surec.id)
    const step2 = stateAfterStep1!.adimlar[1]

    // Reddet
    const rejectResult = db.rejectStep({
      processId: detail.surec.id,
      stepId: step2.id,
      actor: 'Şube Müdürü',
      reason: 'Mevcut stok yeterli olduğundan talep uygun görülmemiştir.'
    })

    expect(rejectResult.success).toBe(true)

    const finalState = db.getProcessById(detail.surec.id)
    expect(finalState?.surec.durum).toBe('iptal')
    expect(finalState?.adimlar[1].durum).toBe('reddedildi')
  })

  it('Tüm adımlar tamamlandığında süreç tamamlandı durumuna geçmeli ve %100 olmalıdır', () => {
    const detail = db.startProcess({
      templateId: 'sbl-talep-01',
      title: 'Tam Akış Süreci',
      initiator: 'Canan Can'
    })

    // 4 adımı sırasıyla tamamla
    for (let i = 0; i < 4; i++) {
      const current = db.getProcessById(detail.surec.id)
      const currentStep = current!.adimlar[i]
      const res = db.advanceStep({
        processId: detail.surec.id,
        stepId: currentStep.id,
        actor: 'Yetkili'
      })
      if (i === 3) {
        expect(res.processCompleted).toBe(true)
      }
    }

    const completed = db.getProcessById(detail.surec.id)
    expect(completed?.surec.durum).toBe('tamamlandi')
    expect(completed?.surec.ilerlemeYuzdesi).toBe(100)
    expect(completed?.surec.bitisTarihi).toBeDefined()
  })

  it('Görev ve belge referansları başarıyla eklenmeli ve izlenmelidir', () => {
    const detail = db.startProcess({
      templateId: 'sbl-it-04',
      title: 'IT Yazıcı Arıza Talebi',
      initiator: 'Kullanıcı 1'
    })

    // Görev ata
    const task = db.createTask({
      processId: detail.surec.id,
      taskDescription: 'Yazıcı donanımını kontrol et ve kartuşu değiştir',
      assignedTo: 'Teknisyen Murat',
      actor: 'IT Yöneticisi'
    })

    expect(task.id).toBeDefined()
    expect(task.tamamlandi).toBe(false)

    // Görevi tamamla
    const completed = db.completeTask(task.id, 'Teknisyen Murat', 'Kartuş değiştirildi, test çıktısı alındı.')
    expect(completed).toBe(true)

    // Belge referansı ekle
    const doc = db.addDocument({
      processId: detail.surec.id,
      fileName: 'Servis_Raporu_2026.pdf',
      filePath: 'C:/Belgeler/Servis_Raporu_2026.pdf',
      uploader: 'Teknisyen Murat'
    })

    expect(doc.id).toBeDefined()
    expect(doc.belgeAdi).toBe('Servis_Raporu_2026.pdf')

    // Dashboard istatistikleri
    const stats = db.getDashboardStats()
    expect(stats.totalProcesses).toBeGreaterThanOrEqual(1)
  })

  it('Şablon ve algoritma tabanlı 3194 İmar Kanunu Kaçak Yapı (Md. 32/42) ve 2886 modüllerini isteğe bağlı yükleyip algoritmik dallanmaları yürütmelidir', () => {
    const imarTemplate = db.installStatutoryModule('IMAR_3194_KACAK_YAPI')
    expect(imarTemplate.kod).toBe('SBL-IMAR-3194')
    expect(imarTemplate.adimlar.length).toBe(6)

    const proc = db.startProcess({
      templateId: imarTemplate.id,
      title: '142 Ada 8 Parsel Kaçak Yapı Takibi',
      initiator: 'Yapı Kontrol Ekibi'
    })

    // 1. Adım: Mühürleme ve Md. 42 Ceza Parametreleri
    const res1 = db.advanceStep({
      processId: proc.surec.id,
      stepId: proc.adimlar[0].id,
      actor: 'Yapı Kontrol Mühendisi',
      formData: {
        ada_parsel: '142 Ada 8 Parsel',
        yapi_sahibi: 'Ali Veli',
        aykirilik_turu: 'ruhsatsiz',
        aykirilik_alani_m2: 120,
        yapi_sinifi: 'III',
        birim_maliyet_tl: 15000,
        imar_durumu: 'planli',
        kamu_tehlikesi_var_mi: false,
        muhurleme_tarihi: '2026-10-01'
      }
    })

    expect(res1.success).toBe(true)
    expect(res1.computedData?.['yasal_sure_bitis_tarihi']).toBe('2026-10-31')
    // 120 * 15000 * 0.06 = 108.000 * 2.0 (ruhsatsiz) = 216.000 TL
    expect(res1.computedData?.['hesaplanan_idari_para_cezasi']).toBe(216000)

    // 2. Adım: Encümen Ceza Kararı Onayı
    const after1 = db.getProcessById(proc.surec.id)!
    db.advanceStep({
      processId: proc.surec.id,
      stepId: after1.adimlar[1].id,
      actor: 'Belediye Encümeni'
    })

    // 3. Adım: 30 Gün Sonu Kontrol -> Ruhsata bağlanmadı ('hayir') -> IMAR-04A (Mühür Fekki) atlanmalı, IMAR-04B (Yıkım ve Savcılık) seçilmeli
    const after2 = db.getProcessById(proc.surec.id)!
    const res3 = db.advanceStep({
      processId: proc.surec.id,
      stepId: after2.adimlar[2].id,
      actor: 'Yapı Kontrol Mühendisi',
      formData: {
        kontrol_tarihi: '2026-11-01',
        ruhsata_baglandi_mi: 'hayir',
        kontrol_ozeti: 'Yasal sürede ruhsat alınmadı.'
      }
    })

    expect(res3.selectedBranchStepCode).toBe('IMAR-04B')
    expect(res3.skippedStepCodes).toContain('IMAR-04A')

    const after3 = db.getProcessById(proc.surec.id)!
    const muhurFekkiStep = after3.adimlar.find((a) => a.adimKodu === 'IMAR-04A')
    const yikimStep = after3.adimlar.find((a) => a.adimKodu === 'IMAR-04B')
    expect(muhurFekkiStep?.durum).toBe('atlandi')
    expect(yikimStep?.durum).toBe('devam_ediyor')
  })
})
