import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react'
import {
  KAMU_USER_ROLES,
  KamuUserRole,
  useWorkspaceContextStore
} from '@renderer/store/workspaceContextStore'
import { Link } from '@tanstack/react-router'

interface RoleSimulatorPopoverProps {
  placement?: 'top' | 'bottom' | 'top-right' | 'bottom-right'
  compact?: boolean
  showLabel?: boolean
  className?: string
}

export const RoleSimulatorPopover: React.FC<RoleSimulatorPopoverProps> = ({
  placement = 'bottom-right',
  compact = false,
  showLabel = true,
  className = ''
}) => {
  const { userRoles, setUserRoles } = useWorkspaceContextStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Aktif rollerin birincil tanımı
  const currentRoleKey = userRoles[0] || 'admin'
  const currentRoleDef = KAMU_USER_ROLES[currentRoleKey] || KAMU_USER_ROLES.admin

  // Dışarı tıklandığında kapanma
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Konumlandırma sınıfları
  const getPlacementClass = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full left-0 mb-2'
      case 'top-right':
        return 'bottom-full right-0 mb-2'
      case 'bottom':
        return 'top-full left-0 mt-2'
      case 'bottom-right':
      default:
        return 'top-full right-0 mt-2'
    }
  }

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Tetikleyici Buton */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${currentRoleDef.badgeBg} hover:opacity-90 active:scale-95 shadow-2xs`}
        title={`Aktif Kamu Rolü: ${currentRoleDef.name} (Yetki simülasyonu için tıkla)`}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: currentRoleDef.color }}
        />
        <UserCheck size={13} className="shrink-0" />
        {showLabel && (
          <span className="truncate max-w-[130px]">{currentRoleDef.name}</span>
        )}
        <ChevronDown
          size={12}
          className={`opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Menü */}
      {isOpen && (
        <div
          className={`absolute ${getPlacementClass()} w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-[100] backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150 select-none text-left`}
        >
          {/* Başlık */}
          <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Kamu Rolü &amp; Yetki Simülasyonu
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                5018 RBAC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Görevler Ayrılığı ilkesine göre çalışma masası menü ve işlem yetkilerini simüle edin:
            </p>
          </div>

          {/* Rol Seçenekleri */}
          <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar">
            {Object.values(KAMU_USER_ROLES).map((role) => {
              const isSelected = userRoles.includes(role.key)
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => {
                    if (role.key === 'admin') {
                      setUserRoles([
                        'admin',
                        'satin_alma',
                        'mali_hizmetler',
                        'muhasebe',
                        'harcama_yetkilisi'
                      ])
                    } else {
                      setUserRoles([role.key])
                    }
                    setIsOpen(false)
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-start gap-2.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300/80 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: role.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{role.name}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {role.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5 line-clamp-2">
                      {role.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Alt Bilgi & Profil Sayfasına Yönlendirme */}
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span className="truncate">Sistem Yönetici Profili</span>
            <Link
              to="/profil"
              onClick={() => setIsOpen(false)}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Profil Yönetimi</span>
              <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
