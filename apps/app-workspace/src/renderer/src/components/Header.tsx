import React, { useState } from 'react'
import {
  LayoutGrid,
  Moon,
  Sun,
  Search,
  Sparkles,
  Minus,
  Square,
  X,
  Menu,
  Building2,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { KAMU_360_MODULES, KamuModuleKey } from '../kamuModules.js'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  isDark: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
  activeModuleKey: KamuModuleKey
  onSelectModule: (key: KamuModuleKey) => void
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  onToggleSidebar,
  activeModuleKey,
  onSelectModule
}) => {
  const isElectron = typeof window !== 'undefined' && !!window.workspaceAPI
  const [showModuleMenu, setShowModuleMenu] = useState(false)
  const currentModule = KAMU_360_MODULES[activeModuleKey]

  const handleMinimize = () => {
    window.workspaceAPI?.minimizeWindow()
  }

  const handleMaximize = () => {
    window.workspaceAPI?.maximizeWindow()
  }

  const handleClose = () => {
    window.workspaceAPI?.closeWindow()
  }

  return (
    <header
      style={{
        backgroundColor: 'var(--theme-bg-200)',
        borderBottom: '1px solid var(--theme-border-100)'
      }}
      className="sticky top-0 z-40 shadow-xs backdrop-blur-md select-none"
    >
      {/* Üst Vurgu Çizgisi - KAMU 360 & TEMİN 360 Kurumsal Renk Gradyanı */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-500" />

      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Sol Alan: Menü Butonu, Logo, Portal Başlığı ve Hızlı Modül Seçici */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            style={{
              backgroundColor: 'var(--theme-bg-100)',
              color: 'var(--theme-text-100)',
              borderColor: 'var(--theme-border-100)'
            }}
            className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Sidebar Menüyü Aç / Kapat"
          >
            <Menu size={18} />
          </button>

          <div
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0284c7 100%)',
              color: '#ffffff'
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md font-bold text-lg shrink-0"
          >
            <Building2 size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--theme-text-100)' }}>
                KAMU 360
              </h1>
              <span
                style={{
                  backgroundColor: 'var(--theme-badge-planned-bg)',
                  color: 'var(--theme-badge-planned-text)',
                  borderColor: 'var(--theme-badge-planned-border)'
                }}
                className="text-[10px] px-2 py-0.2 rounded-full border font-semibold flex items-center gap-1"
              >
                <Sparkles size={10} className="text-blue-500" /> Workspace
              </span>
            </div>
            <p className="text-[11px] hidden sm:block" style={{ color: 'var(--theme-text-200)' }}>
              Kamu İhale, Alım, Taşınmaz ve Belge Yönetim Masası
            </p>
          </div>

          {/* Hızlı Modül Açılır Menüsü */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowModuleMenu((prev) => !prev)}
              style={{
                backgroundColor: 'var(--theme-bg-100)',
                borderColor: 'var(--theme-border-100)',
                color: 'var(--theme-text-100)'
              }}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium hover:border-blue-500 transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentModule?.color || '#3b82f6' }}
              />
              <span className="max-w-[130px] truncate">{currentModule?.shortName}</span>
              <ChevronDown size={13} className="text-gray-400" />
            </button>

            {showModuleMenu && (
              <div
                style={{
                  backgroundColor: 'var(--theme-card-bg)',
                  borderColor: 'var(--theme-card-border)'
                }}
                className="absolute left-0 mt-1.5 w-64 rounded-xl border shadow-xl p-1.5 z-50 backdrop-blur-md"
              >
                {Object.values(KAMU_360_MODULES).map((m) => {
                  const Icon = m.icon
                  const isAct = m.key === activeModuleKey
                  return (
                    <button
                      key={m.key}
                      onClick={() => {
                        onSelectModule(m.key)
                        setShowModuleMenu(false)
                      }}
                      style={{
                        backgroundColor: isAct ? 'var(--theme-bg-200)' : 'transparent',
                        color: 'var(--theme-text-100)'
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div
                        style={{ color: m.color }}
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{m.shortName}</div>
                        <div className="text-[10px] text-gray-500 truncate">{m.tagline}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Alan: Arama, Tema Geçişi, Kamu Rehberi ve Pencere Kontrolleri */}
        <div className="flex items-center gap-2">
          {/* Arama Kutusu */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--theme-text-200)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Uygulama, kanun veya modül ara..."
              style={{
                backgroundColor: 'var(--theme-bg-100)',
                color: 'var(--theme-text-100)',
                borderColor: 'var(--theme-border-100)'
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Kamu 360 Web Portali Dış Bağlantı */}
          <a
            href="https://kamu360.gov.tr"
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: 'var(--theme-bg-100)',
              color: 'var(--theme-text-200)',
              borderColor: 'var(--theme-border-100)'
            }}
            className="p-1.5 rounded-lg border hover:text-blue-500 transition-colors hidden lg:flex items-center gap-1 text-xs"
            title="KAMU 360 Resmi Web Portalı"
          >
            <ExternalLink size={14} />
            <span className="text-[11px] font-medium">kamu360</span>
          </a>

          {/* Tema Butonu */}
          <button
            onClick={onToggleTheme}
            style={{
              backgroundColor: 'var(--theme-bg-100)',
              color: 'var(--theme-text-100)',
              borderColor: 'var(--theme-border-100)'
            }}
            className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
          </button>

          {/* Electron Pencere Kontrolleri */}
          {isElectron && (
            <div
              style={{ borderColor: 'var(--theme-border-100)' }}
              className="flex items-center pl-2 ml-1 border-l gap-1"
            >
              <button
                onClick={handleMinimize}
                style={{ color: 'var(--theme-text-200)' }}
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Küçült"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={handleMaximize}
                style={{ color: 'var(--theme-text-200)' }}
                className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Ekranı Kapla"
              >
                <Square size={12} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded hover:bg-rose-500 hover:text-white text-rose-500 transition-colors"
                title="Kapat"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
