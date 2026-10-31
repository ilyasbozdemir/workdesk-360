import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  resolveTemplateKey,
  DocumentValidationService
} from '@temin360/document-templates'
import { TemplateRegistry, InvalidTemplateKeyError } from './TemplateRegistry'
import {
  DocumentRecord,
  DocumentDefinition,
  InstitutionalHeaderData,
  DocumentStorageAdapter,
  LoadOrCreateDocumentParams,
  SaveDocumentParams,
  ResetDocumentParams,
  DeleteDocumentParams,
  SyncDocumentParams,
  CompileHtmlParams
} from './types/contracts'
import { smartMergeDocumentData } from './mergers/smartMerge'

export type HeaderResolverFn = (
  dosyaId: number,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>
) => Promise<InstitutionalHeaderData>

export type DocumentSavedListener = (record: {
  dosyaId: number
  templateKey: string
  data: Record<string, unknown>
}) => void

/**
 * Bağımsız Belge Yönetim ve Çıktı Motoru (DocumentEngine)
 * - Verilen templateKey üzerinden TemplateRegistry'deki doğru belge tanımını bulur.
 * - Belgenin resolver ve renderer'ını koordine eder.
 * - TEMİN 360'a özel SQL veya şema bilgisi içermez; depolama adaptörü ve çözümleyiciler üzerinden çalışır.
 * - UI bağımlılığı yoktur; FlowDesk veya diğer modüller tarafından doğrudan tüketilebilir.
 */
export class DocumentEngine {
  private static storageAdapter: DocumentStorageAdapter | null = null
  private static customQueryExecutor: ((sql: string, params: any[]) => Promise<any[]>) | null = null
  private static headerResolver: HeaderResolverFn | null = null
  private static savedListeners: Set<DocumentSavedListener> = new Set()

  /**
   * Depolama adaptörünü tanımlar (Masaüstü IPC veya Mock)
   */
  static setStorageAdapter(adapter: DocumentStorageAdapter | null): void {
    this.storageAdapter = adapter
  }

  static getStorageAdapter(): DocumentStorageAdapter | null {
    return this.storageAdapter
  }

  /**
   * Veritabanı sorgu yürütücüsünü tanımlar
   */
  static setQueryExecutor(executor: (sql: string, params: any[]) => Promise<any[]>): void {
    this.customQueryExecutor = executor
  }

  /**
   * Kurumsal başlık / antet çözümleyicisini tanımlar
   */
  static setHeaderResolver(resolver: HeaderResolverFn): void {
    this.headerResolver = resolver
  }

  /**
   * Belge kaydedildiğinde bildirim dinleyicisi ekler
   */
  static onDocumentSaved(listener: DocumentSavedListener): () => void {
    this.savedListeners.add(listener)
    return () => {
      this.savedListeners.delete(listener)
    }
  }

