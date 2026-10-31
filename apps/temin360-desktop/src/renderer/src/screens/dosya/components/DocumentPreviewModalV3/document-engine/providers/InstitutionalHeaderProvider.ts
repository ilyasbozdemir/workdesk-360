import { InstitutionalHeaderData } from '../registry/types'
import { useSettingsStore } from '../../../../../../store/settingsStore'
import { resolveEvrakSayisi } from '@temin360/document-templates'

/**
 * Kurumsal ve Antet Bilgileri Sağlayıcısı (Institutional Header Provider)
 * - Belgeye özel alanlar, kalemler veya tekliflerle ilgilenmez.
 * - Sadece kurum, birim ve dosya üst verilerini çözümler.
 * - Oturum içi önbellekleme yaparak gereksiz tekrar eden sorguları önler.
 */
export class InstitutionalHeaderProvider {
  private static cache = new Map<number, InstitutionalHeaderData>()

  /**
   * Belirtilen dosya için kurumsal antet ve başlık verilerini çözümler.
   */
  static async resolve(
    dosyaId: number,
    queryExecutor: (sql: string, params: any[]) => Promise<any[]>
  ): Promise<InstitutionalHeaderData> {
    if (this.cache.has(dosyaId)) {
      return this.cache.get(dosyaId)!
    }

    const settings = useSettingsStore.getState()

    // 1. Dosya ve Harcama Birimi Sorgusu
    let dosyaRow: any = null
    if (dosyaId) {
      const rows = await queryExecutor(
        `SELECT d.id, d.temin_no, d.konu, d.butce_yili, d.tarih, d.sunulacak_makam, d.birim_id,
                b.birim_adi, b.antet_ek_satir, b.harcama_yetkilisi_id, b.harcama_yetkilisi_unvan
         FROM DATA_TeminDosyasi d
         LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
         WHERE d.id = ?`,
        [dosyaId]
      )
      if (rows && rows[0]) {
        dosyaRow = rows[0]
      }
    }

    // 2. Harcama Yetkilisi Adı
    let harcamaYetkilisiAdi = ''
    let harcamaYetkilisiUnvan = dosyaRow?.harcama_yetkilisi_unvan || ''
    if (dosyaRow?.harcama_yetkilisi_id) {
      const pRows = await queryExecutor(
        `SELECT ad_soyad, unvan FROM TANIM_Personel WHERE id = ?`,
        [dosyaRow.harcama_yetkilisi_id]
      )
      if (pRows && pRows[0]) {
        harcamaYetkilisiAdi = pRows[0].ad_soyad || ''
        if (!harcamaYetkilisiUnvan) {
          harcamaYetkilisiUnvan = pRows[0].unvan || ''
        }
      }
    }

    // 3. Kurum Bilgisi ve Antet Satırları
    let kurumRow: any = null
    const kurumRows = await queryExecutor(
      `SELECT kurum_adi, ust_kurum_adi, kurum_anteti, logo_sol, logo_sag, logo_kurum, logo_url, detsis_kodu, detsis_no, dtvt_kodu FROM TANIM_Kurum LIMIT 1`,
      []
    )
    if (kurumRows && kurumRows[0]) {
      kurumRow = kurumRows[0]
    }

    let antetSatirlari: string[] = []
    if (kurumRow?.kurum_anteti) {
      try {
        const parsed = JSON.parse(kurumRow.kurum_anteti)
        if (Array.isArray(parsed) && parsed.length > 0) {
          antetSatirlari = parsed.map((s) => String(s).trim()).filter(Boolean)
        }
      } catch {
        antetSatirlari = [String(kurumRow.kurum_anteti).trim()]
      }
    }

    const kurumAdiText =
      kurumRow?.ust_kurum_adi ||
      kurumRow?.kurum_adi ||
      settings.parentInstitutionName ||
      settings.institutionName ||
      'T.C.'

    const effectiveMudurluk =
      dosyaRow?.birim_adi || settings.departmentName || 'Satın Alma Şube Müdürlüğü'

    if (antetSatirlari.length === 0) {
      antetSatirlari = ['T.C.', kurumAdiText.toUpperCase(), effectiveMudurluk.toUpperCase()]
    }

    const solLogo =
      kurumRow?.logo_sol ||
      kurumRow?.logo_kurum ||
      kurumRow?.logo_url ||
      settings.logoLeft ||
      settings.institutionLogo ||
      null

    const sagLogo = kurumRow?.logo_sag || settings.logoRight || null

    // 4. DETSİS formatlı resmî evrak sayısı çözümlenmesi
    let detsisEvrakSayisi = ''
    if (dosyaId) {
      try {
        detsisEvrakSayisi = await resolveEvrakSayisi(dosyaId, queryExecutor)
      } catch (err) {
        console.warn('[InstitutionalHeaderProvider] resolveEvrakSayisi failed:', err)
      }
    }

    const result: InstitutionalHeaderData = {
      antetSatirlari,
      kurumUst: kurumAdiText,
      kurumAdi: kurumRow?.kurum_adi || kurumAdiText,
      mudurluk: effectiveMudurluk,
      solLogo,
      sagLogo,
      dosyaNo: dosyaRow?.temin_no || '',
      evrakSayisi: detsisEvrakSayisi || dosyaRow?.temin_no || '',
      butceYili: dosyaRow?.butce_yili ? Number(dosyaRow.butce_yili) : new Date().getFullYear(),
      dosyaTarihi: dosyaRow?.tarih || '',
      konu: dosyaRow?.konu || '',
      harcamaYetkilisiAdi,
      harcamaYetkilisiUnvan,
      birimId: dosyaRow?.birim_id,
      sunulacakMakam: dosyaRow?.sunulacak_makam || ''
    }

    if (dosyaId) {
      this.cache.set(dosyaId, result)
    }

    return result
  }

  /**
   * Önbelleği temizler (kurum veya dosya güncellendiğinde çağrılır)
   */
  static clearCache(dosyaId?: number): void {
    if (dosyaId !== undefined) {
      this.cache.delete(dosyaId)
    } else {
      this.cache.clear()
    }
  }
}
