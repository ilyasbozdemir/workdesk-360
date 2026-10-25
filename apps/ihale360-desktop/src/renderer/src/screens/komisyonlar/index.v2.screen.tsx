import React from 'react'
import { Building2, History, Layers, Users } from 'lucide-react'
import { DosyaKomisyonDetayView } from './components/DosyaKomisyonDetayView'
import { HizliKadroGuncelleModal } from './components/HizliKadroGuncelleModal'
import { useKomisyonlarV2 } from './v2/useKomisyonlarV2'
import {
  DosyaKomisyonlariTab,
  KurumsalSablonTab,
  GlobalRevizyonCizelgesiTab,
  KadroKopyalaModal
} from './v2/components'

export default function KomisyonlarV2Screen({
  isSubComponent = false
}: {
  isSubComponent?: boolean
}): React.JSX.Element {
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filterMode,
    setFilterMode,
    selectedDosya,
    setSelectedDosya,
    copyTargetDosya,
    setCopyTargetDosya,
    selectedSourceDosyaId,
    setSelectedSourceDosyaId,
    isCopying,
    copyFeedback,
    setCopyFeedback,
    editingTemplateKomisyon,
    setEditingTemplateKomisyon,
    templateData,
    refetchTemplate,
    isDosyaLoading,
    isDosyaRefetching,
    refetchDosyaList,
    isGlobalHistoryLoading,
    refetchGlobalHistory,
    handleApplyTemplate,
    handleExecuteCopy,
    filteredDosyaList,
    filteredHistoryList,
    totalFiles,
    customFilesCount,
    templateFilesCount,
    emptyFilesCount,
    availableSourceDosyalar,
    selectedSourceItem
  } = useKomisyonlarV2()

  // Tam Ekran Dosya Komisyon Detayı Açık İse
  if (selectedDosya) {
    return (
      <DosyaKomisyonDetayView
        dosyaId={selectedDosya.id}
        dosyaNo={selectedDosya.dosya_no}
        isTanimi={selectedDosya.is_tanimi}
        initialTab={selectedDosya.initialTab}
        onBack={() => {
          setSelectedDosya(null)
          refetchDosyaList()
          refetchGlobalHistory()
        }}
        onRefreshList={() => {
          refetchDosyaList()
          refetchGlobalHistory()
        }}
      />
    )
  }

  return (
    <div
      className={
        isSubComponent
          ? 'flex flex-col h-full space-y-4 w-full animate-in fade-in duration-200'
          : 'flex flex-col h-full space-y-4'
      }
    >
      {/* ÜST BAŞLIK VE SEKME YÖNETİM BARI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              Komisyon Yönetimi &amp; Kadro Dağılımı (v2)
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Dosya Bazlı &amp; Kurumsal Şablon
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dosyalara özel atanan komisyon kadrolarını yönetin, kurumsal şablondan aktarın veya
            dosyalar arası kadro kopyalayın.
          </p>
        </div>

        {/* Ana Sekme Değiştirici: Dosyalar | Şablonlar | Tarihçe */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shrink-0 self-start lg:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('dosyalar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dosyalar'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📁 Dosya Komisyonları</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono font-bold">
              {totalFiles}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sablonlar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sablonlar'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>👑 Kurumsal Şablon</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tarihce')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tarihce'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>🕒 Tüm Dosyaların Revizyon Çizelgesi</span>
          </button>
        </div>
      </div>

      {/* SEKME 1: DOSYA KOMİSYONLARI (DOSYA BAZLI KADROLAR) */}
      {activeTab === 'dosyalar' && (
        <DosyaKomisyonlariTab
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          isDosyaLoading={isDosyaLoading}
          isDosyaRefetching={isDosyaRefetching}
          onRefresh={() => {
            refetchDosyaList()
            refetchTemplate()
          }}
          filteredDosyaList={filteredDosyaList}
          totalFiles={totalFiles}
          customFilesCount={customFilesCount}
          templateFilesCount={templateFilesCount}
          emptyFilesCount={emptyFilesCount}
          onApplyTemplate={handleApplyTemplate}
          onOpenCopyModal={(item) => {
            setCopyTargetDosya(item)
            setSelectedSourceDosyaId(null)
            setCopyFeedback(null)
          }}
          onOpenDetail={(item, tab) =>
            setSelectedDosya({
              id: item.id,
              dosya_no: item.dosya_no,
              is_tanimi: item.is_tanimi,
              initialTab: tab
            })
          }
        />
      )}

      {/* SEKME 2: KURUMSAL GENEL ŞABLON KADROSU */}
      {activeTab === 'sablonlar' && (
        <KurumsalSablonTab
          piyasaDefaults={templateData.piyasaDefaults}
          muayeneDefaults={templateData.muayeneDefaults}
          onEditKomisyon={(kom) => setEditingTemplateKomisyon(kom)}
        />
      )}

      {/* SEKME 3: TÜM DOSYALARIN REVİZYON ÇİZELGESİ (GLOBAL AUDIT LOG) */}
      {activeTab === 'tarihce' && (
        <GlobalRevizyonCizelgesiTab
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isGlobalHistoryLoading={isGlobalHistoryLoading}
          filteredHistoryList={filteredHistoryList}
          onOpenDosyaDetail={(dosyaId, dosyaNo, isTanimi) =>
            setSelectedDosya({
              id: dosyaId,
              dosya_no: dosyaNo,
              is_tanimi: isTanimi,
              initialTab: 'revizyon'
            })
          }
        />
      )}

      {/* MODAL: BAŞKA DOSYADAN KADRO KOPYALAMA */}
      <KadroKopyalaModal
        targetDosya={copyTargetDosya}
        availableSourceDosyalar={availableSourceDosyalar}
        selectedSourceDosyaId={selectedSourceDosyaId}
        selectedSourceItem={selectedSourceItem}
        isCopying={isCopying}
        copyFeedback={copyFeedback}
        onSelectSourceId={setSelectedSourceDosyaId}
        onExecuteCopy={handleExecuteCopy}
        onClose={() => {
          setCopyTargetDosya(null)
          setSelectedSourceDosyaId(null)
          setCopyFeedback(null)
        }}
      />

      {/* MODAL: KURUMSAL ŞABLON KADRO DÜZENLEME */}
      {editingTemplateKomisyon && (
        <HizliKadroGuncelleModal
          isOpen={true}
          onClose={() => {
            setEditingTemplateKomisyon(null)
            refetchTemplate()
            refetchDosyaList()
          }}
          komisyonId={editingTemplateKomisyon.id}
          komisyonAdi={editingTemplateKomisyon.ad}
        />
      )}
    </div>
  )
}
