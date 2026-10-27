import React from 'react'
import { useNewFeaturesStore } from '../../store/newFeaturesStore'
import { NewFeatureItem } from '../../config/newFeatures.config'
import { cn } from '../../utils/cn'

export interface NewFeatureBadgeProps {
  /** Rota (ör. /piyasa-fiyat-arastirmasi) veya özellik kimliği (id) */
  routeOrId?: string
  /** Doğrudan özellik nesnesi geçilmek istenirse */
  feature?: NewFeatureItem
  /** Boyutlandırma seçeneği: 'dot-only' (yalnızca parlayan nokta), 'xs' (menüler için), 'sm' (butonlar/kartlar), 'md' (başlıklar) */
  size?: 'dot-only' | 'xs' | 'sm' | 'md'
  /** Sürüm etiketinin rozet içinde zorla gösterilip gösterilmeyeceği (belirtilmezse store ayarı geçerlidir) */
  showVersion?: boolean
  /** Özel CSS sınıfları */
  className?: string
  /** Başlık / tooltip metnini özelleştirmek için */
  customTooltip?: string
}

export const NewFeatureBadge: React.FC<NewFeatureBadgeProps> = ({
  routeOrId,
  feature: directFeature,
  size = 'xs',
  showVersion: directShowVersion,
  className,
  customTooltip
}) => {
  const { getFeatureStatus, showPulsingAnimation, showVersionTag } = useNewFeaturesStore()

  const status = getFeatureStatus(routeOrId || directFeature?.id || directFeature?.route)
  const item = directFeature || status.feature

  if (!status.isNew || !item) {
    return null
  }

  const effectiveShowVersion =
    directShowVersion !== undefined ? directShowVersion : showVersionTag

  const tooltipText =
    customTooltip ||
    `✨ ${item.title}\nSürüm: ${item.version} (${item.releaseDate})\nKalan Gösterim: ${status.remainingDays} gün`

  // 1. Sadece yanıp sönen nokta modu (örneğin daraltılmış sidebar veya simge köşesi)
  if (size === 'dot-only') {
    return (
      <span
        className={cn('relative flex h-2 w-2 shrink-0', className)}
        title={tooltipText}
        data-testid="new-feature-dot"
      >
        {showPulsingAnimation && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
      </span>
    )
  }

  // 2. Boyut CSS profilleri
  const sizeStyles = {
    xs: {
      container: 'text-[9px] px-1.5 py-0.5 gap-1 font-extrabold tracking-wider',
      dot: 'h-1.5 w-1.5',
      versionText: 'text-[8.5px]'
    },
    sm: {
      container: 'text-[10px] px-2 py-0.5 gap-1.5 font-bold tracking-wide',
      dot: 'h-2 w-2',
      versionText: 'text-[9px]'
    },
    md: {
      container: 'text-xs px-2.5 py-1 gap-2 font-black tracking-wide',
      dot: 'h-2.5 w-2.5',
      versionText: 'text-[10px]'
    }
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full select-none transition-all duration-200',
        'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
        'shadow-xs hover:border-emerald-500/60 hover:bg-emerald-500/20 cursor-default group',
        sizeStyles.container,
        className
      )}
      title={tooltipText}
      data-testid="new-feature-badge"
    >
      {/* Yanıp sönen yumuşak canlı nabız noktası */}
      {showPulsingAnimation && (
        <span className={cn('relative flex shrink-0', sizeStyles.dot)}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
          <span className={cn('relative inline-flex rounded-full bg-emerald-500', sizeStyles.dot)}></span>
        </span>
      )}

      {/* Rozet Metni */}
      <span className="uppercase">{item.badgeText || 'YENİ'}</span>

      {/* Sürüm Etiketi (Opsiyonel / Ayarlanabilir) */}
      {effectiveShowVersion && item.version && (
        <span
          className={cn(
            'font-mono opacity-85 border-l border-emerald-500/40 pl-1 font-semibold group-hover:opacity-100',
            sizeStyles.versionText
          )}
        >
          {item.version}
        </span>
      )}
    </span>
  )
}
