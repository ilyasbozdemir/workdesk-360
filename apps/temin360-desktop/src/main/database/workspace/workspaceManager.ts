import { shell } from 'electron'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { DtmWorkspace } from './DtmWorkspace'

let activeWorkspace: DtmWorkspace | null = null
let debouncedSaveTimer: NodeJS.Timeout | null = null

export const workspaceManager = {
  create: (filePath: string, institutionName: string, adminUsername?: string) => {
    workspaceManager.flushSave()
    if (activeWorkspace) activeWorkspace.closeWorkspace()
    activeWorkspace = new DtmWorkspace()
    return activeWorkspace.createWorkspace(filePath, institutionName, adminUsername)
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
    if (activeWorkspace) {
      if (activeWorkspace.isReadOnlyState()) return
      activeWorkspace.saveWorkspace(force)
    }
  },
  saveDebounced: (delayMs: number = 1000, force: boolean = false) => {
    if (debouncedSaveTimer) {
      clearTimeout(debouncedSaveTimer)
    }
    debouncedSaveTimer = setTimeout(() => {
      debouncedSaveTimer = null
      if (activeWorkspace && activeWorkspace.isDirtyState()) {
        if (activeWorkspace.isReadOnlyState()) return
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
      if (activeWorkspace.isReadOnlyState()) return
      activeWorkspace.saveWorkspace(force)
    }
  },
  isReadOnly: () => {
    if (!activeWorkspace) return false
    return activeWorkspace.isReadOnlyState()
  },
  isTampered: () => {
    if (!activeWorkspace) return false
    return activeWorkspace.isTamperedState()
  },
  getSessionStatus: () => {
    if (!activeWorkspace) return { isReadOnly: false, isTampered: false }
    return activeWorkspace.getSessionStatus()
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
  uploadAttachment: (
    sourcePath: string,
    options?: { teminNo?: string; mirrorToProjectDir?: boolean }
  ) => {
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

    // Kullanıcının isteği: Projenin bulunduğu dizinde dosya/temin adıyla klasör açıp PDF kopyasını saklama
    let mirroredPath: string | null = null
    const currentFilePath = activeWorkspace.getCurrentFilePath()
    if (currentFilePath && options?.mirrorToProjectDir !== false) {
      try {
        const projectDir = path.dirname(currentFilePath)
        const projectBaseName = path.basename(currentFilePath, path.extname(currentFilePath))
        const folderName = options?.teminNo
          ? `${options.teminNo.replace(/[/\\:*?"<>|]/g, '_')}_Belgeler`
          : `${projectBaseName}_Belgeler`
        const localDocDir = path.join(projectDir, folderName)
        if (!fs.existsSync(localDocDir)) {
          fs.mkdirSync(localDocDir, { recursive: true })
        }
        mirroredPath = path.join(localDocDir, `${baseName}${fileExt}`)
        fs.copyFileSync(resolvedSource, mirroredPath)
      } catch (mirrorErr) {
        console.warn('[workspaceManager] Yerel dizine belge aynalama uyarısı:', mirrorErr)
      }
    }

    activeWorkspace.recordMutation()
    activeWorkspace.saveWorkspace()
    return { fileName: safeName, relativePath: `attachments/${safeName}`, mirroredPath }
  },
  uploadAttachmentBuffer: (
    buffer: Buffer,
    fileName: string,
    options?: { teminNo?: string; mirrorToProjectDir?: boolean }
  ) => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    if (!buffer || buffer.length === 0) {
      throw new Error('Dosya içeriği boş veya geçersiz.')
    }
    const tempDir = (activeWorkspace as any).tempDir
    if (!tempDir) throw new Error('Geçici çalışma dizini bulunamadı.')

    const attachmentsDir = path.join(tempDir, 'attachments')
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true })
    }

    const fileExt = path.extname(fileName) || '.pdf'
    const baseName = path.basename(fileName, fileExt)
    const safeName = `${baseName}_${Date.now()}${fileExt}`.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const destPath = path.join(attachmentsDir, safeName)

    fs.writeFileSync(destPath, buffer)

    let mirroredPath: string | null = null
    const currentFilePath = activeWorkspace.getCurrentFilePath()
    if (currentFilePath && options?.mirrorToProjectDir !== false) {
      try {
        const projectDir = path.dirname(currentFilePath)
        const projectBaseName = path.basename(currentFilePath, path.extname(currentFilePath))
        const folderName = options?.teminNo
          ? `${options.teminNo.replace(/[/\\:*?"<>|]/g, '_')}_Belgeler`
          : `${projectBaseName}_Belgeler`
        const localDocDir = path.join(projectDir, folderName)
        if (!fs.existsSync(localDocDir)) {
          fs.mkdirSync(localDocDir, { recursive: true })
        }
        mirroredPath = path.join(localDocDir, `${baseName}${fileExt}`)
        fs.writeFileSync(mirroredPath, buffer)
      } catch (mirrorErr) {
        console.warn('[workspaceManager] Yerel dizine belge aynalama uyarısı:', mirrorErr)
      }
    }

    activeWorkspace.recordMutation('DATA_TeminBelge', 'INSERT')
    activeWorkspace.saveWorkspace()
    return { fileName: safeName, relativePath: `attachments/${safeName}`, mirroredPath }
  },
  deleteAttachment: (relativePath: string) => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    const tempDir = (activeWorkspace as any).tempDir
    if (!tempDir) throw new Error('Geçici çalışma dizini bulunamadı.')
    const resolvedTemp = path.resolve(tempDir)
    const fullPath = path.resolve(tempDir, relativePath)
    if (fullPath !== resolvedTemp && !fullPath.startsWith(resolvedTemp + path.sep)) {
      throw new Error('Geçersiz dosya yolu.')
    }
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
      } catch (unlinkErr) {
        console.warn('[workspaceManager] Ek dosya silinirken hata:', unlinkErr)
      }
    }
    activeWorkspace.recordMutation('DATA_TeminBelge', 'DELETE')
    activeWorkspace.saveWorkspace()
    return { success: true }
  },
  exportAttachmentsZip: async (targetPath?: string, teminNo?: string) => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    const tempDir = (activeWorkspace as any).tempDir
    if (!tempDir) throw new Error('Geçici çalışma dizini bulunamadı.')

    const attachmentsDir = path.join(tempDir, 'attachments')
    if (!fs.existsSync(attachmentsDir) || fs.readdirSync(attachmentsDir).length === 0) {
      throw new Error('Dosyada henüz yüklenmiş bir ek/belge bulunamadı.')
    }

    const currentFilePath = activeWorkspace.getCurrentFilePath()
    let destZip = targetPath
    if (!destZip && currentFilePath) {
      const projectDir = path.dirname(currentFilePath)
      const projectBaseName = path.basename(currentFilePath, path.extname(currentFilePath))
      const zipName = teminNo
        ? `${teminNo.replace(/[/\\:*?"<>|]/g, '_')}_Belgeler.zip`
        : `${projectBaseName}_Belgeler.zip`
      destZip = path.join(projectDir, zipName)
    }

    if (!destZip) {
      throw new Error('Hedef ZIP dosya yolu belirlenemedi.')
    }

    const zip = new AdmZip()
    zip.addLocalFolder(attachmentsDir)
    zip.writeZip(destZip)

    return { success: true, zipPath: destZip, count: fs.readdirSync(attachmentsDir).length }
  },
  openProjectAttachmentsFolder: async (teminNo?: string) => {
    if (!activeWorkspace) throw new Error('Açık bir çalışma dosyası yok.')
    const currentFilePath = activeWorkspace.getCurrentFilePath()
    if (!currentFilePath) throw new Error('Aktif bir proje dosyası açık değil.')

    const projectDir = path.dirname(currentFilePath)
    const projectBaseName = path.basename(currentFilePath, path.extname(currentFilePath))
    const folderName = teminNo
      ? `${teminNo.replace(/[/\\:*?"<>|]/g, '_')}_Belgeler`
      : `${projectBaseName}_Belgeler`
    const localDocDir = path.join(projectDir, folderName)

    if (!fs.existsSync(localDocDir)) {
      fs.mkdirSync(localDocDir, { recursive: true })
    }

    await shell.openPath(localDocDir)
    return { success: true, folderPath: localDocDir }
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
  },
  readAttachmentBase64: async (relativePath: string) => {
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
      const buffer = fs.readFileSync(fullPath)
      const base64 = buffer.toString('base64')
      const ext = path.extname(fullPath).toLowerCase().replace('.', '')
      const mimeType =
        ext === 'pdf'
          ? 'application/pdf'
          : ext === 'png'
            ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : 'application/octet-stream'
      return { base64, mimeType, size: buffer.length, fileName: path.basename(fullPath) }
    }
    // Destek: Eğer relativePath tam mutlak bir dosya yolu ise ve mevcutsa
    if (path.isAbsolute(relativePath) && fs.existsSync(relativePath) && fs.statSync(relativePath).isFile()) {
      const buffer = fs.readFileSync(relativePath)
      const base64 = buffer.toString('base64')
      const ext = path.extname(relativePath).toLowerCase().replace('.', '')
      const mimeType =
        ext === 'pdf'
          ? 'application/pdf'
          : ext === 'png'
            ? 'image/png'
            : ext === 'jpg' || ext === 'jpeg'
              ? 'image/jpeg'
              : 'application/octet-stream'
      return { base64, mimeType, size: buffer.length, fileName: path.basename(relativePath) }
    }
    return null
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
