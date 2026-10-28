import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { FlowdeskDatabase } from './database/index.js'

let mainWindow: BrowserWindow | null = null
let db: FlowdeskDatabase | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    title: 'FLOWDESK 360 - Kurumsal Dinamik Süreç ve Görev Yönetimi',
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
  electronApp.setAppUserModelId('dev.ilyasbozdemir.flowdesk360')
  db = new FlowdeskDatabase()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ========================================================================
  // IPC HANDLERS
  // ========================================================================

  // Şablonlar ve Mevzuat Süreç Modülleri
  ipcMain.handle('flowdesk:getTemplates', () => db?.getTemplates() || [])
  ipcMain.handle('flowdesk:getTemplateById', (_, id: string) => db?.getTemplateById(id) || null)
  ipcMain.handle('flowdesk:createTemplate', (_, data) => db?.createTemplate(data))
  ipcMain.handle('flowdesk:updateTemplate', (_, { id, updates }) => db?.updateTemplate(id, updates))
  ipcMain.handle('flowdesk:getStatutoryModuleCatalog', () => db?.getStatutoryModuleCatalog() || [])
  ipcMain.handle(
    'flowdesk:installStatutoryModule',
    (_, moduleCode: 'IMAR_3194_KACAK_YAPI' | 'DEVLET_IHALE_2886') =>
      db?.installStatutoryModule(moduleCode)
  )

  // Süreçler
  ipcMain.handle('flowdesk:getProcesses', (_, filter) => db?.getProcesses(filter) || [])
  ipcMain.handle('flowdesk:getProcessById', (_, id: string) => db?.getProcessById(id) || null)
  ipcMain.handle('flowdesk:startProcess', (_, params) => db?.startProcess(params))
  ipcMain.handle('flowdesk:advanceStep', (_, params) => db?.advanceStep(params))
  ipcMain.handle('flowdesk:rejectStep', (_, params) => db?.rejectStep(params))
  ipcMain.handle('flowdesk:returnStep', (_, params) => db?.returnStep(params))
  ipcMain.handle('flowdesk:cancelProcess', (_, { processId, actor, reason }) =>
    db?.cancelProcess(processId, actor, reason)
  )
  ipcMain.handle('flowdesk:archiveProcess', (_, { processId, actor }) =>
    db?.archiveProcess(processId, actor)
  )

  // Görevler
  ipcMain.handle('flowdesk:getTasks', (_, filter) => db?.getTasks(filter) || [])
  ipcMain.handle('flowdesk:createTask', (_, data) => db?.createTask(data))
  ipcMain.handle('flowdesk:completeTask', (_, { taskId, actor, notes }) =>
    db?.completeTask(taskId, actor, notes)
  )

  // Belgeler
  ipcMain.handle('flowdesk:addDocument', (_, data) => db?.addDocument(data))

  // İstatistikler
  ipcMain.handle('flowdesk:getDashboardStats', () =>
    db?.getDashboardStats() || {
      totalProcesses: 0,
      activeProcesses: 0,
      completedProcesses: 0,
      pendingApprovals: 0,
      openTasks: 0,
      categories: []
    }
  )

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
