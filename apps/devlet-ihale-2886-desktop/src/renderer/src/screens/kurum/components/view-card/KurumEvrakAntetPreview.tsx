import React from 'react'
import { Printer, Image as ImageIcon, Building2 } from 'lucide-react'

interface KurumEvrakAntetPreviewProps {
  institutionLetterhead: string[]
  parentInstitutionLines: string[]
  hasLetterhead: boolean
  effectiveLogoLeft: string | null
  effectiveLogoRight: string | null
  effectiveInstitutionLogo: string | null
  effectiveShowLogoLeft: boolean
  effectiveShowLogoRight: boolean
}

export const KurumEvrakAntetPreview: React.FC<KurumEvrakAntetPreviewProps> = ({
  institutionLetterhead,
  parentInstitutionLines,
  hasLetterhead,
  effectiveLogoLeft,
  effectiveLogoRight,
  effectiveInstitutionLogo,
  effectiveShowLogoLeft,
  effectiveShowLogoRight
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Resmi Evrak Anteti & Canlı Başlık Görünümü
            </h3>
            <p className="text-[11px] text-slate-400">
              Resmi yazışma, onay belgesi ve doğrudan temin çıktılarında görünecek üst antet düzeni.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
          A4 Üst Başlık Şablonu
        </span>
      </div>

      {/* Mock A4 Paper Header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-6 flex items-center justify-between gap-6 min-h-28 shadow-inner">
        {/* Left Logo Slot */}
        <div className="w-20 sm:w-24 h-16 flex items-center justify-center shrink-0">
          {effectiveShowLogoLeft && effectiveLogoLeft ? (
            <img
              src={effectiveLogoLeft}
              alt="Sol Logo"
              className="max-h-16 max-w-full object-contain"
            />
          ) : (
            <div className="w-full h-full rounded-lg border border-dashed border-slate-300 dark:border-slate-750 flex flex-col items-center justify-center text-[10px] text-slate-400 p-1 text-center">
              <span>{effectiveShowLogoLeft ? 'Sol Logo Yok' : 'Sol Kapalı'}</span>
            </div>
          )}
        </div>

        {/* Center: Multi-line Official Letterhead */}
        <div className="flex-1 text-center font-serif text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-slate-100 space-y-0.5">
          {hasLetterhead ? (
            institutionLetterhead.map((line, idx) => (
              <div
                key={idx}
                className={idx === 0 ? 'font-bold uppercase tracking-wide' : 'font-semibold'}
              >
                {line}
              </div>
            ))
          ) : (
            <div className="text-slate-400 italic font-sans text-xs">
              Resmi antet metni tanımlanmamış (Düzenleme Modundan antet satırlarını ekleyin).
            </div>
          )}
        </div>

        {/* Right Logo Slot */}
        <div className="w-20 sm:w-24 h-16 flex items-center justify-center shrink-0">
          {effectiveShowLogoRight && effectiveLogoRight ? (
            <img
              src={effectiveLogoRight}
              alt="Sağ Logo"
              className="max-h-16 max-w-full object-contain"
            />
          ) : (
            <div className="w-full h-full rounded-lg border border-dashed border-slate-300 dark:border-slate-750 flex flex-col items-center justify-center text-[10px] text-slate-400 p-1 text-center">
              <span>{effectiveShowLogoRight ? 'Sağ Logo Yok' : 'Sağ Kapalı'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3'lü Logo Kartları Özeti */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Sol Logo Kartı */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
            {effectiveLogoLeft ? (
              <img
                src={effectiveLogoLeft}
                alt="Sol Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-850 dark:text-slate-200 truncate">
              Sol Logo (Kurum)
            </div>
            <div className="text-[10px] text-slate-400">Belge Sol Üst</div>
            <div className="mt-1">
              <span
                className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${effectiveShowLogoLeft ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {effectiveShowLogoLeft ? 'Belgelerde Aktif' : 'Belgelerde Pasif'}
              </span>
            </div>
          </div>
        </div>

        {/* Uygulama Logosu Kartı */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
            {effectiveInstitutionLogo ? (
              <img
                src={effectiveInstitutionLogo}
                alt="Uygulama Logosu"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Building2 className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-850 dark:text-slate-200 truncate">
              Uygulama Logosu
            </div>
            <div className="text-[10px] text-slate-400">Giriş & Menü Arması</div>
            <div className="mt-1">
              <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300">
                {effectiveInstitutionLogo ? 'Özel Logo Yüklü' : 'Varsayılan İkon'}
              </span>
            </div>
          </div>
        </div>

        {/* Sağ Logo Kartı */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
            {effectiveLogoRight ? (
              <img
                src={effectiveLogoRight}
                alt="Sağ Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-850 dark:text-slate-200 truncate">
              Sağ Logo (Bakanlık)
            </div>
            <div className="text-[10px] text-slate-400">Belge Sağ Üst</div>
            <div className="mt-1">
              <span
                className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${effectiveShowLogoRight ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {effectiveShowLogoRight ? 'Belgelerde Aktif' : 'Belgelerde Pasif'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {parentInstitutionLines.length > 0 && parentInstitutionLines.some((l) => l.trim()) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Hiyerarşi:</span>
          {parentInstitutionLines.map((line, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
            >
              {line}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
