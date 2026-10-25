import React from 'react'
import {
  TemplateData,
  TemplateKey
} from '@temin360/document-templates'
import { TemplateRegistry, InvalidTemplateKeyError } from './registry/TemplateRegistry'

export interface DocumentRendererProps<K extends TemplateKey = TemplateKey> {
  /**
   * Gösterilecek şablon kimliği (snake_case veya kebab-case)
   */
  templateKey: K
  /**
   * Şablona aktarılacak veri nesnesi
   */
  data: TemplateData<K>
  /**
   * Sayfa yönelimi
   */
  orientation?: 'portrait' | 'landscape'
  /**
   * Çizim biçimi:
   * - 'bare': Yalnızca saf sayfa (A4 210mm/297mm, yazdırma ve PDF için)
   * - 'paper': Gri zemin, gölge, kaydırma ve kağıt efekti (ekran önizlemesi için)
   */
  chrome?: 'paper' | 'bare'
  /**
   * Yakınlaştırma / ölçekleme katsayısı (varsayılan: 1)
   */
  scale?: number
  /**
   * Düzenleme modu aktif mi?
   */
  isEditing?: boolean
  /**
   * Alan değeri değiştiğinde tetiklenecek fonksiyon
   */
  onFieldChange?: (key: string, val: unknown) => void
  /**
   * Personel seçim listesi
   */
  personelListesi?: unknown[]
  /**
   * Firma seçim listesi
   */
  firmaListesi?: unknown[]
  /**
   * Birim seçim listesi
   */
  birimListesi?: unknown[]
  /**
   * İlk sayfa tablo satır limiti
   */
  firstPageLimit?: number
  /**
   * Kapsayıcı CSS sınıfları
   */
  className?: string
  /**
   * Kapsayıcı stil nesnesi
   */
  style?: React.CSSProperties
  /**
   * Kapsayıcı DOM referansı
   */
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Belge Çizim Yönlendiricisi (DocumentRenderer)
 * - Verilen templateKey üzerinden TemplateRegistry'deki ilgili belge tanımını bulur.
 * - İlgili şablonun kendine ait renderer bileşenini çalıştırır.
 * - Bilinmeyen şablon kimlikleri için sessizce başka belgeye yönlendirmez; açık hata fırlatır.
 */
export function DocumentRenderer<K extends TemplateKey = TemplateKey>(
  props: DocumentRendererProps<K>
): React.JSX.Element {
  const { templateKey } = props

  if (!TemplateRegistry.has(templateKey)) {
    throw new InvalidTemplateKeyError(templateKey)
  }

  const definition = TemplateRegistry.get(templateKey)
  const SpecificRenderer = definition.renderer

  return React.createElement(SpecificRenderer, {
    data: props.data as any,
    orientation: props.orientation,
    chrome: props.chrome,
    scale: props.scale,
    isEditing: props.isEditing,
    onFieldChange: props.onFieldChange,
    personelListesi: props.personelListesi,
    firmaListesi: props.firmaListesi,
    birimListesi: props.birimListesi,
    firstPageLimit: props.firstPageLimit,
    className: props.className,
    style: props.style,
    containerRef: props.containerRef
  })
}
