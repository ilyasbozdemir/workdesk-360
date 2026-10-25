import { ipcMain, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export interface WindowIpcOptions {
  getAppIcon: () => Electron.NativeImage | undefined
  closeAllSecondaryWindows: () => void
  secondaryWindows: Set<BrowserWindow>
  dosyaWindows: Map<number, BrowserWindow>
}

export function registerWindowIpcHandlers(options: WindowIpcOptions): void {
  const { getAppIcon, closeAllSecondaryWindows, secondaryWindows, dosyaWindows } = options

  // Basic Window Controls
  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
  })

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
  })

  ipcMain.on('window-toggle-devtools', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.webContents.toggleDevTools()
  })

  // Shell / URL Handlers
  const handleOpenExternal = (url: unknown): void => {
    if (url && typeof url === 'string') {
      try {
        const parsed = new URL(url)
        if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
          shell.openExternal(url)
        }
      } catch {
        // Invalid URL
      }
    }
  }

  ipcMain.on('open-external-url', (_event, url) => {
    handleOpenExternal(url)
  })

  ipcMain.on('open-external', (_event, url) => {
    handleOpenExternal(url)
  })

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    if (url && typeof url === 'string') {
      try {
        const parsed = new URL(url)
        if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
          return shell.openExternal(url)
        }
      } catch {
        // Invalid URL
      }
    }
    return Promise.resolve()
  })

  ipcMain.handle('shell:openPath', async (_event, targetPath: string) => {
    if (targetPath && typeof targetPath === 'string') {
      return shell.openPath(targetPath)
    }
    return Promise.resolve('')
  })

  // Find in page
  ipcMain.on('find-in-page:start', (event, text, opt = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && text) {
      win.webContents.findInPage(text, {
        forward: opt.forward !== false,
        findNext: opt.findNext === true
      })
    }
  })

  ipcMain.on('find-in-page:stop', (event, action = 'clearSelection') => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.webContents.stopFindInPage(action)
    }
  })

  // Secondary Window Management
  ipcMain.on('window:close-secondary-windows', () => {
    closeAllSecondaryWindows()
  })

  ipcMain.on('window:open-external', (_, data: { url: string; title?: string }) => {
    if (!data?.url || typeof data.url !== 'string') return
    try {
      const parsed = new URL(data.url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return
      }
    } catch {
      return
    }

    const newWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: false,
      title: data.title || 'Sorgulama Ekranı',
      icon: getAppIcon(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })
    secondaryWindows.add(newWindow)
    newWindow.on('closed', () => secondaryWindows.delete(newWindow))
    newWindow.once('ready-to-show', () => {
      newWindow.show()
      newWindow.focus()
    })
    newWindow.loadURL(data.url)
  })

  ipcMain.on(
    'window:open-secondary',
    (_, data: { path: string; search: string; title?: string }) => {
      const newWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        title: data.title || 'TEMİN 360 — Detay',
        icon: getAppIcon(),
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false,
          contextIsolation: true,
          nodeIntegration: false
        }
      })

      secondaryWindows.add(newWindow)
      newWindow.on('closed', () => secondaryWindows.delete(newWindow))
      newWindow.once('ready-to-show', () => {
        newWindow.show()
        newWindow.focus()
      })

      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        newWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + data.search + '#' + data.path)
      } else {
        const indexHtml = join(__dirname, '../renderer/index.html')
        newWindow.loadFile(indexHtml, {
          search: data.search.replace(/^\?/, ''),
          hash: data.path
        })
      }
    }
  )

  // Dosya ↔ Window IPC Handlers
  ipcMain.on(
    'window:open-dosya',
    (_, data: { dosyaId: number; path: string; workspacePath: string; title?: string }) => {
      const existingWin = dosyaWindows.get(data.dosyaId)
      if (existingWin && !existingWin.isDestroyed()) {
        if (existingWin.isMinimized()) existingWin.restore()
        existingWin.focus()
        return
      }

      const newWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        title: data.title || `Dosya #${data.dosyaId}`,
        icon: getAppIcon(),
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false,
          contextIsolation: true,
          nodeIntegration: false
        }
      })

      dosyaWindows.set(data.dosyaId, newWindow)
      newWindow.on('closed', () => {
        dosyaWindows.delete(data.dosyaId)
      })
      newWindow.once('ready-to-show', () => {
        newWindow.show()
        newWindow.focus()
      })

      const wpParam = data.workspacePath ? '&wp=' + encodeURIComponent(data.workspacePath) : ''
      const searchParams = `?mode=dosya_window&dosyaId=${data.dosyaId}${wpParam}`

      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        newWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + searchParams + '#' + data.path)
      } else {
        const indexHtml = join(__dirname, '../renderer/index.html')
        newWindow.loadFile(indexHtml, {
          hash: data.path,
          search: searchParams.replace(/^\?/, '')
        })
      }
    }
  )

  // Tab ↔ Window IPC Handlers
  ipcMain.on(
    'tab:open-in-window',
    (_, data: { path: string; title: string; workspacePath?: string; dosyaId?: number }) => {
      const newWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        title: data.title || 'TEMİN 360',
        icon: getAppIcon(),
        webPreferences: {
          preload: join(__dirname, '../preload/index.js'),
          sandbox: false,
          contextIsolation: true,
          nodeIntegration: false
        }
      })

      secondaryWindows.add(newWindow)
      newWindow.on('closed', () => secondaryWindows.delete(newWindow))
      newWindow.once('ready-to-show', () => {
        newWindow.show()
        newWindow.focus()
      })

      const [purePath, tabQuery] = data.path.split('?')
      const wpParam = data.workspacePath ? '&wp=' + encodeURIComponent(data.workspacePath) : ''
      const dosyaParam = data.dosyaId ? '&dosyaId=' + data.dosyaId : ''
      const tabQueryParam = tabQuery ? '&' + tabQuery : ''
      const searchString = '?mode=window' + wpParam + dosyaParam + tabQueryParam

      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        newWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + searchString + '#' + purePath)
      } else {
        const indexHtml = join(__dirname, '../renderer/index.html')
        newWindow.loadFile(indexHtml, {
          hash: purePath,
          search: searchString.replace(/^\?/, '')
        })
      }
    }
  )

  ipcMain.on('tab:return-to-parent', (event, data: { path: string }) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    const allWindows = BrowserWindow.getAllWindows()
    const mainWindow = allWindows.find((w) => w !== senderWindow) || allWindows[0]

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tab:returned-from-window', { path: data.path })
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    if (senderWindow && !senderWindow.isDestroyed()) {
      senderWindow.close()
    }
  })
}
