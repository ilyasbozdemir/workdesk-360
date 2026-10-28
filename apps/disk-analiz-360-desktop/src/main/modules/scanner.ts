/**
 * <summary>
 * Disk Analiz 360 — Güvenli, Artımlı ve İptal Edilebilir Dizin Tarama Motoru (scanner).
 * Sembolik bağlantıları ve NTFS junction/reparse point döngülerini takip etmez.
 * Erişim hatalarında (EACCES, EPERM, EBUSY) taramayı durdurmaz; kaydedip devam eder.
 * </summary>
 */

import fs from 'fs'
import path from 'path'
import {
  IndexedFileRecord,
  IndexedFolderRecord,
  ScanErrorRecord,
  ScanProgressPayload,
  ScanSessionRecord
} from '../../shared/types.js'
import { normalizeWinPath } from '../../shared/treemapLayout.js'
import { classifyCleanupCategory } from './cleanup.js'
import { runDuplicateDetectionPipeline } from './duplicate-detector.js'
import { createEntityId, DiskAnalyzerStorage } from './storage.js'

const FILE_BATCH_SIZE = 250
const FOLDER_BATCH_SIZE = 250
const ERROR_BATCH_SIZE = 100

interface FolderAccumulator {
  fullPath: string
  parentPath: string
  name: string
  depth: number
  directFileCount: number
  directFolderCount: number
  recursiveFileCount: number
  recursiveFolderCount: number
  directBytes: number
  recursiveBytes: number
}

export interface ScanDirectoryOptions {
  rootPath: string
  signal?: AbortSignal
  detectDuplicates?: boolean
  excludedPaths?: string[]
  onProgress?: (progress: ScanProgressPayload) => void
  /** Testlerde izin hatasını simüle etmek için opsiyonel kanca */
  simulateAccessErrorForPath?: (targetPath: string) => boolean
}

function extractExtension(fileName: string): string {
  const ext = path.win32.extname(fileName).toLowerCase()
  if (!ext || ext === '.') {
    return '(uzantısız)'
  }
  return ext
}

