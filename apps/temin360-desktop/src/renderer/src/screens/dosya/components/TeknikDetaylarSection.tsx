import React from 'react'
import { Cpu, ChevronDown, ChevronUp } from 'lucide-react'
import { PackageStructure } from './PackageStructure'
import { DteTransfer } from './DteTransfer'
import { SelectedFileInspector } from './SelectedFileInspector'
import { TableStat, PackageFile } from '../hooks/useDosyaScreenData'

interface TeknikDetaylarSectionProps {
  showTechnicalDetails: boolean
  setShowTechnicalDetails: (val: boolean) => void
  fileName: string
  selectedFile: PackageFile
  setSelectedFile: (file: PackageFile) => void
  dteContentType: 'firms' | 'items' | 'all'
  setDteContentType: (type: 'firms' | 'items' | 'all') => void
  handleExportDte: () => Promise<void>
  handleImportDte: () => Promise<void>
  dteLoading: boolean
  dteStatus: { type: 'success' | 'error' | 'info'; message: string } | null
  rawJson: string
  activeMeta: any
  loadingStats: boolean
  statsError: string | null
  dbStats: TableStat[]
  activeFilePath: string | null
  copied: boolean
  handleCopyPath: () => void
}

export const TeknikDetaylarSection: React.FC<TeknikDetaylarSectionProps> = ({
  showTechnicalDetails,
  setShowTechnicalDetails,
  fileName,
  selectedFile,
  setSelectedFile,
  dteContentType,
  setDteContentType,
  handleExportDte,
  handleImportDte,
  dteLoading,
  dteStatus,
  rawJson,
  activeMeta,
  loadingStats,
  statsError,
  dbStats,
  activeFilePath,
  copied,
  handleCopyPath
}) => {
  return (
    <>
      {/* AYIRICI VE TEKNİK DETAY AÇ/KAPA */}
      <div className="lg:col-span-12 mt-4 border-t border-slate-200 dark:border-slate-800 pt-6">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-400 transition-colors">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">
                Sistem ve Teknik Detaylar (Yedekleme & SQLite)
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Arşiv yapısı, veritabanı yedeği (DTE) ve sistem güncellemeleri
              </p>
            </div>
          </div>
          {showTechnicalDetails ? (
            <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          )}
        </button>
      </div>

      {showTechnicalDetails && (
        <>
          {/* SOL KOLON: PAKET YAPISI VE İÇERİK GÖRSELLEŞTİRME */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Paket Yapısı Kartı */}
            <PackageStructure
              fileName={fileName || ''}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />

            {/* Veri Alışverişi (.dte) Kartı */}
            <DteTransfer
              dteContentType={dteContentType}
              setDteContentType={setDteContentType}
              handleExportDte={handleExportDte}
              handleImportDte={handleImportDte}
              dteLoading={dteLoading}
              dteStatus={dteStatus}
            />

            {/* Hızlı Bilgi Bilgisi */}
            <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                Dosya Değişiklik Davranışı
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium font-sans">
                Uygulama çalışırken SQLite veritabanında yaptığınız tüm işlemler anlık kaydedilir.
                Uygulamadan çıkış yaparken veya dosya kapatılırken tüm veriler ve ekler otomatik
                olarak tekrar sıkıştırılıp tek bir <strong>.temin</strong> proje dosyası olarak
                paketlenir.
              </p>
            </div>
          </div>

          {/* SAĞ KOLON: SEÇİLEN DOSYANIN INTERAKTIF DETAYI */}
          <SelectedFileInspector
            selectedFile={selectedFile}
            rawJson={rawJson}
            activeMeta={activeMeta}
            loadingStats={loadingStats}
            statsError={statsError}
            dbStats={dbStats}
            activeFilePath={activeFilePath}
            copied={copied}
            handleCopyPath={handleCopyPath}
          />
        </>
      )}
    </>
  )
}
