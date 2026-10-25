import React from 'react'
import { Coins, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { ExcelActions } from '../../../components/ui/ExcelActions'

interface ButceKodHeaderProps {
  onOpenAdd: () => void
}

export const ButceKodHeader: React.FC<ButceKodHeaderProps> = ({ onOpenAdd }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
          <Coins className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            Bütçe Kodları & Ekonomik Sınıflandırma
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-200 dark:border-amber-800">
              4 Düzey Analitik Bütçe
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Doğrudan temin ve ihale süreçlerinde kullanılan bütçe tertipleri, analitik harcama
            kalemleri ve muhasebe hesap kodları.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <ExcelActions
          tableName="TANIM_ButceKod"
          title="Bütçe Kodları"
          customFileName="Analitik_Butce_Kodlari"
        />
        <Button
          onClick={onOpenAdd}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-sm shadow-amber-600/20 rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Yeni Bütçe Kodu Ekle
        </Button>
      </div>
    </div>
  )
}
