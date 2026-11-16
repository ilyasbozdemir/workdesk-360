import React, { useState } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { overlayManager } from '../overlayManager'
import { useModalOverlay } from '../useModalOverlay'
import { Modal } from '../../../components/ui/Modal'

// Test modal component using useModalOverlay
function TestModal({
  id = 'test-modal',
  isOpen,
  onClose,
  tabPath
}: {
  id?: string
  isOpen: boolean
  onClose: () => void
  tabPath?: string
}) {
  useModalOverlay({ id, isOpen, onClose, tabPath })

  if (!isOpen) return null

  return (
    <div data-testid={id} role="dialog">
      <input data-testid={`${id}-input`} placeholder="Type here..." />
      <button onClick={onClose} data-testid={`${id}-close`}>
        Close
      </button>
    </div>
  )
}

// Multi-modal test harness
function MultiModalApp() {
  const [modal1Open, setModal1Open] = useState(false)
  const [modal2Open, setModal2Open] = useState(false)
  const [mainInputValue, setMainInputValue] = useState('')

  return (
    <div>
      <input
        data-testid="main-input"
        value={mainInputValue}
        onChange={(e) => setMainInputValue(e.target.value)}
        placeholder="Main screen input"
      />
      <button data-testid="open-modal-1" onClick={() => setModal1Open(true)}>
        Open Modal 1
      </button>
      <button data-testid="open-modal-2" onClick={() => setModal2Open(true)}>
        Open Modal 2
      </button>

      <TestModal
        id="modal-1"
        isOpen={modal1Open}
        onClose={() => setModal1Open(false)}
        tabPath="/tab-1"
      />
      <TestModal
        id="modal-2"
        isOpen={modal2Open}
        onClose={() => setModal2Open(false)}
        tabPath="/tab-1"
      />
    </div>
  )
}

