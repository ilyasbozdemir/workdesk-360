import { useEffect } from 'react'

/**
 * forceUnlockInteractivity
 * Radix UI, Headless UI veya özel modal/backdrop bileşenlerinin kapanırken
 * body veya #root üzerinde bıraktığı tüm pointer-events, scroll-lock, inert ve
 * aria-hidden kilitlerini temizleyerek inputların donmasını/yazılamaz hale gelmesini önler.
 */
export function forceUnlockInteractivity(): void {
  try {
    // 1. Body & HTML pointer events kilidini kesin olarak kaldır
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = 'auto'
    }
    if (document.documentElement.style.pointerEvents === 'none') {
      document.documentElement.style.pointerEvents = 'auto'
    }

    // 2. data-scroll-locked özniteliğini kaldır
    if (document.body.hasAttribute('data-scroll-locked')) {
      document.body.removeAttribute('data-scroll-locked')
    }

    // 3. Ekranda aktif bir modal/dialog yoksa body overflow'u sıfırla
    const activeModal = document.querySelector(
      '[role="dialog"], .modal-active, [data-radix-portal] > div:not([data-radix-focus-guard])'
    )
    if (!activeModal && document.body.style.overflow === 'hidden') {
      document.body.style.overflow = ''
    }

    // 4. Radix kilit stillerini temizle
    const lockStyles = document.querySelectorAll(
      'style[data-radix-scroll-lock], style[data-radix-body-lock]'
    )
    lockStyles.forEach((el) => {
      try {
        el.remove()
      } catch {
        // ignore
      }
    })

    // 5. Root üzerindeki hatalı inert ve aria-hidden kilitlerini kaldır
    const root = document.getElementById('root')
    if (root) {
      if (root.getAttribute('aria-hidden') === 'true' && !activeModal) {
        root.removeAttribute('aria-hidden')
      }
      if (root.hasAttribute('inert') && !activeModal) {
        root.removeAttribute('inert')
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Global Interactivity Guard
 * Modal açılıp kapandığında, sekme/rota değiştiğinde ve global kullanıcı etkileşimlerinde
 * arka planda takılı kalan overlay kilitlerini anında çözerek inputların yazılabilir kalmasını sağlar.
 */
export function useGlobalInteractivityGuard(activeRouteOrTab: string): void {
  useEffect(() => {
    // Rota değiştiğinde açık custom dropdown veya geçici overlay'leri temizle
    window.dispatchEvent(new CustomEvent('app:clear-overlays'))
    forceUnlockInteractivity()

    const handleClearOverlays = (): void => {
      forceUnlockInteractivity()
    }

    // Sayfa üzerinde herhangi bir tık veya tuş basıldığında kilit kalmışsa anında çöz
    const handleGlobalInteraction = (e: Event): void => {
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('input, textarea, [contenteditable="true"]'))

      if (isInput) {
        // Kullanıcı bir inputa tıkladıysa veya odaklandıysa kilitleri hemen çöz
        forceUnlockInteractivity()
      } else if (
        document.body.style.pointerEvents === 'none' ||
        document.getElementById('root')?.hasAttribute('inert')
      ) {
        forceUnlockInteractivity()
      }
    }

    window.addEventListener('app:clear-overlays', handleClearOverlays)
    window.addEventListener('mousedown', handleGlobalInteraction, { passive: true, capture: true })
    window.addEventListener('keydown', handleGlobalInteraction, { passive: true, capture: true })
    window.addEventListener('focusin', handleGlobalInteraction, { passive: true, capture: true })

    // MutationObserver: DOM'da body stilleri veya kilit stilleri değiştiğinde kontrol et
    let observer: MutationObserver | null = null
    try {
      observer = new MutationObserver(() => {
        if (
          document.body.style.pointerEvents === 'none' &&
          !document.querySelector('[role="dialog"]')
        ) {
          forceUnlockInteractivity()
        }
      })
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'data-scroll-locked']
      })
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('app:clear-overlays', handleClearOverlays)
      window.removeEventListener('mousedown', handleGlobalInteraction, { capture: true })
      window.removeEventListener('keydown', handleGlobalInteraction, { capture: true })
      window.removeEventListener('focusin', handleGlobalInteraction, { capture: true })
      observer?.disconnect()
    }
  }, [activeRouteOrTab])
}
