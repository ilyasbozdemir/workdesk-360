import React from 'react'
import { FileText, RotateCcw, Save, Sliders, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useDocumentTheme } from './useDocumentTheme'

type HeaderProps = ReturnType<typeof useDocumentTheme>

export function DocumentThemeHeader(props: HeaderProps): React.JSX.Element {
  const {
    theme,
    isSaving,
    isLoadingSettings,
    notification,
    setJsonText,
    setJsonModalOpen,
    handleResetToDefault,
    handleSaveToDb
  } = props

  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800'
              : notification.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-300/80 dark:border-blue-800'
          }`}
        >
          {notification.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {notification.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-md border border-slate-700/60">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Resmi Belge & Evrak Şablon Teması
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                DB Entegre
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              İhtiyaç listesi, yaklaşık maliyet, onay belgesi ve tüm resmi çıktıların tipografi,
              kenar boşluğu, tablo ve renk standartlarını yapılandırın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setJsonText(JSON.stringify(theme, null, 2))
              setJsonModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition-all cursor-pointer"
            title="JSON İçe/Dışa Aktar"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>JSON İçe/Dışa Aktar</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-xl border border-slate-600 transition-all cursor-pointer"
            title="Varsayılan Değerlere Dön"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılana Sıfırla</span>
          </button>

          <button
            type="button"
            disabled={isSaving || isLoadingSettings}
            onClick={handleSaveToDb}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : "DB'ye Kaydet"}</span>
          </button>
        </div>
      </div>
    </>
  )
}
