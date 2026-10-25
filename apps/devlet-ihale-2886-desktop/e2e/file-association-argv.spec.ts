import { test, expect } from '@playwright/test'
import fs from 'fs'
import {
  launchTestApp,
  takeE2EScreenshot,
  DESKTOP_TEST_FILE,
  DESKTOP_SECOND_FILE,
  TestAppInstance
} from './helpers/electronHelper'

test.describe('E2E: Dosyaya Çift Tıklama (CLI Argv) ve İkinci Örnek (Second-Instance) Testi', () => {
  let appInstance: TestAppInstance | null = null

  test.afterEach(async () => {
    if (appInstance) {
      await appInstance.close()
      appInstance = null
    }
  })

  test('1. Uygulama kapalıyken dosyayla doğrudan başlatılmalı (Windows çift tıklama simülasyonu)', async () => {
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)

    // Electron doğrudan masaüstü dosya yolu argümanı ile başlatılır:
    // Windows Explorer'da .temin dosyasına çift tıklandığında gerçekleşen çalışma modeli
    appInstance = await launchTestApp([DESKTOP_TEST_FILE])
    const { page } = appInstance

    await page.waitForLoadState('domcontentloaded')

    // Başlatıcı ekranının hiç gösterilmediğini veya hemen kapandığını doğrula
    await expect(page.locator("text=TEMİN 360'a Hoş Geldiniz")).not.toBeVisible({
      timeout: 20000
    })

    // Dosyanın doğrudan yüklendiğini ve Kurum adının arayüzde göründüğünü doğrula
    const institutionLocator = page.locator('text=E2E Otomasyon Test Kurumu').first()
    await expect(institutionLocator).toBeVisible({ timeout: 15000 })

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, '04-direct-file-launch-argv.png')
  })

  test('2. Uygulama açıkken ikinci dosya açıldığında second-instance mekanizması çalışmalı', async () => {
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)
    expect(fs.existsSync(DESKTOP_SECOND_FILE)).toBe(true)

    // Uygulamayı birinci dosya ile aç
    appInstance = await launchTestApp([DESKTOP_TEST_FILE])
    const { page, electronApp } = appInstance

    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('text=E2E Otomasyon Test Kurumu').first()).toBeVisible({
      timeout: 15000
    })

    // Senaryo 2A: Aynı dosya için second-instance gelirse (pencereye odaklanma)
    await electronApp.evaluate(({ app }, filePath) => {
      app.emit('second-instance', {}, [process.execPath, filePath])
    }, DESKTOP_TEST_FILE)

    // Hala ilk kurum açık olmalı
    await expect(page.locator('text=E2E Otomasyon Test Kurumu').first()).toBeVisible()

    // Senaryo 2B: Farklı bir dosya için second-instance gelirse (ikinci dosyanın açılması)
    await electronApp.evaluate(({ app }, filePath) => {
      app.emit('second-instance', {}, [process.execPath, filePath])
    }, DESKTOP_SECOND_FILE)

    // Renderer'ın open-external-file olayını alarak ikinci kurumu ("E2E İkinci Test Kurumu") yüklemesini bekle
    const secondInstitution = page.locator('text=E2E İkinci Test Kurumu').first()
    await expect(secondInstitution).toBeVisible({ timeout: 20000 })

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, '05-second-instance-file-switch.png')
  })
})
