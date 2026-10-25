import React, { useState, useMemo, useEffect } from 'react'
import { Sablon } from '../../sablonlar/sablonlar.hooks'
import {
  usePrintQueueStore,
  CURRENT_APP_VERSION,
  PrintSettings
} from '../../../store/printQueueStore'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { TekTikYazdirHeader } from './tek-tik-yazdir/TekTikYazdirHeader'
import { TekTikYazdirDocList } from './tek-tik-yazdir/TekTikYazdirDocList'
import { TekTikYazdirPreview } from './tek-tik-yazdir/TekTikYazdirPreview'
import { TekTikYazdirSettingsPanel } from './tek-tik-yazdir/TekTikYazdirSettingsPanel'
import { TekTikYazdirActionBar } from './tek-tik-yazdir/TekTikYazdirActionBar'
import { CiktiWizardStepper, WizardStepId } from './tek-tik-yazdir/CiktiWizardStepper'
import {
  CiktiWizardCommonDataStep,
  CommonWizardData
} from './tek-tik-yazdir/CiktiWizardCommonDataStep'
import { CiktiWizardVisibilityStep } from './tek-tik-yazdir/CiktiWizardVisibilityStep'
import { CiktiWizardReviewStep } from './tek-tik-yazdir/CiktiWizardReviewStep'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export interface TekTikYazdirModalProps {
  isOpen: boolean
  onClose: () => void
  sablons: Sablon[]
  activeDosya?: Record<string, unknown> | null
  activeStarredDocs?: string[]
  initialSelectedIds?: number[]
  renderHtml: (sablon: Sablon) => string
  onExecutePrint: (
    selectedSablons: Sablon[],
    action: 'print' | 'pdf' | 'zip',
    settings: PrintSettings
  ) => Promise<void>
  getMissingRequirement?: (sablon: Sablon) => string | null
  normalizeForMatch?: (str: string) => string
}

