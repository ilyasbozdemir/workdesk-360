import React from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { SubScreen } from '../SubScreen'
import { TeklifMatrisi } from './DosyaAsamalari/components/TeklifMatrisi'
import { usePiyasaFiyatArastirmasiLogic } from './DosyaAsamalari/hooks/usePiyasaFiyatArastirmasi'

export function YaklasikMaliyetCetveli(): React.JSX.Element {
  const logic = usePiyasaFiyatArastirmasiLogic()

  return (
    <SubScreen
      title="Yaklaşık Maliyet Hesap Cetveli"
      icon={FileSpreadsheet}
      description="İstekli tedarikçilerin fiyat tekliflerini girin ve piyasa yaklaşık maliyetini hesaplayarak dosyaya aktarın."
    >
      <div className="flex flex-col gap-5">
        {logic.loading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold">Teklifler ve maliyet verileri yükleniyor...</span>
          </div>
        ) : (
          <TeklifMatrisi
            invitedFirms={logic.invitedFirms}
            items={logic.items}
            bids={logic.bids}
            getEstimatedCostTotal={logic.getEstimatedCostTotal}
            getLowestBidInfo={logic.getLowestBidInfo}
            getAverageBid={logic.getAverageBid}
            handlePriceChange={logic.handlePriceChange}
            hesaplamaEsasi={logic.hesaplamaEsasi}
            onSetHesaplamaEsasi={logic.setHesaplamaEsasi}
            handleSaveToDosya={logic.handleSaveToDosya}
            showSaveButton={true}
          />
        )}
      </div>
    </SubScreen>
  )
}
