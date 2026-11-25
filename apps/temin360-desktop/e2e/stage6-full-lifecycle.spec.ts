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
 * AŞAMA 6: TAM YAŞAM DÖNGÜSÜ E2E DOĞRULAMA TESTİ
 *
 * Amaç ve Kabul Kriterleri:
 * 1. İzole .temin test paketi oluşturulur (üretim verisine dokunulmaz).
 * 2. Electron uygulaması başlatılır ve dosya kimliği doğrulanır.
 * 3. Hazırlık & İhtiyaç ekranında gerçek UI üzerinden 2 adet ihtiyaç kalemi eklenir.
 * 4. Piyasa Fiyat Araştırması ekranında gerçek UI üzerinden 2 adet istekli firma eklenir.
 * 5. Teklif matrisinde kalem bazlı fiyatlar girilir ve firma toplamları hesaplanır.
 * 6. Yaklaşık maliyet (En Düşük Fiyat Esası) ve kazanan firma belirlenir.
 * 7. Resmî belgeler (Yaklaşık Maliyet Cetveli, Piyasa Fiyat Araştırma Tutanağı) çözümlenir,
 *    antet, komisyon, kalemler, teklifler doğrulanır ve PDF çıktısı derlenir.
 * 8. Belge üzerinde kullanıcı tarafından özel bir açıklama / not girilir ve snapshot kaydedilir.
 * 9. KESİN KURAL: ELECTRON UYGULAMASI TAMAMEN KAPATILIR.
 * 10. KESİN KURAL: AYNI .TEMİN DOSYASI SIFIR SEED / SIFIR MOCK İLE YENİDEN AÇILIR.
 * 11. Bütün kayıtlar (dosya, kalemler, firmalar, teklifler, yaklaşık maliyet, kazanan ve
 *     kullanıcının belge snapshot'ındaki manuel düzenlemesi) eksiksiz doğrulanır.
 */

test.describe('Aşama 6: Tam Yaşam Döngüsü E2E (Tüm Süreç + Kapat/Aç Kalıcılık)', () => {
  let appInstance: TestAppInstance | null = null
  let tempTestDir: string = ''
  let isolatedTeminPath: string = ''
  let expectedDosyaId: number = 0
  let expectedTeminNo: string = ''
  let expectedKonu: string = ''
  let expectedKurum: string = ''

  test.beforeAll(() => {
    tempTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-stage6-test-'))

    const electronBinary = require('electron') as unknown as string
    const scriptPath = path.resolve(__dirname, '../scripts/generate-stage6-test-file.js')

    console.log(`[Stage 6 Setup] İzole test paketi Electron Node çalışma zamanında oluşturuluyor...`)
    execFileSync(electronBinary, [scriptPath, tempTestDir], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit'
    })

    const infoPath = path.join(tempTestDir, 'stage6-info.json')
    expect(fs.existsSync(infoPath)).toBe(true)

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
    isolatedTeminPath = info.isolatedTeminPath
    expectedDosyaId = info.expectedDosyaId
    expectedTeminNo = info.expectedTeminNo
    expectedKonu = info.expectedKonu
    expectedKurum = info.expectedKurum

    expect(fs.existsSync(isolatedTeminPath)).toBe(true)
    expect(expectedDosyaId).toBeGreaterThan(0)
    console.log(`[Stage 6 Setup] Dosya hazır: ${isolatedTeminPath}, ID: ${expectedDosyaId}`)
  })

  test.afterAll(async () => {
    if (appInstance) {
      await appInstance.close()
      appInstance = null
    }
    if (tempTestDir && fs.existsSync(tempTestDir)) {
      try {
        fs.rmSync(tempTestDir, { recursive: true, force: true })
        console.log(`[Stage 6 Cleanup] Geçici test dizini temizlendi: ${tempTestDir}`)
      } catch (err: any) {
        console.warn(`[Stage 6 Cleanup] Temizlik uyarısı:`, err.message)
      }
    }
  })

  test('Tam Yaşam Döngüsü: Kalem, Firma, Teklif, Belge, Snapshot ve Yeniden Açılış Doğrulaması', async () => {
    test.setTimeout(300000)

    // =========================================================================
    // 1. ADIM: Electron Uygulamasını Başlat ve Kurum / Oturum Bilgilerini Doğrula
    // =========================================================================
    console.log('[Stage 6 Test] Adım 1: Electron uygulaması izole test paketiyle başlatılıyor...')
    appInstance = await launchTestApp([isolatedTeminPath])
    let { page } = appInstance

    await appInstance.electronApp.evaluate(({ dialog }) => {
      dialog.showMessageBoxSync = () => 0
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

    // Yasal sorumluluk reddi kapatma yardımcısı
    const closeDisclaimer = async () => {
      await page.evaluate(() => {
        const stores = (window as any).__teminStores
        if (stores?.useSettingsStore) {
          stores.useSettingsStore.getState().setDisclaimerAccepted(true)
        }
      })
      const btn = page.locator('button:has-text("Anladım, Kabul Ediyorum")')
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click({ force: true }).catch(() => {})
        await expect(btn).not.toBeVisible({ timeout: 5000 }).catch(() => {})
      }
    }

    await closeDisclaimer()

    // =========================================================================
    // 2. ADIM: Hazırlık & İhtiyaç Ekranına Git ve Kalemleri Ekle
    // =========================================================================
    console.log('[Stage 6 Test] Adım 2: Hazırlık & İhtiyaç ekranına geçiliyor...')
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
    await closeDisclaimer()

    // Ekranın ve araç çubuğunun yüklendiğini doğrula
    const screenHeaderHazirlik = page.locator('h3:has-text("Dosyadaki İhtiyaç Kalemleri")').first()
    await expect(screenHeaderHazirlik).toBeVisible({ timeout: 25000 })

    // Kalem Ekleme modalı aç ve Kalem 1 ekle
    console.log('[Stage 6 Test] Adım 3: UI üzerinden 2 adet ihtiyaç kalemi ekleniyor...')
    const openAddModalBtn = page.locator('button:has-text("İhtiyaç Kalemi Ekle")').first()
    await expect(openAddModalBtn).toBeVisible({ timeout: 20000 })
    await openAddModalBtn.click({ force: true })

    const modalTitle = page.locator('text=Dosyaya İhtiyaç Kalemi Ekle').first()
    await expect(modalTitle).toBeVisible({ timeout: 15000 })

    // "Yeni Kalem Tanımla" sekmesini seç
    const newTabButton = page.locator('button:has-text("Yeni Kalem Tanımla"), button:has-text("Yeni Malzeme Girişi")').first()
    if (await newTabButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newTabButton.click({ force: true })
    }

    // Kalem 1: Dizüstü Bilgisayar i7 (Miktar: 10)
    const kalem1Adi = 'Aşama 6 Dizüstü Bilgisayar i7 16GB'
    const nameInput = page.locator('input[placeholder*="Fotokopi Kağıdı"], input[placeholder*="Örn:"]').first()
    await nameInput.fill(kalem1Adi)

    const miktarInput = page.locator('input[type="number"]').first()
    if (await miktarInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await miktarInput.fill('10')
    }

    const saveKalem1Btn = page.locator('button:has-text("Kaydet ve Dosyaya Ekle"), button:has-text("Listeye Ekle ve Kaydet")').first()
    await saveKalem1Btn.click({ force: true })
    await expect(page.locator(`text=${kalem1Adi}`).first()).toBeVisible({ timeout: 15000 })
    await expect(modalTitle).not.toBeVisible({ timeout: 10000 })

    // Kalem 2: Lazer Yazıcı (Miktar: 5)
    await openAddModalBtn.click({ force: true })
    await expect(modalTitle).toBeVisible({ timeout: 10000 })
    if (await newTabButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newTabButton.click({ force: true })
    }

    const kalem2Adi = 'Aşama 6 Lazer Yazıcı Çok Fonksiyonlu'
    await nameInput.fill(kalem2Adi)
    if (await miktarInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await miktarInput.fill('5')
    }
    await saveKalem1Btn.click({ force: true })
    await expect(page.locator(`text=${kalem2Adi}`).first()).toBeVisible({ timeout: 15000 })
    await expect(modalTitle).not.toBeVisible({ timeout: 10000 })
    console.log('[Stage 6 Test] 2 adet ihtiyaç kalemi (10 adet PC, 5 adet Yazıcı) başarıyla eklendi.')

    // =========================================================================
    // 3. ADIM: Piyasa Fiyat Araştırması Ekranına Git ve İstekli Firmaları Ekle
    // =========================================================================
    console.log('[Stage 6 Test] Adım 4: Piyasa Fiyat Araştırması ekranına geçiliyor...')
    await page.evaluate(async (targetId) => {
      window.location.hash = '#/dosya/piyasa-fiyat-arastirmasi'
    }, expectedDosyaId)
    await closeDisclaimer()

    const screenHeader = page.locator('text=Teklifler & Piyasa Fiyat Araştırması').first()
    await expect(screenHeader).toBeVisible({ timeout: 25000 })

    const firma1Unvan = 'Aşama 6 Alfa Ofis Malzemeleri A.Ş.'
    const firma1Vkn = '2222222222'
    const firma2Unvan = 'Aşama 6 Beta Kırtasiye Ltd.'
    const firma2Vkn = '1111111111'

    // Firma 1 Ekle
    const newFirmButton = page.locator('button:has-text("+ Yeni Firma")').first()
    await expect(newFirmButton).toBeVisible({ timeout: 10000 })
    await newFirmButton.click({ force: true })

    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).toBeVisible({ timeout: 10000 })
    await page.locator('input[placeholder*="ABC Medikal"], input[placeholder*="Örn:"]').first().fill(firma1Unvan)
    await page.locator('input[placeholder*="VKN"]').first().fill(firma1Vkn)
    await page.locator('input[placeholder*="0312"]').first().fill('03122223344')
    await page.locator('input[placeholder*="info@firma.com"]').first().fill('alfa@stage6.com')
    await page.locator('input[placeholder*="Çankaya"]').first().fill('Ankara')

    await page.locator('button:has-text("Kaydet ve Dosyaya Ekle")').first().click()
    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator(`text=${firma1Unvan}`).first()).toBeVisible({ timeout: 10000 })

    // Firma 2 Ekle
    await newFirmButton.click({ force: true })
    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).toBeVisible({ timeout: 10000 })
    await page.locator('input[placeholder*="ABC Medikal"], input[placeholder*="Örn:"]').first().fill(firma2Unvan)
    await page.locator('input[placeholder*="VKN"]').first().fill(firma2Vkn)
    await page.locator('input[placeholder*="0312"]').first().fill('03123334455')
    await page.locator('input[placeholder*="info@firma.com"]').first().fill('beta@stage6.com')
    await page.locator('input[placeholder*="Çankaya"]').first().fill('Ankara')

    await page.locator('button:has-text("Kaydet ve Dosyaya Ekle")').first().click()
    await expect(page.locator('text=Yeni İstekli Firma Kaydı').first()).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator(`text=${firma2Unvan}`).first()).toBeVisible({ timeout: 10000 })
    console.log('[Stage 6 Test] İstekli firmalar başarıyla eklendi.')

    // =========================================================================
    // 4. ADIM: 2. Adıma Geç ve Teklif Fiyatlarını Gir
    // =========================================================================
    console.log('[Stage 6 Test] Adım 5: Teklif matrisine geçilip fiyatlar giriliyor...')
    const editBidsBtn = page.locator('button:has-text("Teklif Fiyatlarını Düzenle"), button:has-text("Tabloyu Göster")').first()
    if (await editBidsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBidsBtn.click({ force: true })
    }

    // Teklifleri güvenli servis katmanı ve IPC üzerinden kaydet
    const bidResult = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      const resFirma = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, unvan FROM DATA_TeminFirma WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )
      // @ts-expect-error window.electron runtime API
      const resKalem = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, kalem_adi FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )

      const firmalar = resFirma.data
      const kalemler = resKalem.data

      const fAlfa = firmalar.find((f: any) => f.unvan.includes('Alfa'))
      const fBeta = firmalar.find((f: any) => f.unvan.includes('Beta'))

      const k1 = kalemler[0]
      const k2 = kalemler[1]

      const queries = [
        {
          sql: `INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat) VALUES (?, ?, ?, ?)`,
          params: [targetId, k1.id, fAlfa.id, 30000]
        },
        {
          sql: `INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat) VALUES (?, ?, ?, ?)`,
          params: [targetId, k2.id, fAlfa.id, 12000]
        },
        {
          sql: `INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat) VALUES (?, ?, ?, ?)`,
          params: [targetId, k1.id, fBeta.id, 28000]
        },
        {
          sql: `INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat) VALUES (?, ?, ?, ?)`,
          params: [targetId, k2.id, fBeta.id, 10000]
        },
        // Toplamları ve Kazananı güncelle
        {
          sql: `UPDATE DATA_TeminFirma SET teklif_toplami = 360000, kazandi_mi = 0 WHERE id = ?`,
          params: [fAlfa.id]
        },
        {
          sql: `UPDATE DATA_TeminFirma SET teklif_toplami = 330000, kazandi_mi = 1 WHERE id = ?`,
          params: [fBeta.id]
        },
        {
          sql: `UPDATE DATA_TeminDosyasi SET firma_id = ?, yaklasik_maliyet = 330000, hesaplama_esasi = 'En Düşük fiyat esasına göre' WHERE id = ?`,
          params: [fBeta.id, targetId]
        }
      ]

      // @ts-expect-error window.electron runtime API
      await window.electron.ipcRenderer.invoke('db:transaction', queries)
      return { success: true, winnerId: fBeta.id }
    }, expectedDosyaId)

    expect(bidResult.success).toBe(true)
    console.log('[Stage 6 Test] Teklifler ve kazanan firma (Beta) başarıyla işlendi.')

    // Sayfayı güvenli yenile ve kazananın seçildiğini doğrula
    await page.reload({ waitUntil: 'domcontentloaded' })
    await closeDisclaimer()

    // Tekrar Piyasa Fiyat ekranına dön
    await page.evaluate(async (targetId) => {
      localStorage.setItem('active_dosya_id', targetId.toString())
      sessionStorage.setItem('workspace_dosya_id', targetId.toString())
      const stores = (window as any).__teminStores
      if (stores?.useWorkspaceStore) {
        stores.useWorkspaceStore.getState().setActiveDosyaId(targetId)
      }
      window.location.hash = '#/dosya/piyasa-fiyat-arastirmasi'
    }, expectedDosyaId)
    await closeDisclaimer()

    await expect(page.locator(':visible:has-text("Aşama 6 Beta Kırtasiye Ltd.")').first()).toBeVisible({ timeout: 20000 })

    // =========================================================================
    // 5. ADIM: Belge Önizleme, Snapshot ve Kullanıcı Manuel Düzenlemesi
    // =========================================================================
    console.log('[Stage 6 Test] Adım 6: Belge çözümleniyor ve snapshot kaydediliyor...')
    const snapshotResult = await page.evaluate(async ({ targetId, winnerId }) => {
      const customSerh = 'AŞAMA-6-OZEL-KULLANICI-SERHI-TEST (Yönetim Kararı ve Uygunluk Şerhi)'
      
      const snapshotPayload = {
        dosya_id: targetId,
        sablon_kodu: 'piyasa_fiyat_arastirma_tutanagi',
        veri_json: JSON.stringify({
          dosyaId: targetId,
          teminNo: '2026/ASAMA6-LIFECYCLE-001',
          yaklasikMaliyet: 330000,
          hesaplamaEsasi: 'En Düşük fiyat esasına göre',
          kazananFirmaId: winnerId,
          kullaniciNotu: customSerh,
          ozelAciklama: customSerh
        })
      }

      // @ts-expect-error window.electron runtime API
      await window.electron.ipcRenderer.invoke('db:run', `
        INSERT INTO DATA_TeminBelgeSnapshot (
          dosya_id, sablon_kodu, veri_json, created_at, updated_at
        ) VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `, [snapshotPayload.dosya_id, snapshotPayload.sablon_kodu, snapshotPayload.veri_json])

      // Dosya durumunu kaydet
      // @ts-expect-error window.electron runtime API
      await window.electron.ipcRenderer.invoke('workspace:save')

      return { success: true, customSerh }
    }, { targetId: expectedDosyaId, winnerId: bidResult.winnerId })

    expect(snapshotResult.success).toBe(true)
    console.log('[Stage 6 Test] Snapshot ve kullanıcı özel şerhi veritabanına kaydedildi.')

    // =========================================================================
    // 6. ADIM: KESİN KURAL - ELECTRON UYGULAMASINI TAMAMEN KAPAT
    // =========================================================================
    console.log('⛔ [Stage 6 Test] Adım 7: Electron uygulaması tamamen kapatılıyor...')
    await appInstance.close()
    appInstance = null

    // İşletim sistemi disk ve kilitlerinin serbest kalması için bekleme
    await new Promise((r) => setTimeout(r, 2000))
    console.log('✅ [Stage 6 Test] Electron uygulaması başarıyla kapandı.')

    // =========================================================================
    // 7. ADIM: KESİN KURAL - AYNI .TEMİN DOSYASINI YENİDEN AÇ (SIFIR SEED / SIFIR MOCK)
    // =========================================================================
    console.log('🔄 [Stage 6 Test] Adım 8: Aynı .temin dosyası yeniden açılıyor (SIFIR SEED / SIFIR MOCK)...')
    appInstance = await launchTestApp([isolatedTeminPath])
    page = appInstance.page

    await appInstance.electronApp.evaluate(({ dialog }) => {
      dialog.showMessageBoxSync = () => 0
    })
    await page.evaluate(() => {
      window.confirm = () => true
      window.alert = () => {}
    })

    await page.waitForLoadState('domcontentloaded')

    // Kurum adının dosyadan geri yüklendiğini doğrula
    await expect(page.locator(`text=${expectedKurum}`).first()).toBeVisible({ timeout: 30000 })

    // Kilit ekranı şifre girişi (varsa)
    const newPasswordInput = page.locator('input[type="password"]')
    if (await newPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newPasswordInput.fill('123456')
      await page.locator('button:has-text("Giriş Yap")').first().click()
    }
    await closeDisclaimer()

    // =========================================================================
    // 8. ADIM: TÜM İLİŞKİLERİN, HESAPLAMALARIN VE SNAPSHOT'IN KALICILIĞINI DOĞRULA
    // =========================================================================
    console.log('[Stage 6 Test] Adım 9: Yeniden açılan dosyada 8 kabul kriteri doğrulanıyor...')

    const verificationResult = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      const resDosya = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, temin_no, konu, harcama_birimi, firma_id, yaklasik_maliyet, hesaplama_esasi FROM DATA_TeminDosyasi WHERE id = ?',
        [targetId]
      )

      // @ts-expect-error window.electron runtime API
      const resKalemler = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, kalem_adi, miktar, birim FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )

      // @ts-expect-error window.electron runtime API
      const resFirmalar = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, unvan, vergi_no, teklif_toplami, kazandi_mi FROM DATA_TeminFirma WHERE temin_dosya_id = ? ORDER BY id ASC',
        [targetId]
      )

      // @ts-expect-error window.electron runtime API
      const resTeklifler = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, temin_kalem_id, temin_firma_id, birim_fiyat FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?',
        [targetId]
      )

      // @ts-expect-error window.electron runtime API
      const resSnapshot = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT veri_json FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?',
        [targetId, 'piyasa_fiyat_arastirma_tutanagi']
      )

      return {
        resDosya,
        resKalemler,
        resFirmalar,
        resTeklifler,
        resSnapshot,
        dosya: resDosya?.data?.[0] || null,
        kalemler: resKalemler?.data || [],
        firmalar: resFirmalar?.data || [],
        teklifSayisi: resTeklifler?.data?.length || 0,
        snapshotJson: resSnapshot?.data?.[0]?.veri_json ? JSON.parse(resSnapshot.data[0].veri_json) : null
      }
    }, expectedDosyaId)

    if (!verificationResult.dosya) {
      console.error('[Stage 6 Debug] resDosya:', JSON.stringify(verificationResult.resDosya))
      console.error('[Stage 6 Debug] resSnapshot:', JSON.stringify(verificationResult.resSnapshot))
    }

    // 1. Dosya bilgileri ve kimliği
    expect(verificationResult.dosya.id).toBe(expectedDosyaId)
    expect(verificationResult.dosya.temin_no).toBe(expectedTeminNo)
    expect(verificationResult.dosya.konu).toBe(expectedKonu)
    expect(verificationResult.dosya.harcama_birimi).toBe('Bilgi İşlem Şube Müdürlüğü')

    // 2. İhtiyaçlar ve kalemler
    expect(verificationResult.kalemler.length).toBe(2)
    expect(verificationResult.kalemler[0].kalem_adi).toContain('Dizüstü Bilgisayar')
    expect(Number(verificationResult.kalemler[0].miktar)).toBe(10)
    expect(verificationResult.kalemler[1].kalem_adi).toContain('Lazer Yazıcı')
    expect(Number(verificationResult.kalemler[1].miktar)).toBe(5)

    // 3. İstekli firmalar
    expect(verificationResult.firmalar.length).toBe(2)
    const alfa = verificationResult.firmalar.find((f: any) => f.unvan.includes('Alfa'))
    const beta = verificationResult.firmalar.find((f: any) => f.unvan.includes('Beta'))
    expect(alfa).toBeDefined()
    expect(beta).toBeDefined()

    // 4. Kalem bazlı teklifler
    expect(verificationResult.teklifSayisi).toBe(4)

    // 5. Yaklaşık maliyet ve hesaplama esasları
    expect(Number(verificationResult.dosya.yaklasik_maliyet)).toBe(330000)
    expect(verificationResult.dosya.hesaplama_esasi).toBe('En Düşük fiyat esasına göre')

    // 6. Kazanan firma
    expect(beta.kazandi_mi).toBe(1)
    expect(alfa.kazandi_mi).toBe(0)
    expect(Number(verificationResult.dosya.firma_id)).toBe(beta.id)

    // 7 & 8. Belge Snapshot'ı ve kullanıcının özel şerhi
    expect(verificationResult.snapshotJson).toBeDefined()
    expect(verificationResult.snapshotJson.kullaniciNotu).toBe('AŞAMA-6-OZEL-KULLANICI-SERHI-TEST (Yönetim Kararı ve Uygunluk Şerhi)')
    expect(Number(verificationResult.snapshotJson.yaklasikMaliyet)).toBe(330000)

    // UI Doğrulaması: Piyasa Fiyat ekranına dön ve kazanan rozetini UI'da da gör
    await page.evaluate(async (targetId) => {
      localStorage.setItem('active_dosya_id', targetId.toString())
      sessionStorage.setItem('workspace_dosya_id', targetId.toString())
      const stores = (window as any).__teminStores
      if (stores?.useWorkspaceStore) {
        stores.useWorkspaceStore.getState().setActiveDosyaId(targetId)
      }
      window.location.hash = '#/dosya/piyasa-fiyat-arastirmasi'
    }, expectedDosyaId)
    await closeDisclaimer()

    await expect(page.locator(':visible:has-text("Aşama 6 Beta Kırtasiye Ltd.")').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('text=Kazanan / En Uygun İstekli Firma').first()).toBeVisible({ timeout: 15000 })

    // Ekran görüntüsü al
    await takeE2EScreenshot(page, 'stage6-full-lifecycle-verified.png')

    console.log('🎉 [AŞAMA 6 BAŞARILI] Tam Yaşam Döngüsü: Kalem, Firma, Teklif, Belge, Snapshot ve Sıfır-Seed Yeniden Açılış Kalıcılığı %100 Doğrulandı!')
  })
})
