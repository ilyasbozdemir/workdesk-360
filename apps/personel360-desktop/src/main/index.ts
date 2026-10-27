import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { PersonelDatabase } from './database/index'

let mainWindow: BrowserWindow | null = null
let db: PersonelDatabase | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    title: 'Personel 360 - Kurumsal Personel ve İzin Yönetimi',
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
  electronApp.setAppUserModelId('dev.ilyasbozdemir.personel360')
  db = new PersonelDatabase()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // --- IPC Handlers ---
  ipcMain.handle('personel:list', () => db?.getPersonelList() || [])
  ipcMain.handle('personel:get', (_, id: string) => db?.getPersonelById(id))
  ipcMain.handle('personel:create', (_, data) => db?.createPersonel(data))
  ipcMain.handle('personel:update', (_, data) => db?.updatePersonel(data))
  ipcMain.handle('personel:bakiye', (_, { personelId, yil }) => db?.getIzinBakiyesi(personelId, yil))

  ipcMain.handle('izin:list', (_, personelId?: string) => db?.getIzinTalepleri(personelId) || [])
  ipcMain.handle('izin:create', (_, params) => db?.createIzinTalebi(params))
  ipcMain.handle('izin:approve', (_, { izinId, onaylayanAdi }) => db?.approveIzinTalebi(izinId, onaylayanAdi))

  ipcMain.handle('gorevlendirme:list', (_, personelId?: string) => db?.getGorevlendirmeler(personelId) || [])
  ipcMain.handle('gorevlendirme:create', (_, data) => db?.createGorevlendirme(data))

  ipcMain.handle('audit:list', (_, personelId?: string) => db?.getAuditHistory(personelId) || [])
  ipcMain.handle('birim:list', () => db?.getBirimler() || [])

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
