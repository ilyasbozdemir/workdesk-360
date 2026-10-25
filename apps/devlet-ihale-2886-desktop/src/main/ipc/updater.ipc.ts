/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ipcMain, app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import {
  isUpdateEligible,
  loadVersionPolicy,
  tryParseVersion
} from '../../shared/version/versionManager'

export function registerUpdaterIpcHandlers(): void {
  let devUpdateVersionOverride = ''
  const policy = loadVersionPolicy()

  const sendUpdaterStatus = (status: string, data: any = {}) => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((w) => {
      if (!w.isDestroyed()) {
        w.webContents.send('updater:status', { status, ...data })
      }
    })
  }

  // Sürüm politikasına göre dinamik autoUpdater yapılandırması:
  // Kurulu uygulama Stable ise GitHub Prerelease sürümleri aranmaz (Stable -> RC geçişi engellenir).
  // Yalnızca kullanıcı zaten Prerelease kanalındaysa (Beta, RC) prerelease aramasına izin verilir.
  const currentAppVersion = app.getVersion()
  const parsedCurrent = tryParseVersion(currentAppVersion, policy)
  const isCurrentPrerelease = parsedCurrent ? parsedCurrent.isPrerelease : false

  autoUpdater.allowPrerelease = isCurrentPrerelease
  autoUpdater.allowDowngrade = policy.versioning.prerelease.allowChannelDowngrade

  // Güvenli indirme kontrolü: Otomatik indirmeyi kapatıp önce doğrulamadan geçiriyoruz.
  // Bu sayede reddedilen (eski, aynı veya uyumsuz kanaldaki) güncellemeler ASLA indirilmez.
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  if (!app.isPackaged) {
    autoUpdater.logger = console
  }

  // Only auto-check for updates in production packaged mode
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((e) => {
        console.error('Update check error:', e.message)
      })
    }, 5000)
  }

  ipcMain.handle('updater:set-dev-version', (_, mode: boolean, version: string) => {
    devUpdateVersionOverride = mode && version ? version : ''
    if (devUpdateVersionOverride && !app.isPackaged) {
      try {
        const parsed = tryParseVersion(devUpdateVersionOverride, policy)
        if (parsed) {
          autoUpdater.allowPrerelease = parsed.isPrerelease
          Object.defineProperty(autoUpdater, 'currentVersion', {
            get: () => ({ version: parsed.raw }),
            configurable: true
          })
        }
      } catch (e) {
        console.error('Mock currentVersion hatası:', e)
      }
    }
    return { success: true }
  })

  autoUpdater.on('checking-for-update', () => {
    console.log('Güncellemeler kontrol ediliyor...')
    sendUpdaterStatus('checking')
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`Yeni sürüm bulundu! Sürüm: ${info.version}`)

    const currentV =
      devUpdateVersionOverride || (autoUpdater.currentVersion as any)?.version || app.getVersion()

    const eligibility = isUpdateEligible(currentV, info.version, policy)

    if (!eligibility.eligible) {
      console.warn(
        `[Updater] Güncelleme reddedildi: ${eligibility.reason} (Mevcut: ${currentV}, Gelen: ${info.version})`
      )
      sendUpdaterStatus('not-available', { version: currentV, info: null })
      return
    }

    console.log(
      `[Updater] Güncelleme onaylandı: ${eligibility.reason} (${currentV} -> ${info.version}). İndirme başlatılıyor...`
    )
    sendUpdaterStatus('available', { version: info.version, info })

    // Doğrulanmış güncellemenin indirilmesini başlat
    if (policy.versioning.prerelease.allowAutoUpdate) {
      autoUpdater.downloadUpdate().catch((err) => {
        console.error('[Updater] Güncelleme indirme hatası:', err)
        sendUpdaterStatus('error', { error: err.message })
      })
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('Güncelleme yok, en güncel sürümdesiniz.')
    sendUpdaterStatus('not-available', { version: info?.version, info })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Güncelleme başarıyla indirildi. Kurulum için hazır.', info.version)
    sendUpdaterStatus('downloaded', { version: info.version, info })
  })

  autoUpdater.on('error', (err: any) => {
    if (err.message && err.message.includes('No published versions on GitHub')) {
      console.log('Güncelleme yok, en güncel sürümdesiniz.')
      sendUpdaterStatus('not-available', { version: app.getVersion(), info: null })
    } else {
      console.error('Güncelleme sırasında hata oluştu:', err)
      sendUpdaterStatus('error', { error: err.message })
    }
  })

  ipcMain.handle('updater:check', async () => {
    try {
      if (!app.isPackaged && !autoUpdater.forceDevUpdateConfig) {
        return {
          success: true,
          version: app.getVersion()
        }
      }
      const result = await autoUpdater.checkForUpdates()
      if (result === null) {
        return {
          success: false,
          error: 'Güncelleme kontrolü bu ortamda atlandı veya desteklenmiyor.'
        }
      }
      return { success: true, version: result.updateInfo.version }
    } catch (error: any) {
      if (error.message && error.message.includes('No published versions on GitHub')) {
        console.log('Manuel kontrol: Sistem güncel.')
        sendUpdaterStatus('not-available', { version: app.getVersion(), info: null })
        return { success: true }
      }

      console.error('Manual update check error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('updater:quit-and-install', () => {
    try {
      autoUpdater.quitAndInstall()
      return { success: true }
    } catch (error: any) {
      console.error('Quit and install error:', error)
      return { success: false, error: error.message }
    }
  })
}
