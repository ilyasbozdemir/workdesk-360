import Decimal from 'decimal.js'
import { resolveResenWinner, WinnerSyncDbExecutor } from './winnerSyncService'

export interface SqlExecutor extends WinnerSyncDbExecutor {
  run: (sql: string, params?: any[]) => Promise<{ success: boolean; error?: string }>
}

export interface CanonicalKalemItem {
  id: number
  temin_dosya_id: number
  sira_no: number
  kalem_adi: string
  malzeme_adi: string
  aciklama: string
  ozelligi: string
  birim: string
  birimi: string
  olcu_birimi: string
  miktar: number
  kdv_orani: number
  tasinir_kodu?: string
  okas_kodu?: string
  poz_no?: string
  tipi?: string
  /** Muayene & Kabul ve Sipariş için esas alınan birim fiyat (Kazanan firma teklifi, yoksa yaklaşık birim fiyat) */
  birim_fiyat: number
  /** Kazanan firmanın bu kaleme verdiği KDV hariç birim fiyat */
  kazanan_birim_fiyat: number
  /** Kazanan firmanın bu kalem için KDV hariç toplam tutarı (miktar * kazanan_birim_fiyat) */
  kazanan_kalem_toplam: number
  /** Piyasa fiyat araştırması yaklaşık birim maliyeti */
  yaklasik_maliyet_birim: number
  /** Piyasa fiyat araştırması yaklaşık toplam maliyeti (miktar * yaklasik_maliyet_birim) */
  yaklasik_maliyet_toplam: number
  /** Kalem KDV tutarı */
  kdv_tutari: number
  /** Kalem KDV dahil toplam tutarı */
  kdv_dahil_toplam: number
  /** Firma bazlı birim fiyat haritası (temin_firma_id -> birim_fiyat) */
  firma_fiyatlari: Record<number, number>
}

export interface CanonicalFirmaItem {
  id: number
  temin_firma_id: number
  firma_id: number | null
  master_firma_id: number | null
  unvan: string
  vergi_no: string
  telefon: string
  email: string
  yetkili: string
  yasaklilik_durumu: string | null
  kazandi_mi: number
  teklif_verdi_mi: number
  teklif_durumu: string
  /** KDV Hariç Hesaplanan / Geçerli Teklif Toplamı */
  teklif_toplami: number
  toplam_teklif_tutari: number
  calculated_teklif: number
  /** KDV Dahil Teklif Toplamı */
  kdv_dahil_teklif_toplami: number
  /** Bu firmanın kalem bazlı teklif sayısı */
  kalem_teklif_sayisi: number
}

export interface CanonicalTeklifRow {
  id?: number
  temin_dosya_id: number
  temin_kalem_id: number
  temin_firma_id: number
  birim_fiyat: number
  miktar: number
  toplam_tutar: number
  kalem_adi: string
  firma_unvan: string
}

export interface CanonicalDossierPricingResult {
  dosyaId: number
  dosya?: any
  isDogrudanTemin: boolean
  hesaplamaEsasi: string
  kdvOrani: number
  toplamYaklasikMaliyet: number
  kazananFirma: CanonicalFirmaItem | null
  kazananTeklifToplami: number | null
  kazananKdvTutari: number | null
  kazananKdvDahilToplam: number | null
  isResenWinner: boolean
  resenReason: string
  kalemler: CanonicalKalemItem[]
  firmalar: CanonicalFirmaItem[]
  teklifler: CanonicalTeklifRow[]
  bidsMap: Record<string, number>
}

function getDefaultExecutor(): SqlExecutor {
  return {
    query: async (sql: string, params: any[] = []) => {
      if (typeof window === 'undefined' || !window.electron?.ipcRenderer) {
        return { success: false, error: 'IPC Renderer mevcut değil' }
      }
      return window.electron.ipcRenderer.invoke('db:query', sql, params)
    },
    run: async (sql: string, params: any[] = []) => {
      if (typeof window === 'undefined' || !window.electron?.ipcRenderer) {
        return { success: false, error: 'IPC Renderer mevcut değil' }
      }
      return window.electron.ipcRenderer.invoke('db:run', sql, params)
    },
    transaction: async (queries: Array<{ sql: string; params?: any[] }>) => {
      if (typeof window === 'undefined' || !window.electron?.ipcRenderer) {
        return { success: false, error: 'IPC Renderer mevcut değil' }
      }
      return window.electron.ipcRenderer.invoke('db:transaction', queries)
    }
  }
}

