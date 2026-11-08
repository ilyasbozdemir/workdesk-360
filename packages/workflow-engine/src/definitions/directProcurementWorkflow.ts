import { WorkflowDefinition, WorkflowStateDefinition, WorkflowTransitionDefinition } from '../types'
import { ALL_STANDARD_RULES } from '../rules/standardRules'

export const DIRECT_PROCUREMENT_STATES: WorkflowStateDefinition[] = [
  {
    id: 'PROCUREMENT_DRAFT',
    name: 'procurement_draft',
    label: '1. İhtiyaç & Dosya Hazırlığı',
    category: 'PREPARATION',
    description: 'İhtiyaç listesi, teknik şartname ve onay belgesi hazırlık aşaması.',
    isInitial: true,
    allowedTransitions: ['T_START_MARKET_RESEARCH', 'T_CANCEL'],
    requiredDocuments: ['DOC_IHTIYAC_LISTESI', 'DOC_ONAY_BELGESI']
  },
  {
    id: 'MARKET_RESEARCH',
    name: 'market_research',
    label: '2. Piyasa Fiyat Araştırması',
    category: 'MARKET',
    description: 'Firma teklif mektuplarının toplanması, yaklaşık maliyet ve kazanan teklifin tespiti.',
    allowedTransitions: ['T_ASSIGN_WINNER_AND_ORDER', 'T_CANCEL'],
    requiredDocuments: ['DOC_PIYASA_FIYAT', 'DOC_TEKLIF_ISTEME']
  },
  {
    id: 'ORDER_CONTRACT',
    name: 'order_contract',
    label: '3. Sipariş & Sözleşme',
    category: 'ORDER',
    description: 'Yükleniciye sipariş mektubu tebliği veya sözleşme imzalanması ve teslimat süreci.',
    allowedTransitions: ['T_RECORD_ACCEPTANCE', 'T_CANCEL'],
    requiredDocuments: ['DOC_SIPARIS_MEKTUBU']
  },
  {
    id: 'INSPECTION_ACCEPTANCE',
    name: 'inspection_acceptance',
    label: '4. Muayene & Kabul',
    category: 'ACCEPTANCE',
    description: 'Teslim edilen mal/hizmetin komisyonca muayenesi ve kabul tutanağının tanzimi.',
    allowedTransitions: ['T_SEND_TO_FINANCE', 'T_CANCEL'],
    requiredDocuments: ['DOC_MUAYENE_KABUL']
  },
  {
    id: 'FINANCE_REVIEW',
    name: 'finance_review',
    label: '5. Mali Hizmetler İncelemesi',
    category: 'FINANCE',
    description: '5018 sayılı Kanun kapsamında mali uygunluk, vergi/kesinti hesabı ve ödenek kontrolü.',
    allowedTransitions: ['T_APPROVE_FINANCE_SEND_TO_ACCOUNTING', 'T_RETURN_FROM_FINANCE'],
    requiredDocuments: ['DOC_HARCAMA_TALIMATI']
  },
  {
    id: 'ACCOUNTING_PAYMENT',
    name: 'accounting_payment',
    label: '6. Muhasebe & Ödeme (MİF/ÖEB)',
    category: 'ACCOUNTING',
    description: 'Muhasebe İşlem Fişi ve Ödeme Emri Belgesi düzenlenerek bankaya aktarılması.',
    allowedTransitions: ['T_COMPLETE_PAYMENT', 'T_RETURN_FROM_ACCOUNTING'],
    requiredDocuments: ['DOC_ODEME_EMRI_BELGESI', 'DOC_MIF']
  },
  {
    id: 'COMPLETED',
    name: 'completed',
    label: '7. Süreç Tamamlandı',
    category: 'DONE',
    description: 'Dosyanın tüm yasal satın alma, kabul ve tahakkuk/ödeme süreçleri başarıyla sonuçlandı.',
    isTerminal: true,
    allowedTransitions: []
  },
  {
    id: 'RETURNED',
    name: 'returned',
    label: 'İade Edildi / Eksik Evrak',
    category: 'PREPARATION',
    description: 'Mali Hizmetler veya Muhasebe tarafından eksik evrak veya düzeltme gerekçesiyle iade edilen dosya.',
    allowedTransitions: ['T_RESUBMIT_TO_FINANCE', 'T_CANCEL']
  }
]

