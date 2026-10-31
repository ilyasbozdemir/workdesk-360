import React from 'react'
import type { TemplateKey } from '@temin360/document-templates'
import { TemplateRegistry, InvalidTemplateKeyError } from './TemplateRegistry'

export interface DocumentRendererProps<K extends TemplateKey | string = TemplateKey | string> {
  templateKey: K
  data: any
  orientation?: 'portrait' | 'landscape'
  chrome?: 'paper' | 'bare'
  scale?: number
  isEditing?: boolean
  onFieldChange?: (key: string, val: unknown) => void
  personelListesi?: unknown[]
  firmaListesi?: unknown[]
  birimListesi?: unknown[]
  firstPageLimit?: number
  className?: string
  style?: React.CSSProperties
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Genel Belge Çizim Yönlendiricisi (DocumentRenderer)
 * - Verilen templateKey üzerinden TemplateRegistry'deki ilgili belge tanımını bulur.
 * - İlgili şablonun kendine ait renderer bileşenini çalıştırır.
 * - Bilinmeyen şablon kimlikleri için açık InvalidTemplateKeyError fırlatır.
 */
export function DocumentRenderer<K extends TemplateKey | string = TemplateKey | string>(
  props: DocumentRendererProps<K>
): React.JSX.Element {
  const { templateKey } = props

  if (!TemplateRegistry.has(templateKey)) {
    throw new InvalidTemplateKeyError(templateKey)
  }

  const definition = TemplateRegistry.get(templateKey)
  const SpecificRenderer = definition.renderer

  return React.createElement(SpecificRenderer, {
    data: props.data,
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
