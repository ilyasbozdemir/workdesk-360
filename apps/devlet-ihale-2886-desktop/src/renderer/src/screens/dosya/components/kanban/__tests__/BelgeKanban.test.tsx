import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BelgeKanbanBoard } from '../BelgeKanbanBoard'
import { BelgeDetayDialog } from '../BelgeDetayDialog'
import { BelgeKanbanItem } from '../belgeKanbanTypes'
import { Sablon } from '../../../../sablonlar/sablonlar.hooks'

const mockItemHazirlanacak: BelgeKanbanItem = {
  id: 'sablon_1',
  dbId: null,
  sablonId: 1,
  belgeAdi: 'Onay Belgesi',
  dosyaAdi: 'onay_belgesi.html',
  kategori: 'İhale & Onay',
  durum: 'hazirlanacak',
  beklemeNedeni: null,
  isProduced: false,
  isSigned: false,
  isLocked: false,
  missingMsg: null,
  updatedAt: null,
  sablon: {
    id: 1,
    ad: 'Onay Belgesi',
    dosya_adi: 'onay_belgesi.html',
    kategori: 'İhale & Onay',
    icerik: '<html>Onay Belgesi</html>'
  } as unknown as Sablon
}

const mockItemBeklemede: BelgeKanbanItem = {
  id: 'doc_2',
  dbId: 2,
  sablonId: 2,
  belgeAdi: 'Piyasa Fiyat Araştırma Tutanağı',
  dosyaAdi: 'piyasa_fiyat.html',
  kategori: 'Piyasa & Fiyat',
  durum: 'beklemede',
  beklemeNedeni: 'Komisyon Üyeleri İmzası Bekleniyor',
  isProduced: true,
  isSigned: false,
  isLocked: false,
  missingMsg: null,
  updatedAt: '2026-10-18T10:00:00',
  sablon: {
    id: 2,
    ad: 'Piyasa Fiyat Araştırma Tutanağı',
    dosya_adi: 'piyasa_fiyat.html',
    kategori: 'Piyasa & Fiyat',
    icerik: '<html>Piyasa Fiyat</html>'
  } as unknown as Sablon
}

describe('Belge Kanban Sistemi', () => {
  it('4 sütun başlığını ve kartları doğru sütunlarda görüntüler', () => {
    const columnsData = {
      hazirlanacak: [mockItemHazirlanacak],
      hazirlaniyor: [],
      beklemede: [mockItemBeklemede],
      tamamlandi: []
    }

    render(
      <BelgeKanbanBoard
        columnsData={columnsData}
        loading={false}
        onMoveItem={vi.fn()}
        onOpenPreview={vi.fn()}
      />
    )

    // Sütun başlıkları kontrolü
    expect(screen.getByText('Hazırlanacak')).toBeDefined()
    expect(screen.getByText('Hazırlanıyor')).toBeDefined()
    expect(screen.getByText('Beklemede')).toBeDefined()
    expect(screen.getByText('Tamamlandı')).toBeDefined()

    // Kart başlıkları kontrolü
    expect(screen.getByText('Onay Belgesi')).toBeDefined()
    expect(screen.getByText('Piyasa Fiyat Araştırma Tutanağı')).toBeDefined()

    // Bekleme nedeni kontrolü
    expect(screen.getByText('Komisyon Üyeleri İmzası Bekleniyor')).toBeDefined()

    // Şablon ve Kayıtlı rozetleri kontrolü
    expect(screen.getByText('Şablon')).toBeDefined()
    expect(screen.getByText('Kayıtlı')).toBeDefined()
  })

  it('boş sütunlarda bilgilendirici boş durum gösterir', () => {
    const columnsData = {
      hazirlanacak: [],
      hazirlaniyor: [],
      beklemede: [],
      tamamlandi: []
    }

    render(
      <BelgeKanbanBoard
        columnsData={columnsData}
        loading={false}
        onMoveItem={vi.fn()}
        onOpenPreview={vi.fn()}
      />
    )

    const emptyMessages = screen.getAllByText('Bu sütunda belge yok')
    expect(emptyMessages.length).toBe(4)
  })

  it('kart tıklandığında BelgeDetayDialog açılır ve durum güncellenebilir', async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined)
    const mockPreview = vi.fn()
    const mockClose = vi.fn()

    render(
      <BelgeDetayDialog
        item={mockItemHazirlanacak}
        isOpen={true}
        onClose={mockClose}
        onSaveStatus={mockSave}
        onPreview={mockPreview}
      />
    )

    // Modal başlığı ve alanları
    expect(screen.getByText('Onay Belgesi')).toBeDefined()
    expect(screen.getByText('Belge Süreç Durumu')).toBeDefined()

    // Tamamlandı durum butonunu tıkla
    const tamamlandiBtn = screen.getByRole('button', { name: /Tamamlandı/i })
    await act(async () => {
      fireEvent.click(tamamlandiBtn)
    })

    // "Durumu Güncelle" tıkla
    const kaydetBtn = screen.getByRole('button', { name: /Durumu Güncelle/i })
    await act(async () => {
      fireEvent.click(kaydetBtn)
    })

    expect(mockSave).toHaveBeenCalledWith('sablon_1', 'tamamlandi', null)
  })

  it('beklemede seçildiğinde bekleme nedeni yazılabilir ve kaydedilir', async () => {
    const mockSave = vi.fn().mockResolvedValue(undefined)

    render(
      <BelgeDetayDialog
        item={mockItemHazirlanacak}
        isOpen={true}
        onClose={vi.fn()}
        onSaveStatus={mockSave}
        onPreview={vi.fn()}
      />
    )

    // Beklemede butonuna tıkla
    const beklemedeBtn = screen.getByRole('button', { name: /Beklemede/i })
    await act(async () => {
      fireEvent.click(beklemedeBtn)
    })

    // Hızlı bekleme nedeni butonlarından birine tıkla
    const hizliNedenBtn = screen.getByText('Harcama Yetkilisi Onayı Bekleniyor')
    await act(async () => {
      fireEvent.click(hizliNedenBtn)
    })

    // Durumu Güncelle tıkla
    const kaydetBtn = screen.getByRole('button', { name: /Durumu Güncelle/i })
    await act(async () => {
      fireEvent.click(kaydetBtn)
    })

    expect(mockSave).toHaveBeenCalledWith(
      'sablon_1',
      'beklemede',
      'Harcama Yetkilisi Onayı Bekleniyor'
    )
  })
})