export function TekTikYazdirModal({
  isOpen,
  onClose,
  sablons,
  activeDosya,
  initialSelectedIds = [],
  renderHtml,
  onExecutePrint,
  getMissingRequirement,
  normalizeForMatch = (s) => s.toLowerCase()
}: TekTikYazdirModalProps): React.JSX.Element | null {
  const { activeDosyaId } = useWorkspaceStore()
  const { getDocumentStatus, unlockDocument, markAsPrinted } = usePrintQueueStore()

  // Wizard Mode & Step State (Varsayılan sihirbaz açık, toggle edilebilir)
  const [wizardMode, setWizardMode] = useState<boolean>(true)
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(initialSelectedIds))
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [processingAction, setProcessingAction] = useState<'print' | 'pdf' | 'zip' | null>(null)
  const [showSettings, setShowSettings] = useState<boolean>(true)

  // Document custom data map (Belge başına flat key veriler)
  const [documentDataMap, setDocumentDataMap] = useState<Record<string, Record<string, unknown>>>(
    {}
  )

  // Ortak Bilgiler Form State (Dosyadaki varsayılan personeller ve tarih)
  const [commonData, setCommonData] = useState<CommonWizardData>({
    tarih: (activeDosya?.dosya_tarihi as string) || (activeDosya?.tarih as string) || '',
    muhatap: '',
    hazirlayanAdi: '',
    hazirlayanUnvan: '',
    onaylayanAdi: '',
    onaylayanUnvan: '',
    talepEdenAdi: '',
    talepEdenUnvan: ''
  })

  // Print settings
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    pageSize: 'A4',
    orientation: 'portrait',
    copies: 1,
    printBackground: true,
    showPageNumbers: true,
    scale: 100
  })

  // Auto-lock toggle
  const [autoLockOnPrint, setAutoLockOnPrint] = useState<boolean>(true)

  // Sync initial state when modal opens
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      if (initialSelectedIds.length > 0) {
        setSelectedIds(new Set(initialSelectedIds))
      } else {
        const validIds = sablons
          .filter((s) => !(getMissingRequirement && getMissingRequirement(s)))
          .map((s) => s.id)
        setSelectedIds(new Set(validIds))
      }
      setActivePreviewIndex(0)
      setCurrentStep(1)

      // Initialize common data defaults from activeDosya
      if (activeDosya) {
        setCommonData((prev) => ({
          ...prev,
          tarih:
            prev.tarih ||
            (activeDosya.dosya_tarihi as string) ||
            (activeDosya.tarih as string) ||
            new Date().toISOString().split('T')[0]
        }))
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen, initialSelectedIds, sablons, getMissingRequirement, activeDosya])

  // Filtered sablons list
  const filteredSablons = useMemo(() => {
    if (!searchQuery.trim()) return sablons
    const q = normalizeForMatch(searchQuery)
    return sablons.filter(
      (s) =>
        normalizeForMatch(s.ad).includes(q) ||
        normalizeForMatch(s.dosya_adi || '').includes(q) ||
        normalizeForMatch(s.kategori || '').includes(q)
    )
  }, [sablons, searchQuery, normalizeForMatch])

  // Selected Sablons array
  const selectedSablons = useMemo(() => {
    return sablons.filter((s) => selectedIds.has(s.id))
  }, [sablons, selectedIds])

  // Active preview sablon
  const currentPreviewSablon = selectedSablons[activePreviewIndex] || selectedSablons[0] || null

  // Render HTML for current preview
  const previewHtml = useMemo(() => {
    if (!currentPreviewSablon) return ''
    try {
      return renderHtml(currentPreviewSablon)
    } catch (e) {
      console.error('Error rendering HTML in preview:', e)
      return '<div style="padding: 40px; color: red;">Belge render edilirken hata oluştu.</div>'
    }
  }, [currentPreviewSablon, renderHtml])

  if (!isOpen) return null

  const toggleSelect = (id: number): void => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
    if (activePreviewIndex >= next.size) {
      setActivePreviewIndex(Math.max(0, next.size - 1))
    }
  }

  const selectAll = (): void => {
    const valid = sablons
      .filter((s) => !(getMissingRequirement && getMissingRequirement(s)))
      .map((s) => s.id)
    setSelectedIds(new Set(valid))
  }

  const selectNone = (): void => {
    setSelectedIds(new Set())
  }

  const selectReadyOnly = (): void => {
    if (!activeDosyaId) return
    const readyIds = sablons
      .filter((s) => {
        const docKey = (s.dosya_adi || '').replace(/\.html$/, '')
        const status = getDocumentStatus(activeDosyaId, docKey)
        return status === 'ready_to_print'
      })
      .map((s) => s.id)
    setSelectedIds(new Set(readyIds))
  }

  const handleUnlock = (sablon: Sablon, e: React.MouseEvent): void => {
    e.stopPropagation()
    if (!activeDosyaId) return
    const docKey = (sablon.dosya_adi || '').replace(/\.html$/, '')
    const confirmUnlock = window.confirm(
      `"${sablon.ad}" belgesinin yazdırma kilidini açmak ve yeniden düzenlemeye izin vermek istiyor musunuz?`
    )
    if (confirmUnlock) {
      unlockDocument(activeDosyaId, docKey)
    }
  }

  const handleSelectPreview = (sablon: Sablon): void => {
    const selIndex = selectedSablons.findIndex((s) => s.id === sablon.id)
    if (selIndex >= 0) setActivePreviewIndex(selIndex)
  }

  const handleAction = async (action: 'print' | 'pdf' | 'zip'): Promise<void> => {
    if (selectedSablons.length === 0) return
    setProcessingAction(action)
    try {
      if (autoLockOnPrint && activeDosyaId && (action === 'print' || action === 'pdf')) {
        selectedSablons.forEach((s) => {
          const docKey = (s.dosya_adi || '').replace(/\.html$/, '')
          markAsPrinted(activeDosyaId, docKey, CURRENT_APP_VERSION, printSettings)
        })
      }
      await onExecutePrint(selectedSablons, action, printSettings)
      if (action === 'print') {
        onClose()
      }
    } finally {
      setProcessingAction(null)
    }
  }

  const handleQuickOutput = (): void => {
    setCurrentStep(5)
  }

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center p-2 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-387.5 h-[92vh] flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* TOP HEADER */}
        <TekTikYazdirHeader
          activeDosya={activeDosya}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onClose={onClose}
        />

        {/* STEPPER BAR (Sihirbaz Modu Aktifken) */}
        {wizardMode && (
          <CiktiWizardStepper
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            selectedCount={selectedSablons.length}
            wizardMode={wizardMode}
            setWizardMode={setWizardMode}
            onQuickOutput={handleQuickOutput}
          />
        )}

        {/* MAIN BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* KLASİK MOD (Sihirbaz Kapalıysa Tüm Paneller Yan Yana) */}
          {!wizardMode ? (
            <>
              {/* LEFT: DOCUMENT SELECTOR & LOCK STATUS */}
              <TekTikYazdirDocList
                sablons={sablons}
                filteredSablons={filteredSablons}
                selectedIds={selectedIds}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentPreviewSablon={currentPreviewSablon}
                activeDosyaId={activeDosyaId}
                getMissingRequirement={getMissingRequirement}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onSelectReadyOnly={selectReadyOnly}
                onSelectNone={selectNone}
                onUnlock={handleUnlock}
                onSelectPreview={handleSelectPreview}
              />

              {/* CENTER: LIVE HIGH-RESOLUTION DOCUMENT PREVIEW */}
              <TekTikYazdirPreview
                currentPreviewSablon={currentPreviewSablon}
                selectedSablonsCount={selectedSablons.length}
                activePreviewIndex={activePreviewIndex}
                setActivePreviewIndex={setActivePreviewIndex}
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
                previewHtml={previewHtml}
              />

              {/* RIGHT: PRINT SETTINGS PANEL */}
              {showSettings && (
                <TekTikYazdirSettingsPanel
                  printSettings={printSettings}
                  setPrintSettings={setPrintSettings}
                  autoLockOnPrint={autoLockOnPrint}
                  setAutoLockOnPrint={setAutoLockOnPrint}
                />
              )}
            </>
          ) : (
            /* SİHİRBAZ MODU ADIMLARI */
            <>
              {/* ADIM 1: BELGELER */}
              {currentStep === 1 && (
                <div className="flex-1 flex overflow-hidden">
                  <TekTikYazdirDocList
                    sablons={sablons}
                    filteredSablons={filteredSablons}
                    selectedIds={selectedIds}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    currentPreviewSablon={currentPreviewSablon}
                    activeDosyaId={activeDosyaId}
                    getMissingRequirement={getMissingRequirement}
                    onToggleSelect={toggleSelect}
                    onSelectAll={selectAll}
                    onSelectReadyOnly={selectReadyOnly}
                    onSelectNone={selectNone}
                    onUnlock={handleUnlock}
                    onSelectPreview={handleSelectPreview}
                  />

                  {/* ADIM 1 SAĞ TARAF: ÖZET & İLERLE PANELİ */}
                  <div className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          Seçili Belgeler Özeti
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Alım türüne ve sürece göre yazdırılacak belgeleri sol listeden
                          işaretleyin.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Toplam Belge:</span>
                          <span className="font-bold text-slate-200">{sablons.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Seçilen Belge:</span>
                          <span className="font-bold text-blue-400 text-sm">
                            {selectedSablons.length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {selectedSablons.map((s, idx) => (
                          <div
                            key={s.id}
                            className="p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl text-xs flex items-center justify-between"
                          >
                            <span className="truncate pr-2 text-slate-300">
                              {idx + 1}. {s.ad}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              #{s.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <button
                        type="button"
                        disabled={selectedSablons.length === 0}
                        onClick={() => setCurrentStep(2)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
                      >
                        <span>2. Ortak Bilgiler Adımına Geç</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ADIM 2: ORTAK BİLGİLER */}
              {currentStep === 2 && (
                <CiktiWizardCommonDataStep
                  selectedSablons={selectedSablons}
                  activeDosya={activeDosya}
                  commonData={commonData}
                  setCommonData={setCommonData}
                  documentDataMap={documentDataMap}
                  setDocumentDataMap={setDocumentDataMap}
                  onProceed={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {/* ADIM 3: GÖSTER / GİZLE */}
              {currentStep === 3 && (
                <CiktiWizardVisibilityStep
                  selectedSablons={selectedSablons}
                  documentDataMap={documentDataMap}
                  setDocumentDataMap={setDocumentDataMap}
                  onProceed={() => setCurrentStep(4)}
                  onBack={() => setCurrentStep(2)}
                />
              )}

              {/* ADIM 4: KONTROL */}
              {currentStep === 4 && (
                <CiktiWizardReviewStep
                  selectedSablons={selectedSablons}
                  documentDataMap={documentDataMap}
                  onProceed={() => setCurrentStep(5)}
                  onBack={() => setCurrentStep(3)}
                />
              )}

              {/* ADIM 5: ÇIKTI & YAZDIR */}
              {currentStep === 5 && (
                <>
                  {/* LEFT: COMPACT DOC SELECTOR */}
                  <TekTikYazdirDocList
                    sablons={sablons}
                    filteredSablons={filteredSablons}
                    selectedIds={selectedIds}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    currentPreviewSablon={currentPreviewSablon}
                    activeDosyaId={activeDosyaId}
                    getMissingRequirement={getMissingRequirement}
                    onToggleSelect={toggleSelect}
                    onSelectAll={selectAll}
                    onSelectReadyOnly={selectReadyOnly}
                    onSelectNone={selectNone}
                    onUnlock={handleUnlock}
                    onSelectPreview={handleSelectPreview}
                  />

                  {/* CENTER: PREVIEW */}
                  <TekTikYazdirPreview
                    currentPreviewSablon={currentPreviewSablon}
                    selectedSablonsCount={selectedSablons.length}
                    activePreviewIndex={activePreviewIndex}
                    setActivePreviewIndex={setActivePreviewIndex}
                    zoomLevel={zoomLevel}
                    setZoomLevel={setZoomLevel}
                    previewHtml={previewHtml}
                  />

                  {/* RIGHT: SETTINGS */}
                  {showSettings && (
                    <TekTikYazdirSettingsPanel
                      printSettings={printSettings}
                      setPrintSettings={setPrintSettings}
                      autoLockOnPrint={autoLockOnPrint}
                      setAutoLockOnPrint={setAutoLockOnPrint}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* BOTTOM ACTION BAR (Her zaman 5. adımda veya klasik modda aktiftir) */}
        {(!wizardMode || currentStep === 5) && (
          <TekTikYazdirActionBar
            selectedCount={selectedSablons.length}
            pageSize={printSettings.pageSize || 'A4'}
            orientation={printSettings.orientation || 'portrait'}
            processingAction={processingAction}
            onAction={handleAction}
          />
        )}
      </div>
    </div>
  )
}
