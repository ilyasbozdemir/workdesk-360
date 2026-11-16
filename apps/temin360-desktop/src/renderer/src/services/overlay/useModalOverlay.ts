import { useEffect, useRef } from 'react'
import { overlayManager } from './overlayManager'

export interface UseModalOverlayOptions {
  id: string
  isOpen: boolean
  onClose?: () => void
  tabPath?: string
  priority?: number
  disableEscape?: boolean
}

/**
 * useModalOverlay
 * 
 * Standard React hook for managing the lifecycle of any modal, dialog, or overlay.
 * Handles:
 * - Safe reference-counted registration with `overlayManager`
 * - Escape key closing
 * - Automatic cleanup on modal close or unmount
 * - Stable closure avoidance (via `useRef` for `onClose`)
 */
export function useModalOverlay({
  id,
  isOpen,
  onClose,
  tabPath,
  priority,
  disableEscape = false
}: UseModalOverlayOptions): void {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !disableEscape) {
        onCloseRef.current?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const unregister = overlayManager.register({
      id,
      tabPath,
      priority,
      onClose: () => onCloseRef.current?.()
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      unregister()
    }
  }, [id, isOpen, tabPath, disableEscape])
}
