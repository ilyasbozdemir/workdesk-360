import React from 'react'
import { TemplateKey } from '@temin360/document-templates'
import { TemplateRegistry, InvalidTemplateKeyError } from './TemplateRegistry'
import { DocumentRendererComponentProps } from './types/contracts'

export interface DocumentRendererProps<K extends TemplateKey | string = string>
  extends DocumentRendererComponentProps {
  templateKey: K
}

/**
 * Belge Çizim Yönlendiricisi (DocumentRenderer)
 * - Verilen templateKey üzerinden TemplateRegistry'deki ilgili belge tanımını bulur.
 * - İlgili şablonun kendine ait renderer bileşenini çalıştırır.
 * - Bilinmeyen şablon kimlikleri için sessizce başka belgeye yönlendirmez; açık hata fırlatır.
 */
export function DocumentRenderer(props: DocumentRendererProps): React.JSX.Element {
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

