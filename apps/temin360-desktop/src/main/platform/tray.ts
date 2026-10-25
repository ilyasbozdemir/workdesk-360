import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'

export function createSystemTray(trayImg: Electron.NativeImage | undefined): Tray | null {
  if (!trayImg) return null
  try {
    const tray = new Tray(trayImg)
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Gösterge Paneli',
        click: () => {
          const windows = BrowserWindow.getAllWindows()
          if (windows.length > 0) {
            windows[0].show()
            windows[0].webContents.send('app:navigate', '/')
          }
        }
      },
      {
        label: 'Yeni Doğrudan Temin Dosyası',
        click: () => {
          const windows = BrowserWindow.getAllWindows()
          if (windows.length > 0) {
            windows[0].show()
            windows[0].webContents.send('app:navigate', '/dosyalar/yeni')
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          app.quit()
        }
      }
    ])
    tray.setToolTip('TEMİN 360')
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
      const windows = BrowserWindow.getAllWindows()
      if (windows.length > 0) {
        if (windows[0].isVisible()) {
          windows[0].hide()
        } else {
          windows[0].show()
        }
      }
    })
    return tray
  } catch (e) {
    console.warn('Tray başlatılırken hata oluştu:', e)
    return null
  }
}
