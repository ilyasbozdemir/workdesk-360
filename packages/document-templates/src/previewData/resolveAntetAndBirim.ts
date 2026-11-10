import { formatDateString } from './previewDataUtils'
import { resolveEvrakSayisi } from '../resolver/helpers/resolveEvrakSayisi'
import { InstitutionalHeaderProvider } from '@worksuite-360/document-engine'

export async function resolveAntetAndBirim(
  baseData: any,
  resolved: any,
  payloadData: any,
  dosyaRecord: any,
  birimList: any[],
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>
): Promise<void> {
  let kurumRow: Record<string, any> | null = null
  if (
    payloadData?.resolvedContext?.antetSatirlari &&
    Array.isArray(payloadData.resolvedContext.antetSatirlari) &&
    payloadData.resolvedContext.antetSatirlari.length > 0
  ) {
    baseData.antetSatirlari = payloadData.resolvedContext.antetSatirlari
    if (payloadData.kurum) kurumRow = payloadData.kurum
  } else if (
    resolved?.antetSatirlari &&
    Array.isArray(resolved.antetSatirlari) &&
    resolved.antetSatirlari.length > 0
  ) {
    baseData.antetSatirlari = resolved.antetSatirlari
    if (payloadData?.kurum) kurumRow = payloadData.kurum
  } else if (payloadData?.kurum) {
    const kData = payloadData.kurum
    kurumRow = kData
    baseData.antetSatirlari = InstitutionalHeaderProvider.parseKurumBaseAntetLines(kData)
    if (!baseData.kurumAdi && kData.kurum_adi) baseData.kurumAdi = kData.kurum_adi
    if (!baseData.mudurluk && (kData.harcama_birim_adi || kData.mudurluk)) {
      baseData.mudurluk = kData.harcama_birim_adi || kData.mudurluk
    }
  } else {
    try {
      const kurumRows = await queryExecutor(
        'SELECT * FROM TANIM_Kurum WHERE is_active = 1 ORDER BY id ASC LIMIT 1',
        []
      )
      if (kurumRows && kurumRows[0]) {
        const kRow = kurumRows[0]
        kurumRow = kRow
        baseData.antetSatirlari = InstitutionalHeaderProvider.parseKurumBaseAntetLines(kRow)
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
    formatDateString(baseData.dosyaAcilisTarihi) ||
    formattedAcilisTarihi
  baseData.acilisTarihi =
    formatDateString(dosyaObj.dosya_acilis_tarihi) ||
    formatDateString(baseData.acilisTarihi) ||
    formattedAcilisTarihi
  baseData.dosyaTarihi =
    formatDateString(dosyaObj.dosya_acilis_tarihi) ||
    formatDateString(dosyaObj.tarih) ||
    formatDateString(baseData.dosyaTarihi) ||
    formattedAcilisTarihi
  baseData.onayaSunulanTarih =
    formatDateString(dosyaObj.temin_tarihi) ||
    formatDateString(dosyaObj.dosya_acilis_tarihi) ||
    formatDateString(baseData.onayaSunulanTarih) ||
    formattedAcilisTarihi
  baseData.tarih =
    formatDateString(baseData.tarih) ||
    formatDateString(dosyaObj.tarih) ||
    formattedAcilisTarihi ||
    baseData.onayaSunulanTarih ||
    ''
  baseData.onayTarihi =
    formatDateString(dosyaObj.onay_tarihi) ||
    formatDateString(baseData.onayTarihi) ||
    formattedAcilisTarihi

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

  // Resolve official evrakSayisi if missing
  if (
    !baseData.evrakSayisi ||
    String(baseData.evrakSayisi).trim() === ''
  ) {
    const activeDosyaId = Number(dosyaObj.id || dosyaRecord?.id || 0)
    if (activeDosyaId) {
      try {
        const computed = await resolveEvrakSayisi(activeDosyaId, queryExecutor)
        if (computed) {
          baseData.evrakSayisi = computed
          baseData.evrakNo = computed
          try {
            await queryExecutor(
              'UPDATE DATA_TeminDosyasi SET evrak_sayisi = ? WHERE id = ? AND (evrak_sayisi IS NULL OR trim(evrak_sayisi) = \'\')',
              [computed, activeDosyaId]
            )
          } catch {}
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

  if (typeof baseData.antetSatirlari === 'string') {
    try {
      baseData.antetSatirlari = JSON.parse(baseData.antetSatirlari)
    } catch {
      baseData.antetSatirlari = [baseData.antetSatirlari]
    }
  }

  const effectiveBirimId =
    baseData.birimId ??
    baseData.birim_id ??
    dosyaObj.birim_id ??
    ctx.birimId ??
    undefined

  const fallbackBirimName =
    dosyaObj.islem_yapan_birim ||
    dosyaObj.islemYapanBirim ||
    dosyaObj.birim ||
    dosyaObj.birim_adi ||
    dosyaObj.harcama_birimi ||
    ctx.birimAdi ||
    ctx.mudurluk ||
    ''

  const birimResolution = InstitutionalHeaderProvider.resolveBirimSelection({
    birimId: effectiveBirimId,
    birimAdi: fallbackBirimName,
    birimList: Array.isArray(birimList) ? birimList : [],
    kurumRow,
    baseAntetLines:
      Array.isArray(baseData.antetSatirlari) && baseData.antetSatirlari.length > 0
        ? baseData.antetSatirlari
        : undefined,
    dosyaAntetEkSatir: dosyaObj.antet_ek_satir,
    fallbackInstitutionName: baseData.kurumAdi || ''
  })

  if (birimResolution.birimId !== undefined) {
    baseData.birimId = birimResolution.birimId
    baseData.birim_id = birimResolution.birimId
  }
  if (birimResolution.warning) {
    baseData.birimWarning = birimResolution.warning
  }

  const matchedBirimName = birimResolution.birimAdi || fallbackBirimName
  if (matchedBirimName) {
    baseData.birim = baseData.birim || matchedBirimName
    baseData.birimAdi = baseData.birimAdi || matchedBirimName
    baseData.birim_adi = baseData.birim_adi || matchedBirimName
    baseData.talepEdenBirim = baseData.talepEdenBirim || matchedBirimName
    baseData.ihalesiYapilacakBirim = baseData.ihalesiYapilacakBirim || matchedBirimName
    baseData.harcamaBirimi = baseData.harcamaBirimi || matchedBirimName
    baseData.harcama_birimi = baseData.harcama_birimi || matchedBirimName
    baseData.mudurluk = baseData.mudurluk || matchedBirimName
    if (baseData.antetBirimGosterilsin !== false && birimResolution.antetSatirlari?.length) {
      baseData.antetSatirlari = birimResolution.antetSatirlari
    }
  }

  if (!baseData.sunulacakMakamAdi && birimResolution.sunulacakMakamAdi) {
    baseData.sunulacakMakamAdi = birimResolution.sunulacakMakamAdi
    baseData.sunulacakMakam = birimResolution.sunulacakMakamAdi
  }
}

