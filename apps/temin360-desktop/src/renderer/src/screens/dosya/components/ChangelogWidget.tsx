import React from 'react'
import { Layers, Cpu, Compass, Sparkles, Lightbulb } from 'lucide-react'

interface ChangelogItem {
  version: string
  notes: string
  schema_max: number
}

interface BacklogSection {
  title: string
  items: string[]
}

interface ChangelogWidgetProps {
  activeHistoryTab: 'releases' | 'backlog'
  setActiveHistoryTab: (tab: 'releases' | 'backlog') => void
  changelog: ChangelogItem[]
  backlog: BacklogSection[]
  activeMeta: any
}

export const ChangelogWidget: React.FC<ChangelogWidgetProps> = ({
  activeHistoryTab,
  setActiveHistoryTab,
  changelog,
  backlog,
  activeMeta
}) => {
  return (
    <div className="border-t border-slate-200 dark:border-slate-800 pt-6 my-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider font-sans">
            Yol Haritası & Sürüm Notları
          </h3>
        </div>

        {/* Sekme Butonları */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-center shadow-inner">
          <button
            type="button"
            onClick={() => setActiveHistoryTab('releases')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeHistoryTab === 'releases'
                ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Sürüm Geçmişi ({changelog.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveHistoryTab('backlog')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeHistoryTab === 'backlog'
                ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Yol Haritası & Düşünceler (
            {backlog.reduce((acc, curr) => acc + (curr.items?.length || 0), 0)})
          </button>
        </div>
      </div>

      {activeHistoryTab === 'releases' ? (
        <div className="space-y-6 relative pl-2">
          {changelog.map((log, index) => {
            // Aktif dosyanın sürüm tespiti (schema_version tabanlı kesin tespit)
            const isActive = log.schema_max === activeMeta?.schema_version

            return (
              <div key={log.version} className="relative pl-6 animate-in fade-in duration-300">
                <div
                  className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${
                    isActive
                      ? 'bg-indigo-500 ring-indigo-50 dark:ring-indigo-950/40'
                      : 'bg-slate-300 ring-slate-50 dark:bg-slate-600 dark:ring-slate-800/50'
                  }`}
                />
                {index !== changelog.length - 1 && (
                  <div className="absolute left-[4px] top-4 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-slate-800" />
                )}

                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 font-sans">
                  Versiyon {log.version}
                  {isActive && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-1.5 py-0.5 rounded font-extrabold tracking-wider">
                      Aktif Dosya Sürümü
                    </span>
                  )}
                  {index === 0 && !isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 font-extrabold uppercase tracking-wider">
                      EN YENİ
                    </span>
                  )}
                </h4>

                <div
                  className={`text-[11px] leading-relaxed whitespace-pre-wrap p-4 rounded-2xl border ${
                    isActive
                      ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-100 shadow-sm'
                      : 'bg-slate-50/30 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {log.notes}
                </div>
              </div>
            )
          })}
          {changelog.length === 0 && (
            <div className="text-sm text-slate-500 italic">Sürüm geçmişi bulunamadı.</div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {backlog.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3 font-sans">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>{section.title}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {section.items.map((item, itemIdx) => {
                  const boldMatch = item.match(/^\*\*(.*?)\*\*:(.*)$/)
                  const title = boldMatch ? boldMatch[1] : ''
                  const desc = boldMatch ? boldMatch[2] : item

                  return (
                    <div
                      key={itemIdx}
                      className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex gap-3 group hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md transition-all duration-300"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Lightbulb className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        {title ? (
                          <>
                            <h5 className="text-[11px] font-bold text-slate-850 dark:text-slate-200">
                              {title}
                            </h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {desc.trim()}
                            </p>
                          </>
                        ) : (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {item}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[8px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded">
                            Planlandı
                          </span>
                          <span className="text-[8px] font-extrabold uppercase bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400 px-2 py-0.5 rounded">
                            Düşünce
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {backlog.length === 0 && (
            <div className="text-sm text-slate-500 italic">
              Planlanan gelecek sürüm düşüncesi bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
