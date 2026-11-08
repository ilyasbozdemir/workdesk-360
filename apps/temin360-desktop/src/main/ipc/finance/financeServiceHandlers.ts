import { ipcMain } from 'electron'
import { workspaceManager } from '../../database/workspace'
import { validateIpcSender } from '../utils/senderGuard'

export interface IncomingProcurementItem {
  id: number
  dosyaNo: string
  konu: string
  harcamaBirimi: string
  aliciTur: string
  kazananFirma: string
  kazananVergiNo: string
  kazananIban: string
  brutTutar: number
  damgaVergisi: number
  kararPulu: number
  kdvTevkifati: number
  netOdenecek: number
  butceTertibi: string
  durumAsamaId: number
  status: string
  tarih: string
  notlar: string
}

export interface DirectPaymentPayload {
  dosyaId: number
  faturaNo: string
  faturaTarihi: string
  brutTutar: number
  damgaVergisi: number
  kararPulu: number
  kdvTevkifat: number
  netTutar: number
  maliNot?: string
}

export function registerFinanceServiceHandlers(): void {
  /**
   * Gelen Doğrudan Temin Dosyaları Listesi (`finance:get-incoming-procurements`)
   */
  ipcMain.handle('finance:get-incoming-procurements', async (event): Promise<IncomingProcurementItem[]> => {
    validateIpcSender(event, 'finance:get-incoming-procurements')
    try {
      const db = workspaceManager.getDb()
      const sql = `
        SELECT 
          d.id,
          COALESCE(d.temin_no, '#' || d.id) as dosyaNo,
          COALESCE(d.konu, 'Doğrudan Temin Dosyası') as konu,
          COALESCE(d.harcama_birimi, b.ad, 'Harcama Birimi') as harcamaBirimi,
          COALESCE(d.tur, 'mal') as aliciTur,
          COALESCE(f.unvan, 'Yüklenici Belirlenmedi') as kazananFirma,
          COALESCE(f.vergi_no, '-') as kazananVergiNo,
          COALESCE(f.hesap_no, '-') as kazananIban,
          COALESCE(d.yaklasik_maliyet, 0) as brutTutar,
          COALESCE(d.kesinti_damga, 0) as damgaVergisi,
          COALESCE(d.kesinti_karar_pulu, 0) as kararPulu,
          COALESCE(d.kesinti_kdv_tevkifat, 0) as kdvTevkifati,
          COALESCE(d.net_odenen, 0) as netOdenecek,
          COALESCE(d.butce_kodu, '03.2.1.01') as butceTertibi,
          d.durum_asama_id as durumAsamaId,
          d.status,
          COALESCE(d.temin_tarihi, SUBSTR(d.created_at, 1, 10), DATE('now')) as tarih,
          COALESCE(d.notlar, '') as notlar
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
        LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
        WHERE d.is_deleted = 0
        ORDER BY d.id DESC
      `
      return db.prepare(sql).all() as IncomingProcurementItem[]
    } catch (err: any) {
      console.warn('[FinanceService] get-incoming-procurements error:', err?.message || err)
      return []
    }
  })

  /**
   * Bütçe Ödenek Özeti (`finance:get-budget-summary`)
   */
  ipcMain.handle('finance:get-budget-summary', async (event) => {
    validateIpcSender(event, 'finance:get-budget-summary')
    try {
      const db = workspaceManager.getDb()
      const sql = `
        SELECT 
          id,
          COALESCE(butce_kodu, '03.2.1.01') as kod,
          COALESCE(aciklama, 'Genel Bütçe Tertibi') as ad,
          COALESCE(yillik_odenek, 0) as baslangicOdenegi,
          COALESCE(harcanan_tutar, 0) as harcanan,
          COALESCE(bloke_tutar, 0) as bloke
        FROM TANIM_ButceOdenek
        WHERE is_deleted = 0
        ORDER BY butce_kodu ASC
      `
      return db.prepare(sql).all()
    } catch (err: any) {
      console.warn('[FinanceService] get-budget-summary error:', err?.message || err)
      return []
    }
  })

  /**
   * Re'sen Ödeme Onaylama ve Tamamlama (`finance:execute-direct-payment`)
   */
  ipcMain.handle('finance:execute-direct-payment', async (event, payload: DirectPaymentPayload) => {
    validateIpcSender(event, 'finance:execute-direct-payment')
    try {
      const db = workspaceManager.getDb()
      if (!payload.dosyaId) throw new Error('Geçersiz dosya ID')

      const updateSql = `
        UPDATE DATA_TeminDosyasi 
        SET 
          status = 'tamamlandi',
          durum_asama_id = 4,
          net_odenen = ?,
          kesinti_damga = ?,
          kesinti_karar_pulu = ?,
          kesinti_kdv_tevkifat = ?,
          notlar = CASE 
            WHEN notlar IS NULL OR notlar = '' THEN ? 
            ELSE notlar || CHAR(10) || ? 
          END,
          updated_at = datetime('now')
        WHERE id = ?
      `
      const maliNotFull = `[5018 Mali Onay ${new Date().toLocaleDateString('tr-TR')}]: Fatura No: ${payload.faturaNo || '-'}, Tutar: ${payload.netTutar} ₺${payload.maliNot ? ` - Not: ${payload.maliNot}` : ''}`

      const info = db.prepare(updateSql).run(
        payload.netTutar,
        payload.damgaVergisi,
        payload.kararPulu,
        payload.kdvTevkifat,
        maliNotFull,
        maliNotFull,
        payload.dosyaId
      )

      workspaceManager.recordMutation('DATA_TeminDosyasi', 'update', info.changes)
      if (workspaceManager.isDirty()) {
        workspaceManager.saveDebounced(500)
      }

      return { success: true, changes: info.changes }
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) }
    }
  })

  /**
   * MİF Taslakları Listesi (`accounting:get-mif-drafts`)
   */
  ipcMain.handle('accounting:get-mif-drafts', async (event) => {
    validateIpcSender(event, 'accounting:get-mif-drafts')
    try {
      const db = workspaceManager.getDb()
      const sql = `
        SELECT 
          d.id as dosyaId,
          COALESCE(d.temin_no, '#' || d.id) as dosyaNo,
          COALESCE(d.konu, 'Doğrudan Temin Hak Sahibi Ödemesi') as konu,
          COALESCE(f.unvan, 'Yüklenici Belirlenmedi') as alacakliUnvan,
          COALESCE(f.vergi_no, '-') as alacakliVkn,
          COALESCE(f.hesap_no, '-') as alacakliIban,
          COALESCE(d.yaklasik_maliyet, 0) as brutTutar,
          COALESCE(d.kesinti_damga, 0) as damgaVergisi,
          COALESCE(d.kesinti_karar_pulu, 0) as kararPulu,
          COALESCE(d.kesinti_kdv_tevkifat, 0) as kdvTevkifat,
          COALESCE(d.net_odenen, 0) as netOdenecekTutar,
          COALESCE(d.butce_kodu, '03.2.1.01') as butceTertibi,
          d.status,
          COALESCE(d.temin_tarihi, SUBSTR(d.created_at, 1, 10), DATE('now')) as tarih
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
        WHERE d.is_deleted = 0
        ORDER BY d.id DESC
      `
      return db.prepare(sql).all()
    } catch (err: any) {
      console.warn('[AccountingService] get-mif-drafts error:', err?.message || err)
      return []
    }
  })

  /**
   * ÖEB Taslakları Listesi (`accounting:get-oeb-drafts`)
   */
  ipcMain.handle('accounting:get-oeb-drafts', async (event) => {
    validateIpcSender(event, 'accounting:get-oeb-drafts')
    try {
      const db = workspaceManager.getDb()
      const sql = `
        SELECT 
          d.id as dosyaId,
          COALESCE(d.temin_no, '#' || d.id) as dosyaNo,
          COALESCE(d.harcama_birimi, b.ad, 'Harcama Birimi') as harcamaBirimi,
          COALESCE(f.unvan, 'Yüklenici Belirlenmedi') as hakSahibiAdi,
          COALESCE(f.vergi_no, '-') as hakSahibiVkn,
          COALESCE(f.hesap_no, '-') as hakSahibiIban,
          COALESCE(d.yaklasik_maliyet, 0) as brutTutar,
          COALESCE(d.kesinti_damga, 0) as damgaVergisi,
          COALESCE(d.kesinti_karar_pulu, 0) as kararPulu,
          COALESCE(d.kesinti_kdv_tevkifat, 0) as kdvTevkifat,
          COALESCE(d.net_odenen, 0) as netOdenecekTutar,
          COALESCE(d.butce_kodu, '03.2.1.01') as butceTertibi,
          d.status,
          COALESCE(d.temin_tarihi, SUBSTR(d.created_at, 1, 10), DATE('now')) as tarih
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
        LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
        WHERE d.is_deleted = 0
        ORDER BY d.id DESC
      `
      return db.prepare(sql).all()
    } catch (err: any) {
      console.warn('[AccountingService] get-oeb-drafts error:', err?.message || err)
      return []
    }
  })
}
