import { useEffect, useRef } from 'react'
import { overlayManager } from '../../../services/overlay/overlayManager'

/**
 * forceUnlockInteractivity
 * Radix UI, Headless UI veya özel modal/backdrop bileşenlerinin kapanırken
 * body veya #root üzerinde bıraktığı tüm pointer-events, scroll-lock, inert ve
 * aria-hidden kilitlerini OverlayManager üzerinden mimari düzeyde temizleyerek
 * inputların donmasını/yazılamaz hale gelmesini önler.
 */
export function forceUnlockInteractivity(): void {
  try {
    overlayManager.forceResetLocksIfNoOverlays()
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
  const prevTabRef = useRef<string>(activeRouteOrTab)

  useEffect(() => {
    const prevTab = prevTabRef.current
    prevTabRef.current = activeRouteOrTab

    // Rota veya sekme değiştiğinde OverlayManager üzerinden sekme geçişini yönet
    overlayManager.handleTabSwitch(prevTab, activeRouteOrTab)
    forceUnlockInteractivity()

    // Sayfa üzerinde herhangi bir etkileşim veya tık gerçekleştiğinde kilit kalmışsa anında çöz
    const handleGlobalInteraction = (e: Event): void => {
      const root = document.getElementById('root')
      const isRootLocked =
        root && (root.hasAttribute('inert') || root.getAttribute('aria-hidden') === 'true')
      const isBodyLocked =
        document.body.style.pointerEvents === 'none' ||
        document.documentElement.style.pointerEvents === 'none' ||
        document.body.hasAttribute('data-scroll-locked')

      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          Boolean(target.closest('input, textarea, select, [contenteditable="true"]')))

      if (isInput || isRootLocked || isBodyLocked || !overlayManager.hasVisibleModalInDOM()) {
        forceUnlockInteractivity()
      }
    }

    window.addEventListener('pointerdown', handleGlobalInteraction, { passive: true, capture: true })
    window.addEventListener('mousedown', handleGlobalInteraction, { passive: true, capture: true })
    window.addEventListener('click', handleGlobalInteraction, { passive: true, capture: true })
    window.addEventListener('keydown', handleGlobalInteraction, { passive: true, capture: true })
    window.addEventListener('focusin', handleGlobalInteraction, { passive: true, capture: true })

    // MutationObserver: DOM'da body stilleri veya data-scroll-locked değiştiğinde anında kontrol et
    let observer: MutationObserver | null = null
    try {
      observer = new MutationObserver(() => {
        if (!overlayManager.hasVisibleModalInDOM()) {
          const root = document.getElementById('root')
          const isRootLocked =
            root && (root.hasAttribute('inert') || root.getAttribute('aria-hidden') === 'true')
          const isBodyLocked =
            document.body.style.pointerEvents === 'none' ||
            document.documentElement.style.pointerEvents === 'none' ||
            document.body.hasAttribute('data-scroll-locked')

          if (isRootLocked || isBodyLocked) {
            forceUnlockInteractivity()
          }
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
      window.removeEventListener('pointerdown', handleGlobalInteraction, { capture: true })
      window.removeEventListener('mousedown', handleGlobalInteraction, { capture: true })
      window.removeEventListener('click', handleGlobalInteraction, { capture: true })
      window.removeEventListener('keydown', handleGlobalInteraction, { capture: true })
      window.removeEventListener('focusin', handleGlobalInteraction, { capture: true })
      observer?.disconnect()
    }
  }, [activeRouteOrTab])
}
