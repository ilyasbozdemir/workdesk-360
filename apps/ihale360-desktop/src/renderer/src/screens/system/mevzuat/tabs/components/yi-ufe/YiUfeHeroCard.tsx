import React from 'react'
import { Sparkles, TrendingUp, Plus, ExternalLink } from 'lucide-react'

interface YiUfeHeroCardProps {
  latest: { yil: number; ay: number; ay_adi: string; endeks: number }
  aylikDegisim: number | null
  yillikDegisim: number | null
  formatNumber: (val: number | null | undefined, digits?: number) => string
  onOpenAddForMonth: () => void
  onOpenHakedisOrg: () => void
}

export const YiUfeHeroCard: React.FC<YiUfeHeroCardProps> = ({
  latest,
  aylikDegisim,
  yillikDegisim,
  formatNumber,
  onOpenAddForMonth,
  onOpenHakedisOrg
}) => {
  return (
    <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            TÜİK Resmi Fiyat Farkı & Değerleme Veritabanı
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-blue-400" />
            Yurt İçi Üretici Fiyat Endeksi (Yİ-ÜFE)
          </h2>
          <p className="text-xs text-indigo-200/80 max-w-2xl leading-relaxed">
            Kamu ihale mevzuatı (KİK Md. 53/Kararname), doğrudan temin piyasa fiyat araştırması ve
            hakediş fiyat farkı hesaplamalarında esas alınan 1994 - 2026 aylık endeks matrisi.
          </p>
        </div>

        {/* Hızlı Butonlar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddForMonth}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yeni Ay / Endeks Ekle
          </button>
          <button
            onClick={onOpenHakedisOrg}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
            title="hakedis.org/endeksler sayfasını harici tarayıcıda açar"
          >
            <ExternalLink className="w-4 h-4 text-amber-300" />
            hakedis.org Endeksler
          </button>
        </div>
      </div>

      {/* 4'LÜ KPI KARTLARI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/40">
        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="text-[11px] text-indigo-200 font-medium">Son Yayınlanan Endeks</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 font-mono">
            {formatNumber(latest.endeks)}
          </div>
          <div className="text-[10px] text-indigo-300/80 mt-0.5">
            {latest.ay_adi} {latest.yil}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="text-[11px] text-indigo-200 font-medium">Aylık Değişim (MoM)</div>
          <div
            className={`text-xl sm:text-2xl font-black mt-0.5 font-mono ${
              (aylikDegisim || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {aylikDegisim !== null ? `%${formatNumber(aylikDegisim)}` : '-'}
          </div>
          <div className="text-[10px] text-indigo-300/80 mt-0.5">Önceki aya göre</div>
        </div>

        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="text-[11px] text-indigo-200 font-medium">Yıllık Değişim (YoY)</div>
          <div
            className={`text-xl sm:text-2xl font-black mt-0.5 font-mono ${
              (yillikDegisim || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {yillikDegisim !== null ? `%${formatNumber(yillikDegisim)}` : '-'}
          </div>
          <div className="text-[10px] text-indigo-300/80 mt-0.5">Geçen yıl aynı aya göre</div>
        </div>

        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="text-[11px] text-indigo-200 font-medium">Kapsanan Veri Seti</div>
          <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">33 Yıl</div>
          <div className="text-[10px] text-indigo-300/80 mt-0.5">1994 - 2026 (392 Ay)</div>
        </div>
      </div>
    </div>
  )
}
