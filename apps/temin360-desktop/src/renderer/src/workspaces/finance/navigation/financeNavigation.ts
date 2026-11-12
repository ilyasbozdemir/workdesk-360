import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  Coins,
  FileSpreadsheet,
  FolderInput,
  FolderOpen,
  Hammer,
  Scale,
} from "lucide-react";
import { FinancialServicesPermission } from "../modules/financial-services/permissions";

export interface FinanceNavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: any;
  badge?: string;
  badgeVariant?: "blue" | "emerald" | "amber" | "purple";
  permission?: FinancialServicesPermission;
  description: string;
}

export const FINANCE_SERVICES_NAVIGATION: FinanceNavItem[] = [
  {
    id: "incoming-procurements",
    label: "Satın Alma Gelen Dosyalar",
    shortLabel: "Gelen Dosyalar",
    icon: FolderInput,
    badge: "4734 ➔ 5018",
    badgeVariant: "blue",
    permission: "finance:procurement_receive",
    description:
      "Doğrudan temin ve ihalelerden mali onay için aktarılan dosyalar",
  },
  {
    id: "dosyalar-ve-faturalari",
    label: "Dosyalar ve Faturaları",
    shortLabel: "Dosyalar & Faturalar",
    icon: FolderOpen,
    badge: "Fatura & Arama",
    badgeVariant: "emerald",
    permission: "finance:procurement_receive",
    description:
      "Tüm doğrudan temin dosyaları, bağlı fatura kayıtları, arama ve ödeme durumu",
  },
  {
    id: "budget-tracking",
    label: "Analitik Bütçe & Ödenek Masası",
    shortLabel: "Bütçe & Ödenek",
    icon: Coins,
    badge: "Tertip",
    badgeVariant: "emerald",
    permission: "finance:budget_view",
    description:
      "Kurumsal, fonksiyonel ve ekonomik kodlar, ödenek bloke takibi",
  },
  {
    id: "budget-codes",
    label: "4 Düzey Analitik Bütçe Kodları",
    shortLabel: "Bütçe Kodları",
    icon: BookOpen,
    badge: "4 Düzey",
    badgeVariant: "emerald",
    permission: "finance:budget_view",
    description:
      "Kurumsal, fonksiyonel, finansman ve ekonomik 4 düzey analitik bütçe kodları rehberi",
  },
  {
    id: "compliance-check",
    label: "22/d Limit & %10 KİK Kota Masası",
    shortLabel: "Limit & Kota",
    icon: Scale,
    badge: "Md. 62/ı",
    badgeVariant: "amber",
    permission: "finance:compliance_check",
    description:
      "22/d parasal limit eşikleri ve bütçenin %10 KİK doğrudan temin kotası",
  },
  {
    id: "tax-deductions",
    label: "Vergi, Karar Pulu & Tevkifat Hesabı",
    shortLabel: "Vergi & Kesintiler",
    icon: Calculator,
    badge: "‰ 9,48",
    badgeVariant: "purple",
    permission: "finance:tax_calc",
    description:
      "Damga vergisi, karar pulu ve KDV tevkifat oranları hesaplama aracı",
  },
  {
    id: "hakedis-masasi",
    label: "Hakediş & Yeşil Defter Masası",
    shortLabel: "Hakediş Masası",
    icon: Hammer,
    badge: "Hakediş",
    badgeVariant: "emerald",
    description:
      "Hakediş.org standardında yeşil defter, metraj ve tahakkuk icmali",
  },
  {
    id: "mevzuat-parametreleri",
    label: "Mevzuat ve Sistem Parametreleri",
    shortLabel: "Mevzuat & Parametreler",
    icon: Scale,
    badge: "4734/5018",
    badgeVariant: "amber",
    permission: "finance:compliance_check",
    description:
      "4734 Sayılı K.İ.K yasal limitlerini ve oranları buradan yönetebilirsiniz",
  },
  {
    id: "bkmybs-yonetim",
    label: "BKMYBS Bütçe Masası (7 Sekme)",
    shortLabel: "BKMYBS Paneli",
    icon: Coins,
    badge: "5018",
    badgeVariant: "emerald",
    permission: "finance:budget_view",
    description:
      "Bütçe, 22/d limit kotası, MİF & ÖEB, TKYS ve harcama sözleşmeleri",
  },
];
