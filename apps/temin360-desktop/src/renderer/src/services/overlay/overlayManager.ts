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
  id: string;
  tabPath?: string;
  priority?: number;
  onClose?: () => void;
  elementRef?: HTMLElement | null;
}

class OverlayManagerService {
  private activeOverlays = new Map<string, OverlayEntry>();
  private previousOverflow: string = "";
  private isScrollLocked: boolean = false;
  private rootObserver: MutationObserver | null = null;
  private isCleaningRogueLocks: boolean = false;

  constructor() {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      this.initRootObserver();
    }
  }

  /**
   * Initializes a MutationObserver on #root to immediately strip any rogue `inert`
   * or `aria-hidden` attributes when no overlay is active or no modal is visible.
   */
  private initRootObserver(): void {
    const root = document.getElementById("root");
    if (!root) {
      // If root is not ready yet, retry on DOMContentLoaded
      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          () => this.initRootObserver(),
          { once: true },
        );
      }
      return;
    }

    try {
      this.rootObserver = new MutationObserver(() => {
        // If there are no active registered overlays OR if no modal is visible in the DOM,
        // #root MUST NEVER be inert or aria-hidden!
        if (this.activeOverlays.size === 0 || !this.hasVisibleModalInDOM()) {
          let modified = false;
          if (root.hasAttribute("inert")) {
            root.removeAttribute("inert");
            modified = true;
          }
          if (root.getAttribute("aria-hidden") === "true") {
            root.removeAttribute("aria-hidden");
            modified = true;
          }
          if (modified && document.body.style.pointerEvents === "none") {
            document.body.style.removeProperty("pointer-events");
          }
        }
      });

      this.rootObserver.observe(root, {
        attributes: true,
        attributeFilter: ["inert", "aria-hidden"],
      });
    } catch {
      // Ignore observer failures in restricted environments
    }
  }

  /**
   * Checks whether a visible dialog or modal element currently exists in the DOM.
   */
  public hasVisibleModalInDOM(): boolean {
    if (typeof document === "undefined") return false;
    return Boolean(
      document.querySelector(
        '[role="dialog"]:not([aria-hidden="true"]), [aria-modal="true"]:not([aria-hidden="true"]), .modal-active, [data-state="open"]:not([data-state="closed"])',
      ),
    );
  }

  /**
   * Registers an open modal or overlay.
   * Returns a teardown function to unregister it.
   */
  public register(entry: OverlayEntry): () => void {
    const wasEmpty = this.activeOverlays.size === 0;
    this.activeOverlays.set(entry.id, entry);

    if (wasEmpty) {
      this.applyScrollLock();
    }

    return () => {
      this.unregister(entry.id);
    };
  }

  /**
   * Unregisters an overlay by id.
   * When all overlays are closed, releases scroll-lock and clears all body/root locks.
   */
  public unregister(id: string): void {
    if (!this.activeOverlays.has(id)) return;

    this.activeOverlays.delete(id);

    if (this.activeOverlays.size === 0) {
      this.releaseScrollLock();
      this.cleanRogueLocks();
    }
  }

  /**
   * Checks if an overlay is currently registered.
   */
  public isRegistered(id: string): boolean {
    return this.activeOverlays.has(id);
  }

  /**
   * Returns true if at least one overlay is registered.
   */
  public isAnyOverlayActive(): boolean {
    return this.activeOverlays.size > 0;
  }

  /**
   * Returns the count of active registered overlays.
   */
  public getActiveCount(): number {
    return this.activeOverlays.size;
  }

  /**
   * Safely locks body scroll without destroying layout.
   */
  private applyScrollLock(): void {
    if (typeof document === "undefined") return;
    if (this.isScrollLocked) return;

    this.previousOverflow = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";
    this.isScrollLocked = true;
  }

  /**
   * Restores original body overflow.
   */
  private releaseScrollLock(): void {
    if (typeof document === "undefined") return;
    if (!this.isScrollLocked) return;

    document.body.style.overflow = this.previousOverflow || "";
    this.isScrollLocked = false;
    this.previousOverflow = "";
  }

  /**
   * Thoroughly cleans up any pointer-events, scroll-lock attributes, and inert attributes.
   */
  public cleanRogueLocks(): void {
    if (typeof document === "undefined") return;
    if (this.isCleaningRogueLocks) return;
    this.isCleaningRogueLocks = true;

    try {
      // 1. Remove rogue scroll-lock stylesheet elements injected by Radix UI or react-remove-scroll
      document
        .querySelectorAll(
          "style[data-radix-scroll-lock], style[data-radix-body-lock], style[data-remove-scroll], style[data-scroll-lock]",
        )
        .forEach((el) => {
          try {
            el.remove();
          } catch {
            // ignore
          }
        });

      // 2. Reset body and documentElement pointer-events
      if (document.body.style.pointerEvents === "none") {
        document.body.style.removeProperty("pointer-events");
      }
      if (document.documentElement.style.pointerEvents === "none") {
        document.documentElement.style.removeProperty("pointer-events");
      }

      // 3. Remove data-scroll-locked attribute
      if (document.body.hasAttribute("data-scroll-locked")) {
        document.body.removeAttribute("data-scroll-locked");
      }
      if (document.documentElement.hasAttribute("data-scroll-locked")) {
        document.documentElement.removeAttribute("data-scroll-locked");
      }

      // 4. Prune stale overlays if no modal is physically present in the DOM
      const hasVisibleModal = this.hasVisibleModalInDOM();
      if (!hasVisibleModal) {
        this.activeOverlays.clear();
      }

      // 5. Clear inert and aria-hidden from #root if no modal is active
      if (this.activeOverlays.size === 0 || !hasVisibleModal) {
        const root = document.getElementById("root");
        if (root) {
          if (root.hasAttribute("inert")) {
            root.removeAttribute("inert");
          }
          if (root.getAttribute("aria-hidden") === "true") {
            root.removeAttribute("aria-hidden");
          }
        }

        // Clean any stray inert elements across the DOM
        document.querySelectorAll("[inert]").forEach((el) => {
          el.removeAttribute("inert");
        });
      }

      // 6. Notify listeners to clear any lingering custom overlays
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:clear-overlays"));
      }
    } catch {
      // ignore
    } finally {
      this.isCleaningRogueLocks = false;
    }
  }

  /**
   * Emergency reset: Clears all active overlays and forcefully restores interactivity.
   */
  public forceResetLocksIfNoOverlays(): void {
    if (typeof document === "undefined") return;

    const hasVisible = this.hasVisibleModalInDOM();

    // If no overlays are active OR no modal is visible in the DOM, clean all locks
    if (this.activeOverlays.size === 0 || !hasVisible) {
      if (!hasVisible) {
        this.activeOverlays.clear();
      }
      if (this.isScrollLocked || document.body.style.overflow === "hidden") {
        document.body.style.overflow = "";
        this.isScrollLocked = false;
        this.previousOverflow = "";
      }
      this.cleanRogueLocks();
    } else {
      // Even if overlays are recorded, if pointerEvents on body is 'none'
      if (document.body.style.pointerEvents === "none") {
        document.body.style.removeProperty("pointer-events");
      }
    }
  }

  /**
   * Closes and unregisters all overlays belonging to a specific tab path.
   */
  public closeOverlaysForTab(tabPath: string): void {
    const toClose: OverlayEntry[] = [];

    this.activeOverlays.forEach((entry) => {
      if (entry.tabPath === tabPath) {
        toClose.push(entry);
      }
    });

    toClose.forEach((entry) => {
      try {
        entry.onClose?.();
      } catch {
        // ignore
      }
      this.unregister(entry.id);
    });
  }

  /**
   * Handles tab switching:
   * Suspends scroll locks from background tab overlays so the active tab is freely interactive.
   */
  public handleTabSwitch(prevTabPath?: string, nextTabPath?: string): void {
    if (typeof document === "undefined") return;

    // Ensure #root is never inert on tab switch
    const root = document.getElementById("root");
    if (root) {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    }
    document.querySelectorAll("[inert]").forEach((el) =>
      el.removeAttribute("inert")
    );

    if (document.body.style.pointerEvents === "none") {
      document.body.style.removeProperty("pointer-events");
    }
    if (document.documentElement.style.pointerEvents === "none") {
      document.documentElement.style.removeProperty("pointer-events");
    }
    this.cleanRogueLocks();

    // Check if the newly active tab has an open overlay
    let nextTabHasOverlay = false;
    this.activeOverlays.forEach((entry) => {
      if (nextTabPath && entry.tabPath === nextTabPath) {
        nextTabHasOverlay = true;
      }
    });

    if (nextTabHasOverlay) {
      this.applyScrollLock();
    } else {
      // If the next tab has no overlays, unlock scroll even if prev tab had one
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "";
        this.isScrollLocked = false;
      }
    }
  }
}

export const overlayManager = new OverlayManagerService();
