import { dbClient } from '../db/dbClient'
import { ensureIhtiyacRaporuTables } from './schema'
import {
  IhtiyacRaporu,
  DosyaOption,
  LinkToDosyaOptions,
  LinkToDosyaResult,
  TransferKalemMode
} from './types'
import { mapIhtiyacKalemToTeminKalem } from './adapter'
import { ihtiyacRaporuRepository } from './repository'

function normalizeItemKey(item: {
  kalem_adi?: string | null
  tipi?: string | null
  birim?: string | null
  tasinir_kodu?: string | null
  okas_kodu?: string | null
  poz_no?: string | null
  aciklama?: string | null
}): string {
  const name = (item.kalem_adi || '').trim().toLowerCase()
  const tipi = (item.tipi || 'Mal').trim().toLowerCase()
  const birim = (item.birim || 'Adet').trim().toLowerCase()
  const tasinir = (item.tasinir_kodu || '').trim().toLowerCase()
  const okas = (item.okas_kodu || '').trim().toLowerCase()
  const poz = (item.poz_no || '').trim().toLowerCase()
  const aciklama = (item.aciklama || '').trim().toLowerCase()
  return `${name}___${tipi}___${birim}___${tasinir}___${okas}___${poz}___${aciklama}`
}

export const ihtiyacRaporuLinkManager = {
  /**
   * Raporu mevcut bir alım dosyasına bağlar.
   * Atomik transaction ile:
   * 1. Raporun durumunu ve dosya bağlantısını günceller.
   * 2. Kalem aktarımı istenmişse seçilen moda göre:
   *    - 'append_if_missing': Hedef dosyadaki mevcut kalemleri kontrol eder, mükerrer olanları atlar.
   *    - 'replace_all': Hedef dosyadaki mevcut kalemleri siler ve baştan yazar.
   *    - 'append_all': Tüm kalemleri dosyadaki mevcutların üzerine ekler.
   * 3. Hedef dosyanın talep eden personeli veya iş açıklaması boşsa rapordan tamamlar.
   * Tüm işlemler tek bir veritabanı transaction'ı içinde gerçekleştirilir; hata durumunda tamamen geri alınır (rollback).
   */
  async linkToDosya(
    raporId: number,
    dosyaId: number,
    options?: LinkToDosyaOptions
  ): Promise<LinkToDosyaResult> {
    const copyItems = options?.copyItemsToDosya !== false
    const mode: TransferKalemMode = options?.transferMode || 'append_if_missing'

    // Hedef dosya ve raporun varlığını doğrula
    const targetDosya = await dbClient.queryFirst<{
      id: number
      talep_eden_personel_id?: number | null
      ihtiyac_yeri?: string | null
      isin_aciklamasi?: string | null
    }>(
      `SELECT id, talep_eden_personel_id, ihtiyac_yeri, isin_aciklamasi FROM DATA_TeminDosyasi WHERE id = ?`,
      [dosyaId]
    )

    if (!targetDosya) {
      throw new Error(`Hedef alım dosyası bulunamadı (ID: ${dosyaId})`)
    }

    const rapor = await ihtiyacRaporuRepository.getRaporById(raporId)
    if (!rapor) {
      throw new Error(`İhtiyaç raporu bulunamadı (ID: ${raporId})`)
    }

    const txStatements: { sql: string; params?: unknown[] }[] = []

    // 1. Rapor bağlantısı ve durum güncellemesi
    txStatements.push({
      sql: `UPDATE DATA_IhtiyacRaporu SET temin_dosya_id = ?, durum = 'dosyaya_aktarildi', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params: [dosyaId, raporId]
    })

    let transferredCount = 0
    let skippedCount = 0
    const kalemler = await ihtiyacRaporuRepository.getRaporKalemleri(raporId)

    // 2. Kalemlerin aktarımı (Atomik işlem sırasına eklenir)
    if (copyItems && kalemler.length > 0) {
      const existingItems = await dbClient.query<{
        id: number
        sira_no: number
        kalem_adi: string
        tipi?: string | null
        birim: string
        tasinir_kodu?: string | null
        okas_kodu?: string | null
        poz_no?: string | null
        aciklama?: string | null
      }>(
        `SELECT id, sira_no, kalem_adi, tipi, birim, tasinir_kodu, okas_kodu, poz_no, aciklama FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY sira_no ASC`,
        [dosyaId]
      )

      if (mode === 'replace_all') {
        txStatements.push({
          sql: `DELETE FROM DATA_TeminKalem WHERE temin_dosya_id = ?`,
          params: [dosyaId]
        })

        let curSira = 1
        for (const k of kalemler) {
          const payload = mapIhtiyacKalemToTeminKalem(k, dosyaId, curSira++)
          txStatements.push({
            sql: `
              INSERT INTO DATA_TeminKalem (
                temin_dosya_id, sira_no, kalem_adi, tipi, birim,
                miktar, kdv_orani, tasinir_kodu, okas_kodu,
                poz_no, aciklama, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            params: [
              payload.temin_dosya_id,
              payload.sira_no,
              payload.kalem_adi,
              payload.tipi,
              payload.birim,
              payload.miktar,
              payload.kdv_orani,
              payload.tasinir_kodu,
              payload.okas_kodu,
              payload.poz_no,
              payload.aciklama
            ]
          })
          transferredCount++
        }
      } else if (mode === 'append_if_missing') {
        const existingSet = new Set(existingItems.map((item) => normalizeItemKey(item)))

        let curSira = existingItems.reduce((max, item) => Math.max(max, item.sira_no || 0), 0) + 1

        for (const k of kalemler) {
          const key = normalizeItemKey(k)
          if (existingSet.has(key)) {
            skippedCount++
          } else {
            existingSet.add(key)
            const payload = mapIhtiyacKalemToTeminKalem(k, dosyaId, curSira++)
            txStatements.push({
              sql: `
                INSERT INTO DATA_TeminKalem (
                  temin_dosya_id, sira_no, kalem_adi, tipi, birim,
                  miktar, kdv_orani, tasinir_kodu, okas_kodu,
                  poz_no, aciklama, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              `,
              params: [
                payload.temin_dosya_id,
                payload.sira_no,
                payload.kalem_adi,
                payload.tipi,
                payload.birim,
                payload.miktar,
                payload.kdv_orani,
                payload.tasinir_kodu,
                payload.okas_kodu,
                payload.poz_no,
                payload.aciklama
              ]
            })
            transferredCount++
          }
        }
      } else {
        // mode === 'append_all'
        let curSira = existingItems.reduce((max, item) => Math.max(max, item.sira_no || 0), 0) + 1

        for (const k of kalemler) {
          const payload = mapIhtiyacKalemToTeminKalem(k, dosyaId, curSira++)
          txStatements.push({
            sql: `
              INSERT INTO DATA_TeminKalem (
                temin_dosya_id, sira_no, kalem_adi, tipi, birim,
                miktar, kdv_orani, tasinir_kodu, okas_kodu,
                poz_no, aciklama, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
            params: [
              payload.temin_dosya_id,
              payload.sira_no,
              payload.kalem_adi,
              payload.tipi,
              payload.birim,
              payload.miktar,
              payload.kdv_orani,
              payload.tasinir_kodu,
              payload.okas_kodu,
              payload.poz_no,
              payload.aciklama
            ]
          })
          transferredCount++
        }
      }
    }

    // 3. Hedef dosyanın talep eden personeli veya iş açıklaması boşsa rapordan tamamla
    const dosyaUpdates: string[] = []
    const dosyaParams: (string | number)[] = []

    if (!targetDosya.talep_eden_personel_id && rapor.talep_eden_personel_id) {
      dosyaUpdates.push('talep_eden_personel_id = ?')
      dosyaParams.push(rapor.talep_eden_personel_id)
    }
    if (!targetDosya.ihtiyac_yeri && rapor.birim_adi) {
      dosyaUpdates.push('ihtiyac_yeri = ?')
      dosyaParams.push(rapor.birim_adi)
    }
    if (!targetDosya.isin_aciklamasi && (rapor.gerekce || rapor.baslik)) {
      dosyaUpdates.push('isin_aciklamasi = ?')
      dosyaParams.push((rapor.gerekce || rapor.baslik) as string)
    }

    if (dosyaUpdates.length > 0) {
      dosyaParams.push(dosyaId)
      txStatements.push({
        sql: `UPDATE DATA_TeminDosyasi SET ${dosyaUpdates.join(', ')} WHERE id = ?`,
        params: dosyaParams
      })
    }

    // Tüm adımları tek bir atomik transaction içinde işlet
    await dbClient.transaction(txStatements)

    return {
      success: true,
      transferredCount,
      skippedCount,
      totalRaporKalemCount: kalemler.length
    }
  },

  /**
   * Raporun alım dosyası bağlantısını kaldırır
   */
  async unlinkFromDosya(raporId: number): Promise<void> {
    await dbClient.run(
      `UPDATE DATA_IhtiyacRaporu SET temin_dosya_id = NULL, durum = 'taslak', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [raporId]
    )
  },

  /**
   * Dosyaya bağlama modalında listelenecek alım dosyalarını getirir
   */
  async getDosyalarForSelect(): Promise<DosyaOption[]> {
    const sql = `
      SELECT id, temin_no, dosya_no, konu, tur, tarih, status
      FROM DATA_TeminDosyasi
      ORDER BY id DESC
    `
    return dbClient.query<DosyaOption>(sql)
  },

  /**
   * Belirli bir alım dosyasına bağlı ihtiyaç raporunu getirir
   */
  async getLinkedRaporForDosya(dosyaId: number): Promise<IhtiyacRaporu | null> {
    await ensureIhtiyacRaporuTables()
    const sql = `
      SELECT 
        r.*,
        COUNT(k.id) AS kalem_sayisi,
        COALESCE(d.temin_no, d.dosya_no) AS dosya_no,
        d.konu AS dosya_konu,
        d.tur AS dosya_tur
      FROM DATA_IhtiyacRaporu r
      LEFT JOIN DATA_IhtiyacRaporuKalem k ON k.rapor_id = r.id
      LEFT JOIN DATA_TeminDosyasi d ON d.id = r.temin_dosya_id
      WHERE r.temin_dosya_id = ?
      GROUP BY r.id
      LIMIT 1
    `
    return dbClient.queryFirst<IhtiyacRaporu>(sql, [dosyaId])
  }
}
