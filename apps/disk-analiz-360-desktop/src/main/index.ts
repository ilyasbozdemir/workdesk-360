/**
 * <summary>
 * Disk Analiz 360 & Arşiv 360 — Electron Ana Süreç (Main Process),
 * Native Python Görev Yöneticisi (scanner.py, birlestir.py, inventory_cli.py) ve Tip Güvenli IPC Köprüsü.
 * </summary>
 */

import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, extname, basename } from 'path'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { DiskAnalyzerStorage } from './modules/storage.js'
import { discoverSystemDrives } from './modules/disk-discovery.js'
import { runDiskScan } from './modules/scanner.js'
import { runDuplicateDetectionPipeline } from './modules/duplicate-detector.js'
import { executeSafeTrashCleanup, isProtectedSystemPath } from './modules/cleanup.js'
import {
  CleanupExecutionItemRequest,
  DiskAnalyzerSettings,
  ExplorerDirectoryResponse,
  ExplorerSubfolderInfo,
  PythonMigrationReports
} from '../shared/types.js'

let mainWindow: BrowserWindow | null = null
let storage: DiskAnalyzerStorage | null = null
let activeScanAbortController: AbortController | null = null
const activePythonProcesses = new Map<string, ChildProcess>()

function resolvePythonScriptDir(): string {
  const candidates = [
    join(__dirname, '../..'),
    process.cwd(),
    join(process.cwd(), 'apps/disk-analiz-360-desktop')
  ]
  for (const dir of candidates) {
    if (fs.existsSync(join(dir, 'scanner.py'))) {
      return dir
    }
  }
  return join(__dirname, '../..')
}

const SCRIPT_DIR = resolvePythonScriptDir()
const TAGS_DB_PATH = join(SCRIPT_DIR, '.arsiv360_tags.json')
const VIRTUAL_FOLDERS_DB_PATH = join(SCRIPT_DIR, '.arsiv360_virtual_folders.json')

function loadTagsDb(): Record<string, string[]> {
  try {
    if (fs.existsSync(TAGS_DB_PATH)) {
      return JSON.parse(fs.readFileSync(TAGS_DB_PATH, 'utf-8'))
    }
  } catch (e) {
    console.error('Error loading tags DB:', e)
  }
  return {}
}