/**
 * Dosyanın Doğrudan Temin (4734 Md. 22) mi yoksa İhale (Md. 19, 20, 21 veya 2886) mi olduğunu belirler.
 * Doğrudan Temin dosyalarında ihale komisyonu kararı, ihale karar pulu ve ihale sözleşmesi adımları çalıştırılmaz.
 */
export function isDogrudanTeminDosyasi(dosya: any): boolean {
  if (!dosya) return true
  const rawUsul = String(
    dosya.temin_usulu ||
      dosya.ihale_usulu ||
      dosya.ihale_sekli ||
      dosya.tedarik_sekli ||
      dosya.alim_usulu ||
      dosya.usul ||
      ''
  )
    .toLowerCase()
    .trim()

  if (!rawUsul) return true

  // 4734 Md. 22 (22/a, 22/b, 22/c, 22/d vb.) veya Doğrudan Temin ibaresi varsa kesinlikle Doğrudan Temin'dir
  if (
    rawUsul.includes('22') ||
    rawUsul.includes('doğrudan') ||
    rawUsul.includes('dogrudan') ||
    rawUsul === 'dt'
  ) {
    return true
  }

  // Açık İhale (19), Belli İstekliler (20), Pazarlık (21) veya 2886 Devlet İhale ise İhale dosyasıdır
  if (
    rawUsul.includes('19') ||
    rawUsul.includes('20') ||
    rawUsul.includes('21') ||
    rawUsul.includes('2886') ||
    rawUsul.includes('açık ihale') ||
    rawUsul.includes('acik ihale') ||
    rawUsul.includes('pazarlık') ||
    rawUsul.includes('pazarlik') ||
    rawUsul.includes('belli istekli')
  ) {
    return false
  }

  return true
}

/**
 * Fiyat araştırmasında girilen birim teklif fiyatını tekil ve atomik olarak kaydeder.
 * DATA_TeminKalemTeklif tablosunda (temin_kalem_id, temin_firma_id) çifti için mükerrer satır oluşmasını engeller,
 * firmanın teklif toplamını ve dosyanın yaklaşık maliyetini senkronize günceller.
 */
