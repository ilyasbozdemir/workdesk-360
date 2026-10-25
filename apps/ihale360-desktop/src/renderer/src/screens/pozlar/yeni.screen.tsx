import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useYeniPoz } from './useYeniPoz'
import { YeniPozHeader } from './components/YeniPozHeader'
import { YeniPozModals } from './components/YeniPozModals'
import { YeniPozFormCards } from './components/YeniPozFormCards'
import { YeniPozPreviewPanel } from './components/YeniPozPreviewPanel'

export default function YeniPozScreen(): React.JSX.Element {
  const {
    editId,
    formData,
    setFormData,
    fiyatListesi,
    isSaving,
    toastMessage,
    showUnsavedModal,
    setShowUnsavedModal,
    isDirty,
    aktifFasikuller,
    handleNavigateBack,
    handleTryClose,
    handleApplyTemplate,
    handleKurumPrefix,
    handleAddFiyatRow,
    handleUpdateFiyatRow,
    handleDeleteFiyatRow,
    handleSubmit
  } = useYeniPoz()

  return (
    <div className="p-4 sm:p-8 max-w-[1550px] mx-auto space-y-6 animate-in fade-in pb-20">
      <YeniPozModals
        toastMessage={toastMessage}
        showUnsavedModal={showUnsavedModal}
        setShowUnsavedModal={setShowUnsavedModal}
        handleNavigateBack={handleNavigateBack}
        handleSubmit={handleSubmit}
      />

      <YeniPozHeader
        editId={editId}
        isDirty={isDirty}
        isSaving={isSaving}
        handleTryClose={handleTryClose}
        handleSubmit={handleSubmit}
      />

      {/* Sorumluluk ve Rehber Bilgilendirme Bannerı */}
      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs flex items-start gap-3 text-amber-900 dark:text-amber-200">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle size={18} />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span>Eski/Yeni Poz Eşleşmesi & Fasikül Rayiç Takibi</span>
          </p>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            2019 yılında yürürlüğe giren yeni poz kod sistemi (örn:{' '}
            <code className="font-bold">15.110.1001</code>) ile önceki bülten poz kodları (örn:{' '}
            <code className="font-bold">14.040/1</code>) arasında eşleşme kurarak aramalarda her iki
            kodla da hızlıca ulaşabilirsiniz. Girdiğiniz dönemsel birim fiyatlar yaklaşık maliyet ve
            hakediş hesaplamalarında doğrudan kullanılır.
          </p>
        </div>
      </div>

      {/* Ana Form ve Sağ Önizleme Paneli */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <YeniPozFormCards
          formData={formData}
          setFormData={setFormData}
          fiyatListesi={fiyatListesi}
          aktifFasikuller={aktifFasikuller}
          handleKurumPrefix={handleKurumPrefix}
          handleAddFiyatRow={handleAddFiyatRow}
          handleUpdateFiyatRow={handleUpdateFiyatRow}
          handleDeleteFiyatRow={handleDeleteFiyatRow}
        />

        <YeniPozPreviewPanel
          editId={editId}
          formData={formData}
          fiyatListesi={fiyatListesi}
          isSaving={isSaving}
          handleApplyTemplate={handleApplyTemplate}
        />
      </form>
    </div>
  )
}
