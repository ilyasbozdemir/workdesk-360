import React from 'react'
import { Link } from '@tanstack/react-router'
import { Landmark, ShieldCheck, Plus, LayoutDashboard, Scale } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

interface HarcamaMerkeziHeroProps {
  institutionName: string
  activeLimit: number
  dosyalarCount: number
  formatCurrency: (val: number) => string
}

export const HarcamaMerkeziHero: React.FC<HarcamaMerkeziHeroProps> = ({
  institutionName,
  activeLimit,
  dosyalarCount,
  formatCurrency
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-2xl p-8 md:p-10">
      {/* Glow Effects */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5" /> TEMİN 360 • Harcama &amp; Hakediş Merkezi
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 4734 / 4735 / 5018 Sayılı Mevzuat Uyumlu
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              İller Bankası (İLBANK) Formatı
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
            Kamu Harcama, İhale, Malzeme ve Hakediş Yönetim Süiti
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Doğrudan teminden anahtar teslimi yapım işlerine, İller Bankası pursantajlı
            hakedişlerinden mal ve hizmet kabul evraklarına kadar tüm kamu mali süreçlerini tek
            ekrandan yönetin.
          </p>

          <div className="flex items-center gap-6 pt-2 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <strong className="text-white font-bold">{institutionName || 'Kurum Adı'}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              KİK 22/d Tekil Limit:
              <strong className="text-emerald-400 font-mono font-bold">
                {formatCurrency(activeLimit)}
              </strong>
            </span>
            <span>•</span>
            <span>
              Aktif Kayıtlı Dosya:
              <strong className="text-indigo-300 font-bold ml-1">{dosyalarCount} Adet</strong>
            </span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
          <Link to="/dosyalar/yeni" className="w-full">
            <Button className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Plus className="w-4 h-4" /> Yeni Harcama / Dosya Başlat
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-slate-700 hover:bg-slate-800 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" /> Klasik Panel
              </Button>
            </Link>
            <Link to="/mevzuat" className="flex-1">
              <Button
                variant="outline"
                className="w-full border-slate-700 hover:bg-slate-800 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" /> KİK Limitleri
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
