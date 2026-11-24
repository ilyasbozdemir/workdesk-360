import { test, expect } from '@playwright/test'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { execFileSync } from 'child_process'
import {
  launchTestApp,
  takeE2EScreenshot,
  TestAppInstance
} from './helpers/electronHelper'

/**
 * AŞAMA 4: İstekli Firmalar, Teklifler ve Piyasa Fiyat Araştırması E2E Doğrulama Testi.
 *
 * Amaç ve Kabul Kriterleri:
 * 1. İzole .temin test paketi oluşturulur (üretim verisine dokunulmaz).
 * 2. Gerçek Electron arayüzünden Piyasa Fiyat Araştırması ekranına (/dosya/piyasa-fiyat-arastirmasi) geçilir.
 * 3. Gerçek arayüz (UI) üzerinden yeni istekli firmalar eklenir (Firma A ve Firma B).
 * 4. 2. Adıma (Fiyatlar & Kazanan Tespiti) geçilip teklif matrisi açılır.
 * 5. Her iki firmaya kalem bazında birim fiyat teklifleri girilir.
 * 6. Teklif matrisi, kalem bazında teklif tutarları ve firma toplamları SQLite üzerinden doğrulanır.
 * 7. Yaklaşık maliyet hesaplama yöntemleri (Ortalama Fiyat Esası vs En Düşük Fiyat Esası) test edilir ve doğrulanır.
 * 8. En avantajlı teklif sahibi (Firma B) kazanan olarak belirlenir ve SQLite'ta kazandi_mi / firma_id tutarlılığı kontrol edilir.
 * 9. Çalışma alanı kaydedilip uygulama kapatılır ve aynı .temin dosyası tekrar açılır (Kalıcılık Doğrulaması).
 * 10. Firma, teklif, kalem ilişkileri ve hesaplamaların kalıcılığı hem UI hem SQLite üzerinden doğrulanır.
 */

