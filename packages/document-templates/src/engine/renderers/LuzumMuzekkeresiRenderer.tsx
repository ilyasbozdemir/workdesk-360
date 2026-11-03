import React from 'react'
import { LuzumMuzekkeresi, LuzumMuzekkeresiType } from '../../templates/luzum-muzekkeresi'
import { TemplateEditProvider } from '../../document/TemplateEditContext'
import { DocumentRendererComponentProps, TemplateErrorBoundary } from '@worksuite-360/document-engine'

/**
 * Lüzum Müzekkeresi Belge Çizicisi (LuzumMuzekkeresiRenderer)
 */
export function LuzumMuzekkeresiRenderer(
  props: DocumentRendererComponentProps<LuzumMuzekkeresiType>
): React.JSX.Element {
  const {
    data,
    orientation = 'portrait',
    chrome = 'paper',
    scale = 1,
    isEditing = false,
    onFieldChange,
    firstPageLimit,
    className = '',
    style = {},
    containerRef
  } = props

  const isLandscape = orientation === 'landscape'
  const resolvedFirstPageLimit = firstPageLimit ?? (data as any)?.firstPageLimit

  const resolvedPersonelListesi =
    (props.personelListesi && (props.personelListesi as any[]).length > 0
      ? props.personelListesi
      : (data as any)?.personelListesi || (typeof window !== 'undefined' ? (window as any)?.__activePersonelListesi : [])) || []
  const resolvedFirmaListesi =
    (props.firmaListesi && (props.firmaListesi as any[]).length > 0
      ? props.firmaListesi
      : (data as any)?.firmaListesi || (typeof window !== 'undefined' ? (window as any)?.__activeFirmaListesi : [])) || []
  const resolvedBirimListesi =
    (props.birimListesi && (props.birimListesi as any[]).length > 0
      ? props.birimListesi
      : (data as any)?.birimListesi || (typeof window !== 'undefined' ? (window as any)?.__activeBirimListesi : [])) || []

  const pageContent = (
    <div
      data-document-page="true"
      data-template-key="luzum_muzekkeresi"
      data-orientation={orientation}
      className="luzum-muzekkeresi-wrapper select-text mx-auto"
    >
      <TemplateEditProvider
        isEditing={isEditing}
        onFieldChange={onFieldChange}
        personelListesi={resolvedPersonelListesi}
        firmaListesi={resolvedFirmaListesi}
        birimListesi={resolvedBirimListesi}
        firstPageLimit={resolvedFirstPageLimit}
      >
        <LuzumMuzekkeresi
          data={data}
          orientation={orientation}
          firstPageLimit={resolvedFirstPageLimit}
        />
      </TemplateEditProvider>
    </div>
  )

  if (chrome === 'bare') {
    return (
      <div
        className={`document-renderer-bare luzum-muzekkeresi-bare ${className}`}
        style={{
          width: isLandscape ? '297mm' : '210mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          ...style
        }}
      >
        <TemplateErrorBoundary>{pageContent}</TemplateErrorBoundary>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`document-renderer-paper luzum-muzekkeresi-paper flex flex-col items-center gap-8 ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.15s ease-out',
        ...style
      }}
    >
      <TemplateErrorBoundary>{pageContent}</TemplateErrorBoundary>
    </div>
  )
}
