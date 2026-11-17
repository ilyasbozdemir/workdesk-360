import { FirmaStats, IslemlerData } from './types'
import {
  fetchCanonicalDossierPricing,
  isDogrudanTeminDosyasi
} from '../../../../../../services/dossier/dossierPriceSyncService'

export interface ResolvedSiparisData {
  kazananFirmaId: number | null
  kazananFirmaUnvan: string
  firmaStats: FirmaStats
  islemlerData: IslemlerData
  sonucOnayEkler: string[]
}

const DEFAULT_EKLER = [
  'Piyasa Fiyat Araştırması Tutanağı',
  'Teklif Mektupları',
  'İhtiyaç Raporu',
  'Harcama Talimatı',
  'Yaklaşık Maliyet Hesap Cetveli'
]

export async function fetchSiparisVeSozlesmeData(
  activeDosyaId: number
): Promise<ResolvedSiparisData | null> {
  const dosyaRes = await window.electron.ipcRenderer.invoke(
    'db:query',
    `SELECT d.firma_id, d.yaklasik_maliyet, d.teslim_tarihi, d.teslim_gun,
            d.teklif_sozlesme_turu, d.sozlesme_yapilacak_mi, d.sablon_tercihleri,
            d.ihale_usulu, d.ihale_sekli, d.tedarik_sekli, d.tur
     FROM DATA_TeminDosyasi d
     WHERE d.id = ?`,
    [activeDosyaId]
  )

  if (!dosyaRes.success || !dosyaRes.data || dosyaRes.data.length === 0) {
    return null
  }

  const dosyaRow = dosyaRes.data[0]
  const isDt = isDogrudanTeminDosyasi(dosyaRow)
  let sonucOnayEkler = DEFAULT_EKLER

  if (dosyaRow.sablon_tercihleri) {
    try {
      const parsed = JSON.parse(dosyaRow.sablon_tercihleri)
      if (Array.isArray(parsed.sonucOnayEkler) && parsed.sonucOnayEkler.length > 0) {
        sonucOnayEkler = parsed.sonucOnayEkler
      }
    } catch (e) {
      console.warn('Failed to parse sablon_tercihleri:', e)
    }
  }

  const canonical = await fetchCanonicalDossierPricing(activeDosyaId)
  if (!canonical || !canonical.kazananFirma) {
    return null
  }

  const winner = canonical.kazananFirma
  const effectiveFirmaId = Number(winner.master_firma_id) || Number(winner.temin_firma_id)
  const effectiveUnvan = winner.unvan || 'İstekli Firma'
  const effectiveVergiNo = winner.vergi_no || null
  const teklifToplami = canonical.kazananTeklifToplami
  const yasaklilikDurumu = winner.yasaklilik_durumu || null

  let formattedDate = ''
  let teslimGunu =
    dosyaRow.teslim_gun !== undefined && dosyaRow.teslim_gun !== null ? dosyaRow.teslim_gun : 10

  if (
    (dosyaRow.teslim_gun === undefined || dosyaRow.teslim_gun === null) &&
    dosyaRow.teslim_tarihi
  ) {
    const tDate = new Date(dosyaRow.teslim_tarihi)
    const today = new Date()
    const diffTime = tDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) teslimGunu = diffDays
  }

  if (dosyaRow.teslim_tarihi) {
    const d = new Date(dosyaRow.teslim_tarihi)
    if (!isNaN(d.getTime())) {
      formattedDate = d.toISOString().split('T')[0]
    }
  }

  // Doğrudan Temin (4734 Md. 22) dosyalarında sözleşme adımı uygulanmaz
  const effectiveSozlesme = isDt ? 0 : dosyaRow.sozlesme_yapilacak_mi ? 1 : 0

  const firmaStats: FirmaStats = {
    teklifToplami,
    yaklasikMaliyet: canonical.toplamYaklasikMaliyet || dosyaRow.yaklasik_maliyet || null,
    teslimTarihi: formattedDate || null,
    yasaklilikDurumu,
    vergiNo: effectiveVergiNo,
    teklifSozlesmeTuru: dosyaRow.teklif_sozlesme_turu || 'Mal Alımı',
    sozlesmeYapilacakMi: effectiveSozlesme,
    istekliFirmaSayisi: canonical.firmalar.length,
    isResenWinner: canonical.isResenWinner,
    resenReason: canonical.resenReason
  }

  const islemlerData: IslemlerData = {
    sozlesmeYapilacakMi: Boolean(effectiveSozlesme),
    siparisFormuGerekli: true,
    teslimGunu,
    teslimTarihi: formattedDate || '',
    teklifSozlesmeTuru: dosyaRow.teklif_sozlesme_turu || 'Mal Alımı'
  }

  return {
    kazananFirmaId: effectiveFirmaId,
    kazananFirmaUnvan: effectiveUnvan,
    firmaStats,
    islemlerData,
    sonucOnayEkler
  }
}
