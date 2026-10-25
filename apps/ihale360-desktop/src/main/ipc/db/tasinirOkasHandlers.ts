import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { workspaceManager } from '../../database/workspace'

export function registerTasinirOkasHandlers(): void {
  /**
   * Taşınır Kodları Excel Şablonu İndirme
   */
  ipcMain.handle('db:export-tasinir-template', async () => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Taşınır Kodları Şablonu İndir',
        defaultPath: 'Tasinir_Kodlari_Sablonu.xlsx',
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx'] }]
      })
      if (canceled || !filePath) return { success: false, error: 'İptal edildi' }

      const sampleData = [
        {
          'Hesap Kodu': '150',
          'I. Düzey': '01',
          'II. Düzey': '01',
          'III. Düzey': '01',
          'IV. Düzey': '',
          'V. Düzey': '',
          Açıklama: 'Yazı Araçları',
          'Tam Kod': '150.01.01.01'
        },
        {
          'Hesap Kodu': '150',
          'I. Düzey': '01',
          'II. Düzey': '01',
          'III. Düzey': '02',
          'IV. Düzey': '',
          'V. Düzey': '',
          Açıklama: 'Yazım, Çizim ve Ölçüm Materyalleri',
          'Tam Kod': '150.01.01.02'
        }
      ]

      const ws = XLSX.utils.json_to_sheet(sampleData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Taşınır Kodları')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      fs.writeFileSync(filePath, buffer)

      return { success: true, filePath }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  /**
   * Taşınır Kodları Excel İçe Aktarma
   */
  ipcMain.handle('db:import-tasinir-excel', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Taşınır Kodları Excel Dosyası Seç',
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx', 'xls', 'csv'] }],
        properties: ['openFile']
      })
      if (canceled || !filePaths || filePaths.length === 0)
        return { success: false, error: 'İptal edildi' }

      const workbook = XLSX.readFile(filePaths[0])
      const sheetName = workbook.SheetNames[0]
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[]

      if (!rawRows || rawRows.length === 0) {
        return { success: false, error: 'Excel dosyasında veri bulunamadı.' }
      }

      const db = workspaceManager.getDb()
      let count = 0

      const stmtInsert = db.prepare(`
        INSERT OR REPLACE INTO TANIM_TasinirKod (tam_kod, hesap_kodu, duzey_1, duzey_2, duzey_3, duzey_4, duzey_5, aciklama)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

          let tamKod = findVal('Tam Kod', 'tam_kod', 'Kod', 'kod')
          let hesapKodu = findVal('Hesap Kodu', 'hesap_kodu', 'hesap')
          let d1 = findVal('I. Düzey', '1. Düzey', 'duzey_1', 'd1') || null
          let d2 = findVal('II. Düzey', '2. Düzey', 'duzey_2', 'd2') || null
          let d3 = findVal('III. Düzey', '3. Düzey', 'duzey_3', 'd3') || null
          let d4 = findVal('IV. Düzey', '4. Düzey', 'duzey_4', 'd4') || null
          let d5 = findVal('V. Düzey', '5. Düzey', 'duzey_5', 'd5') || null
          const aciklama = findVal('Açıklama', 'aciklama', 'Tanım', 'tanim', 'Ad', 'adi')

          if (!aciklama) continue

          if (tamKod && !hesapKodu) {
            const parts = tamKod.split('.')
            hesapKodu = parts[0] || ''
            d1 = parts[1] || d1
            d2 = parts[2] || d2
            d3 = parts[3] || d3
            d4 = parts[4] || d4
            d5 = parts[5] || d5
          } else if (hesapKodu && !tamKod) {
            tamKod = [hesapKodu, d1, d2, d3, d4, d5].filter(Boolean).join('.')
          }

          if (!hesapKodu && !tamKod) continue

          stmtInsert.run(tamKod, hesapKodu, d1, d2, d3, d4, d5, aciklama)
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

  /**
   * OKAS Kodları Şablonu İndirme
   */
  ipcMain.handle('db:export-okas-template', async () => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'OKAS Kodları Şablonu İndir',
        defaultPath: 'OKAS_Kodlari_Sablonu.xlsx',
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx'] }]
      })
      if (canceled || !filePath) return { success: false, error: 'İptal edildi' }

      const sampleData = [
        {
          'OKAS Kodu': '30192700',
          Bölüm: '30',
          Grup: '301',
          Sınıf: '3019',
          Açıklama: 'Yazıcılar ve faks cihazları'
        },
        {
          'OKAS Kodu': '30200000',
          Bölüm: '30',
          Grup: '302',
          Sınıf: '3020',
          Açıklama: 'Bilgisayar donanımları ve malzemeleri'
        }
      ]

      const ws = XLSX.utils.json_to_sheet(sampleData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'OKAS Kodları')
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      fs.writeFileSync(filePath, buffer)

      return { success: true, filePath }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  /**
   * OKAS Kodları Excel İçe Aktarma
   */
  ipcMain.handle('db:import-okas-excel', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'OKAS Kodları Excel Dosyası Seç',
        filters: [{ name: 'Excel Dosyası', extensions: ['xlsx', 'xls', 'csv'] }],
        properties: ['openFile']
      })
      if (canceled || !filePaths || filePaths.length === 0)
        return { success: false, error: 'İptal edildi' }

      const workbook = XLSX.readFile(filePaths[0])
      const sheetName = workbook.SheetNames[0]
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[]

      if (!rawRows || rawRows.length === 0) {
        return { success: false, error: 'Excel dosyasında veri bulunamadı.' }
      }

      const db = workspaceManager.getDb()
      let count = 0

      const stmtInsert = db.prepare(`
        INSERT OR REPLACE INTO TANIM_OkasKod (kod, bolum, grup, sinif, aciklama)
        VALUES (?, ?, ?, ?, ?)
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

          const rawKod = findVal('OKAS Kodu', 'OKAS Kod', 'okas_kodu', 'kod', 'Kod')
          const cleanKod = rawKod.replace(/\D/g, '').slice(0, 8)
          const aciklama = findVal('Açıklama', 'aciklama', 'Tanım', 'tanim', 'Ad', 'adi')

          if (!cleanKod || cleanKod.length < 2 || !aciklama) continue

          const bolum =
            findVal('Bölüm', 'bolum') || (cleanKod.length >= 2 ? cleanKod.slice(0, 2) : '')
          const grup = findVal('Grup', 'grup') || (cleanKod.length >= 3 ? cleanKod.slice(0, 3) : '')
          const sinif =
            findVal('Sınıf', 'sinif') || (cleanKod.length >= 4 ? cleanKod.slice(0, 4) : '')

          stmtInsert.run(cleanKod, bolum, grup, sinif, aciklama)
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
