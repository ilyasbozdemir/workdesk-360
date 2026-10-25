import React from 'react'
import { Sparkles } from 'lucide-react'

interface PozSecimFooterProps {
  activeTab: 'katalog' | 'ozel_poz'
  onClose: () => void
  onApplyOzelPoz: () => void
}

export const PozSecimFooter: React.FC<PozSecimFooterProps> = ({
  activeTab,
  onClose,
  onApplyOzelPoz
}) => {
  return (
    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3">
      <div className="text-[11px] text-slate-500">
        {activeTab === 'katalog' ? (
          <span>💡 Veritabanında kayıtlı pozlardan seçebilir veya yeni poz ekleyebilirsiniz.</span>
        ) : (
          <span>✨ Poz bilgileri form alanlarına ve yaklaşık maliyet cetvellerine aktarılır.</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Vazgeç
        </button>

        {activeTab === 'ozel_poz' && (
          <button
            type="button"
            onClick={onApplyOzelPoz}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} />
            Pozu Forma Aktar
          </button>
        )}
      </div>
    </div>
  )
}
