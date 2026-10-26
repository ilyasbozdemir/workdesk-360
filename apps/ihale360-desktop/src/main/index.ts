import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  Tray,
  session,
  protocol,
  nativeImage,
  screen
} from 'electron'
import { join, basename, dirname, resolve, sep } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import mime from 'mime-types'
import fs from 'fs'
import { registerWindowsFileAssociations } from './platform/fileAssociations'
import { createSystemTray } from './platform/tray'
import { registerWindowIpcHandlers } from './ipc/window.ipc'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'dta-res',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

import iconPng from '../../resources/icon.png?asset'
import iconIco from '../../resources/icon.ico?asset'

const getIconFilePath = (): string | undefined => {
  try {
    const appDir = app.isReady() ? app.getAppPath() : process.cwd()
    const possiblePaths = [
      join(__dirname, '../../resources/icon.ico'),
      join(__dirname, '../../resources/icon.png'),
      join(appDir, 'resources', 'icon.ico'),
      join(appDir, 'resources', 'icon.png'),
      join(process.resourcesPath, 'icon.ico'),
      join(process.resourcesPath, 'icon.png'),
      join(process.resourcesPath, 'resources', 'icon.ico'),
      join(process.resourcesPath, 'resources', 'icon.png'),
      iconIco,
      iconPng
    ].filter(Boolean) as string[]

    for (const p of possiblePaths) {
      if (typeof p === 'string' && fs.existsSync(p)) {
        return p
      }
    }
  } catch {}
  return iconIco || iconPng || undefined
}

const getAppIcon = (): Electron.NativeImage | undefined => {
  try {
    const iconPath = getIconFilePath()
    if (iconPath && fs.existsSync(iconPath)) {
      const img = nativeImage.createFromPath(iconPath)
      if (!img.isEmpty()) return img
    }
  } catch {}
  return undefined
}

// Windows Taskbar & Pinning için AppUserModelID kaydı
if (process.platform === 'win32') {
  try {
    app.setAppUserModelId(app.isPackaged ? 'dev.ilyasbozdemir.ihale360' : process.execPath)
  } catch {}
}

// Donanım Hızlandırma & Düşük Donanımlı Bilgisayarlar İçin Performans Optimizasyonları
try {
  app.commandLine.appendSwitch('enable-gpu-rasterization')
  app.commandLine.appendSwitch('enable-zero-copy')
  app.commandLine.appendSwitch('ignore-gpu-blocklist')
  app.commandLine.appendSwitch('enable-smooth-scrolling')
  app.commandLine.appendSwitch('high-dpi-support', '1')
} catch {}
import { workspaceManager } from './database/workspace'
import { CURRENT_SCHEMA_VERSION, manifests } from '@dt/database'
import nodemailer from 'nodemailer'
import { isSupportedFile } from './config/fileFormats'
import { recentFilesStore } from './store/recentFiles'
import { startServer, stopServer, getSocketServer } from './server'
import { connectToServer, disconnectFromServer, emitEvent } from './client'
import { generateContent, testConnection, AIGenerateOptions } from './ai/index'
import { renderPdfBuffer } from './pdfService'
import { renderDocxBuffer } from './docxService'
import { startExpressServer, stopExpressServer } from './network/expressServer'
import { registerAllIpcHandlers } from './ipc'
import { performAutoCloudSync } from './ipc/network.ipc'
import { TANIM_Placeholder } from '@dt/database'

let isForceQuitting = false

// --- LOG SYSTEM & USERDATA SETUP ---
const isMultiInstance = process.argv.includes('--multi-instance')
const rawInitialFilePath = process.argv.find((arg) => isSupportedFile(arg)) ?? null
const initialFilePath = rawInitialFilePath
  ? rawInitialFilePath.replace(/^"+|"+$/g, '').trim()
  : null

try {
  let userDataPath = app.getPath('userData')
  let changed = false

  if (is.dev) {
    userDataPath += '-dev'
    changed = true
  }

  if (isMultiInstance && initialFilePath) {
    let hash = 0
    const normalizedPath = join(initialFilePath)
    for (let i = 0; i < normalizedPath.length; i++) {
      hash = (hash << 5) - hash + normalizedPath.charCodeAt(i)
      hash |= 0
    }
    userDataPath += `-multi-${Math.abs(hash)}`
    changed = true
  }

  if (changed) {
    app.setPath('userData', userDataPath)
  }
} catch (e) {
  console.error('Failed to configure userData path:', e)
}

import { appLogger } from './logger'
appLogger.init()

const logDir = join(app.getPath('userData'), 'logs')
try {
  fs.mkdirSync(logDir, { recursive: true })
} catch (e) {}
const logPath = join(logDir, 'main.log')

