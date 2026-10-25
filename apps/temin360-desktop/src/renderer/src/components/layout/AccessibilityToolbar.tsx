import { Accessibility, Minus, Plus, RotateCcw } from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'

const STORAGE_KEY = 'temin_accessibility_font_scale'
const MIN_SCALE = 100
const MAX_SCALE = 150
const STEP = 10

function readInitialScale(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(stored) &&
      stored >= MIN_SCALE &&
      stored <= MAX_SCALE &&
      stored % STEP === 0
      ? stored
      : 100
  } catch {
    return 100
  }
}

const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'

export function AccessibilityToolbar(): JSX.Element {
  const [scale, setScale] = useState<number>(readInitialScale)

  useEffect(() => {
    const factor = scale / 100
    const root = document.documentElement

    root.style.fontSize = `${16 * factor}px`
    root.dataset.fontScale = String(scale)

    // Electron: tarayıcıdaki Ctrl +/- ile birebir aynı gerçek sayfa zoom'u.
    // Electron dışında (web/önizleme) CSS zoom'a düşer.
    const webFrame = window.electron?.webFrame
    if (webFrame) {
      webFrame.setZoomFactor(factor)
      root.style.removeProperty('zoom')
    } else {
      root.style.setProperty('zoom', String(factor))
    }
    root.dataset.zoomScale = String(scale)

    try {
      localStorage.setItem(STORAGE_KEY, String(scale))
    } catch {
      // Zoom still works when persistent storage is unavailable.
    }
  }, [scale])

  return (
    <section
      aria-label="Erişilebilirlik araçları"
      className="group fixed bottom-[35px] right-4 z-[9999]"
    >
      {/* Panel: pb-2 görünmez bir "köprü" oluşturur, fareyi butondan panele
          taşırken hover kaybolmaz. */}
      <div className="pointer-events-none invisible absolute bottom-full right-0 translate-y-1 pb-2 opacity-0 transition-[opacity,transform,visibility] duration-150 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <button
            type="button"
            onClick={() => setScale((current) => Math.max(MIN_SCALE, current - STEP))}
            disabled={scale <= MIN_SCALE}
            aria-label="Yazı boyutunu küçült"
            title="Uzaklaştır"
            className={iconBtn}
          >
            <Minus size={16} aria-hidden="true" />
          </button>

          <output
            className="min-w-12 text-center text-sm font-semibold tabular-nums"
            aria-live="polite"
            aria-label={`Yakınlaştırma yüzde ${scale}`}
          >
            {scale}%
          </output>

          <button
            type="button"
            onClick={() => setScale((current) => Math.min(MAX_SCALE, current + STEP))}
            disabled={scale >= MAX_SCALE}
            aria-label="Yazı boyutunu büyüt"
            title="Yakınlaştır"
            className={iconBtn}
          >
            <Plus size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setScale(100)}
            disabled={scale === 100}
            aria-label="Yazı boyutunu varsayılana döndür"
            title="Yakınlaştırmayı sıfırla (%100)"
            className={`${iconBtn} ml-1`}
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Tetikleyici ikon */}
      <button
        type="button"
        aria-label={`Erişilebilirlik araçları, yakınlaştırma yüzde ${scale}`}
        title="Erişilebilirlik"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <Accessibility aria-hidden="true" size={20} />
        {scale !== 100 && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"
          />
        )}
      </button>
    </section>
  )
}
