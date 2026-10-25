// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import AdmZip from 'adm-zip'
import { CURRENT_SCHEMA_VERSION } from '@dt/database'

vi.mock('better-sqlite3', () => {
  return {
    default: class MockDatabase {
      dbPath?: string
      constructor(dbPath?: string) {
        this.dbPath = dbPath
        if (dbPath && typeof dbPath === 'string' && !fs.existsSync(dbPath)) {
          try {
            fs.writeFileSync(dbPath, 'SQLite format 3\x00mock_database_content')
          } catch {
            /* noop */
          }
        }
      }
      prepare(): Record<string, unknown> {
        return {
          run: vi.fn(),
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue({ cnt: 0, data_version: 1 })
        }
      }
      transaction<T>(fn: T): T {
        return fn
      }
      exec(): void {
        /* noop */
      }
      pragma(): void {
        /* noop */
      }
      close(): void {
        /* noop */
      }
    }
  }
})

// Mock Electron modules
vi.mock('electron', () => ({
  shell: {
    openPath: vi.fn().mockResolvedValue('')
  },
  app: {
    getPath: vi.fn().mockReturnValue(os.tmpdir()),
    getAppPath: vi.fn().mockReturnValue(os.tmpdir()),
    getVersion: vi.fn().mockReturnValue('1.0.0-test')
  },
  BrowserWindow: vi.fn(),
  dialog: {
    showSaveDialog: vi.fn()
  }
}))

import { workspaceManager } from '../workspaceManager'
import { atomicReplaceWorkspaceFile } from '../DtmWorkspace'

