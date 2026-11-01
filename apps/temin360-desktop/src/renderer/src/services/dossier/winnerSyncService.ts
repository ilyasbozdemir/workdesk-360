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