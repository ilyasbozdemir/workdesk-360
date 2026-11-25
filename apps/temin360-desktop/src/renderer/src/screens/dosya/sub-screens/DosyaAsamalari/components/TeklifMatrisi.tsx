import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Calculator, CheckCircle2, Coins, TrendingUp } from 'lucide-react'
import { TeklifMatrisiProps, FirmBasedEntryView, TableView } from './TeklifMatrisi/index'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { emitAppEvent } from '@renderer/utils/appEvents'

export type { TeklifMatrisiProps }

export const TeklifMatrisi: React.FC<TeklifMatrisiProps> = ({
  invitedFirms,
  items,
  bids,
  getEstimatedCostTotal,
  getLowestBidInfo,
  getAverageBid,
  handlePriceChange,
  hesaplamaEsasi,
  onSetHesaplamaEsasi,
  handleSaveToDosya,
  showSaveButton
}) => {
  const { activeDosyaId } = useWorkspaceStore()
  const [activeView, setActiveView] = useState<'firm' | 'matrix'>('firm')
  const [selectedFirmId, setSelectedFirmId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Initialize and synchronize selectedFirmId
  useEffect(() => {
    if (
      invitedFirms.length > 0 &&
      (selectedFirmId === null || !invitedFirms.some((f) => f.id === selectedFirmId))
    ) {
      setSelectedFirmId(invitedFirms[0].id)
    }
  }, [invitedFirms, selectedFirmId])

  const onExecuteSave = async (): Promise<void> => {
    if (handleSaveToDosya) {
      handleSaveToDosya('save_only')
      return
    }
    if (!activeDosyaId) return
    const total = getEstimatedCostTotal()
    if (total <= 0) {
      alert('Yaklaşık maliyet ₺0,00 olamaz. Lütfen önce geçerli teklif fiyatları girin.')
      return
    }
    setIsSaving(true)
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET yaklasik_maliyet = ? WHERE id = ?',
        [total, activeDosyaId]
      )
      if (res.success) {
        setSaveSuccessMsg(
          `Yaklaşık maliyet başarıyla güncellendi: ₺ ${total.toLocaleString('tr-TR', {
            minimumFractionDigits: 2
          })}`
        )
        setTimeout(() => setSaveSuccessMsg(null), 3500)
        emitAppEvent('dossier:updated', { dosyaId: activeDosyaId })
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Boş durum kontrolü: İhtiyaç kalemi veya firma yoksa bilgilendirme ekranı
  if (items.length === 0 || invitedFirms.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-slate-350" />
        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">
          İşlem Yapılacak Kalem veya Firma Bulunamadı
        </h4>
        <p className="text-xs text-slate-500 max-w-md">
          Bu ekranda işlem yapabilmek için dosyada en az <strong>1 adet malzeme kalemi</strong> ve{' '}
          <strong>1 adet istekli firma</strong> bulunmalıdır.
        </p>
        <div className="flex gap-3 mt-2">
          <Link
            to="/dosya/hazirlik-ve-ihtiyac"
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            Kalem Ekle
          </Link>
          <Link
            to="/dosya/piyasa-fiyat-arastirmasi"
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
          >
            Firma Ekle
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-5 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="text-left">
          <h3 className="text-lg font-bold text-slate-855 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            Teklif Giriş Tablosu & Karşılaştırma
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Her firma için malzeme birim fiyatlarını girin.{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">Enter / Ok Tuşları</span> ile
            alt satıra geçebilir,{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Alt + Sağ / Sol</span>{' '}
            ile firmalar arasında hızlıca kayabilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-955 p-1 rounded-xl h-10 border border-slate-200/40 dark:border-slate-800/40 select-none">
            <button
              onClick={() => setActiveView('firm')}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                activeView === 'firm'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              Firma Bazlı
            </button>
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                activeView === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              Tüm Teklifler (Tablo)
            </button>
          </div>

          {/* Hesaplama Esası Seçici / Gösterici */}
          {onSetHesaplamaEsasi ? (
            <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-955 p-1 rounded-xl h-10 border border-slate-200/40 dark:border-slate-800/40 text-xs select-none">
              <span className="text-[11px] font-bold text-slate-500 pl-2">Esas:</span>
              <button
                type="button"
                onClick={() => onSetHesaplamaEsasi('Aritmetik Ortalama Fiyat')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                  !hesaplamaEsasi?.toLowerCase().includes('en düşük') &&
                  !hesaplamaEsasi?.toLowerCase().includes('en dusuk')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Ortalama
              </button>
              <button
                type="button"
                onClick={() => onSetHesaplamaEsasi('En Düşük Fiyat')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                  hesaplamaEsasi?.toLowerCase().includes('en düşük') ||
                  hesaplamaEsasi?.toLowerCase().includes('en dusuk')
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                En Düşük
              </button>
            </div>
          ) : hesaplamaEsasi ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-955 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 h-10">
              <Calculator className="w-4 h-4 text-blue-500" />
              <span>Esas: {hesaplamaEsasi}</span>
            </div>
          ) : null}

          {/* Maliyeti Dosyaya Kaydet Butonu */}
          {(showSaveButton || handleSaveToDosya) && (
            <button
              type="button"
              onClick={onExecuteSave}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Hesaplanan yaklaşık maliyeti dosyaya kaydeder"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Maliyeti Dosyaya Kaydet'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-955 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 h-10">
            <Coins className="w-4 h-4 text-emerald-500" />
            <span>Para Birimi: TL</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3.5 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 h-10">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Birim Fiyatlar KDV Hariçtir</span>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {invitedFirms.some((f) => !f.teklif_toplami || f.teklif_toplami === 0) ? (
        <div
          className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 px-4 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300 font-medium"
          title="Fiyat Girişi: İhtiyaç kalemlerinin karşısına firmaların birim fiyatları girildikçe teklif tutarı 0,00 ₺'nin üzerine çıkan firmalar otomatik 'Teklif Veren Firma' statüsüne geçer."
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Fiyat Girişi &amp; Teklif Veren Statüsü:</strong> Davet edilen bazı firmaların (Örn:{' '}
              {invitedFirms
                .filter((f) => !f.teklif_toplami)
                .map((f) => f.unvan)
                .join(', ')}
              ) henüz teklif fiyatları girilmedi. İlgili firmanın satırına birim fiyatlar girilip teklif tutarı 0,00 ₺&apos;nin üzerine çıktığı anda program o firmayı otomatik olarak <strong>&quot;Teklif Veren Firma&quot;</strong> statüsüne geçirecektir.
            </span>
          </div>
        </div>
      ) : invitedFirms.length > 0 ? (
        <div
          className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-2.5 px-4 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-300 font-medium"
          title="Tüm firmaların teklif tutarları 0,00 ₺'nin üzerinde olup Teklif Veren Firma statüsü tamamlanmıştır."
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Tam Katılım:</strong> Davet edilen {invitedFirms.length} firmanın tamamı için fiyat girişi yapılmış olup tümü <strong>Teklif Veren Firma</strong> statüsündedir.
            </span>
          </div>
        </div>
      ) : null}

      {activeView === 'firm' && invitedFirms.length > 0 && selectedFirmId !== null ? (
        <FirmBasedEntryView
          invitedFirms={invitedFirms}
          items={items}
          bids={bids}
          selectedFirmId={selectedFirmId}
          setSelectedFirmId={setSelectedFirmId}
          getLowestBidInfo={getLowestBidInfo}
          handlePriceChange={handlePriceChange}
        />
      ) : (
        <TableView
          invitedFirms={invitedFirms}
          items={items}
          bids={bids}
          getEstimatedCostTotal={getEstimatedCostTotal}
          getLowestBidInfo={getLowestBidInfo}
          getAverageBid={getAverageBid}
          handlePriceChange={handlePriceChange}
          hesaplamaEsasi={hesaplamaEsasi}
        />
      )}
    </div>
  )
}
