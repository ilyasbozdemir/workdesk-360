import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, resolve, basename } from 'path'
import { spawn } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import { resolveKnownApp, isWorkspaceAppId, isTrustedDevPackage } from './appAllowlist'

let mainWindow: BrowserWindow | null = null

function getIconPath(): string | undefined {
  const possiblePaths = [
    join(__dirname, '../../resources/icon.ico'),
    join(__dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'icon.ico'),
    join(process.resourcesPath, 'icon.png')
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p
    }
  }
  return undefined
}

function getRepoRoot(): string {
  // __dirname in dev: apps/app-workspace/out/main
  return resolve(__dirname, '../../../..')
}

export interface AppDetectionResult {
  /** Çalıştırılabilir (EXE) kurulu sürüm bulundu mu? */
  installed: boolean
  isDevSource?: boolean
  /** Monorepo içinde kaynak kodu mevcut mu? (kurulu anlamına gelmez) */
  sourceAvailable?: boolean
  /** Bu makinede gerçekten başlatılabilir mi? (EXE veya tanımlı dev script'i) */
  launchable?: boolean
  /** Geliştirici modunda kullanılacak paket adı */
  packageName?: string
  path?: string
  details?: string
}

function readDevScriptInfo(
  appDir: string
): { packageName: string; hasDevScript: boolean } | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(join(appDir, 'package.json'), 'utf-8')) as {
      name?: string
      scripts?: Record<string, string>
    }
    if (!pkg.name) return null
    return { packageName: pkg.name, hasDevScript: Boolean(pkg.scripts?.dev) }
  } catch {
    return null
  }
}

function detectApp(appId: unknown): AppDetectionResult {
  if (isWorkspaceAppId(appId)) {
    return {
      installed: true,
      isDevSource: is.dev,
      path: process.execPath,
      details: 'Çalışan Workspace 360 oturumu'
    }
  }

  // Güvenilmeyen girdi: yalnızca allowlist'teki uygulamalar için dosya sistemine bakılır.
  const known = resolveKnownApp(appId)
  if (!known) {
    return {
      installed: false,
      details: 'Uygulama henüz kurulu değil veya planlama aşamasında.'
    }
  }

  const repoRoot = getRepoRoot()
  const localAppData = process.env.LOCALAPPDATA || ''
  const programFiles = process.env.ProgramFiles || ''
  const programFilesX86 = process.env['ProgramFiles(x86)'] || ''

  const folderName = known.folderName
  const exeName = known.exeName
  const folderNamesToCheck = known.installedFolderNames

  // 1. Monorepo içinde yerel paketlenmiş (dist-local/win-unpacked) EXE kontrolü (yalnızca dev/unpacked ortamda)
  if (!app.isPackaged) {
    const localDevUnpacked = resolve(repoRoot, `apps/${folderName}/dist-local/win-unpacked/${exeName}`)
    if (fs.existsSync(localDevUnpacked)) {
      return {
        installed: true,
        isDevSource: false,
        path: localDevUnpacked,
        details: `Yerel paketlenmiş sürüm (${folderName}/dist-local/win-unpacked)`
      }
    }
  }

  // 2. Standart Windows kurulum dizinleri kontrolü (gerçek kurulu binary'ler)
  const candidatePaths: string[] = []
  for (const f of folderNamesToCheck) {
    candidatePaths.push(
      join(localAppData, 'Programs', f, exeName),
      join(localAppData, f, exeName),
      join(programFiles, f, exeName),
      join(programFilesX86, f, exeName)
    )
  }

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
      return {
        installed: true,
        isDevSource: false,
        path: p,
        details: 'Windows kurulu sürüm'
      }
    }
  }

  // 3. Monorepo geliştirici ortamı kaynak kodu kontrolü (yalnızca dev ortamda, kurulu anlamına gelmez)
  if (!app.isPackaged) {
    const appDir = resolve(repoRoot, `apps/${folderName}`)
    if (fs.existsSync(join(appDir, 'package.json'))) {
      const info = readDevScriptInfo(appDir)
      const launchable = Boolean(info?.hasDevScript)
      return {
        installed: false,
        isDevSource: true,
        sourceAvailable: true,
        launchable,
        packageName: info?.packageName,
        path: appDir,
        details: launchable
          ? `Geliştirici ortamı kaynak kodu (apps/${folderName})`
          : `Kurulu değil; kaynak kodu var ancak tanımlı bir "dev" script'i yok.`
      }
    }
  }

  return {
    installed: false,
    details: 'Uygulama henüz kurulu değil veya planlama aşamasında.'
  }
}

