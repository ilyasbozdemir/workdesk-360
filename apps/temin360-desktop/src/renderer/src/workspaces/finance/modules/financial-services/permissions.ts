/**
 * Mali Hizmetler (5018 & Bütçe/Tahakkuk) Modülü İzin ve Yetki Sözleşmesi
 * Bu yetkiler Muhasebe modülünden tamamen bağımsızdır ve tek başına denetlenebilir.
 */

export type FinancialServicesPermission =
  | 'finance:view'
  | 'finance:budget_view'
  | 'finance:budget_block'
  | 'finance:compliance_check'
  | 'finance:tax_calc'
  | 'finance:procurement_receive'
  | 'finance:oeb_create'
  | 'finance:approve_stage'

export const FINANCIAL_SERVICES_PERMISSIONS: Record<
  FinancialServicesPermission,
  { label: string; description: string }
> = {
  'finance:view': {
    label: 'Mali Hizmetleri Görüntüleme',
    description: 'Mali hizmetler masası ve özet göstergelerine erişim sağlar.'
  },
  'finance:budget_view': {
    label: 'Bütçe Tertipleri İnceleme',
    description: 'Analitik bütçe kodları ve harcama durumlarını görüntüler.'
  },
  'finance:budget_block': {
    label: 'Ödenek Bloke Koyma',
    description: 'Satın alma dosyası için bütçe tertibinden bloke koyar.'
  },
  'finance:compliance_check': {
    label: 'KİK %10 & 22/d Uygunluk Kontrolü',
    description: '4734 sayılı Kanun Md. 62/ı kota ve parasal limit kontrolü yapar.'
  },
  'finance:tax_calc': {
    label: 'Yasal Kesinti Hesaplama',
    description: 'Damga vergisi, karar pulu ve KDV tevkifatı hesaplaması yapar.'
  },
  'finance:procurement_receive': {
    label: 'Satın Alma Dosyası Kabulü',
    description: 'Satın alma masasından gelen dosyaları mali incelemeye alır.'
  },
  'finance:oeb_create': {
    label: 'ÖEB Taslağı Düzenleme',
    description: 'Ödeme Emri Belgesi taslağını oluşturur ve tahakkuka bağlar.'
  },
  'finance:approve_stage': {
    label: 'Mali İnceleme Onayı',
    description: 'Dosyanın mali kontrolünü tamamlayıp harcama yetkilisine sevk eder.'
  }
}

export function checkFinancialPermission(
  userRoles: string[],
  permission: FinancialServicesPermission
): boolean {
  if (userRoles.includes('admin') || userRoles.includes('harcama_yetkilisi')) return true
  if (userRoles.includes('mali_hizmetler')) return true
  // Yalnızca görüntüleme için muhasebe de görebilir
  if (userRoles.includes('muhasebe') && permission === 'finance:view') return true
  return false
}
