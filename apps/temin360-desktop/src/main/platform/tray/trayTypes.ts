/** Tray'in bilmesi gereken, sunum için sadeleştirilmiş durum. Kaynağı: renderer'daki kuyruk/senkron store'ları. */
export type JobStatus = 'queued' | 'running' | 'sent' | 'failed' | 'cancelled'

export interface TrayJob {
  id: string
  title: string // "Piyasa Fiyat Araştırma Tutanağı · Dosya #348"
  status: JobStatus
  error?: string
}

export type DriveStatus = 'idle' | 'uploading' | 'synced' | 'error'

export interface TrayState {
  jobs: readonly TrayJob[]
  drive: DriveStatus
  updateAvailable: boolean
  /** Ana pencere odakta mı? Odaktaysa kullanıcı zaten alt çubuğu görüyor, bildirim gösterme. */
  windowFocused: boolean
}

/** Menüden/bildirimden gelen eylemler: tek bir dar sözleşme (IPC/Tauri komutuna kolay eşlenir). */
export type TrayAction =
  | { type: 'open'; route?: string }
  | { type: 'retry-job'; id: string }
  | { type: 'install-update' }
  | { type: 'quit' }

export interface MenuItemModel {
  label?: string
  enabled?: boolean
  separator?: boolean
  action?: TrayAction
}

export interface TrayView {
  tooltip: string
  menu: MenuItemModel[]
}

export interface TrayNotification {
  title: string
  body: string
  action?: TrayAction
}
