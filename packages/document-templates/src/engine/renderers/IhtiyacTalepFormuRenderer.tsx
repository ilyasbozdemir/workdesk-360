import React from 'react'
import { IhtiyacTalepFormu } from '../../templates/ihtiyac-talep-formu'
import { IhtiyacTalepFormuType } from '../../templates/ihtiyac-talep-formu/IhtiyacTalepFormu.schema'
import { TemplateEditProvider } from '../../document/TemplateEditContext'
import { DocumentRendererComponentProps, TemplateErrorBoundary } from '@worksuite-360/document-engine'

/**
 * İhtiyaç Talep Formu Belge Çizicisi (IhtiyacTalepFormuRenderer)
 */
export function IhtiyacTalepFormuRenderer(
  props: DocumentRendererComponentProps<IhtiyacTalepFormuType>
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
      data-template-key="ihtiyac_talep_formu"
      data-orientation={orientation}
      className="ihtiyac-talep-formu-wrapper select-text mx-auto"
    >
      <TemplateEditProvider
        isEditing={isEditing}
        onFieldChange={onFieldChange}
        personelListesi={resolvedPersonelListesi}
        firmaListesi={resolvedFirmaListesi}
        birimListesi={resolvedBirimListesi}
        firstPageLimit={resolvedFirstPageLimit}
        data={data as any}
      >
        <IhtiyacTalepFormu
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
        className={`document-renderer-bare ihtiyac-talep-formu-bare ${className}`}
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
      className={`document-renderer-paper ihtiyac-talep-formu-paper flex flex-col items-center gap-8 ${className}`}
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

