import React from 'react'
import { IhtiyacListesi, IhtiyacListesiType } from '../../templates/ihtiyac-listesi'
import { TemplateEditProvider } from '../../document/TemplateEditContext'
import { DocumentRendererComponentProps, TemplateErrorBoundary } from '@worksuite-360/document-engine'

/**
 * İhtiyaç Listesi Belge Çizicisi (IhtiyacListesiRenderer)
 */
export function IhtiyacListesiRenderer(
  props: DocumentRendererComponentProps<IhtiyacListesiType>
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
      data-template-key="ihtiyac_listesi"
      data-orientation={orientation}
      className={`bg-white text-slate-900 box-border mx-auto ${
        isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'
      }`}
      style={{
        padding: '12mm 15mm 15mm 15mm'
      }}
    >
      <TemplateEditProvider
        isEditing={isEditing}
        onFieldChange={onFieldChange}
        personelListesi={resolvedPersonelListesi}
        firmaListesi={resolvedFirmaListesi}
        birimListesi={resolvedBirimListesi}
        firstPageLimit={resolvedFirstPageLimit}
      >
        <IhtiyacListesi
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
        className={`document-renderer-bare ihtiyac-listesi-bare ${className}`}
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
      className={`document-renderer-paper ihtiyac-listesi-paper select-none flex flex-col items-center gap-8 py-8 ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.15s ease-out',
        ...style
      }}
    >
      <div
        className="document-paper-shadow bg-white text-black"
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
      >
        <TemplateErrorBoundary>{pageContent}</TemplateErrorBoundary>
      </div>
    </div>
  )
}
