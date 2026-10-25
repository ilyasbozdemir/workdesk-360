import React, { useEffect, useRef, useState } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import {
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  FileText,
  MoreVertical,
  Printer,
  Star
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { normalizeForMatch, parseStatusAndName } from '../../screens/system/utils/statusUtils'
import { documentPreloadService } from '../../services/documentPreloadService'

export interface Sablon {
  id: number
  ad: string
  dosya_adi: string
  kategori: string
  icerik: string
  route_path?: string
  test_verisi?: string
}

export interface DocumentPreset {
  id: string
  name: string
  docs: string[]
}

function generatePresetId(): string {
  return Date.now().toString()
}

interface BelgeAksiyonlariProps {
  onPreview: () => void
  onQuickPrint: () => void
  onExport: (format: 'pdf' | 'docx' | 'udf') => void
  onOpenExternal: () => void
  disabled?: boolean
  docName?: string
  trigger?: React.ReactNode
}

export function BelgeAksiyonlari({
  onPreview,
  onQuickPrint,
  onExport,
  onOpenExternal,
  disabled,
  docName = '',
  trigger
}: BelgeAksiyonlariProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const [newPresetInput, setNewPresetInput] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { activeDosyaId, activeStarredDocs, setActiveStarredDocs } = useWorkspaceStore()

  const [presets, setPresets] = useState<DocumentPreset[]>(() => {
    try {
      const saved = localStorage.getItem('dta_document_presets')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [globalStarred, setGlobalStarred] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('global_starred_docs')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useClickOutside(dropdownRef, () => setMenuOpen(false))

  useEffect(() => {
    const handlePresetsChange = () => {
      try {
        const saved = localStorage.getItem('dta_document_presets')
        setPresets(saved ? JSON.parse(saved) : [])
      } catch {}
    }
    const handleGlobalChange = () => {
      try {
        const saved = localStorage.getItem('global_starred_docs')
        setGlobalStarred(saved ? JSON.parse(saved) : [])
      } catch {}
    }
    window.addEventListener('dta_presets_changed', handlePresetsChange)
    window.addEventListener('global_starred_changed', handleGlobalChange)
    return () => {
      window.removeEventListener('dta_presets_changed', handlePresetsChange)
      window.removeEventListener('global_starred_changed', handleGlobalChange)
    }
  }, [])

  const targetName = docName || ''
  const cleanTarget = parseStatusAndName(targetName).cleanName
  const normalizedDocName = normalizeForMatch(cleanTarget)

  const isInDefaultList = activeDosyaId
    ? activeStarredDocs.some(
        (d) => normalizeForMatch(parseStatusAndName(d).cleanName) === normalizedDocName
      )
    : globalStarred.some(
        (d) => normalizeForMatch(parseStatusAndName(d).cleanName) === normalizedDocName
      )

  const isInAnyPreset = presets.some((p) =>
    p.docs.some((d) => normalizeForMatch(parseStatusAndName(d).cleanName) === normalizedDocName)
  )

  const isStarredComputed = isInDefaultList || isInAnyPreset

  const handleToggleDefaultList = async () => {
    if (!targetName) return
    const currentList = activeDosyaId ? activeStarredDocs : globalStarred
    const newDocs = [...currentList]
    const idx = newDocs.findIndex(
      (d) => normalizeForMatch(parseStatusAndName(d).cleanName) === normalizedDocName
    )
    if (idx >= 0) {
      newDocs.splice(idx, 1)
    } else {
      newDocs.push(cleanTarget)
    }

    if (activeDosyaId) {
      setActiveStarredDocs(newDocs)
      await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET starred_docs = ? WHERE id = ?',
        [JSON.stringify(newDocs), activeDosyaId]
      )
    } else {
      setGlobalStarred(newDocs)
      localStorage.setItem('global_starred_docs', JSON.stringify(newDocs))
    }
    window.dispatchEvent(new Event('global_starred_changed'))
  }

  const handleTogglePreset = (presetId: string) => {
    if (!targetName) return
    const updatedPresets = presets.map((p) => {
      if (p.id === presetId) {
        const exists = p.docs.some(
          (d) => normalizeForMatch(parseStatusAndName(d).cleanName) === normalizedDocName
        )
        let newDocs = [...p.docs]
        if (exists) {
          newDocs = newDocs.filter(
            (d) => normalizeForMatch(parseStatusAndName(d).cleanName) !== normalizedDocName
          )
        } else {
          newDocs.push(cleanTarget)
        }
        return { ...p, docs: newDocs }
      }
      return p
    })
    setPresets(updatedPresets)
    localStorage.setItem('dta_document_presets', JSON.stringify(updatedPresets))
    window.dispatchEvent(new Event('dta_presets_changed'))
  }

  const handleCreatePreset = () => {
    if (!newPresetInput.trim() || !targetName) return
    const newPreset: DocumentPreset = {
      id: generatePresetId(),
      name: newPresetInput.trim(),
      docs: [cleanTarget]
    }
    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    localStorage.setItem('dta_document_presets', JSON.stringify(updatedPresets))
    setNewPresetInput('')
    setShowAddInput(false)
    window.dispatchEvent(new Event('dta_presets_changed'))
  }

  const handleWarmup = () => {
    if (activeDosyaId && (targetName || cleanTarget)) {
      documentPreloadService.warmOnHover(targetName || cleanTarget, activeDosyaId)
    }
  }

  const triggerElement = trigger ? (
    <div
      onClick={() => !disabled && setMenuOpen((v) => !v)}
      onMouseEnter={handleWarmup}
      className="cursor-pointer"
    >
      {trigger}
    </div>
  ) : (
    <button
      onClick={() => setMenuOpen((v) => !v)}
      onMouseEnter={handleWarmup}
      disabled={disabled}
      title="İşlemler"
      className={cn(
        'p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
        'hover:bg-slate-100 text-slate-400 dark:text-slate-500 dark:hover:bg-slate-800',
        menuOpen && 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350'
      )}
    >
      <MoreVertical className="w-4 h-4" />
    </button>
  )

  return (
    <div
      className="relative inline-block text-left"
      ref={dropdownRef}
      onMouseEnter={handleWarmup}
      onClick={(e) => e.stopPropagation()}
    >
      {triggerElement}

      {menuOpen && (
        <div
          onMouseEnter={handleWarmup}
          className="absolute right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 w-64 py-2 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Main Actions */}
          <div className="px-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800/80 space-y-0.5">
            <button
              onClick={() => {
                onPreview()
                setMenuOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer text-left font-semibold"
            >
              <Eye className="w-4 h-4 text-blue-500" />
              <span>Önizle ve Düzenle</span>
            </button>

            <button
              onClick={() => {
                onOpenExternal()
                setMenuOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer text-left font-semibold"
            >
              <ExternalLink className="w-4 h-4 text-emerald-500" />
              <span>Tarayıcıda PDF Aç</span>
            </button>

            <button
              onClick={() => {
                onQuickPrint()
                setMenuOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer text-left font-semibold"
            >
              <Printer className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>Hızlı Yazdır</span>
            </button>
          </div>

          {/* Export Formats */}
          <div className="px-1.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Dosya Olarak İndir
            </div>
            {(['pdf', 'docx', 'udf'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  onExport(fmt)
                  setMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer text-left font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="uppercase">{fmt} Sürümü</span>
                </span>
              </button>
            ))}
          </div>

          {/* Quick Access & Packages */}
          <div className="px-3 py-2 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Hızlı Erişim & Paketler</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[9px] font-bold',
                  isStarredComputed
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {isStarredComputed ? 'Eklendi' : 'Ekli Değil'}
              </span>
            </div>

            <button
              onClick={handleToggleDefaultList}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all text-[11px] font-semibold',
                isInDefaultList
                  ? 'bg-amber-50/50 dark:bg-amber-905/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Star
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  isInDefaultList && 'fill-amber-500 text-amber-500'
                )}
              />
              <span>Hızlı Erişim Listesi</span>
            </button>

            {/* Presets List */}
            {presets.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {presets.map((p) => {
                  const checked = p.docs.some(
                    (d) => normalizeForMatch(parseStatusAndName(d).cleanName) === normalizedDocName
                  )
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-855/50 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleTogglePreset(p.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="truncate">📦 {p.name}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* Add New Preset */}
            {!showAddInput ? (
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="w-full text-center py-1.5 border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-slate-500 hover:text-blue-500 font-bold cursor-pointer text-[10px] transition-colors"
              >
                + Yeni Paket Ekle
              </button>
            ) : (
              <div className="flex gap-1 items-center pt-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Paket Adı..."
                  value={newPresetInput}
                  onChange={(e) => setNewPresetInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreatePreset()
                    } else if (e.key === 'Escape') {
                      setShowAddInput(false)
                      setNewPresetInput('')
                    }
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleCreatePreset}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2 py-1.5 text-[9px] font-bold cursor-pointer whitespace-nowrap"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInput(false)
                    setNewPresetInput('')
                  }}
                  className="border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded px-1.5 py-1.5 text-[9px] font-bold cursor-pointer"
                >
                  X
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