export function writeLog(level: string, message: string, details?: any): void {
  const time = new Date().toISOString()
  const detailStr = details ? ` | Details: ${JSON.stringify(details)}` : ''
  const logLine = `[${time}] [${level}] ${message}${detailStr}\n`
  try {
    fs.appendFileSync(logPath, logLine, 'utf8')
  } catch (e) {}
}

writeLog('INFO', 'App startup initialized', {
  argv: process.argv,
  execPath: process.execPath,
  isPackaged: app.isPackaged,
  userData: app.getPath('userData')
})

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error)
  writeLog('ERROR', 'Uncaught Exception', {
    message: error?.message,
    stack: error?.stack
  })
})

let tray: Tray | null = null
const secondaryWindows = new Set<BrowserWindow>()
const dosyaWindows = new Map<number, BrowserWindow>()

function closeAllSecondaryWindows(): void {
  const copy = Array.from(secondaryWindows)
  for (const win of copy) {
    if (!win.isDestroyed()) win.close()
  }
  secondaryWindows.clear()

  const dCopy = Array.from(dosyaWindows.values())
  for (const win of dCopy) {
    if (!win.isDestroyed()) win.close()
  }
  dosyaWindows.clear()
}

// Güvenli, deterministik ve donmayı önleyen çıkış fonksiyonu
function safeExitApp(): void {
  isForceQuitting = true
  writeLog('INFO', 'Executing safeExitApp shutdown sequence')
  try {
    closeAllSecondaryWindows()
  } catch {}
  try {
    if (workspaceManager.isDirty()) {
      workspaceManager.save()
    }
    workspaceManager.close()
  } catch {}
  try {
    stopServer()
  } catch {}
  try {
    stopExpressServer()
  } catch {}
  try {
    disconnectFromServer()
  } catch {}

  try {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.destroy()
      }
    }
  } catch {}

  setTimeout(() => {
    try {
      app.exit(0)
    } catch {
      process.exit(0)
    }
  }, 100)
}

// Uygulama tamamen kapanırken (Quit) aktif dosyayı/lock'u temizle
app.on('will-quit', () => {
  try {
    closeAllSecondaryWindows()
    workspaceManager.close()
  } catch {
    //
  }
  try {
    stopServer()
  } catch {
    //
  }
  try {
    stopExpressServer()
  } catch {
    //
  }
  try {
    disconnectFromServer()
  } catch {
    //
  }
})

// Süreç herhangi bir sebeple çökerse veya kapanırsa son bir temizlik şansı
process.on('exit', () => {
  try {
    closeAllSecondaryWindows()
    workspaceManager.close()
  } catch {
    //
  }
  try {
    stopServer()
  } catch {
    //
  }
  try {
    stopExpressServer()
  } catch {
    //
  }
  try {
    disconnectFromServer()
  } catch {
    //
  }
})

// Helper to resolve and validate dta-res paths safely preventing path traversal
function resolveSafeDtaResPath(requestUrl: string): string | null {
  try {
    const parsedUrl = new URL(requestUrl)
    const cleanPathname = decodeURIComponent(parsedUrl.pathname).replace(/^[/\\]+/, '')
    const cleanHost = parsedUrl.host.replace(/^[a-zA-Z]:/, '')
    const relativePath = join(cleanHost, cleanPathname)

    // 1. Resolve from public/renderer directory (packaged inside ASAR in production)
    const rendererDir = app.isPackaged
      ? resolve(__dirname, '../renderer')
      : resolve(__dirname, '../../src/renderer/public')

    const targetFilePath = resolve(rendererDir, relativePath)
    if (targetFilePath.startsWith(rendererDir + sep) || targetFilePath === rendererDir) {
      if (fs.existsSync(targetFilePath) && fs.statSync(targetFilePath).isFile()) {
        return targetFilePath
      }
    }

    // 2. Fallback: Resolve from resources directory (outside ASAR in production)
    const resourcesDir = app.isPackaged
      ? resolve(process.resourcesPath)
      : resolve(__dirname, '../../resources')

    const fallbackPath = resolve(resourcesDir, relativePath)
    if (fallbackPath.startsWith(resourcesDir + sep) || fallbackPath === resourcesDir) {
      if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
        return fallbackPath
      }
    }

    return null
  } catch {
    return null
  }
}

