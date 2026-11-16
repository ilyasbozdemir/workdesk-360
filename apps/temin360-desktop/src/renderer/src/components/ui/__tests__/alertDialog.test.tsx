import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import {
  AlertDialogProvider,
  useConfirm,
  useAlert,
  dialogs
} from '../AlertDialogProvider'
import { overlayManager } from '../../../services/overlay/overlayManager'

function TestConsumerComponent() {
  const confirm = useConfirm()
  const alert = useAlert()
  const [result, setResult] = React.useState<string>('idle')

  const handleConfirm = async () => {
    const ok = await confirm({
      title: 'Silme Onayı',
      message: 'Bu öğeyi silmek istediğinize emin misiniz?',
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      variant: 'danger'
    })
    setResult(ok ? 'confirmed' : 'cancelled')
  }

  const handleAlert = async () => {
    await alert({
      title: 'İşlem Başarılı',
      message: 'Kayıt güncellendi.',
      variant: 'success'
    })
    setResult('alert-closed')
  }

  return (
    <div>
      <div data-testid="result">{result}</div>
      <button onClick={handleConfirm}>Open Confirm</button>
      <button onClick={handleAlert}>Open Alert</button>
    </div>
  )
}

describe('Radix UI AlertDialog & Confirm Dialog Suite', () => {
  beforeEach(() => {
    overlayManager.forceResetLocksIfNoOverlays()
  })

  afterEach(() => {
    overlayManager.forceResetLocksIfNoOverlays()
  })

  it('renders confirm dialog, locks overlays in OverlayManager, and resolves true on confirm', async () => {
    render(
      <AlertDialogProvider>
        <TestConsumerComponent />
      </AlertDialogProvider>
    )

    expect(screen.getByTestId('result').textContent).toBe('idle')
    expect(overlayManager.isAnyOverlayActive()).toBe(false)

    // Open confirm dialog
    fireEvent.click(screen.getByText('Open Confirm'))

    // Dialog title & message should appear
    const titleEl = await screen.findByText('Silme Onayı')
    expect(Boolean(titleEl)).toBe(true)
    expect(Boolean(screen.getByText('Bu öğeyi silmek istediğinize emin misiniz?'))).toBe(true)
    expect(overlayManager.isAnyOverlayActive()).toBe(true)

    // Click 'Evet, Sil'
    fireEvent.click(screen.getByText('Evet, Sil'))

    // Dialog should close and resolve confirmed
    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('confirmed')
    })
    expect(overlayManager.isAnyOverlayActive()).toBe(false)
  })

  it('resolves false when cancel button is clicked', async () => {
    render(
      <AlertDialogProvider>
        <TestConsumerComponent />
      </AlertDialogProvider>
    )

    fireEvent.click(screen.getByText('Open Confirm'))
    const titleEl = await screen.findByText('Silme Onayı')
    expect(Boolean(titleEl)).toBe(true)

    // Click 'Vazgeç'
    fireEvent.click(screen.getByText('Vazgeç'))

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('cancelled')
    })
    expect(overlayManager.isAnyOverlayActive()).toBe(false)
  })

  it('renders alert dialog with single action button and resolves on dismissal', async () => {
    render(
      <AlertDialogProvider>
        <TestConsumerComponent />
      </AlertDialogProvider>
    )

    fireEvent.click(screen.getByText('Open Alert'))
    const titleEl = await screen.findByText('İşlem Başarılı')
    expect(Boolean(titleEl)).toBe(true)
    expect(Boolean(screen.getByText('Kayıt güncellendi.'))).toBe(true)

    // There should NOT be a cancel button in alert mode
    expect(screen.queryByText('Vazgeç')).toBeNull()

    // Click 'Tamam'
    fireEvent.click(screen.getByText('Tamam'))

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('alert-closed')
    })
    expect(overlayManager.isAnyOverlayActive()).toBe(false)
  })

  it('supports imperative dialogs.confirm and dialogs.alert outside React hooks', async () => {
    render(
      <AlertDialogProvider>
        <div>Outside component</div>
      </AlertDialogProvider>
    )

    let promiseResult: boolean | null = null
    act(() => {
      dialogs.confirm({
        title: 'Harici Onay',
        message: 'Harici diyalog mesajı',
        confirmText: 'Onayla'
      }).then((res) => {
        promiseResult = res
      })
    })

    const titleEl = await screen.findByText('Harici Onay')
    expect(Boolean(titleEl)).toBe(true)
    fireEvent.click(screen.getByText('Onayla'))

    await waitFor(() => {
      expect(promiseResult).toBe(true)
    })
  })
})
