import { DocumentSettings, TableRowItem } from '../../types/formBuilder.types'

export const getPageDimensions = (
  docSettings: DocumentSettings
): { width: string; minHeight: string } => {
  const isA3 = docSettings.pageSize === 'A3'
  const isLandscape = docSettings.orientation === 'landscape'

  if (isA3) {
    return isLandscape
      ? { width: '420mm', minHeight: '297mm' }
      : { width: '297mm', minHeight: '420mm' }
  }
  return isLandscape
    ? { width: '297mm', minHeight: '210mm' }
    : { width: '210mm', minHeight: '297mm' }
}

export const getPagePadding = (docSettings: DocumentSettings): string => {
  switch (docSettings.margins) {
    case 'compact':
      return '1.2cm 1cm'
    case 'wide':
      return '2.5cm 2.2cm'
    case 'normal':
    default:
      return '1.8cm 1.5cm'
  }
}

export const calculateTableTotal = (rows?: TableRowItem[]): number => {
  if (!rows || rows.length === 0) return 0
  return rows.reduce((acc, r) => {
    const top =
      typeof r.toplamFiyat === 'number' ? r.toplamFiyat : parseFloat(String(r.toplamFiyat)) || 0
    return acc + top
  }, 0)
}

export const getTextAlignClass = (align?: 'left' | 'center' | 'right' | 'justify'): string => {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    case 'justify':
      return 'text-justify'
    case 'left':
    default:
      return 'text-left'
  }
}

export const getWidthClass = (width?: '100%' | '50%' | '33%' | '25%'): string => {
  switch (width) {
    case '50%':
      return 'w-full md:w-[calc(50%-6px)] inline-block'
    case '33%':
      return 'w-full md:w-[calc(33.33%-8px)] inline-block'
    case '25%':
      return 'w-full md:w-[calc(25%-9px)] inline-block'
    case '100%':
    default:
      return 'w-full'
  }
}

export const getPageBreakClass = (pb?: 'none' | 'before' | 'after' | 'inside-avoid'): string => {
  switch (pb) {
    case 'before':
      return 'break-before-page'
    case 'after':
      return 'break-after-page'
    case 'inside-avoid':
      return 'break-inside-avoid'
    case 'none':
    default:
      return ''
  }
}
