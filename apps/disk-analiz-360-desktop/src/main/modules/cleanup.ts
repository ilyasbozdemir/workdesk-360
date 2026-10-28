/**
 * <summary>
 * Disk Analiz 360 — Güvenli Temizlik ve Sistem Yolu Koruma Modülü (cleanup).
 * Varsayılan olarak Windows Geri Dönüşüm Kutusu'na (Recycle Bin) taşıma yapar.
 * Silme öncesinde TOCTOU (boyut/mtime), symlink/junction, sistem yolu ve son kopya korumalarını uygular.
 * </summary>
 */

import fs from 'fs'
import path from 'path'
import {
  CleanupBatchSummary,
  CleanupCategory,
  CleanupExecutionItemRequest,
  CleanupExecutionResultItem
} from '../../shared/types.js'
import { normalizeWinPath } from '../../shared/treemapLayout.js'
import { createEntityId, DiskAnalyzerStorage } from './storage.js'
import { getPathFreeSpaceBytes } from './disk-discovery.js'

const PROTECTED_EXACT_NAMES = new Set([
  'pagefile.sys',
  'hiberfil.sys',
  'swapfile.sys',
  'bootmgr',
  'ntldr',
  'ntoskrnl.exe'
])

const PROTECTED_DB_EXTENSIONS = new Set([
  '.db',
  '.sqlite',
  '.sqlite3',
  '.db-wal',
  '.db-shm',
  '.temin',
  '.ihale',
  '.flowdesk',
  '.etap'
])

const PROTECTED_PATH_SEGMENTS = [
  '\\windows\\',
  '\\windows',
  '\\program files\\',
  '\\program files',
  '\\program files (x86)\\',
  '\\program files (x86)',
  '\\programdata\\microsoft\\',
  '\\system volume information\\',
  '\\system volume information',
  '\\$recycle.bin\\',
  '\\$recycle.bin',
  '\\winsxs\\',
  '\\recovery\\',
  '\\boot\\'
]

/**
 * <summary>
 * Verilen dosya veya klasör yolunun kritik bir sistem yolu, sürücü kökü veya
 * korunması gereken bir veritabanı dosyası olup olmadığını denetler.
 * </summary>
 */
export function isProtectedSystemPath(rawPath: string): {
  protected: boolean
  reason?: string
} {
  if (!rawPath || !rawPath.trim()) {
    return { protected: true, reason: 'Geçersiz veya boş dosya yolu.' }
  }

  const norm = normalizeWinPath(rawPath)
  const lower = norm.toLowerCase()

  // 1. Sürücü kökü kontrolü (örn: C:\, D:\)
  if (/^[a-z]:\\?$/.test(lower) || lower === '/') {
    return {
      protected: true,
      reason: 'Sürücü kök dizinleri doğrudan temizlenemez.'
    }
  }

  // 2. Kullanıcı profili ana kökü kontrolü (örn: C:\Users\Kullanici)
  if (/^[a-z]:\\users\\[^\\]+$/.test(lower)) {
    return {
      protected: true,
      reason: 'Kullanıcı profili kök dizini korunmaktadır.'
    }
  }

  // 3. Kritik Windows ve sistem dizinleri kontrolü
  const withTrailingSlash = lower.endsWith('\\') ? lower : `${lower}\\`
  for (const seg of PROTECTED_PATH_SEGMENTS) {
    if (withTrailingSlash.includes(seg)) {
      // Yalnızca kullanıcının kendi Temp klasörü (AppData\Local\Temp) dışındaki sistem yollarını koru
      if (!withTrailingSlash.includes('\\appdata\\local\\temp\\')) {
        return {
          protected: true,
          reason: `Kritik işletim sistemi veya uygulama dizini korunmaktadır (${seg.replace(/\\/g, '')}).`
        }
      }
    }
  }

  // 4. Kritik sistem dosyaları
  const baseName = path.win32.basename(lower)
  if (PROTECTED_EXACT_NAMES.has(baseName)) {
    return {
      protected: true,
      reason: `Kritik işletim sistemi dosyası (${baseName}) silinemez.`
    }
  }

  // 5. Veritabanı ve 360 ekosistem proje dosyaları koruması
  const ext = path.win32.extname(lower)
  if (PROTECTED_DB_EXTENSIONS.has(ext)) {
    return {
      protected: true,
      reason: `Veritabanı ve uygulama proje dosyaları (${ext}) genel temizlikten korunmaktadır.`
    }
  }

  return { protected: false }
}

