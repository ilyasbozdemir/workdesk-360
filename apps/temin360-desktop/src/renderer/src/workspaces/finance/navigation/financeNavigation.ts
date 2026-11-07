import {
  Coins,
  Scale,
  Calculator,
  FolderInput,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react'
import { FinancialServicesPermission } from '../modules/financial-services/permissions'

export interface FinanceNavItem {
  id: string
  label: string
  shortLabel: string
  icon: any
  badge?: string
  badgeVariant?: 'blue' | 'emerald' | 'amber' | 'purple'
  permission?: FinancialServicesPermission
  description: string
}

export const FINANCE_SERVICES_NAVIGATION: FinanceNavItem[] = [
  {
    id: 'incoming-procurements',
    label: 'Satın Alma Gelen Dosyalar',
    shortLabel: 'Gelen Dosyalar',
    icon: FolderInput,
    badge: '4734 ➔ 5018',
    badgeVariant: 'blue',
    permission: 'finance:procurement_receive',
    description: 'Doğrudan temin ve ihalelerden mali onay için aktarılan dosyalar'
  },
  {
    id: 'budget-tracking',
    label: 'Analitik Bütçe & Ödenek Masası',
    shortLabel: 'Bütçe & Ödenek',
    icon: Coins,
    badge: 'Tertip',
    badgeVariant: 'emerald',
    permission: 'finance:budget_view',
    description: 'Kurumsal, fonksiyonel ve ekonomik kodlar, ödenek bloke takibi'
  },
  {
    id: 'compliance-check',
    label: '22/d Limit & %10 KİK Kota Masası',
    shortLabel: 'Limit & Kota',
    icon: Scale,
    badge: 'Md. 62/ı',
    badgeVariant: 'amber',
    permission: 'finance:compliance_check',
    description: '22/d parasal limit eşikleri ve bütçenin %10 KİK doğrudan temin kotası'
  },
  {
    id: 'tax-deductions',
    label: 'Vergi, Karar Pulu & Tevkifat Hesabı',
    shortLabel: 'Vergi & Kesintiler',
    icon: Calculator,
    badge: '‰ 9,48',
    badgeVariant: 'purple',
    permission: 'finance:tax_calc',
    description: 'Damga vergisi, karar pulu ve KDV tevkifat oranları hesaplama aracı'
  }
]
