/**
 * winnerSyncService.ts
 * 
 * WorkDesk 360 / Temin 360 — Faz 1.2
 * Kazanan Firma Senkronizasyonu ve Veri Bütünlüğü Servisi
 *
 * Sorumluluklar:
 * 1. Kazanan firma seçimini ve seçim iptalini tek bir atomik db:transaction içinde yürütmek.
 * 2. TANIM_Firma.id (Master Firma) ile DATA_TeminFirma.id (Dosya Satır Kimliği) ayrımını kesin korumak.
 * 3. kazandi_mi (esas bayrak) ve kazanan_mi (geriye dönük uyumluluk bayrağı) sütunlarını senkronize tutmak.
 * 4. Seçilen DATA_TeminFirma.id değerinin ilgili dosyaya ait olduğunu doğrulamak.
 * 5. Eski dosyalardaki çelişkili veya çift kazanan kayıtlarını salt okunur olarak denetlemek.
 */

export interface WinnerSyncDbExecutor {
  query: (
    sql: string,
    params?: any[]
  ) => Promise<{ success: boolean; data?: any[]; error?: string }>
  transaction: (
    queries: { sql: string; params?: any[] }[]
  ) => Promise<{ success: boolean; changes?: number; error?: string }>
}

const defaultIpcExecutor: WinnerSyncDbExecutor = {
  query: async (sql, params) => {
    return window.electron.ipcRenderer.invoke('db:query', sql, params)
  },
  transaction: async (queries) => {
    return window.electron.ipcRenderer.invoke('db:transaction', queries)
  }
}

export interface SetWinnerParams {
  activeDosyaId: number
  /**
   * DATA_TeminFirma.id (Dosyadaki satır birincil anahtarı)
   * Kazanan firma seçimi kaldırılıyorsa null verilir.
   */
  teminFirmaId?: number | null
  /**
   * İsteğe bağlı TANIM_Firma.id (Master firma kimliği)
   */
  masterFirmaId?: number | null
}

export interface SetWinnerResult {
  success: boolean
  masterFirmaId: number | null
  teminFirmaId: number | null
  error?: string
}

/**
 * Bir temin dosyasının kazanan firmasını atomik olarak belirler veya kaldırır.
 */
