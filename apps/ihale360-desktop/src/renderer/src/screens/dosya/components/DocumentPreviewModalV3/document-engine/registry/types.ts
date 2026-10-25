import React from 'react'
import { TemplateKey } from '@temin360/document-templates'

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
  butceYili?: number
  dosyaTarihi?: string
  konu?: string
  harcamaYetkilisiAdi?: string
  harcamaYetkilisiUnvan?: string
  birimId?: number
  sunulacakMakam?: string
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
  templateKey: TemplateKey
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
