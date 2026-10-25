import React from 'react'
import { FolderOpen, Tag, Check, X, Plus } from 'lucide-react'
import { FormFieldV2 } from '../../../types/formBuilder.types'

interface CanvasTabStripProps {
  selectedTab: string
  onSelectTab: (tab: string) => void
  totalFieldCount: number
  availableTabs: string[]
  fields: FormFieldV2[]
  isAddingNewTab: boolean
  onSetIsAddingNewTab: (val: boolean) => void
  newTabNameInput: string
  onNewTabNameInputChange: (val: string) => void
  onCreateNewTab: () => void
}

export const CanvasTabStrip: React.FC<CanvasTabStripProps> = ({
  selectedTab,
  onSelectTab,
  totalFieldCount,
  availableTabs,
  fields,
  isAddingNewTab,
  onSetIsAddingNewTab,
  newTabNameInput,
  onNewTabNameInputChange,
  onCreateNewTab
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs overflow-x-auto select-none transition-colors">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mr-1 flex items-center gap-1">
          <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Sekmeler:
        </span>

        {/* 'Tümü' Sekmesi */}
        <button
          type="button"
          onClick={() => onSelectTab('Tümü')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedTab === 'Tümü'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <span>Tümü</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-black/40 text-white">
            {totalFieldCount}
          </span>
        </button>

        {/* Kullanıcı / Şablon Sekmeleri */}
        {availableTabs.map((tab) => {
          const count = fields.filter((f) => (f.tabName || 'Genel Bilgiler') === tab).length
          const isTabActive = selectedTab === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isTabActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Tag className="w-2.5 h-2.5 opacity-70" />
              <span>{tab}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/20 dark:bg-black/40 text-white">
                {count}
              </span>
            </button>
          )
        })}

        {/* Yeni Sekme Ekleme Girişi */}
        {isAddingNewTab ? (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-blue-500 shadow-xs animate-in fade-in">
            <input
              type="text"
              placeholder="Sekme Adı..."
              value={newTabNameInput}
              onChange={(e) => onNewTabNameInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateNewTab()
                if (e.key === 'Escape') onSetIsAddingNewTab(false)
              }}
              autoFocus
              className="px-1.5 py-0.5 text-xs text-slate-800 dark:text-white bg-transparent focus:outline-none w-28 font-medium"
            />
            <button
              type="button"
              onClick={onCreateNewTab}
              className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer transition-colors"
              title="Kaydet"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onSetIsAddingNewTab(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors"
              title="İptal"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSetIsAddingNewTab(true)}
            className="p-1 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg border border-dashed border-blue-300 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            title="Yeni Sekme Ekle"
          >
            <Plus className="w-3 h-3" />
            <span className="text-[11px] font-medium">Yeni Sekme</span>
          </button>
        )}
      </div>
    </div>
  )
}
