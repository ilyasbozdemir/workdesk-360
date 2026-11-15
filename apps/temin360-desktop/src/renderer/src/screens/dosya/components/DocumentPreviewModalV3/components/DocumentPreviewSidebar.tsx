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
import {
  IhtiyacListesiType,
  TemplateCapabilities,
  detectAlimTuru,
  AlimTuru
} from '@temin360/document-templates'
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

export type SidebarTab = 'belgeler' | 'alanlar' | 'rota' | 'duzen' | 'asamalar' | 'ayarlar'

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
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('belgeler')
  const [selectedStageId, setSelectedStageId] = useState<number>(() => stageInfo?.id ?? 1)
  const [prevStageInfoId, setPrevStageInfoId] = useState<number | undefined>(stageInfo?.id)

  if (stageInfo?.id !== prevStageInfoId) {
    setPrevStageInfoId(stageInfo?.id)
    setSelectedStageId(stageInfo?.id ?? 1)
  }

  const [onlyCompatibleAlimTuru, setOnlyCompatibleAlimTuru] = useState(true)

  const activeAlimTuru: AlimTuru = useMemo(() => {
    return detectAlimTuru(formData)
  }, [formData])

  const stagesList = useMemo(() => {
    if (sourceKind === 'ihtiyacRaporu') {
      return [IHTIYAC_RAPORU_STAGE]
    }
    return DOCUMENT_STAGES
  }, [sourceKind])

  const currentStageTemplates = useMemo(() => {
    let list = templateOptions
    if (selectedStageId !== 0) {
      list = filterTemplatesByStage(selectedStageId, templateOptions)
    }

    if (!onlyCompatibleAlimTuru) return list

    // Aktif alım türüne (Mal, Hizmet, Yapım, Danışmanlık) göre filtrele:
    return list.filter((tpl) => {
      if (!tpl.alimTurleri || tpl.alimTurleri.length === 0) return true
      return tpl.alimTurleri.includes(activeAlimTuru)
    })
  }, [selectedStageId, templateOptions, activeAlimTuru, onlyCompatibleAlimTuru])

  // Normalleştirilmiş aktif sekme
  const normalizedTab: 'belgeler' | 'alanlar' | 'rota' | 'duzen' =
    activeSidebarTab === 'asamalar'
      ? 'belgeler'
      : activeSidebarTab === 'ayarlar'
        ? 'rota'
        : activeSidebarTab

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
              Belge &amp; Süreç Paneli
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

        {/* 4 Ana Sekme: Belgeler | Alanlar | Rota & İmza | Sayfa & Düzen */}
        <div className="grid grid-cols-4 p-1 gap-1 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSidebarTab('belgeler')}
            className={`px-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              normalizedTab === 'belgeler'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
            title="Aşama Evrakları ve Süreç Belgeleri"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Belgeler</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab('alanlar')}
            className={`px-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              normalizedTab === 'alanlar'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
            title="Form Verileri, Bütçe ve Açıklamalar"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Alanlar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab('rota')}
            className={`px-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              normalizedTab === 'rota'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-2xs font-extrabold ring-1 ring-purple-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
            title="İmza Rotası, Yetkililer ve Kurum Birimi"
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Rota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab('duzen')}
            className={`px-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              normalizedTab === 'duzen'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold ring-1 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
            title="Sayfa Yönü, Bölme Ayarı ve Logolar"
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Düzen</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SEKME: BELGELER (AŞAMA EVRAKLARI & SÜREÇ GEÇİŞLERİ)                   */}
      {/* ========================================================================= */}
      {normalizedTab === 'belgeler' && (
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
            <div className="flex items-center justify-between px-0.5 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Aşama Evrakları ({currentStageTemplates.length})
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    activeAlimTuru === 'yapim'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : activeAlimTuru === 'hizmet'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : activeAlimTuru === 'danismanlik'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  }`}
                  title={`Aktif dosya alım türü: ${activeAlimTuru.toUpperCase()}`}
                >
                  {activeAlimTuru === 'yapim'
                    ? '🏗️ Yapım'
                    : activeAlimTuru === 'hizmet'
                      ? '💼 Hizmet'
                      : activeAlimTuru === 'danismanlik'
                        ? '💡 Danışmanlık'
                        : '📦 Mal'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOnlyCompatibleAlimTuru((prev) => !prev)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  onlyCompatibleAlimTuru
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={onlyCompatibleAlimTuru ? 'Tüm şablonları göster' : 'Yalnızca alım türüne uygunları göster'}
              >
                {onlyCompatibleAlimTuru ? 'Filtreli' : 'Tümü'}
              </button>
            </div>

            {currentStageTemplates.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                Bu aşamada ve alım türünde ({activeAlimTuru.toUpperCase()}) şablon bulunamadı.
              </div>
            ) : (
              currentStageTemplates.map((tpl) => {
                const isActive = tpl.id === selectedDocId
                return (
                  <div
                    key={tpl.id}
                    onClick={() => onSelectTemplate?.(tpl.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 shadow-2xs ring-1 ring-blue-400/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive
                              ? 'text-blue-900 dark:text-blue-200 font-extrabold'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {tpl.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="truncate">{tpl.categoryLabel}</span>
                        {tpl.alimTurleri && tpl.alimTurleri.length === 1 && (
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                              tpl.alimTurleri[0] === 'yapim'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {tpl.alimTurleri[0] === 'yapim' ? '🏗️ Yapım' : '📦 Mal'}
                          </span>
                        )}
                        {tpl.capabilities?.requiresCommission && (
                          <span className="px-1 py-0.2 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded text-[9px] font-semibold shrink-0">
                            Komisyon
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Alt Sabit Kompakt Özet Çubuğu */}
          <div className="shrink-0 px-2.5 py-2 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {(() => {
              const isAppointment =
                selectedDocId?.includes('gorevlendirme') ||
                selectedDocId?.includes('komisyon')
              return (
                <div className="min-w-0 flex-1 text-[10px] leading-tight">
                  {!isAppointment && (
                    <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 truncate">
                      <GitFork className="w-3 h-3 text-purple-600 shrink-0" />
                      <span className="truncate">
                        {formData.hazirlayanPersonelAdi || 'Hazırlayan Seçilmedi'}
                      </span>
                    </div>
                  )}
                  <div className={`truncate ${isAppointment ? 'font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1' : 'text-slate-400'}`}>
                    {isAppointment && <Users className="w-3 h-3 text-blue-600 shrink-0" />}
                    <span>
                      Onay: {formData.onaylayanPersonelAdi || formData.baskanAdi || 'Seçilmedi'}{' '}
                      {Array.isArray((formData as any).rota) && (formData as any).rota.length > 0
                        ? `• ${(formData as any).rota.length} Adım`
                        : ''}
                    </span>
                  </div>
                </div>
              )
            })()}
            <button
              type="button"
              onClick={() => setActiveSidebarTab('rota')}
              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Rota &amp; Ayar</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEKME: ALANLAR (FORM BUILDER & CANLI VERİ KÖPRÜSÜ)                    */}
      {/* ========================================================================= */}
      {normalizedTab === 'alanlar' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar min-h-0">
          <DocumentPreviewFormBuilder
            formData={formData}
            setFormData={setFormData}
            selectedDocId={selectedDocId}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEKME: ROTA & İMZA (ONAY MAKAMI, BİRİM, KOMİSYON VE ARŞİV)           */}
      {/* ========================================================================= */}
      {normalizedTab === 'rota' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar min-h-0">
          <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 rounded-xl text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
            🔀 <strong>Rota & Yetkili Yönetimi:</strong> Harcama birimini, kurum antetini, onay makamını ve komisyon üyelerini bu alandan tekil veya şablon varsayılanı olarak ayarlayabilirsiniz.
          </div>

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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SEKME: SAYFA & DÜZEN (A4 BASKI, BÖLME, LOGO VE ALT BİLGİ KONTROLÜ)   */}
      {/* ========================================================================= */}
      {normalizedTab === 'duzen' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar min-h-0">
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
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
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
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 rotate-90" />
                  <span>Yatay</span>
                </button>
              </div>
            </div>

            {/* Sayfa Bölme & İmza Dengeleme */}
            {(() => {
              const tableRows = (formData.ihtiyacKalemleri ||
                formData.kalemler ||
                formData.items ||
                []) as any[]
              const totalRowCount = tableRows.length
              if (totalRowCount <= 1) {
                return null
              }

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

            {/* OLUR Bloğu Toggle */}
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

            {/* Kurum İçi / Kurum Dışı Yazışma */}
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
        </div>
      )}
    </div>
  )
}
