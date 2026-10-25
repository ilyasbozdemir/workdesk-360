import React from 'react'
import { Link } from '@tanstack/react-router'
import { FileText, Eye, Printer, Download, ExternalLink, Star, Copy } from 'lucide-react'
import { getStatusBadgeLightClass } from '../../utils/statusUtils'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'

interface DocumentCardProps {
  sablon: Sablon | null | undefined
  route?: string
  status: string | null
  cleanName: string
  onPreview: () => void
  onQuickPrint: () => void
  onQuickExport: (format: 'pdf' | 'docx' | 'udf') => void
  onToggleStar: () => void
  presets?: { id: string; name: string; docs: string[] }[]
  onCopyToPreset?: (presetId: string) => void
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  sablon,
  route,
  status,
  cleanName,
  onPreview,
  onQuickPrint,
  onQuickExport,
  onToggleStar,
  presets,
  onCopyToPreset
}) => {
  return (
    <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md dark:hover:shadow-blue-950/20 transition-all duration-200 group">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-blue-500 to-indigo-600 rounded-r-xs" />

      <div className="flex items-start gap-3.5 min-w-0 flex-1 pl-1">
        {/* Icon container */}
        <div className="p-2.5 bg-blue-50/50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
          <FileText className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-850 dark:text-slate-105 text-xs tracking-wide group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {cleanName}
            </span>
            {status && (
              <span
                className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 ${getStatusBadgeLightClass(
                  status
                )}`}
              >
                {status}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {sablon?.aciklama ||
              `${cleanName} belgesini güncel verilerinizle otomatik doldurabilir, önizleyebilir veya indirebilirsiniz.`}
          </p>
        </div>
      </div>

      {/* Actions on the right */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 mt-3 sm:mt-0 ml-0 sm:ml-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-855 pt-3 sm:pt-0">
        {/* 👁️ Preview button */}
        <button
          onClick={onPreview}
          title="Belgeyi Önizle / Düzenle"
          className="p-2 rounded-xl transition-all cursor-pointer bg-slate-55 hover:bg-blue-50 dark:bg-slate-955 dark:hover:bg-blue-950/20 text-slate-400 hover:text-blue-500 hover:scale-105 border border-slate-150 dark:border-slate-855"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* ↗️ Navigate / Fill button */}
        {route ? (
          <Link
            to={route}
            title="Veri Giriş Ekranına Git"
            className="p-2 rounded-xl transition-all bg-slate-55 hover:bg-emerald-50 dark:bg-slate-955 dark:hover:bg-emerald-950/20 text-slate-400 hover:text-emerald-505 hover:scale-105 border border-slate-150 dark:border-slate-855"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        ) : (
          <button
            disabled
            title="Bu belge için özel veri giriş ekranı bulunmuyor"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-955 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-900 cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {/* 🖨️ Quick Print button */}
        <button
          onClick={onQuickPrint}
          title="Hızlı Yazdır"
          className="p-2 rounded-xl transition-all cursor-pointer bg-slate-55 hover:bg-indigo-50 dark:bg-slate-955 dark:hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-505 hover:scale-105 border border-slate-150 dark:border-slate-855"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* 📥 Download button (PDF / Word) */}
        <div className="relative group/download">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onQuickExport('pdf')
            }}
            title="PDF Olarak İndir (Diğer formatlar için üzerine gelin)"
            className="p-2 rounded-xl transition-all cursor-pointer bg-slate-55 hover:bg-slate-105 dark:bg-slate-955 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-105 border border-slate-150 dark:border-slate-855"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Dropdown on hover */}
          <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1 hidden group-hover/download:block w-24">
            {(['pdf', 'docx', 'udf'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={(e) => {
                  e.stopPropagation()
                  onQuickExport(fmt)
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 uppercase font-bold text-slate-600 dark:text-slate-450 transition-colors cursor-pointer"
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 Copy to Another Preset/Package */}
        {onCopyToPreset && (
          <div className="relative group/copy">
            <button
              title="Diğer Pakete Kopyala"
              className="p-2 rounded-xl transition-all cursor-pointer bg-slate-55 hover:bg-blue-50 dark:bg-slate-955 dark:hover:bg-blue-950/20 text-slate-400 hover:text-blue-500 hover:scale-105 border border-slate-150 dark:border-slate-855"
            >
              <Copy className="w-4 h-4" />
            </button>
            <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1.5 hidden group-hover/copy:block w-44 max-h-48 overflow-y-auto">
              <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1 uppercase tracking-wider text-left">
                Pakete Kopyala
              </div>
              {presets && presets.length > 0 ? (
                presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopyToPreset(p.id)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-450 transition-colors cursor-pointer truncate font-medium flex items-center gap-1.5"
                  >
                    <span>📦 {p.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-[10px] text-slate-400 dark:text-slate-500 italic text-left">
                  Henüz paket oluşturulmamış. Kopyalamak için önce üst menüden yeni bir paket
                  oluşturun.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ⭐ Star/Unstar button */}
        <button
          onClick={onToggleStar}
          title="Paketten Kaldır"
          className="p-2 rounded-xl transition-all cursor-pointer bg-slate-55 hover:bg-amber-55/20 dark:bg-slate-955 dark:hover:bg-amber-955/20 text-amber-550 hover:scale-105 border border-slate-150 dark:border-slate-800"
        >
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
        </button>
      </div>
    </div>
  )
}
