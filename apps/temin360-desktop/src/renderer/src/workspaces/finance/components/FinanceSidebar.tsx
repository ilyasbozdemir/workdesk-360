import React, { useState } from 'react'
import {
  Coins,
  ChevronLeft,
  ChevronRight,
  Building2,
  PieChart,
  Layers,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  FileText,
  ShoppingCart
} from 'lucide-react'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { FINANCE_SERVICES_NAVIGATION } from '../navigation/financeNavigation'
import { ACCOUNTING_NAVIGATION } from '../navigation/accountingNavigation'
import { isValidTabForSection } from '../navigation/financeRegistry'

interface FinanceSidebarProps {
  activeTab: string
  onSelectTab: (tabId: string) => void
}

export const FinanceSidebar: React.FC<FinanceSidebarProps> = ({
  activeTab,
  onSelectTab
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const {
    activeFinanceSection,
    setActiveFinanceSection,
    setActiveWorkspace,
    canAccessFinancialServices,
    canAccessAccounting
  } = useWorkspaceContextStore()

  const handleSectionSwitch = (sec: 'financial-services' | 'accounting') => {
    setActiveFinanceSection(sec)
    if (!isValidTabForSection(activeTab, sec)) {
      onSelectTab('dashboard')
    }
  }

  const { institutionName, institutionLogo } = useSettingsStore()

  const navItems =
    activeFinanceSection === 'financial-services'
      ? FINANCE_SERVICES_NAVIGATION
      : ACCOUNTING_NAVIGATION

  return (
    <aside
      className={`h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-30 relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Daraltma / Genişletme Düğmesi */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 z-50 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        title={isCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex-1 p-3 overflow-y-auto space-y-4 min-h-0 custom-scrollbar">
        {/* Logo ve Kurum Başlığı */}
        <div className="flex items-center gap-2.5 px-2 py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            {institutionLogo ? (
              <img src={institutionLogo} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <Building2 size={18} />
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                {institutionName || 'Kamu Kurumu'}
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Mali Hizmetler &amp; Muhasebe
              </div>
            </div>
          )}
        </div>

        {/* Satın Alma Masasına (4734) Geçiş Butonu */}
        <button
          type="button"
          onClick={() => setActiveWorkspace('procurement')}
          className="w-full flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-xs font-bold transition-all hover:scale-[1.01] cursor-pointer"
          title="Satın Alma & Doğrudan Temin Çalışma Masasına Geç (4734 Sayılı Kanun)"
        >
          <ShoppingCart size={15} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Satın Alma Masası (4734)</span>}
        </button>

        {/* Modül / Bölüm Seçici (Mali Hizmetler vs Muhasebe) */}
        {!isCollapsed ? (
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => handleSectionSwitch('financial-services')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                activeFinanceSection === 'financial-services'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Mali Hizmetler
            </button>
            <button
              onClick={() => handleSectionSwitch('accounting')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                activeFinanceSection === 'accounting'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Muhasebe
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() =>
                handleSectionSwitch(
                  activeFinanceSection === 'financial-services' ? 'accounting' : 'financial-services'
                )
              }
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600"
              title={`Şu an: ${
                activeFinanceSection === 'financial-services' ? 'Mali Hizmetler' : 'Muhasebe'
              } (Değiştirmek için tıkla)`}
            >
              <ArrowRightLeft size={14} />
            </button>
          </div>
        )}

        {/* Ana Dashboard Butonu */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Mali Hizmetler & Muhasebe Dashboard"
        >
          <PieChart size={16} className="shrink-0" />
          {!isCollapsed && <span className="flex-1">Mali Dashboard</span>}
        </button>

        {/* Dinamik Bölüm Menüsü */}
        <div className="space-y-1 pt-1">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {activeFinanceSection === 'financial-services'
                ? '5018 Mali Yönetim & Bütçe'
                : 'Merkezi Yönetim Muhasebe'}
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={item.label}
              >
                <Icon size={16} className="shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.shortLabel}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Alt Bilgi */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-[10px]">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>5018 Sayılı Kanun Uyumlu</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-tight">
            Kamu Mali Yönetimi ve Kontrol Kanunu
          </p>
        </div>
      )}
    </aside>
  )
}

