/**
 * OverlayManager
 * 
 * Monorepo Centralized Overlay & Modal Lifecycle Authority
 * 
 * Responsibilities:
 * 1. Stack and reference-counting registry of all active modals, dialogs, drawers, and popovers.
 * 2. Body scroll-locking with restoration of original overflow styles.
 * 3. Prevention and immediate recovery from stuck `pointer-events: none` on `body` and `html`.
 * 4. Automatic cleanup of unintended `inert` or `aria-hidden` attributes on `#root` or parent containers.
 * 5. Tab isolation: Overlays belong to a specific tab path; when switching tabs, locks are suspended
 *    so the newly active tab's inputs remain 100% responsive.
 * 6. Bulletproof destruction: Unmounting an overlay (even abruptly) safely releases its locks.
 */

export interface OverlayEntry {
  id: string
  tabPath?: string
  priority?: number
  onClose?: () => void
  elementRef?: HTMLElement | null
}

class OverlayManagerService {
  private activeOverlays = new Map<string, OverlayEntry>()
  private previousOverflow: string = ''
  private isScrollLocked: boolean = false
  private rootObserver: MutationObserver | null = null
  private isCleaningRogueLocks: boolean = false

  constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.initRootObserver()
    }
  }

  /**
   * Initializes a MutationObserver on #root to immediately strip any rogue `inert`
   * or `aria-hidden` attributes when no overlay is active.
   */
  private initRootObserver(): void {
    const root = document.getElementById('root')
    if (!root) {
      // If root is not ready yet, retry on DOMContentLoaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initRootObserver(), { once: true })
      }
      return
    }

    try {
      this.rootObserver = new MutationObserver(() => {
        // If there are no active registered overlays, #root MUST NEVER be inert or aria-hidden!
        if (this.activeOverlays.size === 0) {
          let modified = false
          if (root.hasAttribute('inert')) {
            root.removeAttribute('inert')
            modified = true
          }
          if (root.getAttribute('aria-hidden') === 'true') {
            root.removeAttribute('aria-hidden')
            modified = true
          }
          if (modified && document.body.style.pointerEvents === 'none') {
            document.body.style.pointerEvents = ''
          }
        }
      })

      this.rootObserver.observe(root, {
        attributes: true,
        attributeFilter: ['inert', 'aria-hidden']
      })
    } catch {
      // Ignore observer failures in restricted environments
    }
  }

  /**
   * Registers an open modal or overlay.
   * Returns a teardown function to unregister it.
   */
  public register(entry: OverlayEntry): () => void {
    const wasEmpty = this.activeOverlays.size === 0
    this.activeOverlays.set(entry.id, entry)

    if (wasEmpty) {
      this.applyScrollLock()
    }

    return () => {
      this.unregister(entry.id)
    }
  }

  /**
   * Unregisters an overlay by id.
   * When all overlays are closed, releases scroll-lock and clears all body/root locks.
   */
  public unregister(id: string): void {
    if (!this.activeOverlays.has(id)) return

    this.activeOverlays.delete(id)

    if (this.activeOverlays.size === 0) {
      this.releaseScrollLock()
      this.cleanRogueLocks()
    }
  }

  /**
   * Checks if an overlay is currently registered.
   */
  public isRegistered(id: string): boolean {
    return this.activeOverlays.has(id)
  }

  /**
   * Returns true if at least one overlay is registered.
   */
  public isAnyOverlayActive(): boolean {
    return this.activeOverlays.size > 0
  }

  /**
   * Returns the count of active registered overlays.
   */
  public getActiveCount(): number {
    return this.activeOverlays.size
  }

  /**
   * Safely locks body scroll without destroying layout.
   */
  private applyScrollLock(): void {
    if (typeof document === 'undefined') return
    if (this.isScrollLocked) return

    this.previousOverflow = document.body.style.overflow || ''
    document.body.style.overflow = 'hidden'
    this.isScrollLocked = true
  }

  /**
   * Restores original body overflow.
   */
  private releaseScrollLock(): void {
    if (typeof document === 'undefined') return
    if (!this.isScrollLocked) return

    document.body.style.overflow = this.previousOverflow || ''
    this.isScrollLocked = false
    this.previousOverflow = ''
  }

  /**
   * Thoroughly cleans up any pointer-events, scroll-lock attributes, and inert attributes.
   */
  public cleanRogueLocks(): void {
    if (typeof document === 'undefined') return
    if (this.isCleaningRogueLocks) return
    this.isCleaningRogueLocks = true

    try {
      // 1. Reset body and documentElement pointer-events
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = ''
      }
      if (document.documentElement.style.pointerEvents === 'none') {
        document.documentElement.style.pointerEvents = ''
      }

      // 2. Remove data-scroll-locked attribute
      if (document.body.hasAttribute('data-scroll-locked')) {
        document.body.removeAttribute('data-scroll-locked')
      }

      // 3. Clear inert and aria-hidden from #root if no overlays are active
      if (this.activeOverlays.size === 0) {
        const root = document.getElementById('root')
        if (root) {
          if (root.hasAttribute('inert')) {
            root.removeAttribute('inert')
          }
          if (root.getAttribute('aria-hidden') === 'true') {
            root.removeAttribute('aria-hidden')
          }
        }
      }

      // 4. Notify listeners to clear any lingering custom overlays
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:clear-overlays'))
      }
    } catch {
      // ignore
    } finally {
      this.isCleaningRogueLocks = false
    }
  }

  /**
   * Emergency reset: Clears all active overlays and forcefully restores interactivity.
   */
  public forceResetLocksIfNoOverlays(): void {
    if (typeof document === 'undefined') return

    // If no overlays are active, clean all locks
    if (this.activeOverlays.size === 0) {
      if (this.isScrollLocked || document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
        this.isScrollLocked = false
        this.previousOverflow = ''
      }
      this.cleanRogueLocks()
    } else {
      // Even if overlays are recorded, if pointerEvents on body is 'none' but no visible modal exists
      const visibleModal = document.querySelector(
        '[role="dialog"]:not([aria-hidden="true"]), .modal-active, [data-state="open"]'
      )
      if (!visibleModal && document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = ''
      }
    }
  }

  /**
   * Closes and unregisters all overlays belonging to a specific tab path.
   */
  public closeOverlaysForTab(tabPath: string): void {
    const toClose: OverlayEntry[] = []

    this.activeOverlays.forEach((entry) => {
      if (entry.tabPath === tabPath) {
        toClose.push(entry)
      }
    })

    toClose.forEach((entry) => {
      try {
        entry.onClose?.()
      } catch {
        // ignore
      }
      this.unregister(entry.id)
    })
  }

  /**
   * Handles tab switching:
   * Suspends scroll locks from background tab overlays so the active tab is freely interactive.
   */
  public handleTabSwitch(prevTabPath?: string, nextTabPath?: string): void {
    if (typeof document === 'undefined') return

    // Ensure #root is never inert on tab switch
    const root = document.getElementById('root')
    if (root) {
      root.removeAttribute('inert')
      root.removeAttribute('aria-hidden')
    }

    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = ''
    }

    // Check if the newly active tab has an open overlay
    let nextTabHasOverlay = false
    this.activeOverlays.forEach((entry) => {
      if (nextTabPath && entry.tabPath === nextTabPath) {
        nextTabHasOverlay = true
      }
    })

    if (nextTabHasOverlay) {
      this.applyScrollLock()
    } else {
      // If the next tab has no overlays, unlock scroll even if prev tab had one
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
        this.isScrollLocked = false
      }
    }
  }
}

export const overlayManager = new OverlayManagerService()
