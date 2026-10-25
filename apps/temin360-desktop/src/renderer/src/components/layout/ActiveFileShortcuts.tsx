import React, { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Briefcase,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutGrid,
  LayoutTemplate,
  PackageSearch,
  UserCheck,
  Users,
  Warehouse
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useSettingsStore } from '../../store/settingsStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { getInitials } from '@renderer/utils/formatters'

/**
 * Tooltip `fixed` konumlandırılır: menü alanı kaydırılabilir (overflow) olduğu için
 * `absolute` bir tooltip yatayda kesilirdi.
 */
function useRailTooltip(): {
  tip: { top: number; left: number } | null
  handlers: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void
    onMouseLeave: () => void
    onFocus: (e: React.FocusEvent<HTMLElement>) => void
    onBlur: () => void
  }
} {
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)
  const show = (el: HTMLElement): void => {
    const r = el.getBoundingClientRect()
    setTip({ top: r.top + r.height / 2, left: r.right + 12 })
  }
  return {
    tip,
    handlers: {
      onMouseEnter: (e) => show(e.currentTarget),
      onMouseLeave: () => setTip(null),
      onFocus: (e) => show(e.currentTarget),
      onBlur: () => setTip(null)
    }
  }
}

function RailTooltip({
  tip,
  children
}: {
  tip: { top: number; left: number } | null
  children: React.ReactNode
}): React.JSX.Element | null {
  if (!tip) return null
  return (
    <div
      role="tooltip"
      style={{ top: tip.top, left: tip.left, transform: 'translateY(-50%)' }}
      className="fixed z-300 max-w-[min(20rem,calc(100vw-6rem))] flex items-center gap-1.5 bg-slate-900 text-white text-xs rounded-lg py-1.5 px-3 shadow-xl pointer-events-none wrap-break-word"
    >
      {children}
    </div>
  )
}

interface ShortcutItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  badge?: string
}

function ShortcutLink({
  item,
  isActive
}: {
  item: ShortcutItem
  isActive: boolean
}): React.JSX.Element {
  const Icon = item.icon
  const { tip, handlers } = useRailTooltip()
  return (
    <Link
      to={item.path as never}
      aria-label={item.name}
      data-testid="rail-shortcut"
      {...handlers}
      className={cn(
        // Kısa ekranlarda (<= 720px yükseklik) düğmeler küçülür
        'w-10 h-10 short:w-8 short:h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer relative',
        isActive
          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
          : 'bg-transparent border-transparent text-slate-500 hover:scale-105',
        !isActive && item.color
      )}
    >
      <Icon className="w-5 h-5 short:w-4 short:h-4" />
      {item.badge && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-slate-900" />
      )}
      <RailTooltip tip={tip}>
        <span>{item.name}</span>
        {item.badge && (
          <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-cyan-500/30 text-cyan-300">
            {item.badge}
          </span>
        )}
      </RailTooltip>
    </Link>
  )
}

export function ActiveFileShortcuts(): React.JSX.Element {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const { adminUsername, adminName, institutionName, institutionLogo } = useSettingsStore()
  const { activeDosyaId } = useWorkspaceStore()
  const { tip: profileTip, handlers: profileHandlers } = useRailTooltip()

  const primaryItems: ShortcutItem[] = [
    {
      name: 'Gösterge Paneli',
      path: '/',
      icon: Home,
      color: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
    },
    {
      name: 'Kurum Bilgileri',
      path: '/kurum',
      icon: Building2,
      color: 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
    },
    {
      name: 'Birim Yönetimi',
      path: '/birimler',
      icon: LayoutGrid,
      color: 'hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20'
    },
    {
      name: 'Personel Yönetimi',
      path: '/personel',
      icon: Users,
      color: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
    },
    {
      name: 'İstekli Firmalar',
      path: '/firmalar',
      icon: Briefcase,
      color: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20'
    },
    {
      name: 'Malzeme & Kalemler',
      path: '/malzemeler',
      icon: PackageSearch,
      color: 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
    },
    {
      name: activeDosyaId
        ? `İhtiyaç Raporları (Dosya #${activeDosyaId})`
        : 'İhtiyaç Raporları (Genel Havuz)',
      path: activeDosyaId ? `/ihtiyac-raporlari?dosyaId=${activeDosyaId}` : '/ihtiyac-raporlari',
      icon: FileSpreadsheet,
      color: 'hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20',
      badge: activeDosyaId ? 'AKTİF' : undefined
    },
    {
      name: 'Komisyon Yönetimi',
      path: '/komisyonlar',
      icon: UserCheck,
      color: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
    },
    {
      name: 'Ambar Yönetimi',
      path: '/ambar',
      icon: Warehouse,
      color: 'hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20'
    },
    {
      name: 'Proje Yönetimi',
      path: '/projeler',
      icon: FolderKanban,
      color: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
    }
  ]

  const secondaryItems: ShortcutItem[] = [
    {
      name: 'Süreç Takip & Durum',
      path: '/takip',
      icon: ClipboardList,
      color: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
    },
    {
      name: 'Şablon Yönetimi',
      path: '/sablonlar',
      icon: LayoutTemplate,
      color: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
    },
    {
      name: 'Yardım & Kılavuzlar',
      path: '/yardim',
      icon: HelpCircle,
      color: 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
    }
  ]

  const renderLink = (item: ShortcutItem): React.JSX.Element => (
    <ShortcutLink key={item.path} item={item} isActive={currentPath === item.path.split('?')[0]} />
  )

  const userInitials = getInitials(adminName || '')
  const profileLabel = `Kullanıcı: ${adminUsername} (Profil)${institutionName ? ` — ${institutionName}` : ''}`

  return (
    <nav
      aria-label="Hızlı erişim"
      data-testid="active-file-rail"
      className="h-full min-h-0 w-16 bg-white dark:bg-slate-900 border-r border-slate-250 dark:border-slate-800/80 flex flex-col py-4 short:py-2 shrink-0 z-30 select-none"
    >
      {/* Üst: Ana gezinme — sığmazsa yalnızca bu bölüm kayar */}
      <div
        data-testid="rail-scroll"
        tabIndex={-1}
        className="flex-1 min-h-28 short:min-h-20 w-full flex flex-col items-center gap-2.5 short:gap-1.5 px-2 py-1 overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar"
        style={{ scrollbarWidth: 'thin' }}
      >
        {primaryItems.map(renderLink)}
      </div>

      {/* Alt: ikincil gezinme ve profil — her zaman görünür */}
      <div
        data-testid="rail-footer"
        className="w-full shrink-0 flex flex-col items-center gap-2.5 short:gap-1.5 px-2 pt-2"
      >
        <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1 short:my-0" />
        {secondaryItems.map(renderLink)}

        {/* Kullanıcı Profili (PP) */}
        {adminUsername && (
          <Link
            to="/profil"
            aria-label={profileLabel}
            data-testid="rail-profile"
            {...profileHandlers}
            className={cn(
              'w-10 h-10 short:w-8 short:h-8 shrink-0 rounded-full flex items-center justify-center font-extrabold text-[11px] transition-all duration-200 border cursor-pointer relative mt-1.5 short:mt-0 overflow-hidden bg-white dark:bg-slate-900',
              currentPath === '/profil'
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:scale-105'
            )}
          >
            {institutionLogo ? (
              <img
                src={institutionLogo}
                alt="Kurum logosu"
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              userInitials
            )}
          </Link>
        )}
        <RailTooltip tip={profileTip}>{profileLabel}</RailTooltip>
      </div>
    </nav>
  )
}
