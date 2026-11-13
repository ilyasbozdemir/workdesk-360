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
  activeDosyaId?: number | null
  activeDosyaItem?: DosyaKomisyonItem | null
  showOnlyActive?: boolean
  onToggleShowOnlyActive?: (val: boolean) => void
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
  bulkFeedback = null,
  activeDosyaId = null,
  activeDosyaItem = null,
  showOnlyActive = false,
  onToggleShowOnlyActive
}) => {
  return (
    <div className="flex-1 flex flex-col space-y-3 min-h-0">
      {/* Aktif Dosya Kapsam ve Hızlı Geçiş Barı */}
      {activeDosyaId && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <span className="text-base font-black">📌</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider">
                  Aktif Çalışma Dosyası
                </span>
                <span className="text-xs font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md">
                  #{activeDosyaItem?.dosya_no || activeDosyaId}
                </span>
                {activeDosyaItem && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeDosyaItem.source === 'custom'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : activeDosyaItem.source === 'template'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {activeDosyaItem.source === 'custom'
                      ? 'Özel Kadro'
                      : activeDosyaItem.source === 'template'
                        ? 'Kurumsal Şablon'
                        : 'Kadro Atanmadı'}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">
                {activeDosyaItem?.is_tanimi || 'Seçili Dosya'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onToggleShowOnlyActive?.(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showOnlyActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              <span>📌 Sadece Aktif Dosya</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleShowOnlyActive?.(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !showOnlyActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              <span>📁 Tüm Dosyaları Göster ({totalFiles})</span>
            </button>
          </div>
        </div>
      )}

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
          {activeDosyaId && (
            <button
              type="button"
              onClick={() => onToggleShowOnlyActive?.(!showOnlyActive)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showOnlyActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
              }`}
              title={
                showOnlyActive
                  ? 'Tüm dosyaları göstermek için tıklayın'
                  : 'Sadece aktif dosyayı filtrelemek için tıklayın'
              }
            >
              <span>📌</span>
              <span>{showOnlyActive ? 'Sadece Aktif Dosya' : 'Aktif Dosyaya Filtrele'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (showOnlyActive) onToggleShowOnlyActive?.(false)
              onFilterModeChange('all')
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !showOnlyActive && filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tüm Dosyalar ({totalFiles})
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
              isActive={Number(item.id) === Number(activeDosyaId)}
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
