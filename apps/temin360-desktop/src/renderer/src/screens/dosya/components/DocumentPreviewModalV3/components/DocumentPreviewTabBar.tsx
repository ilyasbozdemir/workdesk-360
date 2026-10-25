import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Compass, Copy, FileText, Layers, Plus, Search, X } from 'lucide-react'
import { DocumentPreviewTab } from '../../../../../store/globalDocumentPreviewStore'
import { TemplateOptionItem } from '../templateResolver'
import { copyToClipboard } from '../../../../../utils/copyToClipboard'
import { cn } from '../../../../../utils/cn'
import {
  DOCUMENT_STAGES,
  IHTIYAC_RAPORU_STAGE,
  DocumentStageInfo,
  filterTemplatesByStage
} from '../stages'

export interface DocumentPreviewTabBarProps {
  tabs: DocumentPreviewTab[]
  activeTabId: string | null
  onSwitchTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onAddTab?: (params: {
    documentId: string
    dosyaId?: number | null
    documentTitle?: string
  }) => void
  templateOptions?: TemplateOptionItem[]
  currentDosyaId?: number | null
  onToggleBalloon?: () => void
  isFullScreen?: boolean
  setIsFullScreen?: React.Dispatch<React.SetStateAction<boolean>>
  onClose?: () => void
  stageInfo?: DocumentStageInfo
  disableDocumentGuidance?: boolean
  sourceKind?: string
}

