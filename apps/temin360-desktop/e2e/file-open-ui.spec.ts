import { test, expect } from '@playwright/test'
import fs from 'fs'
import {
  launchTestApp,
  mockOpenFileDialog,
  takeE2EScreenshot,
  DESKTOP_TEST_FILE,
  TestAppInstance
} from './helpers/electronHelper'

test.describe('E2E: Kullanıcı Arayüzü Üzerinden Gerçek Dosya Açma ve Etkileşim Testi', () => {
  let appInstance: TestAppInstance

  test.beforeAll(async () => {
    // Masaüstündeki test dosyasının var olduğunu doğrula
    expect(fs.existsSync(DESKTOP_TEST_FILE)).toBe(true)
    appInstance = await launchTestApp()
  })

  test.afterAll(async () => {
    if (appInstance) {
      await appInstance.close()
    }
  })

  test('1. Gerçek Electron penceresi açılmalı, arayüz doğrulanmalı ve ekran görüntüsü alınmalı', async () => {
    const { page } = appInstance

    // 1. & 2. Pencerenin ve DOM'un yüklenmesini bekle
    await page.waitForLoadState('domcontentloaded')

    // 3. Başlık ve temel arayüz elemanlarını doğrula
    const title = await page.title()
    expect(title).toContain('TEMİN 360')

    const welcomeHeading = page.locator("text=TEMİN 360'a Hoş Geldiniz")
    await expect(welcomeHeading).toBeVisible({ timeout: 15000 })

    const openFileButton = page.locator('button:has-text("Mevcut Kurumu Aç")')
    await expect(openFileButton).toBeVisible()

    const createNewButton = page.locator('button:has-text("Yeni Kurum Oluştur")')
    await expect(createNewButton).toBeVisible()

    // 4. Ekran görüntüsü al
    await takeE2EScreenshot(page, '01-launcher-screen.png')
  })

  test('2. Arayüzden "Mevcut Kurumu Aç" akışı başlatılmalı ve masaüstü test dosyası yüklenmeli', async () => {
    const { page, electronApp } = appInstance

    // 5. Electron diyalogunu masaüstündeki test dosyasını seçecek şekilde ayarla
    await mockOpenFileDialog(electronApp, DESKTOP_TEST_FILE)

    // 6. Gerçek kullanıcı gibi "Mevcut Kurumu Aç" butonuna tıkla
    const openFileButton = page.locator('button:has-text("Mevcut Kurumu Aç")')
    await openFileButton.click()

    // 7. Dosyanın başarıyla yüklenmesini ve Başlatıcı ekranının kaybolmasını bekle
    await expect(page.locator("text=TEMİN 360'a Hoş Geldiniz")).not.toBeVisible({
      timeout: 20000
    })

    // Dosya ilk açıldığında Kurum adı kilit ekranında veya başlıkta görünür
    const institutionLocator = page.locator('text=E2E Otomasyon Test Kurumu').first()
    await expect(institutionLocator).toBeVisible({ timeout: 15000 })

    // Kilit ekranı şifre girişi (tanımlanan şifre: 123456)
    const passwordInput = page.locator('input[type="password"]')
    if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passwordInput.fill('123456')
      const loginButton = page
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
      await loginButton.click()
      // Kilit ekranının kapandığını doğrula
      await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
    }

    // 8. Gösterge panelinde kurum verisinin yüklendiğini kontrol et
    await expect(institutionLocator).toBeVisible({ timeout: 15000 })

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, '02-workspace-opened.png')
  })

  test('3. Dosya açıldıktan sonra gerçek arayüz etkileşimi test edilmeli', async () => {
    const { page } = appInstance

    // Gerçek arayüz etkileşimi 1: Süreç Modu Değiştirme Butonuna tıklama (DT -> 4734 İhale)
    const modeBadge = page.locator('button[title*="Süreç rejimini değiştirmek için"]')
    await expect(modeBadge).toBeVisible({ timeout: 10000 })

    const initialText = await modeBadge.innerText()
    console.log('Başlangıç modu:', initialText)

    // Tıklayarak modu değiştir
    await modeBadge.click()

    // Mod rozetinin güncellendiğini doğrula
    await expect(modeBadge).not.toHaveText(initialText, { timeout: 5000 })
    const updatedText = await modeBadge.innerText()
    console.log('Tıklama sonrası güncellenen mod:', updatedText)

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, '03-mode-switched-interaction.png')

    // Gerçek arayüz etkileşimi 2: Üst Menü Etkileşimi (Native Menu Bar)
    const dosyaMenu = page.locator('#native-menu-bar button:has-text("Dosya")')
    if (await dosyaMenu.isVisible()) {
      await dosyaMenu.click()
      const gostergePaneliItem = page.locator('#native-menu-bar button:has-text("Gösterge Paneli")')
      await expect(gostergePaneliItem).toBeVisible({ timeout: 5000 })
      // Menüyü kapatmak için Escape tuşuna bas
      await page.keyboard.press('Escape')
    }
  })

  test('4. Sayfa hataları ve kritik konsol hataları kontrol edilmeli', async () => {
    const { pageErrors, consoleLogs } = appInstance

    // Sayfa bazlı yakalanmamış fatal crash veya unhandled rejection olmamalı
    expect(pageErrors.length).toBe(0)

    const criticalErrors = consoleLogs.filter(
      (log) =>
        log.type === 'error' &&
        !log.text.includes('Failed to load resource: net::ERR_FILE_NOT_FOUND') &&
        !log.text.includes('Failed to load resource: net::ERR_INVALID_URL') &&
        !log.text.includes('favicon.ico') &&
        !log.text.includes('Electron Security Warning')
    )

    console.log(`Toplam konsol log sayısı: ${consoleLogs.length}`)
    console.log(`Kritik renderer hatası sayısı: ${criticalErrors.length}`)
    if (criticalErrors.length > 0) {
      console.warn('Tespit edilen log hataları:', criticalErrors)
    }

    expect(criticalErrors.length).toBe(0)
  })
})
