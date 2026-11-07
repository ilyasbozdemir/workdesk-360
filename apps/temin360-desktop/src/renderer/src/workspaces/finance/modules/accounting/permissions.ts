/**
 * Muhasebe & Kesin Hesap (5018 & Merkezi Yönetim Muhasebe) Modülü İzin ve Yetki Sözleşmesi
 * Bu yetkiler Mali Hizmetler modülünden bağımsızdır ve tek başına denetlenebilir.
 */

export type AccountingPermission =
  | 'accounting:view'
  | 'accounting:mif_create'
  | 'accounting:mif_approve'
  | 'accounting:oeb_payment'
  | 'accounting:escrow_manage'
  | 'accounting:guarantee_manage'
  | 'accounting:journal_entry'
  | 'accounting:official_export'

export const ACCOUNTING_PERMISSIONS: Record<
  AccountingPermission,
  { label: string; description: string }
> = {
  'accounting:view': {
    label: 'Muhasebe Masasını Görüntüleme',
    description: 'Muhasebe fişleri, yevmiye kayıtları ve teminat masasına erişim sağlar.'
  },
  'accounting:mif_create': {
    label: 'MİF Düzenleme',
    description: 'Muhasebe İşlem Fişi taslağı oluşturur ve borç/alacak kodlarını bağlar.'
  },
  'accounting:mif_approve': {
    label: 'MİF Onaylama',
    description: 'Muhasebe yetkilisi sıfatıyla MİF kaydını onaylar.'
  },
  'accounting:oeb_payment': {
    label: 'ÖEB Ödeme Emri İcrası',
    description: 'Ödeme emri belgesini vezne/banka ödeme listesine alır.'
  },
  'accounting:escrow_manage': {
    label: 'Emanet Hesap Yönetimi',
    description: '333/320 emanet hesap kayıtlarını yönetir ve mahsup işlemi yapar.'
  },
  'accounting:guarantee_manage': {
    label: 'Teminat Mektubu Takibi',
    description: 'Geçici ve kesin teminat mektuplarının banka teyit ve iade süreçlerini yönetir.'
  },
  'accounting:journal_entry': {
    label: 'Yevmiye Kaydı Oluşturma',
    description: 'Yevmiye defterine resmî muhasebe maddesi işler.'
  },
  'accounting:official_export': {
    label: 'Resmî Matbu Belge Üretme',
    description: 'Hazine ve Maliye Bakanlığı Muhasebat GM formatında A4 çıktı üretir.'
  }
}

export function checkAccountingPermission(
  userRoles: string[],
  permission: AccountingPermission
): boolean {
  if (userRoles.includes('admin') || userRoles.includes('harcama_yetkilisi')) return true
  if (userRoles.includes('muhasebe')) return true
  // Görüntüleme yetkisi mali hizmetlere de açıktır
  if (userRoles.includes('mali_hizmetler') && permission === 'accounting:view') return true
  return false
}

