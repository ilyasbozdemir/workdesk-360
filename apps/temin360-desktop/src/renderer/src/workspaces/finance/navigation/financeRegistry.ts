import React from 'react'
import {
  LayoutDashboard,
  FolderInput,
  Coins,
  Scale,
  Calculator,
  Hammer,
  FileText,
  Receipt,
  ShieldCheck,
  BookMarked,
  LucideIcon
} from 'lucide-react'
import { FinanceDashboard } from '../dashboard/FinanceDashboard'
import { IncomingProcurementsPage } from '../modules/financial-services/pages/IncomingProcurementsPage'
import { BudgetAppropriationPage } from '../modules/financial-services/pages/BudgetAppropriationPage'
import { FinancialCompliancePage } from '../modules/financial-services/pages/FinancialCompliancePage'
import { TaxDeductionsPage } from '../modules/financial-services/pages/TaxDeductionsPage'
import { MifDraftsPage } from '../modules/accounting/pages/MifDraftsPage'
import { OebDraftsPage } from '../modules/accounting/pages/OebDraftsPage'
import { GuaranteesEscrowPage } from '../modules/accounting/pages/GuaranteesEscrowPage'
import { AccountingRecordsPage } from '../modules/accounting/pages/AccountingRecordsPage'
import HakedisScreen from '@renderer/screens/hakedis/HakedisScreen'
import ButceKodScreen from '@renderer/screens/butcekod/index.screen'

export type FinanceSectionScope = 'financial-services' | 'accounting' | 'all'

export interface FinancePageDefinition {
  id: string
  section: FinanceSectionScope
  title: string
  shortLabel: string
  breadcrumbLabel: string
  icon: LucideIcon
  badge?: string
  badgeVariant?: 'blue' | 'emerald' | 'amber' | 'purple'
  description?: string
  component: React.ComponentType<any>
}

