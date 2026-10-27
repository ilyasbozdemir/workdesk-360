import React from 'react'
import { X, ExternalLink, Calendar, Building2, User, FileText, CheckCircle2 } from 'lucide-react'

/**
 * ---------------------------------------------------------------------------
 * TEMİN 360 SAĞDAN AÇILAN DETAY ÇEKMECESİ ŞABLONU (INSPECTOR / DRAWER TEMPLATE)
 * ---------------------------------------------------------------------------
 * Liste veya tablo öğelerine tıklandığında sağ tarafta detaylı bilgi ve aksiyon
 * sunmak için kullanılan standart kayan çekmece şablonu.
 */

export interface DetailDrawerData {
  id: string | number
  baslik: string
  altBaslik?: string
  durum?: string
  tarih?: string
  olusturan?: string
  birim?: string
  ozet?: string
  detaylar?: Record<string, string | number>
}

interface DetailDrawerTemplateProps {
  isOpen: boolean
  onClose: () => void
  data: DetailDrawerData | null
  onEdit?: (id: string | number) => void
}

export const DetailDrawerTemplate: React.FC<DetailDrawerTemplateProps> = ({
  isOpen,
  onClose,
  data,
  onEdit
}) => {
  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Arka Plan Karartması */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sağ Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Başlık Şeridi */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Kayıt İnceleyici & Detay
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {data.baslik}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Özet Kart */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Durum:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                {data.durum || 'Aktif'}
              </span>
            </div>
            {data.birim && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Birim:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{data.birim}</span>
              </div>
            )}
            {data.tarih && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Tarih:
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{data.tarih}</span>
              </div>
            )}
          </div>

          {/* Açıklama */}
          {data.ozet && (
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Açıklama / Notlar
              </span>
              <p className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 leading-relaxed text-slate-600 dark:text-slate-300">
                {data.ozet}
              </p>
            </div>
          )}

          {/* Detay Anahtar-Değer Tablosu */}
          {data.detaylar && Object.keys(data.detaylar).length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                Ek Bilgiler & Parametreler
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {Object.entries(data.detaylar).map(([k, v]) => (
                  <div key={k} className="p-3 flex items-center justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Aksiyonları */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            Kapat
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(data.id)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Düzenle / Aç</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
export default DetailDrawerTemplate
