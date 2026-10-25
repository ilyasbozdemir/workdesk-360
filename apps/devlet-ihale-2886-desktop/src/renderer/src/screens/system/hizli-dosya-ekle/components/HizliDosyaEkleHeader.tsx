import React from 'react'
import {
  Edit3,
  RefreshCw,
  ClipboardList,
  Plus,
  Save,
  Calendar,
  Clock,
  CalendarCheck2,
  Wand2
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

interface DefaultDates {
  dosya_acilis_tarihi: string
  son_teklif_verme_tarihi: string
  teslim_tarihi: string
}

interface HizliDosyaEkleHeaderProps {
  loadLimit: number
  setLoadLimit: (val: number) => void
  isLoading: boolean
  loadExisting: () => void
  handlePaste: () => void
  addRow: () => void
  handleSave: () => void
  isSaving: boolean
  totalDirty: number
  newCount: number
  updateCount: number
  defaultDates: DefaultDates
  setDefaultDates: React.Dispatch<React.SetStateAction<DefaultDates>>
  applyDefaultDatesToNewRows?: () => void
}

export const HizliDosyaEkleHeader: React.FC<HizliDosyaEkleHeaderProps> = ({
  loadLimit,
  setLoadLimit,
  isLoading,
  loadExisting,
  handlePaste,
  addRow,
  handleSave,
  isSaving,
  totalDirty,
  newCount,
  updateCount,
  defaultDates,
  setDefaultDates,
  applyDefaultDatesToNewRows
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
      {/* Üst Başlık ve Ana İşlem Butonları */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="w-7 h-7 text-blue-600" />
            Hızlı Doğrudan Temin Dosyası Ekle / Güncelle
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Yeni doğrudan temin dosyaları tanımlayın veya mevcut kayıtları yükleyip toplu
            düzenleyin.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mevcut kayıtları yükle */}
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <select
              title="Kaç kayıt yüklensin"
              value={loadLimit}
              onChange={(e) => setLoadLimit(Number(e.target.value))}
              className="h-9 pl-3 pr-1 text-sm bg-transparent text-slate-700 dark:text-slate-300 outline-none border-r border-slate-200 dark:border-slate-700"
            >
              {[25, 50, 100, 200, 500].map((n) => (
                <option key={n} value={n}>
                  Son {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isLoading}
              onClick={loadExisting}
              className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Yükleniyor...' : 'Kayıtları Getir'}
            </button>
          </div>

          <Button
            variant="outline"
            className="gap-2 text-sm rounded-xl h-9 px-4 cursor-pointer"
            onClick={handlePaste}
          >
            <ClipboardList className="w-4 h-4" /> Panodan Yapıştır
          </Button>

          <Button
            variant="outline"
            className="gap-2 text-sm rounded-xl h-9 px-4 cursor-pointer"
            onClick={addRow}
          >
            <Plus className="w-4 h-4" /> Satır Ekle
          </Button>

          <Button
            className="gap-2 text-sm rounded-xl h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-60 cursor-pointer font-medium"
            onClick={handleSave}
            disabled={isSaving || totalDirty === 0}
          >
            <Save className="w-4 h-4" />
            {isSaving
              ? 'Kaydediliyor...'
              : totalDirty === 0
                ? 'Değişiklik Yok'
                : `${newCount > 0 ? `${newCount} Ekle` : ''}${
                    newCount > 0 && updateCount > 0 ? ' + ' : ''
                  }${updateCount > 0 ? `${updateCount} Güncelle` : ''}`}
          </Button>
        </div>
      </div>

      {/* Varsayılan Süreç Tarihleri Ayar Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Varsayılan Süreç Tarihleri:</span>
          <span className="text-[11px] font-normal text-slate-400">
            (Yeni eklenen satırlara otomatik tanımlanır)
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Dosya Açılış Tarihi */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Açılış:</span>
            <input
              type="date"
              title="Varsayılan Dosya Açılış Tarihi"
              value={defaultDates.dosya_acilis_tarihi}
              onChange={(e) =>
                setDefaultDates((prev) => ({ ...prev, dosya_acilis_tarihi: e.target.value }))
              }
              className="h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Son Teklif Verme Tarih / Saati */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Son Teklif:</span>
            <input
              type="datetime-local"
              title="Varsayılan Son Teklif Verme Tarih ve Saati"
              value={defaultDates.son_teklif_verme_tarihi}
              onChange={(e) =>
                setDefaultDates((prev) => ({ ...prev, son_teklif_verme_tarihi: e.target.value }))
              }
              className="h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Tahmini Bitiş / Teslim Tarihi */}
          <div className="flex items-center gap-1.5">
            <CalendarCheck2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Tahmini Bitiş:</span>
            <input
              type="date"
              title="Varsayılan Tahmini Bitiş / Teslim Tarihi"
              value={defaultDates.teslim_tarihi}
              onChange={(e) =>
                setDefaultDates((prev) => ({ ...prev, teslim_tarihi: e.target.value }))
              }
              className="h-7 px-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {applyDefaultDatesToNewRows && (
            <button
              type="button"
              onClick={applyDefaultDatesToNewRows}
              title="Bu tarihleri henüz kaydedilmemiş tüm yeni satırlara uygula"
              className="flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3 h-3" />
              Yeni Satırlara Uygula
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
