import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PricesSummaryDashboard } from '../PricesSummaryDashboard'
import { KazananKararPaneli } from './KazananKararPaneli'

interface Step2FiyatlarVeKazananProps {
  activeWinnerFirma: any
  lowestBidFirm: any
  invitedFirms: any[]
  items: any[]
  bids: any
  manualWinnerFirmaId?: number | null
  handleSetWinnerFirma?: (firmaMasterId: number | null) => Promise<void>
  setIsFormOpen: (val: boolean) => void
  setActiveFormTab: (tab: 'firms' | 'matrix') => void
  setCurrentStep: (step: 1 | 2 | 3) => void
  hesaplamaEsasi?: string
  setHesaplamaEsasi?: (val: string) => Promise<void> | void
}

export function Step2FiyatlarVeKazanan({
  activeWinnerFirma,
  lowestBidFirm,
  invitedFirms,
  items,
  bids,
  manualWinnerFirmaId,
  handleSetWinnerFirma,
  setIsFormOpen,
  setActiveFormTab,
  setCurrentStep,
  hesaplamaEsasi,
  setHesaplamaEsasi
}: Step2FiyatlarVeKazananProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Kazanan İstekli / Karar Paneli */}
      <KazananKararPaneli
        activeWinnerFirma={activeWinnerFirma}
        lowestBidFirm={lowestBidFirm}
        handleSetWinnerFirma={handleSetWinnerFirma}
        setIsFormOpen={setIsFormOpen}
        setActiveFormTab={setActiveFormTab}
        hesaplamaEsasi={hesaplamaEsasi}
        setHesaplamaEsasi={setHesaplamaEsasi}
      />

      {/* Fiyat Matrisi Dashboard */}
      <PricesSummaryDashboard
        invitedFirms={invitedFirms}
        items={items}
        bids={bids}
        manualWinnerFirmaId={manualWinnerFirmaId}
        handleSetWinnerFirma={handleSetWinnerFirma}
        hesaplamaEsasi={hesaplamaEsasi}
        onManageFirmsClick={() => {
          setCurrentStep(1)
        }}
      />

      {/* 2. Adım Alt İlerleme Çubuğu - Sabit / Sticky Dock */}
      <div className="sticky bottom-3 z-30 flex items-center justify-between p-3.5 px-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 ring-1 ring-slate-900/5 dark:ring-white/5">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>1. Adıma Dön (İstekliler & Dağıtım)</span>
        </button>

        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-help"
          title="2. Adım: İhtiyaç kalemlerinin birim fiyatları girildikçe teklif tutarı 0,00 ₺'nin üzerine çıkan firmalar otomatik 'Teklif Veren Firma' statüsüne geçer."
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black">2</span>
          <span>Fiyatlar & Kazanan Tespiti</span>
          {lowestBidFirm && (
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              En Uygun: {lowestBidFirm.firma_adi}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer border-0 active:scale-95"
        >
          <span>3. Adım: Tutanak & Maliyeti Üret</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
