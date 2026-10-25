import React, { useState, useEffect } from 'react'
import { PlaceholderYonetimi } from './components/PlaceholderYonetimi'
import SablonlarScreen from './index.screen'
import { Key, FileText, Puzzle } from 'lucide-react'
import { useSearch } from '@tanstack/react-router'
import { cn } from '../../utils/cn'

export default function DegiskenlerScreen(): React.JSX.Element {
  const searchParams: { tab?: string } = useSearch({ strict: false })
  const [activeTab, setActiveTab] = useState<'sablons' | 'placeholders'>(
    searchParams?.tab === 'sablons' ? 'sablons' : 'placeholders'
  )

  useEffect(() => {
    if (searchParams?.tab === 'sablons') {
      setActiveTab('sablons')
    } else if (searchParams?.tab === 'placeholders') {
      setActiveTab('placeholders')
    }
  }, [searchParams?.tab])

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300 p-6 md:p-8">
      {/* Extension Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 p-6 mb-6 text-white border border-indigo-500/20 shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                EXT-DT-SABLON
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🔌 EKLENTİ
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                BETA v1.0.0
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Puzzle className="w-6 h-6 text-indigo-400" />
              Doğrudan Temin Özel Belge & Dinamik Yer Tutucu Stüdyosu
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
              4734 Sayılı Kanun Madde 22 doğrudan temin aşamalarına kurumsal ek evraklar
              bağlayabilir, dinamik yer tutucuları (&#123;&#123;makam&#125;&#125;,
              &#123;&#123;teslim_adresi&#125;&#125;, &#123;&#123;ozel_not&#125;&#125; vb.)
              veritabanı alanlarıyla canlı eşleştirebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('placeholders')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'placeholders'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <Key className="w-4 h-4" />
          Değişkenler & Doğrudan Temin Bağlamaları
        </button>
        <button
          onClick={() => setActiveTab('sablons')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'sablons'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <FileText className="w-4 h-4" />
          Şablon Kütüphanesi
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'placeholders' && <PlaceholderYonetimi />}
        {activeTab === 'sablons' && <SablonlarScreen />}
      </div>
    </div>
  )
}
