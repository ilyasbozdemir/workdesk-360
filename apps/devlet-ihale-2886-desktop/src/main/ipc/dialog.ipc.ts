import { ipcMain, BrowserWindow, dialog } from 'electron'
import { defaultFormat, allFormatsFilter } from '../config/fileFormats'

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

  ipcMain.handle('dialog:showOpenDialog', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Proje Dosyası Seç',
      filters: [allFormatsFilter, { name: 'Tüm Dosyalar (*.*)', extensions: ['*'] }],
      properties: ['openFile']
    })
    return { canceled, filePath: filePaths && filePaths.length > 0 ? filePaths[0] : null }
  })
}
