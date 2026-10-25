import React from 'react'
import { Sparkles, Download, Printer, History, Save, CheckCircle2 } from 'lucide-react'
import type { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'
import { STANDARD_2886_TEMPLATES } from './standard2886Templates.data'

interface StudyoTopToolbarProps {
  selectedDosyaId: string
  dosyalar: Dosya2886Item[]
  onSelectDosyaId: (id: string) => void
  selectedTemplateKod: string
  onSelectTemplate: (kod: string) => void
  onInjectPlaceholders: () => void
  onExportWord: () => void
  onPrint: () => void
  onSaveRevision: () => void
  onSaveDosya: () => void
  savedSuccess: boolean
}

export function StudyoTopToolbar({
  selectedDosyaId,
  dosyalar,
  onSelectDosyaId,
  selectedTemplateKod,
  onSelectTemplate,
  onInjectPlaceholders,
  onExportWord,
  onPrint,
  onSaveRevision,
  onSaveDosya,
  savedSuccess
}: StudyoTopToolbarProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      {/* Dosya & Şablon Seçici */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Dinamik Belge & Form Builder Stüdyosu</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 font-mono">
                TipTap + Mustache
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Form alanları ile belge şablonunu dinamik yer tutucularla eşleştirin ve yönetin.
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Aktif Dosya Seçimi */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            İhale Dosyası:
          </span>
          <select
            value={selectedDosyaId}
            onChange={(e) => onSelectDosyaId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer max-w-60"
          >
            <option value="new">+ Yeni 2886 Dosyası Başlat</option>
            {dosyalar.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ihaleKayitNo} — {d.ihaleAdi.substring(0, 24)}...
              </option>
            ))}
          </select>
        </div>

        {/* Şablon Seçimi */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Hazır Şablon:
          </span>
          <select
            value={selectedTemplateKod}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-bold text-purple-900 dark:text-purple-200 cursor-pointer max-w-65"
          >
            {STANDARD_2886_TEMPLATES.map((t) => (
              <option key={t.kod} value={t.kod}>
                {t.ad}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Eylem Butonları */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onInjectPlaceholders}
          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="Formdaki tüm değerleri {{yer_tutucular}} yerine metne dönüştürür"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Değerleri Belgeye Aktar</span>
        </button>

        <button
          type="button"
          onClick={onExportWord}
          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Word (.doc)</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Yazdır</span>
        </button>

        <button
          type="button"
          onClick={onSaveRevision}
          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          title="Şimdiki belge halini geri dönülebilir sürüm olarak kaydeder"
        >
          <History className="w-3.5 h-3.5" />
          <span>Sürüm Al</span>
        </button>

        <button
          type="button"
          onClick={onSaveDosya}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kaydedildi!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Dosyayı Kaydet</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
