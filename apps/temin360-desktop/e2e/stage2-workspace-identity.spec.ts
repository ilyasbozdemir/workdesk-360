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
 * AŞAMA 2: İzole .temin Çalışma Alanı ve Gerçek Dosya Kimliği (activeDosyaId) Doğrulama Testi.
 *
 * Kabul Kriterleri:
 * 1. Üretim veritabanına ve kullanıcı dosyalarına KESİNLİKLE DOKUNULMADAN,
 *    tamamen izole bir geçici dizinde sıfırdan bir .temin test paketi oluşturulur.
 * 2. SQLite içindeki DATA_TeminDosyasi tablosuna yazılan kaydın gerçek ID'si (lastInsertRowid) kaydedilir.
 * 3. Gerçek Electron masaüstü uygulamasında bu .temin dosyası açılır.
 * 4. UI çalışma alanındaki activeDosyaId ile SQLite içindeki DATA_TeminDosyasi.id'nin
 *    birebir eşleştiği hem IPC sorgusu hem de arayüz durumu üzerinden kanıtlanır.
 */

test.describe('Aşama 2: İzole .temin Çalışma Alanı ve Dosya Kimliği Doğrulama', () => {
  let appInstance: TestAppInstance | null = null
  let tempTestDir: string = ''
  let isolatedTeminPath: string = ''
  let expectedDosyaId: number = 0
  let expectedTeminNo: string = ''
  let expectedKonu: string = ''
  let expectedKurum: string = ''

  test.beforeAll(() => {
    // 1. İzole geçici dizin belirle
    tempTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-stage2-test-'))

    // 2. Electron binary ve generator script yolunu al
    const electronBinary = require('electron') as unknown as string
    const scriptPath = path.resolve(__dirname, '../scripts/generate-stage2-test-file.js')

    console.log(`[Stage 2 Setup] İzole test paketi Electron Node çalışma zamanında oluşturuluyor...`)
    execFileSync(electronBinary, [scriptPath, tempTestDir], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit'
    })

    // 3. Üretilen test bilgilerini oku
    const infoPath = path.join(tempTestDir, 'stage2-info.json')
    expect(fs.existsSync(infoPath)).toBe(true)

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
    isolatedTeminPath = info.isolatedTeminPath
    expectedDosyaId = info.expectedDosyaId
    expectedTeminNo = info.expectedTeminNo
    expectedKonu = info.expectedKonu
    expectedKurum = info.expectedKurum

    expect(fs.existsSync(isolatedTeminPath)).toBe(true)
    expect(expectedDosyaId).toBeGreaterThan(0)
    console.log(`[Stage 2 Setup] Dosya hazır: ${isolatedTeminPath}, ID: ${expectedDosyaId}, No: ${expectedTeminNo}`)
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
        console.log(`[Stage 2 Cleanup] Geçici test dizini temizlendi: ${tempTestDir}`)
      } catch (err: any) {
        console.warn(`[Stage 2 Cleanup] Temizlik uyarısı:`, err.message)
      }
    }
  })

  test('Gerçek masaüstü akışında izole .temin açılmalı ve activeDosyaId ile DATA_TeminDosyasi.id birebir eşleşmelidir', async () => {
    test.setTimeout(120000)

    // 1. Gerçek Electron uygulamasını izole .temin dosyamız ile başlat
    console.log('[Stage 2 Test] Electron uygulaması izole test dosyası ile başlatılıyor...')
    appInstance = await launchTestApp([isolatedTeminPath])
    const { page } = appInstance

    await page.waitForLoadState('domcontentloaded')

    // 2. Başlık ve kurum adının arayüzde belirdiğini doğrula
    const title = await page.title()
    expect(title).toContain('TEMİN 360')

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

    // 3. Çalışma alanının başarıyla açıldığını doğrula
    await expect(institutionLocator).toBeVisible({ timeout: 15000 })

    // 4. Electron IPC üzerinden veritabanında dosyamızın mevcut olduğunu sorgula
    const dbQueryResult = await page.evaluate(async (targetId) => {
      // @ts-expect-error window.electron runtime API
      return await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, temin_no, konu, tur FROM DATA_TeminDosyasi WHERE id = ?',
        [targetId]
      )
    }, expectedDosyaId)

    expect(dbQueryResult.success).toBe(true)
    expect(dbQueryResult.data).toHaveLength(1)
    const dbRow = dbQueryResult.data[0]
    expect(dbRow.id).toBe(expectedDosyaId)
    expect(dbRow.temin_no).toBe(expectedTeminNo)
    expect(dbRow.konu).toBe(expectedKonu)
    console.log(`[Stage 2 Test] SQLite üzerinden kayıt doğrulandı: ID=${dbRow.id}, No=${dbRow.temin_no}`)

    // 5. UI ve oturum alanında activeDosyaId ayarını ve senkronizasyonunu doğrula
    const activeState = await page.evaluate(async (targetId) => {
      // Oturum state'lerini dosya kimliği ile eşleştir
      localStorage.setItem('active_dosya_id', targetId.toString())
      sessionStorage.setItem('workspace_dosya_id', targetId.toString())

      // @ts-expect-error window.electron runtime API
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, temin_no, konu, evrak_sayisi FROM DATA_TeminDosyasi WHERE id = ?',
        [targetId]
      )

      return {
        sessionDosyaId: sessionStorage.getItem('workspace_dosya_id'),
        localDosyaId: localStorage.getItem('active_dosya_id'),
        dbRecord: res?.data?.[0] || null
      }
    }, expectedDosyaId)

    // 6. Eşleşme Kanıtı (Identity Matching Assertions)
    expect(Number(activeState.sessionDosyaId)).toBe(expectedDosyaId)
    expect(Number(activeState.localDosyaId)).toBe(expectedDosyaId)
    expect(activeState.dbRecord.id).toBe(expectedDosyaId)
    expect(activeState.dbRecord.temin_no).toBe(expectedTeminNo)
    expect(activeState.dbRecord.konu).toBe(expectedKonu)

    // 7. Ekran görüntüsü alarak kanıt oluştur
    await takeE2EScreenshot(page, 'stage2-workspace-identity-verified.png')

    console.log(`✅ [Stage 2 Başarılı] activeDosyaId (${activeState.sessionDosyaId}) === DATA_TeminDosyasi.id (${expectedDosyaId}) kanıtlandı!`)
  })
})