export async function executeSetWinnerTransaction(
  params: SetWinnerParams,
  executor: WinnerSyncDbExecutor = defaultIpcExecutor
): Promise<SetWinnerResult> {
  const { activeDosyaId, teminFirmaId, masterFirmaId } = params

  if (!activeDosyaId || activeDosyaId <= 0) {
    return {
      success: false,
      masterFirmaId: null,
      teminFirmaId: null,
      error: 'Geçersiz temin dosyası kimliği (dosyaId).'
    }
  }

  const targetId = teminFirmaId ?? masterFirmaId ?? null

  // Kazanan firma seçimi kaldırılıyorsa
  if (targetId === null || targetId <= 0) {
    const queries: { sql: string; params: any[] }[] = [
      {
        sql: 'UPDATE DATA_TeminDosyasi SET firma_id = NULL WHERE id = ?',
        params: [activeDosyaId]
      },
      {
        sql: 'UPDATE DATA_TeminFirma SET kazandi_mi = 0, kazanan_mi = 0 WHERE temin_dosya_id = ?',
        params: [activeDosyaId]
      }
    ]

    try {
      const txRes = await executor.transaction(queries)
      if (!txRes?.success) {
        return {
          success: false,
          masterFirmaId: null,
          teminFirmaId: null,
          error: txRes?.error || 'Seçim kaldırma işleminde transaction hatası oluştu.'
        }
      }

      return {
        success: true,
        masterFirmaId: null,
        teminFirmaId: null
      }
    } catch (err) {
      return {
        success: false,
        masterFirmaId: null,
        teminFirmaId: null,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  }

  // 1. Dosyadaki DATA_TeminFirma kaydını güvenli şekilde doğrula
  // Önce satır PK'sı (id = targetId) olarak kontrol et
  let resolvedTeminFirmaId: number | null = null
  let resolvedMasterFirmaId: number | null = null

  const rowCheck = await executor.query(
    `SELECT id, firma_id 
     FROM DATA_TeminFirma 
     WHERE id = ? AND temin_dosya_id = ?`,
    [targetId, activeDosyaId]
  )

  if (rowCheck?.success && Array.isArray(rowCheck.data) && rowCheck.data.length > 0) {
    const row = rowCheck.data[0]
    resolvedTeminFirmaId = Number(row.id)
    resolvedMasterFirmaId = row.firma_id ? Number(row.firma_id) : resolvedTeminFirmaId
  } else {
    // Satır PK eşleşmediyse, master firma kimliği (firma_id = targetId) olarak kontrol et
    const masterCheck = await executor.query(
      `SELECT id, firma_id 
       FROM DATA_TeminFirma 
       WHERE firma_id = ? AND temin_dosya_id = ?`,
      [targetId, activeDosyaId]
    )

    if (masterCheck?.success && Array.isArray(masterCheck.data) && masterCheck.data.length > 0) {
      const row = masterCheck.data[0]
      resolvedTeminFirmaId = Number(row.id)
      resolvedMasterFirmaId = row.firma_id ? Number(row.firma_id) : resolvedTeminFirmaId
    }
  }

  if (resolvedTeminFirmaId === null) {
    return {
      success: false,
      masterFirmaId: null,
      teminFirmaId: null,
      error: `Seçilen firma (#${targetId}) bu temin dosyasına (#${activeDosyaId}) ait değil veya bulunamadı.`
    }
  }

  // 2. Atomik db:transaction güncellemesi
  const queries: { sql: string; params: any[] }[] = [
    {
      sql: 'UPDATE DATA_TeminDosyasi SET firma_id = ? WHERE id = ?',
      params: [resolvedMasterFirmaId, activeDosyaId]
    },
    {
      sql: `UPDATE DATA_TeminFirma 
            SET kazandi_mi = CASE WHEN id = ? THEN 1 ELSE 0 END,
                kazanan_mi = CASE WHEN id = ? THEN 1 ELSE 0 END
            WHERE temin_dosya_id = ?`,
      params: [resolvedTeminFirmaId, resolvedTeminFirmaId, activeDosyaId]
    }
  ]

  try {
    const txRes = await executor.transaction(queries)
    if (!txRes?.success) {
      return {
        success: false,
        masterFirmaId: null,
        teminFirmaId: null,
        error: txRes?.error || 'Veritabanı transaction hatası (Geri alındı/Rollback).'
      }
    }

    return {
      success: true,
      masterFirmaId: resolvedMasterFirmaId,
      teminFirmaId: resolvedTeminFirmaId
    }
  } catch (err) {
    return {
      success: false,
      masterFirmaId: null,
      teminFirmaId: null,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export type WinnerIssueType = 'NONE' | 'DOUBLE_WINNER' | 'CONFLICTING_FLAGS'

export interface WinnerAmbiguityReport {
  isAmbiguous: boolean
  issueType: WinnerIssueType
  kazandiCount: number
  kazananCount: number
  details?: string
}

/**
 * Bir dosyadaki firmaların kazanan bayraklarını salt okunur olarak inceler.
 * Veritabanını asla değiştirmez (No Side-Effect).
 */
export function inspectWinnerIntegrity(
  firms: { id: number; temin_dosya_id?: number; kazandi_mi?: number | string | null; kazanan_mi?: number | string | null }[]
): WinnerAmbiguityReport {
  let kazandiCount = 0
  let kazananCount = 0
  let bothCount = 0
  let onlyKazandiId: number | null = null
  let onlyKazananId: number | null = null

  for (const f of firms) {
    const k1 = Number(f.kazandi_mi) === 1
    const k2 = Number(f.kazanan_mi) === 1

    if (k1) kazandiCount++
    if (k2) kazananCount++

    if (k1 && k2) {
      bothCount++
    } else if (k1 && !k2) {
      onlyKazandiId = f.id
    } else if (!k1 && k2) {
      onlyKazananId = f.id
    }
  }

  if (kazandiCount > 1 || kazananCount > 1 || bothCount > 1) {
    return {
      isAmbiguous: true,
      issueType: 'DOUBLE_WINNER',
      kazandiCount,
      kazananCount,
      details: `Dosyada birden fazla firma kazanan işaretlenmiş (kazandi_mi: ${kazandiCount}, kazanan_mi: ${kazananCount}).`
    }
  }

  if (onlyKazandiId !== null && onlyKazananId !== null && onlyKazandiId !== onlyKazananId) {
    return {
      isAmbiguous: true,
      issueType: 'CONFLICTING_FLAGS',
      kazandiCount,
      kazananCount,
      details: `Farklı firmalarda kazandi_mi (#${onlyKazandiId}) ve kazanan_mi (#${onlyKazananId}) çelişkisi var.`
    }
  }

  return {
    isAmbiguous: false,
    issueType: 'NONE',
    kazandiCount,
    kazananCount
  }
}

export interface ResenWinnerResolution {
  winner: {
    temin_firma_id: number
    master_firma_id: number | null
    unvan: string
    vergi_no: string | null
    calculated_teklif: number
    yasaklilik_durumu: string | null
    kazandi_mi: number
  } | null
  reason: 'EXPLICIT' | 'SNAPSHOT_PROTECTED' | 'LOWEST_BID' | 'SINGLE_FIRM' | 'NONE'
  isResen: boolean
}

/**
 * Re'sen (Otomatik / Ex Officio) Kazanan Firma Çözümleme ve Koruma Servisi
 *
 * Sıralı Öncelik Kuralları:
 * 1. Explicit: DATA_TeminDosyasi.firma_id veya DATA_TeminFirma.kazandi_mi ile kullanıcı tarafından seçilen firma varsa KORUNUR (isResen: false).
 * 2. Snapshot & Islak Belge Koruması: DATA_TeminBelgeSnapshot içinde imzalı/kaydedilmiş tutanaklarda (piyasa araştırma, onay, sipariş, kabul) geçen firma varsa KORUNUR.
 * 3. En Düşük Teklif (Lowest Bid): Firmalara girilen teklifler varsa, en düşük geçerli teklifi veren istekli re'sen kazanan seçilir.
 * 4. Tek İstekli (Single Firm): Henüz teklif girilmemiş olsa bile dosyada tek bir istekli firma varsa re'sen kazanan seçilir.
 * 5. autoPersist=true olduğunda tespit edilen kazanan atomik olarak veritabanına yazılır (executeSetWinnerTransaction).
 */
export async function resolveResenWinner(
  activeDosyaId: number,
  executor: WinnerSyncDbExecutor = defaultIpcExecutor,
  autoPersist = true
): Promise<ResenWinnerResolution> {
  if (!activeDosyaId || activeDosyaId <= 0) {
    return { winner: null, reason: 'NONE', isResen: false }
  }

  // 1. Dosya bilgilerini çek
  const dosyaRes = await executor.query(
    `SELECT d.id, d.firma_id, d.sablon_tercihleri FROM DATA_TeminDosyasi d WHERE d.id = ?`,
    [activeDosyaId]
  )
  if (!dosyaRes?.success || !dosyaRes.data || dosyaRes.data.length === 0) {
    return { winner: null, reason: 'NONE', isResen: false }
  }
  const dosyaRow = dosyaRes.data[0]

  // 2. Dosyaya bağlı aktif firmaları çek
  const firmsRes = await executor.query(
    `SELECT 
       df.id as temin_firma_id,
       df.firma_id as master_firma_id,
       COALESCE(NULLIF(df.unvan, ''), NULLIF(f.unvan, ''), 'İstekli Firma') as unvan,
       COALESCE(NULLIF(df.vergi_no, ''), NULLIF(f.vergi_no, '')) as vergi_no,
       df.yasaklilik_durumu,
       df.kazandi_mi,
       df.kazanan_mi,
       df.teklif_toplami
     FROM DATA_TeminFirma df
     LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
     WHERE df.temin_dosya_id = ? 
       AND (COALESCE(df.aktif_mi, 1) = 1 OR df.aktif_mi = '1' OR df.aktif_mi = 'true')
     ORDER BY df.id ASC`,
    [activeDosyaId]
  )

  const firms = firmsRes?.success && Array.isArray(firmsRes.data) ? firmsRes.data : []
  if (firms.length === 0) {
    return { winner: null, reason: 'NONE', isResen: false }
  }

  // 3. Teklif toplamlarını hesapla (Mükerrer satırları MAX(id) ile tekilleştirerek en güncel birim fiyatı esas al)
  const bidsRes = await executor.query(
    `SELECT kt.temin_firma_id, SUM(kt.birim_fiyat * COALESCE(k.miktar, 1)) as calculated_total
     FROM DATA_TeminKalemTeklif kt
     JOIN DATA_TeminKalem k ON kt.temin_kalem_id = k.id
     WHERE kt.temin_dosya_id = ?
       AND kt.id IN (
         SELECT MAX(id)
         FROM DATA_TeminKalemTeklif
         WHERE temin_dosya_id = ?
         GROUP BY temin_kalem_id, temin_firma_id
       )
     GROUP BY kt.temin_firma_id`,
    [activeDosyaId, activeDosyaId]
  )
  const bidsMap = new Map<number, number>()
  if (bidsRes?.success && Array.isArray(bidsRes.data)) {
    bidsRes.data.forEach((r: any) => {
      bidsMap.set(Number(r.temin_firma_id), Number(r.calculated_total) || 0)
    })
  }

  const enhancedFirms = firms.map((f: any) => {
    const rawTotal = Number(f.teklif_toplami) || 0
    const calcTotal = bidsMap.get(Number(f.temin_firma_id)) || 0
    const effectiveTotal = calcTotal > 0 ? calcTotal : rawTotal
    return {
      ...f,
      calculated_teklif: effectiveTotal
    }
  })

  // 1. ÖNCELİK: Açıkça atanmış kazanan firma var mı? (Explicit Selection)
  let explicitWinner = enhancedFirms.find(
    (f: any) =>
      dosyaRow.firma_id &&
      (Number(f.master_firma_id) === Number(dosyaRow.firma_id) ||
        Number(f.temin_firma_id) === Number(dosyaRow.firma_id))
  )
  if (!explicitWinner) {
    explicitWinner = enhancedFirms.find(
      (f: any) =>
        Number(f.kazandi_mi) === 1 ||
        f.kazandi_mi === '1' ||
        Number(f.kazanan_mi) === 1 ||
        f.kazanan_mi === '1'
    )
  }

  if (explicitWinner) {
    return {
      winner: {
        temin_firma_id: Number(explicitWinner.temin_firma_id),
        master_firma_id: explicitWinner.master_firma_id ? Number(explicitWinner.master_firma_id) : null,
        unvan: explicitWinner.unvan,
        vergi_no: explicitWinner.vergi_no,
        calculated_teklif: explicitWinner.calculated_teklif,
        yasaklilik_durumu: explicitWinner.yasaklilik_durumu,
        kazandi_mi: 1
      },
      reason: 'EXPLICIT',
      isResen: false
    }
  }

  // 2. ÖNCELİK: Islak İmzalı / Kaydedilmiş Belge Snapshot Koruması (Snapshot Protected)
  try {
    const snapRes = await executor.query(
      `SELECT sablon_kodu, veri_json 
       FROM DATA_TeminBelgeSnapshot 
       WHERE dosya_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
       ORDER BY updated_at DESC`,
      [activeDosyaId]
    )
    if (snapRes?.success && Array.isArray(snapRes.data) && snapRes.data.length > 0) {
      for (const s of snapRes.data) {
        if (!s.veri_json) continue
        try {
          const parsed = typeof s.veri_json === 'string' ? JSON.parse(s.veri_json) : s.veri_json
          const targetFirmaId = parsed.kazananFirmaId || parsed.yukleniciFirmaId || parsed.firma_id || parsed.firmaId
          const targetUnvan = parsed.kazananFirmaUnvan || parsed.yukleniciFirma || parsed.kazananFirma || parsed.firmaAdi
          if (targetFirmaId || targetUnvan) {
            const matched = enhancedFirms.find((f: any) => {
              if (targetFirmaId && (Number(f.master_firma_id) === Number(targetFirmaId) || Number(f.temin_firma_id) === Number(targetFirmaId))) {
                return true
              }
              if (targetUnvan && String(f.unvan).trim().toLowerCase() === String(targetUnvan).trim().toLowerCase()) {
                return true
              }
              return false
            })
            if (matched) {
              if (autoPersist) {
                await executeSetWinnerTransaction(
                  {
                    activeDosyaId,
                    teminFirmaId: Number(matched.temin_firma_id),
                    masterFirmaId: matched.master_firma_id ? Number(matched.master_firma_id) : null
                  },
                  executor
                )
              }
              return {
                winner: {
                  temin_firma_id: Number(matched.temin_firma_id),
                  master_firma_id: matched.master_firma_id ? Number(matched.master_firma_id) : null,
                  unvan: matched.unvan,
                  vergi_no: matched.vergi_no,
                  calculated_teklif: matched.calculated_teklif,
                  yasaklilik_durumu: matched.yasaklilik_durumu,
                  kazandi_mi: 1
                },
                reason: 'SNAPSHOT_PROTECTED',
                isResen: true
              }
            }
          }
        } catch {
          // ignore parse error
        }
      }
    }
  } catch (err) {
    console.warn('Snapshot integrity check error:', err)
  }

  // 3. ÖNCELİK: Re'sen En Düşük Teklif Veren Firma (Lowest Valid Bid)
  const firmsWithValidBids = enhancedFirms.filter((f: any) => f.calculated_teklif > 0)
  if (firmsWithValidBids.length > 0) {
    firmsWithValidBids.sort((a: any, b: any) => a.calculated_teklif - b.calculated_teklif)
    const lowestFirm = firmsWithValidBids[0]
    if (autoPersist) {
      await executeSetWinnerTransaction(
        {
          activeDosyaId,
          teminFirmaId: Number(lowestFirm.temin_firma_id),
          masterFirmaId: lowestFirm.master_firma_id ? Number(lowestFirm.master_firma_id) : null
        },
        executor
      )
    }
    return {
      winner: {
        temin_firma_id: Number(lowestFirm.temin_firma_id),
        master_firma_id: lowestFirm.master_firma_id ? Number(lowestFirm.master_firma_id) : null,
        unvan: lowestFirm.unvan,
        vergi_no: lowestFirm.vergi_no,
        calculated_teklif: lowestFirm.calculated_teklif,
        yasaklilik_durumu: lowestFirm.yasaklilik_durumu,
        kazandi_mi: 1
      },
      reason: 'LOWEST_BID',
      isResen: true
    }
  }

  // 4. ÖNCELİK: Re'sen Tek İstekli Firma (Single Firm)
  if (enhancedFirms.length === 1) {
    const singleFirm = enhancedFirms[0]
    if (autoPersist) {
      await executeSetWinnerTransaction(
        {
          activeDosyaId,
          teminFirmaId: Number(singleFirm.temin_firma_id),
          masterFirmaId: singleFirm.master_firma_id ? Number(singleFirm.master_firma_id) : null
        },
        executor
      )
    }
    return {
      winner: {
        temin_firma_id: Number(singleFirm.temin_firma_id),
        master_firma_id: singleFirm.master_firma_id ? Number(singleFirm.master_firma_id) : null,
        unvan: singleFirm.unvan,
        vergi_no: singleFirm.vergi_no,
        calculated_teklif: singleFirm.calculated_teklif,
        yasaklilik_durumu: singleFirm.yasaklilik_durumu,
        kazandi_mi: 1
      },
      reason: 'SINGLE_FIRM',
      isResen: true
    }
  }

  return { winner: null, reason: 'NONE', isResen: false }
}
