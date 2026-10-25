import React from 'react'
import {
  Package,
  Wrench,
  Hammer,
  FileText,
  Building,
  ExternalLink,
  Edit,
  CheckCircle2,
  GripVertical
} from 'lucide-react'
import type { TeminDosyasi } from '../../../dosyalar/dosyalar.hooks'

export interface TakipKanbanCardProps {
  dosya: TeminDosyasi
  formatCurrency: (val: number) => string
  onSelect: (dosyaId: number) => void
  onOpenSurec: (dosya: TeminDosyasi) => void
  onEdit: (dosyaId: number) => void
  isActive?: boolean
  onOpenDetail?: (dosya: TeminDosyasi) => void
  mode?: 'cards' | 'compact'
}

export function TakipKanbanCard({
  dosya,
  formatCurrency,
  onSelect,
  onOpenSurec,
  onEdit,
  isActive = false,
  onOpenDetail,
  mode = 'cards'
}: TakipKanbanCardProps): React.JSX.Element {
  const getTurBadge = (
    tur: string
  ): { label: string; icon: React.ElementType; classes: string } => {
    switch (tur) {
      case 'mal':
        return {
          label: 'Mal',
          icon: Package,
          classes: 'bg-blue-100/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
        }
      case 'hizmet':
        return {
          label: 'Hizmet',
          icon: Wrench,
          classes: 'bg-purple-100/70 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
        }
      case 'yapim_isi':
        return {
          label: 'Yapım',
          icon: Hammer,
          classes: 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
        }
      case 'danismanlik':
        return {
          label: 'Danışmanlık',
          icon: FileText,
          classes: 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
        }
      default:
        return {
          label: tur || 'Belirtilmedi',
          icon: Package,
          classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }
    }
  }

  const turInfo = getTurBadge(dosya.tur)
  const TurIcon = turInfo.icon

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    e.dataTransfer.setData('text/plain', String(dosya.id))
    e.dataTransfer.effectAllowed = 'move'
    // Optional semi-transparent drag image
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1'
    }
  }

  if (mode === 'compact') {
    const hasMaliyet =
      dosya.yaklasik_maliyet !== undefined &&
      dosya.yaklasik_maliyet !== null &&
      Number(dosya.yaklasik_maliyet) > 0

    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => {
          onSelect(dosya.id)
          if (onOpenDetail) onOpenDetail(dosya)
        }}
        onDoubleClick={() => onOpenSurec(dosya)}
        className={`group relative flex flex-col gap-1.5 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 ${
          isActive
            ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30 shadow-blue-500/10 bg-blue-50/15 dark:bg-blue-950/20'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        title="Tıklayarak detay dialog'unu, çift tıklayarak süreç ekranını açabilirsiniz."
      >
        {/* Üst Satır: Grip, Konu (2 Satır) ve Tutar / Aksiyonlar */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing mt-0.5" />
            <h4
              className="text-xs font-bold text-slate-850 dark:text-slate-100 line-clamp-2 leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title={dosya.konu || 'İsimsiz Temin Dosyası'}
            >
              {dosya.konu || 'İsimsiz Temin Dosyası'}
            </h4>
          </div>

          {/* Sağ Üst: Tutar (varsa) */}
          <div className="shrink-0 text-right">
            {hasMaliyet ? (
              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                {formatCurrency(dosya.yaklasik_maliyet || 0)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-300 dark:text-slate-600 font-mono block">
                —
              </span>
            )}
          </div>
        </div>

        {/* Alt Satır: No + Tür Rozeti + Birim + Hover Aksiyonları */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
            <span className="font-mono font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              {dosya.temin_no || `#${dosya.id}`}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.2 rounded-full ${turInfo.classes} shrink-0`}
            >
              <TurIcon size={10} />
              {turInfo.label}
            </span>
            {dosya.birim_adi && (
              <span className="text-slate-400 truncate max-w-28" title={dosya.birim_adi}>
                {dosya.birim_adi}
              </span>
            )}
          </div>

          {/* Aksiyon İkonları (Grup hover'da görünür, sade ve yer tasarruflu) */}
          <div
            className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(dosya.id)
              }}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:text-slate-300'
              }`}
              title={isActive ? 'Aktif Dosya' : 'Seç'}
            >
              <CheckCircle2 size={11} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenSurec(dosya)
              }}
              className="p-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
              title="Süreç Aşamasına Git"
            >
              <ExternalLink size={11} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(dosya.id)
              }}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Dosyayı Düzenle"
            >
              <Edit size={11} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => {
        onSelect(dosya.id)
        if (onOpenDetail) onOpenDetail(dosya)
      }}
      onDoubleClick={() => onOpenSurec(dosya)}
      className={`group relative flex flex-col gap-2.5 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/30 shadow-blue-500/10'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
      title="Tıklayarak detay dialog'unu, çift tıklayarak süreç ekranını açabilirsiniz."
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
          <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate">
            {dosya.temin_no || `#${dosya.id}`}
          </span>
        </div>

        <span
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${turInfo.classes} shrink-0`}
        >
          <TurIcon size={11} />
          {turInfo.label}
        </span>
      </div>

      {/* Subject / Konu */}
      <h4
        className="text-xs font-bold text-slate-855 dark:text-slate-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        title={dosya.konu || 'İsimsiz Temin Dosyası'}
      >
        {dosya.konu || 'İsimsiz Temin Dosyası'}
      </h4>

      {/* Meta Information (Birim & Maliyet) */}
      <div className="flex flex-col gap-1 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {dosya.birim_adi && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
            <Building className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{dosya.birim_adi}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
            Yaklaşık Maliyet:
          </span>
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
            {formatCurrency(dosya.yaklasik_maliyet || 0)}
          </span>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div
        className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/60"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(dosya.id)
          }}
          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:text-slate-300 dark:hover:text-blue-300'
          }`}
          title="Dosyayı aktif hale getir"
        >
          <CheckCircle2 size={11} />
          {isActive ? 'Aktif Dosya' : 'Seç'}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenSurec(dosya)
            }}
            className="p-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
            title="Süreç Aşamasına Git"
          >
            <ExternalLink size={13} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(dosya.id)
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Dosyayı Düzenle"
          >
            <Edit size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
