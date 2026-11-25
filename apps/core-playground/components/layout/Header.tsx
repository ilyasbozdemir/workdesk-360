'use client'

import React from 'react'
import { useTargetApp, APP_PROFILES, TargetApp } from './AppContext'
import { Sparkles, Terminal, Layers, RefreshCw, CheckCircle2 } from 'lucide-react'

export const Header: React.FC = () => {
  const { targetApp, profile, setTargetApp } = useTargetApp()

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
      {/* Sol: Başlık & Durum */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Core Playground
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v1.0 (Live Core)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            WorkDesk 360 Monorepo Çekirdek Paket Laboratuvarı
          </p>
        </div>
      </div>

      {/* Orta/Sağ: HEDEF UYGULAMA SEÇİCİ (TARGET APP SELECTOR) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Layers className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Hedef Uygulama:</span>
          </div>

          <select
            value={targetApp}
            onChange={(e) => setTargetApp(e.target.value as TargetApp)}
            className="text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs transition-all"
          >
            {Object.values(APP_PROFILES).map((item) => (
              <option key={item.id} value={item.id}>
                {item.icon} {item.name}
              </option>
            ))}
          </select>

          <div
            className="hidden lg:flex items-center gap-1.5 px-2 text-[11px] text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700"
            title={`Motor: ${profile.dbEngine} | Ortam: ${profile.runtime}`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
            <span className="truncate max-w-[170px]">{profile.dbEngine}</span>
          </div>
        </div>

        {/* Canlı Bağlantı Rozeti */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-mono text-[11px]">@worksuite-360/core</span>
        </div>
      </div>
    </header>
  )
}
