import { describe, expect, it } from 'vitest'
import { buildTrayView, diffNotifications } from '../TrayPresenter'
import { computePopupPosition } from '../popupPosition'
import type { TrayJob, TrayState } from '../trayTypes'

const job = (id: string, status: TrayJob['status'], extra: Partial<TrayJob> = {}): TrayJob => ({ id, title: `Belge ${id}`, status, ...extra })
const state = (o: Partial<TrayState> = {}): TrayState => ({ jobs: [], drive: 'idle', updateAvailable: false, windowFocused: false, ...o })
const labels = (s: TrayState) => buildTrayView(s).menu.map((m) => m.label ?? '---')

describe('buildTrayView', () => {
  it('boşta: yalnızca temel menü, kuyruk satırı yok', () => {
    const v = buildTrayView(state())
    expect(v.tooltip).toBe('TEMİN 360')
    expect(labels(state())).toEqual(['Gösterge Paneli', 'Yeni Doğrudan Temin Dosyası', '---', 'Drive: Güncel', '---', 'Çıkış'])
  })

  it('tooltip aktif iş ve hata sayısını yazar, 127 karakteri aşmaz', () => {
    const s = state({ jobs: [job('1', 'running'), job('2', 'queued'), job('3', 'failed')], drive: 'error', updateAvailable: true })
    expect(buildTrayView(s).tooltip).toBe('TEMİN 360 · 2 yazdırma sürüyor · 1 hata · Drive hatası · güncelleme var')
    const long = state({ jobs: Array.from({ length: 5 }, (_, i) => job(String(i), 'failed', { title: 'x'.repeat(200) })) })
    expect(buildTrayView(long).tooltip.length).toBeLessThanOrEqual(127)
  })

  it('hatalı iş tıklanabilir (yeniden dene), diğerleri pasif; en çok 5 satır + özet', () => {
    const jobs = [job('f', 'failed'), ...Array.from({ length: 6 }, (_, i) => job(`q${i}`, 'queued'))]
    const menu = buildTrayView(state({ jobs })).menu
    const retry = menu.find((m) => m.action?.type === 'retry-job')!
    expect(retry.action).toEqual({ type: 'retry-job', id: 'f' })
    expect(menu.filter((m) => m.label?.startsWith('…') && m.label.includes('iş daha'))).toHaveLength(1)
    expect(menu.some((m) => m.label?.includes('Belge q4'))).toBe(false) // 5. satırdan sonrası görünmez
  })

  it('güncelleme varsa menüde eylem çıkar', () => {
    expect(buildTrayView(state({ updateAvailable: true })).menu.some((m) => m.action?.type === 'install-update')).toBe(true)
  })
})

describe('diffNotifications', () => {
  it('pencere odaktaysa veya ilk durumda bildirim yok', () => {
    const failed = state({ jobs: [job('1', 'failed')], windowFocused: true })
    expect(diffNotifications(state({ jobs: [job('1', 'running')] }), failed)).toEqual([])
    expect(diffNotifications(undefined, state({ jobs: [job('1', 'failed')] }))).toEqual([])
  })

  it('iş hataya düşünce bir kez bildirir ve yeniden deneme eylemi taşır', () => {
    const prev = state({ jobs: [job('1', 'running')] })
    const next = state({ jobs: [job('1', 'failed', { error: 'Yazıcı çevrimdışı' })] })
    const n = diffNotifications(prev, next)
    expect(n).toHaveLength(1)
    expect(n[0]).toMatchObject({ title: 'Yazdırma başarısız', action: { type: 'retry-job', id: '1' } })
    expect(n[0]!.body).toContain('Yazıcı çevrimdışı')
    expect(diffNotifications(next, next)).toEqual([]) // aynı durumda tekrar bildirmez
  })

  it('kuyruk hatasız boşalınca tek özet bildirim', () => {
    const prev = state({ jobs: [job('1', 'running'), job('2', 'queued')] })
    const next = state({ jobs: [job('1', 'sent'), job('2', 'sent')] })
    expect(diffNotifications(prev, next)).toEqual([{ title: 'Yazdırma tamamlandı', body: '2 belge yazıcıya gönderildi.', action: { type: 'open' } }])
  })

  it('Drive hatası ve yeni güncelleme geçiş anında bildirilir', () => {
    const n = diffNotifications(state(), state({ drive: 'error', updateAvailable: true }))
    expect(n.map((x) => x.title)).toEqual(['Google Drive eşitlenemedi', 'Güncelleme mevcut'])
  })
})

describe('computePopupPosition', () => {
  const work = { x: 0, y: 0, width: 1920, height: 1040 } // alt görev çubuğu 40px
  const size = { width: 360, height: 300 }

  it('görev çubuğu altta: ikonun üstünde, çalışma alanı içinde', () => {
    const tray = { x: 1700, y: 1040, width: 24, height: 40 }
    expect(computePopupPosition(tray, size, work)).toEqual({ x: 1532, y: 732 })
  })

  it('ekranın sağ kenarına taşmaz', () => {
    const tray = { x: 1900, y: 1040, width: 20, height: 40 }
    expect(computePopupPosition(tray, size, work).x).toBe(1920 - 360 - 8)
  })

  it('görev çubuğu üstte ve solda', () => {
    expect(computePopupPosition({ x: 800, y: 0, width: 24, height: 40 }, size, { x: 0, y: 40, width: 1920, height: 1040 }).y).toBe(48)
    expect(computePopupPosition({ x: 0, y: 500, width: 48, height: 24 }, size, { x: 48, y: 0, width: 1872, height: 1080 }).x).toBe(56)
  })
})
