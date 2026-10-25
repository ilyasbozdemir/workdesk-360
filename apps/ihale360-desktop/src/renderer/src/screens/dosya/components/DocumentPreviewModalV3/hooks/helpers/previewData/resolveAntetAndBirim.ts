import { formatDateString } from '../../../../../contextBuilder/dateHelpers'
import { resolveEvrakSayisi } from '@temin360/document-templates'

export async function resolveAntetAndBirim(
  baseData: any,
  resolved: any,
  payloadData: any,
  dosyaRecord: any,
  birimList: any[],
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>
): Promise<void> {
  if (
    resolved.antetSatirlari &&
    Array.isArray(resolved.antetSatirlari) &&
    resolved.antetSatirlari.length > 0
  ) {
    baseData.antetSatirlari = resolved.antetSatirlari
  } else {
    try {
      const kurumRows = await queryExecutor('SELECT * FROM TANIM_Kurum LIMIT 1', [])
      if (kurumRows && kurumRows[0]) {
        const kRow = kurumRows[0]
        if (kRow.kurum_anteti) {
          try {
            const parsed = JSON.parse(kRow.kurum_anteti)
            if (Array.isArray(parsed) && parsed.length > 0) {
              baseData.antetSatirlari = parsed.filter((s: string) => s && s.trim() !== '')
            } else {
              baseData.antetSatirlari = [kRow.kurum_anteti]
            }
          } catch {
            baseData.antetSatirlari = [kRow.kurum_anteti]
          }
        }
        if (!baseData.kurumAdi && kRow.kurum_adi) baseData.kurumAdi = kRow.kurum_adi
        if (!baseData.mudurluk && (kRow.harcama_birim_adi || kRow.mudurluk)) {
          baseData.mudurluk = kRow.harcama_birim_adi || kRow.mudurluk
        }
      }
    } catch (e) {
      console.error('Failed to load kurum_anteti fallback in previewDataLoader:', e)
    }
  }

  const dosyaObj = payloadData.dosya || dosyaRecord || {}
  const ctx = payloadData.resolvedContext || {}
  const formattedAcilisTarihi =
    formatDateString(dosyaObj.dosya_acilis_tarihi) ||
    formatDateString(dosyaObj.tarih) ||
    formatDateString(dosyaObj.created_at) ||
    ''

  baseData.dosyaAcilisTarihi =
    formatDateString(dosyaObj.dosya_acilis_tarihi) ||
    baseData.dosyaAcilisTarihi ||
    formattedAcilisTarihi
  baseData.acilisTarihi =
    formatDateString(dosyaObj.dosya_acilis_tarihi) || baseData.acilisTarihi || formattedAcilisTarihi
  baseData.dosyaTarihi =
    formatDateString(dosyaObj.dosya_acilis_tarihi) || baseData.dosyaTarihi || formattedAcilisTarihi
  baseData.onayaSunulanTarih =
    formatDateString(dosyaObj.temin_tarihi) ||
    formatDateString(dosyaObj.dosya_acilis_tarihi) ||
    baseData.onayaSunulanTarih ||
    formattedAcilisTarihi
  baseData.tarih = baseData.tarih || formattedAcilisTarihi || baseData.onayaSunulanTarih || ''
  baseData.onayTarihi =
    formatDateString(dosyaObj.onay_tarihi) || baseData.onayTarihi || formattedAcilisTarihi

  baseData.kurumumuz = baseData.kurumumuz || ctx.kurumumuz || ctx.altKurumBizim || 'İdaremiz'
  const rawIhtiyac =
    dosyaObj.ihtiyac_yeri ||
    baseData.ihtiyacYeri ||
    ctx.ihtiyacYeri ||
    dosyaObj.ihtiyac_yeri_eki ||
    ctx.altKurumBulunma ||
    ctx.altKurumBizim ||
    'İdaremizde'
  baseData.ihtiyacYeri =
    rawIhtiyac === '[]' || rawIhtiyac === '[""]' ? ctx.altKurumBulunma || 'İdaremizde' : rawIhtiyac

  const rawMakam =
    dosyaObj.sunulacak_makam ||
    baseData.sunulacakMakamAdi ||
    baseData.sunulacakMakam ||
    ctx.sunulacakMakamAdi ||
    ctx.sunulacakMakam ||
    ctx.sunumMakami ||
    ''
  if (rawMakam) {
    baseData.sunulacakMakamAdi = rawMakam
    baseData.sunulacakMakam = rawMakam
  }

  // Resolve official evrakSayisi if missing or slash-separated
  if (
    !baseData.evrakSayisi ||
    String(baseData.evrakSayisi).trim() === '' ||
    String(baseData.evrakSayisi).includes('/')
  ) {
    const activeDosyaId = Number(dosyaObj.id || dosyaRecord?.id || 0)
    if (activeDosyaId) {
      try {
        const computed = await resolveEvrakSayisi(activeDosyaId, queryExecutor)
        if (computed) {
          baseData.evrakSayisi = computed
          baseData.evrakNo = computed
        }
      } catch (err) {
        console.warn('Failed to resolveEvrakSayisi in resolveAntetAndBirim:', err)
      }
    }
  }
  if (baseData.evrakSayisi) {
    baseData.evrakSayisi = String(baseData.evrakSayisi).replace(/^E-/i, '').trim()
  }
  if (!baseData.evrakNo) {
    baseData.evrakNo = baseData.evrakSayisi
  } else {
    baseData.evrakNo = String(baseData.evrakNo).replace(/^E-/i, '').trim()
  }

  let matchedBirimName =
    dosyaObj.islem_yapan_birim ||
    dosyaObj.islemYapanBirim ||
    dosyaObj.birim ||
    dosyaObj.birim_adi ||
    dosyaObj.harcama_birimi ||
    ctx.birimAdi ||
    ctx.mudurluk ||
    ''
  if (!matchedBirimName && dosyaObj.birim_id && Array.isArray(birimList) && birimList.length > 0) {
    const foundBirim = birimList.find((b: any) => Number(b.id) === Number(dosyaObj.birim_id))
    if (foundBirim) {
      matchedBirimName = foundBirim.birim_adi || foundBirim.ad || foundBirim.kisa_ad || ''
    }
  }
  if (matchedBirimName) {
    baseData.birim = baseData.birim || matchedBirimName
    baseData.birimAdi = baseData.birimAdi || matchedBirimName
    baseData.birim_adi = baseData.birim_adi || matchedBirimName
    baseData.talepEdenBirim = baseData.talepEdenBirim || matchedBirimName
    baseData.ihalesiYapilacakBirim = baseData.ihalesiYapilacakBirim || matchedBirimName
    baseData.harcamaBirimi = baseData.harcamaBirimi || matchedBirimName
    baseData.harcama_birimi = baseData.harcama_birimi || matchedBirimName
    baseData.mudurluk = baseData.mudurluk || matchedBirimName

    if (typeof baseData.antetSatirlari === 'string') {
      try {
        baseData.antetSatirlari = JSON.parse(baseData.antetSatirlari)
      } catch {
        baseData.antetSatirlari = [baseData.antetSatirlari]
      }
    }

    if (Array.isArray(baseData.antetSatirlari) && baseData.antetSatirlari.length > 0) {
      const exists = baseData.antetSatirlari.some(
        (s: string) => s && String(s).trim().toUpperCase() === matchedBirimName.toUpperCase()
      )
      if (!exists) {
        baseData.antetSatirlari.push(matchedBirimName)
      }
    } else {
      baseData.antetSatirlari = [
        'T.C.',
        baseData.kurumAdi || 'BELEDİYE BAŞKANLIĞI',
        matchedBirimName
      ]
    }
  }
}
