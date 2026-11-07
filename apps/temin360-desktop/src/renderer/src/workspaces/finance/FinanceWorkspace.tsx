import React from 'react'
import { FinanceSidebar } from './components/FinanceSidebar'
import { FinanceDashboard } from './dashboard/FinanceDashboard'
import { IncomingProcurementsPage } from './modules/financial-services/pages/IncomingProcurementsPage'
import { BudgetAppropriationPage } from './modules/financial-services/pages/BudgetAppropriationPage'
import { FinancialCompliancePage } from './modules/financial-services/pages/FinancialCompliancePage'
import { TaxDeductionsPage } from './modules/financial-services/pages/TaxDeductionsPage'
import { MifDraftsPage } from './modules/accounting/pages/MifDraftsPage'
import { OebDraftsPage } from './modules/accounting/pages/OebDraftsPage'
import { GuaranteesEscrowPage } from './modules/accounting/pages/GuaranteesEscrowPage'
import { AccountingRecordsPage } from './modules/accounting/pages/AccountingRecordsPage'
import HakedisScreen from '@renderer/screens/hakedis/HakedisScreen'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

export const FinanceWorkspace: React.FC = () => {
  const { activeFinanceTab, setActiveFinanceTab, activeFinanceSection } =
    useWorkspaceContextStore()

  const renderActiveContent = () => {
    switch (activeFinanceTab) {
      case 'dashboard':
        return <FinanceDashboard onNavigateTab={setActiveFinanceTab} />
      case 'incoming-procurements':
        return <IncomingProcurementsPage />
      case 'budget-tracking':
        return <BudgetAppropriationPage />
      case 'compliance-check':
        return <FinancialCompliancePage />
      case 'tax-deductions':
        return <TaxDeductionsPage />
      case 'mif-drafts':
        return <MifDraftsPage />
      case 'oeb-drafts':
        return <OebDraftsPage />
      case 'guarantees-escrow':
        return <GuaranteesEscrowPage />
      case 'accounting-records':
        return <AccountingRecordsPage />
      case 'hakedis-masasi':
        return <HakedisScreen />
      default:
        return <FinanceDashboard onNavigateTab={setActiveFinanceTab} />
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sol Özel Mali & Muhasebe Sidebar */}
      <FinanceSidebar activeTab={activeFinanceTab} onSelectTab={setActiveFinanceTab} />

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
              {activeFinanceTab === 'dashboard'
                ? 'Genel Göstergeler'
                : activeFinanceTab === 'incoming-procurements'
                ? 'Gelen Doğrudan Temin Dosyaları'
                : activeFinanceTab === 'budget-tracking'
                ? 'Analitik Bütçe Kodları'
                : activeFinanceTab === 'compliance-check'
                ? '22/d & %10 KİK Kotası'
                : activeFinanceTab === 'tax-deductions'
                ? 'Vergi & Tevkifat Hesabı'
                : activeFinanceTab === 'mif-drafts'
                ? 'Muhasebe İşlem Fişleri (MİF)'
                : activeFinanceTab === 'oeb-drafts'
                ? 'Ödeme Emri Belgeleri (ÖEB)'
                : activeFinanceTab === 'guarantees-escrow'
                ? 'Teminat & Emanetler'
                : activeFinanceTab === 'hakedis-masasi'
                ? 'Hakediş & Yeşil Defter Masası'
                : 'Yevmiye Kayıtları'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Mali Oturum: Aktif
            </span>
          </div>
        </div>

        {/* Dinamik Sayfa İçeriği */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar min-h-0">
          {renderActiveContent()}
        </main>
      </div>
    </div>
  )
}
