import { LuzumMuzekkeresiType } from '@temin360/document-templates'
import { DocumentDataResolver, DocumentResolutionContext } from '../registry/types'

/**
 * Lüzum Müzekkeresi Belge Çözücüsü (LuzumMuzekkeresiResolver)
 * - Yalnızca bu belgenin ihtiyaç duyduğu dosya, birim, personel ve kalem verilerini sorgular.
 * - Firma, teklif, ihale komisyonu veya piyasa araştırma verilerine sorgu ATMAZ.
 */
export class LuzumMuzekkeresiResolver implements DocumentDataResolver<LuzumMuzekkeresiType> {
  async resolve(context: DocumentResolutionContext): Promise<LuzumMuzekkeresiType> {
    const { dosyaId, headerData, queryExecutor } = context

    // 1. Dosya Detayı
    let dosyaRow: any = null
    if (dosyaId) {
      const rows = await queryExecutor(
        `SELECT id, temin_no, konu, tarih, aciklama, madde_no, sunulacak_makam, birim_id,
                olur_baslik, olur_yazisi, teslim_tarihi
         FROM DATA_TeminDosyasi WHERE id = ?`,
        [dosyaId]
      )
      if (rows && rows[0]) {
        dosyaRow = rows[0]
      }
    }

    // 2. Kalemler (İhtiyaç Kalemleri)
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
          malzemeAdi: k.kalem_adi || '',
          ozelligi: k.aciklama || '',
          birimi: k.birim || 'Adet',
          kdvOrani: k.kdv_orani !== undefined && k.kdv_orani !== null ? Number(k.kdv_orani) : 20,
          miktar: Number(k.miktar || 1)
        }))
      }
    }

    // 3. İlgili Personel (Hazırlayan / Talep Eden)
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

    const result: LuzumMuzekkeresiType = {
      antetSatirlari: headerData.antetSatirlari,
      kurumUst: headerData.kurumUst,
      kurumAdi: headerData.kurumAdi,
      mudurluk: headerData.mudurluk,
      solLogo: headerData.solLogo,
      sagLogo: headerData.sagLogo,
      evrakSayisi: dosyaRow?.temin_no || headerData.dosyaNo || '',
      dosyaKonusu: dosyaRow?.konu || headerData.konu || '',
      maddeNo: dosyaRow?.madde_no || '22/d',
      tarih: effectiveDate,
      onayaSunulanTarih: effectiveDate,
      onayTarihi: effectiveDate,
      dosyaTarihi: effectiveDate,
      sunulacakMakamAdi: effectiveMakam,
      ihtiyacYeri: headerData.mudurluk,
      ihtiyacKalemleri: kalemler,
      isinAciklamasi: dosyaRow?.aciklama || dosyaRow?.konu || '',
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
