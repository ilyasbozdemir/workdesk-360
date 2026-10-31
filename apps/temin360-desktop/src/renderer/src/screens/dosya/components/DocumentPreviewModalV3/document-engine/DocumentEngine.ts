import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  DocumentEngine as CoreDocumentEngine,
  DocumentRecord,
  LoadOrCreateDocumentParams,
  SaveDocumentParams,
  ResetDocumentParams,
  DeleteDocumentParams,
  SyncDocumentParams,
  CompileHtmlParams,
  ExportPdfParams,
  DocumentStorageAdapter,
  InstitutionalHeaderData,
  DocumentDefinition
} from '@worksuite-360/document-engine'
import { TemplateRegistry } from './registry/TemplateRegistry'
import { InstitutionalHeaderProvider } from './providers/InstitutionalHeaderProvider'
import { documentPreloadService } from '../../../../../services/documentPreloadService'
import { usePrintQueueStore } from '../../../../../store/printQueueStore'
import { buildExportFileName } from '../../../../../utils/exportFileName'

export type {
  DocumentRecord,
  LoadOrCreateDocumentParams,
  SaveDocumentParams,
  ResetDocumentParams,
  DeleteDocumentParams,
  SyncDocumentParams,
  CompileHtmlParams,
  ExportPdfParams
}
/**
 * TEMİN 360 Masaüstü IPC Depolama Adaptörü
 */
const teminStorageAdapter: DocumentStorageAdapter = {
  async getDocument({ dosyaId, templateKey }) {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      try {
        const res = await window.electron.ipcRenderer.invoke('belge:get-document', {
          dosyaId,
          templateKey
        })
        if (!res?.success) {
          return {
            success: false,
            error: res?.error || 'Belge veritabanından okunurken hata oluştu'
          }
        }
        if (res.exists && res.record) {
          return {
            success: true,
            exists: true,
            record: {
              id: res.record.id,
              data: res.record.data,
              sablonVersiyon: res.record.sablonVersiyon,
              createdAt: res.record.createdAt,
              updatedAt: res.record.updatedAt
            }
          }
        }
        return { success: true, exists: false }
      } catch (err) {
        return { success: false, error: err?.message || 'IPC hatası' }
      }
    }
    return { success: false, error: 'IPC kullanılamıyor' }
  },

  async saveDocument({ dosyaId, templateKey, data, sablonVersiyon }) {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      try {
        const res = await window.electron.ipcRenderer.invoke('belge:save-document', {
          dosyaId,
          templateKey,
          data,
          sablonVersiyon
        })
        if (!res?.success) {
          return {
            success: false,
            error: res?.error || 'Belge kaydedilemedi'
          }
        }
        return res
      } catch (err) {
        return { success: false, error: err?.message || 'IPC hatası' }
      }
    }
    return { success: false, error: 'IPC kullanılamıyor' }
  },

  async resetDocument({ dosyaId, templateKey }) {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      try {
        const res = await window.electron.ipcRenderer.invoke('belge:reset-document', {
          dosyaId,
          templateKey
        })
        if (!res?.success) {
          return { success: false, error: res?.error || 'Belge sıfırlanamadı' }
        }
        return res
      } catch (err) {
        return { success: false, error: err?.message || 'IPC hatası' }
      }
    }
    return { success: false, error: 'IPC kullanılamıyor' }
  },

  async deleteDocument({ dosyaId, templateKey }) {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      try {
        const res = await window.electron.ipcRenderer.invoke('belge:delete-document', {
          dosyaId,
          templateKey
        })
        if (!res?.success) {
          return { success: false, error: res?.error || 'Belge silinemedi' }
        }
        return res
      } catch (err) {
        return { success: false, error: err?.message || 'IPC hatası' }
      }
    }
    return { success: false, error: 'IPC kullanılamıyor' }
  },

  async executeQuery(sql: string, params: any[]) {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      const res = await window.electron.ipcRenderer.invoke('db:query', sql, params)
      if (!res?.success) throw new Error(res?.error || 'Veritabanı sorgusu başarısız')
      return res.data || []
    }
    throw new Error('IPC kullanılamıyor')
  }
}

// Çekirdek motoru TEMİN 360 adaptörleri ile ilklendir
CoreDocumentEngine.setStorageAdapter(teminStorageAdapter)
CoreDocumentEngine.setHeaderResolver(async (dosyaId, queryExecutor) => {
  return InstitutionalHeaderProvider.resolve(dosyaId, queryExecutor)
})
CoreDocumentEngine.onDocumentSaved(({ dosyaId, templateKey, data }) => {
  documentPreloadService.updateCachedResolvedData(templateKey as any, dosyaId, data)
  usePrintQueueStore
    .getState()
    .invalidateReadyStatus(dosyaId, templateKey as any, 'Belge içeriği güncellendi')
})

/**
 * TEMİN 360 Belge Motoru (DocumentEngine)
 * - @worksuite-360/document-engine çekirdek motorunu genişletir.
 * - TEMİN 360 masaüstü IPC köprüsü, PDF export ve yazdırma kuyruğu entegrasyonlarını sağlar.
 */
export class DocumentEngine {
  private static get ipc() {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      return window.electron.ipcRenderer
    }
    return null
  }

  static queryExecutor = async (sql: string, params: any[]): Promise<any[]> => {
    return CoreDocumentEngine.queryExecutor(sql, params)
  }

  static resolveKey(templateKey: string): string {
    TemplateRegistry.init()
    return CoreDocumentEngine.resolveKey(templateKey)
  }

  static async resolveDocumentData<T = Record<string, unknown>>(params: {
    dosyaId: number
    templateKey: string
    invitedFirms?: unknown[]
  }): Promise<{ data: T; headerData: InstitutionalHeaderData; definition: DocumentDefinition<T> }> {
    TemplateRegistry.init()
    return CoreDocumentEngine.resolveDocumentData<T>(params)
  }

  static async loadOrCreateDocument<T = Record<string, unknown>>(
    params: LoadOrCreateDocumentParams
  ): Promise<DocumentRecord<T>> {
    TemplateRegistry.init()
    return CoreDocumentEngine.loadOrCreateDocument<T>(params)
  }

  static async saveDocument<T = Record<string, unknown>>(
    params: SaveDocumentParams<T>
  ): Promise<{ success: boolean; id?: number; updatedAt?: string; error?: string }> {
    TemplateRegistry.init()
    return CoreDocumentEngine.saveDocument<T>(params)
  }

  static async resetToDefault<T = Record<string, unknown>>(
    params: ResetDocumentParams
  ): Promise<DocumentRecord<T>> {
    TemplateRegistry.init()
    return CoreDocumentEngine.resetToDefault<T>(params)
  }

  static async syncWithSource<T = Record<string, unknown>>(
    params: SyncDocumentParams<T>
  ): Promise<DocumentRecord<T>> {
    TemplateRegistry.init()
    return CoreDocumentEngine.syncWithSource<T>(params)
  }

  static async deleteDocument(params: DeleteDocumentParams): Promise<boolean> {
    TemplateRegistry.init()
    return CoreDocumentEngine.deleteDocument(params)
  }

  static compileHtml(params: CompileHtmlParams): string {
    TemplateRegistry.init()
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

  static async exportPdf(
    params: ExportPdfParams
  ): Promise<{ success: boolean; filePath?: string }> {
    TemplateRegistry.init()
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
