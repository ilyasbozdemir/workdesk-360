import React from 'react'
import { TemplateRegistry, InvalidTemplateKeyError } from './TemplateRegistry'
import { DocumentRendererComponentProps } from './types/contracts'

export interface DocumentRendererProps<K extends string = string>
  extends DocumentRendererComponentProps {
  templateKey: K
  registry?: TemplateRegistry
}

/**
 * Belge Çizim Yönlendiricisi (DocumentRenderer)
 * - Verilen templateKey üzerinden TemplateRegistry'deki ilgili belge tanımını bulur.
 * - İlgili şablonun kendine ait renderer bileşenini çalıştırır.
 * - Bilinmeyen şablon kimlikleri için sessizce başka belgeye yönlendirmez; açık hata fırlatır.
 * - İsteğe bağlı olarak instance tabanlı özel bir TemplateRegistry örneği kabul eder.
 */
export function DocumentRenderer(props: DocumentRendererProps): React.JSX.Element {
  const { templateKey, registry = TemplateRegistry.default } = props

  if (!registry.has(templateKey)) {
    throw new InvalidTemplateKeyError(templateKey)
  }

  const definition = registry.get(templateKey)
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
