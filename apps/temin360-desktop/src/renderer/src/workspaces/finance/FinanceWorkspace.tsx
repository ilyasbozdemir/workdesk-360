import React, { useEffect } from 'react'
import { FinanceSidebar } from './components/FinanceSidebar'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'
import {
  getFinancePage,
  isValidTabForSection,
  DEFAULT_FINANCE_PAGE
} from './navigation/financeRegistry'

export const FinanceWorkspace: React.FC = () => {
  const { activeFinanceTab, setActiveFinanceTab, activeFinanceSection } =
    useWorkspaceContextStore()

  // Bölüm ve sekme tutarlılığını garanti et (geçersiz durumlarda güvenli varsayılana döner)
  useEffect(() => {
    if (!isValidTabForSection(activeFinanceTab, activeFinanceSection)) {
      setActiveFinanceTab('dashboard')
    }
  }, [activeFinanceSection, activeFinanceTab, setActiveFinanceTab])

  const currentPage = isValidTabForSection(activeFinanceTab, activeFinanceSection)
    ? getFinancePage(activeFinanceTab)
    : DEFAULT_FINANCE_PAGE

  const ActiveComponent = currentPage.component

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sol Özel Mali & Muhasebe Sidebar */}
      <FinanceSidebar activeTab={currentPage.id} onSelectTab={setActiveFinanceTab} />

      {/* Ana Çalışma Masası İçerik Alanı */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* İç Çalışma Masası Üst Bilgi Barı */}
        <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Mali Masası</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
              {activeFinanceSection === 'financial-services'
                ? 'Mali Hizmetler (5018)'
                : 'Muhasebe (BKMYBS)'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentPage.breadcrumbLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentPage.badge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {currentPage.badge}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Mali Oturum: Aktif
            </span>
          </div>
        </div>

        {/* Dinamik Sayfa İçeriği */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar min-h-0">
          <ActiveComponent onNavigateTab={setActiveFinanceTab} />
        </main>
      </div>
    </div>
  )
}
