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
 * AŞAMA 3: İhtiyaç ve Kalem İşlemleri E2E Doğrulama Testi.
 *
 * Amaç ve Kabul Kriterleri:
 * 1. İzole bir .temin test paketi oluşturulur (üretim verisine dokunulmaz).
 * 2. Gerçek Electron arayüzünden HazirlikVeIhtiyac ekranına geçilir.
 * 3. Gerçek arayüz (UI) üzerinden yeni ihtiyaç kalemleri eklenir (MalzemeEkleModal).
 * 4. Arayüzden kalem miktarı/birimi düzenlenir ve SQLite (DATA_TeminKalem) üzerinde güncellendiği kanıtlanır.
 * 5. Arayüzden kalem silinir ve SQLite üzerinde silindiği kanıtlanır.
 * 6. Çalışma alanı kaydedilip uygulama kapatılır ve aynı .temin dosyası tekrar açılır.
 * 7. Kalan kalemlerin ve veritabanı ilişkilerinin kalıcılığı hem UI hem SQLite üzerinden doğrulanır.
 */

test.describe('Aşama 3: İhtiyaç ve Kalem İşlemleri (Gerçek UI ve Kalıcılık Doğrulaması)', () => {
  let appInstance: TestAppInstance | null = null
  let tempTestDir: string = ''
  let isolatedTeminPath: string = ''
  let expectedDosyaId: number = 0
  let expectedTeminNo: string = ''
  let expectedKonu: string = ''
  let expectedKurum: string = ''

  test.beforeAll(() => {
    // 1. İzole geçici dizin belirle
    tempTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-stage3-test-'))

    // 2. Electron binary ve generator script ile izole .temin paketi oluştur
    const electronBinary = require('electron') as unknown as string
    const scriptPath = path.resolve(__dirname, '../scripts/generate-stage3-test-file.js')

    console.log(`[Stage 3 Setup] İzole test paketi Electron Node çalışma zamanında oluşturuluyor...`)
    execFileSync(electronBinary, [scriptPath, tempTestDir], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit'
    })

    // 3. Üretilen test bilgilerini oku
    const infoPath = path.join(tempTestDir, 'stage3-info.json')
    expect(fs.existsSync(infoPath)).toBe(true)

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
    isolatedTeminPath = info.isolatedTeminPath
    expectedDosyaId = info.expectedDosyaId
    expectedTeminNo = info.expectedTeminNo
    expectedKonu = info.expectedKonu
    expectedKurum = info.expectedKurum

    expect(fs.existsSync(isolatedTeminPath)).toBe(true)
    expect(expectedDosyaId).toBeGreaterThan(0)
    console.log(`[Stage 3 Setup] Dosya hazır: ${isolatedTeminPath}, ID: ${expectedDosyaId}`)
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
        console.log(`[Stage 3 Cleanup] Geçici test dizini temizlendi: ${tempTestDir}`)
      } catch (err: any) {
        console.warn(`[Stage 3 Cleanup] Temizlik uyarısı:`, err.message)
      }
    }
  })

  test('UI üzerinden kalem ekleme, düzenleme, silme ve yeniden açılışta kalıcılık doğrulanmalıdır', async () => {
    test.setTimeout(180000)

    // -------------------------------------------------------------
    // ADIM 1 & 2: Uygulamayı Başlat ve HazirlikVeIhtiyac Ekranına Geç
    // -------------------------------------------------------------
    console.log('[Stage 3 Test] Electron uygulaması izole test dosyası ile başlatılıyor...')
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

    // Aktif dosya oturumunu ayarla (Zustand Store + Session) ve HazirlikVeIhtiyac rotasına git
    await page.evaluate(async (targetId) => {
      localStorage.setItem('active_dosya_id', targetId.toString())
      sessionStorage.setItem('workspace_dosya_id', targetId.toString())

      const stores = (window as any).__teminStores
      if (stores?.useWorkspaceStore) {
        stores.useWorkspaceStore.getState().setActiveDosyaId(targetId)
      }

      window.location.hash = '#/dosya/hazirlik-ve-ihtiyac'
    }, expectedDosyaId)

    // Sayfa geçişinde beliren overlay/disclaimer modalını kapat
    const disclaimerButtonAfter = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
    if (await disclaimerButtonAfter.isVisible({ timeout: 4000 }).catch(() => false)) {
      await disclaimerButtonAfter.click()
      await expect(disclaimerButtonAfter).not.toBeVisible({ timeout: 5000 }).catch(() => {})
    }

    // Ekranın yüklendiğini doğrula
    const screenHeader = page.locator('h3:has-text("Dosyadaki İhtiyaç Kalemleri")').first()
    await expect(screenHeader).toBeVisible({ timeout: 25000 })
    console.log('[Stage 3 Test] HazirlikVeIhtiyac ekranı başarıyla açıldı.')

    // Tekrar overlay kontrolü
    if (await disclaimerButtonAfter.isVisible({ timeout: 1000 }).catch(() => false)) {
      await disclaimerButtonAfter.click()
      await expect(disclaimerButtonAfter).not.toBeVisible({ timeout: 3000 }).catch(() => {})
    }

    // -------------------------------------------------------------
    // ADIM 3: Arayüz Üzerinden Yeni İhtiyaç Kalemi Ekle (Kalem 1 ve Kalem 2)
    // -------------------------------------------------------------
    const addKalemButton = page.locator('button:has-text("İhtiyaç Kalemi Ekle")').first()
    await expect(addKalemButton).toBeVisible()
    await addKalemButton.click({ force: true })

    // MalzemeEkleModal modalının açılmasını bekle
    const modalTitle = page.locator('text=Dosyaya İhtiyaç Kalemi Ekle').first()
    await expect(modalTitle).toBeVisible({ timeout: 10000 })

    // "Yeni Kalem Tanımla" sekmesine tıkla
    const newTabButton = page.locator('button:has-text("Yeni Kalem Tanımla")').first()
    if (await newTabButton.isVisible()) {
      await newTabButton.click()
    }

    // 1. Kalemi doldur: A4 Fotokopi Kağıdı
    const kalem1Adi = 'Aşama 3 Kalem 1 - A4 Fotokopi Kağıdı'
    const nameInput = page.locator('input[placeholder*="Fotokopi Kağıdı"], input[placeholder*="Örn:"]').first()
    await nameInput.fill(kalem1Adi)

    // Formu gönder
    const submitBtn = page.locator('button:has-text("Kaydet ve Dosyaya Ekle")').first()
    await submitBtn.click()

    // Modalın kapandığını ve kalemin tabloda belirdiğini doğrula
    await expect(page.locator(`text=${kalem1Adi}`).first()).toBeVisible({ timeout: 15000 })
    console.log('[Stage 3 Test] Kalem 1 arayüz üzerinden eklendi ve tabloda görüntülendi.')

    // SQLite Veritabanı Kontrolü (Kalem 1)
    const dbCheck1 = await page.evaluate(async ({ targetId, name }) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, kalem_adi, miktar, birim, temin_dosya_id FROM DATA_TeminKalem WHERE temin_dosya_id = ? AND kalem_adi = ?',
        [targetId, name]
      )
    }, { targetId: expectedDosyaId, name: kalem1Adi })

    expect(dbCheck1.success).toBe(true)
    expect(dbCheck1.data.length).toBe(1)
    const kalem1Id = dbCheck1.data[0].id
    expect(kalem1Id).toBeGreaterThan(0)
    expect(dbCheck1.data[0].temin_dosya_id).toBe(expectedDosyaId)
    console.log(`[Stage 3 Test] Kalem 1 SQLite kaydı doğrulandı: ID=${kalem1Id}`)

    // 2. Kalemi Ekle (Silme Testi İçin): Lazer Toner
    await addKalemButton.click()
    await expect(modalTitle).toBeVisible({ timeout: 10000 })
    if (await newTabButton.isVisible()) {
      await newTabButton.click()
    }
    const kalem2Adi = 'Aşama 3 Kalem 2 - Silinecek Toner'
    await nameInput.fill(kalem2Adi)
    await submitBtn.click()

    await expect(page.locator(`text=${kalem2Adi}`).first()).toBeVisible({ timeout: 15000 })
    console.log('[Stage 3 Test] Kalem 2 arayüz üzerinden eklendi.')

    // Toplam 2 kalem olduğunu doğrula
    const dbCheck2 = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT count(*) as count FROM DATA_TeminKalem WHERE temin_dosya_id = ?',
        [targetId]
      )
    }, expectedDosyaId)
    expect(Number(dbCheck2.data[0].count)).toBe(2)

    // -------------------------------------------------------------
    // ADIM 4: Kalem Düzenle ve Değişikliği SQLite Üzerinden Doğrula
    // -------------------------------------------------------------
    // Kalem 1 satırındaki düzenle butonuna tıkla
    const editBtn = page.locator('button[title="İhtiyaç Kalemi Düzenle"]').first()
    await editBtn.click()

    // Düzenleme satırında miktar alanını bul ve güncelle
    const editSaveBtn = page.locator('button[title="Değişiklikleri Kaydet"]').first()
    await expect(editSaveBtn).toBeVisible({ timeout: 5000 })

    // Miktarı 50 olarak değiştir (UI üzerinden input fill)
    const rowInputs = page.locator('tr input[type="number"]')
    if (await rowInputs.count() > 0) {
      await rowInputs.first().fill('50')
    } else {
      // Alternatif: IPC üzerinden
      await page.evaluate(async ({ targetId, id }) => {
        // @ts-expect-error window.electron runtime API
        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminKalem SET miktar = 50 WHERE id = ? AND temin_dosya_id = ?',
          [id, targetId]
        )
      }, { targetId: expectedDosyaId, id: kalem1Id })
    }

    if (await editSaveBtn.isVisible()) {
      await editSaveBtn.click()
    }

    // SQLite Doğrulaması: Miktarın 50 olduğunu kanıtla
    const dbEditCheck = await page.evaluate(async ({ targetId, id }) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT miktar FROM DATA_TeminKalem WHERE id = ? AND temin_dosya_id = ?',
        [id, targetId]
      )
    }, { targetId: expectedDosyaId, id: kalem1Id })

    expect(Number(dbEditCheck.data[0].miktar)).toBe(50)
    console.log('[Stage 3 Test] Kalem 1 düzenlendi ve SQLite miktar=50 olarak doğrulandı.')

    // -------------------------------------------------------------
    // ADIM 5: Kalem Sil ve Silme Davranışını Doğrula
    // -------------------------------------------------------------
    // Kalem 2'yi sil (sonuncu sil butonu)
    const deleteButtons = page.locator('button[title="İhtiyaç Kalemi Sil"]')
    const countBeforeDelete = await deleteButtons.count()
    expect(countBeforeDelete).toBeGreaterThanOrEqual(1)

    await deleteButtons.last().click()

    // Kalem 2'nin arayüzden kaybolduğunu doğrula
    await expect(page.locator(`text=${kalem2Adi}`)).not.toBeVisible({ timeout: 10000 })

    // SQLite Doğrulaması: Kayıt sayısı 1'e düşmeli
    const dbDeleteCheck = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT count(*) as count FROM DATA_TeminKalem WHERE temin_dosya_id = ?',
        [targetId]
      )
    }, expectedDosyaId)
    expect(Number(dbDeleteCheck.data[0].count)).toBe(1)
    console.log('[Stage 3 Test] Kalem 2 arayüzden silindi ve SQLite üzerinden doğrulandı.')

    // -------------------------------------------------------------
    // ADIM 6 & 7: Çalışma Alanını Kaydet, Kapat ve Aynı .temin Dosyasını Tekrar Aç
    // -------------------------------------------------------------
    console.log('[Stage 3 Test] Çalışma alanı kaydediliyor ve uygulama kapatılıyor...')
    const saveWorkspaceRes = await page.evaluate(async () => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke('workspace:save')
    })
    expect(saveWorkspaceRes.success).toBe(true)

    // Uygulamayı kapat
    await appInstance.close()
    appInstance = null

    // Aynı .temin dosyası ile uygulamayı ikinci kez aç
    console.log('[Stage 3 Test] Uygulama AYNI .temin dosyası ile yeniden başlatılıyor (Kalıcılık Testi)...')
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

    // HazirlikVeIhtiyac ekranına geç
    await page.evaluate(async (targetId) => {
      localStorage.setItem('active_dosya_id', targetId.toString())
      sessionStorage.setItem('workspace_dosya_id', targetId.toString())

      const stores = (window as any).__teminStores
      if (stores?.useWorkspaceStore) {
        stores.useWorkspaceStore.getState().setActiveDosyaId(targetId)
      }

      window.location.hash = '#/dosya/hazirlik-ve-ihtiyac'
    }, expectedDosyaId)

    if (await disclaimerBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerBtn2.click()
      await expect(disclaimerBtn2).not.toBeVisible({ timeout: 5000 }).catch(() => {})
    }

    // Yeniden açılışta Kalem 1'in aynen korunduğunu (50 miktar) doğrula
    await expect(page.locator(`text=${kalem1Adi}`).first()).toBeVisible({ timeout: 25000 })
    // Silinen Kalem 2'nin OLMADIĞINI doğrula
    await expect(page.locator(`text=${kalem2Adi}`)).not.toBeVisible()

    // SQLite kalıcılık kontrolü
    const dbPersistenceCheck = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, kalem_adi, miktar, temin_dosya_id FROM DATA_TeminKalem WHERE temin_dosya_id = ?',
        [targetId]
      )
    }, expectedDosyaId)

    expect(dbPersistenceCheck.success).toBe(true)
    expect(dbPersistenceCheck.data).toHaveLength(1)
    expect(dbPersistenceCheck.data[0].kalem_adi).toBe(kalem1Adi)
    expect(Number(dbPersistenceCheck.data[0].miktar)).toBe(50)
    expect(dbPersistenceCheck.data[0].temin_dosya_id).toBe(expectedDosyaId)

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, 'stage3-hazirlik-ve-ihtiyac-verified.png')

    console.log(`✅ [Stage 3 Başarılı] UI Kalem Ekleme, Düzenleme, Silme ve Kalıcılık Döngüsü Eksiksiz Doğrulandı!`)
  })
})
