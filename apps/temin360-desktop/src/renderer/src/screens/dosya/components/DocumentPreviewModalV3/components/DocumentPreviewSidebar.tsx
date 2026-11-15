import React, { useState, useMemo } from 'react'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Compass,
  Edit3,
  FileText,
  GitFork,
  Layers,
  Sliders,
  Sparkles,
  Users
} from 'lucide-react'
import { IhtiyacListesiType, TemplateCapabilities } from '@temin360/document-templates'
import { TemplateOptionItem } from '../templateResolver'
import { DocumentPreviewRotaSection } from './DocumentPreviewRotaSection'
import { DocumentPreviewFormBuilder } from './DocumentPreviewFormBuilder'
import { useSettingsStore } from '../../../../../store/settingsStore'
import {
  DOCUMENT_STAGES,
  IHTIYAC_RAPORU_STAGE,
  DocumentStageInfo,
  filterTemplatesByStage
} from '../stages'

interface DocumentPreviewSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarPercent?: number
  setSidebarPercent?: (pct: number) => void
  selectedDocId?: string
  supportsOlur?: boolean
  supportsLogos?: boolean
  templateCapabilities?: Partial<TemplateCapabilities>
  onSelectTemplate?: (id: string) => void
  templateOptions?: TemplateOptionItem[]
  isEditingMode: boolean
  setIsEditingMode: (editing: boolean) => void
  orientation: 'portrait' | 'landscape'
  setOrientation: (orientation: 'portrait' | 'landscape') => void
  formData: Partial<IhtiyacListesiType>
  setFormData: React.Dispatch<React.SetStateAction<Partial<IhtiyacListesiType>>>
  localShowLogoLeft: boolean
  setLocalShowLogoLeft: (show: boolean) => void
  localShowLogoRight: boolean
  setLocalShowLogoRight: (show: boolean) => void
  stageInfo?: DocumentStageInfo
  disableDocumentGuidance?: boolean
  sourceKind?: string
  nextTemplate?: TemplateOptionItem
  prevTemplate?: TemplateOptionItem
  personelListesi?: any[]
  birimListesi?: any[]
}

