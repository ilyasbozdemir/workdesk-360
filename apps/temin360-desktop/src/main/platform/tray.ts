import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'

export function createSystemTray(trayImg: Electron.NativeImage | undefined): Tray | null {
  try {
    let finalImg = trayImg
    if (!finalImg || finalImg.isEmpty()) {
      finalImg = nativeImage.createEmpty()
    } else {
      finalImg = finalImg.resize({ width: 16, height: 16 })
    }

    const tray = new Tray(finalImg)

    const navigateTo = (route: string) => {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length > 0) {
        const win = windows[0]
        if (win.isMinimized()) win.restore()
        if (!win.isVisible()) win.show()
        win.focus()
        win.webContents.send('app:navigate', route)
      }
    }

    const restoreMainWindow = () => {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length > 0) {
        const win = windows[0]
        if (win.isMinimized()) win.restore()
        if (!win.isVisible()) win.show()
        win.focus()
      }
    }

    const toggleWindow = () => {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length === 0) return
      const win = windows[0]
      if (win.isMinimized()) {
        win.restore()
        win.show()
        win.focus()
      } else if (!win.isVisible()) {
        win.show()
        win.focus()
      } else if (!win.isFocused()) {
        win.focus()
      } else {
        win.hide()
      }
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'TEMİN 360',
        enabled: false
      },
      { type: 'separator' },
      {
        label: '📊 Gösterge Paneli',
        click: () => navigateTo('/')
      },
      {
        label: '📁 Temin Dosyalarım',
        click: () => navigateTo('/dosyalar')
      },
      {
        label: '➕ Yeni Doğrudan Temin Dosyası',
        click: () => navigateTo('/dosyalar/yeni')
      },
      {
        label: '📑 Dosya Evrak Akışı & Belgeler',
        click: () => navigateTo('/dosya/evrak-akisi')
      },
      { type: 'separator' },
      {
        label: '🖥️ Uygulamayı Göster / Öne Getir',
        click: restoreMainWindow
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          app.quit()
        }
      }
    ])

    tray.setToolTip('TEMİN 360 - Doğrudan Temin & Kamu İhale Masası')
    tray.setContextMenu(contextMenu)

    // Sol tık ile pencereyi göster/gizle veya öne getir
    tray.on('click', toggleWindow)

    // Çift tık ile doğrudan öne getir ve odakla
    tray.on('double-click', restoreMainWindow)

    return tray
  } catch (e) {
    console.warn('Tray başlatılırken hata oluştu:', e)
    return null
  }
}