describe('DtmWorkspace.saveAs (Farklı Kaydet) Kapsamlı Regresyon Test Paketi', () => {
  let testDir: string

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-saveas-test-'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    try {
      workspaceManager.close()
    } catch {
      /* ignore */
    }
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch {
      /* ignore */
    }
  })

  it('1. Temiz çalışma alanı: değişiklik yapılmadan Farklı Kaydet yeni dosyayı fiziksel olarak oluşturmalıdır', () => {
    const originalFile = path.join(testDir, 'orijinal.ihale')
    workspaceManager.create(originalFile, 'Temiz Test Kurum')

    expect(fs.existsSync(originalFile)).toBe(true)
    expect(workspaceManager.isDirty()).toBe(false)
    expect(fs.existsSync(originalFile + '.lock')).toBe(true)

    const targetFile = path.join(testDir, 'farkli_kayit.ihale')
    const result = workspaceManager.saveAs(targetFile)

    expect(result.success).toBe(true)
    expect(result.newPath).toBe(path.resolve(targetFile))

    // Yeni dosya diskte fiziksel olarak oluşmuş ve dolu olmalıdır
    expect(fs.existsSync(targetFile)).toBe(true)
    expect(fs.statSync(targetFile).size).toBeGreaterThan(0)

    // Yeni dosya geçerli bir zip arşivi olmalı ve meta.json ile sqlite içermelidir
    const zip = new AdmZip(targetFile)
    const entries = zip.getEntries()
    expect(entries.some((e) => e.entryName === 'meta.json')).toBe(true)
    expect(entries.some((e) => e.entryName.endsWith('.sqlite'))).toBe(true)

    // Aktif dosya yolu yeni dosyaya güncellenmiş olmalıdır
    expect(workspaceManager.getCurrentFilePath()).toBe(path.resolve(targetFile))

    // Kilit yönetimi: Eski dosyanın kilidi kaldırılmış, yeni dosyanın kilidi oluşturulmuş olmalıdır
    expect(fs.existsSync(originalFile + '.lock')).toBe(false)
    expect(fs.existsSync(targetFile + '.lock')).toBe(true)
  })

  it('2. Değiştirilmiş çalışma alanı: veri değiştirildiğinde Farklı Kaydet değişiklikleri yeni dosyaya aktarmalıdır', () => {
    const originalFile = path.join(testDir, 'degistirilen_orijinal.ihale')
    workspaceManager.create(originalFile, 'Değiştirilmiş Kurum')

    // Değişiklik simülasyonu
    workspaceManager.recordMutation('DATA_TeminDosyasi', 'update', 2)
    expect(workspaceManager.isDirty()).toBe(true)

    const targetFile = path.join(testDir, 'yeni_degistirilmis.ihale')
    const result = workspaceManager.saveAs(targetFile)

    expect(result.success).toBe(true)
    expect(fs.existsSync(targetFile)).toBe(true)
    expect(fs.statSync(targetFile).size).toBeGreaterThan(0)

    // Farklı kaydetme sonrası yeni çalışma alanı temiz (dirty: false) duruma geçmelidir
    expect(workspaceManager.isDirty()).toBe(false)
    expect(workspaceManager.getCurrentFilePath()).toBe(path.resolve(targetFile))
  })

  it('3. Hatalı veya ulaşılamayan hedefte işlem başarısız olmalı ve eski çalışma alanı korunmalıdır', () => {
    const originalFile = path.join(testDir, 'guvenli_orijinal.ihale')
    workspaceManager.create(originalFile, 'Korumalı Kurum')

    const originalLock = originalFile + '.lock'
    expect(fs.existsSync(originalLock)).toBe(true)

    // Var olmayan bir alt klasör hedefi
    const invalidTarget = path.join(testDir, 'olmayan_alt_klasor', 'derin', 'hedef.ihale')
    const result = workspaceManager.saveAs(invalidTarget)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()

    // Aktif yol değişmemeli, eski dosya kalmalıdır
    expect(workspaceManager.getCurrentFilePath()).toBe(path.resolve(originalFile))
    // Eski kilit dosyası korunmalıdır
    expect(fs.existsSync(originalLock)).toBe(true)
    // Geçersiz hedefte kilit kalmamalıdır
    expect(fs.existsSync(invalidTarget + '.lock')).toBe(false)
  })

  it('4. Uzantı normalizasyonu: .ihale uzantısı olmayan hedeflere otomatik olarak .ihale eklenmelidir', () => {
    const originalFile = path.join(testDir, 'uzanti_test.ihale')
    workspaceManager.create(originalFile, 'Uzanti Test')

    const targetWithoutExt = path.join(testDir, 'uzantisiz_proje')
    const result = workspaceManager.saveAs(targetWithoutExt)

    expect(result.success).toBe(true)
    expect(result.newPath).toBe(path.resolve(targetWithoutExt + '.ihale'))
    expect(fs.existsSync(targetWithoutExt + '.ihale')).toBe(true)
    expect(workspaceManager.getCurrentFilePath()).toBe(path.resolve(targetWithoutExt + '.ihale'))
  })

  it('5. Kilit yönetimi: başka bir aktif uygulama tarafından kilitli olan hedefe kayıt engellenmelidir', () => {
    const originalFile = path.join(testDir, 'kilit_orijinal.ihale')
    workspaceManager.create(originalFile, 'Kilit Kurum')

    const lockedTarget = path.join(testDir, 'baskasi_kilitledi.ihale')
    const foreignPid = 88888
    const foreignLock = lockedTarget + '.lock'
    fs.writeFileSync(foreignLock, foreignPid.toString(), { encoding: 'utf-8' })

    // process.kill spy'layarak foreignPid'nin çalıştığını simüle et
    vi.spyOn(process, 'kill').mockImplementation((pid: number, signal?: string | number) => {
      if (pid === foreignPid && (signal === 0 || signal === undefined)) {
        return true
      }
      throw new Error('ESRCH')
    })

    const result = workspaceManager.saveAs(lockedTarget)
    expect(result.success).toBe(false)
    expect(result.error).toContain('LOCKED|')

    // Aktif dosya yolu eski dosyada kalmalıdır
    expect(workspaceManager.getCurrentFilePath()).toBe(path.resolve(originalFile))
    // Orijinal kilit korunmalıdır
    expect(fs.existsSync(originalFile + '.lock')).toBe(true)
  })

  it('6. Bayat (stale) kilit yönetimi: kapanmış process kilidi temizlenerek işlem başarıyla tamamlanmalıdır', () => {
    const originalFile = path.join(testDir, 'stale_orijinal.ihale')
    workspaceManager.create(originalFile, 'Stale Kurum')

    const staleTarget = path.join(testDir, 'stale_hedef.ihale')
    const deadPid = 99999
    const staleLock = staleTarget + '.lock'
    fs.writeFileSync(staleLock, deadPid.toString(), { encoding: 'utf-8' })

    // process.kill spy'layarak deadPid'nin artık çalışmadığını (ESRCH) simüle et
    vi.spyOn(process, 'kill').mockImplementation((pid: number) => {
      if (pid === deadPid) {
        throw new Error('ESRCH')
      }
      return true
    })

    const result = workspaceManager.saveAs(staleTarget)
    expect(result.success).toBe(true)
    expect(fs.existsSync(staleTarget)).toBe(true)
    // Yeni kilit bizim process'imiz tarafından alınmış olmalıdır
    const newLockPid = fs.readFileSync(staleLock, 'utf-8').trim()
    expect(newLockPid).toBe(process.pid.toString())
  })

  it('7. IPC katmanı başarısızlık kontrolü: açık dosya yokken saveAs hata döndürmelidir', () => {
    workspaceManager.close()
    const result = workspaceManager.saveAs(path.join(testDir, 'hedef.ihale'))

    expect(result.success).toBe(false)
    expect(result.error).toBe('Açık bir çalışma alanı yok.')
  })

  it('8. Kapatıp yeniden açma: Farklı Kaydet sonrası dosya kapatılıp yeniden açılabilmelidir', () => {
    const originalFile = path.join(testDir, 'dongu_orijinal.ihale')
    workspaceManager.create(originalFile, 'Döngü Kurumu')

    const targetFile = path.join(testDir, 'dongu_yeni.ihale')
    const saveResult = workspaceManager.saveAs(targetFile)
    expect(saveResult.success).toBe(true)

    // Çalışma alanını tamamen kapat
    workspaceManager.close()
    expect(workspaceManager.isOpen()).toBe(false)
    expect(fs.existsSync(targetFile + '.lock')).toBe(false)

    // Yeni dosyayı yeniden aç
    const openMeta = workspaceManager.open(targetFile)
    expect(openMeta).toBeDefined()
    expect(openMeta.schema_version).toBe(CURRENT_SCHEMA_VERSION)
    expect(workspaceManager.getCurrentFilePath()).toBe(path.resolve(targetFile))
    expect(fs.existsSync(targetFile + '.lock')).toBe(true)
  })

  it('9. atomicReplaceWorkspaceFile: doğrulama başarısız olduğunda orijinal dosya güvenlik yedeğinden geri yüklenmelidir', () => {
    const destFile = path.join(testDir, 'orijinal_korunacak.txt')
    const sourceFile = path.join(testDir, 'bozuk_yeni.txt')

    const originalContent = 'ORIJINAL_COK_DEGERLI_ICERIK_12345'
    fs.writeFileSync(destFile, originalContent, 'utf-8')
    fs.writeFileSync(sourceFile, 'YENI_BOZUK_ICERIK', 'utf-8')

    // postReplaceValidate fırlatıldığında
    expect(() => {
      atomicReplaceWorkspaceFile(sourceFile, destFile, 3, () => {
        throw new Error('Arşiv bütünlük kontrolü simüle edilmiş hata')
      })
    }).toThrow('Hedef dosya doğrulanamadı ve orijinal dosya güvenlik yedeğinden geri yüklendi')

    // destFile orijinal içeriği ile sağlam durmalıdır
    expect(fs.existsSync(destFile)).toBe(true)
    expect(fs.readFileSync(destFile, 'utf-8')).toBe(originalContent)

    // Dizin içinde yetim yedek dosyası (.bak) kalmamış olmalıdır
    const files = fs.readdirSync(testDir)
    const backupFiles = files.filter((f) => f.includes('.bak.'))
    expect(backupFiles.length).toBe(0)
  })

  it('10. atomicReplaceWorkspaceFile: geri yükleme (restore) aşaması da hata verirse güvenlik yedeği KORUNMALI ve kritik hata bildirilmelidir', () => {
    const destFile = path.join(testDir, 'restore_fail_orijinal.txt')
    const sourceFile = path.join(testDir, 'restore_fail_yeni.txt')

    const originalContent = 'KAYBEDILMEMESI_GEREKEN_VERI'
    fs.writeFileSync(destFile, originalContent, 'utf-8')
    fs.writeFileSync(sourceFile, 'YENI_VERI', 'utf-8')

    // fs.copyFileSync mock'layarak restore anında hata vermesini sağla
    const originalCopyFileSync = fs.copyFileSync
    const copySpy = vi.spyOn(fs, 'copyFileSync').mockImplementation((src, dst, flags) => {
      // Sadece .bak dosyasından geri yükleme çağrısında hata fırlat
      if (typeof src === 'string' && src.includes('.bak.')) {
        throw new Error('Disk doldu veya ağ bağlantısı koptu (EIO)')
      }
      return originalCopyFileSync(src, dst, flags)
    })

    expect(() => {
      atomicReplaceWorkspaceFile(sourceFile, destFile, 3, () => {
        throw new Error('Doğrulama başarısız')
      })
    }).toThrow(
      'KRİTİK HATA: Hedef dosya doğrulanamadı ve güvenlik yedeğinden geri yüklenirken hata oluştu'
    )

    // Yedek (.bak) dosyası KESİNLİKLE silinmemiş olmalı ve diskte korunmalıdır!
    const files = fs.readdirSync(testDir)
    const backupFiles = files.filter((f) => f.includes('.bak.'))
    expect(backupFiles.length).toBe(1)
    expect(fs.readFileSync(path.join(testDir, backupFiles[0]), 'utf-8')).toBe(originalContent)

    copySpy.mockRestore()
  })
})