export function DocumentPreviewSidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarPercent = 33,
  setSidebarPercent,
  selectedDocId,
  supportsOlur,
  supportsLogos = true,
  templateCapabilities,
  onSelectTemplate,
  templateOptions = [],
  isEditingMode,
  setIsEditingMode,
  orientation,
  setOrientation,
  formData,
  setFormData,
  localShowLogoLeft,
  setLocalShowLogoLeft,
  localShowLogoRight,
  setLocalShowLogoRight,
  stageInfo,
  disableDocumentGuidance = true,
  sourceKind,
  nextTemplate,
  personelListesi = [],
  birimListesi = []
}: DocumentPreviewSidebarProps): React.JSX.Element {
  const [activeSidebarTab, setActiveSidebarTab] = useState<'asamalar' | 'ayarlar'>('asamalar')
  const [selectedStageId, setSelectedStageId] = useState<number>(() => stageInfo?.id ?? 1)
  const [prevStageInfoId, setPrevStageInfoId] = useState<number | undefined>(stageInfo?.id)

  if (stageInfo?.id !== prevStageInfoId) {
    setPrevStageInfoId(stageInfo?.id)
    setSelectedStageId(stageInfo?.id ?? 1)
  }

  const stagesList = useMemo(() => {
    if (sourceKind === 'ihtiyacRaporu') {
      return [IHTIYAC_RAPORU_STAGE]
    }
    return DOCUMENT_STAGES
  }, [sourceKind])

  const currentStageTemplates = useMemo(() => {
    if (selectedStageId === 0) {
      return templateOptions
    }
    return filterTemplatesByStage(selectedStageId, templateOptions)
  }, [selectedStageId, templateOptions])

  return (
    <div
      style={
        sidebarOpen
          ? {
              width: `${sidebarPercent}%`,
              minWidth: 320,
              maxWidth: '65%'
            }
          : { width: 0 }
      }
      className={`bg-slate-50 dark:bg-slate-900/50 flex flex-col shrink-0 h-full overflow-hidden transition-[width] duration-150 ease-out ${
        sidebarOpen
          ? 'border-r border-slate-200 dark:border-slate-800 opacity-100'
          : 'border-0 opacity-0 pointer-events-none hidden'
      }`}
    >
      {/* Sidebar Header & Tab Switcher */}
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800/60 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Belge &amp; Süreç
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Yüzdelik Genişlik Seçici */}
            {setSidebarPercent && (
              <div
                className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-800"
                title="Panel Genişliği"
              >
                {[25, 33, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSidebarPercent(pct)}
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      sidebarPercent === pct
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                    title={`Paneli %${pct} genişliğe ayarla`}
                  >
                    %{pct}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsEditingMode(!isEditingMode)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                isEditingMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-2xs ring-1 ring-amber-400/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={isEditingMode ? 'Canlı düzenleme modu açık (Tıklayarak kapatın)' : 'Canlı düzenleme modunu açın'}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingMode ? 'Düzenleme Açık' : 'Düzenle'}</span>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
              title="Paneli Kapat"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2 Tabs: Aşama Belgeleri vs Belge Ayarları */}
        <div className="grid grid-cols-2 p-1 gap-1 bg-slate-100/70 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveSidebarTab('asamalar')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSidebarTab === 'asamalar'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Aşama Belgeleri</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarTab('ayarlar')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSidebarTab === 'ayarlar'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ayarlar</span>
          </button>
        </div>
      </div>

      {activeSidebarTab === 'asamalar' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Üst Sabit Kompakt Mod & Aşama Seçici */}
          <div className="shrink-0 p-2.5 bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 space-y-2">
            {!disableDocumentGuidance ? (
              <div className="px-2.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 truncate">
                    Kılavuzlu Sıra
                  </span>
                </div>
                {nextTemplate && onSelectTemplate && (
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(nextTemplate.id)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Sıradaki</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="px-2.5 py-1 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Serbest Belge Seçimi
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {templateOptions.length} Şablon
                </span>
              </div>
            )}

            {/* Aşama Seçici Butonları (Kompakt + Tümü Seçeneği) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Satın Alma Aşaması
                </span>
                {stagesList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStageId(selectedStageId === 0 ? (stageInfo?.id ?? 1) : 0)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      selectedStageId === 0
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                    }`}
                  >
                    {selectedStageId === 0 ? '✓ Tüm Aşamalar' : 'Tümünü Gör'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {stagesList.map((stg) => {
                  const isSelected = stg.id === selectedStageId
                  return (
                    <button
                      key={stg.id}
                      type="button"
                      onClick={() => setSelectedStageId(stg.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border text-left ${
                        isSelected
                          ? `${stg.badgeBg} ${stg.badgeText} shadow-2xs font-extrabold ring-1 ring-blue-500/30`
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span className="truncate">{stg.shortName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Seçili Aşamaya Ait Belgeler Listesi (Tam Ekran Kaydırılabilir Alan) */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar min-h-0">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Aşama Evrakları ({currentStageTemplates.length})
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {selectedStageId === 0
                  ? 'Tüm Belgeler'
                  : stagesList.find((s) => s.id === selectedStageId)?.shortName}
              </span>
            </div>

            <div className="space-y-1">
              {currentStageTemplates.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  Bu aşamada listelenecek şablon bulunamadı.
                </div>
              ) : (
                currentStageTemplates.map((tpl, idx) => {
                  const isCurActive =
                    tpl.id.replace(/_/g, '-').toLowerCase() ===
                    selectedDocId?.replace(/_/g, '-').toLowerCase()

                  return (
                    <div
                      key={tpl.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectTemplate && onSelectTemplate(tpl.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectTemplate && onSelectTemplate(tpl.id)
                        }
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer border group ${
                        isCurActive
                          ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      {!disableDocumentGuidance ? (
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isCurActive
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      ) : (
                        <FileText
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isCurActive
                              ? 'text-blue-600'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold leading-tight truncate text-[11.5px]">
                          {tpl.title || tpl.name}
                        </div>
                        {tpl.description && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {tpl.description}
                          </div>
                        )}
                      </div>

                      {isCurActive && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Alt Sabit Kompakt Özet Çubuğu */}
          <div className="shrink-0 px-2.5 py-2 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 text-[10px] leading-tight">
              <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 truncate">
                <GitFork className="w-3 h-3 text-purple-600 shrink-0" />
                <span className="truncate">
                  {formData.hazirlayanPersonelAdi || 'Hazırlayan Seçilmedi'}
                </span>
              </div>
              <div className="text-slate-400 truncate">
                Onay: {formData.onaylayanPersonelAdi || 'Seçilmedi'}{' '}
                {Array.isArray((formData as any).rota) && (formData as any).rota.length > 0
                  ? `• ${(formData as any).rota.length} Adım`
                  : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveSidebarTab('ayarlar')
                setTimeout(() => {
                  document
                    .getElementById('sidebar-ayarlar-rota')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 60)
              }}
              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Rota &amp; Ayar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar min-h-0">
          {/* Hızlı Bölüm Atlama Çubuğu */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl sticky top-0 z-10 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('sidebar-ayarlar-duzen')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="px-2 py-1.5 rounded-lg text-[10.5px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
            >
              📐 Düzen
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('sidebar-ayarlar-rota')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="px-2 py-1.5 rounded-lg text-[10.5px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all cursor-pointer text-center"
            >
              🔀 Rota
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('sidebar-ayarlar-form')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="px-2 py-1.5 rounded-lg text-[10.5px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all cursor-pointer text-center"
            >
              📝 Alanlar
            </button>
          </div>

          <div
            id="sidebar-ayarlar-duzen"
            className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-xl text-xs text-blue-900 dark:text-blue-300 leading-relaxed"
          >
            💡 <strong>Canlı Düzenleme:</strong> Belge üzerindeki metin, sayı, tarih ve imza
            alanlarını sağdaki A4 sayfasında doğrudan tıklayarak düzenleyebilirsiniz.
          </div>

          {/* Toggles & Settings */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Görünüm & Düzenleme Kontrolleri
            </span>

            {/* Sayfa Yönü (Dikey / Yatay) */}
            <div className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                Sayfa Yönü (Düzen)
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Dikey</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 rotate-90" />
                  <span>Yatay</span>
                </button>
              </div>
            </div>

            {/* Sayfa Bölme & İmza Dengeleme (Sadece bölünebilir tablo/kalem içeren belgelerde gösterilir) */}
            {(() => {
              const tableRows = (formData.ihtiyacKalemleri ||
                formData.kalemler ||
                formData.items ||
                []) as any[]
              const totalRowCount = tableRows.length
              if (totalRowCount <= 1) {
                return null
              }

              // Generate smart quick split buttons based on actual row count
              const quickRowOptions: { label: string; val: number | null }[] = [
                { label: 'Otomatik', val: null }
              ]
              const candidateValues = [2, 3, 5, 7, 10, 15, 20]
              for (const c of candidateValues) {
                if (c < totalRowCount) {
                  quickRowOptions.push({ label: `${c}. Satır`, val: c })
                }
              }
              if (
                formData.firstPageLimit &&
                !candidateValues.includes(formData.firstPageLimit) &&
                formData.firstPageLimit < totalRowCount
              ) {
                quickRowOptions.push({
                  label: `${formData.firstPageLimit}. Satır`,
                  val: formData.firstPageLimit
                })
              }

              const currentLimit =
                formData.firstPageLimit && formData.firstPageLimit < totalRowCount
                  ? formData.firstPageLimit
                  : null

              return (
                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>✂️ Sayfa Bölme & Denge</span>
                    </span>
                    {currentLimit ? (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            firstPageLimit: null
                          }))
                        }
                        className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-0.5"
                        title="Bölmeyi kaldır, tek sayfaya al"
                      >
                        <span>{currentLimit}. Satırdan Sonra</span>
                        <span>✕</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                        Otomatik
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Tablodaki Kalem Sayısı:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {totalRowCount} Satır
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    1. sayfada kalacak satır sayısını belirleyin. Kalan satırlar ve imza bloğu 2.
                    sayfaya aktarılır.
                  </p>

                  {/* Hızlı Satır Seçim Grid */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>1. Sayfada Kalacak:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {currentLimit
                          ? `${currentLimit} Satır (1..${currentLimit})`
                          : 'Tümü (Otomatik)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {quickRowOptions.slice(0, 6).map((item, idx) => {
                        const isActive =
                          item.val === null ? !currentLimit : currentLimit === item.val
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setFormData((prev: any) => ({
                                ...prev,
                                firstPageLimit: item.val
                              }))
                            }
                            className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Slider & Stepper */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            firstPageLimit: Math.max(
                              1,
                              (currentLimit ?? Math.min(totalRowCount - 1, 10)) - 1
                            )
                          }))
                        }
                        className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-xs font-bold cursor-pointer shrink-0"
                        title="1. sayfadan satır azalt"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="1"
                        max={Math.max(1, totalRowCount - 1)}
                        value={currentLimit ?? Math.min(totalRowCount - 1, 10)}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            firstPageLimit: Number(e.target.value)
                          }))
                        }
                        className="flex-1 accent-blue-600 cursor-pointer h-1 bg-slate-200 dark:bg-slate-800 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            firstPageLimit: Math.min(totalRowCount - 1, (currentLimit ?? 1) + 1)
                          }))
                        }
                        className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-xs font-bold cursor-pointer shrink-0"
                        title="1. sayfaya satır ekle"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* OLUR Bloğu Toggle (Şablon registry tanımında veya veride supportsOlur varsa gösterilir) */}
            {(supportsOlur || typeof (formData as any).olurYazisi === 'boolean') && (
              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  OLUR Bloğunu Göster
                </span>
                <input
                  type="checkbox"
                  checked={formData.olurYazisi !== false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      olurYazisi: e.target.checked
                    }))
                  }
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </label>
            )}

            {/* Sol ve Sağ Amblem / Logo Toggles */}
            {supportsLogos && (
              <>
                {/* Sol Amblem */}
                <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Sol Amblem / Logo
                  </span>
                  <input
                    type="checkbox"
                    checked={localShowLogoLeft}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setLocalShowLogoLeft(checked)
                      if (checked) {
                        const store = useSettingsStore.getState()
                        const fallback = store.logoLeft || store.institutionLogo || null
                        if (
                          fallback &&
                          (!formData.solLogo || String(formData.solLogo).trim() === '')
                        ) {
                          setFormData((prev: any) => ({
                            ...prev,
                            solLogo: fallback
                          }))
                        }
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>

                {/* Sağ Amblem */}
                <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Sağ Amblem / Logo
                  </span>
                  <input
                    type="checkbox"
                    checked={localShowLogoRight}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setLocalShowLogoRight(checked)
                      if (checked) {
                        const store = useSettingsStore.getState()
                        const fallback = store.logoRight || null
                        if (
                          fallback &&
                          (!formData.sagLogo || String(formData.sagLogo).trim() === '')
                        ) {
                          setFormData((prev: any) => ({
                            ...prev,
                            sagLogo: fallback
                          }))
                        }
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </label>
              </>
            )}

            {/* Kurum İçi / Kurum Dışı Yazışma (Alt Bilgi Kontrolü) */}
            <div className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  Yazışma Kapsamı & Alt Bilgi
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    (formData as any).kurumIci !== false
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  {(formData as any).kurumIci !== false ? 'Kurum İçi' : 'Kurum Dışı'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData((prev: any) => ({ ...prev, kurumIci: true }))}
                  className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    (formData as any).kurumIci !== false
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Kurum İçi: Sayfa altında iletişim/adres alt bilgisi basılmaz"
                >
                  <span>🏢 Kurum İçi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev: any) => ({ ...prev, kurumIci: false }))}
                  className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    (formData as any).kurumIci === false
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Kurum Dışı: Sayfa altında adres, web, e-posta, KEP alt bilgisi basılır"
                >
                  <span>🌐 Kurum Dışı</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {(formData as any).kurumIci !== false
                  ? 'Kurum içi evrak: İletişim alt bilgisi basılmaz.'
                  : 'Kurum dışı evrak: Sayfa altında resmi iletişim alt bilgisi basılır.'}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BELGE ÇALIŞMA MODU & ROTA / PARAF / KOORDİNASYON AKIŞI */}
          {/* ========================================================= */}
          <div id="sidebar-ayarlar-rota">
            <DocumentPreviewRotaSection
              formData={formData}
              setFormData={setFormData}
              personelListesi={personelListesi}
              birimListesi={birimListesi}
              supportsOlur={supportsOlur}
              supportsAntet={templateCapabilities?.supportsAntet}
              templateCapabilities={templateCapabilities}
              templateId={selectedDocId}
              dosyaId={(formData as any)?.dosyaId}
            />
          </div>

          {/* ========================================================= */}
          {/* BELGE ALANLARI & FORM BUILDER */}
          {/* ========================================================= */}
          <DocumentPreviewFormBuilder
            formData={formData}
            setFormData={setFormData}
            selectedDocId={selectedDocId}
          />
        </div>
      )}
    </div>
  )
}
