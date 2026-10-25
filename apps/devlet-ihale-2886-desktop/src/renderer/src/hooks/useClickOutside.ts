import { useEffect, RefObject } from 'react'

/**
 * Belirtilen ref veya ref'lerin dışına tıklandığında verilen handler'ı çalıştırır.
 *
 * @param ref - Hedef DOM elemanının RefObject'i veya birden çok RefObject dizisi
 * @param handler - Dışarı tıklandığında çağrılacak callback
 * @param enabled - Dinleyicinin aktif olup olmadığı (varsayılan: true)
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>,
  handler: (event: MouseEvent) => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return

    function listener(event: MouseEvent): void {
      const target = event.target as Node
      if (!target) return

      const refs = Array.isArray(ref) ? ref : [ref]
      const clickedInside = refs.some((r) => r.current && r.current.contains(target))

      if (!clickedInside) {
        handler(event)
      }
    }

    document.addEventListener('mousedown', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
    }
  }, [ref, handler, enabled])
}