/**
 * <summary>
 * Tarama sırasında bir dosyanın güvenli temizlik öneri kategorisini belirler.
 * Korumalı sistem dizinlerindeki dosyalar hiçbir zaman temizlik adayı olarak işaretlenmez.
 * </summary>
 */
export function classifyCleanupCategory(
  fullPath: string,
  extension: string,
  sizeBytes: number,
  mtimeMs: number,
  largeThresholdBytes = 100 * 1024 * 1024
): CleanupCategory {
  if (isProtectedSystemPath(fullPath).protected) {
    return 'none'
  }

  const lowerPath = fullPath.toLowerCase().replace(/\//g, '\\')
  const ext = extension.toLowerCase()
  const ageDays = mtimeMs > 0 ? (Date.now() - mtimeMs) / (1000 * 60 * 60 * 24) : 0

  if (ext === '.tmp' || ext === '.temp' || ext === '.cache' || lowerPath.includes('\\appdata\\local\\temp\\')) {
    return 'temp_file'
  }

  if (ext === '.log' && ageDays >= 30) {
    return 'old_log'
  }

  if (
    (lowerPath.includes('\\downloads\\') || lowerPath.includes('\\indirilenler\\')) &&
    ageDays >= 60 &&
    sizeBytes >= 5 * 1024 * 1024
  ) {
    return 'old_download'
  }

  if (sizeBytes >= largeThresholdBytes) {
    return 'large_file'
  }

  return 'none'
}

export interface SafeCleanupOptions {
  /** Geri Dönüşüm Kutusu'na taşıma işlevi (Electron shell.trashItem veya test adaptörü) */
  trashItemFn: (fullPath: string) => Promise<void>
  /** Mükerrer gruptaki son kopyanın da silinmesine izin verilsin mi? (Varsayılan: false) */
  allowDeleteLastCopy?: boolean
  /** Boş alan ölçüm fonksiyonu (test edilebilirlik için özelleştirilebilir) */
  getFreeSpaceFn?: (targetPath: string) => number | undefined
}

/**
 * <summary>
 * Seçilen dosyaları tüm güvenlik doğrulamalarından (Sistem Yolu, Symlink/Junction,
 * TOCTOU Boyut/Tarih, Mükerrer Grup Son Kopya Koruması) geçirerek Çöp Kutusu'na taşır.
 * </summary>
 */
export async function executeSafeTrashCleanup(
  storage: DiskAnalyzerStorage,
  requests: CleanupExecutionItemRequest[],
  options: SafeCleanupOptions
): Promise<CleanupBatchSummary> {
  const batchId = createEntityId('batch')
  const executedAt = new Date().toISOString()
  const getFreeSpace = options.getFreeSpaceFn || getPathFreeSpaceBytes

  const firstPath = requests[0]?.fullPath
  const freeSpaceBeforeBytes = firstPath ? getFreeSpace(firstPath) : undefined

  const results: CleanupExecutionResultItem[] = []
  let successCount = 0
  let failedCount = 0
  let blockedCount = 0
  let estimatedSavedBytes = 0

  // Mükerrer gruplarda son kopyanın silinmesini engellemek için grup bazlı sayaç
  const db = storage.getRawDb()
  const duplicateGroupRemaining = new Map<string, number>()

  for (const req of requests) {
    const normPath = normalizeWinPath(req.fullPath)

    // 1. Sistem yolu ve kritik dosya koruması
    const protection = isProtectedSystemPath(normPath)
    if (protection.protected) {
      blockedCount++
      const reason = protection.reason || 'Korumalı sistem yolu.'
      results.push({
        fullPath: normPath,
        sizeBytes: req.expectedSizeBytes,
        status: 'blocked',
        reason
      })
      storage.recordCleanupHistoryItem({
        batchId,
        filePath: normPath,
        sizeBytes: req.expectedSizeBytes,
        method: 'trash',
        status: 'blocked',
        errorMessage: reason,
        estimatedSavedBytes: 0,
        measuredFreeSpaceDeltaBytes: 0,
        createdAt: executedAt
      })
      continue
    }

    // 2. lstat ile dosyanın varlığını, symlink olmadığını ve değişmediğini doğrula
    let lstat: fs.Stats
    try {
      lstat = await fs.promises.lstat(normPath)
    } catch (err: unknown) {
      failedCount++
      const errMsg = err instanceof Error ? err.message : String(err)
      const reason = `Dosyaya erişilemedi veya dosya bulunamadı: ${errMsg}`
      results.push({
        fullPath: normPath,
        sizeBytes: req.expectedSizeBytes,
        status: 'failed',
        reason
      })
      storage.recordCleanupHistoryItem({
        batchId,
        filePath: normPath,
        sizeBytes: req.expectedSizeBytes,
        method: 'trash',
        status: 'failed',
        errorMessage: reason,
        estimatedSavedBytes: 0,
        measuredFreeSpaceDeltaBytes: 0,
        createdAt: executedAt
      })
      continue
    }

    if (lstat.isSymbolicLink() || !lstat.isFile()) {
      blockedCount++
      const reason = 'Sembolik bağlantı (symlink), junction veya klasör hedefleri güvenlik nedeniyle engellendi.'
      results.push({
        fullPath: normPath,
        sizeBytes: req.expectedSizeBytes,
        status: 'blocked',
        reason
      })
      storage.recordCleanupHistoryItem({
        batchId,
        filePath: normPath,
        sizeBytes: req.expectedSizeBytes,
        method: 'trash',
        status: 'blocked',
        errorMessage: reason,
        estimatedSavedBytes: 0,
        measuredFreeSpaceDeltaBytes: 0,
        createdAt: executedAt
      })
      continue
    }

    // 3. realpath kontrolü (üst klasörlerden biri junction/reparse point ise veya korumalı yola çıkıyorsa engelle)
    try {
      const real = normalizeWinPath(await fs.promises.realpath(normPath))
      if (real.toLowerCase() !== normPath.toLowerCase()) {
        blockedCount++
        const reason = 'Dosya yolu bir junction veya yönlendirme (reparse point) içerdiği için işlem durduruldu.'
        results.push({
          fullPath: normPath,
          sizeBytes: req.expectedSizeBytes,
          status: 'blocked',
          reason
        })
        storage.recordCleanupHistoryItem({
          batchId,
          filePath: normPath,
          sizeBytes: req.expectedSizeBytes,
          method: 'trash',
          status: 'blocked',
          errorMessage: reason,
          estimatedSavedBytes: 0,
          measuredFreeSpaceDeltaBytes: 0,
          createdAt: executedAt
        })
        continue
      }

      const realProt = isProtectedSystemPath(real)
      if (realProt.protected) {
        blockedCount++
        const reason = realProt.reason || 'Hedef gerçek yol korumalı sistem dizininde.'
        results.push({
          fullPath: normPath,
          sizeBytes: req.expectedSizeBytes,
          status: 'blocked',
          reason
        })
        storage.recordCleanupHistoryItem({
          batchId,
          filePath: normPath,
          sizeBytes: req.expectedSizeBytes,
          method: 'trash',
          status: 'blocked',
          errorMessage: reason,
          estimatedSavedBytes: 0,
          measuredFreeSpaceDeltaBytes: 0,
          createdAt: executedAt
        })
        continue
      }
    } catch {
      // realpath okunamazsa güvenlik gereği engelle
      blockedCount++
      const reason = 'Dosyanın gerçek fiziksel yolu doğrulanamadı.'
      results.push({
        fullPath: normPath,
        sizeBytes: req.expectedSizeBytes,
        status: 'blocked',
        reason
      })
      continue
    }

    // 4. TOCTOU (Tarama sonrası boyut veya değiştirilme zamanı değişmiş mi?)
    const mtimeDiff = Math.abs(Math.trunc(lstat.mtimeMs) - Math.trunc(req.expectedMtimeMs))
    if (lstat.size !== req.expectedSizeBytes || mtimeDiff > 2000) {
      blockedCount++
      const reason = 'Dosya tarama sonrasında değiştirilmiş (boyut veya değiştirilme zamanı farklı). İşlem iptal edildi.'
      results.push({
        fullPath: normPath,
        sizeBytes: lstat.size,
        status: 'blocked',
        reason
      })
      storage.recordCleanupHistoryItem({
        batchId,
        filePath: normPath,
        sizeBytes: lstat.size,
        method: 'trash',
        status: 'blocked',
        errorMessage: reason,
        estimatedSavedBytes: 0,
        measuredFreeSpaceDeltaBytes: 0,
        createdAt: executedAt
      })
      continue
    }

    // 5. Son Kopya Koruması (Mükerrer dosya grubunda en az 1 kopya bırakılmalı)
    if (!options.allowDeleteLastCopy) {
      const indexedRow = db
        .prepare('SELECT sha256, sizeBytes FROM DATA_IndexedFile WHERE LOWER(fullPath) = LOWER(?)')
        .get(normPath) as { sha256: string | null; sizeBytes: number } | undefined

      const sha = req.duplicateGroupSha256 || indexedRow?.sha256
      if (sha) {
        const groupKey = `${sha}:${lstat.size}`
        if (!duplicateGroupRemaining.has(groupKey)) {
          const countRow = db
            .prepare(
              `SELECT COUNT(*) as c FROM DATA_IndexedFile
               WHERE sha256 = ? AND sizeBytes = ? AND hashStatus = 'verified_sha256'`
            )
            .get(sha, lstat.size) as { c: number }
          duplicateGroupRemaining.set(groupKey, countRow.c)
        }

        const remaining = duplicateGroupRemaining.get(groupKey) ?? 1
        if (remaining <= 1) {
          blockedCount++
          const reason =
            'Son kopya koruması: Mükerrer gruptaki tüm kopyaların silinmesi varsayılan olarak engellenmiştir (en az 1 kopya korunmalıdır).'
          results.push({
            fullPath: normPath,
            sizeBytes: lstat.size,
            status: 'blocked',
            reason
          })
          storage.recordCleanupHistoryItem({
            batchId,
            filePath: normPath,
            sizeBytes: lstat.size,
            method: 'trash',
            status: 'blocked',
            errorMessage: reason,
            estimatedSavedBytes: 0,
            measuredFreeSpaceDeltaBytes: 0,
            createdAt: executedAt
          })
          continue
        }
        duplicateGroupRemaining.set(groupKey, remaining - 1)
      }
    }

    // 6. İşletim sistemi Geri Dönüşüm Kutusu'na (Recycle Bin) taşı
    try {
      await options.trashItemFn(normPath)
      successCount++
      estimatedSavedBytes += lstat.size
      storage.removeFileFromIndex(normPath)

      results.push({
        fullPath: normPath,
        sizeBytes: lstat.size,
        status: 'success'
      })
    } catch (err: unknown) {
      failedCount++
      const errMsg = err instanceof Error ? err.message : String(err)
      const reason = `Çöp Kutusu işlemi başarısız: ${errMsg}`
      results.push({
        fullPath: normPath,
        sizeBytes: lstat.size,
        status: 'failed',
        reason
      })
      storage.recordCleanupHistoryItem({
        batchId,
        filePath: normPath,
        sizeBytes: lstat.size,
        method: 'trash',
        status: 'failed',
        errorMessage: reason,
        estimatedSavedBytes: 0,
        measuredFreeSpaceDeltaBytes: 0,
        createdAt: executedAt
      })
    }
  }

  const freeSpaceAfterBytes = firstPath ? getFreeSpace(firstPath) : undefined
  const measuredFreeSpaceDeltaBytes =
    freeSpaceBeforeBytes !== undefined && freeSpaceAfterBytes !== undefined
      ? Math.max(0, freeSpaceAfterBytes - freeSpaceBeforeBytes)
      : 0

  // Başarılı işlemleri gerçek boş alan farkıyla birlikte geçmişe yaz
  for (const item of results) {
    if (item.status === 'success') {
      storage.recordCleanupHistoryItem({
        batchId,
        filePath: item.fullPath,
        sizeBytes: item.sizeBytes,
        method: 'trash',
        status: 'success',
        estimatedSavedBytes: item.sizeBytes,
        measuredFreeSpaceDeltaBytes,
        createdAt: executedAt
      })
    }
  }

  return {
    batchId,
    executedAt,
    requestedCount: requests.length,
    successCount,
    failedCount,
    blockedCount,
    estimatedSavedBytes,
    measuredFreeSpaceDeltaBytes,
    freeSpaceBeforeBytes,
    freeSpaceAfterBytes,
    items: results
  }
}

