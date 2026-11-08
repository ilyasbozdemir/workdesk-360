import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  ExternalLink,
  ArrowRight,
  User,
  Sparkles
} from 'lucide-react'
import {
  KAMU_USER_ROLES,
  KamuUserRole,
  useWorkspaceContextStore
} from '@renderer/store/workspaceContextStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { getInitials } from '@renderer/utils/formatters'
import { Link, useNavigate } from '@tanstack/react-router'

interface RoleSimulatorPopoverProps {
  placement?: 'top' | 'bottom' | 'top-right' | 'bottom-right'
  compact?: boolean
  showLabel?: boolean
  className?: string
  children?: React.ReactNode
}

export const RoleSimulatorPopover: React.FC<RoleSimulatorPopoverProps> = ({
  placement = 'bottom-right',
  compact = false,
  showLabel = true,
  className = '',
  children
}) => {
  const { userRoles, setUserRoles } = useWorkspaceContextStore()
  const { adminName, adminUsername, adminTitle } = useSettingsStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Aktif rollerin birincil tanımı
  const currentRoleKey = userRoles[0] || 'admin'
  const currentRoleDef = KAMU_USER_ROLES[currentRoleKey] || KAMU_USER_ROLES.admin
  const displayName = adminName || adminUsername || 'Sistem Yöneticisi'
  const initials = getInitials(displayName)

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
      {/* Tetikleyici: Eğer children verilmişse onu kullan, yoksa kibar varsayılan rozet */}
      {children ? (
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="cursor-pointer"
          role="button"
          tabIndex={0}
        >
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${currentRoleDef.badgeBg} hover:opacity-90 active:scale-95 shadow-2xs`}
          title={`Kullanıcı Menüsü: ${displayName} (${currentRoleDef.name})`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: currentRoleDef.color }}
          />
          <UserCheck size={13} className="shrink-0" />
          {showLabel && <span className="truncate max-w-[130px]">{currentRoleDef.name}</span>}
          <ChevronDown
            size={12}
            className={`opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Popover Menü */}
      {isOpen && (
        <div
          className={`absolute ${getPlacementClass()} w-84 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-[100] backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150 select-none text-left`}
        >
          {/* 1. Kullanıcı Kimlik Kartı & Profil Başlığı */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 relative">
                <span>{initials}</span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900"
                  style={{ backgroundColor: currentRoleDef.color }}
                  title={`Aktif Kamu Rolü: ${currentRoleDef.name}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {displayName}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {adminTitle || 'Kamu Görevlisi & Yetkili'}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-400">Mevcut Rol:</span>
              <span className={`px-2 py-0.5 rounded font-bold truncate max-w-[170px] ${currentRoleDef.badgeBg}`}>
                {currentRoleDef.name}
              </span>
            </div>
          </div>

          {/* 2. Rol Simülasyonu Başlığı */}
          <div className="px-1 py-1 flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <SlidersHorizontal size={11} className="text-slate-400" />
              <span>Görevler Ayrılığı Simülasyonu</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              5018 RBAC
            </span>
          </div>

          {/* 3. Rol Seçenekleri */}
          <div className="space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar pr-0.5">
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
                    <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5 line-clamp-1">
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

          {/* 4. Alt Buton: Doğrudan Profil & Güvenlik Sayfasına Git */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate({ to: '/profil' })
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-xs font-bold transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <UserCheck size={14} />
              <span>Profil &amp; Güvenlik Sayfasına Git</span>
              <ArrowRight size={13} className="ml-auto opacity-70" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
