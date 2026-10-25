import { ipcMain } from 'electron'
import { resolveTemplateKey } from '@temin360/document-templates'
import { workspaceManager } from '../database/workspace'
import {
  exportDocxHandler,
  exportUdfHandler,
  printHtmlHandler,
  previewPdfHandler,
  openPdfExternalHandler,
  exportPdfHandler,
  exportZipHandler,
  exportHtmlHandler,
  exportXlsxHandler,
  importDocxHandler,
  importXlsxHandler,
  openExcelHandler,
  convertDocxToPdfHandler,
  convertImagesToPdfHandler,
  saveBase64FileHandler,
  resolveDocumentPayload,
  resolveAllCiktiData
} from './document'

export function registerDocumentIpcHandlers(): void {
  // Helper to register both namespaced channel and legacy aliases
  const handleDoc = (
    channel: string,
    alias: string,
    handler: (event: any, ...args: any[]) => Promise<any> | any
  ): void => {
    ipcMain.handle(channel, handler)
    if (alias) {
      ipcMain.handle(alias, handler)
    }
  }

  // 1. DOCX Export
  handleDoc('belge:export-docx', 'export-docx', (_, payload: any, legacyFileName?: string) =>
    exportDocxHandler(payload, legacyFileName)
  )
  ipcMain.handle('app:export-docx', (_, payload: any, legacyFileName?: string) =>
    exportDocxHandler(payload, legacyFileName)
  )
  ipcMain.handle('app:save-docx-as', (_, payload: any, legacyFileName?: string) =>
    exportDocxHandler(payload, legacyFileName)
  )
  ipcMain.handle('save-docx-as', (_, payload: any, legacyFileName?: string) =>
    exportDocxHandler(payload, legacyFileName)
  )

  // 2. UDF Export
  handleDoc('belge:export-udf', 'export-udf', (_, payload: any, legacyFileName?: string) =>
    exportUdfHandler(payload, legacyFileName)
  )
  ipcMain.handle('app:export-udf', (_, payload: any, legacyFileName?: string) =>
    exportUdfHandler(payload, legacyFileName)
  )

  // 3. Print HTML
  handleDoc('belge:print-html', 'print-html', (_, payload: any, legacyOptions?: any) =>
    printHtmlHandler(payload, legacyOptions)
  )
  ipcMain.handle('app:print-html', (_, payload: any, legacyOptions?: any) =>
    printHtmlHandler(payload, legacyOptions)
  )

  // 4. Preview PDF
  handleDoc('belge:preview-pdf', 'preview-pdf', (_, htmlContent: string) =>
    previewPdfHandler(htmlContent)
  )

  // 5. Open PDF External
  handleDoc('belge:open-pdf-external', 'open-pdf-external', (_, payload: any) =>
    openPdfExternalHandler(payload)
  )

  // 5.1 Save PDF As & Export PDF
  handleDoc(
    'belge:export-pdf',
    'export-pdf',
    (_, payload: any, legacyOptions?: any, legacyFileName?: string) =>
      exportPdfHandler(payload, legacyOptions, legacyFileName)
  )
  handleDoc(
    'app:save-pdf-as',
    'save-pdf-as',
    (_, payload: any, legacyOptions?: any, legacyFileName?: string) =>
      exportPdfHandler(payload, legacyOptions, legacyFileName)
  )
  ipcMain.handle(
    'app:export-pdf',
    (_, payload: any, legacyOptions?: any, legacyFileName?: string) =>
      exportPdfHandler(payload, legacyOptions, legacyFileName)
  )

  // 5.2 Open PDF Preview
  handleDoc('app:open-pdf-preview', 'open-pdf-preview', (_, payload: any) =>
    openPdfExternalHandler(payload)
  )

  // 5.3 Batch Export as ZIP
  handleDoc('belge:export-zip', 'export-zip', (_, payload: any, legacyZipName?: string) =>
    exportZipHandler(payload, legacyZipName)
  )
  ipcMain.handle('app:export-zip', (_, payload: any, legacyZipName?: string) =>
    exportZipHandler(payload, legacyZipName)
  )

  // 6. Export HTML
  handleDoc(
    'belge:export-html',
    'export-html',
    (_, htmlContent: string, options?: { paperSize?: string }, fileName?: string) =>
      exportHtmlHandler(htmlContent, options, fileName)
  )

  // 7. Export XLSX
  handleDoc('belge:export-xlsx', 'export-xlsx', (_, bufferData: Uint8Array | ArrayBuffer) =>
    exportXlsxHandler(bufferData)
  )

  // 8. Import DOCX
  handleDoc('belge:import-docx', 'import-docx', () => importDocxHandler())

  // 9. Import XLSX
  handleDoc('belge:import-xlsx', 'import-xlsx', () => importXlsxHandler())

  // 10. Open Excel External
  handleDoc('belge:open-excel', 'open-excel', () => openExcelHandler())

  // 11. Complete Document & Stage Data Resolver
  handleDoc(
    'belge:get-document-payload',
    'get-document-payload',
    async (_, payload: { dosyaId?: number; documentId?: string }) => {
      try {
        const db = workspaceManager.getDb()
        if (!db) return { success: false, error: 'Çalışma alanı veritabanı aktif değil' }
        return resolveDocumentPayload(db, payload)
      } catch (e: any) {
        return { success: false, error: e?.message || 'Payload hatası' }
      }
    }
  )

  // 12. Full Dossier Document Center & Templates Engine
  handleDoc(
    'belge:get-all-cikti-data',
    'get-all-cikti-data',
    async (
      _,
      payload: {
        dosyaId?: number
        sablonId?: number
        documentId?: string
        templateId?: string
      }
    ) => {
      try {
        const db = workspaceManager.getDb()
        if (!db) return { success: false, error: 'Çalışma alanı veritabanı aktif değil' }
        return resolveAllCiktiData(db, payload)
      } catch (e: any) {
        return { success: false, error: e?.message || 'Çıktı verisi hatası' }
      }
    }
  )

  // 13. Word (DOCX) ➔ PDF Converter
  handleDoc('belge:convert-docx-to-pdf', 'convert-docx-to-pdf', (_, payload?: any) =>
    convertDocxToPdfHandler(payload)
  )

  // 14. Images (JPG/PNG/WEBP) ➔ PDF Converter
  handleDoc('belge:convert-images-to-pdf', 'convert-images-to-pdf', (_, payload: any) =>
    convertImagesToPdfHandler(payload)
  )

  // 15. Save Base64 File Directly
  handleDoc('belge:save-base64-file', 'save-base64-file', (_, payload: any) =>
    saveBase64FileHandler(payload)
  )

  // 16. Get Document (Dosya bazlı belge verisini getirme)
  handleDoc(
    'belge:get-document',
    'get-document',
    async (_, payload: { dosyaId: number; templateKey: string }) => {
      try {
        const db = workspaceManager.getDb()
        if (!db) {
          return { success: false, error: 'Çalışma alanı veritabanı aktif değil' }
        }
        if (!payload?.dosyaId || !payload?.templateKey) {
          return { success: false, error: 'dosyaId ve templateKey parametreleri zorunludur' }
        }
        const cleanKey = String(payload.templateKey)
          .replace(/\.html$/i, '')
          .trim()
        const canonicalKey = resolveTemplateKey(cleanKey) || cleanKey
        const hyphenKey = canonicalKey.replace(/_/g, '-')
        const underscoreKey = canonicalKey.replace(/-/g, '_')
        const candidateKeys = Array.from(
          new Set([
            cleanKey,
            canonicalKey,
            hyphenKey,
            underscoreKey,
            `${cleanKey}.html`,
            `${canonicalKey}.html`,
            `${hyphenKey}.html`,
            `${underscoreKey}.html`
          ])
        )
        const placeholders = candidateKeys.map(() => '?').join(', ')
        const row = db
          .prepare(
            `SELECT id, temin_dosya_id, dosya_id, sablon_kodu, veri_json, sablon_versiyon, created_at, updated_at 
             FROM DATA_DosyaSablonVeri 
             WHERE temin_dosya_id = ? AND sablon_kodu IN (${placeholders}) 
             ORDER BY updated_at DESC, id DESC LIMIT 1`
          )
          .get(payload.dosyaId, ...candidateKeys) as
          | {
              id: number
              temin_dosya_id: number
              dosya_id?: number
              sablon_kodu: string
              veri_json: string
              sablon_versiyon?: number
              created_at: string
              updated_at: string
            }
          | undefined

        if (!row) {
          return { success: true, exists: false, record: null }
        }

        let parsedData: unknown = null
        try {
          parsedData = JSON.parse(row.veri_json)
        } catch {
          parsedData = {}
        }

        return {
          success: true,
          exists: true,
          record: {
            id: row.id,
            dosyaId: row.temin_dosya_id,
            templateKey: row.sablon_kodu,
            data: parsedData,
            sablonVersiyon: row.sablon_versiyon || 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return { success: false, error: msg }
      }
    }
  )

  // 17. Save Document (Dosya bazlı atomik & transaction ile belge kaydetme)
  handleDoc(
    'belge:save-document',
    'save-document',
    async (
      _,
      payload: {
        dosyaId: number
        templateKey: string
        data: unknown
        sablonVersiyon?: number
      }
    ) => {
      try {
        const db = workspaceManager.getDb()
        if (!db) {
          return { success: false, error: 'Çalışma alanı veritabanı aktif değil' }
        }
        if (!payload?.dosyaId || !payload?.templateKey) {
          return { success: false, error: 'dosyaId ve templateKey parametreleri zorunludur' }
        }
        const cleanKey = String(payload.templateKey)
          .replace(/\.html$/i, '')
          .trim()
        const canonicalKey = resolveTemplateKey(cleanKey) || cleanKey
        const hyphenKey = canonicalKey.replace(/_/g, '-')
        const underscoreKey = canonicalKey.replace(/-/g, '_')
        const candidateKeys = Array.from(
          new Set([
            cleanKey,
            canonicalKey,
            hyphenKey,
            underscoreKey,
            `${cleanKey}.html`,
            `${canonicalKey}.html`,
            `${hyphenKey}.html`,
            `${underscoreKey}.html`
          ])
        )
        const jsonStr =
          typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data || {})
        const versiyon = payload.sablonVersiyon || 1

        const saveTx = db.transaction(() => {
          const sablonPlaceholders = candidateKeys.map(() => '?').join(', ')
          const sablonRow = db
            .prepare(
              `SELECT id FROM TANIM_Sablon WHERE dosya_adi IN (${sablonPlaceholders}) LIMIT 1`
            )
            .get(...candidateKeys) as { id?: number } | undefined
          const sablonId = sablonRow?.id || null

          // Canonical key ile kaydet
          db.prepare(
            `INSERT INTO DATA_DosyaSablonVeri (temin_dosya_id, dosya_id, sablon_id, sablon_kodu, veri_json, sablon_versiyon, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(temin_dosya_id, sablon_kodu)
             DO UPDATE SET 
               veri_json = excluded.veri_json,
               sablon_id = COALESCE(excluded.sablon_id, DATA_DosyaSablonVeri.sablon_id),
               dosya_id = excluded.dosya_id,
               sablon_versiyon = excluded.sablon_versiyon,
               updated_at = CURRENT_TIMESTAMP`
          ).run(payload.dosyaId, payload.dosyaId, sablonId, canonicalKey, jsonStr, versiyon)

          // Varsa eski alternatif anahtarlı yinelenen kayıtları temizle
          const otherKeys = candidateKeys.filter((k) => k !== canonicalKey)
          if (otherKeys.length > 0) {
            const otherPlaceholders = otherKeys.map(() => '?').join(', ')
            db.prepare(
              `DELETE FROM DATA_DosyaSablonVeri 
               WHERE temin_dosya_id = ? AND sablon_kodu IN (${otherPlaceholders})`
            ).run(payload.dosyaId, ...otherKeys)
          }

          // Atomik Senkronizasyon: Belgedeki sunulacak makam adını dosya genel kaydıyla senkronize et
          try {
            const parsed = typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data
            const makam = (parsed as any)?.sunulacakMakamAdi || (parsed as any)?.sunulacakMakam
            if (typeof makam === 'string' && makam.trim() !== '') {
              db.prepare(
                `UPDATE DATA_TeminDosyasi SET sunulacak_makam = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
              ).run(makam.trim(), payload.dosyaId)
            }
          } catch (syncErr) {
            console.warn('[belge:save-document] DATA_TeminDosyasi sync warning:', syncErr)
          }

          const savedRow = db
            .prepare(
              `SELECT id, updated_at FROM DATA_DosyaSablonVeri WHERE temin_dosya_id = ? AND sablon_kodu = ?`
            )
            .get(payload.dosyaId, canonicalKey) as { id: number; updated_at: string } | undefined

          return savedRow
        })

        const result = saveTx()
        return {
          success: true,
          id: result?.id,
          updatedAt: result?.updated_at,
          dosyaId: payload.dosyaId,
          templateKey: cleanKey
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return { success: false, error: msg }
      }
    }
  )

  // 18. Reset Document to Default (Varsayılana Dön: Mevcut kaydı revizyona arşivle ve sil)
  handleDoc(
    'belge:reset-document',
    'reset-document',
    async (_, payload: { dosyaId: number; templateKey: string }) => {
      try {
        const db = workspaceManager.getDb()
        if (!db) {
          return { success: false, error: 'Çalışma alanı veritabanı aktif değil' }
        }
        if (!payload?.dosyaId || !payload?.templateKey) {
          return { success: false, error: 'dosyaId ve templateKey parametreleri zorunludur' }
        }
        const cleanKey = String(payload.templateKey)
          .replace(/\.html$/i, '')
          .trim()
        const canonicalKey = resolveTemplateKey(cleanKey) || cleanKey
        const hyphenKey = canonicalKey.replace(/_/g, '-')
        const underscoreKey = canonicalKey.replace(/-/g, '_')
        const candidateKeys = Array.from(
          new Set([
            cleanKey,
            canonicalKey,
            hyphenKey,
            underscoreKey,
            `${cleanKey}.html`,
            `${canonicalKey}.html`,
            `${hyphenKey}.html`,
            `${underscoreKey}.html`
          ])
        )

        const resetTx = db.transaction(() => {
          const placeholders = candidateKeys.map(() => '?').join(', ')
          const existing = db
            .prepare(
              `SELECT id, veri_json FROM DATA_DosyaSablonVeri 
               WHERE temin_dosya_id = ? AND sablon_kodu IN (${placeholders})
               ORDER BY updated_at DESC, id DESC LIMIT 1`
            )
            .get(payload.dosyaId, ...candidateKeys) as { id: number; veri_json: string } | undefined

          if (existing?.veri_json) {
            try {
              db.prepare(
                `INSERT INTO DATA_DosyaRevizyon (temin_dosya_id, modul_adi, surec_kodu, belge_kodu, versiyon, baslik, veri_json)
                 VALUES (?, 'BELGE_YONETIMI', 'USER_RESET', ?, 'v_reset', 'Varsayılana Dönüş Öncesi Kullanıcı Verisi', ?)`
              ).run(payload.dosyaId, canonicalKey, existing.veri_json)
            } catch (revErr) {
              console.warn('[belge:reset-document] DATA_DosyaRevizyon archive warning:', revErr)
            }
          }

          db.prepare(
            `DELETE FROM DATA_DosyaSablonVeri WHERE temin_dosya_id = ? AND sablon_kodu IN (${placeholders})`
          ).run(payload.dosyaId, ...candidateKeys)
        })

        resetTx()
        return { success: true, dosyaId: payload.dosyaId, templateKey: cleanKey }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return { success: false, error: msg }
      }
    }
  )

  // 19. Delete Document (Belirli dosyanın belgesini silme)
  handleDoc(
    'belge:delete-document',
    'delete-document',
    async (_, payload: { dosyaId: number; templateKey: string }) => {
      try {
        const db = workspaceManager.getDb()
        if (!db) {
          return { success: false, error: 'Çalışma alanı veritabanı aktif değil' }
        }
        if (!payload?.dosyaId || !payload?.templateKey) {
          return { success: false, error: 'dosyaId ve templateKey parametreleri zorunludur' }
        }
        const cleanKey = String(payload.templateKey)
          .replace(/\.html$/i, '')
          .trim()

        db.prepare(
          `DELETE FROM DATA_DosyaSablonVeri WHERE temin_dosya_id = ? AND (sablon_kodu = ? OR sablon_kodu = ?)`
        ).run(payload.dosyaId, cleanKey, `${cleanKey}.html`)

        return { success: true, dosyaId: payload.dosyaId, templateKey: cleanKey }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        return { success: false, error: msg }
      }
    }
  )
}
