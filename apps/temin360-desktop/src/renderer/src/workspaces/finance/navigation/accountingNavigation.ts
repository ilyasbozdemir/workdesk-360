import {
  FileText,
  CreditCard,
  Building2,
  BookMarked,
  ShieldCheck,
  Receipt,
  FileCheck,
  Hammer,
  Scale,
  Coins
} from 'lucide-react'
import { AccountingPermission } from '../modules/accounting/permissions'

export interface AccountingNavItem {
  id: string
  label: string
  shortLabel: string
  icon: any
  badge?: string
  badgeVariant?: 'blue' | 'emerald' | 'amber' | 'purple'
  permission?: AccountingPermission
  description: string
}

export const ACCOUNTING_NAVIGATION: AccountingNavItem[] = [
  {
    id: 'mif-drafts',
    label: 'Muhasebe İşlem Fişi (MİF)',
    shortLabel: 'MİF Masası',
    icon: FileText,
    badge: 'MİF',
    badgeVariant: 'blue',
    permission: 'accounting:mif_create',
    description: 'Doğrudan temin ve mali süreçlerden üretilen resmî MİF kayıtları'
  },
  {
    id: 'oeb-drafts',
    label: 'Ödeme Emri Belgesi (ÖEB)',
    shortLabel: 'ÖEB Masası',
    icon: Receipt,
    badge: 'ÖEB',
    badgeVariant: 'emerald',
    permission: 'accounting:oeb_payment',
    description: 'Hazine ve Maliye Bakanlığı Muhasebat GM standartlarında ÖEB kayıtları'
  },
  {
    id: 'guarantees-escrow',
    label: 'Teminat Mektupları & Emanetler',
    shortLabel: 'Teminat & Emanet',
    icon: ShieldCheck,
    badge: 'Banka',
    badgeVariant: 'amber',
    permission: 'accounting:guarantee_manage',
    description: 'Geçici/kesin teminat mektupları, banka teyitleri ve 333 emanet hesaplar'
  },
  {
    id: 'accounting-records',
    label: 'Yevmiye Defteri & Kayıt Hazırlığı',
    shortLabel: 'Yevmiye Kayıtları',
    icon: BookMarked,
    badge: 'Yevmiye',
    badgeVariant: 'purple',
    permission: 'accounting:journal_entry',
    description: 'Merkezi yönetim hesap planı (630, 103, 360, 361) taslak kayıtları'
  },
  {
    id: 'hakedis-masasi',
    label: 'Hakediş & Yeşil Defter Masası',
    shortLabel: 'Hakediş Masası',
    icon: Hammer,
    badge: 'Hakediş',
    badgeVariant: 'emerald',
    permission: 'accounting:oeb_payment',
    description: 'Hakediş tahakkuk müzekkeresi, kesintiler ve yeşil defter icmali'
  },
  {
    id: 'mevzuat-parametreleri',
    label: 'Mevzuat ve Sistem Parametreleri',
    shortLabel: 'Mevzuat & Parametreler',
    icon: Scale,
    badge: '4734/5018',
    badgeVariant: 'amber',
    permission: 'accounting:guarantee_manage',
    description: 'KİK limitleri, vergi ve kesinti oranları, analitik bütçe parametreleri'
  },
  {
    id: 'bkmybs-yonetim',
    label: 'BKMYBS Bütçe Masası (7 Sekme)',
    shortLabel: 'BKMYBS Paneli',
    icon: Coins,
    badge: '5018',
    badgeVariant: 'emerald',
    permission: 'accounting:journal_entry',
    description: 'Analitik bütçe, 22/d kotası, MİF & ÖEB, emanetler ve sözleşmeler'
  }
]

