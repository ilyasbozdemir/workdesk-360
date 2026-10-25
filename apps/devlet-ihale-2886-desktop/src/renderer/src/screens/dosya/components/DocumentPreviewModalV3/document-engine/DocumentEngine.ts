import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  TemplateKey,
  resolveTemplateKey,
  DocumentValidationService,
  ValidationReport
} from '@temin360/document-templates'
import { TemplateRegistry, InvalidTemplateKeyError } from './registry/TemplateRegistry'
import { InstitutionalHeaderProvider } from './providers/InstitutionalHeaderProvider'
import { InstitutionalHeaderData, DocumentDefinition } from './registry/types'
import { documentPreloadService } from '../../../../../services/documentPreloadService'
import { usePrintQueueStore } from '../../../../../store/printQueueStore'
import { buildExportFileName } from '../../../../../utils/exportFileName'
import { DocumentResolveContext } from './types'

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

/**
 * Merkezi Belge Yönetim ve Çıktı Motoru (Central Document Engine)
 * - Verilen templateKey üzerinden TemplateRegistry'deki doğru belge tanımını bulur.
 * - Yalnızca ilgili belgenin resolver ve renderer'ını koordine eder.
 * - Mega bir monolitik çözümleyiciye dönüşmez; belgeye özel SQL sorguları ve kurallar belge resolver'ında izoledir.
 * - Bilinmeyen template anahtarlarında açık InvalidTemplateKeyError fırlatır.
 */
