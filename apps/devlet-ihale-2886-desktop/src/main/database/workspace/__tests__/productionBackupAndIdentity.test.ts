// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
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
      prepare(sql: string): Record<string, unknown> {
        return {
          run: vi.fn(),
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockImplementation(() => {
            if (sql.includes('quick_check')) {
              if (this.dbPath && fs.existsSync(this.dbPath)) {
                const content = fs.readFileSync(this.dbPath, 'utf-8')
                if (content.includes('CORRUPT_SQLITE')) {
                  return { quick_check: 'database disk image is malformed' }
                }
              }
              return { quick_check: 'ok' }
            }
            return { cnt: 0 }
          })
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
  BrowserWindow: vi.fn()
}))

import {
  deriveDeterministicProjectId,
  normalizeMeta,
  generateUuidV5
} from '../../../../shared/types/workspaceMeta'
import { DtmWorkspace, atomicReplaceWorkspaceFile } from '../DtmWorkspace'
import { verifyAndRestoreBackupBuffer } from '../../../ipc/workspace/gdrive.ipc'
import type { BackupManifest } from '../../../../shared/types/backupManifest'

function createTestManifest(overrides: Partial<BackupManifest> = {}): BackupManifest {
  return {
    manifestVersion: 1,
    backupId: 'backup-uuid-1111',
    projectId: 'project-uuid-2222',
    fileName: 'test_backup.temin',
    driveFileId: 'gdrive-file-id-3333',
    sha256: '0000000000000000000000000000000000000000000000000000000000000000',
    fileSize: 1024,
    createdAt: new Date().toISOString(),
    dataRevision: 1,
    parentBackupId: null,
    appVersion: '1.0.0-test',
    deviceId: 'device-uuid-test',
    ...overrides
  }
}

/**
 * Helper to build a valid minimal .temin archive buffer containing meta.json and database.sqlite.
 * Appends 2048 random bytes so the compressed archive is guaranteed to exceed the 512-byte header guard.
 */
function createValidTeminBuffer(options?: {
  institution?: string
  createdAt?: string
  projectId?: string
  dataRevision?: number
  sqlitePayload?: string
}): { buffer: Buffer; sha256: string; size: number } {
  const zip = new AdmZip()
  const metaObj = {
    dtal_version: '1.0',
    schema_version: CURRENT_SCHEMA_VERSION,
    institution: options?.institution || 'Örnek Hastane',
    created_at: options?.createdAt || '2026-10-19',
    project_id: options?.projectId || '7b399d8b-5776-562a-8cb0-fa06fa70d10b',
    data_revision: options?.dataRevision || 1
  }
  zip.addFile('meta.json', Buffer.from(JSON.stringify(metaObj, null, 2), 'utf-8'))
  const rawPayload = options?.sqlitePayload || 'valid_sqlite_mock_database_page_data_ok'
  const padding = crypto.randomBytes(2048)
  const dbData = Buffer.concat([Buffer.from('SQLite format 3\x00' + rawPayload, 'utf-8'), padding])
  zip.addFile('database.sqlite', dbData)

  const buffer = zip.toBuffer()
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  return { buffer, sha256, size: buffer.length }
}

