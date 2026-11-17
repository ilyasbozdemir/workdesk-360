import { useCallback, useEffect, useRef, useState } from 'react'
import { DosyaInspectorSubData } from './types'
import { fetchCanonicalDossierPricing } from '../../../../services/dossier/dossierPriceSyncService'

const EMPTY_SUB_DATA: DosyaInspectorSubData = {
  kalemler: [],
  firmalar: [],
  teklifler: [],
  komisyon: [],
  sablonVeri: [],
  kabulTutanaklari: [],
  faturalar: [],
  aktiviteler: [],
  kazananFirma: null
}

export function useDosyaInspectorData(dosyaOrId?: any, initialDosyaParam?: any) {
  const actualDosya =
    typeof dosyaOrId === 'object' && dosyaOrId !== null ? dosyaOrId : initialDosyaParam

  const actualId: number | undefined =
    typeof dosyaOrId === 'number' ? dosyaOrId : actualDosya?.id ? Number(actualDosya.id) : undefined

  const [fullDosya, setFullDosya] = useState<any>(actualDosya)
  const [subData, setSubData] = useState<DosyaInspectorSubData>(EMPTY_SUB_DATA)
  const [loading, setLoading] = useState(false)

  const actualDosyaRef = useRef(actualDosya)
  useEffect(() => {
    actualDosyaRef.current = actualDosya
  }, [actualDosya])

  const loadSubData = useCallback(async (id: number) => {
    if (!id || !window.electron?.ipcRenderer) return
    const numId = Number(id)
    if (isNaN(numId) || numId <= 0) return

    setLoading(true)
    try {
      const [canonicalPricing, dRes, komRes, sRes, belgeRes] = await Promise.all([
        fetchCanonicalDossierPricing(numId),
        window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT d.*, 
                  b.ad as birim_adi, 
                  p_irt.ad_soyad as irtibat_ad,
                  p_onay.ad_soyad as onaylayan_ad,
                  p_sunan.ad_soyad as sunan_ad,
                  p_haz.ad_soyad as hazirlayan_ad,
                  p_talep.ad_soyad as talep_eden_ad
           FROM DATA_TeminDosyasi d
           LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
           LEFT JOIN TANIM_Personel p_irt ON d.irtibat_yetkilisi_id = p_irt.id
           LEFT JOIN TANIM_Personel p_onay ON d.onay_personel_id = p_onay.id
           LEFT JOIN TANIM_Personel p_sunan ON d.sunan_personel_id = p_sunan.id
           LEFT JOIN TANIM_Personel p_haz ON d.hazirlayan_personel_id = p_haz.id
           LEFT JOIN TANIM_Personel p_talep ON d.talep_eden_personel_id = p_talep.id
           WHERE d.id = ?`,
          [numId]
        ),
        window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT tk.*, p.ad_soyad, p.unvan as personel_unvan, tk.gorev as gorev_adi FROM DATA_TeminKomisyon tk LEFT JOIN TANIM_Personel p ON tk.personel_id = p.id WHERE tk.temin_dosya_id = ? ORDER BY tk.id ASC',
          [numId]
        ),
        window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)',
          [numId]
        ),
        window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT id, belge_adi, belge_turu, is_signed, created_at FROM DATA_TeminBelge WHERE temin_dosya_id = ? ORDER BY id DESC',
          [numId]
        )
      ])

      const loadedDosya =
        dRes?.success && dRes.data?.length > 0
          ? dRes.data[0]
          : canonicalPricing.dosya || actualDosyaRef.current || {}

      setFullDosya(loadedDosya)

      // sablon_tercihleri içinden kabul tutanakları ve faturaları ayrıştır
      let prefs: any = {}
      if (loadedDosya?.sablon_tercihleri) {
        try {
          prefs =
            typeof loadedDosya.sablon_tercihleri === 'string'
              ? JSON.parse(loadedDosya.sablon_tercihleri)
              : loadedDosya.sablon_tercihleri || {}
        } catch {
          prefs = {}
        }
      }

      const kabulTutanaklari = Array.isArray(prefs.kabulTutanaklari) ? prefs.kabulTutanaklari : []
      const faturalar = Array.isArray(prefs.faturalar) ? prefs.faturalar : []

      // Dosya bazlı aktivite geçmişi (üretilen belgeler, tutanaklar ve fatura işlemleri)
      const aktiviteler: any[] = []
      if (loadedDosya?.created_at || loadedDosya?.dosya_acilis_tarihi) {
        aktiviteler.push({
          id: `act-open-${numId}`,
          baslik: 'Doğrudan Temin Dosyası Oluşturuldu',
          detay: `${loadedDosya.temin_no || `#${numId}`} — ${loadedDosya.konu || ''}`,
          tarih: loadedDosya.dosya_acilis_tarihi || loadedDosya.created_at,
          tip: 'dosya'
        })
      }
      if (canonicalPricing.firmalar.length > 0) {
        aktiviteler.push({
          id: `act-bids-${numId}`,
          baslik: 'Piyasa Fiyat Araştırması & Teklifler Kaydedildi',
          detay: `${canonicalPricing.firmalar.length} firma, ${canonicalPricing.teklifler.length} birim fiyat teklifi${
            canonicalPricing.kazananFirma ? ` • Kazanan: ${canonicalPricing.kazananFirma.unvan}` : ''
          }`,
          tarih: loadedDosya?.son_teklif_verme_tarihi || loadedDosya?.temin_tarihi || loadedDosya?.updated_at,
          tip: 'teklif'
        })
      }
      kabulTutanaklari.forEach((t: any, idx: number) => {
        aktiviteler.push({
          id: `act-tut-${numId}-${idx}`,
          baslik: `Muayene ve Kabul Tutanağı (${t.tutanakNo || `#${idx + 1}`})`,
          detay: `Fatura: ${t.faturaNo || '-'} • Tutar: ₺${Number(t.tutar || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          tarih: t.tutanakTarihi || t.created_at,
          tip: 'kabul'
        })
      })
      faturalar.forEach((f: any, idx: number) => {
        aktiviteler.push({
          id: `act-fat-${numId}-${idx}`,
          baslik: `Fatura & Tahakkuk Kaydı (${f.faturaNo || `#${idx + 1}`})`,
          detay: `Brüt: ₺${Number(f.firmaTutar || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} • Durum: ${f.durum === 'odendi' ? 'Ödendi' : 'Beklemede'}`,
          tarih: f.faturaTarihi,
          tip: 'fatura'
        })
      })
      if (belgeRes?.success && Array.isArray(belgeRes.data)) {
        belgeRes.data.slice(0, 8).forEach((b: any) => {
          aktiviteler.push({
            id: `act-belge-${b.id}`,
            baslik: `Resmî Belge: ${b.belge_adi || b.belge_turu || 'Evrak'}`,
            detay: b.is_signed ? 'İmzalandı / Onaylandı' : 'Taslak Üretildi',
            tarih: b.created_at,
            tip: 'belge'
          })
        })
      }

      setSubData({
        kalemler: canonicalPricing.kalemler,
        firmalar: canonicalPricing.firmalar,
        teklifler: canonicalPricing.teklifler,
        komisyon: komRes?.success ? komRes.data : [],
        sablonVeri: sRes?.success ? sRes.data : [],
        kabulTutanaklari,
        faturalar,
        aktiviteler,
        kazananFirma: canonicalPricing.kazananFirma
      })
    } catch (err) {
      console.error('Dosya detayları yüklenirken hata:', err)
      if (actualDosyaRef.current) setFullDosya(actualDosyaRef.current)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (actualId) {
      // Dosya değiştiğinde eski dosyanın verilerini hemen temizle
      setSubData(EMPTY_SUB_DATA)
      loadSubData(actualId)
    } else if (actualDosyaRef.current) {
      setFullDosya(actualDosyaRef.current)
      setSubData(EMPTY_SUB_DATA)
    }
  }, [actualId, loadSubData])

  // Canlı fiyat, kalem, fatura ve belge güncellemelerini anında yansıt
  useEffect(() => {
    if (!actualId) return
    const handleSync = () => {
      loadSubData(actualId)
    }
    const events = [
      'items:changed',
      'bids:changed',
      'commissions:changed',
      'dossier:updated',
      'documents:changed',
      'workspace:refreshed'
    ]
    events.forEach((ev) => window.addEventListener(ev, handleSync))
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleSync))
    }
  }, [actualId, loadSubData])

  const d = fullDosya || actualDosya || {}

  const toplamYaklasikMaliyet =
    subData.kalemler.reduce(
      (acc, cur) => acc + Number(cur.yaklasik_maliyet_toplam || cur.kazanan_kalem_toplam || 0),
      0
    ) || Number(d.yaklasik_maliyet || 0)

  const fullPayload = {
    dosya: d,
    ...subData
  }

  return {
    dosya: d,
    subData,
    loading,
    toplamYaklasikMaliyet,
    fullPayload,
    reload: () => {
      if (actualId) loadSubData(actualId)
    }
  }
}
