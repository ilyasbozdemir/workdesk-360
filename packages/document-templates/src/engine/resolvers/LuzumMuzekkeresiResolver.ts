import { LuzumMuzekkeresiType } from '../../templates/luzum-muzekkeresi'
import { DocumentDataResolver, DocumentResolutionContext } from '@worksuite-360/document-engine'

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

    // 3. Personel Çözümlemesi (Dosyada seçilen Hazırlayan, Talep Eden, Onaylayan)
    let hazirlayanAdi: string = String(headerData.hazirlayanPersonelAdi || '')
    let hazirlayanUnvan: string = String(headerData.hazirlayanPersonelUnvan || '')
    let hazirlayanTel: string = String(headerData.hazirlayanTelefon || '')
    let hazirlayanMail: string = String(headerData.hazirlayanEposta || '')

    let talepEdenAdi: string = String(headerData.talepEdenPersonelAdi || hazirlayanAdi || '')
    let talepEdenUnvan: string = String(headerData.talepEdenPersonelUnvan || hazirlayanUnvan || '')
    let talepEdenTel: string = String(headerData.talepEdenTelefon || hazirlayanTel || '')
    let talepEdenMail: string = String(headerData.talepEdenEposta || hazirlayanMail || '')

    let onaylayanAdi: string = String(headerData.onaylayanPersonelAdi || headerData.harcamaYetkilisiAdi || '')
    let onaylayanUnvan: string = String(headerData.onaylayanPersonelUnvan || headerData.harcamaYetkilisiUnvan || 'Harcama Yetkilisi')

    // Dosyada spesifik ID'ler varsa ve headerData'da henüz çözümlenmemişse doğrudan çek
    if (!hazirlayanAdi || !onaylayanAdi || !talepEdenAdi) {
      const pIds = [
        dosyaRow?.hazirlayan_personel_id || dosyaRow?.sunan_personel_id,
        dosyaRow?.talep_eden_personel_id,
        dosyaRow?.onay_personel_id
      ].filter(Boolean)

      if (pIds.length > 0) {
        const placeholders = pIds.map(() => '?').join(', ')
        const pRows = await queryExecutor(
          `SELECT id, ad_soyad, unvan, telefon, eposta FROM TANIM_Personel WHERE id IN (${placeholders})`,
          pIds
        )
        const pMap = new Map<number, any>()
        pRows.forEach((p: any) => pMap.set(Number(p.id), p))

        const hazId = dosyaRow?.hazirlayan_personel_id || dosyaRow?.sunan_personel_id
        if (hazId && pMap.has(Number(hazId))) {
          const p = pMap.get(Number(hazId))
          hazirlayanAdi = p.ad_soyad || hazirlayanAdi
          hazirlayanUnvan = p.unvan || hazirlayanUnvan
          hazirlayanTel = p.telefon || hazirlayanTel
          hazirlayanMail = p.eposta || hazirlayanMail
        }

        const talId = dosyaRow?.talep_eden_personel_id
        if (talId && pMap.has(Number(talId))) {
          const p = pMap.get(Number(talId))
          talepEdenAdi = p.ad_soyad || talepEdenAdi
          talepEdenUnvan = p.unvan || talepEdenUnvan
          talepEdenTel = p.telefon || talepEdenTel
          talepEdenMail = p.eposta || talepEdenMail
        }

        const onId = dosyaRow?.onay_personel_id
        if (onId && pMap.has(Number(onId))) {
          const p = pMap.get(Number(onId))
          onaylayanAdi = p.ad_soyad || onaylayanAdi
          onaylayanUnvan = p.unvan || onaylayanUnvan
        }
      }
    }

    // Fallback: Hala boşsa ilk aktif personeli al
    if (!hazirlayanAdi) {
      const pFallback = await queryExecutor(
        `SELECT ad_soyad, unvan, telefon, eposta FROM TANIM_Personel WHERE COALESCE(aktif_mi, 1) = 1 ORDER BY id ASC LIMIT 1`,
        []
      )
      if (pFallback && pFallback[0]) {
        hazirlayanAdi = pFallback[0].ad_soyad || ''
        hazirlayanUnvan = pFallback[0].unvan || ''
        hazirlayanTel = pFallback[0].telefon || ''
        hazirlayanMail = pFallback[0].eposta || ''
        if (!talepEdenAdi) {
          talepEdenAdi = hazirlayanAdi
          talepEdenUnvan = hazirlayanUnvan
        }
      }
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
      evrakSayisi: headerData.evrakSayisi || dosyaRow?.temin_no || headerData.dosyaNo || '',
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
      onaylayanPersonelAdi: onaylayanAdi,
      onaylayanPersonelUnvan: onaylayanUnvan,
      hazirlayanPersonelAdi: hazirlayanAdi,
      hazirlayanPersonelUnvan: hazirlayanUnvan,
      hazirlayanTelefon: hazirlayanTel,
      hazirlayanEposta: hazirlayanMail,
      talepEdenPersonelAdi: talepEdenAdi,
      talepEdenPersonelUnvan: talepEdenUnvan,
      talepEdenTelefon: talepEdenTel,
      talepEdenEposta: talepEdenMail,
      birimAdi: headerData.mudurluk
    }

    return result
  }
}
