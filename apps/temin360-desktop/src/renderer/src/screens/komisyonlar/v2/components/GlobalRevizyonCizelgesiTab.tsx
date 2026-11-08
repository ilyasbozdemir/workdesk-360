import React from 'react'
import { CheckCircle2, ExternalLink, FileSpreadsheet, History, RotateCcw, Search, Zap } from 'lucide-react'
import { Input } from '../../../../components/ui/Input'
import type { GlobalHistoryItem } from '../types'

interface GlobalRevizyonCizelgesiTabProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  isGlobalHistoryLoading: boolean
  filteredHistoryList: GlobalHistoryItem[]
  onOpenDosyaDetail: (dosyaId: number, dosyaNo: string, isTanimi: string) => void
  onRestoreFis?: (historyId: number, mode: 'single' | 'all') => void
  isBulkApplying?: boolean
  bulkFeedback?: string | null
}

export const GlobalRevizyonCizelgesiTab: React.FC<GlobalRevizyonCizelgesiTabProps> = ({
  searchTerm,
  onSearchChange,
  isGlobalHistoryLoading,
  filteredHistoryList,
  onOpenDosyaDetail,
  onRestoreFis,
  isBulkApplying = false,
  bulkFeedback = null
}) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Fiş Bazlı Komisyon Hareketleri &amp; Revizyon Çizelgesi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tüm doğrudan temin dosyalarında yapılan komisyon atama, kopyalama ve toplu dağıtım
            işlemleri <strong>Atama Fişi</strong> olarak kaydedilir. İstediğiniz fişteki kadroyu tek
            tıkla dosyaya geri yükleyebilir veya tüm dosyalara uygulayabilirsiniz.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Fiş no, dosya no, personel veya işlem ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
        </div>
      </div>

      {bulkFeedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bulkFeedback}</span>
        </div>
      )}

      {isGlobalHistoryLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">
          Komisyon işlem fişleri yükleniyor...
        </div>
      ) : filteredHistoryList.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-semibold">Kayıtlı komisyon işlem fişi bulunamadı.</p>
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

            const fisNoFromSnapshot =
              Array.isArray(parsedSnapshot) && parsedSnapshot[0]?.fisNo
                ? parsedSnapshot[0].fisNo
                : null
            const fisBadgeText = fisNoFromSnapshot || `FİŞ #${String(log.id).padStart(4, '0')}`
            const cleanIslemTuru = String(log.islem_turu || 'Kadro Güncelleme').replace(
              /^\[FIS-[^\]]+\]\s*/i,
              ''
            )

            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-2xs space-y-3"
              >
                {/* Fiş Üst Başlığı */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2.5 border-b border-dashed border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                      🧾 {fisBadgeText}
                    </span>

                    <span className="font-mono font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                      {log.dosya_no}
                    </span>

                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.is_tanimi}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {log.komisyon_turu}
                    </span>

                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      • {cleanIslemTuru}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-slate-400 mr-1">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </span>

                    {onRestoreFis && Array.isArray(parsedSnapshot) && parsedSnapshot.length > 0 && (
                      <>
                        <button
                          type="button"
                          disabled={isBulkApplying}
                          onClick={() => onRestoreFis(log.id, 'single')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer disabled:opacity-50"
                          title="Bu fişteki komisyon üyelerini ilgili dosyaya geri yükle"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Dosyaya Geri Yükle</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBulkApplying}
                          onClick={() => onRestoreFis(log.id, 'all')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer disabled:opacity-50"
                          title="Bu fişteki komisyon kadrosunu tek tıkla sistemdeki tüm dosyalara uygula"
                        >
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>Bu Fişi Tümüne Uygula</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onOpenDosyaDetail(log.temin_dosya_id, log.dosya_no, log.is_tanimi)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                    >
                      <span>Dosyayı Aç</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Fiş Kalemleri (Snapshot Üye Dağılımı) */}
                {Array.isArray(parsedSnapshot) && parsedSnapshot.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Fiş Kadro Kalemleri ({parsedSnapshot.length} Görevli)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedSnapshot.map((m, mIdx) => {
                        const adSoyad = m.ad_soyad || m.personel_ad_soyad || 'Atanmamış'
                        const gorev = m.gorev || m.gorev_adi || m.rol || 'Üye'
                        const komTip = String(m.komisyon_turu || '').toLowerCase()
                        const isMuayene =
                          Number(m.komisyon_id) === 2 ||
                          komTip.includes('muayene') ||
                          komTip.includes('kabul')

                        return (
                          <span
                            key={mIdx}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-white dark:bg-slate-900 ${
                              isMuayene
                                ? 'border-emerald-200 dark:border-emerald-900/70 text-slate-700 dark:text-slate-200'
                                : 'border-blue-200 dark:border-blue-900/70 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isMuayene ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                            />
                            <span className="font-bold">{adSoyad}</span>
                            {m.unvan && (
                              <span className="text-[10px] text-slate-400">• {m.unvan}</span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isMuayene
                                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {gorev}
                            </span>
                          </span>
                        )
                      })}
                    </div>
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
