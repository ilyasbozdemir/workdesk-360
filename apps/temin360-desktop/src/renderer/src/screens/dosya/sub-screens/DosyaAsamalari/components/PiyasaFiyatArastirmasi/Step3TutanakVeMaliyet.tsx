import React from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { BelgeListesi } from '../BelgeListesi'
import { SonucBelgesiKartlari } from './SonucBelgesiKartlari'
import { Step3TutanakVeMaliyetProps } from './types'

export function Step3TutanakVeMaliyet({
  mappedBelgeler,
  docViewMode,
  changeDocViewMode,
  handleOpenSablonByDosyaAdi,
  handleNewDocument,
  handleOpenBelgePreview,
  handleOpenExternalForBelge,
  handleQuickPrintForBelge,
  handleDeleteDocument,
  setCurrentStep,
  setIsFormOpen,
  setActiveFormTab
}: Step3TutanakVeMaliyetProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 pb-16">
      {/* Hızlı Sonuç Belgesi Üretim Kartları */}
      <SonucBelgesiKartlari
        handleOpenSablonByDosyaAdi={handleOpenSablonByDosyaAdi}
        handleNewDocument={handleNewDocument}
      />

      {/* Hazırlanan Tutanaklar Listesi */}
      <BelgeListesi
        title="Dosyaya Kaydedilen Tutanak ve Cetveller"
        belgeler={mappedBelgeler}
        viewMode={docViewMode}
        onViewModeChange={changeDocViewMode}
        onView={handleOpenBelgePreview}
        onOpenExternal={handleOpenExternalForBelge}
        onPrint={handleQuickPrintForBelge}
        onEdit={(belge) => {
          const isMaliyet =
            belge.belgeTipiId === 'yaklasik-maliyet' ||
            belge.belgeAdi?.toLowerCase().includes('maliyet')
          handleNewDocument(isMaliyet ? 'maliyet' : 'tutanak')
        }}
        onDelete={(belge) => {
          if (handleDeleteDocument) {
            handleDeleteDocument(belge.id)
          }
        }}
        createButtonLabel="Yeni Tutanak / Cetvel Kaydet"
        onCreateBelge={(type) => {
          const mode = type === 'yaklasik-maliyet' ? 'maliyet' : 'tutanak'
          handleNewDocument(mode)
        }}
        onFiyatGir={() => {
          setCurrentStep(2)
          setIsFormOpen(true)
          setActiveFormTab('matrix')
        }}
      />

      {/* 3. Adım Alt İlerleme & Tamamlanma Çubuğu - Ekranın Altında Sabit / Fixed Floating Dock */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-3rem)] max-w-5xl flex items-center justify-between p-3.5 px-6 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 ring-1 ring-slate-900/5 dark:ring-white/5">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>2. Adıma Dön (Fiyatlar & Kazanan)</span>
        </button>
        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Piyasa Fiyat Araştırma Süreci Tamamlandı</span>
        </div>
      </div>
    </div>
  )
}
