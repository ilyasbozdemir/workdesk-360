/**
 * <summary>
 * Disk Analiz 360 — 3 Aşamalı Mükerrer Dosya Tespit Motoru (duplicate-detector).
 * 1. Aşama: Dosya boyutuna göre gruplar (tekil boyuttaki dosyalar için hiçbir hash hesaplanmaz).
 * 2. Aşama: Aynı boyuttaki adayların ilk ve son 64 KB bloklarından hızlı kısmi özet (fastHash) alır.
 * 3. Aşama: Yalnızca hem boyutu hem de fastHash'i eşleşen adayları baştan sona stream ederek
 *    tam SHA-256 ile doğrular ve işlem sırasında dosyanın değişmediğini (TOCTOU) kontrol eder.
 * </summary>
 */

import fs from 'fs'
import crypto from 'crypto'
import { DuplicateSummary, FileHashStatus, IndexedFileRecord } from '../../shared/types.js'
import { DiskAnalyzerStorage } from './storage.js'

export const FAST_HASH_CHUNK_BYTES = 64 * 1024 // 64 KB

export interface DuplicateDetectionStats {
  candidateFilesBySize: number
  fastHashComputedCount: number
  fullSha256ComputedCount: number
  reusedHashCount: number
  skippedModifiedOrErrorCount: number
  verifiedGroupCount: number
  verifiedDuplicateFileCount: number
  totalRecoverableBytes: number
}

/**
 * <summary>
 * Dosyanın yalnızca ilk 64 KB ve son 64 KB bölümlerini okuyarak hızlı ön eleme özeti üretir.
 * Bu değer hiçbir zaman tek başına kesin mükerrerlik kanıtı olarak kabul edilmez.
 * </summary>
 */
export async function computeFastPartialHash(
  fullPath: string,
  expectedSizeBytes: number
): Promise<string> {
  const handle = await fs.promises.open(fullPath, 'r')
  try {
    const hash = crypto.createHash('sha256')
    hash.update(`size:${expectedSizeBytes}:`)

    const headLength = Math.min(FAST_HASH_CHUNK_BYTES, expectedSizeBytes)
    if (headLength > 0) {
      const headBuf = Buffer.allocUnsafe(headLength)
      const { bytesRead } = await handle.read(headBuf, 0, headLength, 0)
      hash.update(headBuf.subarray(0, bytesRead))
    }

    if (expectedSizeBytes > FAST_HASH_CHUNK_BYTES) {
      const tailOffset = Math.max(headLength, expectedSizeBytes - FAST_HASH_CHUNK_BYTES)
      const tailLength = expectedSizeBytes - tailOffset
      if (tailLength > 0) {
        const tailBuf = Buffer.allocUnsafe(tailLength)
        const { bytesRead } = await handle.read(tailBuf, 0, tailLength, tailOffset)
        hash.update(tailBuf.subarray(0, bytesRead))
      }
    }

    return hash.digest('hex')
  } finally {
    await handle.close()
  }
}

/**
 * <summary>
 * Dosyanın tamamını belleğe yüklemeden 64 KB akış (stream) parçalarıyla okuyarak tam SHA-256 hesaplar.
 * Okuma öncesinde ve sonrasında lstat ile boyut ve değiştirilme zamanını (TOCTOU) doğrular.
 * </summary>
 */
export async function computeFullStreamingSha256(
  fullPath: string,
  expectedSizeBytes: number,
  expectedMtimeMs: number,
  signal?: AbortSignal
): Promise<string> {
  const preStat = await fs.promises.lstat(fullPath)
  if (preStat.isSymbolicLink() || !preStat.isFile()) {
    throw new Error('Hedef standart bir dosya değil veya sembolik bağlantı.')
  }
  if (preStat.size !== expectedSizeBytes) {
    throw new Error('Dosya boyutu tarama sonrasında değişmiş.')
  }

  const hash = crypto.createHash('sha256')

  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(fullPath, {
      highWaterMark: 64 * 1024
    })

    const onAbort = (): void => {
      stream.destroy(new Error('Tarama kullanıcı tarafından iptal edildi.'))
    }

    if (signal) {
      if (signal.aborted) {
        stream.destroy(new Error('Tarama kullanıcı tarafından iptal edildi.'))
        reject(new Error('Tarama kullanıcı tarafından iptal edildi.'))
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }

    stream.on('data', (chunk: Buffer | string) => {
      hash.update(chunk)
    })

    stream.on('error', (err) => {
      if (signal) signal.removeEventListener('abort', onAbort)
      reject(err)
    })

    stream.on('end', () => {
      if (signal) signal.removeEventListener('abort', onAbort)
      resolve()
    })
  })

  const postStat = await fs.promises.lstat(fullPath)
  const mtimeDiff = Math.abs(Math.trunc(postStat.mtimeMs) - Math.trunc(expectedMtimeMs))
  if (postStat.size !== expectedSizeBytes || mtimeDiff > 2000) {
    throw new Error('Dosya hash hesaplaması sırasında değiştirildi (TOCTOU ihlali).')
  }

  return hash.digest('hex')
}

export interface RunDuplicateDetectionOptions {
  rootPath?: string
  signal?: AbortSignal
  onProgress?: (currentPath: string) => void
}

/**
 * <summary>
 * İndekslenmiş dosyalar üzerinde 3 aşamalı mükerrer dosya doğrulamasını çalıştırır ve
 * sonuçları SQLite veritabanına yazar.
 * </summary>
 */
