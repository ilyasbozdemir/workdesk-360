import React from 'react'
import { CheckCircle2, Barcode } from 'lucide-react'
import { HizliTopluKalemGrid } from '../dosya/sub-screens/components/MalzemeListesi/HizliTopluKalemGrid'
import { useYeniMalzeme } from './yeni.hooks'
import { YeniMalzemeHeader } from './components/YeniMalzemeHeader'
import { TurSecimiCard } from './components/TurSecimiCard'
import { KimlikCard } from './components/KimlikCard'
import { TurOzelAlanlarCard } from './components/TurOzelAlanlarCard'
import { TeknikDetayCard } from './components/TeknikDetayCard'
import { GorselUploadCard } from './components/GorselUploadCard'
import { MalzemeModals } from './components/MalzemeModals'
import { APP_ROUTES } from '../../constants/routeConstants'

export default function YeniMalzemeScreen(): React.JSX.Element {
  const {
    editId,
    navigate,
    birimler,
    entryMode,
    setEntryMode,
    formData,
    setFormData,
    selectedType,
    toastMessage,
    isSaving,
    imageInputMode,
    setImageInputMode,
    customImageUrl,
    setCustomImageUrl,
    fileInputRef,
    isOkasModalOpen,
    setIsOkasModalOpen,
    isTasinirModalOpen,
    setIsTasinirModalOpen,
    isPozModalOpen,
    setIsPozModalOpen,
    handleSelectPoz,
    isEditingBarkod,
    setIsEditingBarkod,
    barkodError,
    setBarkodError,
    checkBarkod,
    okasSearch,
    setOkasSearch,
    tasinirSearch,
    setTasinirSearch,
    filteredOkas,
    filteredTasinir,
    isOkasLoading,
    isTasinirLoading,
    isAiGeneratingOkas,
    handleAiOkasSuggest,
    handleImageUpload,
    handleApplyImageUrl,
    handleImageDrop,
    handleSave,
    handleBatchSaveInLibrary
  } = useYeniMalzeme()

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <YeniMalzemeHeader
        editId={editId}
        entryMode={entryMode}
        setEntryMode={setEntryMode}
        isSaving={isSaving}
        handleSave={handleSave}
        onCancel={() => navigate({ to: APP_ROUTES.MALZEMELER })}
        selectedType={selectedType}
      />

      {/* Main Form Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {entryMode === 'batch' && !editId ? (
          <div className="max-w-[1600px] mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <HizliTopluKalemGrid
              units={birimler}
              onSaveBatch={handleBatchSaveInLibrary}
              onCancel={() => navigate({ to: APP_ROUTES.MALZEMELER })}
            />
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* TÜR SEÇİMİ (Ana Dallanma) */}
            <TurSecimiCard
              formData={formData}
              setFormData={setFormData}
              selectedType={selectedType}
            />

            {/* KİMLİK & TEMEL BİLGİLER */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Barcode className="text-blue-600 dark:text-blue-400" size={20} />
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">
                    Kimlik & Sınıflandırma
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {selectedType === 'Mal'
                      ? '📦 Mal Kalemi'
                      : selectedType === 'Hizmet'
                        ? '💼 Hizmet Kalemi'
                        : '🏗️ Yapım Kalemi'}
                  </span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol Sütun: Barkod, Ad, Fiyat Dönemi */}
                <KimlikCard
                  formData={formData}
                  setFormData={setFormData}
                  selectedType={selectedType}
                  isEditingBarkod={isEditingBarkod}
                  setIsEditingBarkod={setIsEditingBarkod}
                  barkodError={barkodError}
                  setBarkodError={setBarkodError}
                  checkBarkod={checkBarkod}
                />

                {/* Sağ Sütun: Tür Bazlı Kodlar & AI */}
                <TurOzelAlanlarCard
                  formData={formData}
                  setFormData={setFormData}
                  selectedType={selectedType}
                  setIsOkasModalOpen={setIsOkasModalOpen}
                  setIsTasinirModalOpen={setIsTasinirModalOpen}
                  setIsPozModalOpen={setIsPozModalOpen}
                  isAiGeneratingOkas={isAiGeneratingOkas}
                  handleAiOkasSuggest={handleAiOkasSuggest}
                />
              </div>
            </div>

            {/* ÖLÇÜ BİRİMİ, GÖRSEL VE DETAYLAR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sol: Birim & Menşei & Notlar (2 Sütun Genişlik) */}
              <TeknikDetayCard
                formData={formData}
                setFormData={setFormData}
                selectedType={selectedType}
                birimler={birimler}
              />

              {/* Sağ: Kalem Görseli & Fotoğraf */}
              <GorselUploadCard
                formData={formData}
                setFormData={setFormData}
                imageInputMode={imageInputMode}
                setImageInputMode={setImageInputMode}
                customImageUrl={customImageUrl}
                setCustomImageUrl={setCustomImageUrl}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                handleApplyImageUrl={handleApplyImageUrl}
                handleImageDrop={handleImageDrop}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modallar */}
      <MalzemeModals
        formData={formData}
        setFormData={setFormData}
        isOkasModalOpen={isOkasModalOpen}
        setIsOkasModalOpen={setIsOkasModalOpen}
        okasSearch={okasSearch}
        setOkasSearch={setOkasSearch}
        filteredOkas={filteredOkas}
        isOkasLoading={isOkasLoading}
        isTasinirModalOpen={isTasinirModalOpen}
        setIsTasinirModalOpen={setIsTasinirModalOpen}
        tasinirSearch={tasinirSearch}
        setTasinirSearch={setTasinirSearch}
        filteredTasinir={filteredTasinir}
        isTasinirLoading={isTasinirLoading}
        isPozModalOpen={isPozModalOpen}
        setIsPozModalOpen={setIsPozModalOpen}
        handleSelectPoz={handleSelectPoz}
      />
    </div>
  )
}