function createWindow(): void {
  const winIcon = getAppIcon()
  // Çalışma alanına (görev çubuğu hariç) göre boyutla; küçük ekranlarda pencere dışarı taşmasın.
  const workArea = screen.getPrimaryDisplay().workAreaSize
  const MIN_WIDTH = 800
  const MIN_HEIGHT = 420
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: Math.max(MIN_WIDTH, Math.min(1280, workArea.width)),
    height: Math.max(MIN_HEIGHT, Math.min(800, workArea.height)),
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    icon: winIcon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      plugins: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (winIcon) {
      try {
        mainWindow.setIcon(winIcon)
      } catch {}
    }
    mainWindow.show()
    if (process.argv.includes('--new-dosya')) {
      mainWindow.webContents.send('app:navigate', '/dosyalar/yeni')
    }
  })

  let quitRequestTimeout: NodeJS.Timeout | null = null

  mainWindow.on('close', (event) => {
    if (isForceQuitting) return
    const currentFile = workspaceManager.getCurrentFilePath()
    if (
      currentFile &&
      !mainWindow.webContents.isCrashed() &&
      !mainWindow.webContents.isDestroyed()
    ) {
      event.preventDefault()
      mainWindow.webContents.send('app:quit-request')

      // Güvenlik: Kullanıcının yedekleme adımlarını tamamlaması için 5 saniye zaman sınırı (donmayı önler)
      if (quitRequestTimeout) clearTimeout(quitRequestTimeout)
      quitRequestTimeout = setTimeout(() => {
        writeLog('WARN', 'Renderer quit response timed out, forcing safe exit')
        safeExitApp()
      }, 5000)
    }
  })

  ipcMain.on('app:cancel-quit-timeout', () => {
    if (quitRequestTimeout) {
      clearTimeout(quitRequestTimeout)
      quitRequestTimeout = null
    }
  })

  // Helper to open dta-res URLs in external application safely
  function openDtaResExternally(requestUrl: string): void {
    try {
      const safePath = resolveSafeDtaResPath(requestUrl)
      if (!safePath) {
        console.warn('Geçersiz veya yetkisiz dta-res harici açma isteği:', requestUrl)
        return
      }

      if (app.isPackaged) {
        // If packaged (inside ASAR), copy to temp directory to open externally
        const tempFilePath = join(app.getPath('temp'), basename(safePath))
        fs.copyFileSync(safePath, tempFilePath)
        shell.openPath(tempFilePath)
      } else {
        // In development, open directly from filesystem
        shell.openPath(safePath)
      }
    } catch (err) {
      console.error('Failed to open document externally:', err)
    }
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith('dta-res://')) {
      openDtaResExternally(details.url)
      return { action: 'deny' }
    }
    try {
      const parsed = new URL(details.url)
      if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(details.url)
      }
    } catch {
      // Ignore invalid URL
    }
    return { action: 'deny' }
  })

  // Navigation kilidi: Dış web sitelerine Electron içinden gidilmesini engelle
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const parsedUrl = new URL(url)
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        const allowedOrigin = new URL(process.env['ELECTRON_RENDERER_URL']).origin
        if (parsedUrl.origin !== allowedOrigin) {
          event.preventDefault()
        }
      } else {
        if (parsedUrl.protocol !== 'file:') {
          event.preventDefault()
        }
      }
    } catch {
      event.preventDefault()
    }
  })

  // Debug: Capture renderer console logs in the main process
  mainWindow.webContents.on('console-message', (event: any, ...args: any[]) => {
    const level = event.level ?? args[0]
    const message = event.message ?? args[1]
    const line = event.line ?? args[2]
    const sourceId = event.sourceId ?? args[3]
    console.log(`[RENDERER CONSOLE] (${level}) ${message} (at ${sourceId}:${line})`)
  })
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      writeLog('WARN', 'Main window did-fail-load, recovering index.html', {
        errorCode,
        errorDescription,
        validatedURL
      })
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
      } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
      }
    }
  )

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    closeAllSecondaryWindows()
  })
}

// Dev-mode userData path configured at startup log block

// Single Instance Lock
const gotTheLock = isMultiInstance ? true : app.requestSingleInstanceLock()

