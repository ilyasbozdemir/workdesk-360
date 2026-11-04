import React from 'react'
import { Link } from '@tanstack/react-router'
import {
  Building,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileCheck,
  Layers
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

interface TakipGenelMetrikViewProps {
  activeDosya?: any
  dosyalar: any[]
  allBelgeler: any[]
  stages: any[]
  dbAsamalar: any[]
  formatCurrency: (val: number) => string
  setActiveDosyaId: (id: number) => void
  onGoToDetail?: () => void
  onOpenKanban?: () => void
}

export function TakipGenelMetrikView({
  activeDosya,
  dosyalar,
  allBelgeler,
  stages,
  dbAsamalar,
  formatCurrency,
  setActiveDosyaId,
  onGoToDetail,
  onOpenKanban
}: TakipGenelMetrikViewProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto my-6 w-full">
      {/* AKTİF DOSYA BANNER'I YA DA SEÇİM ÇAĞRISI */}
      {activeDosya ? (
        <div className="p-5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/40 dark:via-slate-900/40 dark:to-slate-900 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-[260px]">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                  Aktif Dosya: {activeDosya.temin_no || 'Dosya No Belirsiz'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 capitalize">
                  {activeDosya.tur} Alımı
                </span>
                {activeDosya.yaklasik_maliyet ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50">
                    {formatCurrency(activeDosya.yaklasik_maliyet)}
                  </span>
                ) : null}
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                {activeDosya.konu}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToDetail}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Bu Dosyanın Detayına Git</span>
            </button>
            <button
              type="button"
              onClick={onOpenKanban}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Dosya Değiştir (Kanban)
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-955/50 text-blue-600 dark:text-blue-450 flex items-center justify-center">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-105">
              Takip Edilecek Aktif Dosya Seçilmedi
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              Süreçlerin aşama aşama takibini ve evrak kontrolünü görmek için listeden bir dosya
              seçerek aktif hale getirin veya aşağıdaki genel durumu inceleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenKanban}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-5 rounded-xl flex items-center gap-2 mt-2 cursor-pointer"
          >
            <Building className="w-4 h-4" />
            Dosya Listesini Gör (Kanban)
          </button>
        </div>
      )}

      {/* GENEL METRİK KARTLARI */}
      {dosyalar.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Toplam Dosya */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {dosyalar.length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Toplam Dosya</p>
            </div>

            {/* İmza Bekleyen Belge */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {allBelgeler.filter((b) => !b.is_signed).length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">İmza Bekleyen Belge</p>
            </div>

            {/* İmzalanan Belge */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {allBelgeler.filter((b) => b.is_signed).length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">İmzalanan Belge</p>
            </div>

            {/* Toplam Yaklaşık Maliyet */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                  <Building className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {formatCurrency(dosyalar.reduce((sum, d) => sum + (d.yaklasik_maliyet || 0), 0))}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Toplam Yaklaşık Maliyet</p>
            </div>
          </div>

          {/* AŞAMA DAĞILIMI */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Aşama Dağılımı
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tüm dosyaların süreç aşamalarına göre dağılımı
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {stages.map((asama) => {
                const count = dosyalar.filter(
                  (d) => (d.durum_asama_id || 1) === asama.asama_sira
                ).length
                const pct = dosyalar.length > 0 ? (count / dosyalar.length) * 100 : 0
                return (
                  <div
                    key={asama.asama_sira}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-955/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {asama.asama_sira}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                          {asama.asama_adi}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 ml-2 shrink-0">
                          {count} dosya
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SON İŞLEM GÖREN DOSYALAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Son İşlem Gören Dosyalar
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Hızlıca çalışmaya devam etmek için bir dosyaya tıklayın
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {dosyalar.slice(0, 5).map((dosya) => {
                const stageInfo = dbAsamalar.find(
                  (a) => a.asama_sira === (dosya.durum_asama_id || 1)
                )
                const stageName = stageInfo?.asama_adi || 'Süreç Başlangıcı'

                return (
                  <div
                    key={dosya.id}
                    onClick={() => setActiveDosyaId(dosya.id)}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-blue-50 dark:bg-slate-900/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                        <FileCheck className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {dosya.konu || 'İsimsiz Temin'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono bg-slate-200/50 dark:bg-slate-700/50 px-1 rounded">
                            {dosya.temin_no}
                          </span>
                          <span>•</span>
                          <span>{dosya.tur} Alımı</span>
                          <span>•</span>
                          <span>{formatCurrency(dosya.yaklasik_maliyet || 0)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200/50 dark:bg-slate-850 text-slate-600 dark:text-slate-300">
                        {stageName}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
