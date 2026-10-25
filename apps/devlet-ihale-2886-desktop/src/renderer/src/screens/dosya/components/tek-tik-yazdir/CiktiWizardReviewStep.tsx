import React, { useMemo } from 'react'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'
import { getEvrakWarnings, EvrakWarning } from './getEvrakWarnings'
import { CheckCircle2, AlertTriangle, Info, ArrowRight, ShieldCheck } from 'lucide-react'

interface CiktiWizardReviewStepProps {
  selectedSablons: Sablon[]
  documentDataMap: Record<string, Record<string, unknown>>
  onProceed: () => void
  onBack: () => void
}

export function CiktiWizardReviewStep({
  selectedSablons,
  documentDataMap,
  onProceed,
  onBack
}: CiktiWizardReviewStepProps): React.JSX.Element {
  // Tüm seçili belgeler için uyarıları topla
  const docWarningsMap = useMemo(() => {
    const map = new Map<number, { sablon: Sablon; warnings: EvrakWarning[] }>()
    for (const s of selectedSablons) {
      const templateId = (s.dosya_adi || '').replace(/\.html$/, '').trim()
      const veri = documentDataMap[templateId] || {}
      const wList = getEvrakWarnings(s, veri)
      map.set(s.id, { sablon: s, warnings: wList })
    }
    return map
  }, [selectedSablons, documentDataMap])

  const totalWarnings = Array.from(docWarningsMap.values()).reduce(
    (sum, item) => sum + item.warnings.length,
    0
  )

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar bg-slate-900/60 text-slate-100">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* HEADER */}
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
              4
            </span>
            Ön Kontrol & Evrak Uyarıları
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seçili belgelerin muhatap, tarih, dağıtım ve rota alanları taranmıştır. Buradaki
            uyarılar bilgilendirme amaçlıdır; çıktıyı engellemez.
          </p>
        </div>

        {/* STATUS BANNER */}
        {totalWarnings === 0 ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">Tüm Evrak Kontrolleri Başarılı</h4>
              <p className="text-xs text-emerald-400/80">
                Seçili {selectedSablons.length} belgede herhangi bir eksiklik veya çakışma tespit
                edilmedi. Doğrudan çıktı alabilirsiniz.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                {totalWarnings} Adet Bilgilendirme / İkaz Tespit Edildi
              </h4>
              <p className="text-xs text-amber-400/80">
                Bu ikazlar yazdırma işlemini engellemez. Dilerseniz önceki adımlardan eksik
                bilgileri tamamlayabilir veya doğrudan devam edebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* DOCUMENT REVIEWS */}
        <div className="space-y-3">
          {selectedSablons.map((sablon) => {
            const entry = docWarningsMap.get(sablon.id)
            const warnings = entry?.warnings || []

            return (
              <div
                key={sablon.id}
                className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {warnings.length === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-200">{sablon.ad}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{sablon.dosya_adi}</span>
                </div>

                {warnings.length === 0 ? (
                  <p className="text-[11px] text-emerald-400/90 pl-6">
                    ✓ Tüm alanlar ve imza rotası tanımlı.
                  </p>
                ) : (
                  <div className="pl-6 space-y-1.5 pt-1">
                    {warnings.map((w, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl text-xs flex items-start gap-2 ${
                          w.severity === 'warning'
                            ? 'bg-amber-950/30 border border-amber-800/40 text-amber-200'
                            : 'bg-blue-950/30 border border-blue-800/40 text-blue-200'
                        }`}
                      >
                        {w.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-[11px] leading-relaxed">{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* BOTTOM NAV */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            ← 3. Görünürlük Adımına Dön
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <span>5. Çıktı & Yazdır Adımına Geç</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