describe('Temin 360 - Production Identity & Security Test Suite', () => {
  let testDir: string

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-prod-test-'))
  })

  afterEach(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true })
      }
    } catch {
      /* noop */
    }
  })

  describe('1. Proje Kimliği (deriveDeterministicProjectId & normalizeMeta)', () => {
    it('aynı kurum ve tarihte oluşturulan farklı projeler ayırt edici parametre ile farklı projectId alır', () => {
      const institution = 'Ankara Şehir Hastanesi'
      const createdAt = '2026-10-19'
      const discriminator1 = '2026/01 Kırtasiye ve Büro Malzemesi Temini'
      const discriminator2 = '2026/02 Tıbbi Sarf ve Cihaz Bakımı'

      const id1 = deriveDeterministicProjectId(institution, createdAt, discriminator1)
      const id2 = deriveDeterministicProjectId(institution, createdAt, discriminator2)

      expect(id1).not.toBe(id2)
      // Both should be valid UUIDs
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      expect(id2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('aynı kurum, tarih ve ayırt edici ile iki farklı bilgisayarda çalıştırıldığında birebir aynı deterministic projectId üretilir', () => {
      const institution = 'İzmir İl Sağlık Müdürlüğü'
      const createdAt = '2026-05-10'
      const discriminator = 'dosya_izmir_ambulans'

      const idComputerA = deriveDeterministicProjectId(institution, createdAt, discriminator)
      const idComputerB = deriveDeterministicProjectId(institution, createdAt, discriminator)

      expect(idComputerA).toBe(idComputerB)
    })

    it('ayırt edici verilmediğinde eski deterministik algoritma ile %100 geriye dönük uyumlu UUID üretir (mevcut manifestleri bozmaz)', () => {
      const institution = 'Kadıköy Belediyesi'
      const createdAt = '2024-01-15'

      const legacyExpected = deriveDeterministicProjectId(institution, createdAt)
      const legacyWithoutDisc = deriveDeterministicProjectId(institution, createdAt, undefined)
      const legacyEmptyDisc = deriveDeterministicProjectId(institution, createdAt, '   ')

      expect(legacyWithoutDisc).toBe(legacyExpected)
      expect(legacyEmptyDisc).toBe(legacyExpected)
    })

    it('RFC 4122 Bölüm 4.3 UUID v5 standart vektör doğrulaması (SHA-1 tabanlı standart)', () => {
      // RFC 4122 Resmi Test Vektörü:
      // DNS Namespace: 6ba7b810-9dad-11d1-80b4-00c04fd430c8, Name: "python.org"
      // Beklenen UUID v5: 886313e1-3b8a-5372-9b90-0c9aee199e5d
      const rfcNamespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      const computed = generateUuidV5('python.org', rfcNamespace)
      expect(computed).toBe('886313e1-3b8a-5372-9b90-0c9aee199e5d')
    })

    it('eski .temin dosyası iki bağımsız bilgisayarda farklı klasör ve farklı dosya adlarıyla açılsa dahi dosya adından bağımsız olarak birebir aynı UUID v5 üretir ve kalıcı olarak kaydeder', () => {
      // Bilgisayar A ve Bilgisayar B simülasyonu:
      // İki bağımsız dizin, iki farklı dosya adı ("proje_a.temin" vs "yedek_dosya_b.temin")
      const compADir = path.join(testDir, 'computer_a')
      const compBDir = path.join(testDir, 'computer_b')
      fs.mkdirSync(compADir, { recursive: true })
      fs.mkdirSync(compBDir, { recursive: true })

      const fileCompA = path.join(compADir, 'ihale_2024_01.temin')
      const fileCompB = path.join(compBDir, 'farkli_adlandirilmis_kopya_2024.temin')

      // Eski sürümden kalma .temin arşivi oluştur (içinde project_id ALANI YOK)
      const legacyZip = new AdmZip()
      legacyZip.addFile(
        'meta.json',
        Buffer.from(
          JSON.stringify({
            dtal_version: '1.0',
            schema_version: 45,
            institution: 'Kayseri Şehir Hastanesi',
            created_at: '2024-03-12'
            // project_id kasıtlı olarak yok
          }),
          'utf-8'
        )
      )
      legacyZip.addFile('database.sqlite', Buffer.from('SQLite format 3\x00legacy_sqlite_content'))
      const legacyBuffer = legacyZip.toBuffer()

      // Her iki bilgisayara da aynı dosya kopyalanır
      fs.writeFileSync(fileCompA, legacyBuffer)
      fs.writeFileSync(fileCompB, legacyBuffer)

      // Bilgisayar A'da DtmWorkspace açılır
      const wsA = new DtmWorkspace()
      const metaA = wsA.openWorkspace(fileCompA)
      wsA.closeWorkspace()

      // Bilgisayar B'de DtmWorkspace açılır
      const wsB = new DtmWorkspace()
      const metaB = wsB.openWorkspace(fileCompB)
      wsB.closeWorkspace()

      // 1. Her iki bilgisayarda da üretilen kimlik BİREBİR AYNI olmalıdır (dosya adı farklı olmasına rağmen!)
      expect(metaA.project_id).toBeDefined()
      expect(metaB.project_id).toBeDefined()
      expect(metaA.project_id).toBe(metaB.project_id)
      expect(metaA.project_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )

      // 2. Açılma sonrasında project_id her iki dosyanın meta.json'ına kalıcı olarak yazılmış olmalıdır
      const zipA = new AdmZip(fileCompA)
      const persistedMetaA = JSON.parse(zipA.readAsText('meta.json'))
      expect(persistedMetaA.project_id).toBe(metaA.project_id)

      const zipB = new AdmZip(fileCompB)
      const persistedMetaB = JSON.parse(zipB.readAsText('meta.json'))
      expect(persistedMetaB.project_id).toBe(metaB.project_id)
    })

    it('normalizeMeta mevcut project_id değerini korur ve değiştirmeden döndürür', () => {
      const existingUuid = '9e8d7c6b-5a4b-4c3d-8e1f-2a3b4c5d6e7f'
      const meta = normalizeMeta(
        {
          dtal_version: '1.0',
          schema_version: 45,
          institution: 'Eski Kurum',
          created_at: '2024-01-01',
          project_id: existingUuid
        },
        'farkli_ayirt_edici'
      )

      expect(meta.project_id).toBe(existingUuid)
    })

    it('yeni oluşturulan projeler kalıcı ve rastgele UUID v4 kimliğini korur', () => {
      const workspaceFile = path.join(testDir, 'yeni_proje.temin')
      const ws = new DtmWorkspace()
      const createdMeta = ws.createWorkspace(workspaceFile, 'Yeni Devlet Hastanesi')

      expect(createdMeta.project_id).toBeDefined()
      // UUID v4 format check
      expect(createdMeta.project_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      ws.closeWorkspace()

      // Yeniden açıldığında aynı UUID okunmalıdır
      const wsReopened = new DtmWorkspace()
      const reopenedMeta = wsReopened.openWorkspace(workspaceFile)
      expect(reopenedMeta.project_id).toBe(createdMeta.project_id)
      wsReopened.closeWorkspace()
    })
  })

  describe('2. atomicReplaceWorkspaceFile Hata Yolları ve Güvenlik Yedeği Koruması', () => {
    it('başarılı değiştirme: kaynak dosyayı hedefe taşır, hedef içeriği günceller ve geçici dosyaları temizler', () => {
      const sourceFile = path.join(testDir, 'yeni_veri.tmp')
      const targetFile = path.join(testDir, 'hedef_calisma.temin')

      fs.writeFileSync(targetFile, 'eski_veriler')
      fs.writeFileSync(sourceFile, 'yeni_guncel_veriler')

      atomicReplaceWorkspaceFile(sourceFile, targetFile)

      expect(fs.existsSync(targetFile)).toBe(true)
      expect(fs.readFileSync(targetFile, 'utf-8')).toBe('yeni_guncel_veriler')
      expect(fs.existsSync(sourceFile)).toBe(false)
    })

    it('hata enjeksiyonu: renameSync EACCES/EPERM hatası verince yeniden dener; hata devam ederse hedef dosyayı ve güvenlik kopyasını (.bak) korur', () => {
      const sourceFile = path.join(testDir, 'gecici_kaynak.tmp')
      const targetFile = path.join(testDir, 'kritik_hedef.temin')

      fs.writeFileSync(targetFile, 'orijinal_korunmasi_gereken_veri')
      fs.writeFileSync(sourceFile, 'hatali_yeni_veri')

      const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation(() => {
        const err = new Error('EPERM: operation not permitted, rename')
        Object.assign(err, { code: 'EPERM' })
        throw err
      })

      try {
        expect(() => {
          atomicReplaceWorkspaceFile(sourceFile, targetFile, 2)
        }).toThrow(/EPERM/)

        // 1. Hedef dosya asla zarar görmemiş olmalıdır
        expect(fs.existsSync(targetFile)).toBe(true)
        expect(fs.readFileSync(targetFile, 'utf-8')).toBe('orijinal_korunmasi_gereken_veri')

        // 2. Güvenlik yedeği (.bak) diskte korunmuş olmalıdır
        const files = fs.readdirSync(testDir)
        const bakFile = files.find((f) => f.includes('.bak.'))
        expect(bakFile).toBeDefined()
        const bakContent = fs.readFileSync(path.join(testDir, bakFile!), 'utf-8')
        expect(bakContent).toBe('orijinal_korunmasi_gereken_veri')
      } finally {
        renameSpy.mockRestore()
      }
    })

    it('hata enjeksiyonu: güvenlik kopyası (.bak) oluşturulamadığında işlem derhal durdurulur ve hedef dosya asla değiştirilmez', () => {
      const sourceFile = path.join(testDir, 'kaynak.tmp')
      const targetFile = path.join(testDir, 'hedef.temin')

      fs.writeFileSync(targetFile, 'dokunulmaz_veri')
      fs.writeFileSync(sourceFile, 'yeni_veri')

      const copySpy = vi.spyOn(fs, 'copyFileSync').mockImplementation(() => {
        throw new Error('Disk doldu veya yazma korumalı')
      })

      try {
        expect(() => {
          atomicReplaceWorkspaceFile(sourceFile, targetFile)
        }).toThrow(/Hedef dosya için güvenlik yedeği alınamadı/)

        // Hedef dosya ve içeriği tamamen korunmuş olmalıdır
        expect(fs.existsSync(targetFile)).toBe(true)
        expect(fs.readFileSync(targetFile, 'utf-8')).toBe('dokunulmaz_veri')
      } finally {
        copySpy.mockRestore()
      }
    })

    it('fallback hata enjeksiyonu ve kurtarma: hedef dosya .old adına taşındıktan sonra kaynak taşıması çökerse, .old dosyası otomatik olarak hedefe geri yüklenir', () => {
      const sourceFile = path.join(testDir, 'kaynak_fallback_test.tmp')
      const targetFile = path.join(testDir, 'hedef_fallback_test.temin')

      fs.writeFileSync(targetFile, 'orijinal_kurtarilacak_dosya_icerigi')
      fs.writeFileSync(sourceFile, 'yeni_eklenmek_istenen_veri')

      const realRename = fs.renameSync

      // 1. Doğrudan yeniden adlandırma (1. ve 2. denemeler) EPERM versin -> fallback tetiklensin
      // 2. Fallback'te targetFile -> destOldTmp BAŞARILI olsun
      // 3. Fallback'te sourceFile -> targetFile ÇÖKSÜN
      const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation((oldPath, newPath) => {
        if (oldPath === sourceFile && newPath === targetFile) {
          const err = new Error('EPERM: Windows file lock on target')
          Object.assign(err, { code: 'EPERM' })
          throw err
        }
        return realRename(oldPath, newPath)
      })

      try {
        expect(() => {
          atomicReplaceWorkspaceFile(sourceFile, targetFile, 2)
        }).toThrow(/Dosya atomik olarak değiştirilemedi/)

        // Kurtarma doğrulaması:
        // Çöküş anında .old kopyası hedef yola geri getirilmiş olmalıdır!
        expect(fs.existsSync(targetFile)).toBe(true)
        expect(fs.readFileSync(targetFile, 'utf-8')).toBe('orijinal_kurtarilacak_dosya_icerigi')

        // Ayrıca güvenlik kopyası (.bak) da diskte sağlam durmalıdır
        const files = fs.readdirSync(testDir)
        const bakFile = files.find((f) => f.includes('.hedef_fallback_test.temin.bak.'))
        expect(bakFile).toBeDefined()
        expect(fs.readFileSync(path.join(testDir, bakFile!), 'utf-8')).toBe(
          'orijinal_kurtarilacak_dosya_icerigi'
        )
      } finally {
        renameSpy.mockRestore()
      }
    })
  })

  describe('3. verifyAndRestoreBackupBuffer Üretim Fonksiyonu Doğrulamaları', () => {
    it('bozuk ZIP / 0 byte: ZIP başlığı veya minimum uzunluk eksikse hedef dosyaya dokunmadan hata fırlatır', () => {
      const targetFile = path.join(testDir, 'yerel_aktif.temin')
      fs.writeFileSync(targetFile, 'korunan_yerel_veri')

      const corruptBuffer = Buffer.from('bozuk_0_byte_olmayan_ama_zip_olmayan_veri')

      expect(() => {
        verifyAndRestoreBackupBuffer(corruptBuffer, {
          fileName: 'bozuk.temin',
          destinationPath: targetFile
        })
      }).toThrow(/Güvenlik Hatası: İndirilen dosya geçerli bir TEMİN 360 arşivi değil/)

      // Yerel hedef dosya tamamen değişmeden korunmalıdır
      expect(fs.readFileSync(targetFile, 'utf-8')).toBe('korunan_yerel_veri')
    })

    it('hash uyuşmazlığı: manifest SHA-256 özeti eşleşmediğinde hedef dosya değiştirilmeden önce işlemi iptal eder', () => {
      const targetFile = path.join(testDir, 'yerel_aktif.temin')
      fs.writeFileSync(targetFile, 'korunan_yerel_veri')

      const { buffer } = createValidTeminBuffer()
      const fakeManifest = createTestManifest({
        fileName: 'yedek.temin',
        sha256: '0000000000000000000000000000000000000000000000000000000000000000',
        fileSize: buffer.length
      })

      expect(() => {
        verifyAndRestoreBackupBuffer(buffer, {
          fileName: 'yedek.temin',
          targetManifest: fakeManifest,
          destinationPath: targetFile
        })
      }).toThrow(/Güvenlik ve Bütünlük Hatası: İndirilen yedeğin SHA-256 özeti/)

      // Hedef dosya değişmemelidir
      expect(fs.readFileSync(targetFile, 'utf-8')).toBe('korunan_yerel_veri')
    })

    it('boyut uyuşmazlığı: manifest fileSize değeri buffer uzunluğu ile uyuşmadığında hedef dosyaya dokunulmadan reddedilir', () => {
      const targetFile = path.join(testDir, 'yerel_aktif.temin')
      fs.writeFileSync(targetFile, 'korunan_yerel_veri')

      const { buffer, sha256 } = createValidTeminBuffer()
      const fakeManifest = createTestManifest({
        fileName: 'yedek.temin',
        sha256: sha256,
        fileSize: buffer.length + 500 // Uyuşmayan boyut
      })

      expect(() => {
        verifyAndRestoreBackupBuffer(buffer, {
          fileName: 'yedek.temin',
          targetManifest: fakeManifest,
          destinationPath: targetFile
        })
      }).toThrow(/Güvenlik ve Bütünlük Hatası: İndirilen dosya boyutu/)

      expect(fs.readFileSync(targetFile, 'utf-8')).toBe('korunan_yerel_veri')
    })

    it('eksik ZIP yapısı: meta.json veya .sqlite bulunmayan ZIP arşivi reddedilir', () => {
      const zip = new AdmZip()
      zip.addFile('alakasiz_dosya.txt', crypto.randomBytes(2048))
      const incompleteBuffer = zip.toBuffer()

      expect(() => {
        verifyAndRestoreBackupBuffer(incompleteBuffer, {
          fileName: 'eksik.temin',
          destinationPath: path.join(testDir, 'cikti.temin')
        })
      }).toThrow(/zorunlu dosyalar \(meta.json veya database.sqlite\) eksik/)
    })

    it('bozuk SQLite veritabanı: PRAGMA quick_check başarısız olduğunda işlem durdurulur ve hedef dosya korunur', () => {
      const targetFile = path.join(testDir, 'yerel_aktif.temin')
      fs.writeFileSync(targetFile, 'korunan_yerel_veri')

      const { buffer } = createValidTeminBuffer({
        sqlitePayload: 'CORRUPT_SQLITE_PAYLOAD'
      })

      expect(() => {
        verifyAndRestoreBackupBuffer(buffer, {
          fileName: 'bozuk_sqlite.temin',
          destinationPath: targetFile
        })
      }).toThrow(/İndirilen veritabanı bütünlük testinden geçemedi/)

      expect(fs.readFileSync(targetFile, 'utf-8')).toBe('korunan_yerel_veri')
    })

    it('güvenlik kopyası (.bak) oluşturulamadığında aktif dosya üzerine yazma işlemi derhal durdurulur', () => {
      const currentPath = path.join(testDir, 'aktif_dosya.temin')
      fs.writeFileSync(currentPath, 'aktif_orijinal_veri')

      const { buffer, sha256, size } = createValidTeminBuffer()
      const manifest = createTestManifest({
        fileName: 'aktif_dosya.temin',
        sha256,
        fileSize: size
      })

      // Güvenlik kopyası oluşturulurken copyFileSync hata fırlatacak
      const copySpy = vi.spyOn(fs, 'copyFileSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied for .bak')
      })

      try {
        expect(() => {
          verifyAndRestoreBackupBuffer(buffer, {
            fileName: 'aktif_dosya.temin',
            targetManifest: manifest,
            overwriteActive: true,
            currentPath
          })
        }).toThrow(
          /Kritik Güvenlik Uyarısı: Mevcut çalışma alanının güvenlik kopyası \(\.bak\) oluşturulamadı/
        )

        expect(fs.readFileSync(currentPath, 'utf-8')).toBe('aktif_orijinal_veri')
      } finally {
        copySpy.mockRestore()
      }
    })

    it('geçerli tampon ve manifest ile başarılı geri yükleme ve doğrulama bayrakları', () => {
      const { buffer, sha256, size } = createValidTeminBuffer()
      const manifest = createTestManifest({
        fileName: 'indirilen.temin',
        sha256,
        fileSize: size
      })

      const destFile = path.join(testDir, 'hedef_yeni.temin')
      const result = verifyAndRestoreBackupBuffer(buffer, {
        fileName: 'indirilen.temin',
        targetManifest: manifest,
        destinationPath: destFile
      })

      expect(result.success).toBe(true)
      expect(result.verifiedSha256).toBe(true)
      expect(result.verifiedSize).toBe(true)
      expect(result.contentVerified).toBe(true)
      expect(fs.existsSync(destFile)).toBe(true)
    })
  })
})
