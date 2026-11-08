import React, { useRef, useState, useEffect, useMemo } from 'react'
import {
  Printer,
  X,
  FileText,
  Trash2,
  Eye,
  Folder,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { usePrintQueueStore, QueuedDocument } from '../../../store/printQueueStore'
import { useGlobalDocumentPreviewStore } from '../../../store/globalDocumentPreviewStore'
import { useClickOutside } from '@renderer/hooks/useClickOutside'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../../constants/routeConstants'

export const PrintHubPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { items, removeFromQueue, clearAllQueue } = usePrintQueueStore()
  const { openDocument } = useGlobalDocumentPreviewStore()

  // Dışarı tıklandığında veya ESC tuşuna basıldığında kapanma
  useClickOutside(popoverRef, () => setIsOpen(false), isOpen)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Dosya bazlı akıllı gruplama (Accordion / Folder View)
  const groupedDocuments = useMemo(() => {
    const map = new Map<number, QueuedDocument[]>()
    items.forEach((doc) => {
      const list = map.get(doc.dosyaId) || []
      list.push(doc)
      map.set(doc.dosyaId, list)
    })
    return map
  }, [items])

  // Açık klasörler (Varsayılan olarak hepsi açık)
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())

  useEffect(() => {
    // İlk yüklemede tüm dosya klasörlerini aç
    setExpandedFolders(new Set(Array.from(groupedDocuments.keys())))
  }, [groupedDocuments])

  const toggleFolder = (dosyaId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(dosyaId)) {
        next.delete(dosyaId)
      } else {
        next.add(dosyaId)
      }
      return next
    })
  }

  // Canlı Belgeyi Aç & Önizle
  const handleOpenDoc = (doc: QueuedDocument) => {
    setIsOpen(false)
    openDocument({
      documentId: doc.docKey,
      dosyaId: doc.dosyaId,
      documentTitle: doc.title || doc.docKey
    })
  }

  // Tümünü Toplu Yazdır
  const handleBatchPrintAll = () => {
    if (items.length === 0) return
    setIsOpen(false)
    const first = items[0]
    openDocument({
      documentId: first.docKey,
      dosyaId: first.dosyaId,
      documentTitle: first.title || first.docKey
    })
  }

  // Hızlı Ekranı Yazdır
  const handleQuickPrintScreen = () => {
    setIsOpen(false)
    window.print()
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Tetikleyici Buton */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors relative cursor-pointer ${
          isOpen
            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
        }`}
        title="Yazdırma & Dışa Aktarma Merkezi"
      >
        <Printer size={18} />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs animate-in zoom-in-75">
            {items.length}
          </span>
        )}
      </button>

      {/* Açılır Panel (Dropdown Menu: min 420px) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[420px] max-w-[92vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 select-none text-left flex flex-col max-h-[580px]">
          {/* 1. Başlık Çubuğu */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Printer size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">
                    Yazdırma &amp; Dışa Aktarma Merkezi
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    {items.length} Kuyrukta
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      navigate({ to: APP_ROUTES.SABLONLAR })
                    }}
                    className="hover:text-blue-500 hover:underline cursor-pointer"
                  >
                    Temin Şablonları
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      navigate({ to: APP_ROUTES.DOSYA_CIKTI_MERKEZI })
                    }}
                    className="hover:text-blue-500 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span>Gelişmiş Panel</span>
                    <ExternalLink size={9} />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={15} />
            </button>
          </div>

          {/* 2. Hızlı Toplu Baskı Butonları */}
          {items.length > 0 && (
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleBatchPrintAll}
                className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow active:scale-98 cursor-pointer"
              >
                <Printer size={13} />
                <span>Tümünü Toplu Yazdır ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={clearAllQueue}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Yazdırma Kuyruğunu Temizle"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}

          {/* 3. Dosya Bazlı Akıllı Gruplama (Folder / Accordion) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 min-h-0">
            {items.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Printer size={22} className="opacity-60" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Yazdırma Kuyruğu Boş
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Doğrudan temin sürecindeki belgeleri veya şablonları &quot;Yazdır&quot; butonuyla kuyruğa ekleyerek buradan toplu basabilirsiniz.
                </p>
              </div>
            ) : (
              Array.from(groupedDocuments.entries()).map(([dosyaId, docs]) => {
                const isExpanded = expandedFolders.has(dosyaId)
                const firstDoc = docs[0]
                const folderTitle = `2026/DT-${dosyaId} • ${firstDoc?.title || 'Doğrudan Temin Dosyası'}`

                return (
                  <div
                    key={dosyaId}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-2xs"
                  >
                    {/* Klasör Başlığı (Accordion) */}
                    <button
                      type="button"
                      onClick={() => toggleFolder(dosyaId)}
                      className="w-full flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-slate-400 shrink-0" />
                        )}
                        <Folder size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {folderTitle}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                        {docs.length} Belge
                      </span>
                    </button>

                    {/* Klasör İçindeki Belgeler */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <FileText size={13} className="text-blue-500 shrink-0" />
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={doc.title}>
                                  {doc.title || doc.docKey}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-mono">{doc.docKey}</span>
                                <span>•</span>
                                <span>{doc.orientation === 'landscape' ? 'A4 Yatay' : 'A4 Dikey'}</span>
                                <span>•</span>
                                <span>1 Sayfa</span>
                              </div>
                            </div>

                            {/* Belge Aksiyonları */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenDoc(doc)}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Canlı Önizle ve Düzenle"
                              >
                                <Eye size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDoc(doc)}
                                className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                title="Hemen Yazdır"
                              >
                                <Printer size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeFromQueue(doc.dosyaId, doc.docKey)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Kuyruktan Çıkar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* 4. Alt Bilgi Çubuğu */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs shrink-0">
            <button
              type="button"
              onClick={handleQuickPrintScreen}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={12} />
              <span>Mevcut Ekranı Hızlı Yazdır</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate({ to: APP_ROUTES.DOSYA_CIKTI_MERKEZI })
              }}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Tüm Yazdırma Merkezini Aç →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
