export interface Rect { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }

/**
 * Tray ikonunun yanında açılacak küçük pencerenin konumu. Görev çubuğu hangi kenardaysa
 * (alt/üst/sol/sağ) pencere ikonun yanına, çalışma alanının İÇİNE yerleştirilir.
 * `trayBounds`: tray.getBounds(); `workArea`: screen.getDisplayNearestPoint(...).workArea
 */
export function computePopupPosition(trayBounds: Rect, size: { width: number; height: number }, workArea: Rect, gap = 8): Point {
  const cx = trayBounds.x + trayBounds.width / 2
  const cy = trayBounds.y + trayBounds.height / 2

  const taskbarAtBottom = trayBounds.y >= workArea.y + workArea.height - 1
  const taskbarAtTop = trayBounds.y + trayBounds.height <= workArea.y + 1
  const taskbarAtLeft = trayBounds.x + trayBounds.width <= workArea.x + 1
  const taskbarAtRight = trayBounds.x >= workArea.x + workArea.width - 1

  let x = cx - size.width / 2
  let y = cy - size.height / 2
  if (taskbarAtBottom) y = workArea.y + workArea.height - size.height - gap
  else if (taskbarAtTop) y = workArea.y + gap
  else if (taskbarAtLeft) x = workArea.x + gap
  else if (taskbarAtRight) x = workArea.x + workArea.width - size.width - gap

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi))
  return {
    x: Math.round(clamp(x, workArea.x + gap, workArea.x + workArea.width - size.width - gap)),
    y: Math.round(clamp(y, workArea.y + gap, workArea.y + workArea.height - size.height - gap)),
  }
}
