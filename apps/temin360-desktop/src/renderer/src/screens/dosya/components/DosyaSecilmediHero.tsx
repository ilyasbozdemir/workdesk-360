import React from 'react'
import { Link } from '@tanstack/react-router'
import { FileArchive, FileText, Plus, Gavel, Landmark } from 'lucide-react'

export const DosyaSecilmediHero: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center space-y-6">
      <div className="max-w-md mx-auto space-y-2">
        <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl mb-1">
          <FileArchive className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Aktif Çalışma Dosyası Seçilmedi
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Lütfen işlem yapmak istediğiniz süreç türünü seçin veya mevcut dosyalardan birini açın.
        </p>
      </div>

      {/* Doğrudan Temin vs Açık İhale Hızlı Seçim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
        {/* 1. Doğrudan Temin Kartı */}
        <div className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex flex-col justify-between gap-4 hover:border-blue-400 dark:hover:border-blue-700 transition-all shadow-sm group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                4734 Madde 22
              </span>
              <FileText className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Doğrudan Temin (22/d, 22/a)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Piyasa fiyat araştırması, yaklaşık maliyet, onay belgesi ve doğrudan alım süreçleri.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/40">
            <Link
              to="/dosyalar"
              className="flex-1 text-center py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Dosya Listesi
            </Link>
            <Link
              to="/dosyalar/yeni"
              className="py-2 px-3 rounded-xl border border-blue-300 dark:border-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Yeni
            </Link>
          </div>
        </div>

        {/* 2. Açık İhale & Hakediş Kartı */}
        <div className="p-5 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex flex-col justify-between gap-4 hover:border-purple-400 dark:hover:border-purple-700 transition-all shadow-sm group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                4734 Madde 19 / 21 & Hakediş
              </span>
              <Gavel className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Açık İhale & Hakediş Yönetimi
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Yapım ve hizmet işleri hakedişleri, pursantaj, fiyat farkı ve ihale sözleşme takibi.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/40">
            <Link
              to="/hakedis"
              className="flex-1 text-center py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Hakediş Merkezi
            </Link>
            <Link
              to="/harcama-merkezi"
              className="py-2 px-3 rounded-xl border border-purple-300 dark:border-purple-700 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold text-xs transition-all flex items-center gap-1"
            >
              <Landmark className="w-3.5 h-3.5" /> Modüller
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
