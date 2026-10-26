import { useCallback } from 'react'
import { ProcurementMode } from '../../temin-selector/teminSelector.types'

export interface UseProcurementModeReturn {
  procurementMode: ProcurementMode
  handleModeChange: (mode: ProcurementMode) => void
  isDt: boolean
  switchFeedback: string | null
}

export function useProcurementMode(): UseProcurementModeReturn {
  const procurementMode: ProcurementMode = 'ihale'
  const isDt = false
  const switchFeedback = null

  const handleModeChange = useCallback((): void => {
    // İhale 360 uygulamasında rejim sabittir: 4734 Sayılı Kanun İhale Rejimi (Md. 19/21)
  }, [])

  return {
    procurementMode,
    handleModeChange,
    isDt,
    switchFeedback
  }
}
