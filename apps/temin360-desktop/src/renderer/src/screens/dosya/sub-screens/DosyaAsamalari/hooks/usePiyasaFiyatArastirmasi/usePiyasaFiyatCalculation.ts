import { useCallback, useMemo } from 'react'
import Decimal from 'decimal.js'
import { BiddingFirm, BiddingKalem } from './types'
import { emitAppEvent } from '../../../../../../utils/appEvents'
import { documentPreloadService } from '../../../../../../services/documentPreloadService'
import { executeSetWinnerTransaction } from '../../../../../../services/dossier/winnerSyncService'

export function calculateEstimatedCost(
  items: BiddingKalem[],
  isLowestBasis: boolean,
  getLowestBidInfo: (kalemId: number) => { price: number; firmaId: number | null },
  getAverageBid: (kalemId: number) => number,
  lowestBidTotal?: number | null
): number {
  // Eğer en düşük fiyat esası geçerliyse ve en düşük toplam teklif veren geçerli bir istekli varsa,
  // doğrudan o isteklinin toplam teklifini esas al.
  if (isLowestBasis && lowestBidTotal && lowestBidTotal > 0) {
    return new Decimal(lowestBidTotal).toDecimalPlaces(2).toNumber()
  }

  let totalDecimal = new Decimal(0)
  items.forEach((item) => {
    const price = isLowestBasis ? getLowestBidInfo(item.id).price : getAverageBid(item.id)
    const m = Number(item.miktar) > 0 ? Number(item.miktar) : 1
    const miktar = new Decimal(m)
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
        const price =
          bids[`${kalemId}_${firma.id}`] ??
          (firma.firma_id ? bids[`${kalemId}_${firma.firma_id}`] : undefined) ??
          0
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
        const price =
          bids[`${kalemId}_${firma.id}`] ??
          (firma.firma_id ? bids[`${kalemId}_${firma.firma_id}`] : undefined) ??
          0
        if (price > 0) {
          sumDecimal = sumDecimal.plus(price)
          count++
        }
      })
      return count > 0 ? sumDecimal.div(count).toDecimalPlaces(2).toNumber() : 0
    },
    [invitedFirms, bids]
  )

  const lowestBidFirmTotal = useMemo(() => {
    let minTotal = Infinity
    invitedFirms.forEach((firma) => {
      if (firma.teklif_toplami && firma.teklif_toplami > 0 && firma.teklif_toplami < minTotal) {
        minTotal = firma.teklif_toplami
      }
    })
    return minTotal === Infinity ? null : minTotal
  }, [invitedFirms])

  const getEstimatedCostTotal = useCallback((): number => {
    const isLowestBasis =
      hesaplamaEsasi?.toLowerCase().includes('en düşük') ||
      hesaplamaEsasi?.toLowerCase().includes('en dusuk')

    return calculateEstimatedCost(
      items,
      isLowestBasis,
      getLowestBidInfo,
      getAverageBid,
      lowestBidFirmTotal
    )
  }, [items, getAverageBid, getLowestBidInfo, hesaplamaEsasi, lowestBidFirmTotal])

  const handleSetHesaplamaEsasi = useCallback(
    async (newEsas: string): Promise<void> => {
      setHesaplamaEsasiState(newEsas)
      if (!activeDosyaId) return
      try {
        const isLowestBasis =
          newEsas?.toLowerCase().includes('en düşük') || newEsas?.toLowerCase().includes('en dusuk')
        const total = calculateEstimatedCost(
          items,
          isLowestBasis,
          getLowestBidInfo,
          getAverageBid,
          lowestBidFirmTotal
        )

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
    [activeDosyaId, items, getLowestBidInfo, getAverageBid, setHesaplamaEsasiState, lowestBidFirmTotal]
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
        const result = await executeSetWinnerTransaction({
          activeDosyaId,
          teminFirmaId: targetIdentifier
        })

        if (!result.success) {
          console.error('Kazanan firma güncellenemedi:', result.error)
          return
        }

        setManualWinnerFirmaId(result.masterFirmaId)
        if (result.masterFirmaId !== null) {
          setSetLowestFirmAsWinner(false)
        }

        // Kazanan firmanın teklif tutarı varsa ve En Düşük Fiyat Esası seçiliyse (veya doğrudan kazanan belirlendiğinde)
        // dosyanın yaklaşık maliyetini kazanan firmanın toplam teklifine senkronize et
        if (targetIdentifier) {
          const winnerFirma = invitedFirms.find(
            (f) => f.id === targetIdentifier || f.firma_id === targetIdentifier
          )
          const isLowestBasis =
            hesaplamaEsasi?.toLowerCase().includes('en düşük') ||
            hesaplamaEsasi?.toLowerCase().includes('en dusuk')

          if (winnerFirma && winnerFirma.teklif_toplami && winnerFirma.teklif_toplami > 0) {
            const winnerTotal = winnerFirma.teklif_toplami
            if (isLowestBasis) {
              await window.electron.ipcRenderer.invoke(
                'db:run',
                'UPDATE DATA_TeminDosyasi SET yaklasik_maliyet = ? WHERE id = ?',
                [winnerTotal, activeDosyaId]
              )
            }
          }
        }

        documentPreloadService.invalidateCache(activeDosyaId)
        emitAppEvent('dossier:updated', { dosyaId: activeDosyaId })
        emitAppEvent('bids:changed', { dosyaId: activeDosyaId })
      } catch (err) {
        console.error('Error setting winner firma:', err)
      }
    },
    [activeDosyaId, setManualWinnerFirmaId, setSetLowestFirmAsWinner, invitedFirms, hesaplamaEsasi]
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
