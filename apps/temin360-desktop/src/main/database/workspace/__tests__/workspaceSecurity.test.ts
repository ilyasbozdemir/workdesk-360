// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import AdmZip from 'adm-zip'
import { CURRENT_SCHEMA_VERSION, AuditIntegrityVerifier } from '@dt/database'

vi.mock('better-sqlite3', () => {
  return {
    default: class MockDatabase {
      constructor(dbPath?: string) {
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
          run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue({ cnt: 0 })
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

// Mock Electron shell and app
vi.mock('electron', () => ({
  shell: {
    openPath: vi.fn().mockResolvedValue('')
  },
  app: {
    getPath: vi.fn().mockReturnValue(os.tmpdir()),
    getAppPath: vi.fn().mockReturnValue(os.tmpdir()),
    getVersion: vi.fn().mockReturnValue('1.0.0-test')
  },
  BrowserWindow: vi.fn()
}))

import { workspaceManager } from '../workspaceManager'
import { DtmWorkspace, atomicReplaceWorkspaceFile } from '../DtmWorkspace'

describe('Workspace Security & Path Traversal Protections', () => {
  let testDir: string

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-sec-test-'))
  })

  afterEach(() => {
    try {
      workspaceManager.close()
    } catch {
      /* noop */
    }
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch {
      /* noop */
    }
  })

  describe('workspaceManager.openAttachment path traversal guards', () => {
    it('throws error when no active workspace is open', async () => {
      await expect(workspaceManager.openAttachment('attachments/test.pdf')).rejects.toThrow(
        'Açık bir çalışma dosyası yok.'
      )
    })

    it('rejects empty, non-string, or whitespace-only relative paths', async () => {
      const workspaceFile = path.join(testDir, 'test.temin')
      workspaceManager.create(workspaceFile, 'Test Kurum')

      await expect(workspaceManager.openAttachment('')).rejects.toThrow('Geçersiz ek dosya yolu.')
      await expect(workspaceManager.openAttachment('   ')).rejects.toThrow(
        'Geçersiz ek dosya yolu.'
      )
      await expect(workspaceManager.openAttachment(null as unknown as string)).rejects.toThrow(
        'Geçersiz ek dosya yolu.'
      )
    })

    it('blocks directory traversal attempts attempting to access files outside tempDir', async () => {
      const workspaceFile = path.join(testDir, 'test.temin')
      workspaceManager.create(workspaceFile, 'Test Kurum')

      // Malicious path traversal attempts
      const maliciousPaths = [
        '../outside.txt',
        '../../outside.txt',
        '..\\..\\windows\\system32\\calc.exe',
        'attachments/../../sensitive.txt',
        'attachments/../../../etc/passwd'
      ]

      for (const badPath of maliciousPaths) {
        await expect(workspaceManager.openAttachment(badPath)).rejects.toThrow(
          'Geçersiz dosya yolu (path traversal engellendi).'
        )
      }
    })
  })

  describe('workspaceManager.uploadAttachment input validation', () => {
    it('rejects invalid or non-existent source file paths', () => {
      const workspaceFile = path.join(testDir, 'test.temin')
      workspaceManager.create(workspaceFile, 'Test Kurum')

      expect(() => workspaceManager.uploadAttachment('')).toThrow('Geçersiz kaynak dosya yolu.')
      expect(() => workspaceManager.uploadAttachment('   ')).toThrow('Geçersiz kaynak dosya yolu.')
      expect(() =>
        workspaceManager.uploadAttachment(path.join(testDir, 'non_existent_file.pdf'))
      ).toThrow('Kaynak dosya bulunamadı veya geçerli bir dosya değil.')
    })

    it('safely uploads valid files and generates sanitized filenames', () => {
      const workspaceFile = path.join(testDir, 'test.temin')
      workspaceManager.create(workspaceFile, 'Test Kurum')

      const sampleFile = path.join(testDir, 'şartname & ek [2026].pdf')
      fs.writeFileSync(sampleFile, 'Dummy PDF content')

      const result = workspaceManager.uploadAttachment(sampleFile)
      expect(result).toBeDefined()
      expect(result.relativePath).toMatch(/^attachments\//)
      expect(result.fileName).not.toContain(' ')
      expect(result.fileName).not.toContain('[')
      expect(result.fileName).not.toContain(']')
    })
  })

  describe('DtmWorkspace Zip Slip protection', () => {
    it('detects and rejects zip files with path traversal entries and safely cleans up lock files', () => {
      const maliciousZipPath = path.join(testDir, 'malicious.temin')
      const zip = new AdmZip()
      zip.addFile(
        'meta.json',
        Buffer.from(
          JSON.stringify({
            dtal_version: '1.0',
            schema_version: CURRENT_SCHEMA_VERSION,
            institution: 'Test Kurum'
          })
        )
      )
      zip.addFile('payload.txt', Buffer.from('payload content'))
      // Craft Zip Slip entry
      zip.getEntries()[1].entryName = '../../malicious_file.txt'
      fs.writeFileSync(maliciousZipPath, zip.toBuffer())

      // 1. Verify that the written archive physically contains the traversal entry
      const writtenZip = new AdmZip(maliciousZipPath)
      const zipSlipEntry = writtenZip
        .getEntries()
        .find((e) => e.entryName === '../../malicious_file.txt')
      expect(zipSlipEntry).toBeDefined()
      expect(zipSlipEntry!.entryName).toContain('../')

      // Possible path traversal escape locations
      const escapedInTestDir = path.join(testDir, 'malicious_file.txt')
      const escapedAboveTestDir = path.resolve(testDir, '..', 'malicious_file.txt')
      expect(fs.existsSync(escapedInTestDir)).toBe(false)
      expect(fs.existsSync(escapedAboveTestDir)).toBe(false)

      const lockPath = maliciousZipPath + '.lock'
      const ws = new DtmWorkspace()
      let thrown: Error | null = null
      try {
        ws.openWorkspace(maliciousZipPath)
      } catch (err: unknown) {
        thrown = err as Error
      }

      // 2. Verify opening was rejected with Zip Slip error
      expect(thrown).not.toBeNull()
      expect(thrown?.message).toMatch(/Zip Slip/)

      // 3. Verify no file was written outside the extraction root
      expect(fs.existsSync(escapedInTestDir)).toBe(false)
      expect(fs.existsSync(escapedAboveTestDir)).toBe(false)

      // 4. Verify lock file was cleanly released on error and no stale lock remains
      expect(fs.existsSync(lockPath)).toBe(false)

      // 5. Subsequent open attempt should still detect Zip Slip and NOT fail with a LOCKED error
      let secondError: Error | null = null
      try {
        ws.openWorkspace(maliciousZipPath)
      } catch (err: unknown) {
        secondError = err as Error
      }
      expect(secondError?.message).not.toContain('LOCKED|')
      expect(secondError?.message).toMatch(/Zip Slip/)
      expect(fs.existsSync(lockPath)).toBe(false)

      ws.closeWorkspace()
    })
  })

  describe('Legacy Project ID Migration and Atomic Workspace Saving', () => {
    it('eski projelerde (project_id bulunmayan) ilk açılışta deterministik kimlik atanır ve diskteki arşive kalıcı olarak yazılır', () => {
      const legacyPath = path.join(testDir, 'legacy_project.temin')
      const zip = new AdmZip()
      zip.addFile(
        'meta.json',
        Buffer.from(
          JSON.stringify({
            dtal_version: '1.0',
            schema_version: CURRENT_SCHEMA_VERSION,
            institution: 'Eski Hastane',
            created_at: '2024-03-15'
          })
        )
      )
      zip.addFile('database.sqlite', Buffer.from('SQLite format 3\x00mock_database_data'))
      fs.writeFileSync(legacyPath, zip.toBuffer())

      // 1. İlk bilgisayarda açılış
      const ws1 = new DtmWorkspace()
      const meta1 = ws1.openWorkspace(legacyPath)

      expect(meta1.project_id).toBeDefined()
      expect(meta1.project_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      ws1.closeWorkspace()

      // 2. Diskteki dosyanın fiziksel olarak güncellenmiş ve project_id kaydedilmiş olduğunu doğrula
      const savedZip = new AdmZip(legacyPath)
      const metaEntry = savedZip.getEntry('meta.json')
      expect(metaEntry).not.toBeNull()
      const parsedDiskMeta = JSON.parse(metaEntry!.getData().toString('utf-8'))
      expect(parsedDiskMeta.project_id).toBe(meta1.project_id)

      // 3. İkinci bir bilgisayarda / süreçte açıldığında diskteki kalıcı kimliğin aynen okunması
      const ws2 = new DtmWorkspace()
      const meta2 = ws2.openWorkspace(legacyPath)
      expect(meta2.project_id).toBe(meta1.project_id)
      ws2.closeWorkspace()
    })

    it('atomicReplaceWorkspaceFile hedef dosyayı atomik olarak değiştirir ve geçici dosya bırakmaz', () => {
      const sourceFile = path.join(testDir, 'source.tmp')
      const targetFile = path.join(testDir, 'target.temin')

      fs.writeFileSync(targetFile, 'original-content')
      fs.writeFileSync(sourceFile, 'new-atomic-content')

      atomicReplaceWorkspaceFile(sourceFile, targetFile)

      expect(fs.existsSync(targetFile)).toBe(true)
      expect(fs.readFileSync(targetFile, 'utf-8')).toBe('new-atomic-content')
      expect(fs.existsSync(sourceFile)).toBe(false)

      // .bak temizlenmiş olmalıdır
      const remainingFiles = fs.readdirSync(testDir)
      expect(remainingFiles.filter((f) => f.includes('.bak.')).length).toBe(0)
    })

    it('atomicReplaceWorkspaceFile hata durumunda hedef dosyayı güvenlik kopyasından (.bak) geri yükler', () => {
      const sourceFile = path.join(testDir, 'source-error.tmp')
      const targetFile = path.join(testDir, 'target-protected.temin')

      fs.writeFileSync(targetFile, 'critical-existing-data')
      fs.writeFileSync(sourceFile, 'incoming-data')

      const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => {
        const err = new Error('EACCES: permission denied')
        Object.assign(err, { code: 'EACCES' })
        throw err
      })

      try {
        expect(() => {
          atomicReplaceWorkspaceFile(sourceFile, targetFile, 2)
        }).toThrow(/EACCES/)

        // Hedef dosya asla silinmemiş veya boşaltılmamış olmalıdır
        expect(fs.existsSync(targetFile)).toBe(true)
        expect(fs.readFileSync(targetFile, 'utf-8')).toBe('critical-existing-data')
      } finally {
        renameSpy.mockRestore()
      }
    })
  })

  describe('Farklı Kaydet (saveAs) Güvenlik ve Bütünlük Denetimleri', () => {
    it('temiz (değiştirilmemiş) bir dosyada saveAs çağrıldığında yeni hedef dosya fiziksel olarak diske yazılır', () => {
      const initialPath = path.join(testDir, 'orijinal.temin')
      const targetPath = path.join(testDir, 'farkli_kayit.temin')

      const ws = new DtmWorkspace()
      ws.createWorkspace(initialPath, 'Test Kurum')
      expect(ws.isDirtyState()).toBe(false)
      expect(fs.existsSync(initialPath)).toBe(true)
      expect(fs.existsSync(initialPath + '.lock')).toBe(true)

      // saveAs çağrısı - temiz dosya
      const res = ws.saveAs(targetPath)
      expect(res.success).toBe(true)
      expect(res.newPath).toBe(targetPath)

      // Yeni dosya diskte fiziksel olarak oluşmuş ve geçerli bir zip olmalı
      expect(fs.existsSync(targetPath)).toBe(true)
      expect(fs.statSync(targetPath).size).toBeGreaterThan(0)

      const zip = new AdmZip(targetPath)
      expect(zip.getEntries().some((e) => e.entryName === 'meta.json')).toBe(true)
      expect(zip.getEntries().some((e) => e.entryName.endsWith('.sqlite'))).toBe(true)

      // Aktif dosya yolu yeni yol olmalı
      expect(ws.getCurrentFilePath()).toBe(targetPath)

      // Eski kilit dosyası temizlenmiş, yeni kilit dosyası var olmalı
      expect(fs.existsSync(initialPath + '.lock')).toBe(false)
      expect(fs.existsSync(targetPath + '.lock')).toBe(true)

      ws.closeWorkspace()
      expect(fs.existsSync(targetPath + '.lock')).toBe(false)
    })

    it('hedef dosya uzantısı verilmediğinde otomatik olarak .temin ekler', () => {
      const initialPath = path.join(testDir, 'doc1.temin')
      const targetPathWithoutExt = path.join(testDir, 'doc2_without_ext')
      const expectedTargetPath = `${targetPathWithoutExt}.temin`

      const ws = new DtmWorkspace()
      ws.createWorkspace(initialPath, 'Kurum')

      const res = ws.saveAs(targetPathWithoutExt)
      expect(res.success).toBe(true)
      expect(res.newPath).toBe(expectedTargetPath)
      expect(fs.existsSync(expectedTargetPath)).toBe(true)
      expect(ws.getCurrentFilePath()).toBe(expectedTargetPath)

      ws.closeWorkspace()
    })

    it('kaydetme sırasında hata oluşursa aktif dosya yolu eski konumunda kalır ve yeni kilit temizlenir', () => {
      const initialPath = path.join(testDir, 'doc_rollback.temin')
      const targetPath = path.join(testDir, 'fail_target.temin')

      const ws = new DtmWorkspace()
      ws.createWorkspace(initialPath, 'Kurum')

      // writeWorkspaceArchive çağrısını hata fırlatacak şekilde mockla
      const saveSpy = vi
        .spyOn(
          ws as unknown as Record<string, (...args: unknown[]) => unknown>,
          'writeWorkspaceArchive'
        )
        .mockImplementation(() => {
          throw new Error('Disk full simulation')
        })

      try {
        const res = ws.saveAs(targetPath)
        expect(res.success).toBe(false)
        expect(res.error).toMatch(/Disk full simulation/)

        // Aktif yol eski yola rollback edilmiş olmalı
        expect(ws.getCurrentFilePath()).toBe(initialPath)

        // Yeni oluşturulan kilit temizlenmiş olmalı
        expect(fs.existsSync(targetPath + '.lock')).toBe(false)
      } finally {
        saveSpy.mockRestore()
        ws.closeWorkspace()
      }
    })
  })

  describe('Bütünlük Kontrolü (Startup Shield) ve Salt Okunur / Teftiş Modu', () => {
    it('dosya açılışında blokzincir zinciri kırılmışsa (tahrifat algılanmışsa) dosyayı salt-okunur teftiş modunda açar ve kaydetmeyi kilitler', () => {
      const docPath = path.join(testDir, 'tahrif_edilmis.temin')
      const ws1 = new DtmWorkspace()
      ws1.createWorkspace(docPath, 'Guvenli Kurum')
      ws1.closeWorkspace()

      // AuditIntegrityVerifier.verifyChain'i tahrifat alarmı verecek şekilde spy'lıyoruz
      const verifySpy = vi.spyOn(AuditIntegrityVerifier, 'verifyChain').mockReturnValue({
        isValid: false,
        isFullySealed: true,
        hasPendingUnhashed: false,
        status: 'TAMPERED_CONTENT',
        totalRecords: 10,
        sealedRecords: 10,
        unhashedRecords: 0,
        brokenRecordId: 5,
        error: 'Sistem günlüğü (Audit Log) tahrifatı tespit edildi: Kayıt #5 hash uyumsuzluğu!'
      })

      const ws2 = new DtmWorkspace()
      try {
        const meta = ws2.openWorkspace(docPath)

        // 1. Meta bilgileri kilitli ve tahrif edilmiş olmalı
        expect(meta.is_read_only).toBe(true)
        expect(meta.is_tampered).toBe(true)
        expect(meta.tamper_reason).toContain('Kayıt #5')

        // 2. Workspace getter durumları
        expect(ws2.isReadOnlyState()).toBe(true)
        expect(ws2.isTamperedState()).toBe(true)
        expect(ws2.getSessionStatus()).toEqual({
          isReadOnly: true,
          isTampered: true,
          tamperReason: expect.stringContaining('Kayıt #5')
        })

        // 3. Dosyaya yazma / kaydetme kilitlenmiş olmalı
        expect(() => ws2.saveWorkspace()).toThrow(/teftiş/i)

        // 4. saveAs çağrısı da engellenmeli
        const saveAsResult = ws2.saveAs(path.join(testDir, 'kacak_kopya.temin'))
        expect(saveAsResult.success).toBe(false)
        expect(saveAsResult.error).toMatch(/teftiş/i)
      } finally {
        verifySpy.mockRestore()
        ws2.closeWorkspace()
      }
    })

    it('bütünlük doğrulaması istisna fırlatırsa (Fail-Safe), dosya güvenli kabul edilmez ve salt-okunur teftiş moduna kilitlenir', () => {
      const docPath = path.join(testDir, 'hata_firlatan.temin')
      const ws1 = new DtmWorkspace()
      ws1.createWorkspace(docPath, 'Test Kurum')
      ws1.closeWorkspace()

      const verifySpy = vi.spyOn(AuditIntegrityVerifier, 'verifyChain').mockImplementation(() => {
        throw new Error('SQLite disk I/O veya bozuk log tablosu istisnası!')
      })

      const ws2 = new DtmWorkspace()
      try {
        const meta = ws2.openWorkspace(docPath)

        // Fail-safe: doğrulanamayan dosya kilitli ve salt-okunur olmalıdır
        expect(meta.is_read_only).toBe(true)
        expect(meta.is_tampered).toBe(true)
        expect(meta.tamper_reason).toContain('bütünlük doğrulanamadı')

        expect(ws2.isReadOnlyState()).toBe(true)
        expect(ws2.isTamperedState()).toBe(true)

        expect(() => ws2.saveWorkspace()).toThrow(/teftiş/i)
      } finally {
        verifySpy.mockRestore()
        ws2.closeWorkspace()
      }
    })
  })
})


