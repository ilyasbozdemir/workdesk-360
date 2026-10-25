import React from 'react'
import { Info, Save } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { THEME_PRESETS } from '../themePresets'

interface TemaPresetsTabProps {
  isEmbedded: boolean
  localLight: string
  setLocalLight: (val: string) => void
  localDark: string
  setLocalDark: (val: string) => void
  saving: boolean
  handleSave: () => Promise<void>
  setPresetTheme: (light: string, dark: string, name: string) => Promise<void>
  setShowAiModal: (val: boolean) => void
  setAiThemeDesc: (val: string) => void
  setGeneratedPrompt: (val: string) => void
}

export const TemaPresetsTab: React.FC<TemaPresetsTabProps> = ({
  isEmbedded,
  localLight,
  setLocalLight,
  localDark,
  setLocalDark,
  saving,
  handleSave,
  setPresetTheme,
  setShowAiModal,
  setAiThemeDesc,
  setGeneratedPrompt
}) => {
  return (
    <div className="space-y-6">
      {/* Hazır Tema Seçenekleri */}
      <div
        className={
          isEmbedded
            ? 'bg-slate-50/50 dark:bg-slate-955/30 border border-slate-150/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4'
        }
      >
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Hazır Temalar</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Object.entries(THEME_PRESETS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPresetTheme(value.light, value.dark, value.name)}
              className="py-3 px-4 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-350 dark:hover:border-slate-700 transition-all flex flex-col items-center gap-2.5 shadow-sm"
            >
              <div
                className={`w-8 h-8 rounded-full ${value.color} border border-white dark:border-slate-950 shadow-md`}
              />
              <span>{value.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CSS Değişkenleri Açıklama Rehberi */}
      <div
        className={
          isEmbedded
            ? 'bg-slate-100/40 dark:bg-slate-955/50 border border-slate-150/50 dark:border-slate-850/40 rounded-2xl p-6 shadow-inner space-y-4'
            : 'bg-slate-55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-inner space-y-4'
        }
      >
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-500" /> CSS Değişken Rehberi (Renk Anahtarları Ne İşe
          Yarar?)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs leading-normal">
          <div className="space-y-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --primary-100
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Birincil soft renk. Seçili elemanların arka planı, rozet ve aktif kart arka
                planlarında kullanılır.
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --primary-200
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Birincil orta ton. Hover/odaklanma kenarlıkları ve aktif buton gölgelerinde tercih
                edilir.
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --primary-300
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Birincil koyu/yüksek kontrast ton. Başlıklar, vurgulanması gereken koyu etiket
                metinleri için.
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --accent-100
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Vurgu/İkincil soft renk. Alternatif butonlar, etiketler veya ikincil aktif durumlar
                için.
              </span>
            </div>
            <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --sidebar-bg & --sidebar-text
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Sol menü (Sidebar) arka plan rengi ve genel yazı rengi.
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --sidebar-border
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Sol menü sağ sınır çizgisi ve ayraç çizgilerinin rengi.
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --accent-200
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Birincil eylem rengi. Kaydet butonları, linkler ve ana eylemlerin arka plan rengi.
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --text-100 & --text-200
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Metin renkleri. 100 ana okuma metni (koyu/açık), 200 ise açıklama ve alt başlıklar
                içindir.
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --bg-100 & --bg-200 & --bg-300
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Sırasıyla ana sayfa arka planı (100), kart/sidebar kutu arka planı (200) ve
                kenarlık/input arka planları (300).
              </span>
            </div>
            <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --sidebar-hover-bg & --sidebar-hover-text
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Sol menüde elemanların hover durumundaki arka plan ve yazı rengi.
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                --sidebar-active-bg & --sidebar-active-text
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Sol menüde seçili olan elemanın arka plan ve yazı rengi.
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="leading-relaxed text-slate-600 dark:text-slate-400">
            <span className="font-bold text-blue-600 dark:text-blue-400">Öneri:</span> Kendi özel
            renk paletinizi yapay zekayı (ChatGPT, Claude vb.) kullanarak saniyeler içinde
            tasarlamak için <strong>AI Prompt Yardımcısı</strong> modülümüzü kullanabilirsiniz. Ya
            da harici <strong>BairesDev AI Colors</strong> aracını kullanabilirsiniz.
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => {
                setShowAiModal(true)
                setAiThemeDesc('')
                setGeneratedPrompt('')
              }}
              className="text-[10px] py-1 h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
            >
              AI Promptu Oluştur
            </Button>
            <Button
              type="button"
              onClick={() => {
                const electron = (window as any).electron
                if (
                  electron &&
                  electron.shell &&
                  typeof electron.shell.openExternal === 'function'
                ) {
                  electron.shell.openExternal('https://www.bairesdev.com/tools/ai-colors')
                } else {
                  window.open('https://www.bairesdev.com/tools/ai-colors', '_blank')
                }
              }}
              className="text-[10px] py-1 h-7 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold"
            >
              {'BairesDev AI Colors'}
            </Button>
          </div>
        </div>
      </div>

      {/* Manuel CSS Değişken Tanımlama Kutuları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={
            isEmbedded
              ? 'bg-slate-50/50 dark:bg-slate-955/30 border border-slate-150/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-3'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3'
          }
        >
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Aydınlık Tema Değişkenleri (Light Mode CSS)
          </label>
          <textarea
            value={localLight}
            onChange={(e) => setLocalLight(e.target.value)}
            placeholder={`--primary-100: #d4eaf7;\n--accent-200: #00668c;\n--bg-100: #fffefb;`}
            className="w-full h-48 p-3 font-mono text-xs bg-white dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-800 dark:text-slate-200 resize-none custom-scrollbar"
          />
        </div>

        <div
          className={
            isEmbedded
              ? 'bg-slate-50/50 dark:bg-slate-955/30 border border-slate-150/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-3'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3'
          }
        >
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Karanlık Tema Değişkenleri (Dark Mode CSS)
          </label>
          <textarea
            value={localDark}
            onChange={(e) => setLocalDark(e.target.value)}
            placeholder={`--primary-100: #1b263b;\n--accent-200: #778da9;\n--bg-100: #0d1b2a;`}
            className="w-full h-48 p-3 font-mono text-xs bg-white dark:bg-slate-955/50 border border-slate-200/70 dark:border-slate-800/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-800 dark:text-slate-200 resize-none custom-scrollbar"
          />
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-6 text-sm font-semibold transition-all shadow-md shadow-blue-500/10"
        >
          <Save className="w-4 h-4" /> Değişiklikleri Kaydet & Uygula
        </Button>
      </div>
    </div>
  )
}
