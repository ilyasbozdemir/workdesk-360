import { DocumentPreviewTab } from '../../../../store/globalDocumentPreviewStore'
import { DocumentSource } from './document-engine/types'

export type { DocumentSource } from './document-engine/types'

export interface DocumentPreviewModalV3Props {
  isOpen: boolean
  documentId?: string | null
  dosyaId?: number | null
  /** Yeni nesil genel belge kaynağı (ihtiyacRaporu veya dosya) */
  source?: DocumentSource
  /** Başlangıçta açılacak şablon kimliği */
  initialTemplateId?: string
  invitedFirms?: unknown[]
  selectedFirma?: unknown
  initialData?: Record<string, unknown>
  onClose: () => void
  isModal?: boolean
  backLabel?: string
  tabs?: DocumentPreviewTab[]
  activeTabId?: string | null
  onSwitchTab?: (tabId: string) => void
  onCloseTab?: (tabId: string) => void
  onAddTab?: (params: {
    documentId: string
    dosyaId?: number | null
    documentTitle?: string
  }) => void
  /** İsteğe bağlı aşama kimliği veya numarası (1: Hazırlık, 2: Araştırma, 3: Sipariş, 4: Kabul) */
  currentStage?: number | string
  stage?: number | string
  /** Yüzen balon modunda render et */
  isBalloon?: boolean
  /** Balon modunu değiştirme / genişletme tetikleyicisi */
  onToggleBalloon?: () => void
}

export interface Personel {
  id: number
  ad_soyad: string
  unvan?: string
  telefon?: string
  eposta?: string
}

export interface Firma {
  id: number
  temin_firma_id?: number
  unvan: string
  yetkili_ad_soyad?: string
  telefon?: string
  eposta?: string
  total?: number
  isWinner?: boolean
  label?: string
}
