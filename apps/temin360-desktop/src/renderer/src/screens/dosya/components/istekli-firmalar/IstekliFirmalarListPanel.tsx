import React from 'react'
import { Building2, Compass, Trash2 } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { TeminFirmaItem } from './useIstekliFirmalarLogic'

interface IstekliFirmalarListPanelProps {
  loading: boolean
  associatedFirms: TeminFirmaItem[]
  onSelectFirmaForQuery: (firma: TeminFirmaItem) => void
  onRemoveFirm: (teminFirmaId: number) => void
}

export function IstekliFirmalarListPanel({
  loading,
  associatedFirms,
  onSelectFirmaForQuery,
  onRemoveFirm
}: IstekliFirmalarListPanelProps): React.JSX.Element {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm min-h-[400px] flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
        Dosyaya Davet Edilen İstekli Listesi ({associatedFirms.length})
      </h3>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
          Yükleniyor...
        </div>
      ) : associatedFirms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-xs">
            Henüz bu doğrudan temin dosyası için herhangi bir istekli firma eklenmemiş.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[450px] custom-scrollbar pr-1">
          {associatedFirms.map((f) => (
            <div
              key={f.id}
              className="p-4 border border-slate-150 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all bg-slate-50/20 dark:bg-slate-950/20"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4
                    className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex-1"
                    title={f.unvan}
                  >
                    {f.unvan}
                  </h4>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold">
                      {f.teklif_durumu}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider',
                        f.yasaklilik_durumu === 'Yasaklı' &&
                          'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30',
                        f.yasaklilik_durumu === 'Temiz' &&
                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30',
                        (f.yasaklilik_durumu === 'Sorgulanmadı' || !f.yasaklilik_durumu) &&
                          'bg-slate-50 text-slate-500 dark:bg-slate-900/30 dark:text-slate-400 border border-slate-100 dark:border-slate-800'
                      )}
                    >
                      {f.yasaklilik_durumu === 'Yasaklı' && '🔴 Yasaklı'}
                      {f.yasaklilik_durumu === 'Temiz' && '🟢 Temiz'}
                      {(f.yasaklilik_durumu === 'Sorgulanmadı' || !f.yasaklilik_durumu) &&
                        '⚪ Sorgulanmadı'}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {f.telefon && <p>📞 Telefon: {f.telefon}</p>}
                  {f.email && <p>✉️ E-posta: {f.email}</p>}
                  {f.adres && (
                    <p className="truncate" title={f.adres}>
                      📍 Adres: {f.adres}
                    </p>
                  )}
                  <p>
                    🏦 Vergi: {f.vergi_dairesi || '-'} / {f.vergi_no || '-'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center">
                <div>
                  {f.yasaklilik_belgesi && (
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                      📄 Belge Yüklendi
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSelectFirmaForQuery(f)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Sorgula / Belge
                  </button>
                  <button
                    onClick={() => onRemoveFirm(f.temin_firma_id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/15 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Çıkar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
