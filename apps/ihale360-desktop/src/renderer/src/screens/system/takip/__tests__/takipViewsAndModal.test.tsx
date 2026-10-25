import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TakipGridView } from '../components/TakipGridView'
import { TakipListView } from '../components/TakipListView'
import { TakipDosyaDetayDialog } from '../components/TakipDosyaDetayDialog'
import { TakipFilterToolbar } from '../components/TakipFilterToolbar'
import type { TeminDosyasi } from '../../../dosyalar/dosyalar.hooks'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn()
}))

const mockDosyalar = [
  {
    id: 201,
    temin_no: '2026/10',
    konu: 'Yazıcı Tonerleri ve Kartuş Alımı',
    tur: 'mal',
    ihale_sekli: '22/d',
    durum_asama_id: 1,
    status: 'devam_ediyor',
    yaklasik_maliyet: 32000,
    birim_adi: 'Bilgi İşlem Dairesi',
    dosya_acilis_tarihi: '2026-02-10',
    son_teklif_verme_tarihi: '2026-02-18',
    butce_yili: 2026,
    isin_aciklamasi: 'Lazer yazıcılar için orijinal toner temini',
    is_deleted: 0
  },
  {
    id: 202,
    temin_no: '2026/11',
    konu: 'Klima Bakım ve Onarım Hizmeti',
    tur: 'hizmet',
    ihale_sekli: '22/d',
    durum_asama_id: 2,
    status: 'devam_ediyor',
    yaklasik_maliyet: 65000,
    birim_adi: 'Destek Hizmetleri',
    dosya_acilis_tarihi: '2026-03-01',
    butce_yili: 2026,
    is_deleted: 0
  },
  {
    id: 203,
    temin_no: '2026/12',
    konu: 'Hizmet Binası Çatı Onarımı',
    tur: 'yapim_isi',
    ihale_sekli: '22/d',
    durum_asama_id: 4,
    status: 'tamamlandi',
    yaklasik_maliyet: 180000,
    birim_adi: 'Fen İşleri',
    dosya_acilis_tarihi: '2026-01-15',
    butce_yili: 2026,
    is_deleted: 0
  }
] as unknown as TeminDosyasi[]

