import { dbClient } from '../db/dbClient'
import { ensureIhtiyacRaporuTables } from './schema'
import { IhtiyacRaporu, IhtiyacRaporuKalem, IhtiyacRaporuFilters } from './types'
import { sanitizeMiktar, sanitizeKdvOrani, sanitizeBirimFiyat } from './adapter'
import { calculateTotals } from '../../utils/ihtiyacRaporuTotals'

export const ihtiyacRaporuRepository = {
  /**
   * Tüm ihtiyaç raporlarını ilişkili alım dosyası bilgileri ve kalem sayılarıyla birlikte listeler
   */
  async getRaporlar(filters?: IhtiyacRaporuFilters): Promise<IhtiyacRaporu[]> {
    await ensureIhtiyacRaporuTables()
    let sql = `
      SELECT 
        r.*,
        COUNT(k.id) AS kalem_sayisi,
        COALESCE(d.temin_no, d.dosya_no) AS dosya_no,
        d.konu AS dosya_konu,
        d.tur AS dosya_tur
      FROM DATA_IhtiyacRaporu r
      LEFT JOIN DATA_IhtiyacRaporuKalem k ON k.rapor_id = r.id
      LEFT JOIN DATA_TeminDosyasi d ON d.id = r.temin_dosya_id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (filters?.durum && filters.durum !== 'all') {
      sql += ` AND r.durum = ?`
      params.push(filters.durum)
    }

    if (filters?.temin_dosya_id != null) {
      sql += ` AND r.temin_dosya_id = ?`
      params.push(filters.temin_dosya_id)
    } else if (filters?.baglantiDurumu === 'bagli') {
      sql += ` AND r.temin_dosya_id IS NOT NULL`
    } else if (filters?.baglantiDurumu === 'bagimsiz') {
      sql += ` AND r.temin_dosya_id IS NULL`
    }

    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`
      sql += ` AND (
        r.rapor_no LIKE ? 
        OR r.baslik LIKE ? 
        OR r.gerekce LIKE ? 
        OR r.birim_adi LIKE ?
        OR d.temin_no LIKE ?
        OR d.dosya_no LIKE ?
        OR d.konu LIKE ?
      )`
      params.push(q, q, q, q, q, q, q)
    }

    sql += ` GROUP BY r.id ORDER BY r.id DESC`

    return dbClient.query<IhtiyacRaporu>(sql, params)
  },

  /**
   * ID'ye göre tekil ihtiyaç raporunu getirir
   */
  async getRaporById(id: number): Promise<IhtiyacRaporu | null> {
    await ensureIhtiyacRaporuTables()
    const sql = `
      SELECT 
        r.*,
        COUNT(k.id) AS kalem_sayisi,
        COALESCE(d.temin_no, d.dosya_no) AS dosya_no,
        d.konu AS dosya_konu,
        d.tur AS dosya_tur,
        d.evrak_sayisi AS dosya_evrak_sayisi
      FROM DATA_IhtiyacRaporu r
      LEFT JOIN DATA_IhtiyacRaporuKalem k ON k.rapor_id = r.id
      LEFT JOIN DATA_TeminDosyasi d ON d.id = r.temin_dosya_id
      WHERE r.id = ?
      GROUP BY r.id
    `
    return dbClient.queryFirst<IhtiyacRaporu>(sql, [id])
  },

  /**
   * Rapora ait ihtiyaç kalemlerini sıralı olarak getirir
   */
  async getRaporKalemleri(raporId: number): Promise<IhtiyacRaporuKalem[]> {
    await ensureIhtiyacRaporuTables()
    const sql = `
      SELECT * FROM DATA_IhtiyacRaporuKalem
      WHERE rapor_id = ?
      ORDER BY COALESCE(sira_no, 999999) ASC, id ASC
    `
    return dbClient.query<IhtiyacRaporuKalem>(sql, [raporId])
  },

  /**
   * Yıl bazlı sıradaki rapor numarasını üretir (Örn: IR-2026/001)
   */
  async getNextRaporNo(year?: number): Promise<string> {
    await ensureIhtiyacRaporuTables()
    const targetYear = year || new Date().getFullYear()
    const prefix = `IR-${targetYear}/`
    const sql = `
      SELECT rapor_no FROM DATA_IhtiyacRaporu
      WHERE rapor_no LIKE ?
      ORDER BY id DESC LIMIT 1
    `
    const lastRow = await dbClient.queryFirst<{ rapor_no: string }>(sql, [`${prefix}%`])

    if (lastRow?.rapor_no) {
      const match = lastRow.rapor_no.match(/(\d+)$/)
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1
        return `${prefix}${nextNum.toString().padStart(3, '0')}`
      }
    }
    return `${prefix}001`
  },

  /**
   * Yeni bir İhtiyaç Raporu ve kalemlerini oluşturur
   */
  async createRapor(
    rapor: Omit<IhtiyacRaporu, 'id' | 'created_at' | 'updated_at' | 'kalem_sayisi'>,
    kalemler: IhtiyacRaporuKalem[] = []
  ): Promise<number> {
    await ensureIhtiyacRaporuTables()
    const totals = calculateTotals(kalemler)

    const insertSql = `
      INSERT INTO DATA_IhtiyacRaporu (
        rapor_no, baslik, gerekce, birim_id, birim_adi,
        talep_eden_personel_id, talep_eden_personel, talep_eden_unvan,
        durum, temin_dosya_id, tarih, onay_tarihi,
        tahmini_butce, notlar, evrak_sayisi, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    const res = await dbClient.run(insertSql, [
      rapor.rapor_no,
      rapor.baslik,
      rapor.gerekce || null,
      rapor.birim_id || null,
      rapor.birim_adi || null,
      rapor.talep_eden_personel_id || null,
      rapor.talep_eden_personel || null,
      rapor.talep_eden_unvan || null,
      rapor.durum || 'taslak',
      rapor.temin_dosya_id || null,
      rapor.tarih || new Date().toISOString().split('T')[0],
      rapor.onay_tarihi || null,
      rapor.tahmini_butce ?? totals.genelToplam,
      rapor.notlar || null,
      rapor.evrak_sayisi || null
    ])

    const newId = Number(res.lastInsertRowid)

    // Kalemleri kaydet
    if (newId && kalemler.length > 0) {
      await this.saveKalemler(newId, kalemler)
    }

    return newId
  },

  /**
   * Mevcut İhtiyaç Raporunu ve kalemlerini günceller
   */
  async updateRapor(
    id: number,
    rapor: Partial<IhtiyacRaporu>,
    kalemler?: IhtiyacRaporuKalem[]
  ): Promise<void> {
    const fields: string[] = []
    const values: (string | number | null)[] = []

    if (rapor.rapor_no !== undefined) {
      fields.push('rapor_no = ?')
      values.push(rapor.rapor_no)
    }
    if (rapor.baslik !== undefined) {
      fields.push('baslik = ?')
      values.push(rapor.baslik)
    }
    if (rapor.gerekce !== undefined) {
      fields.push('gerekce = ?')
      values.push(rapor.gerekce)
    }
    if (rapor.birim_id !== undefined) {
      fields.push('birim_id = ?')
      values.push(rapor.birim_id)
    }
    if (rapor.birim_adi !== undefined) {
      fields.push('birim_adi = ?')
      values.push(rapor.birim_adi)
    }
    if (rapor.talep_eden_personel_id !== undefined) {
      fields.push('talep_eden_personel_id = ?')
      values.push(rapor.talep_eden_personel_id)
    }
    if (rapor.talep_eden_personel !== undefined) {
      fields.push('talep_eden_personel = ?')
      values.push(rapor.talep_eden_personel)
    }
    if (rapor.talep_eden_unvan !== undefined) {
      fields.push('talep_eden_unvan = ?')
      values.push(rapor.talep_eden_unvan)
    }
    if (rapor.durum !== undefined) {
      fields.push('durum = ?')
      values.push(rapor.durum)
    }
    if (rapor.temin_dosya_id !== undefined) {
      fields.push('temin_dosya_id = ?')
      values.push(rapor.temin_dosya_id)
    }
    if (rapor.tarih !== undefined) {
      fields.push('tarih = ?')
      values.push(rapor.tarih)
    }
    if (rapor.onay_tarihi !== undefined) {
      fields.push('onay_tarihi = ?')
      values.push(rapor.onay_tarihi)
    }
    if (rapor.tahmini_butce !== undefined) {
      fields.push('tahmini_butce = ?')
      values.push(rapor.tahmini_butce)
    }
    if (rapor.notlar !== undefined) {
      fields.push('notlar = ?')
      values.push(rapor.notlar)
    }
    if (rapor.evrak_sayisi !== undefined) {
      fields.push('evrak_sayisi = ?')
      values.push(rapor.evrak_sayisi)
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')

    if (fields.length > 0) {
      values.push(id)
      await dbClient.run(`UPDATE DATA_IhtiyacRaporu SET ${fields.join(', ')} WHERE id = ?`, values)
    }

    if (kalemler !== undefined) {
      await this.saveKalemler(id, kalemler)
    }
  },

  /**
   * Rapor kalemlerini temizleyip topluca yeniden kaydeder
   */
  async saveKalemler(raporId: number, kalemler: IhtiyacRaporuKalem[]): Promise<void> {
    await dbClient.run(`DELETE FROM DATA_IhtiyacRaporuKalem WHERE rapor_id = ?`, [raporId])

    for (let i = 0; i < kalemler.length; i++) {
      const k = kalemler[i]
      await dbClient.run(
        `
        INSERT INTO DATA_IhtiyacRaporuKalem (
          rapor_id, sira_no, kalem_adi, tipi, birim,
          miktar, kdv_orani, tasinir_kodu, okas_kodu,
          poz_no, aciklama, tahmini_birim_fiyat,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
        [
          raporId,
          k.sira_no || i + 1,
          k.kalem_adi.trim(),
          k.tipi || 'Mal',
          k.birim || 'Adet',
          sanitizeMiktar(k.miktar, 1),
          sanitizeKdvOrani(k.kdv_orani, 20),
          k.tasinir_kodu || null,
          k.okas_kodu || null,
          k.poz_no || null,
          k.aciklama || null,
          sanitizeBirimFiyat(k.tahmini_birim_fiyat, 0)
        ]
      )
    }
  },

  /**
   * Raporu siler (Kalemler CASCADE ile SQLite tarafından otomatik silinir)
   */
  async deleteRapor(id: number): Promise<void> {
    await dbClient.run(`DELETE FROM DATA_IhtiyacRaporu WHERE id = ?`, [id])
  },

  /**
   * Mevcut bir raporu kopyalayarak yeni, bağımsız bir kayıt oluşturur:
   * - Farklı ID ve yeni benzersiz Rapor Numarası
   * - Durum: 'taslak'
   * - temin_dosya_id: null (bağlantısız bağımsız kopya)
   * - Kalemler bağımsız olarak klonlanır
   */
  async duplicateRapor(id: number): Promise<number> {
    const source = await this.getRaporById(id)
    if (!source) {
      throw new Error(`Kopyalanacak rapor bulunamadı (ID: ${id})`)
    }

    const sourceKalemler = await this.getRaporKalemleri(id)

    // Yeni benzersiz rapor no
    const currentYear = new Date().getFullYear()
    const baseNewNo = await this.getNextRaporNo(currentYear)

    const newRapor: Omit<IhtiyacRaporu, 'id' | 'created_at' | 'updated_at' | 'kalem_sayisi'> = {
      rapor_no: baseNewNo,
      baslik: `${source.baslik} (Kopya)`,
      gerekce: source.gerekce || null,
      birim_id: source.birim_id || null,
      birim_adi: source.birim_adi || null,
      talep_eden_personel_id: source.talep_eden_personel_id || null,
      talep_eden_personel: source.talep_eden_personel || null,
      talep_eden_unvan: source.talep_eden_unvan || null,
      durum: 'taslak',
      temin_dosya_id: null, // Asla eski dosya bağlantısını taşımaz
      tarih: new Date().toISOString().split('T')[0],
      onay_tarihi: null,
      tahmini_butce: source.tahmini_butce || 0,
      evrak_sayisi: null, // Yeni rapor bağımsız bir taslak olduğundan eski resmî EBYS evrak numarasını taşımaz
      notlar: source.notlar
        ? `[${source.rapor_no} raporundan kopyalandı] ${source.notlar}`
        : `[${source.rapor_no} raporundan kopyalandı]`
    }

    const clonedKalemler: IhtiyacRaporuKalem[] = sourceKalemler.map((k) => ({
      kalem_adi: k.kalem_adi,
      tipi: k.tipi,
      birim: k.birim,
      miktar: k.miktar,
      kdv_orani: k.kdv_orani,
      tasinir_kodu: k.tasinir_kodu,
      okas_kodu: k.okas_kodu,
      poz_no: k.poz_no,
      aciklama: k.aciklama,
      tahmini_birim_fiyat: k.tahmini_birim_fiyat
    }))

    return this.createRapor(newRapor, clonedKalemler)
  }
}
