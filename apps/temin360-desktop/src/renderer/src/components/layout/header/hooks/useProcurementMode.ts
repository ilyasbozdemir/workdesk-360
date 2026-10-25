import { useCallback } from 'react'
import { ProcurementMode } from '../../temin-selector/teminSelector.types'

export interface UseProcurementModeReturn {
  procurementMode: ProcurementMode
  handleModeChange: (mode: ProcurementMode) => void
  isDt: boolean
  switchFeedback: string | null
}

export function useProcurementMode(): UseProcurementModeReturn {
  const procurementMode: ProcurementMode = 'dogrudan_temin'
  const isDt = true
  const switchFeedback = null

  const handleModeChange = useCallback((): void => {
    // Temin 360 uygulamasında süreç rejimi sabittir: Doğrudan Temin (4734 Sayılı Kanun Md. 22)
  }, [])

  return {
    procurementMode,
    handleModeChange,
    isDt,
    switchFeedback
  }
}
