import React from 'react'
import {
  Folder,
  FileText,
  Calendar,
  Tag,
  Plus,
  Layers,
  FileSpreadsheet,
  Image,
  Archive,
  Copy,
  Clock,
  HardDrive
} from 'lucide-react'
import { VirtualView, FileRecord } from '../../../shared/types'
import { evaluateRules } from '../../../main/rules/engine'
import { getDateYearMonth } from '../utils/formatters'

interface VirtualFolderTreeProps {
  views: VirtualView[]
  allFiles: FileRecord[]
  activeViewId: string
  activeCategoryFilter: string | null
  activeDateFilter: string | null
  activeTagFilter: string | null
  onSelectView: (viewId: string) => void
  onSelectCategory: (category: string | null) => void
  onSelectDateGroup: (dateGroup: string | null) => void
  onSelectTag: (tag: string | null) => void
  onOpenRuleModal: () => void
}

export function VirtualFolderTree({
  views,
  allFiles,
  activeViewId,
  activeCategoryFilter,
  activeDateFilter,
  activeTagFilter,
  onSelectView,
  onSelectCategory,
  onSelectDateGroup,
  onSelectTag,
  onOpenRuleModal
}: VirtualFolderTreeProps): React.JSX.Element {
  // Her görünüm için dosya sayılarını hesapla
  const viewCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    // Duplicate files map
    const sizeGroups: Record<number, FileRecord[]> = {}
    for (const f of allFiles) {
      if (!sizeGroups[f.size]) sizeGroups[f.size] = []
      sizeGroups[f.size].push(f)
    }

    // Gerçek hash duplicate'leri veya aynı boyuttaki potansiyel kopyalar
    const duplicateIds = new Set<number>()
    const hashGroups: Record<string, FileRecord[]> = {}
    for (const f of allFiles) {
      if (f.sha256) {
        if (!hashGroups[f.sha256]) hashGroups[f.sha256] = []
        hashGroups[f.sha256].push(f)
      }
    }
    for (const hash in hashGroups) {
      if (hashGroups[hash].length > 1) {
        hashGroups[hash].forEach((f) => duplicateIds.add(f.id))
      }
    }

    for (const v of views) {
      if (v.isDuplicateView) {
        counts[v.id] = duplicateIds.size
      } else {
        counts[v.id] = allFiles.filter((f) => evaluateRules(f, v.rules)).length
      }
    }
    return counts
  }, [views, allFiles])

  // Türler listesi
  const categories = React.useMemo(() => {
    const cats: Record<string, number> = {}
    for (const f of allFiles) {
      cats[f.category] = (cats[f.category] || 0) + 1
    }
    return Object.entries(cats).sort((a, b) => b[1] - a[1])
  }, [allFiles])

  // Tarih grupları (Yıl-Ay)
  const dateGroups = React.useMemo(() => {
    const dates: Record<string, number> = {}
    for (const f of allFiles) {
      const ym = getDateYearMonth(f.mtimeMs)
      dates[ym] = (dates[ym] || 0) + 1
    }
    return Object.entries(dates).sort((a, b) => b[0].localeCompare(a[0]))
  }, [allFiles])

  // Etiketler
  const tags = React.useMemo(() => {
    const tagMap: Record<string, number> = {}
    for (const f of allFiles) {
      if (f.tags) {
        for (const t of f.tags) {
          tagMap[t] = (tagMap[t] || 0) + 1
        }
      }
    }
    return Object.entries(tagMap).sort((a, b) => b[1] - a[1])
  }, [allFiles])

  const getViewIcon = (iconName?: string) => {
    switch (iconName) {
      case 'file-text':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'file-spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
      case 'image':
        return <Image className="w-4 h-4 text-purple-500" />
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-500" />
      case 'clock':
        return <Clock className="w-4 h-4 text-teal-500" />
      case 'calendar':
        return <Calendar className="w-4 h-4 text-indigo-500" />
      case 'hard-drive':
        return <HardDrive className="w-4 h-4 text-rose-500" />
      case 'copy':
        return <Copy className="w-4 h-4 text-orange-500" />
      default:
        return <Folder className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
    }
  }

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Sanal Klasörler Başlığı */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Sanal Klasörler
          </span>
        </div>
        <button
          onClick={onOpenRuleModal}
          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          title="Yeni Kural / Sanal Klasör Ekle"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Görünümler Listesi */}
      <div className="p-2 space-y-0.5">
        {views.map((v) => {
          const isActive = activeViewId === v.id && !activeCategoryFilter && !activeDateFilter && !activeTagFilter
          return (
            <button
              key={v.id}
              onClick={() => {
                onSelectView(v.id)
                onSelectCategory(null)
                onSelectDateGroup(null)
                onSelectTag(null)
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getViewIcon(v.icon)}
                <span className="truncate">{v.name}</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {viewCounts[v.id] || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Dosya Türleri Grubu */}
      {categories.length > 0 && (
        <div className="mt-4 px-2">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Dosya Türleri
          </div>
          <div className="space-y-0.5 mt-1">
            {categories.map(([cat, count]) => {
              const isActive = activeCategoryFilter === cat
              return (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(isActive ? null : cat)
                    onSelectDateGroup(null)
                    onSelectTag(null)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="capitalize">{cat}</span>
                  <span className="text-[10px] text-slate-400">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tarih Grupları (Yıl-Ay) */}
      {dateGroups.length > 0 && (
        <div className="mt-4 px-2">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tarih (Yıl / Ay)
          </div>
          <div className="space-y-0.5 mt-1">
            {dateGroups.slice(0, 8).map(([ym, count]) => {
              const isActive = activeDateFilter === ym
              return (
                <button
                  key={ym}
                  onClick={() => {
                    onSelectDateGroup(isActive ? null : ym)
                    onSelectCategory(null)
                    onSelectTag(null)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{ym}</span>
                  <span className="text-[10px] text-slate-400">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Etiketler */}
      {tags.length > 0 && (
        <div className="mt-4 px-2 pb-4">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Etiketler
          </div>
          <div className="space-y-0.5 mt-1">
            {tags.map(([t, count]) => {
              const isActive = activeTagFilter === t
              return (
                <button
                  key={t}
                  onClick={() => {
                    onSelectTag(isActive ? null : t)
                    onSelectCategory(null)
                    onSelectDateGroup(null)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{t}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
