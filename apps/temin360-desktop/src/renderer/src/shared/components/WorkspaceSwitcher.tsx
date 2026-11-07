import React, { useState } from 'react'
import {
  ShoppingCart,
  Coins,
  ShieldCheck,
  ChevronDown,
  Lock,
  Sparkles,
  ArrowRightLeft,
  UserCheck
} from 'lucide-react'
import {
  useWorkspaceContextStore,
  KAMU_USER_ROLES,
  KamuUserRole
} from '@renderer/store/workspaceContextStore'

export const WorkspaceSwitcher: React.FC = () => {
  const {
    activeWorkspace,
    setActiveWorkspace,
    userRoles,
    setUserRoles,
    canAccessProcurement,
    canAccessFinance
  } = useWorkspaceContextStore()

  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const hasProcurementAccess = canAccessProcurement()
  const hasFinanceAccess = canAccessFinance()

  const handleSwitch = (target: 'procurement' | 'finance') => {
    setActiveWorkspace(target)
  }

  // Aktif rollerin birincil başlığı
  const currentRoleKey = userRoles[0] || 'admin'
  const currentRoleDef = KAMU_USER_ROLES[currentRoleKey] || KAMU_USER_ROLES.admin

  return (
    <div className="flex items-center gap-2 select-none" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      {/* 2'li Çalışma Masası Toggle Düğmesi */}
      <div className="flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 shadow-inner">
        {/* Satın Alma Masası Butonu */}
        <button
          type="button"
          onClick={() => handleSwitch('procurement')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeWorkspace === 'procurement'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-[1.02]'
              : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="Satın Alma & Doğrudan Temin Çalışma Masası (4734 Sayılı Kamu İhale Kanunu)"
        >
          <ShoppingCart size={13} className="shrink-0" />
          <span>Satın Alma (4734)</span>
        </button>

        {/* Mali Hizmetler & Muhasebe Masası Butonu */}
        <button
          type="button"
          onClick={() => handleSwitch('finance')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeWorkspace === 'finance'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 scale-[1.02]'
              : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title="Mali Hizmetler & Muhasebe Çalışma Masası (5018 Sayılı Kamu Mali Yönetimi Kanunu)"
        >
          <Coins size={13} className="shrink-0" />
          <span>Mali Hizmetler (5018)</span>
        </button>
      </div>

      {/* Rol Simülatörü ve Yetki Göstergesi Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowRoleMenu((prev) => !prev)}
          className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${currentRoleDef.badgeBg}`}
          title="Kullanıcı Rolü ve Yetki Grubu"
        >
          <UserCheck size={12} />
          <span className="hidden xl:inline max-w-[120px] truncate">{currentRoleDef.name}</span>
          <span className="xl:hidden">{currentRoleDef.code}</span>
          <ChevronDown size={11} className="opacity-70" />
        </button>

        {showRoleMenu && (
          <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-60 backdrop-blur-md">
            <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Kamu Rolü &amp; Yetki Simülasyonu
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                5018 Görevler Ayrılığı ilkesine göre çalışma masası yetkilerini test edin:
              </p>
            </div>

            <div className="space-y-1">
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
                      setShowRoleMenu(false)
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2 ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: role.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-bold">{role.name}</span>
                        <span className="text-[9px] font-mono opacity-60 shrink-0">{role.code}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
                        {role.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
