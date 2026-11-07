import React from 'react'
import { CheckCircle2, History, Info, RefreshCw, Search, Zap } from 'lucide-react'
import { Input } from '../../../../components/ui/Input'
import { DosyaKomisyonCard } from './DosyaKomisyonCard'
import type { DosyaFilterMode, DosyaKomisyonItem } from '../types'

interface DosyaKomisyonlariTabProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  filterMode: DosyaFilterMode
  onFilterModeChange: (mode: DosyaFilterMode) => void
  isDosyaLoading: boolean
  isDosyaRefetching: boolean
  onRefresh: () => void
  filteredDosyaList: DosyaKomisyonItem[]
  totalFiles: number
  customFilesCount: number
  templateFilesCount: number
  emptyFilesCount: number
  onApplyTemplate: (dosyaId: number) => void
  onOpenCopyModal: (item: DosyaKomisyonItem) => void
  onOpenDetail: (item: DosyaKomisyonItem, tab: 'kadro' | 'revizyon') => void
  onBulkApplyToAllDossiers?: (sourceDosyaId?: number | null) => void
  isBulkApplying?: boolean
  bulkFeedback?: string | null
}

export const DosyaKomisyonlariTab: React.FC<DosyaKomisyonlariTabProps> = ({
  searchTerm,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  isDosyaLoading,
  isDosyaRefetching,
  onRefresh,
  filteredDosyaList,
  totalFiles,
  customFilesCount,
  templateFilesCount,
  emptyFilesCount,
  onApplyTemplate,
  onOpenCopyModal,
  onOpenDetail,
  onBulkApplyToAllDossiers,
  isBulkApplying = false,
  bulkFeedback = null
}) => {
  return (
    <div className="flex-1 flex flex-col space-y-3 min-h-0">
      {/* Bilgilendirme ve Tek Tıkla Tümüne Uygula Barı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-blue-200/70 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            <strong>Dosya Bazlı Komisyon Mimarisi:</strong> Her dosyanın kadrosu bağımsızdır.{' '}
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Özel Kadrolu</span>{' '}
            dosyalarda yapılan değişiklikler diğer dosyaları etkilemez. İsterseniz kurumsal şablonu
            veya herhangi bir dosyanın kadrosunu <strong>tek tıkla tüm dosyalara</strong>{' '}
            uygulayabilirsiniz.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onBulkApplyToAllDossiers && (
            <button
              type="button"
              onClick={() => onBulkApplyToAllDossiers(null)}
              disabled={isBulkApplying || isDosyaRefetching}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Kurumsal şablonda tanımlı komisyon üyelerini tek tıkla tüm aktif dosyalara uygular ve fiş oluşturur"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {isBulkApplying
                  ? 'Tüm Dosyalara Uygulanıyor...'
                  : 'Şablonu Tek Tıkla Tümüne Uygula'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isDosyaRefetching}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer shadow-2xs shrink-0"
            title="Listeyi Yenile"
          >
            <RefreshCw
              className={`w-4 h-4 ${isDosyaRefetching ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Toplu İşlem Fiş Bildirimi */}
      {bulkFeedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bulkFeedback}</span>
        </div>
      )}

      {/* Arama ve Filtreleme Araç Çubuğu */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Dosya no, konu veya görevli personel ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
          />
        </div>

        {/* Durum Filtre Butonları */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onFilterModeChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tümü ({totalFiles})
          </button>

          <button
            type="button"
            onClick={() => onFilterModeChange('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'custom'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
            <span>Dosyaya Özel ({customFilesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterModeChange('template')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'template'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            <span>Kurumsal Şablon ({templateFilesCount})</span>
          </button>

          {emptyFilesCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterModeChange('empty')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'empty'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Atanmamış ({emptyFilesCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Kartlar ve Dosya Listesi */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
        {isDosyaLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            Dosya komisyon verileri yükleniyor...
          </div>
        ) : filteredDosyaList.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">Kriterlere uygun temin dosyası bulunamadı.</p>
          </div>
        ) : (
          filteredDosyaList.map((item) => (
            <DosyaKomisyonCard
              key={item.id}
              item={item}
              onApplyTemplate={onApplyTemplate}
              onOpenCopyModal={onOpenCopyModal}
              onOpenDetail={onOpenDetail}
              onApplyToAllDossiers={onBulkApplyToAllDossiers}
            />
          ))
        )}
      </div>
    </div>
  )
}
