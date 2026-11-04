import fs from 'fs'
import path from 'path'
import chokidar, { FSWatcher } from 'chokidar'
import { getStoragePaths } from '../paths'
import {
  detectCategory,
  upsertFileRecord,
  removeFileRecord,
  batchUpsertFiles,
  getDatabase
} from '../db/database'
import { fileHashQueue } from './hasher'
import { FileRecord } from '../../shared/types'

let watcherInstance: FSWatcher | null = null
let isScanning = false
let onFilesChangedListener: (() => void) | null = null

export function setFilesChangedListener(listener: () => void) {
  onFilesChangedListener = listener
}

function notifyChange() {
  if (onFilesChangedListener) {
    onFilesChangedListener()
  }
}

export function isScanActive(): boolean {
  return isScanning
}

export async function scanDocumentsFolder(): Promise<void> {
  const { documentsDir } = getStoragePaths()
  if (!fs.existsSync(documentsDir)) return

  isScanning = true
  const batch: Omit<FileRecord, 'id' | 'tags'>[] = []
  const existingPathsInDir = new Set<string>()

  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)

        // İhmal edilecek dosyalar
        if (
          entry.name.startsWith('.') ||
          entry.name.startsWith('~$') ||
          entry.name.endsWith('.tmp') ||
          entry.name === 'Thumbs.db' ||
          entry.name === 'desktop.ini'
        ) {
          continue
        }

        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (entry.isFile()) {
          try {
            const stats = fs.statSync(fullPath)
            const ext = path.extname(entry.name).toLowerCase()
            const relativePath = path.relative(documentsDir, fullPath)

            existingPathsInDir.add(fullPath)
            batch.push({
              path: fullPath,
              relativePath,
              name: entry.name,
              ext,
              size: stats.size,
              mtimeMs: Math.floor(stats.mtimeMs),
              ctimeMs: Math.floor(stats.birthtimeMs || stats.ctimeMs),
              category: detectCategory(ext),
              sha256: null
            })
          } catch {
            // Erişim engelli dosya
          }
        }
      }
    } catch (err) {
      console.error('Klasör tarama hatası:', currentDir, err)
    }
  }

  walk(documentsDir)

  // Veritabanına toplu kayıt
  batchUpsertFiles(batch)

  // Silinmiş fiziksel dosyaları veritabanından temizle
  const db = getDatabase()
  const dbFiles = db.prepare('SELECT path FROM files').all() as { path: string }[]
  for (const row of dbFiles) {
    if (!existingPathsInDir.has(row.path)) {
      removeFileRecord(row.path)
    }
  }

  isScanning = false
  notifyChange()

  // Boyut bazlı aday duplicate hash kuyruğunu başlat
  fileHashQueue.triggerPrioritizedDuplicateHashing()
}

export function startWatcher(): void {
  const { documentsDir } = getStoragePaths()
  if (!fs.existsSync(documentsDir)) return

  if (watcherInstance) {
    watcherInstance.close()
  }

  // İlk tam taramayı yap
  scanDocumentsFolder().catch((err) => console.error('İlk tarama hatası:', err))

  watcherInstance = chokidar.watch(documentsDir, {
    ignored: [
      /(^|[/\\])\../,
      /(^|[/\\])~\$.*/,
      /\.tmp$/i,
      /Thumbs\.db$/i,
      /desktop\.ini$/i
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  })

  watcherInstance.on('add', (filePath) => {
    try {
      if (!fs.existsSync(filePath)) return
      const stats = fs.statSync(filePath)
      const fileName = path.basename(filePath)
      const ext = path.extname(fileName).toLowerCase()
      const relativePath = path.relative(documentsDir, filePath)

      upsertFileRecord({
        path: filePath,
        relativePath,
        name: fileName,
        ext,
        size: stats.size,
        mtimeMs: Math.floor(stats.mtimeMs),
        ctimeMs: Math.floor(stats.birthtimeMs || stats.ctimeMs),
        category: detectCategory(ext),
        sha256: null
      })

      notifyChange()
      fileHashQueue.enqueueCandidate(filePath)
    } catch (err) {
      console.error('Dosya ekleme izleme hatası:', filePath, err)
    }
  })

  watcherInstance.on('change', (filePath) => {
    try {
      if (!fs.existsSync(filePath)) return
      const stats = fs.statSync(filePath)
      const fileName = path.basename(filePath)
      const ext = path.extname(fileName).toLowerCase()
      const relativePath = path.relative(documentsDir, filePath)

      upsertFileRecord({
        path: filePath,
        relativePath,
        name: fileName,
        ext,
        size: stats.size,
        mtimeMs: Math.floor(stats.mtimeMs),
        ctimeMs: Math.floor(stats.birthtimeMs || stats.ctimeMs),
        category: detectCategory(ext),
        sha256: null
      })

      notifyChange()
      fileHashQueue.enqueueCandidate(filePath, true)
    } catch (err) {
      console.error('Dosya değişim izleme hatası:', filePath, err)
    }
  })

  watcherInstance.on('unlink', (filePath) => {
    removeFileRecord(filePath)
    notifyChange()
  })

  fileHashQueue.setUpdateCallback(() => {
    notifyChange()
  })
}

export function stopWatcher(): void {
  if (watcherInstance) {
    watcherInstance.close()
    watcherInstance = null
  }
}

