import React from 'react'
import { FileSpreadsheet, History as HistoryIcon, Link2, Package, Plus } from 'lucide-react'
import { PrintDropdownButton } from '@renderer/screens/dosya/components/PrintDropdownButton'
import { MalzemeTabloPopover } from '../MalzemeTabloPopover'

interface MalzemeTablosuToolbarProps {
  items: any[]
  isYapim: boolean
  isHizmet: boolean
  isExportingMasterExcel: boolean
  handleExportMasterExcel: () => Promise<void>
  handleOpenSablonByDosyaAdi: (targetKey: string) => void
  setIsAddModalOpen: (open: boolean) => void
  disableDocumentGuidance?: boolean
  combinedSablons: any[]
  sablons?: any[]
  activeStarredDocs?: string[] | null
  ciktiLoading?: boolean
  onSablonClick?: (sablon: any, title: string) => void
  onQuickPrint?: (sablon: any) => void
  onExport?: (sablon: any, format: 'pdf' | 'docx' | 'udf') => void
  onOpenExternal?: (sablon: any) => void
  isSablonDisabled?: (cleanName: string) => boolean
  selectedIdsCount: number
  handleToggleSelectAll: () => void
  handleDeleteSelected: () => Promise<void>
  handleExcelImport: () => Promise<void>
  handleDownloadTemplate: () => Promise<void>
  handleExportToLibrary: () => Promise<void>
  handleTriggerKatalogSync: () => void
  onOpenIhtiyacRaporuModal?: () => void
  hasLinkedIhtiyacRaporu?: boolean
}

