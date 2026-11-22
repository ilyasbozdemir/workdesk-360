import type { DriveStatus, JobStatus, MenuItemModel, TrayJob, TrayNotification, TrayState, TrayView } from './trayTypes'

const MAX_JOB_LINES = 5
/** Windows tooltip sınırı 127 karakter (NOTIFYICONDATA.szTip = 128 - null). */
const MAX_TOOLTIP = 127

const STATUS_TEXT: Record<JobStatus, string> = {
  queued: 'Bekliyor',
  running: 'Hazırlanıyor',
  sent: 'Yazıcıya gönderildi',
  failed: 'Hata',
  cancelled: 'İptal edildi',
}
const DRIVE_TEXT: Record<DriveStatus, string> = {
  idle: 'Drive: Güncel',
  uploading: 'Drive: Yükleniyor…',
  synced: 'Drive: Güncel',
  error: 'Drive: Hata',
}

const isActive = (j: TrayJob) => j.status === 'queued' || j.status === 'running'
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

/**
 * Saf fonksiyonlar: Electron'a dokunmaz. Durum -> görünüm (tooltip + menü) ve
 * eski durum -> yeni durum farkından bildirimler. Test edilebilir ve Tauri'ye taşınabilir.
 */
export function buildTrayView(state: TrayState): TrayView {
  const active = state.jobs.filter(isActive).length
  const failed = state.jobs.filter((j) => j.status === 'failed').length

  const parts = ['TEMİN 360']
  if (active > 0) parts.push(`${active} yazdırma sürüyor`)
  if (failed > 0) parts.push(`${failed} hata`)
  if (state.drive === 'error') parts.push('Drive hatası')
  if (state.updateAvailable) parts.push('güncelleme var')
  const tooltip = truncate(parts.join(' · '), MAX_TOOLTIP)

  const menu: MenuItemModel[] = [
    { label: 'Gösterge Paneli', action: { type: 'open', route: '/' } },
    { label: 'Yeni Doğrudan Temin Dosyası', action: { type: 'open', route: '/dosyalar/yeni' } },
    { separator: true },
  ]

  const visible = state.jobs.filter((j) => j.status !== 'cancelled')
  if (visible.length > 0) {
    menu.push({ label: `Yazdırma kuyruğu (${active} aktif${failed ? `, ${failed} hata` : ''})`, enabled: false })
    for (const j of visible.slice(0, MAX_JOB_LINES)) {
      const title = truncate(j.title, 48)
      if (j.status === 'failed')
        menu.push({ label: `⚠ ${title} · Yeniden dene`, action: { type: 'retry-job', id: j.id } })
      else menu.push({ label: `${j.status === 'sent' ? '✓' : '…'} ${title} · ${STATUS_TEXT[j.status]}`, enabled: false })
    }
    if (visible.length > MAX_JOB_LINES) menu.push({ label: `… ve ${visible.length - MAX_JOB_LINES} iş daha`, enabled: false })
    menu.push({ separator: true })
  }

  menu.push({ label: DRIVE_TEXT[state.drive], enabled: false })
  if (state.updateAvailable) menu.push({ label: 'Güncellemeyi yükle', action: { type: 'install-update' } })
  menu.push({ separator: true }, { label: 'Çıkış', action: { type: 'quit' } })

  return { tooltip, menu }
}

/**
 * Bildirim kuralları (küçük ve bilinçli):
 *  - Pencere odaktaysa hiç bildirim yok (kullanıcı zaten alt çubuğu görüyor).
 *  - Yeni hata alan her iş için bir bildirim, tıklayınca yeniden dene.
 *  - Kuyruk boşalınca (hata yoksa) tek özet bildirim.
 *  - Drive hatası ve yeni güncelleme: durum değiştiği anda bir kez.
 */
export function diffNotifications(prev: TrayState | undefined, next: TrayState): TrayNotification[] {
  if (!prev || next.windowFocused) return []
  const out: TrayNotification[] = []
  const before = new Map(prev.jobs.map((j) => [j.id, j.status]))

  for (const j of next.jobs)
    if (j.status === 'failed' && before.get(j.id) !== 'failed')
      out.push({
        title: 'Yazdırma başarısız',
        body: `${truncate(j.title, 80)}${j.error ? `: ${truncate(j.error, 120)}` : ''}`,
        action: { type: 'retry-job', id: j.id },
      })

  const hadActive = prev.jobs.some(isActive)
  const nowActive = next.jobs.some(isActive)
  if (hadActive && !nowActive) {
    const sent = next.jobs.filter((j) => j.status === 'sent' && isActive({ ...j, status: before.get(j.id) ?? 'sent' } as TrayJob)).length
    if (sent > 0 && !next.jobs.some((j) => j.status === 'failed'))
      out.push({ title: 'Yazdırma tamamlandı', body: `${sent} belge yazıcıya gönderildi.`, action: { type: 'open' } })
  }

  if (prev.drive !== 'error' && next.drive === 'error')
    out.push({ title: 'Google Drive eşitlenemedi', body: 'Yedekleme başarısız oldu, ayrıntı için uygulamayı açın.', action: { type: 'open' } })
  if (!prev.updateAvailable && next.updateAvailable)
    out.push({ title: 'Güncelleme mevcut', body: 'Yeni sürümü yüklemek için tıklayın.', action: { type: 'install-update' } })

  return out
}
