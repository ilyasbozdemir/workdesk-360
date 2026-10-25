import React from 'react'
import { RefreshCw, Download, Upload, Info } from 'lucide-react'

interface DteStatus {
  type: 'success' | 'error' | 'info'
  message: string
}

interface DteTransferProps {
  dteContentType: string
  setDteContentType: (val: any) => void
  handleExportDte: () => void
  handleImportDte: () => void
  dteLoading: boolean
  dteStatus: DteStatus | null
}

export const DteTransfer: React.FC<DteTransferProps> = ({
  dteContentType,
  setDteContentType,
  handleExportDte,
  handleImportDte,
  dteLoading,
  dteStatus
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-indigo-500" />
        Veri İçe/Dışa Aktar (.dte)
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-normal font-medium">
        Firma listesi ve malzeme/hizmet kütüphanesi kayıtlarını başka çalışma dosyalarıyla paylaşmak
        için <strong>.dte</strong> formatını kullanın.
      </p>

      <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 p-3.5 rounded-2xl">
        <div>
          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">
            Dışa Aktarılacak Veri Türü
          </label>
          <select
            value={dteContentType}
            onChange={(e) => setDteContentType(e.target.value)}
            title="Dışa Aktarılacak Veri Türü Seçin"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl py-1.5 px-3 text-slate-855 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="firms">Yalnızca Firmalar / Tedarikçiler</option>
            <option value="items">Yalnızca Malzeme &amp; Hizmet Kalemleri</option>
            <option value="birimler">Kurum Birimleri</option>
            <option value="personel">Personel Havuzu</option>
            <option value="mevzuat">Mevzuat ve Limitler</option>
            <option value="all">Tüm Tanımlı Veriler (Temel Tanımlar)</option>
            <option value="full_backup">Tam Veritabanı Yedeği (İhale/Loglar Dahil)</option>
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportDte}
            disabled={dteLoading}
            className="flex-1 bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 dark:text-slate-200 font-bold py-2 px-3 text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Dışa Aktar
          </button>

          <button
            type="button"
            onClick={handleImportDte}
            disabled={dteLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-2 px-3 text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-white/90" />
            İçe Aktar (.dte)
          </button>
        </div>
      </div>

      {dteStatus && (
        <div
          className={`p-3 rounded-xl border text-[11px] leading-relaxed animate-in slide-in-from-top-2 duration-200 ${
            dteStatus.type === 'success'
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-850 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450'
              : 'bg-rose-50/50 border-rose-200 text-rose-855 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-450'
          }`}
        >
          <div className="flex items-start gap-2">
            <Info
              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                dteStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            <span>{dteStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
