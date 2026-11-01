import { useGlobalDocumentPreviewStore } from '../../../../../../../store/globalDocumentPreviewStore'
import { parseNumericPrice } from './previewDataUtils'

export function resolveFirmsAndItems(
  baseData: any,
  dosyaObj: any,
  dosyaRecord: any,
  payloadData: any,
  fileFirms: any[],
  propInvitedFirms: any[] | undefined,
  combinedFirms: any[],
  items: any[],
  bids: any[]
): void {
  const safeFileFirms = Array.isArray(fileFirms) ? fileFirms : []
  const safeCombinedFirms = Array.isArray(combinedFirms) ? combinedFirms : []

  const activeFirms =
    safeFileFirms.length > 0
      ? safeFileFirms
      : propInvitedFirms && propInvitedFirms.length > 0
        ? propInvitedFirms
        : baseData.firmalar && Array.isArray(baseData.firmalar) && baseData.firmalar.length > 0
          ? baseData.firmalar
          : baseData.firmaListesi &&
              Array.isArray(baseData.firmaListesi) &&
              baseData.firmaListesi.length > 0
            ? baseData.firmaListesi.slice(0, 3)
            : safeCombinedFirms && safeCombinedFirms.length > 0
              ? safeCombinedFirms.slice(0, 3)
              : []
  baseData.firmalar = activeFirms
  baseData.firmaListesi = safeCombinedFirms

  // Kazanan firma tespiti
  const winnerFirmaId =
    payloadData?.dosya?.firma_id ||
    dosyaRecord?.firma_id ||
    safeFileFirms.find((f: any) => f.kazandi_mi === 1 || f.kazanan_mi === 1 || f.isWinner)?.id

  const winnerFirm =
    safeFileFirms.find(
      (f: any) =>
        (winnerFirmaId &&
          (f.id === winnerFirmaId ||
            f.temin_firma_id === winnerFirmaId ||
            f.firma_id === winnerFirmaId)) ||
        f.kazandi_mi === 1 ||
        f.kazanan_mi === 1 ||
        f.isWinner
    )

  if (winnerFirm && (winnerFirm.unvan || winnerFirm.firma_adi)) {
    const resolvedUnvan = winnerFirm.unvan || winnerFirm.firma_adi
    if (
      !baseData.yukleniciFirma ||
      baseData.yukleniciFirma === 'YÜKLENİCİ FİRMA' ||
      baseData.yukleniciFirma === 'İstekli Firma' ||
      baseData.yukleniciFirma.includes('[Belirtilmedi')
    ) {
      baseData.yukleniciFirma = resolvedUnvan
    }
    if (winnerFirm.adres && !baseData.yukleniciAdresi) {
      baseData.yukleniciAdresi = winnerFirm.adres
      baseData.yukleniciIlce = winnerFirm.ilce
      baseData.yukleniciIl = winnerFirm.il
    }
    if (
      !baseData.teslimEden_0_adSoyad ||
      baseData.teslimEden_0_adSoyad === '' ||
      baseData.teslimEden_0_adSoyad.includes('[Belirtilmedi')
    ) {
      baseData.teslimEden_0_adSoyad = resolvedUnvan
      baseData.teslimEden_0_unvan = winnerFirm.yetkili_ad_soyad
        ? `Yetkili: ${winnerFirm.yetkili_ad_soyad}`
        : 'Yüklenici Firma / Yetkilisi'
    }
  }

  // Seçilen veya hedeflenen istekli firma bilgileri (Mektup ve Teklif formları için)
  const activeTab = useGlobalDocumentPreviewStore.getState().getActiveTab()
  const explicitFirm =
    (activeTab?.selectedFirma as any) ||
    (activeTab?.initialData as any)?.selectedFirma ||
    (propInvitedFirms && propInvitedFirms.length === 1 ? propInvitedFirms[0] : null)

  if (explicitFirm) {
    const fUnvan = explicitFirm.unvan || explicitFirm.firma_adi || ''
    const fAdres = explicitFirm.adres || ''
    const fIlce = explicitFirm.ilce || explicitFirm.semt || ''
    const fIl = explicitFirm.il || explicitFirm.sehir || ''
    const fSehir = [fIlce, fIl].filter(Boolean).join(' / ') || fIl
    const fVergiNo = explicitFirm.vergi_no || ''
    const fTelefon = explicitFirm.telefon || ''
    const fEmail = explicitFirm.email || explicitFirm.eposta || ''

    baseData.selectedFirma = explicitFirm
    baseData.firmaUnvani = fUnvan
    baseData.sayinIlgili = fUnvan ? `Sayın ${fUnvan}` : 'Sayın İlgili,'
    baseData.firmaAdresi = fAdres
    baseData.firmaSehir = fSehir
    baseData.firmaVergiNo = fVergiNo
    baseData.teklifSahibi = fUnvan
    baseData.tebligatAdresi = [fAdres, fSehir].filter(Boolean).join(' ') || fAdres
    baseData.vergiNo = fVergiNo
    baseData.telefonFaks = fTelefon
    baseData.eposta = fEmail
  }

  // Şablon tercihleri (Örn: Sonuç Onay Belgesi Ekler listesi)
  if (dosyaObj.sablon_tercihleri) {
    try {
      const parsedTercihler =
        typeof dosyaObj.sablon_tercihleri === 'string'
          ? JSON.parse(dosyaObj.sablon_tercihleri)
          : dosyaObj.sablon_tercihleri
      if (Array.isArray(parsedTercihler.sonucOnayEkler)) {
        baseData.ekler = parsedTercihler.sonucOnayEkler
      }
    } catch {
      // JSON parse error ignored
    }
  }

  // Teslim süresi
  if (
    dosyaObj.teslim_gun !== undefined &&
    dosyaObj.teslim_gun !== null &&
    String(dosyaObj.teslim_gun).trim() !== ''
  ) {
    baseData.teslimGun = String(dosyaObj.teslim_gun)
    baseData.teslimGunu = String(dosyaObj.teslim_gun)
    baseData.teslimSuresi = String(dosyaObj.teslim_gun)
  } else if (dosyaObj.teslim_suresi) {
    baseData.teslimGun = String(dosyaObj.teslim_suresi)
    baseData.teslimGunu = String(dosyaObj.teslim_suresi)
    baseData.teslimSuresi = String(dosyaObj.teslim_suresi)
  } else if (dosyaObj.teslim_tarihi) {
    const tDate = new Date(dosyaObj.teslim_tarihi)
    const baseDate = dosyaObj.tarih
      ? new Date(dosyaObj.tarih)
      : dosyaObj.dosya_acilis_tarihi
        ? new Date(dosyaObj.dosya_acilis_tarihi)
        : new Date()
    const diffDays = Math.ceil((tDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 0 && diffDays < 365) {
      baseData.teslimGun = String(diffDays)
      baseData.teslimGunu = String(diffDays)
      baseData.teslimSuresi = String(diffDays)
    }
  }

  if (dosyaObj.teslim_tarihi) {
    baseData.teslimTarihi = dosyaObj.teslim_tarihi
  }

  if (dosyaObj.sozlesme_yapilacak_mi !== undefined) {
    baseData.sozlesmeYapilacakMi = Boolean(dosyaObj.sozlesme_yapilacak_mi)
  }

  if (activeTab?.initialData) {
    Object.assign(baseData, activeTab.initialData)
  }

  if (!baseData.teslimGun) {
    baseData.teslimGun = '7'
    baseData.teslimGunu = '7'
    baseData.teslimSuresi = '7'
  }

  const baseKalemler =
    baseData.ihtiyacKalemleri &&
    Array.isArray(baseData.ihtiyacKalemleri) &&
    baseData.ihtiyacKalemleri.length > 0
      ? baseData.ihtiyacKalemleri
      : items

  if (baseKalemler && Array.isArray(baseKalemler)) {
    let grandTotalNum = 0

    baseData.ihtiyacKalemleri = baseKalemler.map((kalem: any, idx: number) => {
      const miktarNum = Number(kalem.miktar || 1)
      const kalemId = kalem.id || items[idx]?.id || idx + 1
      let minPrice = Infinity
      let bestFirmName = ''
      let winnerPrice = 0

      const teklifler = activeFirms.map((firm: any, fIdx: number) => {
        const firmId = firm.id ?? firm.temin_firma_id ?? firm.firma_id
        const firmUnvan = (firm.unvan || firm.firma_adi || firm.firmaUnvan || '')
          .trim()
          .toLowerCase()

        // 1. Match from bids list
        const bid = bids.find(
          (b: any) =>
            (b.temin_kalem_id === kalemId ||
              b.temin_kalem_id === kalem.siraNo ||
              b.temin_kalem_id === idx + 1 ||
              b.kalem_id === kalemId) &&
            (b.temin_firma_id === firmId ||
              b.temin_firma_id === firm.temin_firma_id ||
              b.temin_firma_id === firm.id ||
              b.firma_id === firm.firma_id ||
              b.firma_id === firm.id)
        )

        let priceVal: any = bid ? (bid.birim_fiyat ?? bid.fiyat ?? bid.birimFiyat) : undefined

        // 2. Check in kalem's existing teklifler/firmaTeklifleri if not found
        if (priceVal === undefined || priceVal === null || priceVal === '' || priceVal === '-') {
          const existingOffers =
            kalem.firmaTeklifleriDetay || kalem.firmaTeklifleri || kalem.teklifler || []
          if (Array.isArray(existingOffers) && existingOffers.length > 0) {
            const foundOffer =
              existingOffers.find((eo: any) => {
                const eoId = eo.firmaId ?? eo.temin_firma_id ?? eo.firma_id ?? eo.id
                if (firmId !== undefined && eoId !== undefined && String(firmId) === String(eoId))
                  return true
                const eoUnvan = (eo.firmaUnvan || eo.unvan || eo.firma_adi || '')
                  .trim()
                  .toLowerCase()
                if (firmUnvan && eoUnvan && firmUnvan === eoUnvan) return true
                return false
              }) || existingOffers[fIdx]

            if (foundOffer) {
              priceVal = foundOffer.birimFiyat ?? foundOffer.fiyat ?? foundOffer.birim_fiyat
            }
          }
        }

        const priceNum = parseNumericPrice(priceVal)

        if (priceNum > 0 && priceNum < minPrice) {
          minPrice = priceNum
          bestFirmName = firm.unvan || firm.firma_adi || ''
        }

        if (
          winnerFirm &&
          (firm.id === winnerFirm.id || firm.temin_firma_id === winnerFirm.temin_firma_id) &&
          priceNum > 0
        ) {
          winnerPrice = priceNum
        }

        const formattedPrice =
          priceNum > 0
            ? priceNum.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '-'

        const itemTotalNum = priceNum * miktarNum
        const formattedTutar =
          itemTotalNum > 0
            ? itemTotalNum.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '-'

        return {
          firmaId: firm.id,
          firmaUnvan: firm.unvan || firm.firma_adi || `Firma ${fIdx + 1}`,
          birimFiyat: priceNum,
          fiyat: formattedPrice,
          tutar: formattedTutar
        }
      })

      const effectivePrice = winnerPrice > 0 ? winnerPrice : minPrice !== Infinity ? minPrice : 0
      const itemCostNum = effectivePrice * miktarNum
      grandTotalNum += itemCostNum

      return {
        ...kalem,
        id: kalemId,
        siraNo: kalem.siraNo || idx + 1,
        kodu: kalem.kodu || kalem.tasinir_kodu || items[idx]?.tasinir_kodu || '-',
        malzemeAdi: kalem.malzemeAdi || kalem.kalem_adi || items[idx]?.kalem_adi || '',
        ozelligi: kalem.ozelligi || kalem.aciklama || items[idx]?.aciklama || '',
        birimi: kalem.birimi || kalem.birim || items[idx]?.birim || '',
        miktar: miktarNum,
        enUygunFirmaAdi: bestFirmName,
        enDusukFiyat:
          effectivePrice > 0
            ? effectivePrice.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '-',
        toplamBedel:
          itemCostNum > 0
            ? itemCostNum.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '-',
        firmaTeklifleri: teklifler,
        firmaTeklifleriDetay: teklifler
      }
    })

    // Build firm totals row
    const firmTotals = activeFirms.map((firm: any) => {
      let firmTotalNum = 0
      baseData.ihtiyacKalemleri.forEach((kalem: any) => {
        const miktarNum = Number(kalem.miktar || 0)
        const tf = (kalem.firmaTeklifleriDetay || []).find(
          (t: any) =>
            (firm.id && t.firmaId === firm.id) || (firm.unvan && t.firmaUnvan === firm.unvan)
        )
        if (tf && tf.birimFiyat > 0) {
          firmTotalNum += tf.birimFiyat * miktarNum
        }
      })

      return {
        firmaId: firm.id,
        unvan: firm.unvan || firm.firma_adi || '',
        toplam:
          firmTotalNum > 0
            ? firmTotalNum.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '0,00'
      }
    })

    baseData.firmaToplamlari = firmTotals
    baseData.firmaToplamlariDetay = firmTotals

    if (winnerFirm?.teklif_toplami && Number(winnerFirm.teklif_toplami) > 0) {
      baseData.genelToplam = Number(winnerFirm.teklif_toplami).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    } else if (grandTotalNum > 0) {
      baseData.genelToplam = grandTotalNum.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }

  // Son alım fiyat cetveli kalemleri
  if (
    (!baseData.fiyatKalemleri || baseData.fiyatKalemleri.length === 0) &&
    baseData.ihtiyacKalemleri &&
    baseData.ihtiyacKalemleri.length > 0
  ) {
    baseData.fiyatKalemleri = baseData.ihtiyacKalemleri.map((k: any, idx: number) => {
      const birimFiyatStr =
        k.enDusukFiyat && k.enDusukFiyat !== '-'
          ? k.enDusukFiyat
          : k.birimFiyat
            ? Number(k.birimFiyat).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '0,00'
      const toplamTutarStr =
        k.toplamBedel && k.toplamBedel !== '-'
          ? k.toplamBedel
          : k.toplamTutar
            ? Number(k.toplamTutar).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '0,00'

      return {
        siraNo: k.siraNo || idx + 1,
        malzemeKodu: k.kodu || k.malzemeKodu || k.tasinir_kodu || '-',
        malzemeAdi: k.malzemeAdi || k.kalem_adi || '',
        ozelligi: k.ozelligi || k.aciklama || '',
        birimi: k.birimi || k.birim || '',
        kdvOrani: k.kdvOrani ? String(k.kdvOrani).replace('%', '') : '20',
        miktar: k.miktar || 1,
        birimFiyat: birimFiyatStr,
        toplamTutar: toplamTutarStr,
        kazananFirma: k.kazananFirma || winnerFirm?.unvan || k.enUygunFirmaAdi || '-',
        alimTarihi:
          k.alimTarihi ||
          dosyaObj.sozlesme_tarihi ||
          dosyaObj.dosya_acilis_tarihi ||
          dosyaObj.tarih ||
          '-'
      }
    })
  }
}