export function DocumentPreviewTabBar({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onAddTab,
  templateOptions = [],
  currentDosyaId,
  stageInfo,
  disableDocumentGuidance,
  sourceKind
}: DocumentPreviewTabBarProps): React.JSX.Element | null {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStageFilter, setSelectedStageFilter] = useState<number | 'all'>('all')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const handleCopyId = async (e: React.MouseEvent, id: string): Promise<void> => {
    e.stopPropagation()
    await copyToClipboard(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const updateCoords = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 320
      let left = rect.left
      if (left + menuWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - menuWidth - 12)
      }
      let top = rect.bottom + 6
      if (top + 400 > window.innerHeight) {
        top = Math.max(12, rect.top - 400 - 6)
      }
      setCoords({ top, left })
    }
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return undefined
    updateCoords()
    const handleScrollOrResize = () => updateCoords()
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [dropdownOpen, updateCoords])

  useEffect(() => {
    if (!dropdownOpen) return undefined
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setDropdownOpen(false)
        setSearchTerm('')
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen])

  useEffect(() => {
    if (!dropdownOpen) return undefined
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [dropdownOpen])

  const stagesList = useMemo(() => {
    if (sourceKind === 'ihtiyacRaporu') {
      return [IHTIYAC_RAPORU_STAGE]
    }
    return DOCUMENT_STAGES
  }, [sourceKind])

  const filteredTemplates = useMemo(() => {
    let list = templateOptions
    if (selectedStageFilter !== 'all') {
      list = filterTemplatesByStage(selectedStageFilter, list)
    }
    if (!searchTerm.trim()) return list
    const term = searchTerm.toLowerCase()
    return list.filter(
      (opt) =>
        opt.title.toLowerCase().includes(term) ||
        opt.id.toLowerCase().includes(term) ||
        (opt.category && opt.category.toLowerCase().includes(term))
    )
  }, [templateOptions, selectedStageFilter, searchTerm])

  if (tabs.length === 0) return null

  return (
    <div className="flex items-end justify-between border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950 px-3 pt-1.5 h-10.5 shrink-0 select-none relative z-30">
      {/* Sol: Belge Sekmeleri ve Hemen Yanındaki [+] Butonu */}
      <div className="flex items-end gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0">
        {tabs.map((tab) => {
          const isActive = tab.tabId === activeTabId
          const firmUnvan =
            typeof tab.selectedFirma?.unvan === 'string' ? (tab.selectedFirma.unvan as string) : ''
          const firmText = firmUnvan ? ` (${firmUnvan.substring(0, 16)}...)` : ''
          const titleText = tab.documentTitle || tab.documentId
          const dosyaPrefix = tab.dosyaNo
            ? `${tab.dosyaNo} • `
            : tab.dosyaId
              ? `#${tab.dosyaId} • `
              : ''

          return (
            <div
              key={tab.tabId}
              onClick={() => onSwitchTab(tab.tabId)}
              className={cn(
                'group relative flex items-center gap-2 h-9 px-3.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer border-t border-x shrink-0 max-w-[260px]',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-slate-200/90 dark:border-slate-800 shadow-[0_-2px_6px_rgba(0,0,0,0.03)] z-10'
                  : 'bg-slate-200/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-transparent hover:bg-white/70 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-slate-200'
              )}
              title={`${dosyaPrefix}${titleText}${firmText} (${tab.documentId})`}
            >
              {/* Aktif Sekme Üst Göstergesi */}
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-t-full" />
              )}

              <FileText
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 group-hover:text-slate-500'
                )}
              />

              {/* Temiz ve Okunabilir Belge Başlığı */}
              <span className="truncate flex-1 font-bold">
                {dosyaPrefix}
                {titleText}
                {firmText}
              </span>

              {/* Sekme Kapatma Butonu (Hover'da veya Aktifken) */}
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCloseTab(tab.tabId)
                  }}
                  className={cn(
                    'p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-opacity ml-0.5 shrink-0 cursor-pointer',
                    isActive
                      ? 'opacity-60 hover:opacity-100'
                      : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                  )}
                  title="Sekmeyi Kapat"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}

        {/* Yeni Sekme [+] Butonu (Sekmelerin Hemen Yanında) */}
        {onAddTab && templateOptions.length > 0 && (
          <div className="relative shrink-0 mb-1 ml-0.5">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => {
                const nextState = !dropdownOpen
                setDropdownOpen(nextState)
              }}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer shadow-2xs"
              title="Yeni Belgeyi Sekmede Aç (+)"
            >
              <Plus className="w-4 h-4" />
            </button>

            {dropdownOpen &&
              coords &&
              createPortal(
                <div
                  ref={menuRef}
                  style={{
                    position: 'fixed',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    zIndex: 99999
                  }}
                  className="w-80 max-h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Yeni Sekmede Aç
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {filteredTemplates.length} şablon
                    </span>
                  </div>

                  {/* Aşama Filtre Butonları */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-1.5 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedStageFilter('all')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedStageFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Tümü
                    </button>
                    {stagesList.map((stg) => (
                      <button
                        key={stg.id}
                        type="button"
                        onClick={() => setSelectedStageFilter(stg.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                          selectedStageFilter === stg.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {stg.shortName}
                      </button>
                    ))}
                  </div>

                  {/* Şablon Arama Kutusu */}
                  <div className="relative px-1 mb-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Şablon ara..."
                      className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    />
                  </div>

                  {/* Şablon Listesi */}
                  <div className="space-y-0.5 overflow-y-auto custom-scrollbar max-h-60 pr-1">
                    {filteredTemplates.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Eşleşen şablon bulunamadı
                      </div>
                    ) : (
                      filteredTemplates.map((opt) => {
                        const isRecommended =
                          !disableDocumentGuidance &&
                          stageInfo &&
                          stageInfo.recommendedTemplates.some(
                            (rec) => rec.replace(/_/g, '-') === opt.id.replace(/_/g, '-')
                          )

                        return (
                          <div
                            key={opt.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              onAddTab({
                                documentId: opt.id,
                                dosyaId: currentDosyaId,
                                documentTitle: opt.title
                              })
                              setDropdownOpen(false)
                              setSearchTerm('')
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                onAddTab({
                                  documentId: opt.id,
                                  dosyaId: currentDosyaId,
                                  documentTitle: opt.title
                                })
                                setDropdownOpen(false)
                                setSearchTerm('')
                              }
                            }}
                            className="w-full text-left flex items-center gap-2 p-2 rounded-xl text-xs hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer group"
                          >
                            {isRecommended ? (
                              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                            <span className="truncate flex-1 font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {opt.title}
                            </span>
                            {isRecommended && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                Kılavuzlu
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(e, opt.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-200 text-slate-500 dark:text-slate-400 shrink-0 transition-all cursor-pointer"
                              title="ID'yi panoya kopyala"
                            >
                              {copiedId === opt.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    Kopyalandı
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5 opacity-60" />
                                  <span>{opt.id}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>,
                document.body
              )}
          </div>
        )}
      </div>
    </div>
  )
}
