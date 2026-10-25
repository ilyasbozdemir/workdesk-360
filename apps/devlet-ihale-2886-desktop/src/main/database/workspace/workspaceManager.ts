import { shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { DtmWorkspace } from './DtmWorkspace'

let activeWorkspace: DtmWorkspace | null = null
let debouncedSaveTimer: NodeJS.Timeout | null = null

export const workspaceManager = {
  create: (filePath: string, institutionName: string) => {
    workspaceManager.flushSave()
    if (activeWorkspace) activeWorkspace.closeWorkspace()
    activeWorkspace = new DtmWorkspace()
    return activeWorkspace.createWorkspace(filePath, institutionName)
  },
  open: (filePath: string, allowMigration: boolean = false) => {
    workspaceManager.flushSave()
    if (activeWorkspace) activeWorkspace.closeWorkspace()
    activeWorkspace = new DtmWorkspace()
    return activeWorkspace.openWorkspace(filePath, allowMigration)
  },
  save: (force: boolean = false) => {
    if (debouncedSaveTimer) {
      clearTimeout(debouncedSaveTimer)
      debouncedSaveTimer = null
    }
    if (activeWorkspace) activeWorkspace.saveWorkspace(force)
  },
  saveDebounced: (delayMs: number = 1000, force: boolean = false) => {
    if (debouncedSaveTimer) {
      clearTimeout(debouncedSaveTimer)
    }
    debouncedSaveTimer = setTimeout(() => {
      debouncedSaveTimer = null
      if (activeWorkspace && activeWorkspace.isDirtyState()) {
        try {
          activeWorkspace.saveWorkspace(force)
        } catch (err) {
          console.error('[workspaceManager] saveDebounced hatası:', err)
        }
      }
    }, delayMs)
  },
  flushSave: (force: boolean = false) => {
    if (debouncedSaveTimer) {
      clearTimeout(debouncedSaveTimer)
      debouncedSaveTimer = null
    }
    if (activeWorkspace && activeWorkspace.isDirtyState()) {
      activeWorkspace.saveWorkspace(force)
    }
  },
  saveAs: (targetFilePath: string) => {
    if (!activeWorkspace) return { success: false, error: 'Açık bir çalışma alanı yok.' }
    if (debouncedSaveTimer) {
      clearTimeout(debouncedSaveTimer)
      debouncedSaveTimer = null
    }
    return activeWorkspace.saveAs(targetFilePath)
  },
  recordMutation: (tableName?: string, action?: string, count: number = 1) => {
    if (count <= 0) return
    if (activeWorkspace) activeWorkspace.recordMutation(tableName, action, count)
  },
  getDirtySummary: () => {
    if (!activeWorkspace) {
      return { isDirty: false, totalChanges: 0, lastModifiedAt: null, items: [] }
    }
    return activeWorkspace.getDirtySummary()
  },
  isDirty: () => {
    if (!activeWorkspace) return false
    return activeWorkspace.isDirtyState()
  },
  resetDirty: () => {
    if (activeWorkspace) activeWorkspace.resetDirty()
  },
  hasChanges: (target?: 'gdrive' | 'email' | 'any') => {
    if (!activeWorkspace) return false
    return activeWorkspace.hasChanges(target)
  },
  markSynced: (target: 'gdrive' | 'email') => {
    if (!activeWorkspace) return
    activeWorkspace.markSynced(target)
  },
  getCurrentHash: () => {
    if (!activeWorkspace) return ''
    return activeWorkspace.calculateCurrentHash()
  },
  close: () => {
    workspaceManager.flushSave()
    if (activeWorkspace) {
      activeWorkspace.closeWorkspace()
      activeWorkspace = null
    }
  },
  isOpen: () => {
    return !!activeWorkspace && activeWorkspace.isOpen()
  },
  getDb: () => {
    if (!activeWorkspace) throw new Error('Açık bir veri dosyası yok.')
    return activeWorkspace.getDb()
  },
  getMeta: () => {
    if (!activeWorkspace) return null
    return activeWorkspace.getMeta()
  },
  getCurrentFilePath: () => {
    if (!activeWorkspace) return null
    return activeWorkspace.getCurrentFilePath()
  },
  getDbPath: () => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    return activeWorkspace.getDbPath()
  },
  replaceDatabase: (sourceSqlitePath: string) => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    activeWorkspace.replaceDatabase(sourceSqlitePath)
  },
  getDatabaseSchema: () => {
    if (!activeWorkspace) return null
    try {
      const db = activeWorkspace.getDb()
      const tables = db
        .prepare(
          "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        .all() as { name: string; sql: string }[]
      return tables.map((t) => t.sql).join('\n\n')
    } catch {
      return null
    }
  },
  uploadAttachment: (sourcePath: string) => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    if (typeof sourcePath !== 'string' || !sourcePath.trim()) {
      throw new Error('Geçersiz kaynak dosya yolu.')
    }
    const resolvedSource = path.resolve(sourcePath)
    if (!fs.existsSync(resolvedSource) || !fs.statSync(resolvedSource).isFile()) {
      throw new Error('Kaynak dosya bulunamadı veya geçerli bir dosya değil.')
    }

    const tempDir = (activeWorkspace as any).tempDir
    if (!tempDir) throw new Error('Geçici çalışma dizini bulunamadı.')

    const attachmentsDir = path.join(tempDir, 'attachments')
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true })
    }

    const fileExt = path.extname(resolvedSource)
    const baseName = path.basename(resolvedSource, fileExt)
    const safeName = `${baseName}_${Date.now()}${fileExt}`.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const destPath = path.join(attachmentsDir, safeName)

    fs.copyFileSync(resolvedSource, destPath)
    activeWorkspace.recordMutation()
    activeWorkspace.saveWorkspace()
    return { fileName: safeName, relativePath: `attachments/${safeName}` }
  },
  openAttachment: async (relativePath: string) => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    if (typeof relativePath !== 'string' || !relativePath.trim()) {
      throw new Error('Geçersiz ek dosya yolu.')
    }
    const tempDir = (activeWorkspace as any).tempDir
    if (!tempDir) throw new Error('Geçici çalışma dizini bulunamadı.')

    const resolvedTemp = path.resolve(tempDir)
    const fullPath = path.resolve(tempDir, relativePath)
    if (fullPath !== resolvedTemp && !fullPath.startsWith(resolvedTemp + path.sep)) {
      throw new Error('Geçersiz dosya yolu (path traversal engellendi).')
    }

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      await shell.openPath(fullPath)
      return true
    }
    return false
  }
}

// Ensure lock is cleared if the process exits
process.on('exit', () => {
  if (activeWorkspace) {
    try {
      activeWorkspace.closeWorkspace()
    } catch {
      /* ignore exit cleanup error */
    }
  }
})
