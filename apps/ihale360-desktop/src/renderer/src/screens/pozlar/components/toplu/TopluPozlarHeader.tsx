import React from 'react'
import { ArrowLeft, Copy, Download, FileSpreadsheet, Save, Upload } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { cn } from '../../../../utils/cn'
import { APP_ROUTES } from '../../../../constants/routeConstants'
import { TopluTabType } from './toplu.types'

export const GithubIcon = ({
  size = 15,
  className = ''
}: {
  size?: number
  className?: string
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
)

interface TopluPozlarHeaderProps {
  onBack: () => void
  onDownloadTemplate: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBulkSave: () => void
  isSaving: boolean
  validRowCount: number
  activeTab: TopluTabType
  setActiveTab: (tab: TopluTabType) => void
  rowCount: number
}

export function TopluPozlarHeader({
  onBack,
  onDownloadTemplate,
  onFileUpload,
  onBulkSave,
  isSaving,
  validRowCount,
  activeTab,
  setActiveTab,
  rowCount
}: TopluPozlarHeaderProps): React.JSX.Element {
  return (
    <>
      {/* Üst Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Poz Listesine Geri Dön"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                TOPLU İŞLEMLER
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs text-slate-500 font-medium">
                Excel & GitHub Çevrimiçi Katalog Entegrasyonu
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Toplu Birim Fiyat Pozu Ekle & Eşitle
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Excel tablosundan toplu veri girin, Excel dosyası yükleyin veya GitHub Raw JSON
              üzerinden güncel pozları tek tıkla sisteme aktarın.
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={onDownloadTemplate}
            className="gap-2 text-xs"
            title="Excel Şablonu (.xlsx) İndir"
          >
            <Download size={14} />
            <span>Excel Şablonu İndir</span>
          </Button>

          <label className="cursor-pointer inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
            <Upload size={14} />
            <span>Excel Dosyası Yükle</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>

          <Button
            type="button"
            onClick={onBulkSave}
            disabled={isSaving || validRowCount === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 text-xs shadow-xs px-5 font-bold"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            <span>{validRowCount > 0 ? `${validRowCount} Pozu Kaydet` : 'Tümünü Kaydet'}</span>
          </Button>
        </div>
      </div>

      {/* Mod Sekmeleri */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('excel_grid')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'excel_grid'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          )}
        >
          <FileSpreadsheet size={15} />
          <span>Excel Benzeri Düzenleme Tablosu ({rowCount} Satır)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('github_sync')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'github_sync'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          )}
        >
          <GithubIcon size={15} />
          <span>GitHub Çevrimiçi JSON Eşitleme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('raw_paste')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'raw_paste'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          )}
        >
          <Copy size={15} />
          <span>Hızlı Metin / TSV / JSON Yapıştır</span>
        </button>
      </div>
    </>
  )
}
