import React from 'react'
import { CheckCircle2, Download, Palette, Sliders, Upload } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useTemaScreen } from './theme/useTemaScreen'
import { TemaPresetsTab } from './theme/components/TemaPresetsTab'
import { TemaDesignerTab } from './theme/components/TemaDesignerTab'
import { TemaModals } from './theme/components/TemaModals'

export default function TemaScreen({
  isEmbedded = false
}: {
  isEmbedded?: boolean
}): React.JSX.Element {
  const {
    localLight,
    setLocalLight,
    localDark,
    setLocalDark,
    saving,
    notification,
    showImportModal,
    setShowImportModal,
    importJsonText,
    setImportJsonText,
    activeTab,
    setActiveTab,
    designerMode,
    setDesignerMode,
    playgroundVars,
    selectedCategory,
    setSelectedCategory,
    showAiModal,
    setShowAiModal,
    aiThemeDesc,
    setAiThemeDesc,
    generatedPrompt,
    copiedPrompt,
    setGeneratedPrompt,
    handlePlaygroundVarChange,
    applyPlaygroundToEditor,
    savePlaygroundDirectly,
    generateAiPrompt,
    copyPromptToClipboard,
    handleSave,
    setPresetTheme,
    exportTheme,
    handleImport
  } = useTemaScreen()

  return (
    <div
      className={
        isEmbedded
          ? 'space-y-6 flex flex-col justify-between w-full'
          : 'p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in duration-300 overflow-y-auto max-h-full'
      }
    >
      {isEmbedded ? (
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100">
              Renk ve Tema Özelleştirme
            </h2>
            <p className="text-xs text-slate-500">
              Uygulamanın renk paletlerini, hazır temalarını ve CSS değişkenlerini ayarlayın.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            >
              <Upload className="w-3.5 h-3.5" /> İçe Aktar
            </Button>
            <Button
              onClick={exportTheme}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> Dışa Aktar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-850 dark:text-slate-100">
              <Palette className="w-8 h-8 text-cyan-500" />
              Renk ve Tema Ayarları
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Uygulama arayüzünde kullanılan renk paletlerini özelleştirin. Hazır temalardan birini
              seçebilir, dışa/içe aktarabilir veya kendi CSS değişkenlerinizi yazabilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              <Upload className="w-4 h-4" /> Temayı İçe Aktar
            </Button>
            <Button
              onClick={exportTheme}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              <Download className="w-4 h-4" /> Temayı Dışa Aktar
            </Button>
          </div>
        </div>
      )}

      {/* Bildirim Alanı */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Tab Controls */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'presets'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Palette className="w-4 h-4" />
          Hazır Temalar & Kod Editörü
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('designer')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'designer'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Görsel Tasarımcı & Canlı Önizleme (Playground)
        </button>
      </div>

      {activeTab === 'presets' ? (
        <TemaPresetsTab
          isEmbedded={isEmbedded}
          localLight={localLight}
          setLocalLight={setLocalLight}
          localDark={localDark}
          setLocalDark={setLocalDark}
          saving={saving}
          handleSave={handleSave}
          setPresetTheme={setPresetTheme}
          setShowAiModal={setShowAiModal}
          setAiThemeDesc={setAiThemeDesc}
          setGeneratedPrompt={setGeneratedPrompt}
        />
      ) : (
        <TemaDesignerTab
          designerMode={designerMode}
          setDesignerMode={setDesignerMode}
          setShowAiModal={setShowAiModal}
          setAiThemeDesc={setAiThemeDesc}
          setGeneratedPrompt={setGeneratedPrompt}
          applyPlaygroundToEditor={applyPlaygroundToEditor}
          savePlaygroundDirectly={savePlaygroundDirectly}
          saving={saving}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          playgroundVars={playgroundVars}
          handlePlaygroundVarChange={handlePlaygroundVarChange}
        />
      )}

      {/* Modallar */}
      <TemaModals
        showAiModal={showAiModal}
        setShowAiModal={setShowAiModal}
        aiThemeDesc={aiThemeDesc}
        setAiThemeDesc={setAiThemeDesc}
        generatedPrompt={generatedPrompt}
        setGeneratedPrompt={setGeneratedPrompt}
        generateAiPrompt={generateAiPrompt}
        copyPromptToClipboard={copyPromptToClipboard}
        copiedPrompt={copiedPrompt}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importJsonText={importJsonText}
        setImportJsonText={setImportJsonText}
        handleImport={handleImport}
      />
    </div>
  )
}