export const FINANCE_PAGE_DEFINITIONS: FinancePageDefinition[] = [
  {
    id: 'dashboard',
    section: 'all',
    title: 'Mali & Muhasebe Kontrol Paneli',
    shortLabel: 'Mali Dashboard',
    breadcrumbLabel: 'Genel Göstergeler',
    icon: LayoutDashboard,
    description: 'Bütçe harcamaları, ödenek dengeleri ve bekleyen ödeme emirleri özeti',
    component: FinanceDashboard
  },
  // --- 5018 Mali Yönetim & Bütçe Masası ---
  {
    id: 'incoming-procurements',
    section: 'financial-services',
    title: 'Gelen Doğrudan Temin Dosyaları',
    shortLabel: 'Gelen Dosyalar',
    breadcrumbLabel: 'Gelen Doğrudan Temin Dosyaları',
    icon: FolderInput,
    badge: '4734 ➔ 5018',
    badgeVariant: 'blue',
    description: 'Doğrudan temin ve ihalelerden mali onay ve ödeme için aktarılan dosyalar',
    component: IncomingProcurementsPage
  },
  {
    id: 'budget-tracking',
    section: 'financial-services',
    title: 'Analitik Bütçe & Ödenek Masası',
    shortLabel: 'Bütçe & Ödenek',
    breadcrumbLabel: 'Analitik Bütçe Kodları',
    icon: Coins,
    badge: 'TERTİP',
    badgeVariant: 'emerald',
    description: 'Kurumsal, fonksiyonel ve ekonomik kodlar, ödenek bloke takibi',
    component: BudgetAppropriationPage
  },
  {
    id: 'budget-codes',
    section: 'financial-services',
    title: '4 Düzey Analitik Bütçe Kodları',
    shortLabel: 'Bütçe Kodları',
    breadcrumbLabel: 'Bütçe Kodları Rehberi',
    icon: Coins,
    badge: '4 DÜZEY',
    badgeVariant: 'emerald',
    description: 'Kurumsal, fonksiyonel, finansman ve ekonomik 4 düzey analitik bütçe kodları sözlüğü',
    component: ButceKodScreen
  },
  {
    id: 'compliance-check',
    section: 'financial-services',
    title: '22/d Limit & %10 KİK Kota Masası',
    shortLabel: 'Limit & Kota',
    breadcrumbLabel: '22/d & %10 KİK Kotası',
    icon: Scale,
    badge: 'MD. 62/I',
    badgeVariant: 'amber',
    description: '22/d parasal limit eşikleri ve bütçenin %10 KİK doğrudan temin kotası',
    component: FinancialCompliancePage
  },
  {
    id: 'tax-deductions',
    section: 'financial-services',
    title: 'Vergi, Karar Pulu & Tevkifat Hesabı',
    shortLabel: 'Vergi & Kesintiler',
    breadcrumbLabel: 'Vergi & Tevkifat Hesabı',
    icon: Calculator,
    badge: '‰ 9,48',
    badgeVariant: 'purple',
    description: 'Damga vergisi (‰9,48), karar pulu (‰5,69) ve KDV tevkifat oranları',
    component: TaxDeductionsPage
  },
  {
    id: 'hakedis-masasi',
    section: 'all',
    title: 'Hakediş & Yeşil Defter Masası',
    shortLabel: 'Hakediş Masası',
    breadcrumbLabel: 'Hakediş & Yeşil Defter Masası',
    icon: Hammer,
    badge: 'HAKEDİŞ',
    badgeVariant: 'purple',
    description: 'İmalat metrajları, fiyat farkı formülleri ve yasal kesinti hesaplamaları',
    component: HakedisScreen
  },
  // --- Merkezi Yönetim Muhasebe Masası ---
  {
    id: 'mif-drafts',
    section: 'accounting',
    title: 'Muhasebe İşlem Fişi (MİF)',
    shortLabel: 'MİF Masası',
    breadcrumbLabel: 'Muhasebe İşlem Fişleri (MİF)',
    icon: FileText,
    badge: 'MİF',
    badgeVariant: 'blue',
    description: 'Doğrudan temin ve mali süreçlerden üretilen resmî MİF kayıtları',
    component: MifDraftsPage
  },
  {
    id: 'oeb-drafts',
    section: 'accounting',
    title: 'Ödeme Emri Belgesi (ÖEB)',
    shortLabel: 'ÖEB Masası',
    breadcrumbLabel: 'Ödeme Emri Belgeleri (ÖEB)',
    icon: Receipt,
    badge: 'ÖEB',
    badgeVariant: 'emerald',
    description: 'Hazine ve Maliye Bakanlığı Muhasebat GM standartlarında ÖEB kayıtları',
    component: OebDraftsPage
  },
  {
    id: 'guarantees-escrow',
    section: 'accounting',
    title: 'Teminat Mektupları & Emanetler',
    shortLabel: 'Teminat & Emanet',
    breadcrumbLabel: 'Teminat & Emanetler',
    icon: ShieldCheck,
    badge: 'BANKA',
    badgeVariant: 'amber',
    description: 'Geçici/kesin teminat mektupları, banka teyitleri ve 333 emanet hesaplar',
    component: GuaranteesEscrowPage
  },
  {
    id: 'accounting-records',
    section: 'accounting',
    title: 'Yevmiye Defteri & Kayıt Hazırlığı',
    shortLabel: 'Yevmiye Kayıtları',
    breadcrumbLabel: 'Yevmiye Kayıtları',
    icon: BookMarked,
    badge: 'YEVMİYE',
    badgeVariant: 'emerald',
    description: 'BKMYBS ve Sayıştay denetimine uygun yevmiye maddeleri',
    component: AccountingRecordsPage
  }
]

export const FINANCE_PAGE_MAP: Record<string, FinancePageDefinition> = Object.fromEntries(
  FINANCE_PAGE_DEFINITIONS.map((def) => [def.id, def])
)

export const DEFAULT_FINANCE_PAGE = FINANCE_PAGE_MAP['dashboard']

export function getFinancePage(tabId: string): FinancePageDefinition {
  return FINANCE_PAGE_MAP[tabId] || DEFAULT_FINANCE_PAGE
}

export function isValidTabForSection(
  tabId: string,
  section: 'financial-services' | 'accounting'
): boolean {
  const page = FINANCE_PAGE_MAP[tabId]
  if (!page) return false
  return page.section === 'all' || page.section === section
}

export function getPagesForSection(
  section: 'financial-services' | 'accounting'
): FinancePageDefinition[] {
  return FINANCE_PAGE_DEFINITIONS.filter(
    (def) => def.section === 'all' || def.section === section
  )
}

