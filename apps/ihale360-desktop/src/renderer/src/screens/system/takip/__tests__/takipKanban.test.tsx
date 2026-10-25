import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TakipKanbanBoard } from '../components/TakipKanbanBoard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { TeminDosyasi } from '../../../dosyalar/dosyalar.hooks'

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
})

describe('TakipKanbanBoard (Issue #11)', () => {
  const mockDosyalar = [
    {
      id: 101,
      temin_no: '2026/1',
      konu: 'Kırtasiye ve Büro Malzemesi Alımı',
      tur: 'mal',
      durum_asama_id: 1,
      status: 'devam_ediyor',
      yaklasik_maliyet: 45000,
      birim_adi: 'Yazı İşleri Müdürlüğü',
      butce_yili: 2026,
      is_deleted: 0
    },
    {
      id: 102,
      temin_no: '2026/2',
      konu: 'Park ve Bahçeler Çim Biçme Hizmeti',
      tur: 'hizmet',
      durum_asama_id: 2,
      status: 'devam_ediyor',
      yaklasik_maliyet: 120000,
      birim_adi: 'Park ve Bahçeler Müdürlüğü',
      butce_yili: 2026,
      is_deleted: 0
    },
    {
      id: 103,
      temin_no: '2026/3',
      konu: 'İstinat Duvarı Yapım İşi',
      tur: 'yapim_isi',
      durum_asama_id: 3,
      status: 'devam_ediyor',
      yaklasik_maliyet: 350000,
      birim_adi: 'Fen İşleri Müdürlüğü',
      butce_yili: 2026,
      is_deleted: 0
    },
    {
      id: 104,
      temin_no: '2026/4',
      konu: 'Jeolojik Etüt ve Danışmanlık',
      tur: 'danismanlik',
      durum_asama_id: 4,
      status: 'tamamlandi',
      yaklasik_maliyet: 85000,
      birim_adi: 'İmar ve Şehircilik Müdürlüğü',
      butce_yili: 2026,
      is_deleted: 0
    }
  ]

  const mockSetActiveDosyaId = vi.fn()
  const mockOpenWizard = vi.fn()
  const mockOpenSurec = vi.fn()
  const mockEdit = vi.fn()
  const formatCurrency = (val: number): string => `${val.toLocaleString('tr-TR')} ₺`

  beforeEach(() => {
    vi.clearAllMocks()
    window.electron = {
      ipcRenderer: {
        invoke: vi.fn().mockResolvedValue({ success: true }),
        send: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn()
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })

  const renderBoard = (
    dosyalar = mockDosyalar as unknown as TeminDosyasi[]
  ): ReturnType<typeof render> => {
    return render(
      <QueryClientProvider client={mockQueryClient}>
        <TakipKanbanBoard
          dosyalar={dosyalar}
          activeDosyaId={101}
          setActiveDosyaId={mockSetActiveDosyaId}
          formatCurrency={formatCurrency}
          onOpenWizard={mockOpenWizard}
          onOpenSurec={mockOpenSurec}
          onEdit={mockEdit}
        />
      </QueryClientProvider>
    )
  }

  it('4 ana kanban sütununu doğru başlıklarla görüntüler', () => {
    renderBoard()

    expect(screen.getByText('Hazırlıkta')).toBeTruthy()
    expect(screen.getByText('Teklif Toplanıyor')).toBeTruthy()
    expect(screen.getByText('Onayda')).toBeTruthy()
    expect(screen.getByText('Tamamlandı')).toBeTruthy()
  })

  it('dosyaları durum_asama_id değerlerine göre ilgili sütunlara yerleştirir', () => {
    renderBoard()

    expect(screen.getByText('Kırtasiye ve Büro Malzemesi Alımı')).toBeTruthy()
    expect(screen.getByText('Park ve Bahçeler Çim Biçme Hizmeti')).toBeTruthy()
    expect(screen.getByText('İstinat Duvarı Yapım İşi')).toBeTruthy()
    expect(screen.getByText('Jeolojik Etüt ve Danışmanlık')).toBeTruthy()
  })

  it('arama kutusuna yazılan metne göre dosyaları süzer', () => {
    renderBoard()

    const searchInput = screen.getByPlaceholderText(/Konu, dosya no veya birim/i)
    fireEvent.change(searchInput, { target: { value: 'İstinat' } })

    expect(screen.getByText('İstinat Duvarı Yapım İşi')).toBeTruthy()
    expect(screen.queryByText('Kırtasiye ve Büro Malzemesi Alımı')).toBeNull()
  })

  it('alım türüne göre dosyaları filtreler', () => {
    renderBoard()

    const filterSelects = screen.getAllByRole('combobox')
    const turSelect = filterSelects[1] // Second select is Alım Türü
    fireEvent.change(turSelect, { target: { value: 'hizmet' } })

    expect(screen.getByText('Park ve Bahçeler Çim Biçme Hizmeti')).toBeTruthy()
    expect(screen.queryByText('Kırtasiye ve Büro Malzemesi Alımı')).toBeNull()
  })

  it('sürükle-bırak işlemiyle dosya aşamasını veritabanında günceller', async () => {
    renderBoard()

    // Column 2 is "Teklif Toplanıyor" (stageId: 2)
    // Simulate drop of file 101 into stage 2
    const dataTransfer = {
      getData: vi.fn().mockReturnValue('101'),
      setData: vi.fn()
    }

    const columnStage2 = screen.getByText('Teklif Toplanıyor').closest('div')
    expect(columnStage2).toBeTruthy()

    // Find container element that has onDrop
    const dropZone = screen.getByText('Piyasa Fiyat Araştırması').closest('[class*="min-h"]')
    if (dropZone) {
      fireEvent.drop(dropZone, { dataTransfer })

      await waitFor(() => {
        expect(window.electron.ipcRenderer.invoke).toHaveBeenCalledWith(
          'db:run',
          expect.stringContaining('UPDATE DATA_TeminDosyasi SET durum_asama_id = ?'),
          [2, 'devam_ediyor', 101]
        )
      })
    }
  })

  it('Tamamlandı sütununa bırakılan dosyanın status alanını tamamlandi olarak günceller', async () => {
    renderBoard()

    const dataTransfer = {
      getData: vi.fn().mockReturnValue('101'),
      setData: vi.fn()
    }

    const dropZoneTamamlandi = screen
      .getByText('Kabul & Ödeme İşlemleri')
      .closest('[class*="min-h"]')
    if (dropZoneTamamlandi) {
      fireEvent.drop(dropZoneTamamlandi, { dataTransfer })

      await waitFor(() => {
        expect(window.electron.ipcRenderer.invoke).toHaveBeenCalledWith(
          'db:run',
          expect.stringContaining('UPDATE DATA_TeminDosyasi SET durum_asama_id = ?'),
          [4, 'tamamlandi', 101]
        )
      })
    }
  })

  it('Yeni Dosya Oluştur butonuna tıklandığında onOpenWizard tetiklenir', () => {
    renderBoard()

    const wizardBtns = screen.getAllByRole('button', {
      name: /Yeni Dosya Oluştur/i
    })
    fireEvent.click(wizardBtns[0])

    expect(mockOpenWizard).toHaveBeenCalledWith(1)
  })

  it('Kart ve Liste görünüm modları arasında geçiş yapılabilir', () => {
    renderBoard()

    const listeBtn = screen.getByRole('button', { name: /Liste/i })
    expect(listeBtn).toBeTruthy()

    fireEvent.click(listeBtn)
    // After clicking Liste, the button remains active/selected
    expect(listeBtn.className).toContain('text-blue-600')

    const kartBtn = screen.getByRole('button', { name: /Kart/i })
    fireEvent.click(kartBtn)
    expect(kartBtn.className).toContain('text-blue-600')
  })

  it('sütunda çok sayıda dosya olduğunda kademeli yükleme ve +5 Daha Yükle butonu çalışır', () => {
    localStorage.setItem('temin_kanban_height_mode', '3cards')
    // Generate 12 dossiers in stage 1
    const manyDosyalar = Array.from({ length: 12 }, (_, i) => ({
      id: 200 + i,
      temin_no: `2026/${200 + i}`,
      konu: `Toplu Alım Kalemi #${i + 1}`,
      tur: 'mal',
      durum_asama_id: 1,
      status: 'devam_ediyor',
      yaklasik_maliyet: 1000 * (i + 1),
      birim_adi: 'Destek Hizmetleri',
      butce_yili: 2026,
      is_deleted: 0
    })) as unknown as TeminDosyasi[]

    renderBoard(manyDosyalar)

    // Initial batch is 5
    expect(screen.getByText(/5 \/ 12 dosya gösteriliyor/i)).toBeTruthy()

    const loadMoreBtn = screen.getByRole('button', {
      name: /\+5 Daha Yükle/i
    })
    fireEvent.click(loadMoreBtn)

    // After loading more (+5), it now shows 10 / 12
    expect(screen.getByText(/10 \/ 12 dosya gösteriliyor/i)).toBeTruthy()
  })
})
