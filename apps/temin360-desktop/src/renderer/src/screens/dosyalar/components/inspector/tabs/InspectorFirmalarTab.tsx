import React from 'react'
import { formatMoney } from '../types'

interface InspectorFirmalarTabProps {
  firmalar: any[]
  kalemler?: any[]
  teklifler?: any[]
}

export const InspectorFirmalarTab: React.FC<InspectorFirmalarTabProps> = ({
  firmalar,
  kalemler = [],
  teklifler = []
}) => {
  if (firmalar.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs italic">
        Bu dosyaya teklif veren firma atanmamış.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {firmalar.map((f, idx) => {
          const isWinner = Boolean(f.kazandi_mi || f.kazanan_mi)
          const toplamTeklif = Number(f.toplam_teklif_tutari || f.teklif_toplami || 0)
          const firmaBids = teklifler.filter(
            (t: any) => Number(t.temin_firma_id) === Number(f.id)
          )

          return (
            <div
              key={f.id || idx}
              className={`p-3.5 rounded-xl border ${
                isWinner
                  ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                  {f.unvan || 'Firma'}
                </h4>
                {isWinner && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold shrink-0">
                    Kazanan Yüklenici
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                <div>
                  Yetkili: <strong>{f.yetkili || '-'}</strong>
                </div>
                <div>
                  VN: <strong>{f.vergi_no || '-'}</strong> | Tel:{' '}
                  <strong>{f.telefon || '-'}</strong>
                </div>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Toplam Teklif Tutarı (KDV Hariç):</span>
                <span className="font-mono font-black text-slate-850 dark:text-slate-100">
                  ₺{formatMoney(toplamTeklif)}
                </span>
              </div>

              {kalemler.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Kalem Bazlı Birim Fiyat Teklifleri
                  </span>
                  {kalemler.map((k: any) => {
                    const bid = firmaBids.find(
                      (b: any) => Number(b.temin_kalem_id) === Number(k.id)
                    )
                    const bf = Number(bid?.birim_fiyat || 0)
                    const miktar = Number(k.miktar) || 1
                    return (
                      <div
                        key={`${f.id}_${k.id}`}
                        className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        <span className="truncate pr-2">
                          {k.kalem_adi} ({miktar} {k.olcu_birimi || k.birim || 'Adet'})
                        </span>
                        <span className="font-mono font-semibold shrink-0">
                          ₺{formatMoney(bf)} / Top: ₺{formatMoney(bf * miktar)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
