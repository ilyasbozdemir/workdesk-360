import React from 'react'
import { Building2, FolderKanban, Plus, Sparkles, Users } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { KomisyonOlusturModal } from './components/KomisyonOlusturModal'
import { PersonelAtaModal } from './components/PersonelAtaModal'
import { HizliKadroGuncelleModal } from './components/HizliKadroGuncelleModal'
import { KomisyonAtamaModal } from '../dosya/sub-screens/components/MalzemeListesi/components/KomisyonAtamaModal'
import { GenelSablonKadrolariTab } from './components/GenelSablonKadrolariTab'
import { DosyaKomisyonlariTab } from './components/DosyaKomisyonlariTab'
import { PersonelGorevDagilimiTab } from './components/PersonelGorevDagilimiTab'
import { AtamaGecmisiModal } from './components/AtamaGecmisiModal'
import { isBaseKomisyon, useKomisyonlarScreenLogic } from './useKomisyonlarScreenLogic'

export default function KomisyonlarScreen({
  isSubComponent = false
}: {
  isSubComponent?: boolean
}): React.JSX.Element {
  const {
    addTab,
    queryClient,
    activeMainTab,
    setActiveMainTab,
    searchTerm,
    setSearchTerm,
    dosyaKomisyonSearch,
    setDosyaKomisyonSearch,
    isModalOpen,
    setIsModalOpen,
    editingKomisyonId,
    setEditingKomisyonId,
    isAtaModalOpen,
    setIsAtaModalOpen,
    ataRoleId,
    setAtaRoleId,
    ataKomisyonId,
    setAtaKomisyonId,
    hizliKadroOpen,
    setHizliKadroOpen,
    hizliKadroKomisyon,
    setHizliKadroKomisyon,
    editingDosyaId,
    setEditingDosyaId,
    historyDosya,
    setHistoryDosya,
    expandedBelgelerMap,
    toggleBelgeler,
    activeDosyaId,
    handleOpenPreviewForSablon,
    komisyonlar,
    isKomisyonLoading,
    dosyaKomisyonList,
    isDosyaKomisyonLoading,
    historyLogs,
    isHistoryLoading,
    procurementFilter,
    setProcurementFilter,
    getIconForTur,
    isKomisyonMatchingMode,
    filteredKomisyonlar,
    filteredDosyaKomisyonlar,
    handleDeleteKomisyon
  } = useKomisyonlarScreenLogic()

  return (
    <div
      className={
        isSubComponent
          ? 'flex flex-col h-full space-y-6 w-full animate-in fade-in duration-200'
          : 'flex flex-col h-full space-y-6'
      }
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Komisyon Yönetimi ve Atama Geçmişi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Genel şablon kadrolarını yönetebilir veya dosyalara özel komisyon kadro atamalarını ve
            revizyon geçmişini inceleyebilirsiniz.
          </p>
        </div>

        {activeMainTab === 'sablonlar' && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer"
              onClick={() => {
                setEditingKomisyonId(null)
                setIsModalOpen(true)
              }}
            >
              <Plus className="w-4 h-4" /> Yeni Komisyon Tanımla
            </Button>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveMainTab('sablonlar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeMainTab === 'sablonlar'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>👑 Genel Şablon Kadroları</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {komisyonlar.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('dosya_komisyonlari')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeMainTab === 'dosya_komisyonlari'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>📂 Dosya Komisyonları & Atama Geçmişi</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:blue-900/60 text-blue-700 dark:text-blue-300 font-mono">
            {dosyaKomisyonList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('gorev_dagilimi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeMainTab === 'gorev_dagilimi'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>🧩 Personel Görev Dağılımı (Planlama Havuzu)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
            ORTAK HAVUZ
          </span>
        </button>
      </div>

      {/* TAB 3: KURUMSAL PERSONEL GÖREV DAĞILIMI VE PLANLAMA HAVUZU */}
      {activeMainTab === 'gorev_dagilimi' && <PersonelGorevDagilimiTab />}

      {/* TAB 1: GENEL ŞABLON KADROLARI */}
      {activeMainTab === 'sablonlar' && (
        <GenelSablonKadrolariTab
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          procurementFilter={procurementFilter}
          setProcurementFilter={setProcurementFilter}
          komisyonlar={komisyonlar}
          filteredKomisyonlar={filteredKomisyonlar}
          isKomisyonLoading={isKomisyonLoading}
          isKomisyonMatchingMode={isKomisyonMatchingMode}
          isBaseKomisyon={isBaseKomisyon}
          getIconForTur={getIconForTur}
          expandedBelgelerMap={expandedBelgelerMap}
          toggleBelgeler={toggleBelgeler}
          onHizliKadro={(k) => {
            setHizliKadroKomisyon(k)
            setHizliKadroOpen(true)
          }}
          onEditKomisyon={(id) => {
            setEditingKomisyonId(id)
            setIsModalOpen(true)
          }}
          onDeleteKomisyon={handleDeleteKomisyon}
          onOpenPreview={handleOpenPreviewForSablon}
          onOpenDetails={(id) => {
            addTab('/komisyonlar/detay?id=' + id)
          }}
          activeDosyaId={activeDosyaId}
        />
      )}

      {/* TAB 2: DOSYA KOMİSYONLARI VE ATAMA GEÇMİŞİ ZAMAN ÇİZELGESİ */}
      {activeMainTab === 'dosya_komisyonlari' && (
        <DosyaKomisyonlariTab
          filteredDosyaKomisyonlar={filteredDosyaKomisyonlar}
          isDosyaKomisyonLoading={isDosyaKomisyonLoading}
          dosyaKomisyonSearch={dosyaKomisyonSearch}
          setDosyaKomisyonSearch={setDosyaKomisyonSearch}
          onOpenHistory={(d) => setHistoryDosya(d)}
          onEditDosyaKomisyon={(id) => setEditingDosyaId(id)}
        />
      )}

      {/* Hızlı Kadro Güncelleme Modalı */}
      <HizliKadroGuncelleModal
        isOpen={hizliKadroOpen}
        onClose={() => {
          setHizliKadroOpen(false)
          setHizliKadroKomisyon(null)
        }}
        komisyonId={hizliKadroKomisyon?.id || null}
        komisyonAdi={hizliKadroKomisyon?.ad || 'Komisyon'}
        activeDosyaId={activeDosyaId}
      />

      {/* Komisyon Oluşturma / Tanım Düzenleme Modalı */}
      <KomisyonOlusturModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingKomisyonId(null)
        }}
        komisyonId={editingKomisyonId}
        onPreviewSablon={(sablon) => {
          if (!activeDosyaId) {
            alert(
              'Lütfen önce sol menüden veya "Dosyalar" altından bir dosya/proje açın. Belgeler, aktif dosya verileri kullanılarak hazırlanmaktadır.'
            )
            return
          }
          handleOpenPreviewForSablon(sablon, sablon.ad)
        }}
      />

      {/* Dosya İçi Komisyon Atama Modalı */}
      {editingDosyaId && (
        <KomisyonAtamaModal
          isOpen={!!editingDosyaId}
          onClose={() => {
            setEditingDosyaId(null)
            queryClient.invalidateQueries({
              queryKey: ['dosya-komisyonlari-global-list']
            })
          }}
          activeDosyaId={editingDosyaId}
        />
      )}

      {/* Atama Geçmişi Modalı */}
      {historyDosya && (
        <AtamaGecmisiModal
          historyDosya={historyDosya}
          onClose={() => setHistoryDosya(null)}
          historyLogs={historyLogs}
          isHistoryLoading={isHistoryLoading}
        />
      )}

      <PersonelAtaModal
        isOpen={isAtaModalOpen}
        onClose={() => {
          setIsAtaModalOpen(false)
          setAtaRoleId(null)
          setAtaKomisyonId(null)
        }}
        roleId={ataRoleId}
        komisyonId={ataKomisyonId}
      />
    </div>
  )
}
