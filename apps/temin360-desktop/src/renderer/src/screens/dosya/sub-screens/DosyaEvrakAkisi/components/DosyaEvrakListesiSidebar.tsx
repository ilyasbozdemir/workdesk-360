import React from 'react'
import {
  Search,
  FileText,
  FileCheck,
  Receipt,
  Scale,
  Shield,
  Coins,
  Truck,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react'
import { EvrakItem } from '../types'
import { cn } from '@renderer/utils/cn'

interface DosyaEvrakListesiSidebarProps {
  evraklar: EvrakItem[]
  selectedEvrakId: string
  onSelectEvrak: (id: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  stageFilter: number | 'all'
  onStageFilterChange: (stage: number | 'all') => void
  onUploadSignedPdf: () => void
  onDeleteSignedDoc: (id: number) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const DosyaEvrakListesiSidebar: React.FC<DosyaEvrakListesiSidebarProps> = ({
  evraklar,
  selectedEvrakId,
  onSelectEvrak,
  searchQuery,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  onUploadSignedPdf,
  onDeleteSignedDoc,
  isCollapsed,
  onToggleCollapse
}) => {
  // Belge Türüne Göre İkon Çözümleme
  const renderIcon = (item: EvrakItem) => {
    const isSigned = item.type === 'signed_pdf' || item.status === 'imzali'
    if (isSigned) {
      return <FileCheck size={16} className="text-emerald-500 shrink-0" />
    }
    switch (item.iconType) {
      case 'receipt':
        return <Receipt size={16} className="text-amber-500 shrink-0" />
      case 'scale':
        return <Scale size={16} className="text-indigo-500 shrink-0" />
      case 'shield':
        return <Shield size={16} className="text-blue-500 shrink-0" />
      case 'coins':
        return <Coins size={16} className="text-emerald-500 shrink-0" />
      case 'truck':
        return <Truck size={16} className="text-purple-500 shrink-0" />
      default:
        return <FileText size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
    }
  }

  const STAGE_FILTERS = [
    { key: 'all' as const, label: 'Tümü' },
    { key: 1 as const, label: '1. Hazırlık' },
    { key: 2 as const, label: '2. Fiyat' },
    { key: 3 as const, label: '3. Karar' },
    { key: 4 as const, label: '4. Kabul' },
    { key: 5 as const, label: '5. İmzalı' }
  ]

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 gap-3 transition-all select-none">
        <button
          type="button"
          onClick={onToggleCollapse}
          title="Belge Listesini Genişlet"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <PanelLeftOpen size={18} />
        </button>

        <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center gap-2 px-1">
          {evraklar.map((doc, idx) => {
            const isSelected = doc.id === selectedEvrakId
            return (
              <button
                key={`mini-doc-${doc.id}-${idx}`}
                type="button"
                onClick={() => onSelectEvrak(doc.id)}
                title={`${doc.title} (${doc.badge.label})`}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative',
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
              >
                {doc.type === 'signed_pdf' ? (
                  <FileCheck size={16} className={isSelected ? 'text-white' : 'text-emerald-500'} />
                ) : (
                  <span className="text-[11px] font-mono font-black">{idx + 1}</span>
                )}
                {doc.status === 'imzali' && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onUploadSignedPdf}
          title="+ İmzalı Belge Ekle"
          className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
        >
          <Plus size={16} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-80 md:w-88 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-all">
      {/* Üst Arama & Kontrol Çubuğu */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            <Layers size={14} className="text-blue-600" />
            <span>Dosya Evrak Akışı</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              ({evraklar.length})
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            title="Sol Paneli Daralt (Tam Görünüm)"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        {/* Arama Alanı */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Belge adı, aşama veya içerik ara..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Aşama Filtre Hapları */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 text-[11px] font-bold">
          {STAGE_FILTERS.map((f) => {
            const isActive = stageFilter === f.key
            return (
              <button
                key={`btn-stage-${f.key}`}
                type="button"
                onClick={() => onStageFilterChange(f.key)}
                className={cn(
                  'px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer',
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-750'
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Belge Listesi */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1.5 divide-y-0">
        {evraklar.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 space-y-2">
            <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-bold">Arama kriterine uygun evrak bulunamadı.</p>
          </div>
        ) : (
          evraklar.map((doc, idx) => {
            const isSelected = doc.id === selectedEvrakId

            return (
              <div
                key={`evrak-card-${doc.id}-${idx}`}
                onClick={() => onSelectEvrak(doc.id)}
                className={cn(
                  'group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5',
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                {/* Üst Satır: Aşama Numarası, İkon ve Rozet */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300 shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    {renderIcon(doc)}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">
                      {doc.stageName}
                    </span>
                  </div>

                  {doc.badge ? (
                    <span
                      className={cn(
                        'text-[9px] font-extrabold px-1.5 py-0.5 rounded border shrink-0',
                        doc.badge.color,
                        doc.badge.textColor,
                        doc.badge.borderColor
                      )}
                    >
                      {doc.badge.label}
                    </span>
                  ) : null}
                </div>

                {/* Belge Başlığı */}
                <h4
                  className={cn(
                    'text-xs font-black leading-snug line-clamp-2 transition-colors',
                    isSelected
                      ? 'text-blue-950 dark:text-blue-100'
                      : 'text-slate-850 dark:text-slate-100 group-hover:text-blue-600'
                  )}
                >
                  {doc.title}
                </h4>

                {/* Alt Satır: Tarih / İmzalı Açıklaması ve Silme */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-1 truncate">
                    {doc.date && (
                      <span className="inline-flex items-center gap-0.5 font-mono">
                        <Calendar size={10} />
                        <span>{doc.date.slice(0, 10)}</span>
                      </span>
                    )}
                    {doc.fileName && (
                      <span className="truncate max-w-[120px] font-mono text-slate-500">
                        • {doc.fileName}
                      </span>
                    )}
                  </div>

                  {doc.canDelete && doc.dbRecordId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSignedDoc(doc.dbRecordId!)
                      }}
                      title="İmzalı Belge Kaydını Sil"
                      className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Alt Aksiyon Çubuğu: + İmzalı Belge Yükle */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
        <button
          type="button"
          onClick={onUploadSignedPdf}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
          title="Dosyaya yeni bir taranmış ıslak imzalı PDF veya ek doküman bağla"
        >
          <Plus size={14} />
          <span>+ İmzalı Belge / PDF Yükle</span>
        </button>
      </div>
    </aside>
  )
}
