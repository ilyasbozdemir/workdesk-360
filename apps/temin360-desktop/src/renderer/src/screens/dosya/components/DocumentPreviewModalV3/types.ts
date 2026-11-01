import { DocumentPreviewTab } from '../../../../store/globalDocumentPreviewStore'
import { TemplateOptionItem } from './templateResolver'

export type DocumentSource =
  | { kind: 'ihtiyacRaporu'; raporId: number }
  | { kind: 'dosya'; dosyaId: number; documentId?: string }

export interface DocumentResolveContext {
  invitedFirms?: unknown[]
  [key: string]: unknown
}

export interface DocumentResolveResult {
  resolvedData: Record<string, unknown>
  formData: Record<string, unknown>
  personelListesi?: unknown[]
  birimListesi?: unknown[]
  firmaListesi?: unknown[]
  dosyaRecord?: unknown
  raporRecord?: unknown
  activeLogoLeft?: boolean
  activeLogoRight?: boolean
  activeOrientation?: 'portrait' | 'landscape'
  initialSnapshotJson?: string
}

export interface DocumentResolver {
  templates(source: DocumentSource): Promise<TemplateOptionItem[]>
  resolve(
    source: DocumentSource,
    templateId: string,
    context?: DocumentResolveContext
  ): Promise<DocumentResolveResult>
}

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
