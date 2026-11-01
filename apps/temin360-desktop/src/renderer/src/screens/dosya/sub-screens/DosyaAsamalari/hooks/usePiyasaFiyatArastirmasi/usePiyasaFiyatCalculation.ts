import { useCallback, useMemo } from 'react'
import Decimal from 'decimal.js'
import { BiddingFirm, BiddingKalem } from './types'
import { emitAppEvent } from '../../../../../../utils/appEvents'
import { documentPreloadService } from '../../../../../../services/documentPreloadService'

export function calculateEstimatedCost(
  items: BiddingKalem[],
  isLowestBasis: boolean,
  getLowestBidInfo: (kalemId: number) => { price: number; firmaId: number | null },
  getAverageBid: (kalemId: number) => number
): number {
  let totalDecimal = new Decimal(0)
  items.forEach((item) => {
    const price = isLowestBasis ? getLowestBidInfo(item.id).price : getAverageBid(item.id)
    const miktar = new Decimal(item.miktar || 0)
    totalDecimal = totalDecimal.plus(miktar.times(price))
  })
  return totalDecimal.toDecimalPlaces(2).toNumber()
}

export function usePiyasaFiyatCalculation(
  activeDosyaId: number | null,
  invitedFirms: BiddingFirm[],
  items: BiddingKalem[],
  bids: Record<string, number>,
  hesaplamaEsasi: string,
  setHesaplamaEsasiState: (val: string) => void,
  setManualWinnerFirmaId: (val: number | null) => void,
  setSetLowestFirmAsWinner: (val: boolean) => void
) {
  const getLowestBidInfo = useCallback(
    (kalemId: number): { price: number; firmaId: number | null } => {
      let minPrice = Infinity
      let minFirmaId: number | null = null

      invitedFirms.forEach((firma) => {
        const price = bids[`${kalemId}_${firma.id}`]
        if (price > 0 && price < minPrice) {
          minPrice = price
          minFirmaId = firma.id
        }
      })

      return {
        price: minPrice === Infinity ? 0 : minPrice,
        firmaId: minFirmaId
      }
    },
    [invitedFirms, bids]
  )

  const getAverageBid = useCallback(
    (kalemId: number): number => {
      let sumDecimal = new Decimal(0)
      let count = 0
      invitedFirms.forEach((firma) => {
        const price = bids[`${kalemId}_${firma.id}`]
        if (price > 0) {
          sumDecimal = sumDecimal.plus(price)
          count++
        }
      })
      return count > 0 ? sumDecimal.div(count).toDecimalPlaces(2).toNumber() : 0
    },
    [invitedFirms, bids]
  )

  const getEstimatedCostTotal = useCallback((): number => {
    const isLowestBasis =
      hesaplamaEsasi?.toLowerCase().includes('en düşük') ||
      hesaplamaEsasi?.toLowerCase().includes('en dusuk')

    return calculateEstimatedCost(items, isLowestBasis, getLowestBidInfo, getAverageBid)
  }, [items, getAverageBid, getLowestBidInfo, hesaplamaEsasi])

  const handleSetHesaplamaEsasi = useCallback(
    async (newEsas: string): Promise<void> => {
      setHesaplamaEsasiState(newEsas)
      if (!activeDosyaId) return
      try {
        const isLowestBasis =
          newEsas?.toLowerCase().includes('en düşük') || newEsas?.toLowerCase().includes('en dusuk')
        const total = calculateEstimatedCost(items, isLowestBasis, getLowestBidInfo, getAverageBid)

        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET hesaplama_esasi = ?, yaklasik_maliyet = CASE WHEN ? > 0 THEN ? ELSE yaklasik_maliyet END WHERE id = ?',
          [newEsas, total, total, activeDosyaId]
        )
        emitAppEvent('dossier:updated', { dosyaId: activeDosyaId })
      } catch (err) {
        console.error('Error updating hesaplama esasi:', err)
      }
    },
    [activeDosyaId, items, getLowestBidInfo, getAverageBid, setHesaplamaEsasiState]
  )

  const lowestTotalFirmaId = useMemo(() => {
    let minTotal = Infinity
    let minId: number | null = null
    invitedFirms.forEach((firma) => {
      if (firma.teklif_toplami && firma.teklif_toplami > 0 && firma.teklif_toplami < minTotal) {
        minTotal = firma.teklif_toplami
        minId = firma.id
      }
    })
    return minId
  }, [invitedFirms])

  const handleSetWinnerFirma = useCallback(
    async (targetIdentifier: number | null): Promise<void> => {
      if (!activeDosyaId) return
      try {
        let resolvedMasterFirmaId: number | null = null
        let resolvedTeminFirmaId: number | null = null

        if (targetIdentifier !== null && targetIdentifier > 0) {
          // TANIM_Firma (master) ile DATA_TeminFirma (satır) ID'sini veritabanından kesinleştir
          const checkRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT id, firma_id FROM DATA_TeminFirma 
             WHERE temin_dosya_id = ? AND aktif_mi = 1 AND (id = ? OR firma_id = ?) 
             LIMIT 1`,
            [activeDosyaId, targetIdentifier, targetIdentifier]
          )

          if (checkRes?.success && Array.isArray(checkRes.data) && checkRes.data.length > 0) {
            const row = checkRes.data[0]
            resolvedTeminFirmaId = Number(row.id)
            resolvedMasterFirmaId = row.firma_id ? Number(row.firma_id) : resolvedTeminFirmaId
          } else {
            resolvedMasterFirmaId = targetIdentifier
            resolvedTeminFirmaId = targetIdentifier
          }
        }

        // Tek bir atomik transaction ile dosya ve firma bayraklarını güncelle
        const queries: { sql: string; params?: any[] }[] = []

        // 1. DATA_TeminDosyasi güncellemesi (yalnızca firma_id güncellenir, yaklasik_maliyet'e dokunulmaz!)
        queries.push({
          sql: 'UPDATE DATA_TeminDosyasi SET firma_id = ? WHERE id = ?',
          params: [resolvedMasterFirmaId, activeDosyaId]
        })

        // 2. DATA_TeminFirma güncellemesi: kazandi_mi VE kazanan_mi birlikte senkronize güncellenir
        if (resolvedTeminFirmaId !== null) {
          queries.push({
            sql: `UPDATE DATA_TeminFirma 
                  SET kazandi_mi = CASE WHEN id = ? THEN 1 ELSE 0 END,
                      kazanan_mi = CASE WHEN id = ? THEN 1 ELSE 0 END
                  WHERE temin_dosya_id = ?`,
            params: [resolvedTeminFirmaId, resolvedTeminFirmaId, activeDosyaId]
          })
        } else {
          queries.push({
            sql: 'UPDATE DATA_TeminFirma SET kazandi_mi = 0, kazanan_mi = 0 WHERE temin_dosya_id = ?',
            params: [activeDosyaId]
          })
        }

        const txRes = await window.electron.ipcRenderer.invoke('db:transaction', queries)
        if (!txRes?.success) {
          throw new Error(txRes?.error || 'Kazanan firma güncelleme transaction hatası')
        }

        setManualWinnerFirmaId(resolvedMasterFirmaId)
        if (resolvedMasterFirmaId !== null) {
          setSetLowestFirmAsWinner(false)
        }

        documentPreloadService.invalidateCache(activeDosyaId)
        emitAppEvent('dossier:updated', { dosyaId: activeDosyaId })
        emitAppEvent('bids:changed', { dosyaId: activeDosyaId })
      } catch (err) {
        console.error('Error setting winner firma:', err)
      }
    },
    [activeDosyaId, setManualWinnerFirmaId, setSetLowestFirmAsWinner]
  )

  return {
    getLowestBidInfo,
    getAverageBid,
    getEstimatedCostTotal,
    handleSetHesaplamaEsasi,
    lowestTotalFirmaId,
    handleSetWinnerFirma
  }
}
