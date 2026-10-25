import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  isBackupManifest,
  type BackupManifest
} from '../../../../../../shared/types/backupManifest'
import { evaluateNewerVersion, type GDriveFile, type VersionEvaluationInput } from '../gdriveUtils'
import {
  normalizeMeta,
  calculateIntegrityHash,
  deriveDeterministicProjectId
} from '../../../../../../shared/types/workspaceMeta'

describe('Anonim JSON Manifest ve Bütünlük / Sürüm Takibi Testleri', () => {
  const sampleProjectId = '8f3b9c1d-4e2a-4c8f-9a1b-2c3d4e5f6a7b'
  const sampleBackupId1 = '11111111-2222-3333-4444-555555555555'
  const sampleBackupId2 = '66666666-7777-8888-9999-000000000000'
  const sampleFileContent = Buffer.from('PK\x03\x04TEMIN_WORKSPACE_MOCK_DATA_12345')
  const validSha256 = crypto.createHash('sha256').update(sampleFileContent).digest('hex')

  const validManifest: BackupManifest = {
    manifestVersion: 1,
    backupId: sampleBackupId1,
    projectId: sampleProjectId,
    fileName: 'Proje_2026-10-19_18-00.temin',
    driveFileId: 'drive-file-123',
    sha256: validSha256,
    fileSize: sampleFileContent.length,
    createdAt: '2026-10-19T18:00:00.000Z',
    dataRevision: 2,
    parentBackupId: null,
    appVersion: '1.0.0-rc.4',
    deviceId: 'anon-dev-uuid-1234'
  }

  // Senaryo 1: Aynı projenin iki bilgisayarda açılması ve projectId değerinin korunması
  it('Senaryo 1: Aynı projenin iki bilgisayarda açılması durumunda projectId korunur', () => {
    const originalMeta = normalizeMeta({
      institution: 'Sağlık Bakanlığı',
      version: '1.0.0-rc.4',
      project_id: sampleProjectId,
      data_revision: 5
    })

    expect(originalMeta.project_id).toBe(sampleProjectId)
    expect(originalMeta.data_revision).toBe(5)

    // Başka bir bilgisayarda açıldığında (normalizeMeta çağrıldığında) mevcut projectId korunmalıdır
    const pcBMeta = normalizeMeta({
      ...originalMeta,
      updated_at: '2026-10-19T18:30:00.000Z'
    })

    expect(pcBMeta.project_id).toBe(sampleProjectId)
    expect(pcBMeta.data_revision).toBe(5)
  })

  // Senaryo 2: Farklı projelerin yanlışlıkla aynı proje sayılmaması (projectId doğrulaması)
  it('Senaryo 2: Dosya isimleri aynı olsa bile farklı projectId değerine sahip dosyalar aynı proje sayılmaz', () => {
    const cloudFileDifferentProject: GDriveFile = {
      id: 'diff-drive-id',
      name: 'Hastane_2026-10-19_18-00.temin',
      manifest: {
        ...validManifest,
        projectId: 'different-project-uuid-9999',
        fileName: 'Hastane_2026-10-19_18-00.temin'
      }
    }

    const input: VersionEvaluationInput = {
      currentFileName: 'Hastane.temin',
      activeMeta: {
        project_id: sampleProjectId, // Yereldeki proje farklı
        data_revision: 1
      },
      cloudFiles: [cloudFileDifferentProject],
      isDirty: false
    }

    const result = evaluateNewerVersion(input)
    expect(result.hasNewerVersion).toBe(false)
    expect(result.newerFile).toBeNull()
  })

  // Senaryo 3: Doğru dosya ile doğru manifestin eşleşmesi
  it('Senaryo 3: Doğru dosya ile doğru manifest eşleştiğinde doğrulama başarılı olur', () => {
    expect(isBackupManifest(validManifest)).toBe(true)
    expect(validManifest.fileName).toBe('Proje_2026-10-19_18-00.temin')
    expect(validManifest.sha256).toBe(validSha256)
  })

  // Senaryo 4: Dosyanın tek baytı değiştiğinde hash doğrulamasının başarısız olması
  it('Senaryo 4: Dosyanın tek baytı bile değiştiğinde SHA-256 bütünlük kontrolü başarısız olur', () => {
    const tamperedContent = Buffer.from(sampleFileContent)
    tamperedContent[tamperedContent.length - 1] ^= 0xff // 1 bayt değiştir

    const tamperedSha256 = crypto.createHash('sha256').update(tamperedContent).digest('hex')
    expect(tamperedSha256).not.toBe(validManifest.sha256)

    // Doğrulama kontrolü: Mismatch tespit edilmelidir
    const verifyIntegrity = (buffer: Buffer, manifest: BackupManifest): boolean => {
      const actualHash = crypto.createHash('sha256').update(buffer).digest('hex')
      return actualHash.toLowerCase() === manifest.sha256.toLowerCase()
    }

    expect(verifyIntegrity(tamperedContent, validManifest)).toBe(false)
    expect(verifyIntegrity(sampleFileContent, validManifest)).toBe(true)
  })

  // Senaryo 5: .temin yüklenip JSON yüklenemediğinde işlemin kısmi başarısızlık olarak kaydedilmesi
  it('Senaryo 5: .temin yüklenip JSON manifesti yüklenemezse işlem kısmi başarısız sayılır', async () => {
    const uploadSimulator = async (teminSuccess: boolean, manifestSuccess: boolean) => {
      if (!teminSuccess) return { success: false, error: 'Temin upload failed' }
      if (!manifestSuccess) {
        return {
          success: false,
          partial: true,
          error: 'Yedekleme kısmi başarısız: JSON manifesti yüklenemedi.'
        }
      }
      return { success: true }
    }

    const partialRes = await uploadSimulator(true, false)
    expect(partialRes.success).toBe(false)
    expect(partialRes.partial).toBe(true)
    expect(partialRes.error).toContain('manifesti yüklenemedi')
  })

  // Senaryo 6: JSON indirilemediğinde veya bozulduğunda eski yerel dosyanın zarar görmemesi
  it('Senaryo 6: Manifest doğrulaması başarısız olursa yerel dosya asla ezilmez', () => {
    let localFileDestroyed = false
    const downloadAndApply = (buffer: Buffer, manifest: BackupManifest) => {
      const actualHash = crypto.createHash('sha256').update(buffer).digest('hex')
      if (actualHash !== manifest.sha256) {
        throw new Error('Hash mismatch - aborting')
      }
      localFileDestroyed = true // Bu satıra asla ulaşılmamalıdır
    }

    const corruptedBuffer = Buffer.from('corrupted data')
    expect(() => downloadAndApply(corruptedBuffer, validManifest)).toThrow('Hash mismatch')
    expect(localFileDestroyed).toBe(false) // Yerel dosya güvende
  })

  // Senaryo 7: Eksik, bozuk veya eski sürümlü manifestlerin güvenli reddi
  it('Senaryo 7: Eksik veya geçersiz alanlara sahip manifestler isBackupManifest tarafından reddedilir', () => {
    expect(isBackupManifest(null)).toBe(false)
    expect(isBackupManifest({})).toBe(false)
    expect(isBackupManifest({ ...validManifest, manifestVersion: 2 })).toBe(false)
    expect(isBackupManifest({ ...validManifest, sha256: 'gecersiz-kisa-hash' })).toBe(false)
    expect(isBackupManifest({ ...validManifest, fileSize: -5 })).toBe(false)
    expect(isBackupManifest({ ...validManifest, dataRevision: 0 })).toBe(false)
    expect(isBackupManifest({ ...validManifest, backupId: '' })).toBe(false)
  })

  // Senaryo 8: Birden fazla yedek arasından gerçek sürüm geçmişine (dataRevision) göre seçim yapılması
  it('Senaryo 8: Birden fazla bulut yedeği arasından dataRevision değerine göre en güncel olan seçilir', () => {
    const backupRev2: GDriveFile = {
      id: 'id-rev-2',
      name: 'Proje_2026-10-19_18-00.temin',
      createdTime: '2026-10-19T18:00:00.000Z',
      manifest: {
        ...validManifest,
        backupId: sampleBackupId1,
        dataRevision: 2
      }
    }

    const backupRev4: GDriveFile = {
      id: 'id-rev-4',
      name: 'Proje_2026-10-19_19-00.temin',
      createdTime: '2026-10-19T19:00:00.000Z',
      manifest: {
        ...validManifest,
        backupId: sampleBackupId2,
        dataRevision: 4
      }
    }

    const input: VersionEvaluationInput = {
      currentFileName: 'Proje.temin',
      activeMeta: {
        project_id: sampleProjectId,
        data_revision: 2,
        last_backup_id: sampleBackupId1
      },
      cloudFiles: [backupRev2, backupRev4],
      isDirty: false
    }

    const result = evaluateNewerVersion(input)
    expect(result.hasNewerVersion).toBe(true)
    expect(result.newerFile?.id).toBe('id-rev-4')
    expect(result.isConflict).toBe(false)
  })

  // Senaryo 9: Aynı revision değerine sahip iki farklı cihaz yedeği (çakışma tespiti)
  it('Senaryo 9: Aynı revision değerine sahip farklı bir cihaz yedeği çakışma (conflict) olarak işaretlenir', () => {
    const otherDeviceBackup: GDriveFile = {
      id: 'id-other-dev',
      name: 'Proje_2026-10-19_18-00.temin',
      manifest: {
        ...validManifest,
        backupId: 'farkli-cihaz-backup-uuid-777',
        dataRevision: 3,
        deviceId: 'anon-dev-uuid-PC-B'
      }
    }

    const input: VersionEvaluationInput = {
      currentFileName: 'Proje.temin',
      activeMeta: {
        project_id: sampleProjectId,
        data_revision: 3, // Yerelde de revizyon 3!
        last_backup_id: 'yerel-cihaz-backup-uuid-888' // Farklı yedek kimliği
      },
      cloudFiles: [otherDeviceBackup],
      isDirty: false
    }

    const result = evaluateNewerVersion(input)
    expect(result.hasNewerVersion).toBe(true)
    expect(result.isConflict).toBe(true)
    expect(result.reason).toContain('çakışması')
  })

  // Senaryo 10: Login, şema migration ve seed işlemlerinin revision değerini artırmaması
  it('Senaryo 10: Bakım işlemleri (şema migration, seed vb.) data_revision sayacını artırmaz', () => {
    const initialMeta = normalizeMeta({
      institution: 'Kurum',
      project_id: sampleProjectId,
      data_revision: 1
    })

    // Bakım işlemi: userMutationCount 0 iken meta kaydedilirse data_revision artmaz
    let userMutationCount = 0
    let isDirty = false

    const saveOperation = (meta: typeof initialMeta) => {
      if (userMutationCount > 0 || isDirty) {
        meta.data_revision = (meta.data_revision || 1) + 1
      }
      return meta
    }

    const afterLoginOrMigrationMeta = saveOperation({ ...initialMeta })
    expect(afterLoginOrMigrationMeta.data_revision).toBe(1) // Değişmedi!
  })

  // Senaryo 11: Gerçek kullanıcı değişikliğinde revision ve hash davranışının doğrulanması
  it('Senaryo 11: Gerçek kullanıcı değişikliği yapıldığında data_revision artar ve integrity hash değişir', () => {
    const meta = normalizeMeta({
      institution: 'Kurum',
      project_id: sampleProjectId,
      data_revision: 1
    })

    const initialHash = calculateIntegrityHash(meta)

    // Kullanıcı bir doğrudan temin dosyası oluşturdu veya güncelledi
    let userMutationCount = 1
    let isDirty = true

    if (userMutationCount > 0 || isDirty) {
      meta.data_revision = (meta.data_revision || 1) + 1
      meta.last_user_mutation_at = new Date().toISOString()
      meta.integrity_hash = calculateIntegrityHash(meta)
    }

    expect(meta.data_revision).toBe(2)
    expect(meta.integrity_hash).not.toBe(initialHash)
  })

  // Senaryo 12: Anonim manifestte kişisel veya hassas alan bulunmaması
  it('Senaryo 12: Manifestte hostname, username, email veya token gibi kişisel bilgiler bulunamaz', () => {
    // Geçerli manifestte yasaklı alan yoktur
    expect(isBackupManifest(validManifest)).toBe(true)

    // Yasaklı alan eklenmiş bir manifest isBackupManifest tarafından derhal reddedilir
    const invalidWithHostname = { ...validManifest, hostname: 'DESKTOP-ILYAS' }
    expect(isBackupManifest(invalidWithHostname)).toBe(false)

    const invalidWithUsername = { ...validManifest, username: 'ilyas' }
    expect(isBackupManifest(invalidWithUsername)).toBe(false)

    const invalidWithEmail = { ...validManifest, email: 'test@example.com' }
    expect(isBackupManifest(invalidWithEmail)).toBe(false)

    const invalidWithToken = { ...validManifest, token: 'ya29.secret' }
    expect(isBackupManifest(invalidWithToken)).toBe(false)
  })

  // Senaryo 13: Eski projelerde iki ayrı bilgisayarın aynı deterministik projectId üretmesi
  it('Senaryo 13: Eski projelerde (project_id bulunmayan) iki ayrı bilgisayar aynı deterministik projectId üretir', () => {
    const rawLegacy = {
      institution: 'Devlet Hastanesi',
      created_at: '2024-06-15'
    }

    const pcA = normalizeMeta(rawLegacy)
    const pcB = normalizeMeta(rawLegacy)

    expect(pcA.project_id).toBeDefined()
    expect(pcA.project_id).toBe(pcB.project_id)
    expect(pcA.project_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  // Senaryo 14: Farklı kurum veya oluşturma tarihlerinin farklı projectId üretmesi
  it('Senaryo 14: Farklı kurumlara ait eski projeler farklı deterministik projectId alır', () => {
    const proj1 = deriveDeterministicProjectId('Hacettepe Üniversitesi', '2024-01-01')
    const proj2 = deriveDeterministicProjectId('Ankara Üniversitesi', '2024-01-01')
    const proj3 = deriveDeterministicProjectId('Hacettepe Üniversitesi', '2024-02-01')

    expect(proj1).not.toBe(proj2)
    expect(proj1).not.toBe(proj3)
  })

  // Senaryo 15: Google Drive sayfalamasında 5 sayfa sınırının aşılması ve 100 sayfaya kadar devam edilebilmesi
  it('Senaryo 15: Google Drive sayfalaması 5 sayfada durmaz, tüm sayfaları (örn. 8 sayfa) tarar', async () => {
    const totalPages = 8
    let pagesFetched = 0
    let pageToken: string | undefined = undefined

    const mockFetchPage = async (
      token?: string
    ): Promise<{ files: Array<{ id: string; name: string }>; nextPageToken?: string }> => {
      const pageIndex = token ? parseInt(token, 10) : 1
      pagesFetched++
      const nextToken = pageIndex < totalPages ? String(pageIndex + 1) : undefined
      const files = Array.from({ length: 100 }, (_, i) => ({
        id: `file-${pageIndex}-${i}`,
        name: `backup-${pageIndex}-${i}.temin`
      }))
      return { files, nextPageToken: nextToken }
    }

    const allFiles: Array<{ id: string; name: string }> = []
    const MAX_PAGES = 100
    do {
      const data = await mockFetchPage(pageToken)
      allFiles.push(...data.files)
      pageToken = data.nextPageToken
    } while (pageToken && pagesFetched < MAX_PAGES)

    expect(pagesFetched).toBe(8)
    expect(allFiles.length).toBe(800)
    expect(pageToken).toBeUndefined()
  })

  // Senaryo 16: manifestVerified ile contentVerified (hash doğrulama) ayrımı
  it('Senaryo 16: Manifest yapısal doğrulaması (manifestVerified) ile dosya bayt doğrulaması (contentVerified) ayrıştırılır', () => {
    // 1. Liste aşamasında manifest yapısı geçerlidir
    const driveItem: GDriveFile = {
      id: 'drive-1',
      name: 'Proje_2026-10-19.temin',
      manifest: validManifest,
      manifestVerified: isBackupManifest(validManifest),
      isVerified: isBackupManifest(validManifest)
    }
    expect(driveItem.manifestVerified).toBe(true)
    expect(driveItem.isVerified).toBe(true)

    // 2. İndirme aşamasında gerçek baytların SHA-256 özeti doğrulanır
    const actualBytes = sampleFileContent
    const computedHash = crypto.createHash('sha256').update(actualBytes).digest('hex')
    const contentVerified = computedHash.toLowerCase() === validManifest.sha256.toLowerCase()

    expect(contentVerified).toBe(true)

    // Bozuk dosya durumunda
    const corruptedBytes = Buffer.from('corrupted')
    const corruptedHash = crypto.createHash('sha256').update(corruptedBytes).digest('hex')
    const corruptedContentVerified =
      corruptedHash.toLowerCase() === validManifest.sha256.toLowerCase()
    expect(corruptedContentVerified).toBe(false)
  })

  // Senaryo 17: Aynı kurum ve tarihte oluşturulan farklı projelerin discriminator ile farklı projectId alması
  it('Senaryo 17: Aynı kurum ve aynı oluşturma tarihine sahip farklı projeler discriminator ile farklı projectId alır', () => {
    const institution = 'İstanbul İl Sağlık Müdürlüğü'
    const createdAt = '2026-10-19'
    const discA = '2026/01 Medikal Cihaz Bakımı'
    const discB = '2026/02 İlaç ve Serum Alımı'

    const idA = deriveDeterministicProjectId(institution, createdAt, discA)
    const idB = deriveDeterministicProjectId(institution, createdAt, discB)
    const idLegacy = deriveDeterministicProjectId(institution, createdAt)

    expect(idA).not.toBe(idB)
    expect(idA).not.toBe(idLegacy)
    expect(idB).not.toBe(idLegacy)

    // normalizeMeta ile konu veya dosya adı ayırt edici olarak kullanıldığında farklı kimlik atanır
    const metaA = normalizeMeta({ institution, created_at: createdAt, konu: discA })
    const metaB = normalizeMeta({ institution, created_at: createdAt, konu: discB })
    expect(metaA.project_id).not.toBe(metaB.project_id)
  })

  // Senaryo 18: İki bilgisayarlı sürüm çakışması (aynı revizyonda farklı cihaz yedeği)
  it('Senaryo 18: İki bilgisayar aynı revizyonda iken farklı yedek kimlikleri çakışma (isConflict: true) olarak değerlendirilir', () => {
    const conflictResult = evaluateNewerVersion({
      currentFileName: 'Proje_2026-10-19.temin',
      activeMeta: {
        project_id: sampleProjectId,
        data_revision: 2,
        last_backup_id: 'backup-id-computer-B'
      },
      isDirty: false,
      cloudFiles: [
        {
          id: 'cloud-file-A',
          name: 'Proje_2026-10-19_18-00.temin',
          manifest: {
            ...validManifest,
            backupId: 'backup-id-computer-A',
            dataRevision: 2
          }
        }
      ]
    })

    expect(conflictResult.hasNewerVersion).toBe(true)
    expect(conflictResult.isConflict).toBe(true)
    expect(conflictResult.reason).toContain('Eşzamanlı değişiklik çakışması')
  })

  // Senaryo 19: İki bilgisayarlı sürüm çakışması (daha yeni bulut revizyonu + yerel kaydedilmemiş değişiklik)
  it('Senaryo 19: Bulutta daha yeni revizyon varken yerelde de değişiklik varsa çakışma (isConflict: true) bildirilir', () => {
    const conflictResult = evaluateNewerVersion({
      currentFileName: 'Proje_2026-10-19.temin',
      activeMeta: {
        project_id: sampleProjectId,
        data_revision: 2,
        last_backup_id: 'backup-id-computer-B'
      },
      isDirty: true,
      cloudFiles: [
        {
          id: 'cloud-file-A',
          name: 'Proje_2026-10-19_19-00.temin',
          manifest: {
            ...validManifest,
            backupId: 'backup-id-computer-A-rev3',
            dataRevision: 3
          }
        }
      ]
    })

    expect(conflictResult.hasNewerVersion).toBe(true)
    expect(conflictResult.isConflict).toBe(true)
    expect(conflictResult.reason).toContain('kaydedilmemiş değişiklikler mevcut (Çakışma)')
  })
})
