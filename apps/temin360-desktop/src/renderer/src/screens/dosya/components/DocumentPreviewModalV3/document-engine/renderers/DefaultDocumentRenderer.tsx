import React from 'react'
import {
  DocumentPage,
  TemplateEditProvider,
  TemplateKey
} from '@temin360/document-templates'
import { DocumentRendererComponentProps } from '../registry/types'
import { TemplateErrorBoundary } from '../../TemplateErrorBoundary'

export interface DefaultDocumentRendererProps
  extends DocumentRendererComponentProps<Record<string, unknown>> {
  templateKey: TemplateKey
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

  const content = (
    <TemplateEditProvider
      isEditing={isEditing}
      onFieldChange={onFieldChange}
      personelListesi={personelListesi}
      firmaListesi={firmaListesi}
      birimListesi={birimListesi}
      firstPageLimit={resolvedFirstPageLimit}
    >
      <DocumentPage
        templateKey={templateKey}
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
      className={`default-document-paper-container flex flex-col items-center justify-start min-h-full py-8 px-4 select-text ${className}`}
      style={style}
    >
      <div
        className="origin-top transition-transform duration-150 ease-out shadow-2xl rounded-sm bg-white"
        style={{
          transform: `scale(${scale})`,
          width: isLandscape ? '297mm' : '210mm'
        }}
      >
        <TemplateErrorBoundary>{content}</TemplateErrorBoundary>
      </div>
    </div>
  )
}