export const DIRECT_PROCUREMENT_TRANSITIONS: WorkflowTransitionDefinition[] = [
  {
    id: 'T_START_MARKET_RESEARCH',
    fromState: 'PROCUREMENT_DRAFT',
    toState: 'MARKET_RESEARCH',
    actionName: 'start_market_research',
    actionLabel: 'Piyasa Fiyat Araştırmasını Başlat',
    requiredRole: 'satin_alma',
    rules: ['RULE_ONAY_BELGESI_REQUIRED', 'RULE_BUDGET_CODE_CHECK'],
    targetAssigneeRole: 'satin_alma',
    createsTask: {
      title: 'Teklif Toplama ve Piyasa Fiyat Tespiti',
      description: 'İstekli firmalardan teklif toplayarak piyasa fiyat araştırma tutanağını düzenleyiniz.',
      requiredRole: 'satin_alma'
    },
    generatesNotification: {
      type: 'TASK_ASSIGNED',
      title: 'Piyasa Araştırması Başlatıldı',
      template: '{dosyaNo} numaralı dosya için piyasa fiyat araştırması başlatıldı.',
      notifyChannels: ['IN_APP']
    }
  },
  {
    id: 'T_ASSIGN_WINNER_AND_ORDER',
    fromState: 'MARKET_RESEARCH',
    toState: 'ORDER_CONTRACT',
    actionName: 'assign_winner_and_order',
    actionLabel: 'Kazanan Firmayı Belirle & Sipariş Ver',
    requiredRole: 'satin_alma',
    rules: ['RULE_WINNER_FIRM_ASSIGNED', 'RULE_MIN_QUOTES_RECOMMENDED'],
    targetAssigneeRole: 'satin_alma',
    createsTask: {
      title: 'Sipariş Mektubu Tebliği ve Teslimat Takibi',
      description: 'Kazanan yükleniciye sipariş formunu tebliğ edip teslimat süresini takip ediniz.',
      requiredRole: 'satin_alma'
    },
    generatesNotification: {
      type: 'TASK_ASSIGNED',
      title: 'Sipariş Aşamasına Geçildi',
      template: '{dosyaNo} numaralı dosyada yükleniciye sipariş verildi.',
      notifyChannels: ['IN_APP']
    }
  },
  {
    id: 'T_RECORD_ACCEPTANCE',
    fromState: 'ORDER_CONTRACT',
    toState: 'INSPECTION_ACCEPTANCE',
    actionName: 'record_acceptance',
    actionLabel: 'Mal/Hizmet Teslim Alındı (Muayene Aşamasını Başlat)',
    requiredRole: 'satin_alma',
    rules: [],
    targetAssigneeRole: 'satin_alma',
    createsTask: {
      title: 'Muayene ve Kabul Tutanağı Tanzimi',
      description: 'Teslim edilen ürünleri kontrol ederek Muayene Kabul Tutanağını imzalayınız.',
      requiredRole: 'satin_alma'
    }
  },
  {
    id: 'T_SEND_TO_FINANCE',
    fromState: 'INSPECTION_ACCEPTANCE',
    toState: 'FINANCE_REVIEW',
    actionName: 'send_to_finance',
    actionLabel: 'Mali Hizmetlere Sevk Et (Ödeme İncelemesi)',
    requiredRole: 'satin_alma',
    rules: ['RULE_MUAYENE_KABUL_REQUIRED', 'RULE_FATURA_INFORMATION_RECORDED'],
    targetAssigneeRole: 'mali_hizmetler',
    createsTask: {
      title: 'Mali Hizmetler Dosya İncelemesi ve Tahakkuk Hazırlığı',
      description: 'Satın alma dosyasının mevzuat ve ödenek uygunluğunu inceleyiniz.',
      requiredRole: 'mali_hizmetler'
    },
    generatesNotification: {
      type: 'FINANCE_REVIEW_REQUESTED',
      title: 'Mali İnceleme Bekleyen Yeni Dosya',
      template: '{dosyaNo} numaralı doğrudan temin dosyası mali inceleme için sevk edildi.',
      notifyChannels: ['IN_APP', 'EMAIL']
    }
  },
  {
    id: 'T_APPROVE_FINANCE_SEND_TO_ACCOUNTING',
    fromState: 'FINANCE_REVIEW',
    toState: 'ACCOUNTING_PAYMENT',
    actionName: 'approve_finance_send_to_accounting',
    actionLabel: 'Mali Uygunluğu Onayla ve Muhasebeye Sevk Et',
    requiredRole: 'mali_hizmetler',
    rules: [],
    targetAssigneeRole: 'muhasebe',
    createsTask: {
      title: 'Ödeme Emri Belgesi (ÖEB) ve MİF Düzenleme',
      description: 'Mali incelemesi tamamlanan dosya için MİF ve Ödeme Emri Belgesini düzenleyip ödemeyi gerçekleştiriniz.',
      requiredRole: 'muhasebe'
    },
    generatesNotification: {
      type: 'ACCOUNTING_REVIEW_REQUESTED',
      title: 'Muhasebeye Sevk Edilen Dosya',
      template: '{dosyaNo} numaralı dosya ödeme emri düzenlenmesi için muhasebeye iletildi.',
      notifyChannels: ['IN_APP']
    }
  },
  {
    id: 'T_RETURN_FROM_FINANCE',
    fromState: 'FINANCE_REVIEW',
    toState: 'RETURNED',
    actionName: 'return_from_finance',
    actionLabel: 'Eksik Evrak / Düzeltme Nedeniyle İade Et',
    requiredRole: 'mali_hizmetler',
    rules: [],
    targetAssigneeRole: 'satin_alma',
    createsTask: {
      title: 'İade Edilen Dosyada Eksiklikleri Giderme',
      description: 'Mali Hizmetler tarafından belirtilen eksiklikleri tamamlayıp dosyayı tekrar sevk ediniz.',
      requiredRole: 'satin_alma'
    },
    generatesNotification: {
      type: 'TASK_RETURNED',
      title: 'Dosya İade Edildi!',
      template: '{dosyaNo} numaralı dosya Mali Hizmetler tarafından iade edildi: {reason}',
      notifyChannels: ['IN_APP', 'EMAIL']
    }
  },
  {
    id: 'T_RESUBMIT_TO_FINANCE',
    fromState: 'RETURNED',
    toState: 'FINANCE_REVIEW',
    actionName: 'resubmit_to_finance',
    actionLabel: 'Düzeltmeleri Tamamla ve Mali Hizmetlere Tekrar Gönder',
    requiredRole: 'satin_alma',
    rules: ['RULE_MUAYENE_KABUL_REQUIRED', 'RULE_FATURA_INFORMATION_RECORDED'],
    targetAssigneeRole: 'mali_hizmetler',
    createsTask: {
      title: 'Yeniden Sevk Edilen Dosyayı İnceleme',
      description: 'Düzeltilen dosyanın kontrollerini yapınız.',
      requiredRole: 'mali_hizmetler'
    }
  },
  {
    id: 'T_COMPLETE_PAYMENT',
    fromState: 'ACCOUNTING_PAYMENT',
    toState: 'COMPLETED',
    actionName: 'complete_payment',
    actionLabel: 'Ödemeyi Gerçekleştir & Dosyayı Kapat',
    requiredRole: 'muhasebe',
    rules: [],
    generatesNotification: {
      type: 'WORKFLOW_COMPLETED',
      title: 'Dosya Başarıyla Tamamlandı',
      template: '{dosyaNo} numaralı dosyanın ödemesi tamamlandı ve dosya arşive alındı.',
      notifyChannels: ['IN_APP']
    }
  }
]

export const DIRECT_PROCUREMENT_WORKFLOW_DEFINITION: WorkflowDefinition = {
  id: 'WF_DIRECT_PROCUREMENT_4734_22D',
  version: 1,
  name: '4734 Sayılı KİK 22/d Doğrudan Temin Süreci',
  description: 'Satın Alma, Mali Hizmetler ve Muhasebe birimleri arasında uçtan uca doğrudan temin süreci.',
  entityType: 'DATA_TeminDosyasi',
  initialState: 'PROCUREMENT_DRAFT',
  states: DIRECT_PROCUREMENT_STATES,
  transitions: DIRECT_PROCUREMENT_TRANSITIONS,
  rules: ALL_STANDARD_RULES
}
