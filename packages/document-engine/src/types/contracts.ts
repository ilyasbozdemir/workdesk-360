import type React from 'react'
import type { TemplateKey, ValidationReport } from '@temin360/document-templates'

/**
 * Ortak Kurumsal ve Antet Bilgileri Sözleşmesi
 * Sadece kurum, birim ve dosya üst bilgilerini taşır; belgeye özel kalem veya teklif içermez.
 */
export interface InstitutionalHeaderData {
  antetSatirlari: string[]
  kurumUst: string
  kurumAdi: string
  mudurluk: string
  solLogo: string | null
  sagLogo: string | null
  dosyaNo?: string
  evrakSayisi?: string
  butceYili?: number
  dosyaTarihi?: string
  konu?: string
  harcamaYetkilisiAdi?: string
  harcamaYetkilisiUnvan?: string
  birimId?: number
  sunulacakMakam?: string
  [key: string]: unknown
}

/**
 * Belge Çözümleme Bağlamı (Resolution Context)
 */
export interface DocumentResolutionContext {
  dosyaId: number
  templateKey: string
  headerData: InstitutionalHeaderData
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>
  invitedFirms?: unknown[]
  [key: string]: unknown
}

/**
 * Belgeye Özel Veri Çözücü Sözleşmesi (Document Resolver Interface)
 */
export interface DocumentDataResolver<TData = Record<string, unknown>> {
  resolve(context: DocumentResolutionContext): Promise<TData>
}

/**
 * Belge Çizim Bileşeni Özellikleri (Document Renderer Props)
 */
export interface DocumentRendererComponentProps<TData = Record<string, unknown>> {
  data: TData
  orientation?: 'portrait' | 'landscape'
  chrome?: 'paper' | 'bare'
  scale?: number
  isEditing?: boolean
  onFieldChange?: (key: string, val: unknown) => void
  personelListesi?: unknown[]
  firmaListesi?: unknown[]
  birimListesi?: unknown[]
  firstPageLimit?: number
  className?: string
  style?: React.CSSProperties
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Belge Tanım Sözleşmesi (Document Definition in Template Registry)
 */
export interface DocumentDefinition<TData = Record<string, unknown>> {
  templateKey: TemplateKey | string
  name: string
  title: string
  category: string
  categoryLabel: string
  description?: string
  orientation: 'portrait' | 'landscape'
  resolver: DocumentDataResolver<TData>
  renderer: React.ComponentType<DocumentRendererComponentProps<TData>>
  requiredProviders?: Array<'institutionalHeader' | 'items' | 'firms' | 'commissions'>
}

/**
 * Disk / Veritabanı Belge Kaydı Sözleşmesi
 */
export interface DocumentRecord<T = Record<string, unknown>> {
  id?: number
  dosyaId: number
  templateKey: string
  data: T
  sablonVersiyon: number
  createdAt?: string
  updatedAt?: string
  isExisting: boolean
  headerData?: InstitutionalHeaderData
  personelListesi?: unknown[]
  firmaListesi?: unknown[]
  birimListesi?: unknown[]
  dosyaRecord?: unknown
  validationReport?: ValidationReport
}

/**
 * Bağımsız Depolama Adaptörü (Storage Bridge)
 * Masaüstü IPC, HTTP API veya InMemory mock ile çalışabilir.
 */
export interface DocumentStorageRecord {
  id?: number
  data: Record<string, unknown>
  sablonVersiyon?: number
  createdAt?: string
  updatedAt?: string
}

export interface DocumentStorageAdapter {
  getDocument(params: {
    dosyaId: number
    templateKey: string
  }): Promise<{ success: boolean; exists?: boolean; record?: DocumentStorageRecord }>

  saveDocument(params: {
    dosyaId: number
    templateKey: string
    data: Record<string, unknown>
    sablonVersiyon?: number
  }): Promise<{ success: boolean; id?: number; updatedAt?: string; error?: string }>

  resetDocument(params: {
    dosyaId: number
    templateKey: string
  }): Promise<{ success: boolean; error?: string }>

  deleteDocument(params: {
    dosyaId: number
    templateKey: string
  }): Promise<{ success: boolean; error?: string }>

  executeQuery?(sql: string, params: any[]): Promise<any[]>
}

export interface DocumentResolveContext {
  invitedFirms?: unknown[]
  [key: string]: unknown
}

export interface LoadOrCreateDocumentParams {
  dosyaId: number
  templateKey: string
  context?: DocumentResolveContext
  forceDefault?: boolean
}

export interface SaveDocumentParams<T = Record<string, unknown>> {
  dosyaId: number
  templateKey: string
  data: T
  sablonVersiyon?: number
  validateBeforeSave?: boolean
}

export interface ResetDocumentParams {
  dosyaId: number
  templateKey: string
  context?: DocumentResolveContext
}

export interface DeleteDocumentParams {
  dosyaId: number
  templateKey: string
}

export interface SyncDocumentParams<T = Record<string, unknown>> {
  dosyaId: number
  templateKey: string
  existingData: T
  context?: DocumentResolveContext
}

export interface CompileHtmlParams {
  templateKey: string
  data: Record<string, unknown>
  orientation?: 'portrait' | 'landscape'
  personelListesi?: unknown[]
  firmaListesi?: unknown[]
  birimListesi?: unknown[]
  firstPageLimit?: number
  activeTemplateConf?: { name?: string }
}

export interface ExportPdfParams {
  dosyaId: number
  templateKey: string
  data: Record<string, unknown>
  orientation?: 'portrait' | 'landscape'
  dosyaRecord?: unknown
  personelListesi?: unknown[]
  firmaListesi?: unknown[]
  firstPageLimit?: number
}
