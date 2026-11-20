import React from 'react'
import {
  FileText,
  FolderOpen,
  RefreshCw,
  Building2,
  Tag,
  Coins,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  ChevronDown
} from 'lucide-react'
import { DosyaSummaryInfo, EvrakItem } from '../types'
import { formatCurrency } from '@renderer/utils/formatters'

interface DosyaEvrakAkisiHeaderProps {
  dosyaInfo: DosyaSummaryInfo | null
  dosyalarList: Array<{ id: number; teminNo: string; konu: string }>
  activeDosyaId: number | null
  onSelectDosya: (id: number) => void
  onRefresh: () => void
  loading: boolean
  evraklar: EvrakItem[]
}

export const DosyaEvrakAkisiHeader: React.FC<DosyaEvrakAkisiHeaderProps> = ({
  dosyaInfo,
  dosyalarList,
  activeDosyaId,
  onSelectDosya,
  onRefresh,
  loading,
  evraklar
}) => {
  const signedCount = (evraklar || []).filter((e) => e.status === 'imzali').length
  const readyCount = (evraklar || []).filter((e) => e.status === 'hazir').length

  const formatAlimTuru = (tur?: string) => {
    switch (tur?.toLowerCase()) {
      case 'mal':
        return 'Mal Alımı'
      case 'hizmet':
        return 'Hizmet Alımı'
      case 'danismanlik':
        return 'Danışmanlık'
      case 'yapim':
      case 'yapim_isi':
        return 'Yapım İşi'
      default:
        return tur || 'Doğrudan Temin'
    }
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Sol Taraf: Dosya Başlık ve Seçici */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
            <FolderOpen size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {dosyaInfo?.teminNo || `#${activeDosyaId || '---'}`}
              </span>

              {/* Hızlı Dosya Seçici Dropdown */}
              <div className="relative inline-block">
                <select
                  value={activeDosyaId || ''}
                  onChange={(e) => onSelectDosya(Number(e.target.value))}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none transition-colors"
                  title="Başka bir doğrudan temin dosyasını seç"
                >
                  {dosyalarList.map((d) => (
                    <option key={`opt-dosya-${d.id}`} value={d.id}>
                      {d.teminNo} — {d.konu.length > 40 ? `${d.konu.slice(0, 40)}...` : d.konu}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {dosyaInfo && (
                <>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Tag size={11} className="text-slate-400" />
                    <span>{formatAlimTuru(dosyaInfo.alimTuru)}</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      dosyaInfo.sozlesmeliMi
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    <span>{dosyaInfo.sozlesmeliMi ? 'Sözleşmeli' : 'Sözleşmesiz'}</span>
                  </span>
                </>
              )}
            </div>

            <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate mt-1">
              {dosyaInfo?.konu || 'Doğrudan Temin Evrak Akışı & Dosya Görüntüleme'}
            </h1>
          </div>
        </div>

        {/* Sağ Taraf: Birim, Maliyet & İstatistik Rozetleri */}
        <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap justify-between lg:justify-end">
          {dosyaInfo && (
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 divide-x divide-slate-200 dark:divide-slate-800">
              <div className="flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {dosyaInfo.harcamaBirimi}
                </span>
              </div>

              <div className="pl-4 flex items-center gap-1.5">
                <Coins size={13} className="text-emerald-500" />
                <span className="text-slate-400 text-[11px]">Bedel:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(dosyaInfo.netOdenen || dosyaInfo.yaklasikMaliyet)}
                </span>
              </div>
            </div>
          )}

          {/* Sayaç Rozetleri */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              title="Dosyadaki toplam evrak sayısı"
            >
              <FileText size={12} className="text-slate-400" />
              <span>{evraklar.length} Belge</span>
            </span>

            {readyCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                title="Verileri hazırlanmış ve onaylanmış belgeler"
              >
                <CheckCircle2 size={12} className="text-blue-500" />
                <span>{readyCount} Hazır</span>
              </span>
            )}

            {signedCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                title="Taranmış veya ıslak imzalı yüklenen belgeler"
              >
                <FileCheck size={12} className="text-emerald-500" />
                <span>{signedCount} İmzalı</span>
              </span>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Dosya evraklarını ve veritabanı snapshotlarını yenile"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-blue-500' : ''} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
