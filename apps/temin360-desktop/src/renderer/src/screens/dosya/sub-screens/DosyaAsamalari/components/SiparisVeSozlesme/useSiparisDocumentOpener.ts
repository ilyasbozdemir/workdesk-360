import { useGlobalDocumentPreviewStore } from '@renderer/store/globalDocumentPreviewStore'
import { normalizeForMatch } from '../../useDosyaAsamasiSablons'
import { IslemlerData } from './types'

interface UseSiparisDocumentOpenerProps {
  stageSablons: Array<{
    id: number
    ad: string
    dosya_adi: string
    kategori?: string | null
    format?: string | null
    [key: string]: any
  }>
  activeDosyaId: number | null
  sonucOnayEkler: string[]
  islemlerData?: IslemlerData | null
  kazananFirmaId?: number | null
  kazananFirmaUnvan?: string | null
  handleOpenPreviewForSablon: (
    sablon: any,
    title: string,
    overrideCtx?: any,
    selectedFirma?: any
  ) => Promise<void> | void
}

export function useSiparisDocumentOpener({
  stageSablons,
  activeDosyaId,
  sonucOnayEkler,
  islemlerData,
  kazananFirmaId,
  kazananFirmaUnvan,
  handleOpenPreviewForSablon
}: UseSiparisDocumentOpenerProps) {
  const sharedInitialData = {
    teslimGun: String(islemlerData?.teslimGunu ?? 10),
    teslimGunu: String(islemlerData?.teslimGunu ?? 10),
    teslimSuresi: String(islemlerData?.teslimGunu ?? 10),
    teslimTarihi: islemlerData?.teslimTarihi ?? '',
    sozlesmeYapilacakMi: Boolean(islemlerData?.sozlesmeYapilacakMi),
    yukleniciFirma: kazananFirmaUnvan || '',
    firmaUnvan: kazananFirmaUnvan || '',
    kazananFirmaAdi: kazananFirmaUnvan || ''
  }

  const selectedFirma = kazananFirmaId
    ? {
        id: kazananFirmaId,
        firma_id: kazananFirmaId,
        temin_firma_id: kazananFirmaId,
        unvan: kazananFirmaUnvan || 'Yüklenici Firma'
      }
    : null

  const openDoc = (
    matchPredicate: (sb: any) => boolean,
    docKey: string,
    fallbackTitle: string,
    extraData?: Record<string, any>
  ): void => {
    const s = stageSablons.find(matchPredicate)
    const initialData = { ...sharedInitialData, ...(extraData || {}) }
    const title = s?.ad || fallbackTitle

    if (s) {
      handleOpenPreviewForSablon(s, title, initialData, selectedFirma)
    } else {
      const syntheticSablon = {
        id: 0,
        ad: fallbackTitle,
        dosya_adi: `${docKey}.html`,
        route_path: docKey,
        kategori: '3-siparis-ve-sozlesme'
      }
      handleOpenPreviewForSablon(syntheticSablon, fallbackTitle, initialData, selectedFirma)
    }

    useGlobalDocumentPreviewStore.getState().openDocument({
      documentId: docKey,
      dosyaId: activeDosyaId || undefined,
      documentTitle: title,
      selectedFirma: selectedFirma || null,
      stage: '3-siparis-ve-sozlesme',
      initialTemplateId: docKey,
      initialData
    })
  }

  const handleOpenSonucOnay = (): void => {
    openDoc(
      (sb) => {
        const norm = normalizeForMatch(sb.dosya_adi + sb.ad)
        return (
          norm.includes('dogrudanteminonay') ||
          norm.includes('sonuconay') ||
          norm.includes('onaybelgesi') ||
          norm.includes('karar')
        )
      },
      'dogrudan-temin-onay-belgesi',
      'Doğrudan Temin Onay Belgesi',
      { ekler: sonucOnayEkler }
    )
  }

  const handleOpenButceSorgusu = (): void => {
    openDoc(
      (sb) => {
        const norm = normalizeForMatch(sb.dosya_adi + sb.ad)
        return norm.includes('butce') || norm.includes('odenek')
      },
      'butce-sorgusu',
      'Bütçe Sorgusu / Ödenek Uygunluk Belgesi'
    )
  }

  const handleOpenKabulMektubu = (): void => {
    openDoc(
      (sb) => {
        const norm = normalizeForMatch(sb.dosya_adi + sb.ad)
        return (
          norm.includes('kabulyazisi') ||
          norm.includes('kabuledilenteklif') ||
          norm.includes('kabul') ||
          norm.includes('siparis')
        )
      },
      'kabul-edilen-teklif',
      'Kabul Edilen Teklif / Sipariş Formu'
    )
  }

  const handleOpenSiparisFormu = (): void => {
    openDoc(
      (sb) => {
        const norm = normalizeForMatch(sb.dosya_adi + sb.ad)
        return (
          norm.includes('siparisformu') ||
          norm.includes('siparis') ||
          norm.includes('kabuledilenteklif') ||
          norm.includes('kabul')
        )
      },
      'kabul-edilen-teklif',
      'Kabul Edilen Teklif / Sipariş Formu'
    )
  }

  const handleOpenDavetMektubu = (): void => {
    openDoc(
      (sb) => normalizeForMatch(sb.dosya_adi + sb.ad).includes('davet'),
      'sozlesmeye-davet',
      'Sözleşmeye Davet Mektubu'
    )
  }

  const handleOpenStandartSozlesme = (): void => {
    openDoc(
      (sb) => {
        const norm = normalizeForMatch(sb.dosya_adi + sb.ad)
        return norm.includes('sozlesme') && !norm.includes('alternatif') && !norm.includes('uzun')
      },
      'dogrudan-temin-sozlesmesi',
      'Doğrudan Temin Sözleşmesi'
    )
  }

  const handleOpenAlternatifSozlesme = (): void => {
    openDoc(
      (sb) => {
        const norm = normalizeForMatch(sb.dosya_adi + sb.ad)
        return norm.includes('sozlesme') && norm.includes('alternatif')
      },
      'dogrudan-temin-sozlesmesi-alternatif',
      'Doğrudan Temin Sözleşmesi (Alternatif)'
    )
  }

  const handleOpenUzunFormSozlesme = (): void => {
    openDoc(
      (sb) => {
        const norm = normalizeForMatch(sb.dosya_adi + sb.ad)
        return norm.includes('sozlesme') && norm.includes('uzun')
      },
      'dogrudan-temin-sozlesmesi-uzun',
      'Doğrudan Temin Sözleşmesi (Kapsamlı)'
    )
  }

  return {
    handleOpenSonucOnay,
    handleOpenButceSorgusu,
    handleOpenKabulMektubu,
    handleOpenSiparisFormu,
    handleOpenDavetMektubu,
    handleOpenStandartSozlesme,
    handleOpenAlternatifSozlesme,
    handleOpenUzunFormSozlesme
  }
}
