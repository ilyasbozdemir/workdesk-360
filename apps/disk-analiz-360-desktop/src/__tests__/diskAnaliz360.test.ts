import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { DiskAnalyzerStorage } from '../main/modules/storage.js'
import { runDiskScan } from '../main/modules/scanner.js'
import { runDuplicateDetectionPipeline } from '../main/modules/duplicate-detector.js'
import { executeSafeTrashCleanup, isProtectedSystemPath } from '../main/modules/cleanup.js'
import { buildBreadcrumbs, computeTreemapLayout } from '../shared/treemapLayout.js'

describe('Disk Analiz 360 — Kapsamlı Tarama, 3 Aşamalı Hash, Treemap ve Güvenli Temizlik Testleri', () => {
  let tempRoot: string
  let dbPath: string
  let storage: DiskAnalyzerStorage

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'disk-analiz-360-test-'))
    dbPath = path.join(tempRoot, '..', `index-${Date.now()}-${Math.random().toString(36).slice(2)}.db`)
    storage = new DiskAnalyzerStorage(dbPath)
  })

  afterEach(() => {
    try {
      storage.close()
    } catch {
      // ignore
    }
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`)
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`)
    } catch {
      // ignore
    }
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it('1. Boş klasör ve sıfır baytlık dosyaları hatasız taramalı ve sıfır baytları mükerrer saymamalıdır', async () => {
    const emptySubDir = path.join(tempRoot, 'BosKlasor')
    fs.mkdirSync(emptySubDir, { recursive: true })
    fs.writeFileSync(path.join(tempRoot, 'bos1.txt'), Buffer.alloc(0))
    fs.writeFileSync(path.join(tempRoot, 'bos2.txt'), Buffer.alloc(0))

    const session = await runDiskScan(storage, { rootPath: tempRoot })
    expect(session.status).toBe('completed')
    expect(session.totalFiles).toBe(2)
    expect(session.totalFolders).toBe(2) // kök + BosKlasor
    expect(session.totalBytes).toBe(0)

    const dups = storage.getVerifiedDuplicates(tempRoot)
    expect(dups.totalGroups).toBe(0)
  })

  it('2. İç içe klasörler, Türkçe karakterler, boşluklu/uzun yollar ve uzantısız dosyaları doğru indekslemelidir', async () => {
    const deepDir = path.join(
      tempRoot,
      'Çalışma Alanı 2026',
      'İstatistik ve Özet Raporları',
      'Şablon_Üretim_Arşivi_Uzun_Klasör_Adı_Testi'
    )
    fs.mkdirSync(deepDir, { recursive: true })

    const file1 = path.join(deepDir, 'Rapor_Özeti_ĞÜŞİÖÇ.pdf')
    const file2 = path.join(deepDir, 'Dockerfile') // uzantısız
    fs.writeFileSync(file1, Buffer.alloc(4096, 'A'))
    fs.writeFileSync(file2, Buffer.alloc(1024, 'B'))

    const session = await runDiskScan(storage, { rootPath: tempRoot })
    expect(session.status).toBe('completed')
    expect(session.totalFiles).toBe(2)
    expect(session.totalBytes).toBe(5120)

    const extStats = storage.getExtensionStats(tempRoot)
    const extNames = extStats.map((e) => e.extension)
    expect(extNames).toContain('.pdf')
    expect(extNames).toContain('(uzantısız)')

    // Üst klasörlerin recursiveBytes toplamı 5120 olmalı
    const topFolders = storage.getTopFolders(tempRoot)
    const calismaFolder = topFolders.find((f) => f.name === 'Çalışma Alanı 2026')
    expect(calismaFolder).toBeDefined()
    expect(calismaFolder?.recursiveBytes).toBe(5120)
    expect(calismaFolder?.recursiveFileCount).toBe(2)
  })

  it('3. Tekil boyutlu dosyaları hiçbir zaman hash işleminden geçirmemelidir (Aşama 1 Optimizasyonu)', async () => {
    fs.writeFileSync(path.join(tempRoot, 'tekil1.bin'), Buffer.alloc(1000, 1))
    fs.writeFileSync(path.join(tempRoot, 'tekil2.bin'), Buffer.alloc(2000, 2))
    fs.writeFileSync(path.join(tempRoot, 'tekil3.bin'), Buffer.alloc(3500, 3))

    await runDiskScan(storage, { rootPath: tempRoot, detectDuplicates: false })
    const { summary, stats } = await runDuplicateDetectionPipeline(storage, {
      rootPath: tempRoot
    })

    expect(stats.candidateFilesBySize).toBe(0)
    expect(stats.fastHashComputedCount).toBe(0)
    expect(stats.fullSha256ComputedCount).toBe(0)
    expect(summary.totalGroups).toBe(0)
  })

  it('4. Aynı boyutta fakat ilk/son 64 KB içeriği farklı dosyaları Aşama 2 (fastHash) ile elemeli, tam SHA-256 hesaplamamalıdır', async () => {
    fs.writeFileSync(path.join(tempRoot, 'farkliA.bin'), Buffer.alloc(80 * 1024, 'A'))
    fs.writeFileSync(path.join(tempRoot, 'farkliB.bin'), Buffer.alloc(80 * 1024, 'B'))

    await runDiskScan(storage, { rootPath: tempRoot, detectDuplicates: false })
    const { summary, stats } = await runDuplicateDetectionPipeline(storage, {
      rootPath: tempRoot
    })

    expect(stats.candidateFilesBySize).toBe(2)
    expect(stats.fastHashComputedCount).toBe(2)
    // İlk/son 64KB farklı olduğu için tam SHA-256 aşamasına geçmemeli!
    expect(stats.fullSha256ComputedCount).toBe(0)
    expect(summary.totalGroups).toBe(0)
  })

  it('5. İlk ve son 64 KB birebir aynı fakat ortası farklı olan aynı boyuttaki dosyaları tam SHA-256 ile yakalayıp mükerrer saymamalıdır', async () => {
    const totalSize = 256 * 1024 // 256 KB (> 2 * 64 KB)
    const buf1 = Buffer.alloc(totalSize, 'X')
    const buf2 = Buffer.alloc(totalSize, 'X')

    // Sadece ortadaki baytları (100. KB) değiştir (ilk 64KB ve son 64KB birebir aynı kalır)
    buf1.write('ORTA_VERI_111111', 100 * 1024, 'utf-8')
    buf2.write('ORTA_VERI_222222', 100 * 1024, 'utf-8')

    fs.writeFileSync(path.join(tempRoot, 'ortaFark1.dat'), buf1)
    fs.writeFileSync(path.join(tempRoot, 'ortaFark2.dat'), buf2)

    await runDiskScan(storage, { rootPath: tempRoot, detectDuplicates: false })
    const { summary, stats } = await runDuplicateDetectionPipeline(storage, {
      rootPath: tempRoot
    })

    // Aşama 2 (fastHash) aynı çıktığı için Aşama 3'e (fullSha256) girmeli
    expect(stats.fastHashComputedCount).toBe(2)
    expect(stats.fullSha256ComputedCount).toBe(2)
    // Tam SHA-256 farklı olduğu için doğrulanmış mükerrer grup 0 olmalı!
    expect(summary.totalGroups).toBe(0)
    expect(summary.totalRecoverableBytes).toBe(0)
  })

  it('6. Gerçek mükerrer dosyaları tespit etmeli ve kazanılabilir alanı (N - 1) * S olarak hesaplamalıdır', async () => {
    const size = 50 * 1024
    const content = Buffer.alloc(size, 'M')
    fs.writeFileSync(path.join(tempRoot, 'kopya1.iso'), content)
    fs.writeFileSync(path.join(tempRoot, 'kopya2.iso'), content)
    fs.writeFileSync(path.join(tempRoot, 'kopya3.iso'), content)

    await runDiskScan(storage, { rootPath: tempRoot, detectDuplicates: true })
    const summary = storage.getVerifiedDuplicates(tempRoot)

    expect(summary.totalGroups).toBe(1)
    expect(summary.totalDuplicateFiles).toBe(3)
    expect(summary.groups[0].totalGroupBytes).toBe(3 * size)
    // (3 - 1) * 50 KB = 100 KB kazanılabilir alan
    expect(summary.groups[0].maxRecoverableBytes).toBe(2 * size)
    expect(summary.totalRecoverableBytes).toBe(2 * size)
  })

  it('7. İzin verilmeyen dizin veya dosyada (EACCES) taramayı durdurmamalı, hatayı kaydedip diğer dosyaları taramalıdır', async () => {
    const restrictedDir = path.join(tempRoot, 'GizliSistemKlasoru')
    const openDir = path.join(tempRoot, 'AcikKlasor')
    fs.mkdirSync(restrictedDir, { recursive: true })
    fs.mkdirSync(openDir, { recursive: true })
    fs.writeFileSync(path.join(openDir, 'okunabilir.txt'), Buffer.alloc(2048, 'O'))

    const session = await runDiskScan(storage, {
      rootPath: tempRoot,
      simulateAccessErrorForPath: (targetPath) =>
        targetPath.toLowerCase().includes('gizlisistemklasoru')
    })

    expect(session.status).toBe('completed')
    expect(session.totalFiles).toBe(1)
    expect(session.errorCount).toBeGreaterThanOrEqual(1)

    const errors = storage.getScanErrors(session.id)
    expect(errors.some((e) => e.errorCode === 'EACCES')).toBe(true)
  })

  it('8. Junction / Symlink döngüsünü tespit edip atlamalı, sonsuz döngüye girmemeli ve dosyaları çift saymamalıdır', async () => {
    const subDir = path.join(tempRoot, 'VeriKlasoru')
    fs.mkdirSync(subDir, { recursive: true })
    fs.writeFileSync(path.join(subDir, 'veri.txt'), Buffer.alloc(1024, 'V'))

    const junctionPath = path.join(subDir, 'DonguBaglantisi')
    let junctionCreated = false
    try {
      // Windows'ta yönetici izni gerektirmeyen directory junction ('junction')
      fs.symlinkSync(tempRoot, junctionPath, 'junction')
      junctionCreated = true
    } catch {
      // Ortam desteklemiyorsa geç
    }

    const session = await runDiskScan(storage, { rootPath: tempRoot })
    expect(session.status).toBe('completed')
    expect(session.totalFiles).toBe(1)
    expect(session.totalBytes).toBe(1024)

    if (junctionCreated) {
      expect(session.skippedCount).toBeGreaterThanOrEqual(1)
      const errors = storage.getScanErrors(session.id)
      expect(errors.some((e) => e.itemType === 'reparse_point')).toBe(true)
    }
  })

  it('9. İptal edilen tarama (AbortSignal) veritabanını tutarlı bırakmalı ve kısmi ilerlemeyi korumalıdır', async () => {
    for (let i = 0; i < 15; i++) {
      const dir = path.join(tempRoot, `Bolum_${i}`)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, `dosya_${i}.bin`), Buffer.alloc(512, i))
    }

    const controller = new AbortController()
    const session = await runDiskScan(storage, {
      rootPath: tempRoot,
      signal: controller.signal,
      onProgress: (p) => {
        if (p.scannedFolders >= 3) {
          controller.abort()
        }
      }
    })

    expect(session.status).toBe('cancelled')
    expect(session.totalFolders).toBeGreaterThanOrEqual(1)
  })

  it('10. Veritabanı yeniden açıldığında tarama geçmişini korumalı ve artımlı (incremental) taramada değişmeyen dosyaların hash değerini yeniden kullanmalıdır', async () => {
    const content = Buffer.alloc(16 * 1024, 'Z')
    fs.writeFileSync(path.join(tempRoot, 'sabit1.bin'), content)
    fs.writeFileSync(path.join(tempRoot, 'sabit2.bin'), content)

    const firstSession = await runDiskScan(storage, {
      rootPath: tempRoot,
      detectDuplicates: true
    })
    expect(firstSession.status).toBe('completed')
    storage.close()

    // Veritabanını diskten yeniden aç
    storage = new DiskAnalyzerStorage(dbPath)
    const previousSessions = storage.getScanSessions()
    expect(previousSessions.length).toBe(1)

    // Aynı klasörü tekrar tara
    const secondSession = await runDiskScan(storage, {
      rootPath: tempRoot,
      detectDuplicates: true
    })
    expect(secondSession.incrementalReusedCount).toBe(2)
  })

  it('11. Güvenli Temizlik: Kritik sistem yollarını, tarama sonrası değişmiş dosyaları (TOCTOU) ve mükerrer grubun son kopyasını silmeyi engellemelidir', async () => {
    // A) Kritik sistem yolu koruması
    expect(isProtectedSystemPath('C:\\').protected).toBe(true)
    expect(isProtectedSystemPath('C:\\Windows\\System32\\kernel32.dll').protected).toBe(true)
    expect(isProtectedSystemPath('C:\\Program Files\\App\\app.exe').protected).toBe(true)
    expect(isProtectedSystemPath('D:\\Veri\\kurumsal.db').protected).toBe(true)

    // B) Mükerrer dosyalar ve değişmiş dosya testi
    const dupContent = Buffer.alloc(4096, 'D')
    const dup1 = path.join(tempRoot, 'm1.log')
    const dup2 = path.join(tempRoot, 'm2.log')
    const modifiedFile = path.join(tempRoot, 'degisecek.tmp')

    fs.writeFileSync(dup1, dupContent)
    fs.writeFileSync(dup2, dupContent)
    fs.writeFileSync(modifiedFile, Buffer.alloc(1000, 'T'))

    await runDiskScan(storage, { rootPath: tempRoot, detectDuplicates: true })

    const files = storage.searchFiles({ rootPath: tempRoot })
    const dup1Rec = files.find((f) => f.name === 'm1.log')!
    const dup2Rec = files.find((f) => f.name === 'm2.log')!
    const modRec = files.find((f) => f.name === 'degisecek.tmp')!

    // Tarama sonrasında degisecek.tmp dosyasının boyutunu değiştir (TOCTOU simülasyonu)
    fs.writeFileSync(modifiedFile, Buffer.alloc(9999, 'X'))

    const trashedPaths: string[] = []
    const cleanupResult = await executeSafeTrashCleanup(
      storage,
      [
        {
          fullPath: 'C:\\Windows\\System32\\cmd.exe',
          expectedSizeBytes: 1024,
          expectedMtimeMs: Date.now()
        },
        {
          fullPath: modRec.fullPath,
          expectedSizeBytes: modRec.sizeBytes,
          expectedMtimeMs: modRec.mtimeMs
        },
        {
          fullPath: dup1Rec.fullPath,
          expectedSizeBytes: dup1Rec.sizeBytes,
          expectedMtimeMs: dup1Rec.mtimeMs,
          duplicateGroupSha256: dup1Rec.sha256
        },
        {
          fullPath: dup2Rec.fullPath,
          expectedSizeBytes: dup2Rec.sizeBytes,
          expectedMtimeMs: dup2Rec.mtimeMs,
          duplicateGroupSha256: dup2Rec.sha256
        }
      ],
      {
        trashItemFn: async (p) => {
          trashedPaths.push(p)
          fs.unlinkSync(p)
        },
        // Çöp Kutusu aynı diskte olduğunda boş alanın hemen değişmemesini simüle et
        getFreeSpaceFn: () => 50 * 1024 * 1024 * 1024
      }
    )

    // 1) C:\Windows... -> blocked
    // 2) degisecek.tmp (boyutu değişti) -> blocked
    // 3) dup1 -> success (Çöp Kutusu'na taşındı)
    // 4) dup2 (grubun son kopyası!) -> blocked
    expect(cleanupResult.successCount).toBe(1)
    expect(cleanupResult.blockedCount).toBe(3)
    expect(cleanupResult.estimatedSavedBytes).toBe(4096)
    expect(cleanupResult.measuredFreeSpaceDeltaBytes).toBe(0)
    expect(fs.existsSync(dup1)).toBe(false)
    expect(fs.existsSync(dup2)).toBe(true) // Son kopya korundu!
  })

  it('12. Çöp Kutusu taşıma hatasını (EACCES/EBUSY) yakalamalı ve gerçekte silinmeyen dosyayı başarılı saymamalıdır', async () => {
    const lockedFile = path.join(tempRoot, 'kilitli.tmp')
    fs.writeFileSync(lockedFile, Buffer.alloc(2048, 'L'))

    await runDiskScan(storage, { rootPath: tempRoot })
    const rec = storage.searchFiles({ rootPath: tempRoot })[0]

    const result = await executeSafeTrashCleanup(
      storage,
      [
        {
          fullPath: rec.fullPath,
          expectedSizeBytes: rec.sizeBytes,
          expectedMtimeMs: rec.mtimeMs
        }
      ],
      {
        trashItemFn: async () => {
          throw new Error('EBUSY: Dosya başka bir işlem tarafından kullanılıyor.')
        }
      }
    )

    expect(result.successCount).toBe(0)
    expect(result.failedCount).toBe(1)
    expect(result.estimatedSavedBytes).toBe(0)
    expect(fs.existsSync(lockedFile)).toBe(true)
  })

  it('13. Etkileşimli Disk Haritası (Treemap): Kök harita, klasör içine girme (drill-down), breadcrumb, alan orantılılığı ve bayat indeks tespiti doğru çalışmalıdır', async () => {
    const dirA = path.join(tempRoot, 'Projeler')
    const dirA1 = path.join(dirA, '2026_Mimari')
    const dirB = path.join(tempRoot, 'Medya')
    fs.mkdirSync(dirA1, { recursive: true })
    fs.mkdirSync(dirB, { recursive: true })

    // Projeler/2026_Mimari: 300 KB, Medya: 100 KB -> 3:1 oran!
    fs.writeFileSync(path.join(dirA1, 'cizim.dwg'), Buffer.alloc(300 * 1024, 'P'))
    fs.writeFileSync(path.join(dirB, 'video.mp4'), Buffer.alloc(100 * 1024, 'M'))

    await runDiskScan(storage, { rootPath: tempRoot })

    // 1) Kök haritasını açma
    const rootView = storage.getTreemapView(tempRoot, tempRoot)
    expect(rootView.childrenFolders.length).toBe(2)
    expect(rootView.isIndexStale).toBe(false)

    // 2) Alanların gerçek boyutlarla (3:1 = %75 ve %25) orantılı olduğunun doğrulanması
    const rects = computeTreemapLayout(rootView.treemapNodes, {
      width: 1000,
      height: 500,
      colorMode: 'folder'
    })
    expect(rects.length).toBe(2)
    const projRect = rects.find((r) => r.name === 'Projeler')!
    const medyaRect = rects.find((r) => r.name === 'Medya')!
    expect(projRect.areaRatio).toBeCloseTo(0.75, 2)
    expect(medyaRect.areaRatio).toBeCloseTo(0.25, 2)

    // 3) Klasöre girme (Projeler) ve alt klasöre tekrar girme (2026_Mimari)
    const projView = storage.getTreemapView(tempRoot, dirA)
    expect(projView.childrenFolders.length).toBe(1)
    expect(projView.childrenFolders[0].name).toBe('2026_Mimari')

    const subView = storage.getTreemapView(tempRoot, dirA1)
    expect(subView.childrenFiles.length).toBe(1)
    expect(subView.childrenFiles[0].name).toBe('cizim.dwg')

    // 4) Breadcrumb doğrulaması
    const crumbs = buildBreadcrumbs(tempRoot, dirA1)
    expect(crumbs.length).toBe(3)
    expect(crumbs[1].name).toBe('Projeler')
    expect(crumbs[2].name).toBe('2026_Mimari')

    // 5) Klasör tarama sonrasında silindiğinde bayat indeks (isIndexStale) uyarısı
    fs.rmSync(dirB, { recursive: true, force: true })
    const staleView = storage.getTreemapView(tempRoot, dirB)
    expect(staleView.isIndexStale).toBe(true)
  })

  it('14. Sistem sürücülerini (C:\\, D:\\ vb.) gerçek kapasite ve boş alan bilgileriyle tespit etmelidir', async () => {
    const { discoverSystemDrives } = await import('../main/modules/disk-discovery.js')
    const drives = discoverSystemDrives()
    expect(drives.length).toBeGreaterThanOrEqual(1)
    const accessibleDrive = drives.find((d) => d.accessible)
    expect(accessibleDrive).toBeDefined()
    expect(accessibleDrive!.totalBytes).toBeGreaterThan(0)
    expect(accessibleDrive!.freeBytes).toBeGreaterThanOrEqual(0)
    expect(accessibleDrive!.usedBytes).toBeGreaterThanOrEqual(0)
  })
})
