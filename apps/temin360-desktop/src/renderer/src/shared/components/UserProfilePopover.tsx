import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  User,
  Settings,
  ShieldCheck,
  Check,
  LogOut,
  Building2,
  ExternalLink,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react'
import {
  KAMU_USER_ROLES,
  KamuUserRole,
  useWorkspaceContextStore
} from '@renderer/store/workspaceContextStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { getInitials } from '@renderer/utils/formatters'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '@renderer/constants/routeConstants'

export interface UserProfilePopoverProps {
  placement?: 'top' | 'bottom' | 'top-right' | 'bottom-right'
  compact?: boolean
  showLabel?: boolean
  className?: string
  children?: React.ReactNode
}

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  placement = 'bottom-right',
  compact = false,
  showLabel = true,
  className = '',
  children
}) => {
  const { userRoles, setUserRoles } = useWorkspaceContextStore()
  const { adminName, adminUsername, adminTitle, institutionName } = useSettingsStore()
  const { activeFilePath } = useWorkspaceStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Aktif kamu görevi / rolü
  const currentRoleKey = userRoles[0] || 'admin'
  const currentRoleDef = KAMU_USER_ROLES[currentRoleKey] || KAMU_USER_ROLES.admin
  const displayName = adminName || adminUsername || 'Sistem Yöneticisi'
  const initials = getInitials(displayName)

  // Dışarı tıklandığında menüyü kapat
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

  const handleSelectRole = (roleKey: KamuUserRole) => {
    if (roleKey === 'admin') {
      setUserRoles([
        'admin',
        'satin_alma',
        'mali_hizmetler',
        'muhasebe',
        'harcama_yetkilisi'
      ])
    } else {
      setUserRoles([roleKey])
    }
    setIsOpen(false)
  }

  const handleNavigate = (to: string) => {
    setIsOpen(false)
    navigate({ to })
  }

  const handleCloseWorkspace = () => {
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent('workspace-close-request'))
  }

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* Tetikleyici: Eğer children verilmişse onu kullan, yoksa kibar profil butonu */}
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
          className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold transition-all cursor-pointer shadow-2xs group"
          title={`Kullanıcı Menüsü: ${displayName}`}
        >
          <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
            {initials}
          </div>
          <span className="truncate max-w-[100px]">{displayName}</span>
          <ChevronDown
            size={11}
            className={`opacity-60 group-hover:opacity-100 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Modern Kullanıcı Profil & Görev Menüsü */}
      {isOpen && (
        <div
          className={`absolute ${getPlacementClass()} w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-[100] backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150 select-none text-left`}
        >
          {/* 1. Kullanıcı Bilgisi Başlık Kartı */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 relative">
                <span>{initials}</span>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900"
                  style={{ backgroundColor: currentRoleDef.color }}
                  title={`Aktif Görev: ${currentRoleDef.name}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </h4>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {adminTitle || institutionName || 'Kamu Yönetimi & Bütçe'}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-400">Aktif Görev:</span>
              <span className={`px-2 py-0.5 rounded font-bold truncate max-w-[170px] ${currentRoleDef.badgeBg}`}>
                {currentRoleDef.name}
              </span>
            </div>
          </div>

          {/* 2. Görev / Yetki Alanı Seçimi */}
          <div className="px-1.5 py-1 flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Briefcase size={11} className="text-slate-400" />
              <span>Çalışma Görevi &amp; Yetki</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              5018 / 4734
            </span>
          </div>

          <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
            {Object.values(KAMU_USER_ROLES).map((role) => {
              const isSelected = userRoles.includes(role.key)
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleSelectRole(role.key)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center gap-2.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300/80 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: role.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{role.name}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {role.code}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* 3. Menü Aksiyonları (Profil, Ayarlar, Çıkış) */}
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <button
              type="button"
              onClick={() => handleNavigate(APP_ROUTES.PROFIL)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <User size={14} className="text-blue-500 shrink-0" />
              <span>Profil ve Güvenlik Ayarları</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate(APP_ROUTES.AYARLAR)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <Settings size={14} className="text-slate-500 shrink-0" />
              <span>Sistem Ayarları</span>
            </button>

            {activeFilePath && (
              <button
                type="button"
                onClick={handleCloseWorkspace}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
              >
                <LogOut size={14} className="shrink-0" />
                <span>Çalışma Dosyasını Kapat</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
