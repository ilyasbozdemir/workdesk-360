import { ipcMain, dialog, app } from 'electron'
import { join } from 'path'
import fs from 'fs'

export function registerTemplateIpcHandlers(): void {
  ipcMain.handle('template:export', async (_, payloadStr: string) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Şablonu Dışa Aktar',
        defaultPath: 'Yeni_Sablon.temin.template',
        filters: [
          {
            name: 'TEMİN Şablon Dosyası (*.temin.template, *.template)',
            extensions: ['temin.template', 'template']
          }
        ]
      })
      if (canceled || !filePath) return { success: false, error: 'İptal edildi' }
      fs.writeFileSync(filePath, payloadStr, 'utf-8')
      return { success: true, filePath }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('template:import', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Şablonu İçe Aktar',
        filters: [
          {
            name: 'TEMİN Şablon Dosyası (*.temin.template, *.template)',
            extensions: ['temin.template', 'template']
          }
        ],
        properties: ['openFile']
      })
      if (canceled || !filePaths || filePaths.length === 0)
        return { success: false, error: 'İptal edildi' }
      const content = fs.readFileSync(filePaths[0], 'utf-8')
      return { success: true, data: content, filePath: filePaths[0] }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('template:read-system', async (_, fileName: string) => {
    const templatesDirDev = join(app.getAppPath(), 'resources', 'templates')
    const templatesDirProd = join(process.resourcesPath, 'templates')
    const targetDir = fs.existsSync(templatesDirProd) ? templatesDirProd : templatesDirDev

    const findFile = (dir: string): string | null => {
      try {
        const list = fs.readdirSync(dir)
        for (const file of list) {
          const filePath = join(dir, file)
          const stat = fs.statSync(filePath)
          if (stat.isDirectory()) {
            const found = findFile(filePath)
            if (found) return found
          } else if (file === fileName) {
            return filePath
          } else if (file === 'index.html' && fileName === `${dir.split(/[\\/]/).pop()}.html`) {
            return filePath
          } else if (
            file === 'index.html.json' &&
            fileName === `${dir.split(/[\\/]/).pop()}.html.json`
          ) {
            return filePath
          } else if (
            file === 'index.json' &&
            fileName === `${dir.split(/[\\/]/).pop()}.html.json`
          ) {
            return filePath
          }
        }
      } catch (e) {
        // ignore
      }
      return null
    }

    const filePath = findFile(targetDir)
    if (filePath) {
      return fs.readFileSync(filePath, 'utf-8')
    }
    return null
  })

  ipcMain.handle('template:write-system', async (_, fileName: string, content: string) => {
    const templatesDirDev = join(app.getAppPath(), 'resources', 'templates')
    const templatesDirProd = join(process.resourcesPath, 'templates')
    const targetDir = fs.existsSync(templatesDirProd) ? templatesDirProd : templatesDirDev

    const findFile = (dir: string): string | null => {
      try {
        const list = fs.readdirSync(dir)
        for (const file of list) {
          const filePath = join(dir, file)
          const stat = fs.statSync(filePath)
          if (stat.isDirectory()) {
            const found = findFile(filePath)
            if (found) return found
          } else if (file === fileName) {
            return filePath
          } else if (file === 'index.html' && fileName === `${dir.split(/[\\/]/).pop()}.html`) {
            return filePath
          } else if (
            file === 'index.html.json' &&
            fileName === `${dir.split(/[\\/]/).pop()}.html.json`
          ) {
            return filePath
          } else if (
            file === 'index.json' &&
            fileName === `${dir.split(/[\\/]/).pop()}.html.json`
          ) {
            return filePath
          }
        }
      } catch (e) {
        // ignore
      }
      return null
    }

    const targetPath = findFile(targetDir)

    if (targetPath) {
      try {
        fs.writeFileSync(targetPath, content, 'utf-8')
        return { success: true, filePath: targetPath }
      } catch (e: any) {
        return { success: false, error: e.message }
      }
    } else {
      return { success: false, error: 'Dosya bulunamadı' }
    }
  })
}
