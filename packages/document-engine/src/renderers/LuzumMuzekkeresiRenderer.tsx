import React from 'react'
import {
  LuzumMuzekkeresi,
  LuzumMuzekkeresiType,
  TemplateEditProvider
} from '@temin360/document-templates'
import { DocumentRendererComponentProps } from '../types/contracts'
import { TemplateErrorBoundary } from './TemplateErrorBoundary'

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

  const pageContent = (
    <div
      data-document-page="true"
      data-template-key="luzum_muzekkeresi"
      data-orientation={orientation}
      className={`bg-white text-slate-900 box-border mx-auto ${
        isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'
      }`}
    >
      <TemplateEditProvider isEditing={isEditing} onFieldChange={onFieldChange}>
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
        ref={containerRef}
        className={`document-renderer-bare inline-block ${className}`.trim()}
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

  const baseWidth = isLandscape ? 1131 : 800
  const baseHeight = isLandscape ? 800 : 1131

  if (scale !== 1) {
    return (
      <div
        ref={containerRef}
        className={`flex-1 bg-slate-200/50 dark:bg-slate-950 flex justify-center items-start overflow-x-hidden overflow-y-auto shadow-inner h-full py-8 custom-scrollbar min-h-0 min-w-0 ${className}`.trim()}
        style={style}
      >
        <div
          style={{
            width: `${baseWidth * scale}px`,
            minHeight: `${baseHeight * scale}px`,
            position: 'relative',
            flexShrink: 0
          }}
        >
          <div
            className="bg-white shadow-2xl transition-transform duration-200 ease-out origin-top"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: `${baseWidth}px`,
              minHeight: `${baseHeight}px`,
              position: 'absolute',
              top: 0,
              left: '50%',
              translate: '-50% 0'
            }}
          >
            <TemplateErrorBoundary>{pageContent}</TemplateErrorBoundary>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`w-full flex justify-center items-start overflow-auto bg-slate-200/50 dark:bg-slate-950 p-4 sm:p-8 custom-scrollbar ${className}`.trim()}
      style={style}
    >
      <div className="bg-white shadow-2xl rounded-sm overflow-hidden shrink-0">
        <TemplateErrorBoundary>{pageContent}</TemplateErrorBoundary>
      </div>
    </div>
  )
}
