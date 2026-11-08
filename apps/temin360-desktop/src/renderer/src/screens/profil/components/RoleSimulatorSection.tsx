import React from 'react'
import { ShieldCheck, UserCheck, Check, Sparkles, AlertCircle } from 'lucide-react'
import {
  KAMU_USER_ROLES,
  KamuUserRole,
  useWorkspaceContextStore
} from '@renderer/store/workspaceContextStore'

export const RoleSimulatorSection: React.FC = () => {
  const { userRoles, setUserRoles } = useWorkspaceContextStore()

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            Kamu Görevi &amp; Yetki Alanı Yönetimi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            5018 Sayılı Kamu Mali Yönetimi ve Kontrol Kanunu gereğince çalışma masası işlem yetkileri,
            onay adımları ve görev tanımı.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Aktif Görev: Tanımlı
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(KAMU_USER_ROLES).map((role) => {
          const isSelected = userRoles.includes(role.key)
          return (
            <div
              key={role.key}
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
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: role.color }}
                    />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {role.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {role.code}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {role.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">
                  {isSelected ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={13} /> Aktif Yetki
                    </span>
                  ) : (
                    'Seçmek için tıkla'
                  )}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}
                >
                  {isSelected ? 'SEÇİLİ' : 'GEÇİŞ YAP'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

