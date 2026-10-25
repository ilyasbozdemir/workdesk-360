import React from 'react'
import { APP_ROUTES } from '../../constants/routeConstants'
import { TopluPozRow } from './components/toplu/toplu.types'
import { useTopluPozlar } from './components/toplu/useTopluPozlar'
import { TopluPozlarHeader } from './components/toplu/TopluPozlarHeader'
import { TopluGridTab } from './components/toplu/TopluGridTab'
import { TopluGithubTab } from './components/toplu/TopluGithubTab'
import { TopluPasteTab } from './components/toplu/TopluPasteTab'

export type { TopluPozRow }

export default function TopluPozlarScreen(): React.JSX.Element {
  const {
    activeTab,
    setActiveTab,
    rows,
    githubUrl,
    setGithubUrl,
    isFetchingGithub,
    githubFetchedData,
    githubFetchError,
    pasteText,
    setPasteText,
    isSaving,
    toastMessage,
    validRowCount,
    handleAddRow,
    handleAddMultipleRows,
    handleUpdateRow,
    handleDeleteRow,
    handleClearAll,
    handleDownloadExcelTemplate,
    handleFileUpload,
    handleParsePastedText,
    handleFetchFromGithub,
    handleTransferGithubToGrid,
    handleCopyJsonTemplate,
    handleBulkSave,
    navigate
  } = useTopluPozlar()

  return (
    <div className="p-4 sm:p-8 max-w-[1700px] mx-auto space-y-6 animate-in fade-in pb-20">
      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top-4">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Üst Bar / Header ve Sekmeler */}
      <TopluPozlarHeader
        onBack={() => navigate({ to: APP_ROUTES.POZLAR })}
        onDownloadTemplate={handleDownloadExcelTemplate}
        onFileUpload={handleFileUpload}
        onBulkSave={handleBulkSave}
        isSaving={isSaving}
        validRowCount={validRowCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rowCount={rows.length}
      />

      {/* SEKME 1: EXCEL GRID */}
      {activeTab === 'excel_grid' && (
        <TopluGridTab
          rows={rows}
          validRowCount={validRowCount}
          handleAddRow={handleAddRow}
          handleAddMultipleRows={handleAddMultipleRows}
          handleClearAll={handleClearAll}
          handleUpdateRow={handleUpdateRow}
          handleDeleteRow={handleDeleteRow}
        />
      )}

      {/* SEKME 2: GITHUB RAW JSON İLE EŞİTLEME */}
      {activeTab === 'github_sync' && (
        <TopluGithubTab
          githubUrl={githubUrl}
          setGithubUrl={setGithubUrl}
          isFetchingGithub={isFetchingGithub}
          handleFetchFromGithub={handleFetchFromGithub}
          githubFetchError={githubFetchError}
          githubFetchedData={githubFetchedData}
          handleTransferGithubToGrid={handleTransferGithubToGrid}
          handleCopyJsonTemplate={handleCopyJsonTemplate}
        />
      )}

      {/* SEKME 3: HIZLI METIN / TSV / JSON YAPIŞTIR */}
      {activeTab === 'raw_paste' && (
        <TopluPasteTab
          pasteText={pasteText}
          setPasteText={setPasteText}
          handleParsePastedText={handleParsePastedText}
        />
      )}
    </div>
  )
}