export function MalzemeTablosuToolbar({
  items,
  isYapim,
  isHizmet,
  isExportingMasterExcel,
  handleExportMasterExcel,
  handleOpenSablonByDosyaAdi,
  setIsAddModalOpen,
  disableDocumentGuidance,
  combinedSablons,
  sablons,
  activeStarredDocs,
  ciktiLoading,
  onSablonClick,
  onQuickPrint,
  onExport,
  onOpenExternal,
  isSablonDisabled,
  selectedIdsCount,
  handleToggleSelectAll,
  handleDeleteSelected,
  handleExcelImport,
  handleDownloadTemplate,
  handleExportToLibrary,
  handleTriggerKatalogSync,
  onOpenIhtiyacRaporuModal,
  hasLinkedIhtiyacRaporu
}: MalzemeTablosuToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Package className="w-4 h-4 text-blue-600" />
        {isYapim
          ? 'Dosyadaki İmalat / İş Kalemleri (Pozlar)'
          : isHizmet
            ? 'Dosyadaki Hizmet Kalemleri'
            : 'Dosyadaki İhtiyaç Kalemleri'}
        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-bold">
          {items.length}
        </span>
      </h3>
      <div className="flex items-center gap-2 relative">
        {onOpenIhtiyacRaporuModal && (
          <button
            type="button"
            onClick={onOpenIhtiyacRaporuModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 h-8.5 rounded-xl text-xs font-semibold border transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98 ${
              hasLinkedIhtiyacRaporu
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-800/70'
                : 'bg-indigo-50/60 hover:bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/50'
            }`}
            title="İhtiyaç Raporunu Bu Doğrudan Temin Dosyasına Bağla & Kalemleri Otomatik Aktar"
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              {hasLinkedIhtiyacRaporu ? 'İhtiyaç Raporu (Bağlı)' : 'İhtiyaç Raporu Bağla'}
            </span>
            {hasLinkedIhtiyacRaporu && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleExportMasterExcel}
          disabled={isExportingMasterExcel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 h-8.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
          title="Doğrudan Temin Dosya Excel Raporunu (.xlsx) İndir"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{isExportingMasterExcel ? 'Hazırlanıyor...' : 'Excel Raporu'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSablonByDosyaAdi('son-alim-fiyat-cetveli')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 h-8.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
          title="Son Alım Fiyat Cetveli & Geçmiş Alım Fiyatları"
        >
          <HistoryIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Son Alım Fiyatları</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 h-8.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-98"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span>
            {isYapim
              ? 'Poz / İmalat Ekle'
              : isHizmet
                ? 'Hizmet Kalemi Ekle'
                : 'İhtiyaç Kalemi Ekle'}
          </span>
        </button>

        {!disableDocumentGuidance && combinedSablons.length > 0 && onSablonClick && (
          <PrintDropdownButton
            kategori="1-ihtiyac-tespiti-ve-baslangic"
            sablons={sablons || []}
            overrideSablons={combinedSablons}
            activeStarredDocs={activeStarredDocs || []}
            ciktiLoading={ciktiLoading || false}
            handleOpenPreviewForSablon={onSablonClick}
            quickPrint={async (sablon) => onQuickPrint && onQuickPrint(sablon)}
            quickExport={async (sablon, format) => onExport && onExport(sablon, format)}
            quickOpenExternal={async (sablon) => onOpenExternal && onOpenExternal(sablon)}
            isSablonDisabled={isSablonDisabled}
            buttonHeightClass="py-1.5"
          />
        )}

        <MalzemeTabloPopover
          step={1}
          selectedCount={selectedIdsCount}
          totalCount={items.length}
          onSelectAll={handleToggleSelectAll}
          onDeleteSelected={handleDeleteSelected}
          onExportMasterExcel={handleExportMasterExcel}
          onExcelImport={handleExcelImport}
          onDownloadTemplate={handleDownloadTemplate}
          onExportToLibrary={handleExportToLibrary}
          onKatalogSync={handleTriggerKatalogSync}
          onIhtiyacRaporuBagla={onOpenIhtiyacRaporuModal}
          disableDocumentGuidance={disableDocumentGuidance}
          onIhtiyacListesi={() => handleOpenSablonByDosyaAdi('ihtiyac-listesi')}
          onIhtiyacTalepFormu={() => handleOpenSablonByDosyaAdi('ihtiyac-talep-formu')}
          onLuzumMuzekkeresi={() => handleOpenSablonByDosyaAdi('luzum-muzekkeresi')}
          onLuzumMuzekkeresiOnayEki={() => handleOpenSablonByDosyaAdi('luzum-muzekkeresi-onay-eki')}
          onLuzumMuzekkeresiTeslimTesellum={() =>
            handleOpenSablonByDosyaAdi('luzum-muzekkeresi-teslim-tesellum')
          }
          onHarcamaTalimati={() => handleOpenSablonByDosyaAdi('harcama-talimati')}
          onHarcamaPusulasi={() => handleOpenSablonByDosyaAdi('harcama-pusulasi')}
          onGorevlendirmeOnayi={() => handleOpenSablonByDosyaAdi('komisyon-gorevlendirme-onayi')}
          onGorevlendirmeOnayEki={() =>
            handleOpenSablonByDosyaAdi('komisyon-gorevlendirme-onayi-eki')
          }
          onFiyatArastirmaKomisyonu={() => handleOpenSablonByDosyaAdi('fiyat-arastirma-tutanagi')}
          onPiyasaArastirmaGorevlendirmesi={() =>
            handleOpenSablonByDosyaAdi('piyasa-arastirma-gorevlendirmesi')
          }
          onMuayeneKabulBelgesi={() => handleOpenSablonByDosyaAdi('muayene-kabul-komisyonu')}
          onYaklasikMaliyetKomisyonu={() =>
            handleOpenSablonByDosyaAdi('yaklasik-maliyet-komisyonu')
          }
          onMuayeneKabulKomisyonu={() => handleOpenSablonByDosyaAdi('muayene-kabul-komisyonu')}
          onSonAlimCetveli={() => handleOpenSablonByDosyaAdi('son-alim-fiyat-cetveli')}
          onOnayBelgesi={() => handleOpenSablonByDosyaAdi('dogrudan-temin-onay-belgesi')}
        />
      </div>
    </div>
  )
}
