/**
 * Registry tipler yeniden ihracı
 * Yalnızca TemplateRegistry sözleşme tiplerini dışa aktarır.
 * DocumentEngine, TemplateRegistry sınıfları ve diğer motor tipleri kendi modüllerinden gelir.
 */
export type {
  InstitutionalHeaderData,
  DocumentResolutionContext,
  DocumentDataResolver,
  DocumentRendererComponentProps,
  DocumentDefinition
} from '@worksuite-360/document-engine'
