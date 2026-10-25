import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  DOCUMENT_STAGES,
  getStageById,
  getStageForTemplate,
  getAdjacentStageTemplate,
  filterTemplatesByStage
} from '../stages'
import { DocumentPreviewHeader } from '../components/DocumentPreviewHeader'
import { DocumentPreviewSidebar } from '../components/DocumentPreviewSidebar'
import { TemplateOptionItem } from '../templateResolver'

describe('DocumentPreviewModalV3 Stage-Aware Separation & Guidance Mode', () => {
  const mockTemplates: TemplateOptionItem[] = [
    {
      id: 'ihtiyac_listesi',
      name: 'İhtiyaç Listesi',
      title: 'İhtiyaç Listesi',
      category: '1-ihtiyac-tespiti-ve-baslangic',
      categoryLabel: 'Hazırlık'
    },
    {
      id: 'harcama_talimati',
      name: 'Harcama Talimatı',
      title: 'Harcama Talimatı',
      category: '1-ihtiyac-tespiti-ve-baslangic',
      categoryLabel: 'Hazırlık'
    },
    {
      id: 'piyasa_fiyat_arastirma_tutanagi',
      name: 'Piyasa Fiyat Araştırma Tutanağı',
      title: 'Piyasa Fiyat Araştırma Tutanağı',
      category: '2-piyasa-fiyat-arastirmasi',
      categoryLabel: 'Araştırma'
    },
    {
      id: 'yaklasik_maliyet_cetveli',
      name: 'Yaklaşık Maliyet Cetveli',
      title: 'Yaklaşık Maliyet Cetveli',
      category: '2-piyasa-fiyat-arastirmasi',
      categoryLabel: 'Araştırma'
    },
    {
      id: 'siparis_mektubu',
      name: 'Sipariş Mektubu',
      title: 'Sipariş Mektubu',
      category: '3-siparis-ve-sozlesme',
      categoryLabel: 'Sipariş'
    },
    {
      id: 'muayene_kabul_komisyonu',
      name: 'Muayene Kabul Komisyonu',
      title: 'Muayene Kabul Komisyonu',
      category: '4-kabul-ve-odeme-islemleri',
      categoryLabel: 'Kabul'
    },
    {
      id: 'dosya_kapagi',
      name: 'Dosya Kapağı',
      title: 'Dosya Kapağı',
      category: '5-klasor-ve-kapaklar',
      categoryLabel: 'Kapak'
    }
  ]

  describe('stages.ts stage resolution & filtering', () => {
    it('aşama ID veya anahtarlarına göre doğru aşamayı çözümler', () => {
      expect(getStageById(1)?.shortName).toBe('1. Hazırlık')
      expect(getStageById(2)?.shortName).toBe('2. Araştırma')
      expect(getStageById(3)?.shortName).toBe('3. Sipariş')
      expect(getStageById(4)?.shortName).toBe('4. Kabul & Ödeme')
      expect(getStageById(5)?.shortName).toBe('5. Kapaklar')
      expect(getStageById('ihtiyac-raporu')?.shortName).toBe('İhtiyaç Raporu')
      expect(getStageById(0)?.shortName).toBe('İhtiyaç Raporu')
    })

    it('şablon kimliği ve kategorisine göre otomatik aşama eşlemesi yapar', () => {
      expect(getStageForTemplate('ihtiyac_listesi').id).toBe(1)
      expect(getStageForTemplate('piyasa_fiyat_arastirma_tutanagi').id).toBe(2)
      expect(getStageForTemplate('siparis_mektubu').id).toBe(3)
      expect(getStageForTemplate('muayene_kabul_komisyonu').id).toBe(4)
      expect(getStageForTemplate('dosya_kapagi').id).toBe(5)
      expect(getStageForTemplate('luzum_muzekkeresi', null, 'ihtiyacRaporu').id).toBe(0)
    })

    it('filterTemplatesByStage ile aşamaya ait şablonları filtreler', () => {
      const stage1List = filterTemplatesByStage(1, mockTemplates)
      expect(stage1List.some((t) => t.id === 'ihtiyac_listesi')).toBe(true)
      expect(stage1List.some((t) => t.id === 'piyasa_fiyat_arastirma_tutanagi')).toBe(false)

      const stage2List = filterTemplatesByStage(2, mockTemplates)
      expect(stage2List.some((t) => t.id === 'piyasa_fiyat_arastirma_tutanagi')).toBe(true)
      expect(stage2List.some((t) => t.id === 'ihtiyac_listesi')).toBe(false)
    })

    it('getAdjacentStageTemplate ile aşama içi sıradaki ve önceki belgeleri bulur', () => {
      const next = getAdjacentStageTemplate('ihtiyac_listesi', 1, mockTemplates, 'next')
      expect(next?.id).toBe('harcama_talimati')

      const prev = getAdjacentStageTemplate('harcama_talimati', 1, mockTemplates, 'prev')
      expect(prev?.id).toBe('ihtiyac_listesi')
    })
  })

  describe('DocumentPreviewHeader stage badge & guidance actions', () => {
    const defaultHeaderProps = {
      onClose: vi.fn(),
      zoomMode: 'auto' as const,
      manualZoom: 100,
      previewScale: 1,
      setZoomMode: vi.fn(),
      setManualZoom: vi.fn(),
      isFullScreen: false,
      setIsFullScreen: vi.fn(),
      sidebarOpen: true,
      setSidebarOpen: vi.fn(),
      isSaving: false,
      saveSuccess: false,
      handleSaveToDb: vi.fn().mockResolvedValue(undefined),
      isPrinting: false,
      handlePrint: vi.fn().mockResolvedValue(undefined),
      downloadOpen: false,
      setDownloadOpen: vi.fn(),
      dropdownRef: { current: null },
      handleRefreshFromDb: vi.fn().mockResolvedValue(undefined),
      handlePdf: vi.fn().mockResolvedValue(undefined),
      handleOpenPdfInNewTab: vi.fn().mockResolvedValue(undefined)
    }

    it('kılavuzlu modda (disableDocumentGuidance=false) aşama rozeti ve Sıradaki Belge butonunu gösterir', () => {
      const onSelect = vi.fn()
      render(
        <DocumentPreviewHeader
          {...defaultHeaderProps}
          documentTitle="İhtiyaç Listesi"
          stageInfo={DOCUMENT_STAGES[0]}
          disableDocumentGuidance={false}
          nextTemplate={mockTemplates[1]}
          onSelectTemplate={onSelect}
        />
      )

      expect(screen.getByText('1. Hazırlık')).toBeTruthy()
      expect(screen.getByText('Kılavuzlu Mod')).toBeTruthy()
      const nextBtn = screen.getByText('Sıradaki Belge')
      expect(nextBtn).toBeTruthy()

      fireEvent.click(nextBtn)
      expect(onSelect).toHaveBeenCalledWith('harcama_talimati')
    })

    it('serbest modda (disableDocumentGuidance=true) Serbest Mod rozeti gösterir ve yönlendirmeyi dayatmaz', () => {
      render(
        <DocumentPreviewHeader
          {...defaultHeaderProps}
          documentTitle="İhtiyaç Listesi"
          stageInfo={DOCUMENT_STAGES[0]}
          disableDocumentGuidance={true}
        />
      )

      expect(screen.getByText('1. Hazırlık')).toBeTruthy()
      expect(screen.getByText('Serbest Mod')).toBeTruthy()
      expect(screen.queryByText('Sıradaki Belge')).toBeNull()
    })
  })

  describe('DocumentPreviewSidebar stage tabs & document listing', () => {
    it('aşama sekmelerini (1. Hazırlık, 2. Araştırma...) ve belge listesini render eder', () => {
      const onSelect = vi.fn()
      render(
        <DocumentPreviewSidebar
          sidebarOpen={true}
          setSidebarOpen={vi.fn()}
          selectedDocId="ihtiyac_listesi"
          templateOptions={mockTemplates}
          isEditingMode={false}
          setIsEditingMode={vi.fn()}
          orientation="portrait"
          setOrientation={vi.fn()}
          formData={{}}
          setFormData={vi.fn()}
          localShowLogoLeft={true}
          setLocalShowLogoLeft={vi.fn()}
          localShowLogoRight={true}
          setLocalShowLogoRight={vi.fn()}
          stageInfo={DOCUMENT_STAGES[0]}
          disableDocumentGuidance={false}
          onSelectTemplate={onSelect}
        />
      )

      // Aşama butonları
      expect(screen.getAllByText('1. Hazırlık').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('2. Araştırma').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('3. Sipariş').length).toBeGreaterThanOrEqual(1)

      // 1. Aşamaya ait belgeler listelenmeli
      expect(screen.getByText('İhtiyaç Listesi')).toBeTruthy()
      expect(screen.getByText('Harcama Talimatı')).toBeTruthy()

      // Farklı aşamaya tıklanınca o aşamadaki belgeleri listelemeli
      fireEvent.click(screen.getAllByText('2. Araştırma')[0])
      expect(screen.getByText('Piyasa Fiyat Araştırma Tutanağı')).toBeTruthy()
      expect(screen.getByText('Yaklaşık Maliyet Cetveli')).toBeTruthy()
    })
  })
})
