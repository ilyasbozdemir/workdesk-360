import { ipcMain, BrowserWindow, dialog } from 'electron'
import { defaultFormat, allFormatsFilter, openDialogFilters } from '../config/fileFormats'

export function registerDialogIpcHandlers(): void {
  ipcMain.handle('dialog:showSaveDialog', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Yeni Proje Dosyası Oluştur',
      defaultPath: `Yeni Proje.${defaultFormat.ext}`,
      filters: [allFormatsFilter]
    })
    return { canceled, filePath }
  })

  ipcMain.handle(
    'dialog:showOpenDialog',
    async (_event, options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0]
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: options?.title || 'Proje Dosyası Seç',
        filters: options?.filters || openDialogFilters,
        properties: ['openFile']
      })
      return { canceled, filePath: filePaths && filePaths.length > 0 ? filePaths[0] : null }
    }
  )

  // Electron Issue #20400 & #41603 Focus Bug Çözümü:
  // Native window.alert() ve window.confirm() yerine showMessageBoxSync çalıştırıp odağı BrowserWindow'a geri kazandırır
  ipcMain.on('dialog:alert-sync', (event, message: string) => {
    const win =
      BrowserWindow.fromWebContents(event.sender) ||
      BrowserWindow.getFocusedWindow() ||
      BrowserWindow.getAllWindows()[0]

    dialog.showMessageBoxSync(win || undefined, {
      type: 'info',
      title: 'TEMİN 360',
      message: String(message ?? ''),
      buttons: ['Tamam'],
      noLink: true
    })

    if (win && !win.isDestroyed()) {
      win.focus()
      try {
        win.webContents.focus()
      } catch {
        // ignore
      }
    }
    event.returnValue = undefined
  })

  ipcMain.on('dialog:confirm-sync', (event, message: string) => {
    const win =
      BrowserWindow.fromWebContents(event.sender) ||
      BrowserWindow.getFocusedWindow() ||
      BrowserWindow.getAllWindows()[0]

    const choice = dialog.showMessageBoxSync(win || undefined, {
      type: 'question',
      title: 'TEMİN 360',
      message: String(message ?? ''),
      buttons: ['Tamam', 'Vazgeç'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    })

    if (win && !win.isDestroyed()) {
      win.focus()
      try {
        win.webContents.focus()
      } catch {
        // ignore
      }
    }
    event.returnValue = choice === 0
  })
}
