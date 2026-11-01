import React from 'react'
import {
  DocumentPage,
  TemplateEditProvider,
  TemplateKey
} from '@temin360/document-templates'
import { DocumentRendererComponentProps } from '../types/contracts'
import { TemplateErrorBoundary } from './TemplateErrorBoundary'

export interface DefaultDocumentRendererProps
  extends DocumentRendererComponentProps<Record<string, unknown>> {
  templateKey: TemplateKey | string
}

/**
 * Genel Belge Çizim Bileşeni
 */
export function DefaultDocumentRenderer(props: DefaultDocumentRendererProps): React.JSX.Element {
  const {
    templateKey,
    data,
    orientation = 'portrait',
    chrome = 'paper',
    scale = 1,
    isEditing = false,
    onFieldChange,
    personelListesi = [],
    firmaListesi = [],
    birimListesi = [],
    firstPageLimit,
    className = '',
    style = {},
    containerRef
  } = props

  const isLandscape = orientation === 'landscape'
  const resolvedFirstPageLimit =
    firstPageLimit ?? (data && typeof data === 'object' && 'firstPageLimit' in data
      ? Number((data as any).firstPageLimit)
      : undefined)

  const resolvedPersonelListesi =
    (personelListesi && personelListesi.length > 0
      ? personelListesi
      : (data as any)?.personelListesi || (typeof window !== 'undefined' ? (window as any)?.__activePersonelListesi : [])) || []
  const resolvedFirmaListesi =
    (firmaListesi && firmaListesi.length > 0
      ? firmaListesi
      : (data as any)?.firmaListesi || (typeof window !== 'undefined' ? (window as any)?.__activeFirmaListesi : [])) || []
  const resolvedBirimListesi =
    (birimListesi && birimListesi.length > 0
      ? birimListesi
      : (data as any)?.birimListesi || (typeof window !== 'undefined' ? (window as any)?.__activeBirimListesi : [])) || []

  const content = (
    <TemplateEditProvider
      isEditing={isEditing}
      onFieldChange={onFieldChange}
      personelListesi={resolvedPersonelListesi}
      firmaListesi={resolvedFirmaListesi}
      birimListesi={resolvedBirimListesi}
      firstPageLimit={resolvedFirstPageLimit}
    >
      <DocumentPage
        templateKey={templateKey as TemplateKey}
        data={data as any}
        orientation={orientation}
      />
    </TemplateEditProvider>
  )

  if (chrome === 'bare') {
    return (
      <div
        className={`default-document-bare ${className}`}
        style={{
          width: isLandscape ? '297mm' : '210mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          ...style
        }}
      >
        <TemplateErrorBoundary>{content}</TemplateErrorBoundary>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`default-document-paper select-none flex flex-col items-center gap-8 py-8 ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.15s ease-out',
        ...style
      }}
    >
      <TemplateErrorBoundary>{content}</TemplateErrorBoundary>
    </div>
  )
}