if (!gotTheLock && !isMultiInstance) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    writeLog('INFO', 'Second instance event received', { commandLine })
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      const mainWindow = windows[0]

      // Eğer desteklenen bir dosya çift tıklandıysa, yeni bir süreç (pencere) olarak başlat
      const rawFilePath = commandLine.find((arg) => isSupportedFile(arg))
      if (rawFilePath) {
        const filePath = rawFilePath.replace(/^"+|"+$/g, '').trim()
        const currentWorkspace = workspaceManager.getCurrentFilePath()
        const normalizedTarget = join(filePath)
        const normalizedCurrent = currentWorkspace ? join(currentWorkspace) : null

        writeLog('INFO', 'Attempting to open file from second instance', {
          target: normalizedTarget,
          currentWorkspace: normalizedCurrent
        })

        if (
          normalizedCurrent &&
          normalizedTarget.toLowerCase() === normalizedCurrent.toLowerCase()
        ) {
          writeLog('INFO', 'File is already open in main instance. Focusing window.')
          if (!mainWindow.isVisible()) {
            mainWindow.show()
          }
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        } else {
          writeLog('INFO', 'File is different/new. Opening in current instance.', {
            filePath
          })
          if (!mainWindow.isVisible()) {
            mainWindow.show()
          }
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
          mainWindow.webContents.send('open-external-file', filePath)
        }
      } else {
        writeLog('INFO', 'No supported file found in commandLine arguments.')
        if (!mainWindow.isVisible()) {
          mainWindow.show()
        }
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()

        if (commandLine.includes('--new-dosya')) {
          mainWindow.webContents.send('app:navigate', '/dosyalar/yeni')
        }
      }
    } else {
      writeLog('INFO', 'No windows open. Recreating main window.')
      createWindow()
      const rawFilePath = commandLine.find((arg) => isSupportedFile(arg))
      if (rawFilePath) {
        const filePath = rawFilePath.replace(/^"+|"+$/g, '').trim()
        process.argv.push(filePath)
      }
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Custom Protocol: dta-res:// -> local resource mapping with path traversal protection
    protocol.handle('dta-res', (request) => {
      try {
        const safePath = resolveSafeDtaResPath(request.url)
        if (!safePath) {
          return new Response('Access Denied or File Not Found', { status: 403 })
        }

        const data = fs.readFileSync(safePath)
        const contentType = mime.lookup(safePath) || 'application/octet-stream'

        return new Response(data, {
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
          }
        })
      } catch (err: any) {
        return new Response(`Error: ${err.message}`, { status: 500 })
      }
    })

    if (process.platform === 'win32') {
      app.setUserTasks([
        {
          program: process.execPath,
          arguments: '--new-dosya',
          iconPath: process.execPath,
          iconIndex: 0,
          title: 'Yeni Doğrudan Temin Dosyası',
          description: 'Hızlıca yeni bir doğrudan temin dosyası oluşturun'
        }
      ])

      // Windows Explorer dosya ilişkilendirmesi ve simgelerini tüm formatlar için garanti altına al
      registerWindowsFileAssociations()
    }

    tray = createSystemTray(getAppIcon())

    // Set app user model id for windows
    electronApp.setAppUserModelId('dev.ilyasbozdemir.temin360')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)

      // Ctrl + R / Cmd + R reload support in production, and Ctrl + F search support
      window.webContents.on('before-input-event', (event, input) => {
        const isR = input.key.toLowerCase() === 'r'
        const isF = input.key.toLowerCase() === 'f'
        const isCommandOrControl = input.control || input.meta

        if (isCommandOrControl && isR) {
          if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            if (input.shift) {
              window.webContents.reloadIgnoringCache()
            } else {
              window.webContents.reload()
            }
          } else {
            // Production packaged app safe reload
            const currentURL = window.webContents.getURL()
            if (currentURL.startsWith('file://')) {
              const hashIndex = currentURL.indexOf('#')
              const hashPart = hashIndex !== -1 ? currentURL.substring(hashIndex + 1) : ''
              const indexFile = join(__dirname, '../renderer/index.html')
              window.loadFile(indexFile, { hash: hashPart })
            } else {
              window.webContents.reload()
            }
          }
          event.preventDefault()
        } else if (isCommandOrControl && isF) {
          window.webContents.send('find-in-page:toggle')
          event.preventDefault()
        }
      })

      // Send found-in-page match results back to renderer
      window.webContents.on('found-in-page', (_, result) => {
        window.webContents.send('find-in-page:result', {
          activeMatchOrdinal: result.activeMatchOrdinal,
          matches: result.matches
        })
      })
    })

    // Güvenlik: Tüm donanım (kamera, mikrofon) izinlerini varsayılan olarak reddet
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false)
    })

    // Güvenlik: Production'da DevTools açılmasını tamamen engelle
    app.on('browser-window-created', (_, window) => {
      if (!is.dev) {
        window.webContents.on('devtools-opened', () => {
          window.webContents.closeDevTools()
        })
      }
    })

    const closeAllSecondaryWindows = () => {
      const windows = BrowserWindow.getAllWindows()
      for (let i = 1; i < windows.length; i++) {
        if (!windows[i].isDestroyed()) {
          windows[i].close()
        }
      }
    }

    registerAllIpcHandlers({
      closeAllSecondaryWindows,
      setForceQuit: () => {
        isForceQuitting = true
      },
      safeExitApp,
      initialFilePath
    })

    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    registerWindowIpcHandlers({
      getAppIcon,
      closeAllSecondaryWindows,
      secondaryWindows,
      dosyaWindows
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    safeExitApp()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
