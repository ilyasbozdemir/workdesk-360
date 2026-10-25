import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DosyaSihirbaziModal } from '../DosyaSihirbaziModal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useRouterState: () => ({ location: { search: {} } }),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  )
}))

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
})

describe('DosyaSihirbaziModal (Unified Dosya Creation)', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.electron = {
      ipcRenderer: {
        invoke: vi.fn().mockImplementation((channel, sql) => {
          if (typeof sql === 'string') {
            if (sql.includes('TANIM_Birim')) {
              return Promise.resolve({
                success: true,
                data: [
                  { id: 1, birim_adi: 'Fen İşleri Müdürlüğü' },
                  { id: 2, birim_adi: 'Bilgi İşlem Müdürlüğü' }
                ]
              })
            }
            if (sql.includes('TANIM_Personel')) {
              return Promise.resolve({
                success: true,
                data: [
                  { id: 1, ad_soyad: 'Ahmet Yılmaz', unvan: 'Müdür' },
                  { id: 2, ad_soyad: 'Mehmet Demir', unvan: 'Mühendis' }
                ]
              })
            }
            if (sql.includes('TANIM_KikLimitDonemleri')) {
              return Promise.resolve({
                success: true,
                data: [
                  {
                    id: 1,
                    donem_kodu: '2026-1',
                    baslangic_tarihi: '2026-01-01',
                    bitis_tarihi: '2026-12-31',
                    buyuksehir_limit: 1021827.0,
                    diger_limit: 340391.0
                  }
                ]
              })
            }
            if (sql.includes('PRAGMA table_info')) {
              return Promise.resolve({
                success: true,
                data: [
                  { name: 'id' },
                  { name: 'temin_no' },
                  { name: 'konu' },
                  { name: 'tur' },
                  { name: 'butce_yili' },
                  { name: 'dosya_acilis_tarihi' },
                  { name: 'birim_id' },
                  { name: 'birim' },
                  { name: 'ihale_sekli' },
                  { name: 'ihale_tipi' },
                  { name: 'yaklasik_maliyet' },
                  { name: 'yaklasik_maliyet_kdv_dahil_mi' },
                  { name: 'kdv' },
                  { name: 'ihtiyac_yeri' },
                  { name: 'teslim_gun' },
                  { name: 'irtibat_yetkilisi_id' },
                  { name: 'onay_personel_id' },
                  { name: 'notlar' },
                  { name: 'durum_asama_id' },
                  { name: 'status' },
                  { name: 'is_deleted' },
                  { name: 'komisyon_seed_edildi' }
                ]
              })
            }
            if (sql.includes('INSERT INTO DATA_TeminDosyasi')) {
              return Promise.resolve({
                success: true,
                lastInsertRowid: 201
              })
            }
          }
          return Promise.resolve({ success: true, data: [] })
        }),
        send: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn()
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })

  const renderModal = (isOpen = true): ReturnType<typeof render> => {
    return render(
      <QueryClientProvider client={mockQueryClient}>
        <DosyaSihirbaziModal
          isOpen={isOpen}
          onClose={mockOnClose}
          initialStage={1}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    )
  }

  it('isOpen false olduğunda hiçbir şey render etmez', () => {
    const { container } = renderModal(false)
    expect(container.firstChild).toBeNull()
  })

  it('modal açıldığında birleşik dosya oluşturma aracını (DosyaManageScreen) görüntüler', () => {
    renderModal(true)

    expect(screen.getByText('Yeni Doğrudan Temin Dosyası')).toBeTruthy()
    expect(screen.getByText('Oluşturma Modu')).toBeTruthy()
    expect(screen.getByText('Genel Bilgiler')).toBeTruthy()
    expect(screen.getByText('İhtiyaç Listesi & Kalemler')).toBeTruthy()
  })

  it('form alanı ve adım gezinme kontrollerini içerir', () => {
    renderModal(true)

    expect(screen.getByTitle('Sonraki Adım')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Dosyayı Oluştur/i })).toBeTruthy()
  })

  it('konu girilmeden İhtiyaç Listesi sekmesine geçildiğinde uyarı verir', async () => {
    renderModal(true)

    await waitFor(() => {
      expect(screen.queryByText('Bilgiler yükleniyor...')).toBeNull()
    })

    const ihtiyacTabBtn = screen.getByRole('button', { name: /İhtiyaç Listesi & Kalemler/i })
    fireEvent.click(ihtiyacTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/Lütfen önce dosya konusunu/i)).toBeTruthy()
    })
  })
})
