import { BrowserWindow, Menu, Notification, Tray, type MenuItemConstructorOptions, type NativeImage } from 'electron'
import { buildTrayView, diffNotifications } from './TrayPresenter'
import type { MenuItemModel, TrayAction, TrayState } from './trayTypes'

/**
 * Electron adaptörü (ince katman). Karar mantığı TrayPresenter'da; burada yalnızca Electron çağrıları var.
 * `platform/tray.ts` içindeki `createSystemTray` yerine geçer.
 *
 * Durum nereden gelir? Kuyruk ve Drive durumu renderer'da (store'larda). Renderer her değişimde
 * tek bir IPC ile `tray:state` gönderir, main `update(state)` çağırır. (Tauri'de aynı sözleşme komut olur.)
 */
export class TrayService {
  private readonly tray: Tray
  private prev: TrayState | undefined

  constructor(
    icon: NativeImage,
    private readonly onAction: (action: TrayAction) => void,
  ) {
    this.tray = new Tray(icon)
    this.tray.on('click', () => this.onAction({ type: 'open' }))
    this.update({ jobs: [], drive: 'idle', updateAvailable: false, windowFocused: true })
  }

  update(state: TrayState): void {
    const view = buildTrayView(state)
    this.tray.setToolTip(view.tooltip)
    this.tray.setContextMenu(Menu.buildFromTemplate(view.menu.map((m) => this.toTemplate(m))))

    for (const n of diffNotifications(this.prev, state)) {
      if (!Notification.isSupported()) break
      const note = new Notification({ title: n.title, body: n.body })
      if (n.action) note.on('click', () => this.onAction(n.action!))
      note.show()
    }
    this.prev = state
  }

  /** İlerlemeyi görev çubuğu düğmesinde göster (toplu yazdırma "3/10"). 0..1, -1 = kapat. */
  setTaskbarProgress(win: BrowserWindow | undefined, fraction: number): void {
    if (win && !win.isDestroyed()) win.setProgressBar(fraction)
  }

  destroy(): void {
    this.tray.destroy()
  }

  private toTemplate(m: MenuItemModel): MenuItemConstructorOptions {
    if (m.separator) return { type: 'separator' }
    return { label: m.label, enabled: m.enabled !== false, click: m.action ? () => this.onAction(m.action!) : undefined }
  }
}