  /**
   * Aktif sorgu yürütücüsünü döner
   */
  static queryExecutor = async (sql: string, params: any[]): Promise<any[]> => {
    if (DocumentEngine.customQueryExecutor) {
      return DocumentEngine.customQueryExecutor(sql, params)
    }
    if (DocumentEngine.storageAdapter?.executeQuery) {
      return DocumentEngine.storageAdapter.executeQuery(sql, params)
    }
    // Global electron ipcRenderer fallback (çalışma zamanı uyumluluğu için)
    if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
      const res = await (window as any).electron.ipcRenderer.invoke('db:query', { sql, params })
      if (!res?.success) {
        throw new Error(res?.error || 'Veritabanı sorgusu başarısız')
      }
      return res.data || []
    }
    return []
  }

  /**
   * Şablon anahtarını kanonik biçime dönüştürür ve varlığını doğrular
   */
  static resolveKey(templateKey: string): string {
    if (!templateKey || typeof templateKey !== 'string') {
      throw new InvalidTemplateKeyError(String(templateKey))
    }
    const cleanKey = templateKey.replace(/\.html$/i, '').trim()
    const resolved = resolveTemplateKey(cleanKey) as string
    const canonicalKey = resolved || cleanKey

    if (!TemplateRegistry.has(canonicalKey)) {
      throw new InvalidTemplateKeyError(templateKey)
    }

    return canonicalKey
  }

  /**
   * Belgeye ait kurumsal üst veriyi çözer
   */
  private static async resolveHeaderData(dosyaId: number): Promise<InstitutionalHeaderData> {
    if (this.headerResolver) {
      return this.headerResolver(dosyaId, this.queryExecutor)
    }
    return {
      antetSatirlari: [],
      kurumUst: '',
      kurumAdi: '',
      mudurluk: '',
      solLogo: null,
      sagLogo: null
    }
  }

  /**
   * Belgeye ait verileri TemplateRegistry ve ilişkili özel resolver ile çözümler.
   */
  static async resolveDocumentData<T = Record<string, unknown>>(params: {
    dosyaId: number
    templateKey: string
    invitedFirms?: unknown[]
  }): Promise<{ data: T; headerData: InstitutionalHeaderData; definition: DocumentDefinition<T> }> {
    const { dosyaId, templateKey, invitedFirms } = params
    const canonicalKey = this.resolveKey(templateKey)

    const definition = TemplateRegistry.get<T>(canonicalKey)
    const headerData = await this.resolveHeaderData(dosyaId)

    const resolvedData = await definition.resolver.resolve({
      dosyaId,
      templateKey: canonicalKey,
      headerData,
      queryExecutor: this.queryExecutor,
      invitedFirms
    })

    return {
      data: resolvedData,
      headerData,
      definition
    }
  }

  /**
   * Dosyaya ait belgeyi bulur; diskte kayıt yoksa varsayılan veriyi oluşturup kaydeder.
   */
  static async loadOrCreateDocument<T = Record<string, unknown>>(
    params: LoadOrCreateDocumentParams
  ): Promise<DocumentRecord<T>> {
    const { dosyaId, templateKey, context, forceDefault = false } = params
    const canonicalKey = this.resolveKey(templateKey)

    // 1. Önce veritabanında bu dosyaya özel kaydedilmiş snapshot var mı kontrol et
    if (!forceDefault && this.storageAdapter) {
      try {
        const getRes = await this.storageAdapter.getDocument({
          dosyaId,
          templateKey: canonicalKey
        })

        if (getRes?.success && getRes.exists && getRes.record) {
          const headerData = await this.resolveHeaderData(dosyaId)
          const valReport = DocumentValidationService.validate(
            canonicalKey,
            getRes.record.data as Record<string, unknown>
          )

          return {
            id: getRes.record.id,
            dosyaId,
            templateKey: canonicalKey,
            data: getRes.record.data as T,
            sablonVersiyon: getRes.record.sablonVersiyon || 1,
            createdAt: getRes.record.createdAt,
            updatedAt: getRes.record.updatedAt,
            isExisting: true,
            headerData,
            validationReport: valReport
          }
        }
      } catch (err) {
        console.warn('[DocumentEngine] Saved document fetch error, falling back to resolver:', err)
      }
    }

    // 2. Kayıt yoksa veya forceDefault ise: Belgeye özel resolver ile varsayılan veriyi oluştur
    const { data: defaultData, headerData } = await this.resolveDocumentData<T>({
      dosyaId,
      templateKey: canonicalKey,
      invitedFirms: context?.invitedFirms as unknown[]
    })

    const valReport = DocumentValidationService.validate(
      canonicalKey,
      defaultData as Record<string, unknown>
    )

    // 3. Varsayılan veriyi bu dosya için depolamaya ilk kayıt olarak kaydet
    let recordId: number | undefined = undefined
    let updatedAt: string | undefined = undefined

    if (this.storageAdapter && dosyaId) {
      try {
        const saveRes = await this.storageAdapter.saveDocument({
          dosyaId,
          templateKey: canonicalKey,
          data: defaultData as Record<string, unknown>,
          sablonVersiyon: 1
        })
        if (saveRes?.success) {
          recordId = saveRes.id
          updatedAt = saveRes.updatedAt
        }
      } catch (err) {
        console.warn('[DocumentEngine] Initial document auto-save error:', err)
      }
    }

    return {
      id: recordId,
      dosyaId,
      templateKey: canonicalKey,
      data: defaultData,
      sablonVersiyon: 1,
      updatedAt,
      isExisting: false,
      headerData,
      validationReport: valReport
    }
  }

  /**
   * Belge verisini doğrular ve depolama adaptörüne yazar.
   */
  static async saveDocument<T = Record<string, unknown>>(
    params: SaveDocumentParams<T>
  ): Promise<{ success: boolean; id?: number; updatedAt?: string; error?: string }> {
    const { dosyaId, templateKey, data, sablonVersiyon = 1, validateBeforeSave = false } = params
    const canonicalKey = this.resolveKey(templateKey)

    if (validateBeforeSave) {
      const report = DocumentValidationService.validate(
        canonicalKey,
        data as Record<string, unknown>
      )
      if (report.hasErrors) {
        const errorMsgs = report.errors.map((e) => e.message).join(', ')
        throw new Error(`Belge doğrulama hataları nedeniyle kaydedilemedi: ${errorMsgs}`)
      }
    }

    if (!this.storageAdapter) {
      return { success: true }
    }

    const res = await this.storageAdapter.saveDocument({
      dosyaId,
      templateKey: canonicalKey,
      data: data as Record<string, unknown>,
      sablonVersiyon
    })

    if (!res?.success) {
      throw new Error(res?.error || 'Belge kaydedilirken hata oluştu.')
    }

    // Dinleyicileri bilgilendir
    for (const listener of this.savedListeners) {
      try {
        listener({
          dosyaId,
          templateKey: canonicalKey,
          data: data as Record<string, unknown>
        })
      } catch (err) {
        console.warn('[DocumentEngine] onDocumentSaved listener error:', err)
      }
    }

    return {
      success: true,
      id: res.id,
      updatedAt: res.updatedAt
    }
  }

  /**
   * Kullanıcı açıkça talep ettiğinde belgeyi varsayılan durumuna sıfırlar.
   */
  static async resetToDefault<T = Record<string, unknown>>(
    params: ResetDocumentParams
  ): Promise<DocumentRecord<T>> {
    const { dosyaId, templateKey, context } = params
    const canonicalKey = this.resolveKey(templateKey)

    if (this.storageAdapter) {
      await this.storageAdapter.resetDocument({
        dosyaId,
        templateKey: canonicalKey
      })
    }

    return await this.loadOrCreateDocument<T>({
      dosyaId,
      templateKey: canonicalKey,
      context,
      forceDefault: true
    })
  }

  /**
   * Güncel Verileri Al (Sync / Rebase)
   * - Resolver'dan taze veriyi çeker.
   * - Kaydedilmiş mevcut snapshot ile akıllıca birleştirir (kullanıcı notları korunur, yeni kalemler eklenir).
   */
  static async syncWithSource<T = Record<string, unknown>>(
    params: SyncDocumentParams<T>
  ): Promise<DocumentRecord<T>> {
    const { dosyaId, templateKey, existingData, context } = params
    const canonicalKey = this.resolveKey(templateKey)

    // Resolver'dan en taze kaynak veriyi çek
    const { data: freshData, headerData } = await this.resolveDocumentData<T>({
      dosyaId,
      templateKey: canonicalKey,
      invitedFirms: context?.invitedFirms as unknown[]
    })

    // Akıllı birleştirici ile snapshot + kaynak veriyi harmanla
    const mergedData = smartMergeDocumentData(
      existingData as Record<string, unknown>,
      freshData as Record<string, unknown>
    ) as T

    const valReport = DocumentValidationService.validate(
      canonicalKey,
      mergedData as Record<string, unknown>
    )

    return {
      dosyaId,
      templateKey: canonicalKey,
      data: mergedData,
      sablonVersiyon: 1,
      isExisting: true,
      headerData,
      validationReport: valReport
    }
  }

  /**
   * Belirli bir dosyanın belirli belge kaydını siler.
   */
  static async deleteDocument(params: DeleteDocumentParams): Promise<boolean> {
    const { dosyaId, templateKey } = params
    const canonicalKey = this.resolveKey(templateKey)

    if (this.storageAdapter) {
      const res = await this.storageAdapter.deleteDocument({
        dosyaId,
        templateKey: canonicalKey
      })
      return Boolean(res?.success)
    }
    return true
  }

  /**
   * Önizleme ve PDF çıktısı için ortak saf HTML derleyicisi.
   */
  static compileHtml(params: CompileHtmlParams): string {
    const {
      templateKey,
      data,
      orientation = 'portrait',
      personelListesi = [],
      firmaListesi = [],
      birimListesi = [],
      firstPageLimit
    } = params

    const canonicalKey = this.resolveKey(templateKey)
    const definition = TemplateRegistry.get(canonicalKey)
    const SpecificRenderer = definition.renderer

    const renderedBody = renderToString(
      React.createElement(SpecificRenderer, {
        data,
        orientation,
        chrome: 'bare',
        scale: 1,
        isEditing: false,
        personelListesi,
        firmaListesi,
        birimListesi,
        firstPageLimit
      })
    )

    const isLandscape = orientation === 'landscape'
    const pageSize = isLandscape ? '297mm 210mm' : '210mm 297mm'

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${definition.title || canonicalKey}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  ${renderedBody}
</body>
</html>`
  }
}

