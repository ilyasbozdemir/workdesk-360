import React from 'react'
import { AlertCircle } from 'lucide-react'
import { TeklifMatrisi } from './TeklifMatrisi'

interface PiyasaFiyatArastirmasiMatrixTabProps {
  invitedFirms: any[]
  items: any[]
  bids: any
  getEstimatedCostTotal: () => number
  getLowestBidInfo: (itemId: number) => any
  getAverageBid: (itemId: number) => number
  handlePriceChange: (kalemId: number, teminFirmaId: number, priceStr: string) => Promise<void>
}

export function PiyasaFiyatArastirmasiMatrixTab({
  invitedFirms,
  items,
  bids,
  getEstimatedCostTotal,
  getLowestBidInfo,
  getAverageBid,
  handlePriceChange
}: PiyasaFiyatArastirmasiMatrixTabProps): React.JSX.Element {
  return (
    <div className="animate-in fade-in duration-200">
      {invitedFirms.length > 0 && items.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 rounded-xl p-4 flex items-start gap-3">
            <div className="mt-0.5">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-450"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-blue-900 dark:text-blue-200">
                Fiyat ve Teklif Veri Girişi
              </h4>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                Firmalara dağıtılan <strong>teklif formlarından</strong> gelen fiyatları aşağıdaki
                matrise girebilirsiniz. Girdiğiniz veriler otomatik hesaplanarak Yaklaşık Maliyet
                Cetveli ve Piyasa Fiyat Araştırma Tutanağı'nı oluşturmanızı sağlar.
              </p>
            </div>
          </div>
          <TeklifMatrisi
            invitedFirms={invitedFirms}
            items={items}
            bids={bids}
            getEstimatedCostTotal={getEstimatedCostTotal}
            getLowestBidInfo={getLowestBidInfo}
            getAverageBid={getAverageBid}
            handlePriceChange={handlePriceChange}
          />
        </div>
      ) : invitedFirms.length > 0 && items.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">
              İhtiyaç Kalemi Bulunamadı
            </h4>
            <p className="text-xs text-amber-600 dark:text-amber-500/90 mt-1">
              Teklif fiyat giriş tablosunu görüntülemek için bu dosyaya ait ihtiyaç kalemlerinin
              girilmiş olması gerekir. Lütfen ilgili adımda ihtiyaç listesini tanımlayın.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-amber-800 dark:text-amber-400">
              Davet Edilen İstekli Firma Yok
            </h4>
            <p className="text-xs text-amber-600 dark:text-amber-550 mt-1">
              Fiyat girişi yapabilmek için lütfen önce <strong>İstekli Firmalar</strong> sekmesinden
              en az 1 firma seçin veya ekleyin.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
