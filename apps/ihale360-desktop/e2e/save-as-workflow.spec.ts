import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import {
  launchTestApp,
  takeE2EScreenshot,
  DESKTOP_TEST_FILE,
  DESKTOP_TEST_DIR,
  TestAppInstance
} from './helpers/electronHelper'

test.describe('E2E: Farklı Kaydet (Save As) ve Yeniden Açma Akışı Testi', () => {
  let appInstance: TestAppInstance | null = null
  const saveAsTarget = path.join(DESKTOP_TEST_DIR, 'e2e-farkli-kayit-test.temin')

  test.afterEach(async () => {
    if (appInstance) {
      await appInstance.close()
      appInstance = null
    }
    // Test dosyasını ve kilitlerini temizle
    try {
      if (fs.existsSync(saveAsTarget)) {
        fs.unlinkSync(saveAsTarget)
      }
      if (fs.existsSync(saveAsTarget + '.lock')) {
        fs.unlinkSync(saveAsTarget + '.lock')
      }
    } catch {
      /* ignore */
    }
  })

  test('Farklı Kaydet işlemi yeni dosyayı oluşturmalı, uygulama kapatıldıktan sonra yeni dosya açılabilmelidir', async () => {
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)

    // 1. Orijinal test dosyası ile uygulamayı başlat
    appInstance = await launchTestApp([DESKTOP_TEST_FILE])
    const { page, electronApp } = appInstance

    await page.waitForLoadState('domcontentloaded')
    const institutionLocator = page.locator('text=E2E Otomasyon Test Kurumu').first()
    await expect(institutionLocator).toBeVisible({ timeout: 20000 })

    // Kilit ekranı varsa geç
    const passwordInput = page.locator('input[type="password"]')
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('123456')
      const loginButton = page
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
      await loginButton.click()
      await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
    }

    await takeE2EScreenshot(page, '06-before-save-as.png')

    // 2. Renderer üzerinden IPC workspace:save-as çağrısı gerçekleştir
    const saveAsResult = await page.evaluate(async (targetPath) => {
      // @ts-expect-error electron IPC renderer API
      return await window.electron.ipcRenderer.invoke('workspace:save-as', targetPath)
    }, saveAsTarget)

    expect(saveAsResult).toBeDefined()
    expect(saveAsResult.success).toBe(true)
    expect(saveAsResult.newFilePath).toBe(path.resolve(saveAsTarget))

    // 3. Dosyanın fiziksel olarak oluştuğunu ve bütünlüğünü doğrula
    expect(fs.existsSync(saveAsTarget)).toBe(true)
    expect(fs.statSync(saveAsTarget).size).toBeGreaterThan(0)

    const zip = new AdmZip(saveAsTarget)
    const entries = zip.getEntries()
    expect(entries.some((e) => e.entryName === 'meta.json')).toBe(true)
    expect(entries.some((e) => e.entryName.endsWith('.sqlite'))).toBe(true)

    await takeE2EScreenshot(page, '07-after-save-as.png')

    // 4. Uygulamayı tamamen kapat
    await appInstance.close()
    appInstance = null

    // Kilit dosyasının temizlendiğini doğrula
    expect(fs.existsSync(saveAsTarget + '.lock')).toBe(false)

    // 5. Yeni kaydedilen .temin dosyası ile uygulamayı baştan başlat (kapatıp yeniden açma döngüsü)
    appInstance = await launchTestApp([saveAsTarget])
    const newPage = appInstance.page

    await newPage.waitForLoadState('domcontentloaded')
    const newInstitution = newPage.locator('text=E2E Otomasyon Test Kurumu').first()
    await expect(newInstitution).toBeVisible({ timeout: 20000 })

    await takeE2EScreenshot(newPage, '08-reopened-saved-file.png')
  })
})
