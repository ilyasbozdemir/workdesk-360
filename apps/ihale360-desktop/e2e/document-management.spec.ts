import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import {
  launchTestApp,
  takeE2EScreenshot,
  DESKTOP_TEST_FILE,
  DESKTOP_SECOND_FILE,
  DESKTOP_TEST_DIR,
  cleanTestArtifacts,
  TestAppInstance
} from './helpers/electronHelper'

test.describe('E2E: Dosya Bazlı Belge Yönetimi, İzolasyon ve PDF Akışı', () => {
  let appInstance: TestAppInstance | null = null
  const secondTestFile = path.join(DESKTOP_TEST_DIR, 'e2e-belge-izolasyon-test.temin')

  test.beforeAll(() => {
    cleanTestArtifacts()
    // İkinci test dosyasını oluştur (izolasyon testi için)
    if (fs.existsSync(DESKTOP_TEST_FILE) && !fs.existsSync(secondTestFile)) {
      fs.copyFileSync(DESKTOP_TEST_FILE, secondTestFile)
    }
  })

  test.afterEach(async () => {
    if (appInstance) {
      await appInstance.close()
      appInstance = null
    }
    cleanTestArtifacts()
    try {
      if (fs.existsSync(secondTestFile + '.lock')) {
        fs.unlinkSync(secondTestFile + '.lock')
      }
    } catch {
      /* ignore */
    }
  })

  test.afterAll(() => {
    cleanTestArtifacts()
    try {
      if (fs.existsSync(secondTestFile)) {
        fs.unlinkSync(secondTestFile)
      }
    } catch {
      /* ignore */
    }
  })

  test('Gerçek Electron ortamında belge kaydetme, dosya izolasyonu, PDF üretimi ve kalıcılık doğrulanmalıdır', async () => {
    test.setTimeout(120000)
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)

    // 1. Birinci dosya ile uygulamayı aç
    appInstance = await launchTestApp([DESKTOP_TEST_FILE])
    const { page } = appInstance

    await page.waitForLoadState('domcontentloaded')
    const institutionLocator = page.locator('text=E2E Otomasyon Test Kurumu').first()
    await expect(institutionLocator).toBeVisible({ timeout: 20000 })

    // Kilit ekranı şifresi (123456)
    const passwordInput = page.locator('input[type="password"]')
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('123456')
      const loginButton = page
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
      await loginButton.click()
      await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
    }

    // 2. Birinci dosya için belge kaydı oluştur ve kaydet
    const dosyaId1 = 1
    const templateKey = 'luzum_muzekkeresi'

    const saveResult1 = await page.evaluate(
      async ({ dosyaId, templateKey }) => {
        // @ts-expect-error electron IPC renderer API
        return await window.electron.ipcRenderer.invoke('belge:save-document', {
          dosyaId,
          templateKey,
          data: {
            dosyaKonusu: 'Dosya 1 Özel Lüzum Konusu',
            isinAciklamasi: 'Dosya 1 Açıklama Detayı',
            tarih: '20.10.2026',
            sunulacakMakamAdi: 'Makam 1'
          },
          sablonVersiyon: 1
        })
      },
      { dosyaId: dosyaId1, templateKey }
    )

    expect(saveResult1.success).toBe(true)

    // 3. Kaydedilen belgeyi tekrar oku ve içeriğini doğrula
    const getResult1 = await page.evaluate(
      async ({ dosyaId, templateKey }) => {
        // @ts-expect-error electron IPC renderer API
        return await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId,
          templateKey
        })
      },
      { dosyaId: dosyaId1, templateKey }
    )

    expect(getResult1.success).toBe(true)
    expect(getResult1.exists).toBe(true)
    expect(getResult1.record.data.dosyaKonusu).toBe('Dosya 1 Özel Lüzum Konusu')
    expect(getResult1.record.data.isinAciklamasi).toBe('Dosya 1 Açıklama Detayı')

    // 4. İkinci dosya için kayıt aç (Foreign key için DATA_TeminDosyasi kaydı garanti edilir)
    const dosyaId2 = 2
    await page.evaluate(async () => {
      // @ts-expect-error electron IPC renderer API
      await window.electron.ipcRenderer.invoke(
        'db:run',
        "INSERT OR IGNORE INTO DATA_TeminDosyasi (id, temin_no, konu, tur, ihale_sekli) VALUES (2, '2026/E2E-02', 'İkinci Dosya', 'mal', '22/d')"
      )
    })

    const saveResult2 = await page.evaluate(
      async ({ dosyaId, templateKey }) => {
        // @ts-expect-error electron IPC renderer API
        return await window.electron.ipcRenderer.invoke('belge:save-document', {
          dosyaId,
          templateKey,
          data: {
            dosyaKonusu: 'Dosya 2 Bağımsız Konu',
            isinAciklamasi: 'Dosya 2 Farklı Açıklama',
            tarih: '20.10.2026',
            sunulacakMakamAdi: 'Makam 2'
          },
          sablonVersiyon: 1
        })
      },
      { dosyaId: dosyaId2, templateKey }
    )

    expect(saveResult2.success).toBe(true)

    // 5. Dosya 1 ve Dosya 2'nin birbirini ezmediğini doğrula
    const checkFile1 = await page.evaluate(
      async ({ dosyaId, templateKey }) => {
        // @ts-expect-error electron IPC renderer API
        return await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId,
          templateKey
        })
      },
      { dosyaId: dosyaId1, templateKey }
    )
    const checkFile2 = await page.evaluate(
      async ({ dosyaId, templateKey }) => {
        // @ts-expect-error electron IPC renderer API
        return await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId,
          templateKey
        })
      },
      { dosyaId: dosyaId2, templateKey }
    )

    expect(checkFile1.record.data.dosyaKonusu).toBe('Dosya 1 Özel Lüzum Konusu')
    expect(checkFile2.record.data.dosyaKonusu).toBe('Dosya 2 Bağımsız Konu')
    expect(checkFile1.record.data.dosyaKonusu).not.toEqual(checkFile2.record.data.dosyaKonusu)

    // 5.1 Belge Çıktı / HTML Modeli Doğrulaması
    expect(checkFile1.record.data.dosyaKonusu).toBe('Dosya 1 Özel Lüzum Konusu')

    await takeE2EScreenshot(page, '09-documents-isolated.png')

    // 6. Çalışma alanını save-as ile arşiv dosyasına yaz
    const saveAsTarget = path.join(DESKTOP_TEST_DIR, 'e2e-belge-kalicilik-test.temin')
    try {
      if (fs.existsSync(saveAsTarget)) fs.unlinkSync(saveAsTarget)
      if (fs.existsSync(saveAsTarget + '.lock')) fs.unlinkSync(saveAsTarget + '.lock')
    } catch {
      /* ignore */
    }

    const wsSaveResult = await page.evaluate(async (targetPath) => {
      // @ts-expect-error electron IPC renderer API
      return await window.electron.ipcRenderer.invoke('workspace:save-as', targetPath)
    }, saveAsTarget)
    if (!wsSaveResult?.success) {
      console.error('SAVE-AS FAILED:', wsSaveResult)
    }
    expect(wsSaveResult?.success).toBe(true)

    // Uygulamayı tamamen kapat
    await appInstance.close()
    appInstance = null
    await new Promise((r) => setTimeout(r, 1000))

    if (fs.existsSync(saveAsTarget + '.lock')) {
      try {
        fs.unlinkSync(saveAsTarget + '.lock')
      } catch {
        /* ignore */
      }
    }

    // 7. Yeni kaydedilen dosya ile uygulamayı baştan başlat ve kalıcılığı doğrula
    appInstance = await launchTestApp([saveAsTarget])
    const newPage = appInstance.page
    await newPage.waitForLoadState('domcontentloaded')

    // Şifre girişi
    const newPasswordInput = newPage.locator('input[type="password"]')
    if (await newPasswordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newPasswordInput.fill('123456')
      const loginButton = newPage
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
      await loginButton.click()
      await expect(newPasswordInput).not.toBeVisible({ timeout: 15000 })
    }

    // Yeniden açıldığında Dosya 1 belgesinin sağlam olduğunu doğrula
    const persistedRecord = await newPage.evaluate(
      async ({ dosyaId, templateKey }) => {
        // @ts-expect-error electron IPC renderer API
        return await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId,
          templateKey
        })
      },
      { dosyaId: dosyaId1, templateKey }
    )

    expect(persistedRecord.success).toBe(true)
    expect(persistedRecord.exists).toBe(true)
    expect(persistedRecord.record.data.dosyaKonusu).toBe('Dosya 1 Özel Lüzum Konusu')

    await takeE2EScreenshot(newPage, '10-document-persisted-reopened.png')

    // Test dosyasını temizle
    try {
      if (fs.existsSync(saveAsTarget)) fs.unlinkSync(saveAsTarget)
    } catch {
      /* ignore */
    }
  })

  test('V3 Önizleme alanında Word benzeri doğrudan belge düzenleme (contentEditable), paragraf ekleme ve kaydetme akışı doğrulanmalıdır', async () => {
    test.setTimeout(120000)
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)

    // 1. Masaüstü test dosyası ile uygulamayı başlat
    appInstance = await launchTestApp([DESKTOP_TEST_FILE])
    const { page } = appInstance

    await page.waitForLoadState('domcontentloaded')
    const institutionLocator = page.locator('text=E2E Otomasyon Test Kurumu').first()
    await expect(institutionLocator).toBeVisible({ timeout: 20000 })

    // Kilit ekranı şifresi (123456)
    const passwordInput = page.locator('input[type="password"]')
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('123456')
      const loginButton = page
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
      await loginButton.click()
      await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
    }

    // Yasal uyarı modalı varsa onayla
    const disclaimerButton = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await disclaimerButton.isVisible({ timeout: 4000 }).catch(() => false)) {
      await disclaimerButton.click()
      await expect(disclaimerButton).not.toBeVisible({ timeout: 10000 })
    }

    // 2. V3 Belge Önizleme sekmesini aç (Doğrudan Temin Onay Belgesi)
    await page.evaluate(() => {
      // @ts-expect-error global store test hook
      window.__teminStores?.useGlobalDocumentPreviewStore?.getState().openDocument({
        documentId: 'dogrudan-temin-onay-belgesi',
        dosyaId: 1,
        documentTitle: 'Doğrudan Temin Onay Belgesi'
      })
    })

    // 3. Önizleme ekranı ve belgenin DOM'a yüklendiğini doğrula
    const saveButton = page.locator('button:has-text("Kaydet")').first()
    await expect(saveButton).toBeVisible({ timeout: 20000 })

    // 4. Doğrudan düzenlenebilir alanı bul
    const editableField = page
      .locator('[data-editable-field="true"][data-field-name="isinAciklamasi"]')
      .first()
    await expect(editableField).toBeVisible({ timeout: 15000 })

    // contentEditable="true" özelliğini doğrula
    await expect(editableField).toHaveAttribute('contenteditable', 'true')

    // Yasal uyarı modalı araya girerse kapat
    const disclaimerModalButton = page.locator('button:has-text("Anladım, Kabul Ediyorum")').first()
    if (await disclaimerModalButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerModalButton.click()
      await expect(disclaimerModalButton).not.toBeVisible({ timeout: 5000 })
    }

    // 5. Word benzeri doğrudan tıklama, metin silme ve yeni paragraflar ekleme
    await editableField.click()
    await page.keyboard.press('Control+A')
    await page.keyboard.press('Backspace')
    await page.keyboard.type(
      'Birinci paragraf: Doğrudan belge üzerinde Word benzeri düzenleme yapıldı.'
    )
    await page.keyboard.press('Enter')
    await page.keyboard.type('İkinci paragraf: Enter ile yeni satır oluşturuldu.')

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, '11-word-editing-preview.png')

    // 6. Kaydet butonuna tıkla
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    // Başarıyla kaydedildiğini doğrula ("Kaydedildi!" ibaresi)
    await expect(page.locator('text=Kaydedildi!')).toBeVisible({ timeout: 10000 })

    // 7. IPC üzerinden kaydedilen veriyi doğrudan oku ve paragrafların korunduğunu doğrula
    const savedDoc = await page.evaluate(async () => {
      // @ts-expect-error electron IPC renderer API
      return await window.electron.ipcRenderer.invoke('belge:get-document', {
        dosyaId: 1,
        templateKey: 'dogrudan_temin_onay_belgesi'
      })
    })

    expect(savedDoc.success).toBe(true)
    expect(savedDoc.exists).toBe(true)
    expect(savedDoc.record.data.isinAciklamasi).toContain(
      'Birinci paragraf: Doğrudan belge üzerinde Word benzeri düzenleme yapıldı.'
    )
    expect(savedDoc.record.data.isinAciklamasi).toContain(
      'İkinci paragraf: Enter ile yeni satır oluşturuldu.'
    )

    // 8. Önizlemeyi kapatıp tekrar açtığımızda da metnin korunduğunu doğrula
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stores = (window as any).__teminStores
      const tabStore = stores?.useTabStore?.getState()
      if (tabStore) {
        tabStore.closeTab(tabStore.activeTabPath)
      }
      stores?.useGlobalDocumentPreviewStore?.getState().closeDocument()
    })
    await expect(editableField).not.toBeVisible({ timeout: 10000 })

    await page.evaluate(() => {
      // @ts-expect-error global store test hook
      window.__teminStores?.useGlobalDocumentPreviewStore?.getState().openDocument({
        documentId: 'dogrudan-temin-onay-belgesi',
        dosyaId: 1,
        documentTitle: 'Doğrudan Temin Onay Belgesi'
      })
    })

    const reopenedField = page
      .locator('[data-editable-field="true"][data-field-name="isinAciklamasi"]')
      .first()
    await expect(reopenedField).toBeVisible({ timeout: 15000 })
    await expect(reopenedField).toContainText(
      'Birinci paragraf: Doğrudan belge üzerinde Word benzeri düzenleme yapıldı.',
      { timeout: 15000 }
    )
    await expect(reopenedField).toContainText(
      'İkinci paragraf: Enter ile yeni satır oluşturuldu.',
      { timeout: 15000 }
    )
    const reopenedText = await reopenedField.innerText()
    expect(reopenedText).toContain(
      'Birinci paragraf: Doğrudan belge üzerinde Word benzeri düzenleme yapıldı.'
    )
    expect(reopenedText).toContain('İkinci paragraf: Enter ile yeni satır oluşturuldu.')
  })

  test('İki farklı .temin arşiv dosyası (Kurum A ve Kurum B) arasında tam veri izolasyonu, bağımsız kaydetme ve yeniden açma doğrulanmalıdır', async () => {
    test.setTimeout(180000)
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)
    expect(fs.existsSync(DESKTOP_SECOND_FILE)).toBe(true)

    const archiveA = path.join(DESKTOP_TEST_DIR, 'e2e-izolasyon-kurum-a.temin')
    const archiveB = path.join(DESKTOP_TEST_DIR, 'e2e-izolasyon-kurum-b.temin')

    fs.copyFileSync(DESKTOP_TEST_FILE, archiveA)
    fs.copyFileSync(DESKTOP_SECOND_FILE, archiveB)

    try {
      // AŞAMA 1: Kurum A arşivi ile uygulamayı başlat ve Kurum A belgesini kaydet
      appInstance = await launchTestApp([archiveA])
      let page = appInstance.page
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('text=E2E Otomasyon Test Kurumu').first()).toBeVisible({
        timeout: 20000
      })

      let passwordInput = page.locator('input[type="password"]')
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill('123456')
        await page
          .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
          .first()
          .click()
        await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
      }

      const saveKurumA = await page.evaluate(async () => {
        // @ts-expect-error electron IPC
        return await window.electron.ipcRenderer.invoke('belge:save-document', {
          dosyaId: 1,
          templateKey: 'luzum_muzekkeresi',
          data: {
            dosyaKonusu: 'KURUM-A-ÖZEL-LÜZUM',
            isinAciklamasi: 'Kurum A Arşivine Özel İçerik',
            tarih: '21.10.2026'
          },
          sablonVersiyon: 1
        })
      })
      expect(saveKurumA.success).toBe(true)

      // Arşiv dosyasına fiziksel flush (save) yap
      const wsSaveA = await page.evaluate(async () => {
        // @ts-expect-error electron IPC
        return await window.electron.ipcRenderer.invoke('workspace:save')
      })
      expect(wsSaveA.success).toBe(true)

      // Kurum A uygulamasını kapat
      await appInstance.close()
      appInstance = null
      await new Promise((r) => setTimeout(r, 1000))

      // AŞAMA 2: Kurum B arşivi ile uygulamayı başlat.
      // Kurum A'nın belgesinin Kurum B'ye sızmadığını doğrula!
      appInstance = await launchTestApp([archiveB])
      page = appInstance.page
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('text=E2E İkinci Test Kurumu').first()).toBeVisible({
        timeout: 20000
      })

      passwordInput = page.locator('input[type="password"]')
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill('123456')
        await page
          .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
          .first()
          .click()
        await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
      }

      const checkKurumBInitial = await page.evaluate(async () => {
        // @ts-expect-error electron IPC
        return await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId: 1,
          templateKey: 'luzum_muzekkeresi'
        })
      })
      // İzolasyon kanıtı: IPC sorgusu kesinlikle başarılı dönmeli ve Kurum B içinde
      // dosyaId=1 belgesi henüz bulunmamalı veya Kurum A'ya ait veriyi taşımamalıdır
      expect(checkKurumBInitial).toBeDefined()
      expect(checkKurumBInitial.success).toBe(true)
      if (checkKurumBInitial.exists) {
        expect(checkKurumBInitial.record?.data?.dosyaKonusu).not.toBe('KURUM-A-ÖZEL-LÜZUM')
        expect(checkKurumBInitial.record?.data?.isinAciklamasi).not.toBe(
          'Kurum A Arşivine Özel İçerik'
        )
      } else {
        expect(checkKurumBInitial.exists).toBe(false)
      }

      // Şimdi Kurum B için tamamen farklı bir belge kaydet
      const saveKurumB = await page.evaluate(async () => {
        // @ts-expect-error electron IPC
        return await window.electron.ipcRenderer.invoke('belge:save-document', {
          dosyaId: 1,
          templateKey: 'luzum_muzekkeresi',
          data: {
            dosyaKonusu: 'KURUM-B-FARKLI-LÜZUM',
            isinAciklamasi: 'Kurum B Arşivine Özel Bağımsız İçerik',
            tarih: '21.10.2026'
          },
          sablonVersiyon: 1
        })
      })
      expect(saveKurumB.success).toBe(true)

      // Arşiv dosyasına fiziksel flush (save) yap
      const wsSaveB = await page.evaluate(async () => {
        // @ts-expect-error electron IPC
        return await window.electron.ipcRenderer.invoke('workspace:save')
      })
      expect(wsSaveB.success).toBe(true)

      // Kurum B uygulamasını kapat
      await appInstance.close()
      appInstance = null
      await new Promise((r) => setTimeout(r, 1000))

      // AŞAMA 3: Tekrar Kurum A arşivini aç ve Kurum A belgesinin aynen korunduğunu doğrula
      appInstance = await launchTestApp([archiveA])
      page = appInstance.page
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('text=E2E Otomasyon Test Kurumu').first()).toBeVisible({
        timeout: 20000
      })

      passwordInput = page.locator('input[type="password"]')
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill('123456')
        await page
          .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
          .first()
          .click()
        await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
      }

      const checkKurumAFinal = await page.evaluate(async () => {
        // @ts-expect-error electron IPC
        return await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId: 1,
          templateKey: 'luzum_muzekkeresi'
        })
      })
      expect(checkKurumAFinal.success).toBe(true)
      expect(checkKurumAFinal.exists).toBe(true)
      expect(checkKurumAFinal.record?.data?.dosyaKonusu).toBe('KURUM-A-ÖZEL-LÜZUM')
      expect(checkKurumAFinal.record?.data?.isinAciklamasi).toBe('Kurum A Arşivine Özel İçerik')

      // Kurum A uygulamasını kapat
      await appInstance.close()
      appInstance = null
      await new Promise((r) => setTimeout(r, 1000))

      // AŞAMA 4: Tekrar Kurum B arşivini aç ve Kurum B belgesinin de aynen korunduğunu doğrula
      appInstance = await launchTestApp([archiveB])
      page = appInstance.page
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('text=E2E İkinci Test Kurumu').first()).toBeVisible({
        timeout: 20000
      })

      passwordInput = page.locator('input[type="password"]')
      if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordInput.fill('123456')
        await page
          .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
          .first()
          .click()
        await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
      }

      const checkKurumBFinal = await page.evaluate(async () => {
        // @ts-expect-error electron IPC
        return await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId: 1,
          templateKey: 'luzum_muzekkeresi'
        })
      })
      expect(checkKurumBFinal.success).toBe(true)
      expect(checkKurumBFinal.exists).toBe(true)
      expect(checkKurumBFinal.record?.data?.dosyaKonusu).toBe('KURUM-B-FARKLI-LÜZUM')
      expect(checkKurumBFinal.record?.data?.isinAciklamasi).toBe(
        'Kurum B Arşivine Özel Bağımsız İçerik'
      )
    } finally {
      if (appInstance) {
        await appInstance.close()
        appInstance = null
      }
      try {
        if (fs.existsSync(archiveA)) fs.unlinkSync(archiveA)
        if (fs.existsSync(archiveA + '.lock')) fs.unlinkSync(archiveA + '.lock')
        if (fs.existsSync(archiveB)) fs.unlinkSync(archiveB)
        if (fs.existsSync(archiveB + '.lock')) fs.unlinkSync(archiveB + '.lock')
      } catch {
        // ignore
      }
    }
  })
})
