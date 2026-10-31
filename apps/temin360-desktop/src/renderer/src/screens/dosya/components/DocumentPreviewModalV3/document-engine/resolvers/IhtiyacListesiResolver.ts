import { IhtiyacListesiType } from '@temin360/document-templates'
import { DocumentDataResolver, DocumentResolutionContext } from '../registry/types'

/**
 * İhtiyaç Listesi Belge Çözücüsü (IhtiyacListesiResolver)
 * - Yalnızca dosya, antet ve kalem verilerini sorgular.
 * - Firma, teklif ve komisyon sorguları yapmaz.
 */
export class IhtiyacListesiResolver implements DocumentDataResolver<IhtiyacListesiType> {
  async resolve(context: DocumentResolutionContext): Promise<IhtiyacListesiType> {
    const { dosyaId, headerData, queryExecutor } = context

    // 1. Dosya Detayı
    let dosyaRow: any = null
    if (dosyaId) {
      const rows = await queryExecutor('SELECT * FROM DATA_TeminDosyasi WHERE id = ?', [dosyaId])
      if (rows && rows[0]) {
        const r = rows[0]
        dosyaRow = {
          ...r,
          tarih: r.dosya_acilis_tarihi || r.temin_tarihi,
          aciklama: r.isin_aciklamasi || r.konu,
          madde_no: r.ihale_sekli || '22/d'
        }
      }
    }

    // 2. Kalemler
    let kalemler: any[] = []
    if (dosyaId) {
      const kRows = await queryExecutor(
        `SELECT id, sira_no, kalem_adi, aciklama, birim, miktar, tasinir_kodu, kdv_orani
         FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC`,
        [dosyaId]
      )
      if (kRows && kRows.length > 0) {
        kalemler = kRows.map((k: any, idx: number) => ({
          id: k.id,
          siraNo: k.sira_no || idx + 1,
          kodu: k.tasinir_kodu || '',
          tasinirKodu: k.tasinir_kodu || '',
          malzemeAdi: k.kalem_adi || '',
          kalemAdi: k.kalem_adi || '',
          ozelligi: k.aciklama || '',
          aciklama: k.aciklama || '',
          birimi: k.birim || 'Adet',
          birim: k.birim || 'Adet',
          kdvOrani: k.kdv_orani !== undefined && k.kdv_orani !== null ? Number(k.kdv_orani) : 20,
          miktar: Number(k.miktar || 1)
        }))
      }
    }

    // 3. Personel (Hazırlayan)
    let hazirlayanAdi = ''
    let hazirlayanUnvan = ''
    let hazirlayanTel = ''
    let hazirlayanMail = ''

    const pRows = await queryExecutor(
      `SELECT ad_soyad, unvan, telefon, eposta FROM TANIM_Personel 
       WHERE COALESCE(aktif_mi, 1) = 1 ORDER BY id ASC LIMIT 1`,
      []
    )
    if (pRows && pRows[0]) {
      hazirlayanAdi = pRows[0].ad_soyad || ''
      hazirlayanUnvan = pRows[0].unvan || ''
      hazirlayanTel = pRows[0].telefon || ''
      hazirlayanMail = pRows[0].eposta || ''
    }

    const effectiveDate = dosyaRow?.tarih || new Date().toISOString().split('T')[0]
    const effectiveMakam =
      dosyaRow?.sunulacak_makam ||
      headerData.sunulacakMakam ||
      (headerData.harcamaYetkilisiUnvan
        ? `${headerData.harcamaYetkilisiUnvan.toUpperCase()}`
        : 'HARCAMA YETKİLİSİ MAKAMINA')

    const result: IhtiyacListesiType = {
      antetSatirlari: headerData.antetSatirlari,
      solLogo: headerData.solLogo || undefined,
      sagLogo: headerData.sagLogo || undefined,
      evrakSayisi: headerData.evrakSayisi || dosyaRow?.temin_no || headerData.dosyaNo || '',
      konu: dosyaRow?.konu || headerData.konu || '',
      maddeNo: dosyaRow?.madde_no || '22/d',
      tarih: effectiveDate,
      onayaSunulanTarih: effectiveDate,
      onayTarihi: effectiveDate,
      dosyaTarihi: effectiveDate,
      sunulacakMakamAdi: effectiveMakam,
      ihtiyacYeri: headerData.mudurluk,
      ihtiyacKalemleri: kalemler,
      onaylayanPersonelAdi: headerData.harcamaYetkilisiAdi || '',
      onaylayanPersonelUnvan: headerData.harcamaYetkilisiUnvan || 'Harcama Yetkilisi',
      hazirlayanPersonelAdi: hazirlayanAdi,
      hazirlayanPersonelUnvan: hazirlayanUnvan,
      hazirlayanTelefon: hazirlayanTel,
      hazirlayanEposta: hazirlayanMail,
      talepEdenPersonelAdi: hazirlayanAdi,
      talepEdenPersonelUnvan: hazirlayanUnvan,
      olurBaslik: dosyaRow?.olur_baslik || 'UYGUNDUR',
      olurYazisi: dosyaRow?.olur_yazisi !== false,
      kurumIci: true
    }

    return result
  }
}
