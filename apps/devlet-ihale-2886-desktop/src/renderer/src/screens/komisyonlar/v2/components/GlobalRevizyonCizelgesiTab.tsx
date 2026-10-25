import React from 'react'
import { ExternalLink, History, Search } from 'lucide-react'
import { Input } from '../../../../components/ui/Input'
import type { GlobalHistoryItem } from '../types'

interface GlobalRevizyonCizelgesiTabProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  isGlobalHistoryLoading: boolean
  filteredHistoryList: GlobalHistoryItem[]
  onOpenDosyaDetail: (dosyaId: number, dosyaNo: string, isTanimi: string) => void
}

export const GlobalRevizyonCizelgesiTab: React.FC<GlobalRevizyonCizelgesiTabProps> = ({
  searchTerm,
  onSearchChange,
  isGlobalHistoryLoading,
  filteredHistoryList,
  onOpenDosyaDetail
}) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Tüm Dosyaların Komisyon Revizyon &amp; Snapshot Çizelgesi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tüm doğrudan temin dosyalarında yapılan komisyon değişiklikleri ve kopyalama işlemleri
            anlık snapshot kaydı olarak burada arşivlenir.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Geçmiş kayıtlarda ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
        </div>
      </div>

      {isGlobalHistoryLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">
          Revizyon kayıtları yükleniyor...
        </div>
      ) : filteredHistoryList.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-semibold">Kayıtlı revizyon snapshot&apos;ı bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistoryList.map((log) => {
            let parsedSnapshot: any[] = []
            try {
              parsedSnapshot = JSON.parse(log.snapshot_data)
            } catch {
              parsedSnapshot = []
            }

            return (
              <div
                key={log.id}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 transition-colors space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                      {log.dosya_no}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.is_tanimi}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {log.komisyon_turu}
                    </span>
                    <span className="text-slate-500 font-semibold">• {log.islem_turu}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenDosyaDetail(log.temin_dosya_id, log.dosya_no, log.is_tanimi)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <span>Dosyayı Aç</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Snapshot Üye Dağılımı */}
                {Array.isArray(parsedSnapshot) && parsedSnapshot.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsedSnapshot.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                      >
                        <span className="font-bold">{m.ad_soyad}</span>
                        {m.gorev && <span className="text-[10px] text-slate-400">({m.gorev})</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
