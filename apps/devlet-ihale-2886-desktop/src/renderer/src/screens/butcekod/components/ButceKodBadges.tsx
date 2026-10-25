import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { parseButceKod } from '../butcekod.hooks'

// Düzey Rozetleri & Renkleri
export function ButceDuzeyRozeti({ duzey }: { duzey: number }): React.JSX.Element {
  switch (duzey) {
    case 1:
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          I. Düzey (Grup)
        </span>
      )
    case 2:
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          II. Düzey (Sınıf)
        </span>
      )
    case 3:
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          III. Düzey (Ayrıntı)
        </span>
      )
    case 4:
    default:
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          IV. Düzey (Nihai Tertip)
        </span>
      )
  }
}

// Bütçe Türü Rozeti
export function ButceTuruRozeti({ tur }: { tur: string | null }): React.JSX.Element {
  const t = tur || 'Mal Alımı'
  if (t === 'Mal Alımı') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
        📦 Mal Alımı
      </span>
    )
  }
  if (t === 'Hizmet Alımı') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
        🛠️ Hizmet Alımı
      </span>
    )
  }
  if (t === 'Yapım İşi') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        🏗️ Yapım İşi
      </span>
    )
  }
  if (t === 'Danışmanlık') {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
        📑 Danışmanlık
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {t}
    </span>
  )
}

// 4 Düzey Görsel Önizleme Bileşeni
export function ButceDuzeyOnizleme({ kod }: { kod: string }): React.JSX.Element {
  const parsed = parseButceKod(kod)
  if (!kod.trim()) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-600 italic">
        Örnek format: 03.2.1.01 (Noktalarla 4 Düzey Kırılım)
      </div>
    )
  }

  const levels: { label: string; value: string | null; color: string; bg: string }[] = [
    {
      label: 'I. Düzey (Ana Grup)',
      value: parsed.duzey_1,
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
    },
    {
      label: 'II. Düzey (Sınıf)',
      value: parsed.duzey_2,
      color: 'text-indigo-700 dark:text-indigo-300',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
    },
    {
      label: 'III. Düzey (Ayrıntı)',
      value: parsed.duzey_3,
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
    },
    {
      label: 'IV. Düzey (Nihai Tertip)',
      value: parsed.duzey_4,
      color: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
    }
  ]

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-500" />
        Analitik Kırılım Ayrıştırması ({parsed.duzey}. Düzey Tespit Edildi):
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {levels.map((lvl, idx) => (
          <div
            key={idx}
            className={cn(
              'flex flex-col items-center px-2.5 py-1.5 rounded-xl border text-center transition-all',
              lvl.value
                ? lvl.bg
                : 'opacity-40 bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800'
            )}
          >
            <span
              className={cn(
                'text-sm font-bold font-mono',
                lvl.value ? lvl.color : 'text-slate-400'
              )}
            >
              {lvl.value || '-'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
              {lvl.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
