import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { DosyaEvrakAkisiHeader } from '../components/DosyaEvrakAkisiHeader'
import { DosyaEvrakListesiSidebar } from '../components/DosyaEvrakListesiSidebar'
import { ImzaliBelgeYukleModal } from '../components/ImzaliBelgeYukleModal'
import { EvrakItem, DosyaSummaryInfo } from '../types'

describe('DosyaEvrakAkisi Sub-Screen Components', () => {
  const mockDosyaInfo: DosyaSummaryInfo = {
    id: 54,
    teminNo: '2026/54',
    konu: 'Muhtelif Araç Yedek Parça Alımı',
    harcamaBirimi: 'Fen İşleri Müdürlüğü',
    alimTuru: 'mal',
    yaklasikMaliyet: 244530.6,
    netOdenen: 92000,
    durum: 'aktif',
    sozlesmeliMi: false,
    evrakSayisi: '3 Evrak',
    tarih: '2026-09-20'
  }

  const mockEvraklar: EvrakItem[] = [
    {
      id: 'template_ihtiyac_belgesi',
      code: 'ihtiyac_belgesi',
      title: 'İhtiyaç Belgesi & Talep Formu',
      stage: 1,
      stageName: 'Hazırlık',
      type: 'template',
      status: 'hazir',
      badge: {
        label: 'Hazır',
        color: 'bg-emerald-50 dark:bg-emerald-950/40',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800'
      },
      iconType: 'file-text',
      date: '2026-09-20'
    },
    {
      id: 'template_piyasa_fiyat',
      code: 'piyasa_fiyat_arastirma_tutanagi',
      title: 'Piyasa Fiyat Araştırması Tutanağı',
      stage: 2,
      stageName: 'Fiyat',
      type: 'template',
      status: 'taslak',
      badge: {
        label: 'Taslak',
        color: 'bg-amber-50 dark:bg-amber-950/40',
        textColor: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800'
      },
      iconType: 'coins',
      date: '2026-09-24'
    },
    {
      id: 'signed_doc_101',
      code: 'sozlesme_imzali',
      title: 'İmzalı Sözleşme & Taahhütname',
      stage: 5,
      stageName: 'İmzalı',
      type: 'signed_pdf',
      status: 'imzali',
      badge: {
        label: 'İmzalı',
        color: 'bg-purple-50 dark:bg-purple-950/40',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800'
      },
      iconType: 'file-check',
      filePath: 'tempDir/attachments/sozlesme_imzali.pdf',
      date: '2026-09-28'
    }
  ]

  describe('DosyaEvrakAkisiHeader', () => {
    it('renders dossier information accurately', () => {
      render(
        <DosyaEvrakAkisiHeader
          dosyaInfo={mockDosyaInfo}
          dosyalarList={[{ id: 54, teminNo: '2026/54', konu: 'Muhtelif Araç Yedek Parça Alımı' }]}
          activeDosyaId={54}
          onSelectDosya={vi.fn()}
          onRefresh={vi.fn()}
          loading={false}
          evraklar={mockEvraklar}
        />
      )

      expect(screen.getByText('2026/54')).toBeDefined()
      expect(screen.getByText('Muhtelif Araç Yedek Parça Alımı')).toBeDefined()
      expect(screen.getByText('Fen İşleri Müdürlüğü')).toBeDefined()
      expect(screen.getByText('Mal Alımı')).toBeDefined()
      expect(screen.getByText('Sözleşmesiz')).toBeDefined()
      expect(screen.getByText('3 Belge')).toBeDefined()
      expect(screen.getByText('1 İmzalı')).toBeDefined()
    })
  })

  describe('DosyaEvrakListesiSidebar', () => {
    it('renders document cards and supports filtering', () => {
      const handleSelect = vi.fn()
      const handleSearchChange = vi.fn()
      const handleStageFilterChange = vi.fn()
      const handleUpload = vi.fn()
      const handleToggle = vi.fn()

      render(
        <DosyaEvrakListesiSidebar
          evraklar={mockEvraklar}
          selectedEvrakId="template_piyasa_fiyat"
          onSelectEvrak={handleSelect}
          searchQuery=""
          onSearchChange={handleSearchChange}
          stageFilter="all"
          onStageFilterChange={handleStageFilterChange}
          onUploadSignedPdf={handleUpload}
          onDeleteSignedDoc={vi.fn()}
          isCollapsed={false}
          onToggleCollapse={handleToggle}
        />
      )

      // Verify all items are displayed
      expect(screen.getByText('İhtiyaç Belgesi & Talep Formu')).toBeDefined()
      expect(screen.getByText('Piyasa Fiyat Araştırması Tutanağı')).toBeDefined()
      expect(screen.getByText('İmzalı Sözleşme & Taahhütname')).toBeDefined()

      // Click on the first item
      const item1 = screen.getByText('İhtiyaç Belgesi & Talep Formu')
      fireEvent.click(item1)
      expect(handleSelect).toHaveBeenCalledWith('template_ihtiyac_belgesi')

      // Click on + İmzalı Belge Yükle button
      const uploadButton = screen.getByText(/İmzalı Belge \/ PDF Yükle/i)
      fireEvent.click(uploadButton)
      expect(handleUpload).toHaveBeenCalled()
    })
  })

  describe('ImzaliBelgeYukleModal', () => {
    it('renders selected files and guesses document target', () => {
      const handleSave = vi.fn().mockResolvedValue(undefined)
      const handleClose = vi.fn()

      render(
        <ImzaliBelgeYukleModal
          isOpen={true}
          onClose={handleClose}
          files={['C:/belgeler/dogrudan_temin_onay_belgesi_imzali.pdf', 'C:/belgeler/ek_fatura.pdf']}
          templateOptions={[
            { code: 'dogrudan_temin_onay_belgesi', title: 'Doğrudan Temin Onay Belgesi', stageName: '1. Hazırlık' },
            { code: 'piyasa_fiyat_arastirma_tutanagi', title: 'Piyasa Fiyat Araştırması Tutanağı', stageName: '2. Fiyat' }
          ]}
          onSave={handleSave}
        />
      )

      expect(screen.getByText('İmzalı Belgeleri Dosyaya Eşleştir & Yükle')).toBeDefined()
      expect(screen.getByText('dogrudan_temin_onay_belgesi_imzali.pdf')).toBeDefined()
      expect(screen.getByText('ek_fatura.pdf')).toBeDefined()
    })
  })
})