describe('Ortak Görünüm Sistemi & Kart Detay Dialog (Issue #9, #10, #11)', () => {
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

  describe('TakipFilterToolbar', () => {
    it('arama ve filtreleme değişikliklerini doğru şekilde tetikler', () => {
      const setSearchQuery = vi.fn()
      const setSelectedYil = vi.fn()
      const setSelectedTur = vi.fn()
      const onOpenWizard = vi.fn()

      render(
        <TakipFilterToolbar
          searchQuery=""
          setSearchQuery={setSearchQuery}
          selectedYil="all"
          setSelectedYil={setSelectedYil}
          selectedTur="all"
          setSelectedTur={setSelectedTur}
          uniqueYillar={[2026, 2025]}
          totalCount={10}
          filteredCount={10}
          onOpenWizard={onOpenWizard}
        />
      )

      // Search input change
      const searchInput = screen.getByPlaceholderText(/Konu, dosya no veya birim/i)
      fireEvent.change(searchInput, { target: { value: 'Toner' } })
      expect(setSearchQuery).toHaveBeenCalledWith('Toner')

      // Comboboxes
      const selects = screen.getAllByRole('combobox')
      const yearSelect = selects[0]
      const turSelect = selects[1]

      fireEvent.change(yearSelect, { target: { value: '2026' } })
      expect(setSelectedYil).toHaveBeenCalledWith('2026')

      fireEvent.change(turSelect, { target: { value: 'mal' } })
      expect(setSelectedTur).toHaveBeenCalledWith('mal')
    })

    it('filtre aktifken Temizle butonu filtreleri sıfırlar', () => {
      const setSearchQuery = vi.fn()
      const setSelectedYil = vi.fn()
      const setSelectedTur = vi.fn()

      render(
        <TakipFilterToolbar
          searchQuery="Klima"
          setSearchQuery={setSearchQuery}
          selectedYil="2026"
          setSelectedYil={setSelectedYil}
          selectedTur="hizmet"
          setSelectedTur={setSelectedTur}
          uniqueYillar={[2026]}
          filteredCount={1}
          totalCount={3}
        />
      )

      const clearBtn = screen.getByTitle('Tüm Filtreleri Sıfırla')
      fireEvent.click(clearBtn)

      expect(setSearchQuery).toHaveBeenCalledWith('')
      expect(setSelectedYil).toHaveBeenCalledWith('all')
      expect(setSelectedTur).toHaveBeenCalledWith('all')
    })
  })

  describe('TakipGridView (Grid Görünümü)', () => {
    it('dosya kartlarını ve rozetlerini başarıyla listeler', () => {
      const onOpenDetail = vi.fn()
      const onOpenSurec = vi.fn()
      const onEdit = vi.fn()
      const setActiveDosyaId = vi.fn()

      render(
        <TakipGridView
          dosyalar={mockDosyalar}
          activeDosyaId={201}
          setActiveDosyaId={setActiveDosyaId}
          formatCurrency={formatCurrency}
          onOpenDetail={onOpenDetail}
          onOpenSurec={onOpenSurec}
          onEdit={onEdit}
        />
      )

      expect(screen.getByText('Yazıcı Tonerleri ve Kartuş Alımı')).toBeTruthy()
      expect(screen.getByText('Klima Bakım ve Onarım Hizmeti')).toBeTruthy()
      expect(screen.getByText('Hizmet Binası Çatı Onarımı')).toBeTruthy()
      expect(screen.getByText('32.000 ₺')).toBeTruthy()
    })

    it('karta tıklanması detay modalını açar, iç butonlar propagation yapmaz', () => {
      const onOpenDetail = vi.fn()
      const onOpenSurec = vi.fn()
      const onEdit = vi.fn()
      const setActiveDosyaId = vi.fn()

      render(
        <TakipGridView
          dosyalar={mockDosyalar}
          activeDosyaId={null}
          setActiveDosyaId={setActiveDosyaId}
          formatCurrency={formatCurrency}
          onOpenDetail={onOpenDetail}
          onOpenSurec={onOpenSurec}
          onEdit={onEdit}
        />
      )

      // Click card body
      const cardTitle = screen.getByText('Yazıcı Tonerleri ve Kartuş Alımı')
      fireEvent.click(cardTitle)
      expect(onOpenDetail).toHaveBeenCalledWith(mockDosyalar[0])

      // Reset
      onOpenDetail.mockClear()

      // Click "Süreç Aşamasına Git" button on card
      const surecButtons = screen.getAllByTitle('Süreç Aşamasına Git')
      fireEvent.click(surecButtons[0])
      expect(onOpenSurec).toHaveBeenCalledWith(mockDosyalar[0])
      expect(onOpenDetail).not.toHaveBeenCalled()

      // Click "Dosyayı Düzenle" button on card
      const editButtons = screen.getAllByTitle('Dosyayı Düzenle')
      fireEvent.click(editButtons[0])
      expect(onEdit).toHaveBeenCalledWith(201)
      expect(onOpenDetail).not.toHaveBeenCalled()
    })

    it('dosya listesi boşken bilgilendirici boş ekran görüntüler', () => {
      render(
        <TakipGridView
          dosyalar={[]}
          activeDosyaId={null}
          setActiveDosyaId={vi.fn()}
          formatCurrency={formatCurrency}
          onOpenDetail={vi.fn()}
          onOpenSurec={vi.fn()}
          onEdit={vi.fn()}
        />
      )

      expect(screen.getByText('Kriterlere Uygun Dosya Bulunamadı')).toBeTruthy()
    })
  })

  describe('TakipListView (Liste Görünümü)', () => {
    it('yoğun bilgi sunan tablo satırlarını görüntüler', () => {
      const onOpenDetail = vi.fn()

      render(
        <TakipListView
          dosyalar={mockDosyalar}
          activeDosyaId={201}
          setActiveDosyaId={vi.fn()}
          formatCurrency={formatCurrency}
          onOpenDetail={onOpenDetail}
          onOpenSurec={vi.fn()}
          onEdit={vi.fn()}
        />
      )

      expect(screen.getByText('2026/10')).toBeTruthy()
      expect(screen.getByText('Yazıcı Tonerleri ve Kartuş Alımı')).toBeTruthy()
      expect(screen.getByText('Bilgi İşlem Dairesi')).toBeTruthy()
      expect(screen.getByText('32.000 ₺')).toBeTruthy()
    })

    it('satıra tıklandığında onOpenDetail çağrılır, aksiyon butonları propagation yapmaz', () => {
      const onOpenDetail = vi.fn()
      const onOpenSurec = vi.fn()
      const onEdit = vi.fn()
      const setActiveDosyaId = vi.fn()

      render(
        <TakipListView
          dosyalar={mockDosyalar}
          activeDosyaId={null}
          setActiveDosyaId={setActiveDosyaId}
          formatCurrency={formatCurrency}
          onOpenDetail={onOpenDetail}
          onOpenSurec={onOpenSurec}
          onEdit={onEdit}
        />
      )

      // Click row
      const rowItem = screen.getByText('Klima Bakım ve Onarım Hizmeti')
      fireEvent.click(rowItem)
      expect(onOpenDetail).toHaveBeenCalledWith(mockDosyalar[1])

      onOpenDetail.mockClear()

      // Click row action "Süreç Adımlarına Git"
      const surecButtons = screen.getAllByTitle('Süreç Adımlarına Git')
      fireEvent.click(surecButtons[0])
      expect(onOpenSurec).toHaveBeenCalledWith(mockDosyalar[0])
      expect(onOpenDetail).not.toHaveBeenCalled()
    })
  })

  describe('TakipDosyaDetayDialog (Trello Benzeri Detay Dialog)', () => {
    it('isOpen false iken render edilmez', () => {
      const { container } = render(
        <TakipDosyaDetayDialog
          isOpen={false}
          onClose={vi.fn()}
          dosya={mockDosyalar[0]}
          formatCurrency={formatCurrency}
          onEdit={vi.fn()}
          onOpenSurec={vi.fn()}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('isOpen true iken dosya detaylarını, aşama stepperını ve üst bilgileri gösterir', () => {
      render(
        <TakipDosyaDetayDialog
          isOpen={true}
          onClose={vi.fn()}
          dosya={mockDosyalar[0]}
          formatCurrency={formatCurrency}
          onEdit={vi.fn()}
          onOpenSurec={vi.fn()}
        />
      )

      expect(screen.getByText('2026/10')).toBeTruthy()
      expect(screen.getByText('Yazıcı Tonerleri ve Kartuş Alımı')).toBeTruthy()
      expect(
        screen.getAllByText('Lazer yazıcılar için orijinal toner temini').length
      ).toBeGreaterThan(0)
      expect(screen.getByText('32.000 ₺')).toBeTruthy()
      expect(screen.getByText('Bilgi İşlem Dairesi')).toBeTruthy()
      expect(screen.getByText('1. Hazırlık')).toBeTruthy()
    })

    it('Kapat butonu ve ESC tuşu dialogu kapatır', () => {
      const onClose = vi.fn()

      render(
        <TakipDosyaDetayDialog
          isOpen={true}
          onClose={onClose}
          dosya={mockDosyalar[0]}
          formatCurrency={formatCurrency}
          onEdit={vi.fn()}
          onOpenSurec={vi.fn()}
        />
      )

      // Click Close button
      const closeBtn = screen.getByTitle('Kapat (ESC)')
      fireEvent.click(closeBtn)
      expect(onClose).toHaveBeenCalledTimes(1)

      // Press ESC key
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(2)
    })

    it('Dialog içinden aşama seçildiğinde veritabanını günceller ve onDosyaUpdated tetikler', async () => {
      const onDosyaUpdated = vi.fn()

      render(
        <TakipDosyaDetayDialog
          isOpen={true}
          onClose={vi.fn()}
          dosya={mockDosyalar[0]}
          formatCurrency={formatCurrency}
          onEdit={vi.fn()}
          onOpenSurec={vi.fn()}
          onDosyaUpdated={onDosyaUpdated}
        />
      )

      // Click Stage 2 stepper button (Piyasa Fiyat Araştırması)
      const stage2Btn = screen.getByRole('button', {
        name: /2\. Piyasa & Teklif/i
      })
      fireEvent.click(stage2Btn)

      await waitFor(() => {
        expect(window.electron.ipcRenderer.invoke).toHaveBeenCalledWith(
          'db:run',
          expect.stringContaining('UPDATE DATA_TeminDosyasi SET durum_asama_id = ?'),
          [2, 'devam_ediyor', 201]
        )
      })

      expect(onDosyaUpdated).toHaveBeenCalledWith({
        id: 201,
        durum_asama_id: 2,
        status: 'devam_ediyor'
      })
    })

    it('Dialog içi durum comboboxı değiştirildiğinde status güncellenir', async () => {
      const onDosyaUpdated = vi.fn()

      render(
        <TakipDosyaDetayDialog
          isOpen={true}
          onClose={vi.fn()}
          dosya={mockDosyalar[0]}
          formatCurrency={formatCurrency}
          onEdit={vi.fn()}
          onOpenSurec={vi.fn()}
          onDosyaUpdated={onDosyaUpdated}
        />
      )

      // Click "Tamamlandı" status button
      const tamamlandiBtn = screen.getByRole('button', {
        name: /^Tamamlandı$/i
      })
      fireEvent.click(tamamlandiBtn)

      await waitFor(() => {
        expect(window.electron.ipcRenderer.invoke).toHaveBeenCalledWith(
          'db:run',
          expect.stringContaining('UPDATE DATA_TeminDosyasi SET status = ?'),
          ['tamamlandi', 4, 201]
        )
      })

      expect(onDosyaUpdated).toHaveBeenCalledWith({
        id: 201,
        status: 'tamamlandi',
        durum_asama_id: 4
      })
    })
  })
})
