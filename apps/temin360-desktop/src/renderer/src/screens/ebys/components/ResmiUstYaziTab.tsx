import React from 'react'
import { GitCommit, ShieldCheck } from 'lucide-react'
import { useResmiUstYazi } from './resmi-ust-yazi/useResmiUstYazi'
import { UstYaziFormPanel } from './resmi-ust-yazi/UstYaziFormPanel'
import { UstYaziA4Preview } from './resmi-ust-yazi/UstYaziA4Preview'
import { UstYaziRotaAkisi } from './resmi-ust-yazi/UstYaziRotaAkisi'

export interface ResmiUstYaziTabProps {
  dosya?: any
  dosyaContext?: any
  kalemler?: any[]
  firmalar?: any[]
  komisyonlar?: any[]
}

export function ResmiUstYaziTab(props: ResmiUstYaziTabProps = {}): React.JSX.Element {
  const ustYazi = useResmiUstYazi(props)
  const { activeRightTab, setActiveRightTab } = ustYazi

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 shadow-xl">
      {/* SOL: DÜZENLEME & FORM PANELİ */}
      <UstYaziFormPanel {...ustYazi} />

      {/* SAĞ: ÖNİZLEME & ROTA AKIŞI GÖRÜNÜMÜ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Görünüm Sekmeleri */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex bg-slate-200/70 dark:bg-slate-950 p-1 rounded-xl border border-slate-300/80 dark:border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveRightTab('onizleme')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeRightTab === 'onizleme'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Yazı Önizleme (A4)
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab('rota')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRightTab === 'rota'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitCommit size={14} />
              <span>Rota (Onay &amp; Paraf Akışı)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Resmî Yazışma Yönetmeliği Esaslarına Uygun</span>
          </div>
        </div>

        {/* TAB 1: A4 ÖNİZLEME */}
        {activeRightTab === 'onizleme' && <UstYaziA4Preview {...ustYazi} />}

        {/* TAB 2: ROTA & ONAY AKIŞI */}
        {activeRightTab === 'rota' && <UstYaziRotaAkisi {...ustYazi} />}
      </main>
    </div>
  )
}
