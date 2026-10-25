import React, { useEffect, useState } from 'react'
import { ChevronDown, Key } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { useSablonlar } from '../sablonlar.hooks'
import { subPagesMapping } from '../../../constants/surecler'
import { defaultTemplatesByPath } from './defaultTemplates'
import { InlineSablonBaglayici } from './InlineSablonBaglayici'
import { SurecSatiri } from './SurecSatiri'

export function PlaceholderYonetimi(): React.JSX.Element {
  const { data: sablonlar = [] } = useSablonlar()
  const [allSettings, setAllSettings] = useState<Record<string, string>>({})
  const [editingProcess, setEditingProcess] = useState<(typeof subPagesMapping)[0] | null>(null)
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true
  })

  const toggleStage = (stageNum: number) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageNum]: !prev[stageNum]
    }))
  }

  const loadAllSettings = async () => {
    try {
      const res = await (window as any).electron.ipcRenderer.invoke('db:get-settings')
      if (res) setAllSettings(res)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadAllSettings()
  }, [])

  const getBoundSablonAd = (processPath: string): string | undefined => {
    const sablonId = allSettings[`MAPPING_${processPath}_SABLON_ID`]
    if (sablonId) {
      return sablonlar.find((s) => s.id.toString() === sablonId)?.ad
    }
    const defaultDosyaAdi = defaultTemplatesByPath[processPath]
    if (defaultDosyaAdi) {
      return sablonlar.find((s) => s.dosya_adi === defaultDosyaAdi)?.ad
    }
    return undefined
  }

  const stageGroups = React.useMemo(() => {
    const groups: Record<number, typeof subPagesMapping> = {}
    for (const p of subPagesMapping) {
      if (!groups[p.stage]) groups[p.stage] = []
      groups[p.stage].push(p)
    }
    return groups
  }, [])

  const stageLabels: Record<number, string> = {
    1: 'İhtiyaç Tespiti ve Başlangıç',
    2: 'Fiyat Araştırma ve Maliyet',
    3: 'Onay ve İhale Süreci',
    4: 'Teslim ve Harcama'
  }

  if (editingProcess) {
    return (
      <InlineSablonBaglayici
        processPath={editingProcess.path}
        processName={editingProcess.name}
        stageNo={editingProcess.stage}
        sablonlar={sablonlar}
        onBack={() => {
          setEditingProcess(null)
          loadAllSettings()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between flex-none">
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-xl shrink-0 text-indigo-600 dark:text-indigo-450 border border-indigo-100/30 dark:border-indigo-800/20">
            <Key className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Şablon Süreç Yönetimi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Her süreç adımı için kullanılacak şablon belgesini ve veritabanı değişken
              eşleşmelerini bu ekrandan yönetebilirsiniz. Aşama listesini genişletmek veya gizlemek
              için aşama kartlarının başlıklarına tıklayabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* SÜREÇ LİSTESİ */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
        {Object.entries(stageGroups).map(([stage, processes]) => {
          const stageNum = Number(stage)
          const isExpanded = expandedStages[stageNum]
          const boundCount = processes.filter((p) => getBoundSablonAd(p.path)).length
          const totalCount = processes.length

          return (
            <div
              key={stage}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-none shrink-0 transition-all duration-300 hover:shadow-md"
            >
              {/* ACCORDION HEADER */}
              <div
                onClick={() => toggleStage(stageNum)}
                className={cn(
                  'px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors border-b',
                  isExpanded
                    ? 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-100 dark:border-slate-800/80'
                    : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-100/20 dark:border-indigo-850/10">
                    {stage}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {stageLabels[stageNum] || `Aşama ${stage}`}
                    </h3>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-0.5">
                      {totalCount} süreç adımı • {boundCount} bağlı şablon
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {boundCount === totalCount ? (
                    <span className="hidden sm:inline-flex text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-emerald-100/30 dark:border-emerald-900/20">
                      Hepsi Bağlı
                    </span>
                  ) : boundCount > 0 ? (
                    <span className="hidden sm:inline-flex text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md border border-indigo-100/30 dark:border-indigo-900/20">
                      Kısmi Bağlı
                    </span>
                  ) : null}
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-slate-400 transition-transform duration-300',
                      isExpanded ? 'transform rotate-180' : ''
                    )}
                  />
                </div>
              </div>

              {/* ACCORDION CONTENT */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
                  {processes.map((p) => (
                    <SurecSatiri
                      key={p.path}
                      process={p}
                      boundSablonAd={getBoundSablonAd(p.path)}
                      onEdit={() => setEditingProcess(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