export async function upsertKalemBidPrice(params: {
  dosyaId: number
  kalemId: number
  teminFirmaId: number
  birimFiyat: number
  executor?: SqlExecutor
}): Promise<{
  success: boolean
  firmaToplam: number
  yaklasikMaliyet: number
  error?: string
}> {
  const { dosyaId, kalemId, teminFirmaId, birimFiyat, executor = getDefaultExecutor() } = params
  const cleanPrice = Number.isFinite(Number(birimFiyat)) && Number(birimFiyat) >= 0 ? Number(birimFiyat) : 0

  try {
    // 1. Aynı (dosya, kalem, firma) için varsa eski/mükerrer kayıtları temizle ve tek güncel satır yaz
    await executor.run(
      `DELETE FROM DATA_TeminKalemTeklif
       WHERE temin_dosya_id = ? AND temin_kalem_id = ? AND temin_firma_id = ?`,
      [dosyaId, kalemId, teminFirmaId]
    )

    await executor.run(
      `INSERT INTO DATA_TeminKalemTeklif (
         temin_dosya_id, dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat, kdv_tutari, teklif_verildi_mi
       ) VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [dosyaId, dosyaId, kalemId, teminFirmaId, cleanPrice, cleanPrice > 0 ? 1 : 0]
    )

    // 2. Güncel tüm kalemleri ve teklifleri çekerek firma toplamını ve yaklaşık maliyeti hesapla
    const [itemsRes, bidsRes, firmsRes, dosyaRes] = await Promise.all([
      executor.query(
        'SELECT id, miktar FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC',
        [dosyaId]
      ),
      executor.query(
        'SELECT id, temin_kalem_id, temin_firma_id, birim_fiyat FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ? ORDER BY id ASC',
        [dosyaId]
      ),
      executor.query(
        'SELECT id FROM DATA_TeminFirma WHERE temin_dosya_id = ? AND COALESCE(aktif_mi, 1) != 0 ORDER BY id ASC',
        [dosyaId]
      ),
      executor.query(
        'SELECT hesaplama_esasi FROM DATA_TeminDosyasi WHERE id = ?',
        [dosyaId]
      )
    ])

    const items = itemsRes.success && Array.isArray(itemsRes.data) ? itemsRes.data : []
    const rawBids = bidsRes.success && Array.isArray(bidsRes.data) ? bidsRes.data : []
    const firms = firmsRes.success && Array.isArray(firmsRes.data) ? firmsRes.data : []
    const hesaplamaEsasi =
      dosyaRes.success && dosyaRes.data?.[0]?.hesaplama_esasi
        ? String(dosyaRes.data[0].hesaplama_esasi)
        : 'Ortalama fiyat esasına göre'

    // Son kaydı esas alan teklif haritası
    const latestBids = new Map<string, number>()
    for (const b of rawBids) {
      latestBids.set(`${b.temin_kalem_id}_${b.temin_firma_id}`, Number(b.birim_fiyat) || 0)
    }
    latestBids.set(`${kalemId}_${teminFirmaId}`, cleanPrice)

    // İlgili firmanın toplam teklifini hesapla
    let firmaTotalDec = new Decimal(0)
    for (const item of items) {
      const p = latestBids.get(`${item.id}_${teminFirmaId}`) || 0
      const m = new Decimal(Number(item.miktar) || 0)
      firmaTotalDec = firmaTotalDec.plus(m.times(p))
    }
    const firmaToplam = firmaTotalDec.toDecimalPlaces(2).toNumber()

    await executor.run(
      `UPDATE DATA_TeminFirma
       SET teklif_toplami = ?,
           teklif_verdi_mi = ?,
           teklif_durumu = ?
       WHERE id = ?`,
      [
        firmaToplam,
        firmaToplam > 0 ? 1 : 0,
        firmaToplam > 0 ? 'Teklif Verildi' : 'Davet Edildi',
        teminFirmaId
      ]
    )

    // Yaklaşık maliyeti hesapla
    const isLowestBasis =
      hesaplamaEsasi.toLowerCase().includes('en düşük') ||
      hesaplamaEsasi.toLowerCase().includes('en dusuk')

    // Tüm firmaların güncel teklif toplamlarını hesapla ve en düşük firma toplamını belirle
    let lowestFirmaTotal: number | null = null
    for (const f of firms) {
      let fTotalDec = new Decimal(0)
      let hasPositiveBid = false
      for (const item of items) {
        const p = latestBids.get(`${item.id}_${f.id}`) || 0
        if (p > 0) hasPositiveBid = true
        const m = new Decimal(Number(item.miktar) || 0)
        fTotalDec = fTotalDec.plus(m.times(p))
      }
      const fTot = fTotalDec.toDecimalPlaces(2).toNumber()
      if (hasPositiveBid && fTot > 0) {
        if (lowestFirmaTotal === null || fTot < lowestFirmaTotal) {
          lowestFirmaTotal = fTot
        }
      }
    }

    let yaklasikMaliyet = 0
    if (isLowestBasis && lowestFirmaTotal !== null && lowestFirmaTotal > 0) {
      yaklasikMaliyet = lowestFirmaTotal
    } else {
      let ymTotalDec = new Decimal(0)
      for (const item of items) {
        let unitCost = 0
        if (isLowestBasis) {
          let minP = Infinity
          for (const f of firms) {
            const val = latestBids.get(`${item.id}_${f.id}`) || 0
            if (val > 0 && val < minP) minP = val
          }
          unitCost = minP === Infinity ? 0 : minP
        } else {
          let sumDec = new Decimal(0)
          let cnt = 0
          for (const f of firms) {
            const val = latestBids.get(`${item.id}_${f.id}`) || 0
            if (val > 0) {
              sumDec = sumDec.plus(val)
              cnt++
            }
          }
          unitCost = cnt > 0 ? sumDec.div(cnt).toDecimalPlaces(2).toNumber() : 0
        }
        const m = new Decimal(Number(item.miktar) || 0)
        ymTotalDec = ymTotalDec.plus(m.times(unitCost))
      }
      yaklasikMaliyet = ymTotalDec.toDecimalPlaces(2).toNumber()
    }
    if (yaklasikMaliyet > 0) {
      await executor.run(
        'UPDATE DATA_TeminDosyasi SET yaklasik_maliyet = ? WHERE id = ?',
        [yaklasikMaliyet, dosyaId]
      )
    }

    return {
      success: true,
      firmaToplam,
      yaklasikMaliyet
    }
  } catch (err: any) {
    return {
      success: false,
      firmaToplam: 0,
      yaklasikMaliyet: 0,
      error: err?.message || String(err)
    }
  }
}

/**
 * İlgili dosyanın ihtiyaç kalemlerini, firma tekliflerini, kazanan firma birim fiyatlarını ve
 * yaklaşık maliyetlerini tek ve güvenilir kaynaktan (DATA_TeminKalemTeklif + DATA_TeminFirma + DATA_TeminKalem)
 * derler. Tüm ekranlar (Piyasa Fiyat Araştırması, Sipariş, Muayene ve Kabul, Dosya Künyesi ve Dosya Detay)
 * bu fonksiyonu kullanarak %100 aynı fiyatları gösterir.
 */
export async function fetchCanonicalDossierPricing(
  dosyaId: number,
  executor: SqlExecutor = getDefaultExecutor()
): Promise<CanonicalDossierPricingResult> {
  const emptyResult: CanonicalDossierPricingResult = {
    dosyaId: Number(dosyaId) || 0,
    dosya: null,
    isDogrudanTemin: true,
    hesaplamaEsasi: 'Ortalama fiyat esasına göre',
    kdvOrani: 20,
    toplamYaklasikMaliyet: 0,
    kazananFirma: null,
    kazananTeklifToplami: null,
    kazananKdvTutari: null,
    kazananKdvDahilToplam: null,
    isResenWinner: false,
    resenReason: '',
    kalemler: [],
    firmalar: [],
    teklifler: [],
    bidsMap: {}
  }

  if (!dosyaId || Number.isNaN(Number(dosyaId))) return emptyResult

  const [dosyaRes, itemsRes, firmsRes, bidsRes] = await Promise.all([
    executor.query('SELECT * FROM DATA_TeminDosyasi WHERE id = ?', [dosyaId]),
    executor.query(
      'SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY COALESCE(sira_no, id) ASC, id ASC',
      [dosyaId]
    ),
    executor.query(
      `SELECT
         df.*,
         df.id as temin_firma_id,
         df.firma_id as master_firma_id,
         COALESCE(NULLIF(TRIM(df.unvan), ''), NULLIF(TRIM(f.unvan), ''), 'İstekli Firma') as resolved_unvan,
         COALESCE(NULLIF(TRIM(df.vergi_no), ''), NULLIF(TRIM(f.vergi_no), ''), '') as resolved_vergi_no,
         COALESCE(NULLIF(TRIM(df.telefon), ''), NULLIF(TRIM(f.telefon), ''), '') as resolved_telefon,
         COALESCE(NULLIF(TRIM(df.email), ''), NULLIF(TRIM(f.email), ''), '') as resolved_email,
         COALESCE(NULLIF(TRIM(df.ilgili_kisi), ''), NULLIF(TRIM(f.ilgili_adi), ''), '') as resolved_yetkili
       FROM DATA_TeminFirma df
       LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
       WHERE df.temin_dosya_id = ?
         AND (COALESCE(df.aktif_mi, 1) = 1 OR df.aktif_mi = '1' OR df.aktif_mi = 'true')
       ORDER BY df.id ASC`,
      [dosyaId]
    ),
    executor.query(
      `SELECT id, temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat, kdv_tutari, teklif_verildi_mi
       FROM DATA_TeminKalemTeklif
       WHERE temin_dosya_id = ?
       ORDER BY id ASC`,
      [dosyaId]
    )
  ])

  if (!dosyaRes.success || !dosyaRes.data || dosyaRes.data.length === 0) {
    return emptyResult
  }

  const dosya = dosyaRes.data[0]
  const isDogrudanTemin = isDogrudanTeminDosyasi(dosya)
  const hesaplamaEsasi = String(dosya.hesaplama_esasi || 'Ortalama fiyat esasına göre')
  const dosyaKdv = Number.isFinite(Number(dosya.kdv)) && Number(dosya.kdv) >= 0 ? Number(dosya.kdv) : 20

  const rawItems = itemsRes.success && Array.isArray(itemsRes.data) ? itemsRes.data : []
  const rawFirms = firmsRes.success && Array.isArray(firmsRes.data) ? firmsRes.data : []
  const rawBids = bidsRes.success && Array.isArray(bidsRes.data) ? bidsRes.data : []

  // Mükerrer firma satırlarını filtrele
  const seenFirmKeys = new Set<string>()
  const uniqueRawFirms = rawFirms.filter((f: any) => {
    const key = f.id ? `id_${f.id}` : f.firma_id ? `fid_${f.firma_id}` : `unvan_${f.resolved_unvan}`
    if (seenFirmKeys.has(key)) return false
    seenFirmKeys.add(key)
    return true
  })

  // Mükerrer DATA_TeminKalemTeklif kayıtlarını en son girilen (MAX(id)) değere göre tekilleştir
  const sortedBids = [...rawBids].sort((a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0))
  const bidsMap: Record<string, number> = {}
  const dedupedBidRowsMap = new Map<string, any>()
  for (const b of sortedBids) {
    const kId = Number(b.temin_kalem_id)
    const fId = Number(b.temin_firma_id)
    if (!kId || !fId) continue
    const key = `${kId}_${fId}`
    const price = Number(b.birim_fiyat) || 0
    bidsMap[key] = price
    dedupedBidRowsMap.set(key, {
      ...b,
      temin_kalem_id: kId,
      temin_firma_id: fId,
      birim_fiyat: price
    })
  }

  // Firma bazlı toplamları hesapla
  const firmalar: CanonicalFirmaItem[] = uniqueRawFirms.map((f: any) => {
    const tfId = Number(f.temin_firma_id || f.id)
    let calcDec = new Decimal(0)
    let kalemTeklifSayisi = 0

    for (const item of rawItems) {
      const kId = Number(item.id)
      const p = bidsMap[`${kId}_${tfId}`] || 0
      if (p > 0) {
        kalemTeklifSayisi++
        const m = new Decimal(Number(item.miktar) || 1)
        calcDec = calcDec.plus(m.times(p))
      }
    }

    const calcTotal = calcDec.toDecimalPlaces(2).toNumber()
    const storedTotal = Number(f.teklif_toplami) || 0
    // Kalem bazlı teklif girilmişse her zaman kalem bazlı gerçek toplam esas alınır; yoksa kayıtlı teklif_toplami korunur
    const effectiveTotal = calcTotal > 0 ? calcTotal : storedTotal
    const kdvDahil = new Decimal(effectiveTotal)
      .times(new Decimal(100 + dosyaKdv).div(100))
      .toDecimalPlaces(2)
      .toNumber()

    return {
      id: tfId,
      temin_firma_id: tfId,
      firma_id: f.master_firma_id || f.firma_id ? Number(f.master_firma_id || f.firma_id) : null,
      master_firma_id: f.master_firma_id || f.firma_id ? Number(f.master_firma_id || f.firma_id) : null,
      unvan: f.resolved_unvan || f.unvan || 'İstekli Firma',
      vergi_no: f.resolved_vergi_no || f.vergi_no || '',
      telefon: f.resolved_telefon || f.telefon || '',
      email: f.resolved_email || f.email || '',
      yetkili: f.resolved_yetkili || f.yetkili || f.ilgili_kisi || '',
      yasaklilik_durumu: f.yasaklilik_durumu || null,
      kazandi_mi: Number(f.kazandi_mi || f.kazanan_mi) === 1 ? 1 : 0,
      teklif_verdi_mi: effectiveTotal > 0 || Number(f.teklif_verdi_mi) === 1 ? 1 : 0,
      teklif_durumu:
        effectiveTotal > 0
          ? 'Teklif Verildi'
          : f.teklif_durumu || 'Davet Edildi',
      teklif_toplami: effectiveTotal,
      toplam_teklif_tutari: effectiveTotal,
      calculated_teklif: effectiveTotal,
      kdv_dahil_teklif_toplami: kdvDahil,
      kalem_teklif_sayisi: kalemTeklifSayisi
    }
  })

  // Kazanan firmayı belirle (Explicit -> Re'sen)
  let kazananFirma: CanonicalFirmaItem | null =
    firmalar.find(
      (f) =>
        dosya.firma_id &&
        (f.master_firma_id === Number(dosya.firma_id) ||
          f.temin_firma_id === Number(dosya.firma_id))
    ) ||
    firmalar.find((f) => f.kazandi_mi === 1) ||
    null

  let isResenWinner = false
  let resenReason = ''

  if (!kazananFirma && firmalar.length > 0) {
    try {
      const resen = await resolveResenWinner(dosyaId, executor, true)
      if (resen.winner) {
        kazananFirma =
          firmalar.find(
            (f) =>
              f.temin_firma_id === resen.winner!.temin_firma_id ||
              (resen.winner!.master_firma_id &&
                f.master_firma_id === resen.winner!.master_firma_id)
          ) || null
        if (kazananFirma) {
          kazananFirma.kazandi_mi = 1
        }
        isResenWinner = resen.isResen
        resenReason = resen.reason
      }
    } catch {
      // Fallback: en düşük teklif veren firmayı seç
      const withBids = firmalar.filter((f) => f.teklif_toplami > 0)
      if (withBids.length > 0) {
        kazananFirma = [...withBids].sort((a, b) => a.teklif_toplami - b.teklif_toplami)[0]
        isResenWinner = true
        resenReason = 'LOWEST_BID'
      } else if (firmalar.length === 1) {
        kazananFirma = firmalar[0]
        isResenWinner = true
        resenReason = 'SINGLE_FIRM'
      }
    }
  }

  const isLowestBasis =
    hesaplamaEsasi.toLowerCase().includes('en düşük') ||
    hesaplamaEsasi.toLowerCase().includes('en dusuk')

  const totalQuantityAllItems = rawItems.reduce((acc: number, it: any) => acc + (Number(it.miktar) || 1), 0)
  const storedDosyaYm = Number(dosya.yaklasik_maliyet) || 0

  // Kalemleri ve kalem fiyatlarını hesapla
  let computedYmSumDec = new Decimal(0)
  let computedWinnerSumDec = new Decimal(0)
  let computedWinnerKdvDec = new Decimal(0)

  const kalemler: CanonicalKalemItem[] = rawItems.map((k: any, idx: number) => {
    const kId = Number(k.id)
    const miktar = Number(k.miktar) > 0 ? Number(k.miktar) : 1
    const kdvOrani =
      k.kdv_orani !== undefined && k.kdv_orani !== null && Number.isFinite(Number(k.kdv_orani))
        ? Number(k.kdv_orani)
        : dosyaKdv

    const firmaFiyatlari: Record<number, number> = {}
    let minBid = Infinity
    let sumBidDec = new Decimal(0)
    let bidCount = 0

    for (const f of firmalar) {
      const p = bidsMap[`${kId}_${f.temin_firma_id}`] || 0
      if (p > 0) {
        firmaFiyatlari[f.temin_firma_id] = p
        if (p < minBid) minBid = p
        sumBidDec = sumBidDec.plus(p)
        bidCount++
      }
    }

    const avgBid = bidCount > 0 ? sumBidDec.div(bidCount).toDecimalPlaces(2).toNumber() : 0
    const lowestBid = minBid === Infinity ? 0 : minBid

    // Kazanan firmanın bu kaleme verdiği birim fiyat
    let winnerUnitBid =
      kazananFirma && bidsMap[`${kId}_${kazananFirma.temin_firma_id}`] > 0
        ? bidsMap[`${kId}_${kazananFirma.temin_firma_id}`]
        : 0

    // Eğer kalem bazlı teklif satırı girilmemiş ancak kazanan firmanın toplam teklifi veya dosyanın yaklaşık maliyeti mevcutsa:
    const itemStoredPrice = Number(
      k.birim_fiyat || k.tahmini_birim_fiyat || k.yaklasik_maliyet_birim || 0
    )

    let ymBirim = isLowestBasis ? lowestBid : avgBid
    if (ymBirim <= 0) {
      if (itemStoredPrice > 0) {
        ymBirim = itemStoredPrice
      } else if (rawItems.length === 1 && storedDosyaYm > 0) {
        ymBirim = new Decimal(storedDosyaYm).div(miktar).toDecimalPlaces(2).toNumber()
      } else if (totalQuantityAllItems > 0 && storedDosyaYm > 0) {
        ymBirim = new Decimal(storedDosyaYm).div(totalQuantityAllItems).toDecimalPlaces(2).toNumber()
      }
    }

    if (winnerUnitBid <= 0) {
      if (lowestBid > 0) {
        winnerUnitBid = lowestBid
      } else if (
        rawItems.length === 1 &&
        kazananFirma &&
        kazananFirma.teklif_toplami > 0
      ) {
        winnerUnitBid = new Decimal(kazananFirma.teklif_toplami)
          .div(miktar)
          .toDecimalPlaces(2)
          .toNumber()
      } else {
        winnerUnitBid = ymBirim
      }
    }

    const ymToplam = new Decimal(miktar).times(ymBirim).toDecimalPlaces(2).toNumber()
    const kazananKalemToplam = new Decimal(miktar)
      .times(winnerUnitBid)
      .toDecimalPlaces(2)
      .toNumber()
    const kdvTutari = new Decimal(kazananKalemToplam)
      .times(kdvOrani)
      .div(100)
      .toDecimalPlaces(2)
      .toNumber()
    const kdvDahilToplam = new Decimal(kazananKalemToplam)
      .plus(kdvTutari)
      .toDecimalPlaces(2)
      .toNumber()

    computedYmSumDec = computedYmSumDec.plus(ymToplam)
    computedWinnerSumDec = computedWinnerSumDec.plus(kazananKalemToplam)
    computedWinnerKdvDec = computedWinnerKdvDec.plus(kdvTutari)

    const kalemAdi = k.kalem_adi || k.malzeme_adi || `Kalem #${idx + 1}`
    const aciklama = k.aciklama || k.ozelligi || k.poz_tanimi || ''
    const birim = k.birim || k.olcu_birimi || 'Adet'

    return {
      ...k,
      id: kId,
      temin_dosya_id: dosyaId,
      sira_no: k.sira_no || idx + 1,
      kalem_adi: kalemAdi,
      malzeme_adi: kalemAdi,
      aciklama,
      ozelligi: aciklama,
      birim,
      birimi: birim,
      olcu_birimi: k.olcu_birimi || birim,
      miktar,
      kdv_orani: kdvOrani,
      birim_fiyat: winnerUnitBid,
      kazanan_birim_fiyat: winnerUnitBid,
      kazanan_kalem_toplam: kazananKalemToplam,
      yaklasik_maliyet_birim: ymBirim,
      yaklasik_maliyet_toplam: ymToplam,
      kdv_tutari: kdvTutari,
      kdv_dahil_toplam: kdvDahilToplam,
      firma_fiyatlari: firmaFiyatlari
    }
  })

  // Teklif satırlarını zenginleştir
  const itemMap = new Map<number, CanonicalKalemItem>()
  kalemler.forEach((k) => itemMap.set(k.id, k))
  const firmMap = new Map<number, CanonicalFirmaItem>()
  firmalar.forEach((f) => firmMap.set(f.temin_firma_id, f))

  const teklifler: CanonicalTeklifRow[] = []
  for (const row of dedupedBidRowsMap.values()) {
    const price = Number(row.birim_fiyat) || 0
    if (price <= 0) continue
    const kItem = itemMap.get(row.temin_kalem_id)
    const fItem = firmMap.get(row.temin_firma_id)
    if (!kItem || !fItem) continue
    const miktar = kItem.miktar || 1
    teklifler.push({
      id: row.id,
      temin_dosya_id: dosyaId,
      temin_kalem_id: row.temin_kalem_id,
      temin_firma_id: row.temin_firma_id,
      birim_fiyat: price,
      miktar,
      toplam_tutar: new Decimal(miktar).times(price).toDecimalPlaces(2).toNumber(),
      kalem_adi: kItem.kalem_adi,
      firma_unvan: fItem.unvan
    })
  }

  const computedWinnerTotal = computedWinnerSumDec.toDecimalPlaces(2).toNumber()
  const kazananTeklifToplami =
    kazananFirma && kazananFirma.teklif_toplami > 0
      ? kazananFirma.teklif_toplami
      : computedWinnerTotal > 0
        ? computedWinnerTotal
        : storedDosyaYm > 0 && kazananFirma
          ? storedDosyaYm
          : null

  const computedYmTotal = computedYmSumDec.toDecimalPlaces(2).toNumber()
  const toplamYaklasikMaliyet =
    isLowestBasis && kazananTeklifToplami !== null && kazananTeklifToplami > 0
      ? kazananTeklifToplami
      : computedYmTotal > 0
        ? computedYmTotal
        : storedDosyaYm

  if (
    isLowestBasis &&
    kazananTeklifToplami !== null &&
    kazananTeklifToplami > 0 &&
    storedDosyaYm !== kazananTeklifToplami
  ) {
    try {
      await executor.run(
        'UPDATE DATA_TeminDosyasi SET yaklasik_maliyet = ? WHERE id = ?',
        [kazananTeklifToplami, dosyaId]
      )
    } catch (_e) {
      /* noop */
    }
  }

  const kazananKdvTutari =
    kazananTeklifToplami !== null
      ? computedWinnerKdvDec.toNumber() > 0
        ? computedWinnerKdvDec.toDecimalPlaces(2).toNumber()
        : new Decimal(kazananTeklifToplami).times(dosyaKdv).div(100).toDecimalPlaces(2).toNumber()
      : null

  const kazananKdvDahilToplam =
    kazananTeklifToplami !== null && kazananKdvTutari !== null
      ? new Decimal(kazananTeklifToplami).plus(kazananKdvTutari).toDecimalPlaces(2).toNumber()
      : null

  if (kazananFirma && kazananTeklifToplami && kazananFirma.teklif_toplami <= 0) {
    kazananFirma.teklif_toplami = kazananTeklifToplami
    kazananFirma.toplam_teklif_tutari = kazananTeklifToplami
    kazananFirma.calculated_teklif = kazananTeklifToplami
    kazananFirma.kdv_dahil_teklif_toplami = kazananKdvDahilToplam || kazananTeklifToplami
  }

  return {
    dosyaId,
    dosya,
    isDogrudanTemin,
    hesaplamaEsasi,
    kdvOrani: dosyaKdv,
    toplamYaklasikMaliyet,
    kazananFirma,
    kazananTeklifToplami,
    kazananKdvTutari,
    kazananKdvDahilToplam,
    isResenWinner,
    resenReason,
    kalemler,
    firmalar,
    teklifler,
    bidsMap
  }
}

