import React from 'react'
import { Building2, ExternalLink, X, Sparkles, BookOpen, PlusCircle } from 'lucide-react'

interface PozSecimHeaderProps {
  activeTab: 'katalog' | 'ozel_poz'
  setActiveTab: (tab: 'katalog' | 'ozel_poz') => void
  katalogCount: number
  onOpenPozlarScreen: () => void
  onClose: () => void
}

export const PozSecimHeader: React.FC<PozSecimHeaderProps> = ({
  activeTab,
  setActiveTab,
  katalogCount,
  onOpenPozlarScreen,
  onClose
}) => {
  return (
    <>
      {/* Modal Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Birim Fiyat Pozları & Özel İmalat Seçimi
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                Yapım İşleri
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resmî Bakanlık/İdare Birim Fiyat Kitapları (ÇŞB, KGM, DSİ vb.) ve Kuruma Özel Pozlar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onOpenPozlarScreen}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Birim Fiyat Pozları yönetim ekranını tam sayfa aç"
          >
            <ExternalLink size={13} />
            <span>Birim Fiyat Pozları Ekranı</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Bilgilendirme Bannerı */}
      <div className="px-4 py-2.5 bg-linear-to-r from-amber-50 via-amber-50/50 to-orange-50 dark:from-amber-950/30 dark:via-slate-900 dark:to-orange-950/20 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
          <Sparkles size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Hızlı Poz Aktarımı:</strong> Bakanlık/idare pozlarını veya özel pozlarınızı{' '}
            <em>Birim Fiyat Pozları</em> ekranından (Excel veya tek tek) ekleyip bu havuzdan anında
            tek tıkla kaleminize aktarabilirsiniz.
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('katalog')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'katalog'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen size={16} />
          <span>Kayıtlı Poz Havuzu ({katalogCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ozel_poz')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ozel_poz'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <PlusCircle size={16} />
          <span>Kitapta Olmayan Özel Poz Tanımla (Analizli & Detaylı)</span>
        </button>
      </div>
    </>
  )
}