export class DocumentEngine {
  private static get ipc() {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      return window.electron.ipcRenderer
    }
    return null
  }

  /**
   * Veritabanı sorgu yürütücüsü (IPC üzerinden)
   */
  static queryExecutor = async (sql: string, params: any[]): Promise<any[]> => {
    if (!window.electron?.ipcRenderer) return []
    try {
      const res = await window.electron.ipcRenderer.invoke('db:query', sql, params)
      return res && res.success ? res.data : []
    } catch {
      return []
    }
  }

  /**
   * Şablon anahtarını kanonik biçime çözümler.
   * Bilinmeyen anahtarlar açık hata fırlatır.
   */
  static resolveKey(templateKey: string): string {
    if (!templateKey || typeof templateKey !== 'string') {
      throw new InvalidTemplateKeyError(String(templateKey))
    }
    const cleanKey = templateKey.replace(/\.html$/i, '').trim()
    const resolved = resolveTemplateKey(cleanKey)
    const canonicalKey = resolved || cleanKey

    if (!TemplateRegistry.has(canonicalKey)) {
      throw new InvalidTemplateKeyError(templateKey)
    }

    return canonicalKey
  }

  /**
   * Belgeye ait verileri TemplateRegistry ve ilişkili özel resolver ile çözümler.
   * Monolitik mega-fonksiyon çağırmaz; yalnızca belgenin ihtiyaç duyduğu sorguları yürütür.
   */
  static async resolveDocumentData<T = Record<string, unknown>>(params: {
    dosyaId: number
    templateKey: string
    invitedFirms?: unknown[]
  }): Promise<{ data: T; headerData: InstitutionalHeaderData; definition: DocumentDefinition<T> }> {
    const { dosyaId, templateKey, invitedFirms } = params
    const canonicalKey = this.resolveKey(templateKey)

    const definition = TemplateRegistry.get<T>(canonicalKey)
    const headerData = await InstitutionalHeaderProvider.resolve(dosyaId, this.queryExecutor)

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
   * Dosyaya ait belgeyi bulur; diskte kayıt yoksa varsayılan veriyi oluşturup veritabanına kaydeder.
   */
  static async loadOrCreateDocument<T = Record<string, unknown>>(
    params: LoadOrCreateDocumentParams
  ): Promise<DocumentRecord<T>> {
    const { dosyaId, templateKey, context, forceDefault = false } = params
    const canonicalKey = this.resolveKey(templateKey)

    // 1. Önce veritabanında bu dosyaya özel kaydedilmiş snapshot var mı kontrol et
    if (!forceDefault && this.ipc) {
      try {
        const getRes = await this.ipc.invoke('belge:get-document', {
          dosyaId,
          templateKey: canonicalKey
        })

        if (getRes?.success && getRes.exists && getRes.record) {
          const headerData = await InstitutionalHeaderProvider.resolve(dosyaId, this.queryExecutor)
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

    // 2. Kayıt yoksa: Belgeye özel resolver ile varsayılan veriyi oluştur
    const { data: defaultData, headerData } = await this.resolveDocumentData<T>({
      dosyaId,
      templateKey: canonicalKey,
      invitedFirms: context?.invitedFirms as unknown[]
    })

    const valReport = DocumentValidationService.validate(
      canonicalKey,
      defaultData as Record<string, unknown>
    )

    // 3. Varsayılan veriyi bu dosya için veritabanına ilk kayıt olarak güvenle kaydet
    let recordId: number | undefined = undefined
    let updatedAt: string | undefined = undefined

    if (this.ipc && dosyaId) {
      try {
        const saveRes = await this.ipc.invoke('belge:save-document', {
          dosyaId,
          templateKey: canonicalKey,
          data: defaultData,
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
   * Belge verisini doğrular ve ilişkili dosya kaydına atomik transaction ile yazar.
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

    if (!this.ipc) {
      return { success: true }
    }

    const res = await this.ipc.invoke('belge:save-document', {
      dosyaId,
      templateKey: canonicalKey,
      data,
      sablonVersiyon
    })

    if (!res?.success) {
      throw new Error(res?.error || 'Belge kaydedilirken veritabanı hatası oluştu.')
    }

    // Cache güncellemesi ve yazdırma kuyruğu geçersiz kılma
    documentPreloadService.updateCachedResolvedData(canonicalKey, dosyaId, data)
    usePrintQueueStore
      .getState()
      .invalidateReadyStatus(dosyaId, canonicalKey, 'Belge içeriği güncellendi')

    return {
      success: true,
      id: res.id,
      updatedAt: res.updatedAt
    }
  }

  /**
   * Kullanıcı açıkça talep ettiğinde belgeyi varsayılan durumuna sıfırlar.
   * Mevcut kullanıcı düzenlemesini revizyona arşivler ve kaynak verilerden taze belge oluşturur.
   */
  static async resetToDefault<T = Record<string, unknown>>(
    params: ResetDocumentParams
  ): Promise<DocumentRecord<T>> {
    const { dosyaId, templateKey, context } = params
    const canonicalKey = this.resolveKey(templateKey)

    if (this.ipc) {
      await this.ipc.invoke('belge:reset-document', {
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
   * Belirli bir dosyanın belirli belge kaydını siler.
   */
  static async deleteDocument(params: DeleteDocumentParams): Promise<boolean> {
    const { dosyaId, templateKey } = params
    const canonicalKey = this.resolveKey(templateKey)

    if (this.ipc) {
      const res = await this.ipc.invoke('belge:delete-document', {
        dosyaId,
        templateKey: canonicalKey
      })
      return Boolean(res?.success)
    }
    return true
  }

  /**
   * Önizleme ve PDF çıktısı için ortak saf HTML derleyicisi.
   * İlgili şablonun TemplateRegistry'deki kendine ait renderer bileşenini (chrome: 'bare') kullanır.
   */
  static compileHtml(params: CompileHtmlParams): string {
    const {
      templateKey,
      data,
      orientation = 'portrait',
      personelListesi = [],
      firmaListesi = [],
      birimListesi = [],
      firstPageLimit,
      activeTemplateConf
    } = params

    const canonicalKey = this.resolveKey(templateKey)
    const definition = TemplateRegistry.get(canonicalKey)
    const RendererComponent = definition.renderer

    const mergedData = {
      ...data,
      personelListesi,
      firmaListesi,
      birimListesi,
      tarih: data.tarih || data.onayaSunulanTarih || '',
      onayTarihi: data.onayTarihi || data.dosyaTarihi || '',
      olurYazisi: data.olurYazisi !== false,
      orientation
    }

    const bodyHtml = renderToString(
      React.createElement(RendererComponent, {
        data: mergedData,
        orientation,
        chrome: 'bare',
        isEditing: false,
        personelListesi,
        firmaListesi,
        birimListesi,
        firstPageLimit
      })
    )

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${activeTemplateConf?.name || definition.title || 'Belge Önizleme'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 ${orientation};
              margin: 10mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              margin: 0;
              padding: 0;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media print {
              body {
                background: white !important;
                padding: 0 !important;
              }
              [data-document-page] {
                box-shadow: none !important;
                margin: 0 !important;
                width: 100% !important;
              }
              .page-break {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `
  }

  /**
   * Belgeyi PDF olarak dışa aktarır (Önizleme ile birebir aynı veriyi kullanır).
   */
  static async exportPdf(
    params: ExportPdfParams
  ): Promise<{ success: boolean; filePath?: string }> {
    const {
      dosyaId,
      templateKey,
      data,
      orientation = 'portrait',
      dosyaRecord,
      personelListesi = [],
      firmaListesi = [],
      firstPageLimit
    } = params

    const canonicalKey = this.resolveKey(templateKey)
    const definition = TemplateRegistry.get(canonicalKey)

    const htmlContent = this.compileHtml({
      templateKey: canonicalKey,
      data,
      orientation,
      personelListesi,
      firmaListesi,
      firstPageLimit,
      activeTemplateConf: { name: definition.name }
    })

    const defaultFilename = buildExportFileName({
      dosya: (dosyaRecord as Record<string, unknown> | null | undefined) ?? null,
      butceYili: (data as any)?.butceYili || (dosyaRecord as any)?.butce_yili,
      teminNo: (data as any)?.teminNo || (dosyaRecord as any)?.temin_no,
      belgeAdi: definition.name || canonicalKey,
      extension: 'pdf'
    })

    if (!this.ipc) {
      return { success: true }
    }

    try {
      const res = await this.ipc.invoke('app:save-pdf-as', {
        html: htmlContent,
        orientation,
        defaultFilename
      })
      if (res && res.success) {
        return { success: true, filePath: res.filePath }
      }
      return { success: false }
    } catch {
      await this.ipc.invoke('belge:open-pdf-external', htmlContent)
      return { success: true }
    }
  }
}
