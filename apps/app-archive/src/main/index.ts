import { app, shell, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { getStoragePaths } from './paths'
import { registerIpcHandlers } from './ipc'
import { startWatcher, stopWatcher, setFilesChangedListener } from './watcher/scanner'

// 1. Özel 'arsiv://' protokolünü yetkili olarak kaydet (webSecurity açık kalır)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'arsiv',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true
    }
  }
])

let mainWindow: BrowserWindow | null = null

function setupArsivProtocol(): void {
  const { documentsDir } = getStoragePaths()

  protocol.handle('arsiv', async (request) => {
    try {
      // URL formatı: arsiv://preview/alt-klasor/dosya.pdf veya arsiv://dosya.pdf
      const url = new URL(request.url)
      // url.host + url.pathname birleşimi göreli yolu verir
      const relativePart = decodeURIComponent(
        (url.host === 'preview' ? '' : url.host) + url.pathname
      ).replace(/^\/+/, '')

      const targetPath = path.resolve(documentsDir, relativePart)

      // Path traversal koruması: Hedef dosya kesinlikle documentsDir altında olmalıdır
      if (!targetPath.startsWith(path.resolve(documentsDir))) {
        return new Response('Erişim Engellendi: Güvenlik ihlali (Path traversal)', { status: 403 })
      }

      const fileUrl = pathToFileURL(targetPath).toString()
      return await net.fetch(fileUrl)
    } catch (err: any) {
      console.error('arsiv:// protokol hatası:', err)
      return new Response('Dosya bulunamadı', { status: 404 })
    }
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Arşiv 360 — Akıllı Belge ve Sanal Klasör Yöneticisi',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR için renderer URL'si veya build index.html
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  registerIpcHandlers(mainWindow)

  setFilesChangedListener(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('arsiv:filesUpdated')
    }
  })

  // Canlı dosya izleyiciyi başlat
  startWatcher()
}

// Tekil örnek (Single-instance) kilidi
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('dev.ilyasbozdemir.arsiv360')

    // Özel güvenli protokolü bağla
    setupArsivProtocol()

    createWindow()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    stopWatcher()
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

