import React, { useState } from 'react'
import {
  Layers,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  Minus,
  Square,
  X,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  FolderPlus
} from 'lucide-react'

/**
 * ---------------------------------------------------------------------------
 * TEMİN 360 MİMARİSİ REFERANSLI STANDART UYGULAMA İSKELETİ (APP SHELL)
 * ---------------------------------------------------------------------------
 * Yeni bir masaüstü uygulaması başlatırken bu iskelet doğrudan temel alınabilir.
 */

export function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'modules' | 'settings'>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Pencere kontrolleri
  const handleMinimize = () => window.electron?.ipcRenderer.send('window:minimize')
  const handleMaximize = () => window.electron?.ipcRenderer.send('window:maximize')
  const handleClose = () => window.electron?.ipcRenderer.send('window:close')

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden select-none font-sans ${isDarkMode ? 'dark' : ''}`}>
      {/* ── 1. FRAMELESS TITLEBAR (Pencere Başlığı) ── */}
      <header
        className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-3 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-black">
            W
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            WORKDESK 360 • Uygulama Şablonu
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-850 text-slate-500 border border-slate-200 dark:border-slate-700">
            v1.0.0
          </span>
        </div>

        {/* Aksiyonlar & Pencere Butonları */}
        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Tema Değiştir"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={handleMinimize}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-red-500 hover:text-white text-slate-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── 2. ANA ÇALIŞMA ALANI (Sidebar + İçerik) ── */}
      <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-900">
        {/* Koyu Sidebar */}
        <aside
          className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col justify-between transition-all duration-200 shrink-0 ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Kontrol Paneli</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Modüller & Süreçler</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Ayarlar & Parametreler</span>}
            </button>
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1 text-center"
            >
              {sidebarCollapsed ? '→' : '← Daralt'}
            </button>
          </div>
        </aside>

        {/* Ana İçerik Ekranı */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          {activeTab === 'dashboard' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Hoş Geldiniz Hero Şeridi */}
              <div className="p-6 rounded-3xl bg-linear-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>TEMİN 360 Standart Arayüz Mimarisi</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight">Yeni Uygulama Ekranı</h2>
                  <p className="text-xs text-blue-100 max-w-xl">
                    Bu alan temiz ve modüler bir geliştirme başlangıcıdır. Bileşenlerinizi bu iskelet üzerinde kolayca inşa edebilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl bg-white text-blue-700 text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  Yeni Kayıt Başlat
                </button>
              </div>

              {/* Boş / Geliştirilmeye Hazır Kart Alanı */}
              <div className="min-h-[360px] flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
                  <FolderPlus className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Ana Ekran İçeriği Buraya Gelecek
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1.5 leading-relaxed">
                  Modülünüze ait widget&apos;ları, metrik kartlarını, tabloları ve grafik bileşenlerini buraya ekleyerek uygulamanızı özelleştirin.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="flex-1 p-6 flex items-center justify-center text-xs text-slate-400">
              Modüller listesi hazır.
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 p-6 flex items-center justify-center text-xs text-slate-400">
              Ayarlar paneli hazır.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
export default App