async function launchApp(appId: unknown): Promise<{ success: boolean; message: string }> {
  if (isWorkspaceAppId(appId)) {
    return { success: false, message: 'Workspace 360 zaten çalışıyor.' }
  }
  const known = resolveKnownApp(appId)
  if (!known) {
    return { success: false, message: 'Bilinmeyen veya kayıtlı olmayan uygulama kimliği.' }
  }
  const detection = detectApp(appId)

  // 1) Kurulu çalıştırılabilir dosya (yalnızca gerçek bir DOSYA ise spawn edilir)
  if (
    detection.installed &&
    detection.path &&
    fs.existsSync(detection.path) &&
    fs.statSync(detection.path).isFile()
  ) {
    return new Promise((resolvePromise) => {
      let resolved = false
      const finish = (res: { success: boolean; message: string }): void => {
        if (!resolved) {
          resolved = true
          resolvePromise(res)
        }
      }
      try {
        const child = spawn(detection.path!, [], { detached: true, stdio: 'ignore' })
        child.on('error', (err) => finish({ success: false, message: `Başlatma hatası: ${err.message}` }))
        child.on('exit', (code) => {
          if (code !== null && code !== 0) {
            finish({ success: false, message: `${appId} başlatılamadı (çıkış kodu: ${code}).` })
          }
        })
        setTimeout(() => {
          child.unref()
          finish({ success: true, message: `${appId} başlatıldı.` })
        }, 500)
      } catch (err: unknown) {
        finish({
          success: false,
          message: `Başlatma hatası: ${err instanceof Error ? err.message : String(err)}`
        })
      }
    })
  }

  // 2) Kaynak koddan geliştirici modunda başlatma (paketin kendi dev script'i ile)
  if (
    detection.sourceAvailable &&
    detection.launchable &&
    isTrustedDevPackage(known, detection.packageName)
  ) {
    return new Promise((resolvePromise) => {
      let resolved = false
      const finish = (res: { success: boolean; message: string }): void => {
        if (!resolved) {
          resolved = true
          resolvePromise(res)
        }
      }
      try {
        const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
        // Argümanlar allowlist'ten doğrulanmış sabit değerlerdir (shell:true yalnızca pnpm.cmd için gerekli).
        const child = spawn(pnpmCmd, ['--filter', known.folderName, 'dev'], {
          cwd: getRepoRoot(),
          shell: true,
          detached: true,
          stdio: 'ignore'
        })
        child.on('error', (err) =>
          finish({ success: false, message: `Geliştirici modu başlatma hatası: ${err.message}` })
        )
        child.on('exit', (code) => {
          if (code !== null && code !== 0) {
            finish({
              success: false,
              message: `${appId} geliştirici süreci sonlandı (çıkış kodu: ${code}).`
            })
          }
        })
        setTimeout(() => {
          child.unref()
          finish({
            success: true,
            message: `${appId} geliştirici modunda (pnpm --filter ${known.folderName} dev) başlatılıyor...`
          })
        }, 600)
      } catch (err: unknown) {
        finish({
          success: false,
          message: `Başlatma hatası: ${err instanceof Error ? err.message : String(err)}`
        })
      }
    })
  }

  if (detection.sourceAvailable) {
    return {
      success: false,
      message: `${appId} için kaynak kodu var ancak başlatılabilir bir "dev" script'i tanımlı değil.`
    }
  }

  return {
    success: false,
    message: `${appId} bulunamadı veya henüz yayınlanmadı.`
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'Workspace 360 — WorkSuite 360 Merkezi Çalışma Alanı',
    icon: getIconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
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

function registerIpcHandlers(): void {
  ipcMain.handle('workspace:launch-app', async (_event, appId: unknown) => {
    return await launchApp(appId)
  })

  ipcMain.handle('workspace:check-app', async (_event, appId: unknown) => {
    return detectApp(appId)
  })

  ipcMain.handle('workspace:get-system-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron
    }
  })

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('dev.ilyasbozdemir.workspace360')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
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
