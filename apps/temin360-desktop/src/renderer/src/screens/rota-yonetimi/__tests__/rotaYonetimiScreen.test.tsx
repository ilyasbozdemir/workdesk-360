import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RotaYonetimiScreen from '../index.screen'

// Mock Workspace Store
vi.mock('@renderer/store/workspaceStore', () => ({
  useWorkspaceStore: () => ({ activeDosyaId: 101 })
}))

// Mock Settings Store
vi.mock('@renderer/store/settingsStore', () => {
  const storeData = { institutionName: 'TEST BELEDİYESİ BAŞKANLIĞI', logoLeft: null, logoRight: null }
  const fn: any = () => storeData
  fn.getState = () => storeData
  return { useSettingsStore: fn }
})

// Mock DocumentPreviewRotaSection
vi.mock('../../dosya/components/DocumentPreviewModalV3/components/DocumentPreviewRotaSection', () => ({
  DocumentPreviewRotaSection: (props: any) => (
    <div data-testid="mock-rota-section">
      <span>Mock Rota Section ({props.templateId})</span>
      <button
        type="button"
        onClick={() => props.setFormData((prev: any) => ({ ...prev, onaylayanPersonelAdi: 'Yeni Onaylayan' }))}
      >
        Onaylayan Değiştir
      </button>
    </div>
  )
}))

// Mock DocumentEngine and DocumentRenderer
vi.mock('@worksuite-360/document-engine', async () => {
  const actual = (await vi.importActual('@worksuite-360/document-engine')) as any
  return {
    ...actual,
    DocumentEngine: {
      ...actual.DocumentEngine,
      loadOrCreateDocument: vi.fn().mockResolvedValue({
        headerData: {
          kurumAdi: 'TEST BELEDİYESİ BAŞKANLIĞI',
          antetSatirlari: ['T.C.', 'TEST BELEDİYESİ BAŞKANLIĞI']
        },
        data: { konu: 'Örnek İş Adı', sunulacakMakamAdi: 'BAŞKANLIK MAKAMINA' }
      })
    },
    DocumentRenderer: (props: any) => (
      <div data-testid="mock-document-renderer">
        <span>Renderer Key: {props.templateKey}</span>
        <span>Onaylayan: {props.data?.onaylayanPersonelAdi || 'Yok'}</span>
        <span>Ölçek: {props.scale}</span>
      </div>
    )
  }
})

describe('RotaYonetimiScreen — Şablon Rota & Canlı Önizleme Testleri', () => {
  beforeEach(() => {
    ;(window as any).electron = {
      ipcRenderer: {
        invoke: vi.fn().mockResolvedValue({ success: true, data: [] })
      }
    }
  })

  it('1. RotaYonetimiScreen başlığı ve canlı önizleme panelini varsayılan olarak açık render eder', async () => {
    render(<RotaYonetimiScreen />)

    expect(screen.getByText('Şablon Bazlı Belge Rota & Görevli Yönetimi')).toBeTruthy()
    expect(screen.getByText('SLOT ROTA SİSTEMİ')).toBeTruthy()
    expect(screen.getByText('Canlı Belge Önizlemesi')).toBeTruthy()

    const renderer = await screen.findByTestId('mock-document-renderer')
    expect(renderer).toBeTruthy()
  })

  it('2. Önizleme panelini açıp kapatma (toggle) butonu çalışır', async () => {
    render(<RotaYonetimiScreen />)

    await screen.findByTestId('mock-document-renderer')

    const toggleBtn = screen.getByTitle('Canlı A4 Önizleme Panelini Gizle')
    expect(toggleBtn).toBeTruthy()

    // Kapat
    fireEvent.click(toggleBtn)
    expect(screen.queryByTestId('mock-document-renderer')).toBeNull()

    // Tekrar Aç
    const openBtn = screen.getByTitle('Canlı A4 Önizleme Panelini Aç')
    fireEvent.click(openBtn)

    const reopened = await screen.findByTestId('mock-document-renderer')
    expect(reopened).toBeTruthy()
  })

  it('3. Şablon arama kutusu şablon listesini filtreler', async () => {
    render(<RotaYonetimiScreen />)

    const searchInput = screen.getByPlaceholderText('Şablon ara...')
    expect(searchInput).toBeTruthy()

    fireEvent.change(searchInput, { target: { value: 'Muayene' } })
    const matches = screen.getAllByText(/Muayene/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('4. Önizleme ölçek butonları DocumentRenderer ölçeğini günceller', async () => {
    render(<RotaYonetimiScreen />)

    await screen.findByTestId('mock-document-renderer')

    const scaleBtn = screen.getByText('%55')
    fireEvent.click(scaleBtn)

    await waitFor(() => {
      expect(screen.getByText(/Ölçek: 0\.55/i)).toBeTruthy()
    })
  })

  it('5. Rota editöründe yapılan değişiklikler DocumentRenderer önizleme verisine canlı aktarılır', async () => {
    render(<RotaYonetimiScreen />)

    await screen.findByTestId('mock-document-renderer')

    const changeBtn = screen.getByText('Onaylayan Değiştir')
    fireEvent.click(changeBtn)

    await waitFor(() => {
      expect(screen.getByText('Onaylayan: Yeni Onaylayan')).toBeTruthy()
    })
  })
})
