import React from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, FileArchive } from 'lucide-react'
import { UpdaterWidget } from './components/UpdaterWidget'
import { ChangelogWidget } from './components/ChangelogWidget'
import { DosyaOzetPaneli } from './components/DosyaOzetPaneli'
import { DosyaSecilmediHero } from './components/DosyaSecilmediHero'
import { TeknikDetaylarSection } from './components/TeknikDetaylarSection'
import { useDosyaScreenData } from './hooks/useDosyaScreenData'

export default function DosyaScreen(): React.JSX.Element {
  const {
    activeMeta,
    activeFilePath,
    fileName,
    activeDosyaId,
    selectedFile,
    setSelectedFile,
    copied,
    handleCopyPath,
    changelog,
    backlog,
    activeHistoryTab,
    setActiveHistoryTab,
    showTechnicalDetails,
    setShowTechnicalDetails,
    dosyaData,
    kalemler,
    firmalar,
    birimAdi,
    loadingDosya,
    dteContentType,
    setDteContentType,
    dteStatus,
    dteLoading,
    handleExportDte,
    handleImportDte,
    dbStats,
    loadingStats,
    statsError,
    updaterStatus,
    updaterError,
    handleCheckUpdates,
    handleQuitAndInstall,
    getAsamaLabel,
    formatMoney,
    rawJson
  } = useDosyaScreenData()

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Üst Başlık Bölümü */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow-sm active:scale-95 transition-all"
            title="Gösterge Paneline Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-855 dark:text-slate-100 flex items-center gap-2">
              <FileArchive className="w-7 h-7 text-amber-500" />
              {dosyaData ? dosyaData.konu : 'Aktif Çalışma Dosyası (.temin)'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
              {dosyaData
                ? `Dosya No: ${dosyaData.temin_no || '-'} | Bütçe Yılı: ${
                    dosyaData.butce_yili || '-'
                  }`
                : 'Uygulamanın veri alışverişi yaptığı arşiv paketinin detayları.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Uyarılar (Varsa) */}
        {activeMeta?.warnings && activeMeta.warnings.length > 0 && (
          <div className="lg:col-span-12 bg-rose-50 dark:bg-rose-955/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 flex flex-col gap-3 shadow-sm mb-2 animate-in slide-in-from-top-2">
            {activeMeta.warnings.map((warn, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-rose-700 dark:text-rose-455 text-xs font-bold"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{warn}</p>
              </div>
            ))}
          </div>
        )}

        {/* DOSYA ÖZETİ PANELİ */}
        <div className="lg:col-span-12">
          {loadingDosya ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-xs italic">
              Dosya özeti yükleniyor...
            </div>
          ) : dosyaData ? (
            <DosyaOzetPaneli
              dosyaData={dosyaData}
              birimAdi={birimAdi}
              kalemler={kalemler}
              firmalar={firmalar}
              activeDosyaId={activeDosyaId}
              formatMoney={formatMoney}
              getAsamaLabel={getAsamaLabel}
            />
          ) : (
            <DosyaSecilmediHero />
          )}
        </div>

        {/* AYIRICI VE TEKNİK DETAYLAR */}
        <TeknikDetaylarSection
          showTechnicalDetails={showTechnicalDetails}
          setShowTechnicalDetails={setShowTechnicalDetails}
          fileName={fileName || ''}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          dteContentType={dteContentType}
          setDteContentType={setDteContentType}
          handleExportDte={handleExportDte}
          handleImportDte={handleImportDte}
          dteLoading={dteLoading}
          dteStatus={dteStatus}
          rawJson={rawJson}
          activeMeta={activeMeta}
          loadingStats={loadingStats}
          statsError={statsError}
          dbStats={dbStats}
          activeFilePath={activeFilePath}
          copied={copied}
          handleCopyPath={handleCopyPath}
        />
      </div>

      {/* Yol Haritası & Sürüm Notları (Changelog & Backlog) */}
      <ChangelogWidget
        activeHistoryTab={activeHistoryTab}
        setActiveHistoryTab={setActiveHistoryTab}
        changelog={changelog}
        backlog={backlog}
        activeMeta={activeMeta}
      />

      {/* Güncelleme Bölümü */}
      <div className="h-px bg-slate-200 dark:border-slate-800 my-2" />
      <UpdaterWidget
        activeMeta={activeMeta}
        updaterStatus={updaterStatus}
        updaterError={updaterError}
        handleCheckUpdates={handleCheckUpdates}
        handleQuitAndInstall={handleQuitAndInstall}
      />
    </div>
  )
}