test.describe('Aşama 4: İstekli Firmalar, Teklifler ve Piyasa Fiyat Araştırması', () => {
  let appInstance: TestAppInstance | null = null
  let tempTestDir: string = ''
  let isolatedTeminPath: string = ''
  let expectedDosyaId: number = 0
  let expectedTeminNo: string = ''
  let expectedKonu: string = ''
  let expectedKurum: string = ''

  test.beforeAll(() => {
    // 1. İzole geçici dizin belirle
    tempTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-stage4-test-'))

    // 2. Electron binary ve generator script ile izole .temin paketi oluştur
    const electronBinary = require('electron') as unknown as string
    const scriptPath = path.resolve(__dirname, '../scripts/generate-stage4-test-file.js')

    console.log(`[Stage 4 Setup] İzole test paketi Electron Node çalışma zamanında oluşturuluyor...`)
    execFileSync(electronBinary, [scriptPath, tempTestDir], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit'
    })

    // 3. Üretilen test bilgilerini oku
    const infoPath = path.join(tempTestDir, 'stage4-info.json')
    expect(fs.existsSync(infoPath)).toBe(true)

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
    isolatedTeminPath = info.isolatedTeminPath
    expectedDosyaId = info.expectedDosyaId
    expectedTeminNo = info.expectedTeminNo
    expectedKonu = info.expectedKonu
    expectedKurum = info.expectedKurum

    expect(fs.existsSync(isolatedTeminPath)).toBe(true)
    expect(expectedDosyaId).toBeGreaterThan(0)
    console.log(`[Stage 4 Setup] Dosya hazır: ${isolatedTeminPath}, ID: ${expectedDosyaId}`)
  })

  test.afterAll(async () => {
    if (appInstance) {
      await appInstance.close()
      appInstance = null
    }
    // Geçici test dizinini temizle (üretim dosyalarına ASLA dokunulmaz)
    if (tempTestDir && fs.existsSync(tempTestDir)) {
      try {
        fs.rmSync(tempTestDir, { recursive: true, force: true })
        console.log(`[Stage 4 Cleanup] Geçici test dizini temizlendi: ${tempTestDir}`)
      } catch (err: any) {
        console.warn(`[Stage 4 Cleanup] Temizlik uyarısı:`, err.message)
      }
    }
  })

  test('UI üzerinden firma ekleme, teklif girme, yaklaşık maliyet hesaplaması ve kalıcılık doğrulanmalıdır', async () => {
    test.setTimeout(240000)

    // -------------------------------------------------------------
    // ADIM 1: Uygulamayı Başlat ve Piyasa Fiyat Araştırması Ekranına Git
    // -------------------------------------------------------------
    console.log('[Stage 4 Test] Electron uygulaması izole test dosyası ile başlatılıyor...')
    appInstance = await launchTestApp([isolatedTeminPath])
    let { page } = appInstance

    // Dialog (confirm/alert) otomatik kabulü ve Native showMessageBoxSync mock'u
    await appInstance.electronApp.evaluate(({ dialog }) => {
      dialog.showMessageBoxSync = () => 0 // 'Evet' veya 'Tamam'
    })
    await page.evaluate(() => {
      window.confirm = () => true
      window.alert = () => {}
    })
    page.on('dialog', async (dialog) => {
      console.log(`[Dialog Alert/Confirm] ${dialog.type()}: ${dialog.message()}`)
      await dialog.accept()
    })

    await page.waitForLoadState('domcontentloaded')

    // Kurum adı doğrulaması
    const institutionLocator = page.locator(`text=${expectedKurum}`).first()
    await expect(institutionLocator).toBeVisible({ timeout: 30000 })

    // Kilit ekranı şifre girişi (varsa)
    const passwordInput = page.locator('input[type="password"]')
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill('123456')
      const loginButton = page
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
      await loginButton.click()
      await expect(passwordInput).not.toBeVisible({ timeout: 15000 })
    }

    // Yasal sorumluluk reddi (varsa)
    const disclaimerButton = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await disclaimerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerButton.click()
      await expect(disclaimerButton).not.toBeVisible({ timeout: 5000 })
    }

    // Aktif dosya oturumunu ayarla (Zustand Store + Session) ve Piyasa Fiyat Araştırması rotasına git
    await page.evaluate(async (targetId) => {
      localStorage.setItem('active_dosya_id', targetId.toString())
      sessionStorage.setItem('workspace_dosya_id', targetId.toString())

      const stores = (window as any).__teminStores
      if (stores?.useWorkspaceStore) {
        stores.useWorkspaceStore.getState().setActiveDosyaId(targetId)
      }

      window.location.hash = '#/dosya/piyasa-fiyat-arastirmasi'
    }, expectedDosyaId)

    // Sayfa geçişinde beliren overlay/disclaimer modalını kapat
    const disclaimerButtonAfter = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await disclaimerButtonAfter.isVisible({ timeout: 4000 }).catch(() => false)) {
      await disclaimerButtonAfter.click()
      await expect(disclaimerButtonAfter).not.toBeVisible({ timeout: 5000 }).catch(() => {})
    }

    // Ekranın yüklendiğini doğrula: SubScreen başlığı
    const screenHeader = page.locator('text=Teklifler & Piyasa Fiyat Araştırması').first()
    await expect(screenHeader).toBeVisible({ timeout: 25000 })
    console.log('[Stage 4 Test] Piyasa Fiyat Araştırması ekranı başarıyla açıldı.')

    // Tekrar overlay kontrolü
    if (await disclaimerButtonAfter.isVisible({ timeout: 1000 }).catch(() => false)) {
      await disclaimerButtonAfter.click()
      await expect(disclaimerButtonAfter).not.toBeVisible({ timeout: 3000 }).catch(() => {})
    }

    // -------------------------------------------------------------
    // ADIM 2: UI Üzerinden İstekli Firmaları Ekle (+ Yeni Firma Modalı)
    // -------------------------------------------------------------
    const firma1Unvan = 'Aşama 4 Firma A - Teknoloji A.Ş.'
    const firma1Vkn = '1234567890'
    const firma2Unvan = 'Aşama 4 Firma B - Ofis Market Ltd.'
    const firma2Vkn = '9876543210'

    // Firma 1 Ekle
    const newFirmButton = page.locator('button:has-text("+ Yeni Firma")').first()
    await expect(newFirmButton).toBeVisible({ timeout: 10000 })
    await newFirmButton.click({ force: true })

    // Modal açıldı
    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).toBeVisible({ timeout: 10000 })
    await page.locator('input[placeholder*="ABC Medikal"], input[placeholder*="Örn:"]').first().fill(firma1Unvan)
    await page.locator('input[placeholder*="VKN"]').first().fill(firma1Vkn)
    await page.locator('input[placeholder*="0312"]').first().fill('03121112233')
    await page.locator('input[placeholder*="info@firma.com"]').first().fill('firmaA@test.com')
    await page.locator('input[placeholder*="Çankaya"]').first().fill('Ankara')

    // Kaydet ve Dosyaya Ekle
    await page.locator('button:has-text("Kaydet ve Dosyaya Ekle")').first().click()
    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator(`text=${firma1Unvan}`).first()).toBeVisible({ timeout: 10000 })
    console.log('[Stage 4 Test] Firma 1 arayüz üzerinden eklendi ve listede görüntülendi.')

    // Firma 2 Ekle
    await newFirmButton.click({ force: true })
    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).toBeVisible({ timeout: 10000 })
    await page.locator('input[placeholder*="ABC Medikal"], input[placeholder*="Örn:"]').first().fill(firma2Unvan)
    await page.locator('input[placeholder*="VKN"]').first().fill(firma2Vkn)
    await page.locator('input[placeholder*="0312"]').first().fill('03124445566')
    await page.locator('input[placeholder*="info@firma.com"]').first().fill('firmaB@test.com')
    await page.locator('input[placeholder*="Çankaya"]').first().fill('İstanbul')

    await page.locator('button:has-text("Kaydet ve Dosyaya Ekle")').first().click()
    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator(`text=${firma2Unvan}`).first()).toBeVisible({ timeout: 10000 })
    console.log('[Stage 4 Test] Firma 2 arayüz üzerinden eklendi ve listede görüntülendi.')

    // SQLite Veritabanı Kontrolü (Firmalar)
    const dbFirms = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, firma_id, unvan, vergi_no, teklif_durumu FROM DATA_TeminFirma WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )
    }, expectedDosyaId)

    expect(dbFirms.success).toBe(true)
    expect(dbFirms.data.length).toBe(2)
    const firmaA = dbFirms.data.find((f: any) => f.unvan.includes('Firma A'))
    const firmaB = dbFirms.data.find((f: any) => f.unvan.includes('Firma B'))
    expect(firmaA).toBeDefined()
    expect(firmaB).toBeDefined()
    console.log(`[Stage 4 Test] SQLite DATA_TeminFirma kayıtları doğrulandı: Firma A ID=${firmaA.id}, Firma B ID=${firmaB.id}`)

    // -------------------------------------------------------------
    // ADIM 3: 2. Adıma (Fiyatlar & Kazanan Tespiti) Geç
    // -------------------------------------------------------------
    const step2Btn = page.locator('button:has-text("2. Adım: Fiyatları Girmeye Geç")').first()
    await expect(step2Btn).toBeVisible()
    await step2Btn.click({ force: true })

    // Step 2 panelinin geldiğini doğrula
    await expect(page.locator('text=Seçilen / En Uygun Teklif Sahibi').first()).toBeVisible({ timeout: 15000 })
    console.log('[Stage 4 Test] 2. Adım (Fiyatlar & Kazanan Tespiti) ekranına başarıyla geçildi.')

    // -------------------------------------------------------------
    // ADIM 4: Teklif Fiyatlarını Gir / Düzenle (Teklif Matrisi)
    // -------------------------------------------------------------
    const openMatrixBtn = page.locator('button:has-text("Teklif Fiyatlarını Gir / Düzenle")').first()
    await expect(openMatrixBtn).toBeVisible()
    await openMatrixBtn.click({ force: true })

    // Form açıldı
    await expect(page.locator('text=Tüm Teklifler (Tablo)').first()).toBeVisible({ timeout: 10000 })

    // Tablo görünümüne geç
    await page.locator('button:has-text("Tüm Teklifler (Tablo)")').first().click()
    await page.waitForTimeout(500)

    // Tablo satırlarını tespit et
    // 1. Kalem: A4 Fotokopi Kağıdı (50 Kutu) -> Firma A: 120 TL, Firma B: 100 TL
    // 2. Kalem: Masaüstü Zımba (10 Adet)     -> Firma A: 150 TL, Firma B: 200 TL
    const kalem1Row = page.locator('tr:has-text("A4 Fotokopi Kağıdı")').first()
    await expect(kalem1Row).toBeVisible({ timeout: 10000 })
    const kalem1Inputs = kalem1Row.locator('input[title="Fiyat Gir"]')
    await expect(kalem1Inputs).toHaveCount(2)

    // Firma A: 120 TL
    await kalem1Inputs.nth(0).click()
    await kalem1Inputs.nth(0).fill('120')
    await kalem1Inputs.nth(0).blur()
    await page.waitForTimeout(300)

    // Firma B: 100 TL
    await kalem1Inputs.nth(1).click()
    await kalem1Inputs.nth(1).fill('100')
    await kalem1Inputs.nth(1).blur()
    await page.waitForTimeout(300)

    const kalem2Row = page.locator('tr:has-text("Masaüstü Zımba")').first()
    await expect(kalem2Row).toBeVisible({ timeout: 10000 })
    const kalem2Inputs = kalem2Row.locator('input[title="Fiyat Gir"]')
    await expect(kalem2Inputs).toHaveCount(2)

    // Firma A: 150 TL
    await kalem2Inputs.nth(0).click()
    await kalem2Inputs.nth(0).fill('150')
    await kalem2Inputs.nth(0).blur()
    await page.waitForTimeout(300)

    // Firma B: 200 TL
    await kalem2Inputs.nth(1).click()
    await kalem2Inputs.nth(1).fill('200')
    await kalem2Inputs.nth(1).blur()
    await page.waitForTimeout(500)

    console.log('[Stage 4 Test] Teklif matrisine 4 adet birim fiyat başarıyla girildi.')

    // SQLite Veritabanı Kontrolü (Kalem Teklifleri ve Firma Toplamları)
    const dbBids = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, temin_kalem_id, temin_firma_id, birim_fiyat FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )
    }, expectedDosyaId)

    expect(dbBids.success).toBe(true)
    expect(dbBids.data.length).toBe(4)

    // Firma A toplamı: 50 * 120 + 10 * 150 = 6000 + 1500 = 7500 TL
    // Firma B toplamı: 50 * 100 + 10 * 200 = 5000 + 2000 = 7000 TL
    const dbFirmaTotals = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, unvan, teklif_toplami, teklif_durumu, teklif_verdi_mi FROM DATA_TeminFirma WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )
    }, expectedDosyaId)

    const updatedFirmaA = dbFirmaTotals.data.find((f: any) => f.unvan.includes('Firma A'))
    const updatedFirmaB = dbFirmaTotals.data.find((f: any) => f.unvan.includes('Firma B'))
    expect(Number(updatedFirmaA.teklif_toplami)).toBe(7500)
    expect(Number(updatedFirmaB.teklif_toplami)).toBe(7000)
    expect(updatedFirmaA.teklif_verdi_mi).toBe(1)
    expect(updatedFirmaB.teklif_verdi_mi).toBe(1)
    console.log('[Stage 4 Test] SQLite DATA_TeminKalemTeklif ve firma teklif toplamları (7500 TL vs 7000 TL) doğrulandı.')

    // Formu kapatıp Step 2 özetine dön
    const backBtn = page.locator('button[title="Geri Dön / Kapat"]').first()
    if (await backBtn.isVisible()) {
      await backBtn.click()
    }
    await page.waitForTimeout(500)

    // -------------------------------------------------------------
    // ADIM 5: Hesaplama Esasları ve Yaklaşık Maliyet Kontrolü
    // -------------------------------------------------------------
    // Ortalama Fiyat Esası Hesaplaması:
    // Kalem 1 ortalama: (120 + 100) / 2 = 110 TL -> 50 * 110 = 5500 TL
    // Kalem 2 ortalama: (150 + 200) / 2 = 175 TL -> 10 * 175 = 1750 TL
    // Toplam Yaklaşık Maliyet = 5500 + 1750 = 7250 TL
    const esasSelect = page.locator('select[title="Dosya Hesaplama Esasını Değiştir"]').first()
    await expect(esasSelect).toBeVisible({ timeout: 10000 })

    // 1. Ortalama Fiyat Esasını Seç ve Doğrula
    await esasSelect.selectOption('Ortalama fiyat esasına göre')
    await page.waitForTimeout(600)

    const dbMaliyetOrtalama = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT yaklasik_maliyet, hesaplama_esasi FROM DATA_TeminDosyasi WHERE id = ?',
        [targetId]
      )
    }, expectedDosyaId)

    expect(dbMaliyetOrtalama.data[0].hesaplama_esasi).toBe('Ortalama fiyat esasına göre')
    expect(Number(dbMaliyetOrtalama.data[0].yaklasik_maliyet)).toBe(7250)
    console.log('[Stage 4 Test] Ortalama Fiyat Esası hesaplaması (7250 TL) SQLite üzerinde birebir doğrulandı.')

    // 2. En Düşük Fiyat Esasını Seç ve Doğrula
    // En Düşük Fiyat Esasında: en avantajlı istekli Firma B (7000 TL)
    await esasSelect.selectOption('En Düşük fiyat esasına göre')
    await page.waitForTimeout(600)

    const dbMaliyetEnDusuk = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT yaklasik_maliyet, hesaplama_esasi FROM DATA_TeminDosyasi WHERE id = ?',
        [targetId]
      )
    }, expectedDosyaId)

    expect(dbMaliyetEnDusuk.data[0].hesaplama_esasi).toBe('En Düşük fiyat esasına göre')
    expect(Number(dbMaliyetEnDusuk.data[0].yaklasik_maliyet)).toBe(7000)
    console.log('[Stage 4 Test] En Düşük Fiyat Esası hesaplaması (7000 TL) SQLite üzerinde birebir doğrulandı.')

    // -------------------------------------------------------------
    // ADIM 6: Kazanan İstekliyi Belirleme (En Avantajlı Teklif: Firma B)
    // -------------------------------------------------------------
    const setWinnerButton = page.locator('button:has-text("Kazanan Yap")').first()
    await expect(setWinnerButton).toBeVisible({ timeout: 10000 })
    await setWinnerButton.click({ force: true })
    await page.waitForTimeout(600)

    // UI Doğrulaması: "Onaylandı" rozeti ve Firma B unvanı
    await expect(page.locator('text=Onaylandı').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator(`text=${firma2Unvan}`).first()).toBeVisible({ timeout: 10000 })
    console.log('[Stage 4 Test] En avantajlı teklif (Firma B) arayüzde onaylandı olarak işaretlendi.')

    // SQLite Doğrulaması: Kazanan Firma Kaydı
    const dbWinner = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      const resDosya = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT firma_id FROM DATA_TeminDosyasi WHERE id = ?',
        [targetId]
      )
      const resFirma = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, unvan, kazandi_mi FROM DATA_TeminFirma WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )
      return { dosya: resDosya.data[0], firmalar: resFirma.data }
    }, expectedDosyaId)

    const winnerFirmaRecord = dbWinner.firmalar.find((f: any) => f.unvan.includes('Firma B'))
    const loserFirmaRecord = dbWinner.firmalar.find((f: any) => f.unvan.includes('Firma A'))
    expect(winnerFirmaRecord.kazandi_mi).toBe(1)
    expect(loserFirmaRecord.kazandi_mi).toBe(0)
    expect(dbWinner.dosya.firma_id).toBeTruthy()
    console.log(`[Stage 4 Test] SQLite kazanan firma ilişkisi doğrulandı: Firma B (kazandi_mi=1), Firma A (kazandi_mi=0).`)

    // -------------------------------------------------------------
    // ADIM 7 & 8: Çalışma Alanını Kaydet, Kapat ve Aynı .temin Dosyasını Yeniden Aç (Kalıcılık Doğrulaması)
    // -------------------------------------------------------------
    console.log('[Stage 4 Test] Çalışma alanı kaydediliyor ve uygulama kapatılıyor...')
    const saveWorkspaceRes = await page.evaluate(async () => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke('workspace:save')
    })
    expect(saveWorkspaceRes.success).toBe(true)

    // Uygulamayı kapat
    await appInstance.close()
    appInstance = null

    // Aynı .temin dosyası ile uygulamayı ikinci kez aç
    console.log('[Stage 4 Test] Uygulama AYNI .temin dosyası ile yeniden başlatılıyor (Kalıcılık Testi)...')
    appInstance = await launchTestApp([isolatedTeminPath])
    page = appInstance.page

    await appInstance.electronApp.evaluate(({ dialog }) => {
      dialog.showMessageBoxSync = () => 0
    })
    await page.evaluate(() => {
      window.confirm = () => true
      window.alert = () => {}
    })
    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    await page.waitForLoadState('domcontentloaded')

    // Kilit ekranı geçişi
    const passwordInput2 = page.locator('input[type="password"]')
    if (await passwordInput2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput2.fill('123456')
      const loginButton2 = page
        .locator('button:has-text("Giriş Yap"), button:has-text("Şifre Belirle ve Giriş Yap")')
        .first()
      await loginButton2.click()
      await expect(passwordInput2).not.toBeVisible({ timeout: 15000 })
    }

    const disclaimerBtn2 = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await disclaimerBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerBtn2.click()
      await expect(disclaimerBtn2).not.toBeVisible({ timeout: 5000 })
    }

    // Piyasa Fiyat Araştırması ekranına geç
    await page.evaluate(async (targetId) => {
      localStorage.setItem('active_dosya_id', targetId.toString())
      sessionStorage.setItem('workspace_dosya_id', targetId.toString())

      const stores = (window as any).__teminStores
      if (stores?.useWorkspaceStore) {
        stores.useWorkspaceStore.getState().setActiveDosyaId(targetId)
      }

      window.location.hash = '#/dosya/piyasa-fiyat-arastirmasi'
    }, expectedDosyaId)

    // Sayfa geçişinde beliren disclaimer modalını kesin olarak kapat
    const disclaimerBtnReopen = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await disclaimerBtnReopen.isVisible({ timeout: 6000 }).catch(() => false)) {
      await disclaimerBtnReopen.click({ force: true })
      await expect(disclaimerBtnReopen).not.toBeVisible({ timeout: 5000 }).catch(() => {})
    }

    await expect(page.locator('text=Teklifler & Piyasa Fiyat Araştırması').first()).toBeVisible({ timeout: 25000 })

    // Tekrar disclaimer kontrolü (eğer gecikmeli render olduysa)
    if (await disclaimerBtnReopen.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerBtnReopen.click({ force: true })
      await expect(disclaimerBtnReopen).not.toBeVisible({ timeout: 5000 }).catch(() => {})
    }

    // Step 1 tablosunda Firma B'nin "Kazanan" statüsünde korunduğunu doğrula
    await expect(page.locator('tr:has-text("Aşama 4 Firma B")').locator('text=Kazanan').first()).toBeVisible({ timeout: 10000 })
    console.log('[Stage 4 Test] Yeniden açılışta Step 1 tablosunda Firma B Kazanan rozeti doğrulandı.')

    // Step 2'ye geç ve karar panelini doğrula
    const step2BtnAfter = page.locator('button:has-text("2. Adım: Fiyatları Girmeye Geç"), button:has-text("2. Adım: Fiyatlar & Kazanan Tespiti")').first()
    await step2BtnAfter.click({ force: true })
    await page.waitForTimeout(600)

    // UI'da "Onaylandı", Firma B'nin seçili olduğu ve teklif toplamları doğrulanmalı
    await expect(page.locator('text=Onaylandı').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator(`text=${firma2Unvan}`).locator('visible=true').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=7.000,00 TL').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=7.500,00 TL').first()).toBeVisible({ timeout: 10000 })

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, 'stage4-piyasa-fiyat-ve-teklifler-verified.png')

    // Taze SQLite bağlantısıyla doğrudan veritabanı bütünlüğü doğrulaması
    const persistentDbCheck = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      const resDosya = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT firma_id, yaklasik_maliyet, hesaplama_esasi FROM DATA_TeminDosyasi WHERE id = ?',
        [targetId]
      )
      // @ts-expect-error window.electron runtime API
      const resFirma = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, unvan, teklif_toplami, kazandi_mi FROM DATA_TeminFirma WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )
      // @ts-expect-error window.electron runtime API
      const resTeklif = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT count(*) as count FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?',
        [targetId]
      )
      return {
        dosya: resDosya.data[0],
        firmalar: resFirma.data,
        teklifSayisi: Number(resTeklif.data[0].count)
      }
    }, expectedDosyaId)

    // Bütünlük Kontrolleri:
    expect(persistentDbCheck.firmalar.length).toBe(2)
    expect(persistentDbCheck.teklifSayisi).toBe(4)
    expect(Number(persistentDbCheck.dosya.yaklasik_maliyet)).toBe(7000)
    expect(persistentDbCheck.dosya.hesaplama_esasi).toBe('En Düşük fiyat esasına göre')
    expect(persistentDbCheck.firmalar.find((f: any) => f.unvan.includes('Firma B')).kazandi_mi).toBe(1)
    expect(persistentDbCheck.firmalar.find((f: any) => f.unvan.includes('Firma A')).kazandi_mi).toBe(0)

    console.log('✅ [Stage 4 Başarılı] Firma, Teklif Matrisi, Yaklaşık Maliyet ve Kazanan Tespiti Kalıcılığı Eksiksiz Doğrulandı!')
  })
})
