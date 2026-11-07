import React, { useState } from 'react'
import { KikKotaModel, KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'
import { Scale, AlertTriangle, CheckCircle2, Info, Building } from 'lucide-react'

interface KikLimitTabProps {
  kikKota: KikKotaModel
  onUpdateIdareTuru: (turu: 'buyuksehir' | 'diger') => void
  activeRole: KamuRole
}

export const KikLimitTab: React.FC<KikLimitTabProps> = ({
  kikKota,
  onUpdateIdareTuru
}) => {
  return (
    <div className="space-y-6">
      {/* 1. İDARE TÜRÜ & EŞİK DEĞER SEÇİCİ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Scale size={16} className="text-purple-600" />
            4734 Sayılı Kanun Madde 22/d Parasal Sınır Seçici
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            İlgili yıl KİK Genel Tebliği uyarınca idare türüne göre yürürlükteki 22/d tek alım parasal limiti.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onUpdateIdareTuru('buyuksehir')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              kikKota.idareTuru === 'buyuksehir'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Büyükşehir Belediyesi Sınırlarında
          </button>
          <button
            onClick={() => onUpdateIdareTuru('diger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              kikKota.idareTuru === 'diger'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Diğer İdareler (Taşra / İl)
          </button>
        </div>
      </div>

      {/* 2. MADDE 62/I %10 BÜTÇE TAVANI & KİK İZİN RİSKİ PANELİ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 dark:from-purple-950/30 dark:to-slate-900 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-5">
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
            Tek Alım 22/d Limiti (KDV Hariç)
          </span>
          <div className="text-2xl font-mono font-extrabold text-purple-700 dark:text-purple-300 mt-2">
            {formatCurrency(kikKota.esikDeger)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Bu tutarın altındaki mal/hizmet alımları ilan yapılmaksızın doğrudan teminle gerçekleştirilebilir.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 dark:from-blue-950/30 dark:to-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
            Madde 62/ı %10 Tavanı (Yıllık Doğrudan Temin Sınırı)
          </span>
          <div className="text-2xl font-mono font-extrabold text-blue-700 dark:text-blue-300 mt-2">
            {formatCurrency(kikKota.yuzde10TavanTutari)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Toplam Mal/Hizmet ödeneğinin ({formatCurrency(kikKota.toplamMalHizmetButcesi)}) %10 yasal tavanı.
          </p>
        </div>

        <div
          className={`rounded-2xl p-5 border ${
            kikKota.kikIzinRiski
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                kikKota.kikIzinRiski
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              KİK İzin Uygunluğu (Md. 62/ı)
            </span>
            {kikKota.kikIzinRiski ? (
              <AlertTriangle className="text-rose-600" size={18} />
            ) : (
              <CheckCircle2 className="text-emerald-600" size={18} />
            )}
          </div>
          <div
            className={`text-2xl font-mono font-extrabold mt-2 ${
              kikKota.kikIzinRiski
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}
          >
            %{kikKota.kullanimOrani.toFixed(1)}
          </div>
          <p className="text-xs mt-2 font-medium text-slate-600 dark:text-slate-300">
            {kikKota.kikIzinRiski
              ? 'DİKKAT: %10 tavanı aşıldığında veya aşılmak üzere olduğunda Kamu İhale Kurulu uygunluk izni şarttır!'
              : 'Kota güvenli bölgede. Kalan doğrudan temin tavanı: ' + formatCurrency(kikKota.kalanKotaTutari)}
          </p>
        </div>
      </div>

      {/* 3. HARCAMA BİRİMLERİ BAZINDA 22/D KOTA DAĞILIMI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Building size={14} className="text-blue-500" />
          Harcama Birimleri Bazında Kota ve Gerçekleşme Dağılımı
        </h4>

        <div className="space-y-4">
          {kikKota.birimDagitimlari.map((b, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 dark:text-slate-200">{b.birimAdi}</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {formatCurrency(b.harcanan)} / {formatCurrency(b.tahsisEdilen)}{' '}
                  <strong className="text-purple-600 dark:text-purple-400 font-bold ml-1">
                    (%{b.oran.toFixed(1)})
                  </strong>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    b.oran > 80 ? 'bg-rose-500' : b.oran > 60 ? 'bg-amber-500' : 'bg-purple-600'
                  }`}
                  style={{ width: `${Math.min(100, b.oran)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

