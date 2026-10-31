<<<<<<< HEAD:packages/document-engine/src/providers/InstitutionalHeaderProvider.ts
import { InstitutionalHeaderData } from '../types/contracts'
import { resolveEvrakSayisi } from '@temin360/document-templates'

export interface InstitutionalHeaderSettings {
  institutionName?: string
  departmentName?: string
  logoLeft?: string | null
  logoRight?: string | null
  institutionLogo?: string | null
}
=======
import { InstitutionalHeaderData } from '../registry/types'
import { useSettingsStore } from '../../../../../../store/settingsStore'
import { resolveEvrakSayisi } from '@temin360/document-templates'
>>>>>>> cd2fd593900d9e394ceb4c694b0ded230eab3d9c:apps/temin360-desktop/src/renderer/src/screens/dosya/components/DocumentPreviewModalV3/document-engine/providers/InstitutionalHeaderProvider.ts

/**
 * Kurumsal ve Antet Bilgileri Sağlayıcısı (Institutional Header Provider)
 * - Belgeye özel alanlar, kalemler veya tekliflerle ilgilenmez.
 * - Sadece kurum, birim ve dosya üst verilerini çözümler.
 * - Oturum içi önbellekleme yaparak gereksiz tekrar eden sorguları önler.
 */
export class InstitutionalHeaderProvider {
  private static cache = new Map<number, InstitutionalHeaderData>()
  private static settingsGetter: (() => InstitutionalHeaderSettings) | null = null

  static setSettingsGetter(getter: () => InstitutionalHeaderSettings): void {
    this.settingsGetter = getter
  }

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

    const settings = this.settingsGetter ? this.settingsGetter() : {}

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
      `SELECT * FROM TANIM_Kurum ORDER BY is_active DESC, id ASC LIMIT 1`,
      []
    )
    if (kurumRows && kurumRows[0]) {
      kurumRow = kurumRows[0]
    }

    let antetSatirlari: string[] = []
    if (kurumRow?.kurum_anteti) {
      try {
        const parsed = JSON.parse(kurumRow.kurum_anteti)
        if (Array.isArray(parsed)) {
          antetSatirlari = parsed.filter((s: string) => s && String(s).trim() !== '')
        }
      } catch {
        if (typeof kurumRow.kurum_anteti === 'string' && kurumRow.kurum_anteti.trim()) {
          antetSatirlari = kurumRow.kurum_anteti
            .split('\n')
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
      }
    }

    const kurumAdiText =
      kurumRow?.ust_kurum_adi ||
      kurumRow?.kurum_adi ||
      kurumRow?.ad ||
      settings.institutionName ||
      'KAMU KURUMU'

    if (antetSatirlari.length === 0) {
      antetSatirlari = ['T.C.', String(kurumAdiText).toUpperCase()]
    }

    const effectiveMudurluk =
      dosyaRow?.birim_adi ||
      (dosyaRow?.antet_ek_satir ? String(dosyaRow.antet_ek_satir).trim() : '') ||
      settings.departmentName ||
      'Destek Hizmetleri Müdürlüğü'

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