function saveTagsDb(data: Record<string, string[]>): void {
  try {
    fs.writeFileSync(TAGS_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving tags DB:', e)
  }
}

function getDefaultVirtualFolders(): Array<{
  id: string
  name: string
  color: string
  description?: string
  filePaths: string[]
  isSmart?: boolean
  smartRule?: string
  createdAt: string
  updatedAt: string
}> {
  return [
    {
      id: 'vf-important',
      name: 'Önemli Belgeler',
      color: '#f59e0b',
      description: 'Sık kullanılan ve öncelikli belgeler koleksiyonu',
      filePaths: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'vf-tenders',
      name: 'İhale & Satınalma',
      color: '#0284c7',
      description: 'Doğrudan temin ve ihale süreçlerine ilişkin şartnameler ve sözleşmeler',
      filePaths: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'vf-archive-2026',
      name: '2026 Arşivi',
      color: '#10b981',
      description: '2026 mali yılına ait resmi evrak ve yazışmalar',
      filePaths: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

function loadVirtualFoldersDb(): Array<{
  id: string
  name: string
  color: string
  description?: string
  filePaths: string[]
  isSmart?: boolean
  smartRule?: string
  createdAt: string
  updatedAt: string
}> {
  try {
    if (fs.existsSync(VIRTUAL_FOLDERS_DB_PATH)) {
      return JSON.parse(fs.readFileSync(VIRTUAL_FOLDERS_DB_PATH, 'utf-8'))
    }
  } catch (e) {
    console.error('Error loading virtual folders DB:', e)
  }
  const defaults = getDefaultVirtualFolders()
  saveVirtualFoldersDb(defaults)
  return defaults
}

function saveVirtualFoldersDb(data: unknown): void {
  try {
    fs.writeFileSync(VIRTUAL_FOLDERS_DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error saving virtual folders DB:', e)
  }
}

export function extractInlineTags(filename: string): { cleanName: string; tags: string[] } {
  const tags = new Set<string>()
  let cleanName = filename

  const bracketRegex = /\[([^\]]+)\]/g
  let match: RegExpExecArray | null
  while ((match = bracketRegex.exec(filename)) !== null) {
    const parts = match[1].split(/[,\s]+/).filter(Boolean)
    parts.forEach((p) => tags.add(p.toLowerCase()))
  }

  const hashRegex = /#([a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ-]+)/g
  while ((match = hashRegex.exec(filename)) !== null) {
    tags.add(match[1].toLowerCase())
  }

  const lower = filename.toLowerCase()
  if (lower.includes('ihale') || lower.includes('sartname') || lower.includes('yaklasik'))
    tags.add('ihale')
  if (lower.includes('dogrudan') || lower.includes('temin')) tags.add('temin360')
  if (lower.includes('hakedis') || lower.includes('metraj') || lower.includes('kesif'))
    tags.add('hakedis')
  if (lower.includes('imar') || lower.includes('parsel') || lower.includes('ada'))
    tags.add('imar')
  if (lower.includes('kamulastirma') || lower.includes('istimlak')) tags.add('kamulastirma')
  if (lower.includes('encumen') || lower.includes('meclis') || lower.includes('karar'))
    tags.add('karar')
  if (lower.includes('ruhsat') || lower.includes('iskan')) tags.add('ruhsat')
  if (lower.includes('kira') || lower.includes('tahsis') || lower.includes('ecrimisil'))
    tags.add('tasinmaz')
  if (lower.endsWith('.dwg') || lower.endsWith('.dxf') || lower.endsWith('.ncz'))
    tags.add('cad-harita')
  if (lower.endsWith('.pdf')) tags.add('pdf')
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) tags.add('excel')
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) tags.add('word')

  cleanName = cleanName
    .replace(/\[[^\]]+\]/g, '')
    .replace(/#[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ-]+/g, '')
    .trim()
  if (!cleanName) cleanName = filename

  return { cleanName, tags: Array.from(tags) }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    title:
      'Disk Analiz 360 & Arşiv 360 — Native Python Motoru, Semantik Gezgin, Treemap ve Güvenli Temizlik',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('dev.ilyasbozdemir.diskanaliz360')

  const userDataDir = app.getPath('userData')
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true })
  }
  const dbPath = join(userDataDir, 'disk-analiz-360.db')
  storage = new DiskAnalyzerStorage(dbPath)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ==========================================================================
  // 1. DİSK ANALİZ 360 — SQLITE İNDEKS, TREEMAP VE GÜVENLİ TEMİZLİK IPC HANDLERS
  // ==========================================================================

  ipcMain.handle('diskAnaliz:getDrives', () => {
    return discoverSystemDrives()
  })

  ipcMain.handle('diskAnaliz:selectFolderDialog', async () => {
    if (!mainWindow) return null
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Taranacak Klasörü veya Sürücüyü Seçin',
      properties: ['openDirectory', 'dontAddToRecent']
    })
    if (res.canceled || res.filePaths.length === 0) return null
    return res.filePaths[0]
  })

  ipcMain.handle(
    'diskAnaliz:startScan',
    async (_, params: { rootPath: string; detectDuplicates?: boolean }) => {
      if (!storage) throw new Error('Veritabanı hazır değil.')
      if (activeScanAbortController) {
        activeScanAbortController.abort()
      }

      const controller = new AbortController()
      activeScanAbortController = controller

      try {
        const session = await runDiskScan(storage, {
          rootPath: params.rootPath,
          detectDuplicates: params.detectDuplicates ?? true,
          signal: controller.signal,
          onProgress: (progress) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('diskAnaliz:scanProgress', progress)
            }
          }
        })
        return session
      } finally {
        if (activeScanAbortController === controller) {
          activeScanAbortController = null
        }
      }
    }
  )

  ipcMain.handle('diskAnaliz:cancelScan', () => {
    if (activeScanAbortController) {
      activeScanAbortController.abort()
      activeScanAbortController = null
      return { cancelled: true }
    }
    return { cancelled: false }
  })

  ipcMain.handle('diskAnaliz:getDashboardSummary', (_, rootPath?: string) => {
    return storage?.getAnalysisDashboardSummary(rootPath) || null
  })

  ipcMain.handle(
    'diskAnaliz:getTreemapView',
    (_, params: { rootPath: string; folderPath?: string }) => {
      return storage?.getTreemapView(params.rootPath, params.folderPath) || null
    }
  )

  ipcMain.handle('diskAnaliz:searchFiles', (_, params) => {
    return storage?.searchFiles(params || {}) || []
  })

  ipcMain.handle('diskAnaliz:getDuplicates', (_, rootPath?: string) => {
    return (
      storage?.getVerifiedDuplicates(rootPath) || {
        totalGroups: 0,
        totalDuplicateFiles: 0,
        totalRecoverableBytes: 0,
        groups: []
      }
    )
  })

  ipcMain.handle('diskAnaliz:runDuplicateCheck', async (_, rootPath?: string) => {
    if (!storage) throw new Error('Veritabanı hazır değil.')
    return await runDuplicateDetectionPipeline(storage, { rootPath })
  })

  ipcMain.handle('diskAnaliz:getCleanupCandidates', (_, rootPath?: string) => {
    return storage?.getCleanupCandidateGroups(rootPath) || []
  })

  ipcMain.handle(
    'diskAnaliz:executeTrashCleanup',
    async (_, requests: CleanupExecutionItemRequest[]) => {
      if (!storage) throw new Error('Veritabanı hazır değil.')
      return await executeSafeTrashCleanup(storage, requests, {
        trashItemFn: async (targetPath: string) => {
          await shell.trashItem(targetPath)
        },
        allowDeleteLastCopy: false
      })
    }
  )

  ipcMain.handle('diskAnaliz:getCleanupHistory', (_, limit?: number) => {
    return storage?.getCleanupHistory(limit || 100) || []
  })

  ipcMain.handle('diskAnaliz:getScanSessions', (_, limit?: number) => {
    return storage?.getScanSessions(limit || 25) || []
  })

  ipcMain.handle('diskAnaliz:getScanErrors', (_, sessionId?: string) => {
    return storage?.getScanErrors(sessionId, 150) || []
  })

  ipcMain.handle('diskAnaliz:getSettings', () => {
    return storage?.getSettings()
  })

  ipcMain.handle('diskAnaliz:updateSettings', (_, updates: Partial<DiskAnalyzerSettings>) => {
    return storage?.updateSettings(updates)
  })

  ipcMain.handle('diskAnaliz:showInFolder', (_, targetPath: string) => {
    if (targetPath && fs.existsSync(targetPath)) {
      shell.showItemInFolder(targetPath)
      return true
    }
    return false
  })

  // ==========================================================================
  // 2. ARŞİV 360 & DİZİN-RAPOR — AKILLI DOSYA GEZGİNİ, ETİKETLEME & NATIVE PYTHON MOTORU
  // ==========================================================================

  ipcMain.handle(
    'diskAnaliz:listDirectory',
    async (
      _event,
      dirPath: string,
      options?: { maxDepth?: number }
    ): Promise<ExplorerDirectoryResponse> => {
      try {
        const targetDir = dirPath || SCRIPT_DIR
        if (!fs.existsSync(targetDir)) {
          return {
            success: false,
            message: `Klasör bulunamadı: ${targetDir}`,
            items: [],
            subfolders: []
          }
        }

        const tagsDb = loadTagsDb()
        const maxDepth = options?.maxDepth ?? 2
        const maxItems = 2500

        const items: NonNullable<ExplorerDirectoryResponse['items']> = []
        const subfolders: ExplorerSubfolderInfo[] = []

        const skipDirs = new Set([
          'node_modules',
          '.git',
          'dist',
          'out',
          '__pycache__',
          '$recycle.bin',
          'system volume information',
          '.gemini'
        ])

        function scanDir(currentPath: string, depth: number): void {
          if (depth > maxDepth || items.length >= maxItems) return
          let entries: fs.Dirent[] = []
          try {
            entries = fs.readdirSync(currentPath, { withFileTypes: true })
          } catch {
            return
          }

          for (const entry of entries) {
            if (items.length >= maxItems) break
            if (entry.name.startsWith('.')) continue

            const fullPath = join(currentPath, entry.name)
            if (entry.isDirectory()) {
              if (skipDirs.has(entry.name.toLowerCase())) continue

              if (depth === 1) {
                let childCount = 0
                try {
                  childCount = fs
                    .readdirSync(fullPath)
                    .filter((n) => !n.startsWith('.')).length
                } catch {}
                subfolders.push({
                  name: entry.name,
                  path: fullPath,
                  fileCount: childCount
                })
              }

              scanDir(fullPath, depth + 1)
            } else if (entry.isFile()) {
              try {
                const stats = fs.statSync(fullPath)
                const { cleanName, tags: inlineTags } = extractInlineTags(entry.name)
                const storedTags = tagsDb[fullPath] || []
                const mergedTags = Array.from(new Set([...inlineTags, ...storedTags]))

                items.push({
                  name: entry.name,
                  cleanName,
                  path: fullPath,
                  isDirectory: false,
                  size: stats.size,
                  ext: extname(entry.name).toLowerCase(),
                  mtime: stats.mtime.toISOString(),
                  tags: mergedTags
                })
              } catch {}
            }
          }
        }

        scanDir(targetDir, 1)

        return {
          success: true,
          targetDir,
          items,
          subfolders,
          totalCount: items.length
        }
      } catch (error: unknown) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
          items: [],
          subfolders: []
        }
      }
    }
  )

  ipcMain.handle('diskAnaliz:openFile', async (_event, filePath: string) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        await shell.openPath(filePath)
        return { success: true }
      }
      return { success: false, message: 'Dosya bulunamadı' }
    } catch (error: unknown) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      }
    }
  })

  ipcMain.handle(
    'diskAnaliz:addFileTag',
    async (_event, { filePath, tag }: { filePath: string; tag: string }) => {
      const db = loadTagsDb()
      const current = new Set(db[filePath] || [])
      current.add(tag.toLowerCase().trim())
      db[filePath] = Array.from(current)
      saveTagsDb(db)
      return { success: true, tags: db[filePath] }
    }
  )

  ipcMain.handle(
    'diskAnaliz:removeFileTag',
    async (_event, { filePath, tag }: { filePath: string; tag: string }) => {
      const db = loadTagsDb()
      const current = new Set(db[filePath] || [])
      current.delete(tag.toLowerCase().trim())
      db[filePath] = Array.from(current)
      saveTagsDb(db)
      return { success: true, tags: db[filePath] }
    }
  )

  ipcMain.handle(
    'diskAnaliz:bulkTagFiles',
    async (
      _event,
      {
        filePaths,
        tagsToAdd = [],
        tagsToRemove = []
      }: {
        filePaths: string[]
        tagsToAdd?: string[]
        tagsToRemove?: string[]
      }
    ) => {
      const db = loadTagsDb()
      let updatedCount = 0

      for (const p of filePaths) {
        const cur = new Set(db[p] || [])
        for (const t of tagsToAdd) {
          if (t && t.trim()) cur.add(t.toLowerCase().trim())
        }
        for (const t of tagsToRemove) {
          if (t && t.trim()) cur.delete(t.toLowerCase().trim())
        }
        db[p] = Array.from(cur)
        updatedCount++
      }

      saveTagsDb(db)
      return { success: true, updatedCount }
    }
  )

  ipcMain.handle('diskAnaliz:getVirtualFolders', async () => {
    return loadVirtualFoldersDb()
  })

  ipcMain.handle('diskAnaliz:saveVirtualFolders', async (_event, folders: unknown) => {
    saveVirtualFoldersDb(folders)
    return { success: true }
  })

  ipcMain.handle(
    'diskAnaliz:readFilePreview',
    async (_event, { filePath, maxBytes = 64 * 1024 }: { filePath: string; maxBytes?: number }) => {
      try {
        if (!filePath || !fs.existsSync(filePath)) {
          return {
            success: false,
            filePath,
            fileName: '',
            fileSize: 0,
            mtime: '',
            category: 'binary' as const,
            error: 'Dosya bulunamadı'
          }
        }

        const stats = fs.statSync(filePath)
        const name = basename(filePath)
        const ext = extname(filePath).toLowerCase()

        const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.ico'])
        const textExts = new Set([
          '.txt',
          '.md',
          '.json',
          '.csv',
          '.tsv',
          '.xml',
          '.html',
          '.js',
          '.ts',
          '.jsx',
          '.tsx',
          '.py',
          '.sql',
          '.log',
          '.ini',
          '.yaml',
          '.yml',
          '.env'
        ])

        if (imageExts.has(ext)) {
          if (stats.size > 20 * 1024 * 1024) {
            return {
              success: true,
              filePath,
              fileName: name,
              fileSize: stats.size,
              mtime: stats.mtime.toISOString(),
              category: 'image' as const,
              error: 'Büyük görsel (20 MB üzeri), bellek koruması nedeniyle tam önizlenmiyor.'
            }
          }
          const buffer = fs.readFileSync(filePath)
          const mimeType = ext === '.svg' ? 'image/svg+xml' : `image/${ext.replace('.', '')}`
          const previewUrl = `data:${mimeType};base64,${buffer.toString('base64')}`
          return {
            success: true,
            filePath,
            fileName: name,
            fileSize: stats.size,
            mtime: stats.mtime.toISOString(),
            category: 'image' as const,
            previewUrl
          }
        }

        if (textExts.has(ext)) {
          const limit = Math.min(stats.size, maxBytes)
          const fd = fs.openSync(filePath, 'r')
          const buf = Buffer.alloc(limit)
          fs.readSync(fd, buf, 0, limit, 0)
          fs.closeSync(fd)
          const textContent = buf.toString('utf-8')
          const lineCount = textContent.split('\n').length
          return {
            success: true,
            filePath,
            fileName: name,
            fileSize: stats.size,
            mtime: stats.mtime.toISOString(),
            category: 'text' as const,
            textContent,
            lineCount
          }
        }

        if (ext === '.pdf') {
          return {
            success: true,
            filePath,
            fileName: name,
            fileSize: stats.size,
            mtime: stats.mtime.toISOString(),
            category: 'pdf' as const
          }
        }

        return {
          success: true,
          filePath,
          fileName: name,
          fileSize: stats.size,
          mtime: stats.mtime.toISOString(),
          category: 'binary' as const
        }
      } catch (err: unknown) {
        return {
          success: false,
          filePath,
          fileName: basename(filePath || ''),
          fileSize: 0,
          mtime: '',
          category: 'binary' as const,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  ipcMain.handle(
    'diskAnaliz:runPythonTask',
    async (
      event,
      { taskId, scriptName, args = [] }: { taskId: string; scriptName: string; args: string[] }
    ) => {
      if (activePythonProcesses.has(taskId)) {
        return { success: false, message: 'Bu görev zaten çalışıyor.' }
      }

      const scriptPath = join(SCRIPT_DIR, scriptName)
      if (!fs.existsSync(scriptPath)) {
        return { success: false, message: `Python betiği bulunamadı: ${scriptPath}` }
      }

      try {
        const pyProcess = spawn('python', ['-u', scriptPath, ...args], {
          cwd: SCRIPT_DIR,
          env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
            PYTHONUNBUFFERED: '1'
          }
        })

        activePythonProcesses.set(taskId, pyProcess)

        pyProcess.stdout.on('data', (data) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('diskAnaliz:pythonOutput', {
              taskId,
              type: 'stdout',
              text: data.toString('utf-8')
            })
          }
        })

        pyProcess.stderr.on('data', (data) => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('diskAnaliz:pythonOutput', {
              taskId,
              type: 'stderr',
              text: data.toString('utf-8')
            })
          }
        })

        pyProcess.on('close', (code) => {
          activePythonProcesses.delete(taskId)
          if (!event.sender.isDestroyed()) {
            event.sender.send('diskAnaliz:pythonExit', {
              taskId,
              code
            })
          }
        })

        return { success: true, pid: pyProcess.pid }
      } catch (err: unknown) {
        return {
          success: false,
          message: err instanceof Error ? err.message : String(err)
        }
      }
    }
  )

  ipcMain.handle('diskAnaliz:stopPythonTask', async (_event, { taskId }: { taskId: string }) => {
    const proc = activePythonProcesses.get(taskId)
    if (proc) {
      proc.kill()
      activePythonProcesses.delete(taskId)
      return { success: true }
    }
    return { success: false, message: 'Çalışan görev bulunamadı.' }
  })

  ipcMain.handle('diskAnaliz:getMigrationReports', async (): Promise<PythonMigrationReports> => {
    const reports: PythonMigrationReports = {}
    try {
      const dupJson = join(SCRIPT_DIR, 'duplicate_report.json')
      if (fs.existsSync(dupJson)) {
        reports.duplicate = JSON.parse(fs.readFileSync(dupJson, 'utf-8'))
      }
      const migJson = join(SCRIPT_DIR, 'migration_plan.json')
      if (fs.existsSync(migJson)) {
        reports.migration = JSON.parse(fs.readFileSync(migJson, 'utf-8'))
      }
    } catch (err) {
      console.error('Error reading reports:', err)
    }
    return reports
  })

  ipcMain.handle('diskAnaliz:checkFilesExist', async (_event, filePaths: string[]) => {
    const result: Record<string, boolean> = {}
    if (!Array.isArray(filePaths)) return result
    for (const fp of filePaths) {
      try {
        result[fp] = fs.existsSync(fp)
      } catch {
        result[fp] = false
      }
    }
    return result
  })

  ipcMain.handle(
    'diskAnaliz:moveFiles',
    async (
      _event,
      { filePaths, destinationFolder }: { filePaths: string[]; destinationFolder?: string }
    ) => {
      let successCount = 0
      let failCount = 0
      const errors: { path: string; error: string }[] = []

      for (const src of filePaths) {
        try {
          const check = isProtectedSystemPath(src)
          if (check.protected) {
            failCount++
            errors.push({
              path: src,
              error: `Sistem koruması: ${check.reason || 'Kritik yol'}`
            })
            continue
          }

          if (!fs.existsSync(src)) {
            failCount++
            errors.push({ path: src, error: 'Dosya bulunamadı' })
            continue
          }

          let destDir = destinationFolder
          if (!destDir) {
            const winSrc = src.replace(/\//g, '\\')
            const driveMatch = winSrc.match(/^([a-zA-Z]:)\\?(.*)$/)
            const drive = driveMatch ? driveMatch[1].toUpperCase() : 'C:'
            const relPath = driveMatch ? driveMatch[2].replace(/^\\+/, '') : ''
            const lastSlash = relPath.lastIndexOf('\\')
            const relDir = lastSlash >= 0 ? relPath.slice(0, lastSlash) : ''
            destDir = relDir
              ? join(`${drive}\\`, '_SILINECEK_KOPYALAR', relDir)
              : join(`${drive}\\`, '_SILINECEK_KOPYALAR')
          }

          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true })
          }

          const fileName = basename(src)
          const ext = extname(fileName)
          const nameWithoutExt = basename(fileName, ext)
          let destPath = join(destDir, fileName)
          let collisionIdx = 1

          while (fs.existsSync(destPath)) {
            destPath = join(destDir, `${nameWithoutExt}_karantina_${collisionIdx}${ext}`)
            collisionIdx++
          }

          try {
            fs.renameSync(src, destPath)
          } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code === 'EXDEV') {
              fs.copyFileSync(src, destPath, fs.constants.COPYFILE_EXCL)
              fs.unlinkSync(src)
            } else {
              throw e
            }
          }

          successCount++
        } catch (err: unknown) {
          failCount++
          errors.push({
            path: src,
            error: err instanceof Error ? err.message : String(err)
          })
        }
      }

      return {
        success: failCount === 0,
        successCount,
        failCount,
        errors,
        targetFolder: destinationFolder
      }
    }
  )

  ipcMain.handle(
    'diskAnaliz:deleteFiles',
    async (
      _event,
      { filePaths, useRecycleBin = true }: { filePaths: string[]; useRecycleBin?: boolean }
    ) => {
      let successCount = 0
      let failCount = 0
      const errors: { path: string; error: string }[] = []

      for (const src of filePaths) {
        try {
          const check = isProtectedSystemPath(src)
          if (check.protected) {
            failCount++
            errors.push({
              path: src,
              error: `Sistem koruması: ${check.reason || 'Kritik yol'}`
            })
            continue
          }

          if (!fs.existsSync(src)) {
            failCount++
            errors.push({ path: src, error: 'Dosya bulunamadı' })
            continue
          }

          if (useRecycleBin) {
            await shell.trashItem(src)
          } else {
            fs.unlinkSync(src)
          }
          successCount++
        } catch (err: unknown) {
          failCount++
          errors.push({
            path: src,
            error: err instanceof Error ? err.message : String(err)
          })
        }
      }

      return { success: failCount === 0, successCount, failCount, errors }
    }
  )

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  if (activeScanAbortController) {
    activeScanAbortController.abort()
  }
  for (const [, proc] of activePythonProcesses.entries()) {
    try {
      proc.kill()
    } catch {}
  }
  activePythonProcesses.clear()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
