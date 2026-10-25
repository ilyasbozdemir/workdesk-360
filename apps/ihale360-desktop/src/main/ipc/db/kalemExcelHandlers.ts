import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { workspaceManager } from '../../database/workspace'

export function registerKalemExcelHandlers(): void {
  /**
   * Malzeme Listesi (TANIM_Kalem) Excel Dışa Aktarma
   */
  ipcMain.handle('db:export-kalem-excel', async () => {
    try {
      const db = workspaceManager.getDb()
      const rows = db
        .prepare(
          'SELECT barkod_id, tasinir_kodu, okas_kodu, kalem_adi, tipi, birim, kategori, ozelligi, kdv_orani, mensei, notlar FROM TANIM_Kalem WHERE aktif_mi = 1 OR aktif_mi IS NULL ORDER BY id ASC'
        )
        .all() as any[]

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Malzeme Listesi (Excel)',
        defaultPath: 'Malzeme_Listesi.xlsx',
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx'] }]
      })
      if (canceled || !filePath) return { success: false, error: 'İptal edildi' }

      const exportData = rows.map((r) => ({
        'Barkod / ID': r.barkod_id || '',
        'Taşınır Kodu': r.tasinir_kodu || '',
        'OKAS Kodu': r.okas_kodu || '',
        'Kalem / Malzeme Adı': r.kalem_adi || '',
        Tipi: r.tipi || 'Mal',
        Birimi: r.birim || 'Adet',
        Kategori: r.kategori || '',
        'Açıklama / Özellik': r.ozelligi || '',
        'KDV Oranı (%)': r.kdv_orani ?? 20,
        Menşei: r.mensei || '',
        Notlar: r.notlar || ''
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Malzemeler')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      fs.writeFileSync(filePath, buffer)

      return { success: true, filePath, count: rows.length }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  /**
   * Malzeme Listesi (TANIM_Kalem) Excel İçe Aktarma
   */
  ipcMain.handle('db:import-kalem-excel', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Excel Dosyası Seç',
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx', 'xls', 'csv'] }],
        properties: ['openFile']
      })
      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, error: 'İptal edildi' }
      }

      const workbook = XLSX.readFile(filePaths[0])
      const sheetName = workbook.SheetNames[0]
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[]

      if (!rawRows || rawRows.length === 0) {
        return { success: false, error: 'Excel dosyasında veri bulunamadı.' }
      }

      const db = workspaceManager.getDb()
      let count = 0

      const stmtCheck = db.prepare('SELECT id FROM TANIM_Kalem WHERE barkod_id = ?')
      const stmtUpdate = db.prepare(`
        UPDATE TANIM_Kalem 
        SET tasinir_kodu = ?, okas_kodu = ?, kalem_adi = ?, tipi = ?, birim = ?, kategori = ?, ozelligi = ?, kdv_orani = ?, mensei = ?, notlar = ?, aktif_mi = 1
        WHERE barkod_id = ?
      `)
      const stmtInsert = db.prepare(`
        INSERT INTO TANIM_Kalem (barkod_id, tasinir_kodu, okas_kodu, kalem_adi, tipi, birim, kategori, ozelligi, kdv_orani, mensei, notlar, aktif_mi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `)

      const transaction = db.transaction((rows: any[]) => {
        for (const row of rows) {
          const keys = Object.keys(row)
          const findVal = (...names: string[]) => {
            for (const n of names) {
              const matchedKey = keys.find((k) => k.trim().toLowerCase() === n.trim().toLowerCase())
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                return String(row[matchedKey]).trim()
              }
            }
            return ''
          }

          const kalemAdi = findVal(
            'Kalem / Malzeme Adı',
            'Kalem Adı',
            'Kalem_Adi',
            'Malzeme Adı',
            'Malzeme_Adi',
            'Ad',
            'Adi',
            'kalem_adi',
            'malzeme_adi'
          )
          if (!kalemAdi) continue

          let barkodId = findVal(
            'Barkod / ID',
            'Barkod_ID',
            'Barkod ID',
            'Barkod',
            'barkod_id',
            'barkod',
            'ID',
            'id'
          )
          if (!barkodId) {
            barkodId = `M-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
          }

          const tasinirKodu = findVal('Taşınır Kodu', 'Tasinir_Kodu', 'tasinir_kodu', 'tasinir')
          const okasKodu = findVal('OKAS Kodu', 'Okas_Kodu', 'okas_kodu', 'okas')
          const tipi = findVal('Tipi', 'tipi', 'Tür', 'tur') || 'Mal'
          const birim = findVal('Birimi', 'Birim', 'birim') || 'Adet'
          const kategori = findVal('Kategori', 'kategori')
          const ozelligi = findVal(
            'Açıklama / Özellik',
            'Açıklama',
            'Özelliği',
            'ozelligi',
            'aciklama'
          )
          const kdvRaw = findVal('KDV Oranı (%)', 'KDV Oranı', 'KDV', 'kdv_orani', 'kdv')
          const kdvOrani = kdvRaw !== '' ? Number(kdvRaw) : 20
          const mensei = findVal('Menşei', 'mensei')
          const notlar = findVal('Notlar', 'notlar')

          const existing = stmtCheck.get(barkodId)
          if (existing) {
            stmtUpdate.run(
              tasinirKodu,
              okasKodu,
              kalemAdi,
              tipi,
              birim,
              kategori,
              ozelligi,
              isNaN(kdvOrani) ? 20 : kdvOrani,
              mensei,
              notlar,
              barkodId
            )
          } else {
            stmtInsert.run(
              barkodId,
              tasinirKodu,
              okasKodu,
              kalemAdi,
              tipi,
              birim,
              kategori,
              ozelligi,
              isNaN(kdvOrani) ? 20 : kdvOrani,
              mensei,
              notlar
            )
          }
          count++
        }
      })

      transaction(rawRows)
      workspaceManager.recordMutation()
      workspaceManager.save()

      return { success: true, count }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
