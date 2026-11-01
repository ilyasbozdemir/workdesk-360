import React from 'react'
import { GitCommit, Plus, Trash2 } from 'lucide-react'
import { TURLER } from './constants'
import { RotaAdimi } from './types'
import { useResmiUstYazi } from './useResmiUstYazi'

type RotaProps = ReturnType<typeof useResmiUstYazi>

export function UstYaziRotaAkisi(props: RotaProps): React.JSX.Element {
  const { rota, handleAddRotaStep, handleDeleteRotaStep, handleUpdateRotaStep } = props

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 custom-scrollbar max-w-4xl mx-auto w-full">
      {/* Akış Görselleştirici */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <GitCommit className="text-purple-600" />
          <span>Onay &amp; Paraf Rota Akış Şeması</span>
        </h3>

        <div className="relative pl-6 space-y-8 before:absolute before:left-9 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {rota.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 z-10 shadow-xs">
                {idx + 1}
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {step.a || 'İsimsiz Görevli'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      step.t === 'İmza'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : step.t === 'Hazırlayan'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    }`}
                  >
                    {step.t}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {step.u || 'Unvan belirtilmedi'}
                </div>
              </div>
            </div>
          ))}

          {/* Final Dosya Arşiv Düğümü */}
          <div className="relative flex items-start gap-4">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 z-10 shadow-xs">
              ✓
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex-1">
              <div className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                Dosyaya Kayıt &amp; Onaylı Arşiv
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Belge doğrudan temin dosyası içinde arşivlenir, paraflar ve imzalar tamamlanarak
                dosya çıktısı alınır (Harici EBYS gönderimi yapılmaz).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rota Adımlarını Düzenle */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rota Adımları Düzenleme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Süreçteki imza ve paraf yetkililerini sıralayın veya yeni adım ekleyin.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRotaStep}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Adım Ekle</span>
          </button>
        </div>

        <div className="space-y-3">
          {rota.map((step, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
            >
              <div className="sm:col-span-3">
                <select
                  value={step.t}
                  onChange={(e) => handleUpdateRotaStep(idx, 't', e.target.value as RotaAdimi['t'])}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                >
                  {TURLER.map((tur) => (
                    <option
                      key={tur}
                      value={tur}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1"
                    >
                      {tur}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={step.a}
                  onChange={(e) => handleUpdateRotaStep(idx, 'a', e.target.value)}
                  placeholder="Ad SOYAD"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={step.u}
                  onChange={(e) => handleUpdateRotaStep(idx, 'u', e.target.value)}
                  placeholder="Unvan (Örn: Şube Müdürü)"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="sm:col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleDeleteRotaStep(idx)}
                  disabled={rota.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                  title="Adımı Sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