/**
 * Doğrudan Temin Fatura / Ödeme Emri yasal kesinti hesaplayıcısı (488 S.K. ‰ 9,48 Damga Vergisi & KDV Tevkifatı; İhale Karar Pulu uygulanmaz).
 */
export function calculateDogrudanTeminInvoiceFinancials(
  brutTutar: number,
  kdvOrani: number,
  tevkifatOrani: string = 'Yok',
  kararPuluUygula: boolean = false,
  damgaVergisiUygula: boolean = true
) {
  const kdvMultiplier = (100 + kdvOrani) / 100
  const matrah = brutTutar > 0 ? Number((brutTutar / kdvMultiplier).toFixed(2)) : 0
  const kdvTutari = Number((brutTutar - matrah).toFixed(2))

  let tevkifatKatsayisi = 0
  if (tevkifatOrani === '2/10') tevkifatKatsayisi = 0.2
  else if (tevkifatOrani === '3/10') tevkifatKatsayisi = 0.3
  else if (tevkifatOrani === '4/10') tevkifatKatsayisi = 0.4
  else if (tevkifatOrani === '5/10') tevkifatKatsayisi = 0.5
  else if (tevkifatOrani === '7/10') tevkifatKatsayisi = 0.7
  else if (tevkifatOrani === '9/10') tevkifatKatsayisi = 0.9
  else if (tevkifatOrani === 'Tam') tevkifatKatsayisi = 1.0

  const tevkifatTutari = Number((kdvTutari * tevkifatKatsayisi).toFixed(2))
  const damgaVergisi = damgaVergisiUygula ? Number((matrah * 0.00948).toFixed(2)) : 0
  const kararPulu = kararPuluUygula ? Number((matrah * 0.00569).toFixed(2)) : 0

  const toplamKesinti = Number((damgaVergisi + kararPulu + tevkifatTutari).toFixed(2))
  const netOdenecek = Number((brutTutar - toplamKesinti).toFixed(2))

  return {
    matrah,
    kdvTutari,
    tevkifatTutari,
    damgaVergisi,
    kararPulu,
    toplamKesinti,
    netOdenecek
  }
}
