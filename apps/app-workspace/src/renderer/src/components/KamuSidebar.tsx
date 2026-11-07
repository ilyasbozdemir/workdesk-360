import React from 'react'
import {
  AppCategory,
  AppInstallState
} from '@worksuite-360/contracts'
import {
  Scale,
  Files,
  GitPullRequest,
  MapPin,
  Users,
  FileText,
  Archive,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  Download,
  Building2
} from 'lucide-react'
import { KAMU_360_MODULES, KamuModuleKey } from '../kamuModules.js'

interface KamuSidebarProps {
  activeModuleKey: KamuModuleKey
  onSelectModule: (key: KamuModuleKey) => void
  selectedCategory: AppCategory | 'all'
  onSelectCategory: (cat: AppCategory | 'all') => void
  selectedState: AppInstallState | 'all'
  onSelectState: (state: AppInstallState | 'all') => void
  totalCount: number
  installedCount: number
  plannedCount: number
  isOpen: boolean
  onToggle: () => void
}

const CATEGORIES: { id: AppCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'Tüm Uygulamalar', icon: LayoutGrid },
  { id: 'procurement', label: 'Kamu Alımları & İhale', icon: Scale },
  { id: 'file-management', label: 'Dosya & Veri Yönetimi', icon: Files },
  { id: 'workflow', label: 'Süreç & Görev', icon: GitPullRequest },
  { id: 'gis', label: 'Harita & Taşınmaz', icon: MapPin },
  { id: 'hr', label: 'Personel (İK)', icon: Users },
  { id: 'document', label: 'Belge & EBYS', icon: FileText },
  { id: 'archive', label: 'Arşiv', icon: Archive }
]

export const KamuSidebar: React.FC<KamuSidebarProps> = ({
  activeModuleKey,
  onSelectModule,
  selectedCategory,
  onSelectCategory,
  selectedState,
  onSelectState,
  totalCount,
  installedCount,
  plannedCount,
  isOpen
}) => {
  return (
    <aside
      style={{
        backgroundColor: 'var(--theme-bg-200)',
        borderColor: 'var(--theme-border-100)'
      }}
      className={`border-r shrink-0 transition-all duration-300 flex flex-col justify-between select-none ${
        isOpen ? 'w-72' : 'w-16'
      }`}
    >
      <div className="p-3 overflow-y-auto space-y-5">
        {/* KAMU 360 Portali Modül Seçimi */}
        <div>
          {isOpen && (
            <div className="flex items-center justify-between px-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--theme-text-200)' }}
              >
                <Sparkles size={11} className="text-blue-500" /> KAMU 360 Portalleri
              </span>
            </div>
          )}

          <div className="space-y-1">
            {Object.values(KAMU_360_MODULES).map((mod) => {
              const Icon = mod.icon
              const isActive = activeModuleKey === mod.key
              return (
                <button
                  key={mod.key}
                  onClick={() => onSelectModule(mod.key)}
                  title={mod.name}
                  style={{
                    backgroundColor: isActive ? 'var(--theme-bg-100)' : 'transparent',
                    borderColor: isActive ? mod.color : 'transparent',
                    color: isActive ? 'var(--theme-text-100)' : 'var(--theme-text-200)'
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left border transition-all ${
                    isActive ? 'shadow-xs font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: isActive ? mod.bgLight : 'transparent',
                      color: mod.color
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <Icon size={16} />
                  </div>

                  {isOpen && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs truncate">{mod.shortName}</span>
                        <span
                          style={{
                            borderColor: isActive ? mod.color : 'var(--theme-border-100)',
                            color: mod.color
                          }}
                          className="text-[9px] px-1.5 py-0.2 rounded border font-medium uppercase shrink-0"
                        >
                          {mod.badge}
                        </span>
                      </div>
                      <p className="text-[10px] truncate" style={{ color: 'var(--theme-text-200)' }}>
                        {mod.tagline}
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Kategoriler */}
        <div>
          {isOpen && (
            <div className="px-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--theme-text-200)' }}
              >
                Uygulama Kategorileri
              </span>
            </div>
          )}

          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  title={cat.label}
                  style={{
                    backgroundColor: isActive ? 'var(--theme-primary)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--theme-text-200)'
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors text-xs ${
                    isActive ? 'font-semibold shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  {isOpen && <span className="truncate flex-1">{cat.label}</span>}
                  {isOpen && isActive && <ChevronRight size={12} className="opacity-70" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Kurulum Durumu Filtreleri */}
        {isOpen && (
          <div className="pt-2 border-t" style={{ borderColor: 'var(--theme-border-100)' }}>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block px-2 mb-2"
              style={{ color: 'var(--theme-text-200)' }}
            >
              Kurulum &amp; Dağıtım
            </span>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onSelectState('all')}
                style={{
                  backgroundColor:
                    selectedState === 'all' ? 'var(--theme-bg-100)' : 'transparent',
                  color: selectedState === 'all' ? 'var(--theme-text-100)' : 'var(--theme-text-200)',
                  borderColor: selectedState === 'all' ? 'var(--theme-border-100)' : 'transparent'
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs"
              >
                <span>Tümü</span>
                <span className="font-semibold text-[11px]">{totalCount}</span>
              </button>

              <button
                onClick={() => onSelectState('installed')}
                style={{
                  backgroundColor:
                    selectedState === 'installed' ? 'var(--theme-badge-installed-bg)' : 'transparent',
                  color:
                    selectedState === 'installed'
                      ? 'var(--theme-badge-installed-text)'
                      : 'var(--theme-text-200)',
                  borderColor:
                    selectedState === 'installed'
                      ? 'var(--theme-badge-installed-border)'
                      : 'transparent'
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Yüklü / Hazır
                </span>
                <span className="font-semibold text-[11px]">{installedCount}</span>
              </button>

              <button
                onClick={() => onSelectState('planned')}
                style={{
                  backgroundColor:
                    selectedState === 'planned' ? 'var(--theme-badge-planned-bg)' : 'transparent',
                  color:
                    selectedState === 'planned'
                      ? 'var(--theme-badge-planned-text)'
                      : 'var(--theme-text-200)',
                  borderColor:
                    selectedState === 'planned'
                      ? 'var(--theme-badge-planned-border)'
                      : 'transparent'
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Download size={12} />
                  İndirilebilir / Planlanan
                </span>
                <span className="font-semibold text-[11px]">{plannedCount}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alt Bilgi */}
      {isOpen && (
        <div
          style={{ borderColor: 'var(--theme-border-100)' }}
          className="p-3 border-t text-[11px] space-y-1"
        >
          <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--theme-text-100)' }}>
            <Building2 size={13} className="text-blue-500" />
            <span>KAMU 360 &bull; WorkDesk</span>
          </div>
          <p style={{ color: 'var(--theme-text-200)' }} className="text-[10px] leading-tight">
            4734 &amp; 2886 Sayılı Kanun Uyumlu Kamu Ekosistemi
          </p>
        </div>
      )}
    </aside>
  )
}