export async function runDuplicateDetectionPipeline(
  storage: DiskAnalyzerStorage,
  options: RunDuplicateDetectionOptions = {}
): Promise<{ summary: DuplicateSummary; stats: DuplicateDetectionStats }> {
  const stats: DuplicateDetectionStats = {
    candidateFilesBySize: 0,
    fastHashComputedCount: 0,
    fullSha256ComputedCount: 0,
    reusedHashCount: 0,
    skippedModifiedOrErrorCount: 0,
    verifiedGroupCount: 0,
    verifiedDuplicateFileCount: 0,
    totalRecoverableBytes: 0
  }

  // 1. AŞAMA: Boyuta göre grupla (Tekil boyuttaki dosyalar hiç gelmez)
  const sizeCandidates = storage.getSameSizeCandidates(options.rootPath)
  stats.candidateFilesBySize = sizeCandidates.length

  if (sizeCandidates.length < 2) {
    const emptySummary = storage.getVerifiedDuplicates(options.rootPath)
    return { summary: emptySummary, stats }
  }

  // Boyut bazında grupla
  const bySize = new Map<number, IndexedFileRecord[]>()
  for (const file of sizeCandidates) {
    const list = bySize.get(file.sizeBytes) || []
    list.push(file)
    bySize.set(file.sizeBytes, list)
  }

  // 2. AŞAMA: İlk ve son 64 KB üzerinden hızlı kısmi hash (fastHash)
  const fastHashGroups = new Map<string, IndexedFileRecord[]>()
  const pendingDbUpdates: Array<{
    fullPath: string
    fastHash?: string
    sha256?: string
    hashStatus: FileHashStatus
  }> = []

  for (const [sizeBytes, filesOfSameSize] of bySize.entries()) {
    if (filesOfSameSize.length < 2) continue

    for (const file of filesOfSameSize) {
      if (options.signal?.aborted) {
        break
      }

      options.onProgress?.(file.fullPath)

      let fastHash = file.fastHash
      if (!fastHash) {
        try {
          fastHash = await computeFastPartialHash(file.fullPath, sizeBytes)
          stats.fastHashComputedCount++
          pendingDbUpdates.push({
            fullPath: file.fullPath,
            fastHash,
            hashStatus: file.sha256 ? 'verified_sha256' : 'fast_hashed'
          })
        } catch {
          stats.skippedModifiedOrErrorCount++
          pendingDbUpdates.push({
            fullPath: file.fullPath,
            hashStatus: 'error'
          })
          continue
        }
      } else {
        stats.reusedHashCount++
      }

      const key = `${sizeBytes}:${fastHash}`
      const grp = fastHashGroups.get(key) || []
      grp.push({ ...file, fastHash })
      fastHashGroups.set(key, grp)
    }
  }

  if (pendingDbUpdates.length > 0) {
    storage.updateFileHashesBatch(pendingDbUpdates)
    pendingDbUpdates.length = 0
  }

  // 3. AŞAMA: Aynı (sizeBytes + fastHash) grubunda >= 2 dosya olanlar için Tam SHA-256
  for (const [, candidates] of fastHashGroups.entries()) {
    if (candidates.length < 2) {
      // Kısmi hash tekil çıktı -> tam SHA-256 hesaplamaya gerek yok!
      continue
    }

    for (const file of candidates) {
      if (options.signal?.aborted) {
        break
      }

      options.onProgress?.(file.fullPath)

      if (file.sha256 && file.hashStatus === 'verified_sha256') {
        // Önceki taramadan doğrulanmış hash var; ancak dosyanın değişmediğini lstat ile yeniden teyit et
        try {
          const st = await fs.promises.lstat(file.fullPath)
          const mtimeDiff = Math.abs(Math.trunc(st.mtimeMs) - Math.trunc(file.mtimeMs))
          if (st.isFile() && !st.isSymbolicLink() && st.size === file.sizeBytes && mtimeDiff <= 2000) {
            stats.reusedHashCount++
            continue
          }
        } catch {
          stats.skippedModifiedOrErrorCount++
          pendingDbUpdates.push({
            fullPath: file.fullPath,
            hashStatus: 'error'
          })
          continue
        }
      }

      try {
        const sha256 = await computeFullStreamingSha256(
          file.fullPath,
          file.sizeBytes,
          file.mtimeMs,
          options.signal
        )
        stats.fullSha256ComputedCount++
        pendingDbUpdates.push({
          fullPath: file.fullPath,
          fastHash: file.fastHash,
          sha256,
          hashStatus: 'verified_sha256'
        })

        if (pendingDbUpdates.length >= 100) {
          storage.updateFileHashesBatch(pendingDbUpdates)
          pendingDbUpdates.length = 0
        }
      } catch {
        stats.skippedModifiedOrErrorCount++
        pendingDbUpdates.push({
          fullPath: file.fullPath,
          hashStatus: 'error'
        })
      }
    }
  }

  if (pendingDbUpdates.length > 0) {
    storage.updateFileHashesBatch(pendingDbUpdates)
  }

  const summary = storage.getVerifiedDuplicates(options.rootPath)
  stats.verifiedGroupCount = summary.totalGroups
  stats.verifiedDuplicateFileCount = summary.totalDuplicateFiles
  stats.totalRecoverableBytes = summary.totalRecoverableBytes

  return { summary, stats }
}

