import React, { useState } from 'react'
import {
  FinanceSidebar
} from './components/FinanceSidebar'
import { FinanceDashboard } from './dashboard/FinanceDashboard'
import { IncomingProcurementsPage } from './modules/financial-services/pages/IncomingProcurementsPage'
import { BudgetAppropriationPage } from './modules/financial-services/pages/BudgetAppropriationPage'
import { FinancialCompliancePage } from './modules/financial-services/pages/FinancialCompliancePage'
import { TaxDeductionsPage } from './modules/financial-services/pages/TaxDeductionsPage'
import { MifDraftsPage } from './modules/accounting/pages/MifDraftsPage'
import { OebDraftsPage } from './modules/accounting/pages/OebDraftsPage'
import { GuaranteesEscrowPage } from './modules/accounting/pages/GuaranteesEscrowPage'
import { AccountingRecordsPage } from './modules/accounting/pages/AccountingRecordsPage'
import { OebMatbuModal } from '@renderer/screens/bkmybs-mali-yonetim/components/modals/OebMatbuModal'
import { MifKayit } from '@renderer/screens/bkmybs-mali-yonetim/types'
import { OebRecordItem, IncomingProcurementItem } from './types'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

export const FinanceWorkspace: React.FC = () => {
  const { activeFinanceTab, setActiveFinanceTab, activeFinanceSection, setActiveFinanceSection } =
    useWorkspaceContextStore()

  // Seçili belge için resmî matbu A4 çıktısı modalı
  const [selectedMatbuMif, setSelectedMatbuMif] = useState<MifKayit | null>(null)

  const handleSelectIncomingForOeb = (item: IncomingProcurementItem) => {
    setActiveFinanceSection('accounting')
    setActiveFinanceTab('oeb-drafts')
  }

  const handleSelectIncomingForMif = (item: IncomingProcurementItem) => {
    setActiveFinanceSection('accounting')
    setActiveFinanceTab('mif-drafts')
  }

  const handleOpenOebModal = (oeb: OebRecordItem) => {
    // OebRecordItem -> MifKayit adaptörü
    const adaptedMif: MifKayit = {
      id: oeb.id,
      mifNo: oeb.oebNo.replace('ÖEB', 'MİF'),
      dosyaId: oeb.dosyaId,
      dosyaNo: oeb.dosyaNo,
      tarih: oeb.tarih,
      aciklama: `${oeb.dosyaNo} Sayılı Doğrudan Temin Hak Sahibi Ödemesi`,
      alacakliUnvan: oeb.hakSahibiAdi,
      alacakliVkn: oeb.hakSahibiVkn,
      alacakliIban: oeb.hakSahibiIban,
      butceTertibi: oeb.butceTertibi,
      brutTutar: oeb.brutTutar,
      faturaNo: 'FAT-' + oeb.dosyaNo,
      faturaTarihi: oeb.tarih,
      kdvOrani: 20,
      kdvTutari: 0,
      damgaVergisiOrani: 0.00948,
      damgaVergisiTutari: oeb.damgaVergisi,
      kararPuluTutari: oeb.kararPulu,
      kdvTevkifatTutari: oeb.kdvTevkifat,
      digerKesintiler: 0,
      netOdenecekTutar: oeb.netOdenecekTutar,
      durum: 'onaylandi',
      hazirlayan: 'Mali Hizmetler',
      onaylayan: oeb.onaylayan || 'Harcama Yetkilisi'
    }
    setSelectedMatbuMif(adaptedMif)
  }

  const handleOpenMifModal = (mif: MifKayit) => {
    setSelectedMatbuMif(mif)
  }

  const renderActiveContent = () => {
    switch (activeFinanceTab) {
      case 'dashboard':
        return <FinanceDashboard onNavigateTab={setActiveFinanceTab} />
      case 'incoming-procurements':
        return (
          <IncomingProcurementsPage
            onSelectForOeb={handleSelectIncomingForOeb}
            onSelectForMif={handleSelectIncomingForMif}
          />
        )
      case 'budget-tracking':
        return <BudgetAppropriationPage />
      case 'compliance-check':
        return <FinancialCompliancePage />
      case 'tax-deductions':
        return <TaxDeductionsPage />
      case 'mif-drafts':
        return <MifDraftsPage onOpenMatbuMif={handleOpenMifModal} />
      case 'oeb-drafts':
        return <OebDraftsPage onOpenMatbuOeb={handleOpenOebModal} />
      case 'guarantees-escrow':
        return <GuaranteesEscrowPage />
      case 'accounting-records':
        return <AccountingRecordsPage />
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
              {activeFinanceSection === 'financial-services' ? 'Mali Hizmetler (5018)' : 'Muhasebe (BKMYBS)'}
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

      {/* Resmî A4 Matbu Belge Çıktı Modalı */}
      {selectedMatbuMif && (
        <OebMatbuModal
          onClose={() => setSelectedMatbuMif(null)}
          mif={selectedMatbuMif}
        />
      )}
    </div>
  )
}