export async function runDiskScan(
  storage: DiskAnalyzerStorage,
  options: ScanDirectoryOptions
): Promise<ScanSessionRecord> {
  const normRoot = normalizeWinPath(options.rootPath)
  const driveCode = /^[a-zA-Z]:/.test(normRoot) ? normRoot.slice(0, 2).toUpperCase() : normRoot
  const session = storage.createScanSession(normRoot, driveCode)
  const startTimeMs = Date.now()

  const settings = storage.getSettings()
  const largeThresholdBytes = settings.largeFileThresholdMb * 1024 * 1024
  const excludedSet = new Set(
    (options.excludedPaths ?? settings.excludedPaths).map((p) => normalizeWinPath(p).toLowerCase())
  )

  const existingMetaMap = storage.getExistingFileMetadataMap(normRoot)
  const visitedRealDirs = new Set<string>()

  const fileBatch: IndexedFileRecord[] = []
  const errorBatch: ScanErrorRecord[] = []
  const folderMap = new Map<string, FolderAccumulator>()

  let scannedFiles = 0
  let scannedFolders = 0
  let totalBytes = 0
  let skippedCount = 0
  let errorCount = 0
  let incrementalReusedCount = 0
  let lastProgressEmitMs = 0

  const emitProgress = (
    phase: ScanProgressPayload['phase'],
    currentPath?: string,
    force = false
  ): void => {
    if (!options.onProgress) return
    const now = Date.now()
    if (!force && now - lastProgressEmitMs < 120) return
    lastProgressEmitMs = now

    options.onProgress({
      sessionId: session.id,
      rootPath: normRoot,
      status: options.signal?.aborted ? 'cancelled' : 'running',
      phase,
      scannedFiles,
      scannedFolders,
      totalBytes,
      skippedCount,
      errorCount,
      incrementalReusedCount,
      elapsedMs: now - startTimeMs,
      currentPath
    })
  }

  const flushBatches = (): void => {
    if (fileBatch.length > 0) {
      storage.upsertIndexedFilesBatch(fileBatch)
      fileBatch.length = 0
    }
    if (errorBatch.length > 0) {
      storage.insertScanErrorsBatch(errorBatch)
      errorBatch.length = 0
    }
  }

  const recordError = (
    targetPath: string,
    errorCode: string,
    errorMessage: string,
    itemType: ScanErrorRecord['itemType']
  ): void => {
    errorCount++
    errorBatch.push({
      id: createEntityId('err'),
      sessionId: session.id,
      targetPath,
      errorCode,
      errorMessage,
      itemType,
      occurredAt: new Date().toISOString()
    })
    if (errorBatch.length >= ERROR_BATCH_SIZE) {
      storage.insertScanErrorsBatch(errorBatch)
      errorBatch.length = 0
    }
  }

  // Kök dizinin gerçek yolunu al
  let rootRealPath = normRoot
  try {
    rootRealPath = normalizeWinPath(await fs.promises.realpath(normRoot))
    visitedRealDirs.add(rootRealPath.toLowerCase())
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code || 'EACCES'
    const msg = err instanceof Error ? err.message : String(err)
    recordError(normRoot, code, `Kök dizine erişilemedi: ${msg}`, 'folder')
    flushBatches()
    const failedDuration = Date.now() - startTimeMs
    storage.updateScanSession(session.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      durationMs: failedDuration,
      totalFiles: 0,
      totalFolders: 0,
      totalBytes: 0,
      skippedCount,
      errorCount,
      incrementalReusedCount
    })
    return storage.getLatestSessionForRoot(normRoot)!
  }

  // DFS yığını (bellek dostu iteratif gezinme)
  const dirQueue: Array<{ fullPath: string; parentPath: string; depth: number }> = [
    { fullPath: normRoot, parentPath: '', depth: 0 }
  ]

  while (dirQueue.length > 0) {
    if (options.signal?.aborted) {
      break
    }

    const currentDir = dirQueue.pop()!
    const normCurrent = normalizeWinPath(currentDir.fullPath)

    if (currentDir.depth > 0 && excludedSet.has(normCurrent.toLowerCase())) {
      skippedCount++
      continue
    }

    if (options.simulateAccessErrorForPath?.(normCurrent)) {
      recordError(normCurrent, 'EACCES', 'Erişim reddedildi (Simüle edilen izin kısıtlaması).', 'folder')
      continue
    }

    let dirHandle: fs.Dir
    try {
      dirHandle = await fs.promises.opendir(normCurrent, { bufferSize: 64 })
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code || 'EACCES'
      const msg = err instanceof Error ? err.message : String(err)
      recordError(normCurrent, code, msg, 'folder')
      continue
    }

    scannedFolders++
    const dirName =
      currentDir.depth === 0
        ? normCurrent
        : path.win32.basename(normCurrent) || normCurrent

    const folderAcc: FolderAccumulator = {
      fullPath: normCurrent,
      parentPath: currentDir.parentPath,
      name: dirName,
      depth: currentDir.depth,
      directFileCount: 0,
      directFolderCount: 0,
      recursiveFileCount: 0,
      recursiveFolderCount: 0,
      directBytes: 0,
      recursiveBytes: 0
    }
    folderMap.set(normCurrent.toLowerCase(), folderAcc)

    emitProgress('scanning_tree', normCurrent)

    try {
      for await (const dirent of dirHandle) {
        if (options.signal?.aborted) {
          break
        }

        const childFullPath =
          normCurrent.endsWith('\\')
            ? `${normCurrent}${dirent.name}`
            : `${normCurrent}\\${dirent.name}`

        if (excludedSet.has(childFullPath.toLowerCase())) {
          skippedCount++
          continue
        }

        if (options.simulateAccessErrorForPath?.(childFullPath)) {
          recordError(
            childFullPath,
            'EACCES',
            'Dosya veya klasör okuma izni reddedildi.',
            dirent.isDirectory() ? 'folder' : 'file'
          )
          continue
        }

        // Sembolik bağlantı (symlink) kontrolü
        if (dirent.isSymbolicLink()) {
          skippedCount++
          recordError(
            childFullPath,
            'SKIPPED_SYMLINK',
            'Sembolik bağlantı döngü güvenliği nedeniyle takip edilmedi.',
            'reparse_point'
          )
          continue
        }

        let lstat: fs.Stats
        try {
          lstat = await fs.promises.lstat(childFullPath)
        } catch (err: unknown) {
          const code = (err as NodeJS.ErrnoException)?.code || 'ENOENT'
          const msg = err instanceof Error ? err.message : String(err)
          recordError(
            childFullPath,
            code,
            msg,
            dirent.isDirectory() ? 'folder' : 'file'
          )
          continue
        }

        if (lstat.isSymbolicLink()) {
          skippedCount++
          recordError(
            childFullPath,
            'SKIPPED_SYMLINK',
            'Sembolik bağlantı (lstat) döngü güvenliği nedeniyle atlandı.',
            'reparse_point'
          )
          continue
        }

        if (lstat.isDirectory()) {
          // NTFS Junction / Reparse Point ve döngü kontrolü
          let childRealPath: string
          try {
            childRealPath = normalizeWinPath(await fs.promises.realpath(childFullPath))
          } catch (err: unknown) {
            const code = (err as NodeJS.ErrnoException)?.code || 'EACCES'
            const msg = err instanceof Error ? err.message : String(err)
            recordError(childFullPath, code, msg, 'folder')
            continue
          }

          if (childRealPath.toLowerCase() !== childFullPath.toLowerCase()) {
            // Junction veya reparse point tespit edildi!
            skippedCount++
            recordError(
              childFullPath,
              'SKIPPED_JUNCTION',
              `NTFS Junction / Reparse Point (${childRealPath}) döngü önleme kapsamında atlandı.`,
              'reparse_point'
            )
            continue
          }

          if (visitedRealDirs.has(childRealPath.toLowerCase())) {
            skippedCount++
            recordError(
              childFullPath,
              'SKIPPED_CYCLE',
              'Dizin döngüsü tespit edildi ve atlandı.',
              'reparse_point'
            )
            continue
          }

          visitedRealDirs.add(childRealPath.toLowerCase())
          folderAcc.directFolderCount++
          dirQueue.push({
            fullPath: childFullPath,
            parentPath: normCurrent,
            depth: currentDir.depth + 1
          })
        } else if (lstat.isFile()) {
          const sizeBytes = Math.max(0, Number(lstat.size) || 0)
          const mtimeMs = Math.trunc(lstat.mtimeMs || 0)
          const ctimeMs = Math.trunc(lstat.ctimeMs || mtimeMs)
          const fileIndex =
            lstat.ino && lstat.ino > 0 ? `${lstat.dev}:${lstat.ino}` : undefined
          const ext = extractExtension(dirent.name)

          // Artımlı (Incremental) indeks kontrolü
          const prev = existingMetaMap.get(childFullPath.toLowerCase())
          let fastHash: string | undefined
          let sha256: string | undefined
          let hashStatus: IndexedFileRecord['hashStatus'] = 'none'

          if (
            prev &&
            prev.sizeBytes === sizeBytes &&
            Math.abs(Math.trunc(prev.mtimeMs) - mtimeMs) <= 1000 &&
            (!prev.fileIndex || !fileIndex || prev.fileIndex === fileIndex)
          ) {
            fastHash = prev.fastHash
            sha256 = prev.sha256
            hashStatus = prev.hashStatus
            incrementalReusedCount++
          }

          const cleanupCategory =
            hashStatus === 'verified_sha256'
              ? 'duplicate'
              : classifyCleanupCategory(
                  childFullPath,
                  ext,
                  sizeBytes,
                  mtimeMs,
                  largeThresholdBytes
                )

          scannedFiles++
          totalBytes += sizeBytes
          folderAcc.directFileCount++
          folderAcc.directBytes += sizeBytes

          fileBatch.push({
            id: createEntityId('fl'),
            sessionId: session.id,
            rootPath: normRoot,
            fullPath: childFullPath,
            parentPath: normCurrent,
            name: dirent.name,
            extension: ext,
            sizeBytes,
            mtimeMs,
            ctimeMs,
            fileIndex,
            cleanupCategory,
            fastHash,
            sha256,
            hashStatus,
            updatedAt: new Date().toISOString()
          })

          if (fileBatch.length >= FILE_BATCH_SIZE) {
            storage.upsertIndexedFilesBatch(fileBatch)
            fileBatch.length = 0
            // Event loop'a nefes aldır (iptal sinyali ve IPC akıcılığı için)
            await new Promise<void>((resolve) => setImmediate(resolve))
          }
        }
      }
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code || 'EIO'
      const msg = err instanceof Error ? err.message : String(err)
      recordError(normCurrent, code, msg, 'folder')
    }
  }

  flushBatches()

  // ==========================================================================
  // AŞAMA 2: KLASÖR BOYUTLARINI AŞAĞIDAN YUKARIYA (BOTTOM-UP) HESAPLA
  // ==========================================================================
  emitProgress('aggregating_folders', normRoot, true)

  const allFolders = Array.from(folderMap.values()).sort((a, b) => b.depth - a.depth)
  for (const fld of allFolders) {
    fld.recursiveBytes += fld.directBytes
    fld.recursiveFileCount += fld.directFileCount
    fld.recursiveFolderCount += fld.directFolderCount

    if (fld.parentPath) {
      const parentAcc = folderMap.get(fld.parentPath.toLowerCase())
      if (parentAcc) {
        parentAcc.recursiveBytes += fld.recursiveBytes
        parentAcc.recursiveFileCount += fld.recursiveFileCount
        parentAcc.recursiveFolderCount += fld.recursiveFolderCount
      }
    }
  }

  const nowIso = new Date().toISOString()
  const folderRecords: IndexedFolderRecord[] = allFolders.map((f) => ({
    fullPath: f.fullPath,
    sessionId: session.id,
    rootPath: normRoot,
    parentPath: f.parentPath,
    name: f.name,
    depth: f.depth,
    directFileCount: f.directFileCount,
    directFolderCount: f.directFolderCount,
    recursiveFileCount: f.recursiveFileCount,
    recursiveFolderCount: f.recursiveFolderCount,
    directBytes: f.directBytes,
    recursiveBytes: f.recursiveBytes,
    updatedAt: nowIso
  }))

  for (let i = 0; i < folderRecords.length; i += FOLDER_BATCH_SIZE) {
    storage.upsertIndexedFoldersBatch(folderRecords.slice(i, i + FOLDER_BATCH_SIZE))
  }

  const wasCancelled = Boolean(options.signal?.aborted)

  if (!wasCancelled) {
    // Tamamlanan taramada artık diskte olmayan eski kayıtları temizle
    storage.pruneStaleEntriesAfterCompletedScan(normRoot, session.id)

    // AŞAMA 3: Mükerrer dosya tespiti (varsayılan olarak açık)
    if (options.detectDuplicates !== false) {
      emitProgress('detecting_duplicates', normRoot, true)
      await runDuplicateDetectionPipeline(storage, {
        rootPath: normRoot,
        signal: options.signal,
        onProgress: (p) => emitProgress('detecting_duplicates', p)
      })
    }
  }

  const finalStatus = Boolean(options.signal?.aborted) ? 'cancelled' : 'completed'
  const totalDurationMs = Date.now() - startTimeMs

  storage.updateScanSession(session.id, {
    status: finalStatus,
    completedAt: new Date().toISOString(),
    durationMs: totalDurationMs,
    totalFiles: scannedFiles,
    totalFolders: scannedFolders,
    totalBytes,
    skippedCount,
    errorCount,
    incrementalReusedCount
  })

  emitProgress(finalStatus, normRoot, true)

  return storage.getLatestSessionForRoot(normRoot)!
}

