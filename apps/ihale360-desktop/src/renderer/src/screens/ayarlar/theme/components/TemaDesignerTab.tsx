import React from 'react'
import { Eye, RefreshCw, Save, Sparkles } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { parseRgba, themeVariablesMeta, toRgbaStr } from '../themeVariables'

interface TemaDesignerTabProps {
  designerMode: 'light' | 'dark'
  setDesignerMode: (mode: 'light' | 'dark') => void
  setShowAiModal: (val: boolean) => void
  setAiThemeDesc: (val: string) => void
  setGeneratedPrompt: (val: string) => void
  applyPlaygroundToEditor: () => void
  savePlaygroundDirectly: () => Promise<void>
  saving: boolean
  selectedCategory: 'all' | 'primary' | 'text-bg' | 'sidebar'
  setSelectedCategory: (cat: 'all' | 'primary' | 'text-bg' | 'sidebar') => void
  playgroundVars: Record<string, string>
  handlePlaygroundVarChange: (key: string, value: string) => void
}

export const TemaDesignerTab: React.FC<TemaDesignerTabProps> = ({
  designerMode,
  setDesignerMode,
  setShowAiModal,
  setAiThemeDesc,
  setGeneratedPrompt,
  applyPlaygroundToEditor,
  savePlaygroundDirectly,
  saving,
  selectedCategory,
  setSelectedCategory,
  playgroundVars,
  handlePlaygroundVarChange
}) => {
  const renderColorInput = (key: string, value: string): React.JSX.Element => {
    const isRgbaVar = key === '--sidebar-active-bg' || key === '--sidebar-active-border'

    if (isRgbaVar) {
      const { hex, opacity } = parseRgba(value)
      return (
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
              <input
                type="color"
                value={hex}
                onChange={(e) => {
                  const newRgba = toRgbaStr(e.target.value, opacity)
                  handlePlaygroundVarChange(key, newRgba)
                }}
                className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
              />
            </div>
            <input
              type="text"
              value={value}
              onChange={(e) => handlePlaygroundVarChange(key, e.target.value)}
              className="w-full px-2 py-0.5 font-mono text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => {
                const newRgba = toRgbaStr(hex, parseFloat(e.target.value))
                handlePlaygroundVarChange(key, newRgba)
              }}
              className="w-full accent-cyan-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[9px] font-mono text-slate-500 w-6 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 w-full">
        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
          <input
            type="color"
            value={value && value.startsWith('#') ? value : '#ffffff'}
            onChange={(e) => handlePlaygroundVarChange(key, e.target.value)}
            className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => handlePlaygroundVarChange(key, e.target.value)}
          className="w-full px-2 py-0.5 font-mono text-[10px] bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Tasarımcı Araç Çubuğu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tasarım Modu</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Düzenlemek istediğiniz tema modunu seçin
            </p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-955 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <button
              type="button"
              onClick={() => setDesignerMode('light')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                designerMode === 'light'
                  ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-150 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              ☀️ Aydınlık Tema
            </button>
            <button
              type="button"
              onClick={() => setDesignerMode('dark')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                designerMode === 'dark'
                  ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-150 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              🌙 Karanlık Tema
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            onClick={() => {
              setShowAiModal(true)
              setAiThemeDesc('')
              setGeneratedPrompt('')
            }}
            className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 dark:border-purple-900/40 dark:text-purple-450 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            AI Prompt Yardımcısı
          </Button>
          <Button
            type="button"
            onClick={applyPlaygroundToEditor}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold border border-slate-200/50 dark:border-slate-800/50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Editöre Aktar
          </Button>
          <Button
            type="button"
            onClick={savePlaygroundDirectly}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold transition-all shadow-md shadow-blue-500/10"
          >
            <Save className="w-4 h-4" />
            Kaydet & Uygula
          </Button>
        </div>
      </div>

      {/* Kategori Filtreleri */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2">Filtre:</span>
        {(['all', 'primary', 'text-bg', 'sidebar'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedCategory === cat
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {cat === 'all' && '🎨 Tümü'}
            {cat === 'primary' && '🔵 Renkler'}
            {cat === 'text-bg' && '📝 Yazı / Arkaplan'}
            {cat === 'sidebar' && '📋 Menü'}
          </button>
        ))}
      </div>

      {/* Ana İçerik: Renk Kartları + Önizleme */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sol Panel: Renk Kartları */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themeVariablesMeta
              .filter((v) => selectedCategory === 'all' || v.category === selectedCategory)
              .map((v) => {
                const val = playgroundVars[v.key] || ''
                return (
                  <div
                    key={v.key}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 group"
                  >
                    {/* Renk Önizleme ve Başlık */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-800 shadow-md shrink-0 mt-0.5"
                        style={{
                          backgroundColor: val.startsWith('rgba') ? val : val || '#cccccc'
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {v.name}
                        </div>
                        <div className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 mt-0.5 select-all">
                          {v.key}
                        </div>
                      </div>
                    </div>

                    {/* Açıklama */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {v.description}
                    </p>

                    {/* Renk Seçici */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      {renderColorInput(v.key, val)}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Sağ Panel: Canlı Önizleme Sandbox */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-500" />
              Canlı Önizleme
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50 font-medium">
              İzole Arayüz
            </span>
          </div>

          {/* The Sandbox Container */}
          <div
            style={playgroundVars as React.CSSProperties}
            className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[520px] text-[11px] leading-relaxed transition-all"
          >
            {/* Mock Application Layout */}
            <div
              className="flex flex-1 overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-100)',
                color: 'var(--text-100)'
              }}
            >
              {/* Mock Sidebar */}
              <div
                className="w-[35%] border-r flex flex-col p-3 justify-between select-none"
                style={{
                  backgroundColor: 'var(--sidebar-bg)',
                  color: 'var(--sidebar-text)',
                  borderColor: 'var(--sidebar-border)'
                }}
              >
                <div className="space-y-5">
                  {/* Sidebar Logo */}
                  <div
                    className="font-bold flex items-center gap-2 px-2 py-1.5"
                    style={{ color: 'var(--sidebar-active-text)' }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: 'var(--sidebar-active-text)'
                      }}
                    />
                    <span className="text-xs">Evraktron</span>
                  </div>

                  {/* Navigation Items */}
                  <div className="space-y-1.5">
                    {/* Normal Item */}
                    <div className="px-2.5 py-2 rounded-lg cursor-default flex items-center gap-2.5 transition-all">
                      <div
                        className="w-2 h-2 rounded-full opacity-45"
                        style={{ backgroundColor: 'var(--sidebar-text)' }}
                      />
                      Gelen Evraklar
                    </div>

                    {/* Hover Item */}
                    <div
                      className="px-2.5 py-2 rounded-lg cursor-default flex items-center gap-2.5 transition-all"
                      style={{
                        backgroundColor: 'var(--sidebar-hover-bg)',
                        color: 'var(--sidebar-hover-text)'
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: 'var(--sidebar-hover-text)'
                        }}
                      />
                      Giden Evraklar
                    </div>

                    {/* Active Item */}
                    <div
                      className="px-2.5 py-2 rounded-lg cursor-default flex items-center gap-2.5 font-bold border-l-2 transition-all"
                      style={{
                        backgroundColor: 'var(--sidebar-active-bg)',
                        color: 'var(--sidebar-active-text)',
                        borderLeftColor: 'var(--sidebar-active-border)'
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: 'var(--sidebar-active-text)'
                        }}
                      />
                      Tema Ayarları
                    </div>
                  </div>
                </div>

                <div className="text-[9px] opacity-50 px-2 py-1">v1.0.0-alpha.3</div>
              </div>

              {/* Mock Main Area */}
              <div className="w-[65%] flex flex-col p-4 overflow-y-auto gap-4 custom-scrollbar">
                {/* Header */}
                <div className="space-y-1">
                  <h4
                    className="font-bold text-sm tracking-tight"
                    style={{ color: 'var(--primary-300)' }}
                  >
                    Tasarım Stüdyosu
                  </h4>
                  <p style={{ color: 'var(--text-200)' }} className="text-[10px] leading-tight">
                    Değişkenler anında simüle edilir.
                  </p>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Stat Card */}
                  <div
                    className="p-3 border rounded-xl space-y-1.5"
                    style={{
                      backgroundColor: 'var(--bg-200)',
                      borderColor: 'var(--bg-300)'
                    }}
                  >
                    <div
                      style={{ color: 'var(--text-200)' }}
                      className="text-[9px] uppercase font-bold tracking-wider"
                    >
                      Evrak Sayısı
                    </div>
                    <div className="text-base font-black" style={{ color: 'var(--text-100)' }}>
                      1,482
                    </div>
                    <div
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold w-fit"
                      style={{
                        backgroundColor: 'var(--primary-100)',
                        color: 'var(--primary-300)'
                      }}
                    >
                      +12% Bugün
                    </div>
                  </div>

                  {/* Action Card */}
                  <div
                    className="p-3 border rounded-xl space-y-3 flex flex-col justify-between"
                    style={{
                      backgroundColor: 'var(--bg-200)',
                      borderColor: 'var(--bg-300)'
                    }}
                  >
                    <div
                      style={{ color: 'var(--text-200)' }}
                      className="text-[9px] uppercase font-bold tracking-wider"
                    >
                      Eylemler
                    </div>
                    <button
                      type="button"
                      className="w-full py-1.5 text-center font-bold text-white rounded-lg cursor-default shadow-sm text-[10px]"
                      style={{ backgroundColor: 'var(--accent-200)' }}
                    >
                      Yeni Kayıt
                    </button>
                  </div>
                </div>

                {/* Table Card */}
                <div
                  className="border rounded-xl p-3 space-y-2"
                  style={{
                    backgroundColor: 'var(--bg-200)',
                    borderColor: 'var(--bg-300)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px]" style={{ color: 'var(--text-100)' }}>
                      Son Evraklar
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[8px] font-semibold"
                      style={{
                        backgroundColor: 'var(--accent-100)',
                        color: 'var(--primary-300)'
                      }}
                    >
                      Bakanlık
                    </span>
                  </div>

                  {/* Mock Table */}
                  <div
                    className="space-y-1.5 border-t pt-2"
                    style={{ borderColor: 'var(--bg-300)' }}
                  >
                    <div
                      className="flex justify-between font-bold text-[9px] opacity-75"
                      style={{ color: 'var(--text-200)' }}
                    >
                      <span>Evrak Adı</span>
                      <span>Durum</span>
                    </div>
                    {/* Selected Row */}
                    <div
                      className="flex justify-between p-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--primary-100)' }}
                    >
                      <span style={{ color: 'var(--primary-300)' }} className="font-bold">
                        #2026/05 Onay
                      </span>
                      <span style={{ color: 'var(--primary-300)' }} className="font-semibold">
                        İmzalı
                      </span>
                    </div>
                    <div className="flex justify-between p-1.5">
                      <span style={{ color: 'var(--text-100)' }}>#2026/04 Dilekçe</span>
                      <span style={{ color: 'var(--text-200)' }}>Arşivde</span>
                    </div>
                  </div>
                </div>

                {/* Input field mock */}
                <div className="space-y-1.5">
                  <div style={{ color: 'var(--text-200)' }} className="text-[9px] font-semibold">
                    Hızlı Arama
                  </div>
                  <input
                    type="text"
                    placeholder="Evrak arayın..."
                    disabled
                    className="w-full px-3 py-1.5 border rounded-lg cursor-default text-[10px]"
                    style={{
                      backgroundColor: 'var(--bg-300)',
                      borderColor: 'var(--bg-300)',
                      color: 'var(--text-100)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
