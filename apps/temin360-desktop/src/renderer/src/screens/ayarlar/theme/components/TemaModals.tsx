import React from 'react'
import { Check, Copy, ExternalLink, FileJson, Sparkles } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

interface TemaModalsProps {
  showAiModal: boolean
  setShowAiModal: (val: boolean) => void
  aiThemeDesc: string
  setAiThemeDesc: (val: string) => void
  generatedPrompt: string
  setGeneratedPrompt: (val: string) => void
  generateAiPrompt: () => void
  copyPromptToClipboard: () => void
  copiedPrompt: boolean
  showImportModal: boolean
  setShowImportModal: (val: boolean) => void
  importJsonText: string
  setImportJsonText: (val: string) => void
  handleImport: () => void
}

export const TemaModals: React.FC<TemaModalsProps> = ({
  showAiModal,
  setShowAiModal,
  aiThemeDesc,
  setAiThemeDesc,
  generatedPrompt,
  setGeneratedPrompt,
  generateAiPrompt,
  copyPromptToClipboard,
  copiedPrompt,
  showImportModal,
  setShowImportModal,
  importJsonText,
  setImportJsonText,
  handleImport
}) => {
  return (
    <>
      {/* AI Prompt Helper Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-lg text-slate-850 dark:text-slate-150">
                  AI Tema Prompt Oluşturucu
                </h3>
                <p className="text-[10px] text-slate-550 dark:text-slate-400">
                  ChatGPT veya Claude için profesyonel bir renk paleti oluşturma promptu hazırlar.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                Nasıl bir tema istersiniz? (Örn: Pastel Orman Yeşili, Retro Turuncu, Modern Gece
                Mavisi...)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiThemeDesc}
                  onChange={(e) => setAiThemeDesc(e.target.value)}
                  placeholder="İstediğiniz tema stilini buraya yazın..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-slate-200"
                />
                <Button
                  onClick={generateAiPrompt}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0"
                >
                  Prompt Hazırla
                </Button>
              </div>
            </div>

            {generatedPrompt && (
              <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">
                    Hazırlanan Yapay Zeka Promptu:
                  </span>
                  <button
                    type="button"
                    onClick={copyPromptToClipboard}
                    className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        Kopyalandı!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Promptu Kopyala
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={generatedPrompt}
                  className="w-full h-44 p-3 font-mono text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 resize-none select-all custom-scrollbar"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 leading-relaxed">
                  <div>
                    💡 Promptu kopyalayıp aşağıdaki yapay zeka araçlarından birine yapıştırın. Çıkan
                    JSON kodunu kopyalayıp <strong>Temayı İçe Aktar (JSON)</strong> butonuyla buraya
                    aktarabilirsiniz!
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="https://chatgpt.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:text-emerald-450 border border-emerald-200/50 dark:border-emerald-900/40 py-2 rounded-xl text-xs font-bold transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    ChatGPT'ye Git
                  </a>
                  <a
                    href="https://claude.ai/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:hover:bg-orange-900/30 dark:text-orange-450 border border-orange-200/50 dark:border-orange-900/40 py-2 rounded-xl text-xs font-bold transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Claude'a Git
                  </a>
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
              <Button
                onClick={() => {
                  setShowAiModal(false)
                  setAiThemeDesc('')
                  setGeneratedPrompt('')
                }}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <FileJson className="w-6 h-6 text-cyan-500" />
              <h3 className="font-bold text-lg text-slate-850 dark:text-slate-150">
                Temayı İçe Aktar (JSON)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dışa aktardığınız veya paylaşılan tema JSON kodunu aşağıdaki alana kopyalayarak içe
              aktarın:
            </p>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`{\n  "light": "--primary-100: #e0f7fa;...",\n  "dark": "--primary-100: #004d40;..."\n}`}
              className="w-full h-44 p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-800 dark:text-slate-200 resize-none custom-scrollbar"
            />
            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <Button
                onClick={() => {
                  setShowImportModal(false)
                  setImportJsonText('')
                }}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                İptal
              </Button>
              <Button
                onClick={handleImport}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                İçe Aktar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
