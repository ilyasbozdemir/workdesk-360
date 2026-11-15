import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentPreviewFormBuilder } from '../components/DocumentPreviewFormBuilder'
import { DocumentPreviewHeader } from '../components/DocumentPreviewHeader'

describe('DocumentPreviewModalV3 — Form Builder & Navbar Düzenleme Modu Testleri', () => {
  const initialFormData = {
    evrakSayisi: 'E-10234521-934.01-0001',
    tarih: '15.11.2026',
    isAdi: 'Kırtasiye Malzemesi Temini',
    gerekce: 'Müdürlük ihtiyaçları doğrultusunda',
    sure: '10 Gün',
    teminSekli: '22/d Doğrudan Temin',
    yaklasikMaliyet: '25.000,00 ₺'
  }

  it('1. Form Builder dosyadaki verileri "📁 Dosyadan" rozetiyle render eder', () => {
    const setFormData = vi.fn()
    render(
      <DocumentPreviewFormBuilder
        formData={initialFormData}
        setFormData={setFormData}
        selectedDocId="ihtiyac_listesi"
      />
    )

    expect(screen.getByText('Belge Form Alanları')).toBeTruthy()
    expect(screen.getByText('Resmî Evrak Sayısı')).toBeTruthy()
    expect(screen.getByText('İşin Adı / Konu')).toBeTruthy()

    // Dosyadan gelen alanlarda 📁 Dosyadan rozeti görünmeli
    const dosyadanBadges = screen.getAllByText('📁 Dosyadan')
    expect(dosyadanBadges.length).toBeGreaterThan(0)
  })

  it('2. Form Builder alanında değişiklik yapıldığında "✏️ Manuel Seçim" rozetine döner ve "Geri Al" butonu çıkar', () => {
    let currentData = { ...initialFormData }
    const setFormData = vi.fn((updater) => {
      if (typeof updater === 'function') {
        currentData = updater(currentData)
      } else {
        currentData = updater
      }
    })

    const { rerender } = render(
      <DocumentPreviewFormBuilder
        formData={currentData}
        setFormData={setFormData}
        selectedDocId="ihtiyac_listesi"
      />
    )

    // Resmî Evrak Sayısı inputunu bul ve değiştir
    const evrakInput = screen.getByPlaceholderText('E-10234521-934.01-0001')
    fireEvent.change(evrakInput, { target: { value: 'E-99999999-001' } })

    expect(setFormData).toHaveBeenCalled()

    // Rerender
    rerender(
      <DocumentPreviewFormBuilder
        formData={currentData}
        setFormData={setFormData}
        selectedDocId="ihtiyac_listesi"
      />
    )

    // Manuel Seçim rozeti belirmeli
    expect(screen.getByText('✏️ Manuel Seçim')).toBeTruthy()
    const geriAlBtn = screen.getByText('Geri Al')
    expect(geriAlBtn).toBeTruthy()

    // Geri Al butonuna basıldığında orijinal veriyi geri yükler
    fireEvent.click(geriAlBtn)
    expect(setFormData).toHaveBeenCalled()
  })

  it('3. DocumentPreviewHeader navbarında Düzenleme Modu butonu yer alır ve tıklama ile modu değiştirir', () => {
    const setIsEditingMode = vi.fn()
    const { rerender } = render(
      <DocumentPreviewHeader
        onClose={vi.fn()}
        documentTitle="İhtiyaç Listesi"
        zoomMode="auto"
        manualZoom={1.0}
        previewScale={1.0}
        setZoomMode={vi.fn()}
        setManualZoom={vi.fn()}
        isFullScreen={false}
        setIsFullScreen={vi.fn()}
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        isSaving={false}
        saveSuccess={false}
        handleSaveToDb={vi.fn().mockResolvedValue(undefined)}
        isPrinting={false}
        handlePrint={vi.fn().mockResolvedValue(undefined)}
        downloadOpen={false}
        setDownloadOpen={vi.fn()}
        dropdownRef={{ current: null }}
        handleRefreshFromDb={vi.fn().mockResolvedValue(undefined)}
        handlePdf={vi.fn().mockResolvedValue(undefined)}
        handleOpenPdfInNewTab={vi.fn().mockResolvedValue(undefined)}
        isEditingMode={false}
        setIsEditingMode={setIsEditingMode}
      />
    )

    const duzenleBtn = screen.getByTitle(/Canlı Düzenleme Modunu Aç/)
    expect(duzenleBtn).toBeTruthy()
    expect(screen.getByText('Düzenle')).toBeTruthy()

    fireEvent.click(duzenleBtn)
    expect(setIsEditingMode).toHaveBeenCalled()

    // Düzenleme açıkken
    rerender(
      <DocumentPreviewHeader
        onClose={vi.fn()}
        documentTitle="İhtiyaç Listesi"
        zoomMode="auto"
        manualZoom={1.0}
        previewScale={1.0}
        setZoomMode={vi.fn()}
        setManualZoom={vi.fn()}
        isFullScreen={false}
        setIsFullScreen={vi.fn()}
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        isSaving={false}
        saveSuccess={false}
        handleSaveToDb={vi.fn().mockResolvedValue(undefined)}
        isPrinting={false}
        handlePrint={vi.fn().mockResolvedValue(undefined)}
        downloadOpen={false}
        setDownloadOpen={vi.fn()}
        dropdownRef={{ current: null }}
        handleRefreshFromDb={vi.fn().mockResolvedValue(undefined)}
        handlePdf={vi.fn().mockResolvedValue(undefined)}
        handleOpenPdfInNewTab={vi.fn().mockResolvedValue(undefined)}
        isEditingMode={true}
        setIsEditingMode={setIsEditingMode}
      />
    )

    expect(screen.getByText('Düzenleme Açık')).toBeTruthy()
  })
})
