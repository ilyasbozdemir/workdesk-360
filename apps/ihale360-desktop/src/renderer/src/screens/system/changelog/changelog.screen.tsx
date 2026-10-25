import React, { useState, useEffect } from 'react'
import {
  Megaphone,
  History,
  Compass,
  ArrowRight,
  Lightbulb,
  Sparkles,
  FileArchive
} from 'lucide-react'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { Link } from '@tanstack/react-router'

export default function ChangelogScreen(): React.JSX.Element {
  const { activeFilePath, fileName } = useWorkspaceStore()
  const [changelog, setChangelog] = useState<
    { version: string; notes: string; schema_max: number }[]
  >([])
  const [backlog, setBacklog] = useState<{ title: string; items: string[] }[]>([])
  const [activeTab, setActiveTab] = useState<'changelog' | 'roadmap'>('changelog')

  useEffect(() => {
    window.electron?.ipcRenderer
      .invoke('get-changelog')
      .then((res) => {
        if (res && res.success) {
          setChangelog(res.changelog || [])
          setBacklog(res.backlog || [])
        } else if (Array.isArray(res)) {
          setChangelog(res)
        }
      })
      .catch((e) => console.error(e))
  }, [])

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full">
      {/* Üst Başlık Bölümü */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-850 dark:text-slate-100">
            <Megaphone className="w-8 h-8 text-indigo-500" />
            Güncellemeler & Yol Haritası
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            TEMİN 360 uygulamasına gelen yenilikleri, düzeltmeleri takip edin ve planlanan gelecek
            özellikleri inceleyin.
          </p>
        </div>

        {/* Aktif Çalışma Dosyası Entegrasyon Kartı */}
        {activeFilePath && (
          <Link
            to="/dosya"
            className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all group shrink-0"
          >
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <FileArchive className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-450">
                Aktif Çalışma Alanı
              </div>
              <div
                className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[150px] truncate"
                title={fileName}
              >
                {fileName || 'Detayları Gör'}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform ml-2" />
          </Link>
        )}
      </div>

      {/* Sekme Seçiciler */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('changelog')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'changelog'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Sürüm Notları ({changelog.length})
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'roadmap'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          Yol Haritası & Düşünceler (
          {backlog.reduce((acc, curr) => acc + (curr.items?.length || 0), 0)})
        </button>
      </div>

      {/* İçerik Alanı */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6">
        {activeTab === 'changelog' ? (
          <div className="space-y-8">
            {changelog.map((log, index) => (
              <div key={index} className="relative pl-8 animate-in fade-in duration-300">
                <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-950/40"></div>
                {index !== changelog.length - 1 && (
                  <div className="absolute left-[5px] top-5 bottom-[-32px] w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                )}
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-3">
                  Versiyon {log.version}
                  {index === 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 font-bold uppercase tracking-wider">
                      En Yeni Sürüm
                    </span>
                  )}
                </h4>
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-850/30 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-inner">
                  {log.notes}
                </div>
              </div>
            ))}

            {changelog.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 py-12 text-sm flex flex-col items-center">
                <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                Henüz bir sürüm notu bulunmuyor.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {backlog.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.items.map((item, itemIdx) => {
                    const boldMatch = item.match(/^\*\*(.*?)\*\*:(.*)$/)
                    const title = boldMatch ? boldMatch[1] : ''
                    const desc = boldMatch ? boldMatch[2] : item

                    return (
                      <div
                        key={itemIdx}
                        className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:shadow-md transition-all flex gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <div>
                          {title ? (
                            <>
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                                {title}
                              </h4>
                              <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                                {desc.trim()}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                              {item}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded">
                              Planlandı
                            </span>
                            <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">
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
              <div className="text-center text-slate-500 dark:text-slate-400 py-12 text-sm flex flex-col items-center">
                <Compass className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4 animate-pulse" />
                Planlanan herhangi bir gelecek sürüm düşüncesi bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