describe('OverlayManager & Modal Lifecycle Suite', () => {
  let rootElement: HTMLDivElement

  beforeEach(() => {
    // Setup clean DOM environment
    document.body.innerHTML = '<div id="root"></div>'
    rootElement = document.getElementById('root') as HTMLDivElement
    document.body.style.overflow = ''
    document.body.style.pointerEvents = ''
    overlayManager.forceResetLocksIfNoOverlays()
  })

  afterEach(() => {
    overlayManager.forceResetLocksIfNoOverlays()
  })

  it('1. should lock body scroll on modal open and restore on modal close', () => {
    expect(overlayManager.getActiveCount()).toBe(0)
    expect(document.body.style.overflow).toBe('')

    const { unmount } = render(<MultiModalApp />, { container: rootElement })

    // Open Modal 1
    fireEvent.click(screen.getByTestId('open-modal-1'))
    expect(overlayManager.getActiveCount()).toBe(1)
    expect(overlayManager.isAnyOverlayActive()).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')

    // Close Modal 1
    fireEvent.click(screen.getByTestId('modal-1-close'))
    expect(overlayManager.getActiveCount()).toBe(0)
    expect(overlayManager.isAnyOverlayActive()).toBe(false)
    expect(document.body.style.overflow).toBe('')

    unmount()
  })

  it('2. should manage nested / multiple modals with proper reference counting', () => {
    render(<MultiModalApp />, { container: rootElement })

    // Open first modal
    fireEvent.click(screen.getByTestId('open-modal-1'))
    expect(overlayManager.getActiveCount()).toBe(1)
    expect(document.body.style.overflow).toBe('hidden')

    // Open second modal (stacked)
    fireEvent.click(screen.getByTestId('open-modal-2'))
    expect(overlayManager.getActiveCount()).toBe(2)
    expect(document.body.style.overflow).toBe('hidden')

    // Close second modal -> first modal still active
    fireEvent.click(screen.getByTestId('modal-2-close'))
    expect(overlayManager.getActiveCount()).toBe(1)
    expect(overlayManager.isAnyOverlayActive()).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')

    // Close first modal -> count goes to 0, scroll released
    fireEvent.click(screen.getByTestId('modal-1-close'))
    expect(overlayManager.getActiveCount()).toBe(0)
    expect(document.body.style.overflow).toBe('')
  })

  it('3. should automatically clean up locks on abrupt component unmount', () => {
    function TransientModalApp({ showComponent }: { showComponent: boolean }) {
      return (
        <div>
          {showComponent && (
            <TestModal id="transient-modal" isOpen={true} onClose={() => {}} />
          )}
        </div>
      )
    }

    const { rerender } = render(<TransientModalApp showComponent={true} />, {
      container: rootElement
    })
    expect(overlayManager.getActiveCount()).toBe(1)
    expect(document.body.style.overflow).toBe('hidden')

    // Abruptly remove component without user clicking close
    rerender(<TransientModalApp showComponent={false} />)
    expect(overlayManager.getActiveCount()).toBe(0)
    expect(document.body.style.overflow).toBe('')
  })

  it('4. should strip rogue inert and aria-hidden on #root when no overlays are active', () => {
    rootElement.setAttribute('inert', '')
    rootElement.setAttribute('aria-hidden', 'true')
    document.body.style.pointerEvents = 'none'

    expect(rootElement.hasAttribute('inert')).toBe(true)

    // Trigger cleanup
    overlayManager.cleanRogueLocks()

    expect(rootElement.hasAttribute('inert')).toBe(false)
    expect(rootElement.getAttribute('aria-hidden')).toBeNull()
    expect(document.body.style.pointerEvents).toBe('')
  })

  it('5. should handle tab switching and isolate background tab overlays', () => {
    render(<MultiModalApp />, { container: rootElement })

    // Open modal in tab-1
    fireEvent.click(screen.getByTestId('open-modal-1'))
    expect(overlayManager.getActiveCount()).toBe(1)
    expect(document.body.style.overflow).toBe('hidden')

    // Switch to tab-2
    act(() => {
      overlayManager.handleTabSwitch('/tab-1', '/tab-2')
    })

    // Active tab-2 has no overlays, so body scroll is unlocked for tab-2
    expect(document.body.style.overflow).toBe('')

    // Switch back to tab-1
    act(() => {
      overlayManager.handleTabSwitch('/tab-2', '/tab-1')
    })

    // Body scroll re-engages for tab-1's open modal
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('6. should close and unregister all overlays for a closed tab', () => {
    render(<MultiModalApp />, { container: rootElement })

    fireEvent.click(screen.getByTestId('open-modal-1'))
    expect(overlayManager.getActiveCount()).toBe(1)

    // Close tab-1
    act(() => {
      overlayManager.closeOverlaysForTab('/tab-1')
    })

    expect(overlayManager.getActiveCount()).toBe(0)
    expect(document.body.style.overflow).toBe('')
  })

  it('7. should allow typing in main screen inputs after standard Modal opens and closes', () => {
    function ModalUsage() {
      const [isOpen, setIsOpen] = useState(false)
      const [val, setVal] = useState('')

      return (
        <div>
          <input
            data-testid="screen-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Screen Input"
          />
          <button data-testid="open-modal-btn" onClick={() => setIsOpen(true)}>
            Open
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
            <div>Modal Content</div>
          </Modal>
        </div>
      )
    }

    render(<ModalUsage />, { container: rootElement })

    // 1. Initial typing works
    const input = screen.getByTestId('screen-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Hello' } })
    expect(input.value).toBe('Hello')

    // 2. Open modal
    fireEvent.click(screen.getByTestId('open-modal-btn'))
    expect(overlayManager.getActiveCount()).toBe(1)

    // 3. Close modal via Escape key
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(overlayManager.getActiveCount()).toBe(0)

    // 4. Verify input remains 100% interactive and can receive new keystrokes
    fireEvent.change(input, { target: { value: 'Hello World' } })
    expect(input.value).toBe('Hello World')

    // 5. Clear text and re-type
    fireEvent.change(input, { target: { value: '' } })
    expect(input.value).toBe('')
    fireEvent.change(input, { target: { value: 'New Data' } })
    expect(input.value).toBe('New Data')
  })

  it('8. should completely strip radix scroll-lock style tags and clear inert from #root when no visible modal exists', () => {
    // Simulate rogue Radix style tag injected into head
    const styleEl = document.createElement('style')
    styleEl.setAttribute('data-radix-scroll-lock', '')
    styleEl.textContent = 'body { pointer-events: none !important; }'
    document.head.appendChild(styleEl)

    // Simulate rogue attributes on body and root
    document.body.setAttribute('data-scroll-locked', '1')
    document.body.style.pointerEvents = 'none'
    rootElement.setAttribute('inert', '')
    rootElement.setAttribute('aria-hidden', 'true')

    // Also simulate a stale ghost overlay in activeOverlays
    overlayManager.register({ id: 'ghost-overlay-modal' })
    expect(overlayManager.isAnyOverlayActive()).toBe(true)

    // Run emergency reset / clean locks
    overlayManager.forceResetLocksIfNoOverlays()

    // 1. Ghost overlay should be purged because no modal is physically visible
    expect(overlayManager.getActiveCount()).toBe(0)
    expect(overlayManager.hasVisibleModalInDOM()).toBe(false)

    // 2. Radix style tag should be removed from DOM
    expect(document.querySelector('style[data-radix-scroll-lock]')).toBeNull()

    // 3. Body attributes & pointerEvents should be clean
    expect(document.body.hasAttribute('data-scroll-locked')).toBe(false)
    expect(document.body.style.pointerEvents).toBe('')

    // 4. #root inert & aria-hidden must be removed
    expect(rootElement.hasAttribute('inert')).toBe(false)
    expect(rootElement.getAttribute('aria-hidden')).toBeNull()
  })
})
