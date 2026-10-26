import { useCallback } from 'react'
import { ProcurementMode } from '../../temin-selector/teminSelector.types'

export interface UseProcurementModeReturn {
  procurementMode: ProcurementMode
  handleModeChange: (mode: ProcurementMode) => void
  isDt: boolean
  switchFeedback: string | null
}

export function useProcurementMode(): UseProcurementModeReturn {
  const procurementMode: ProcurementMode = 'devlet_ihale_2886'
  const isDt = false
  const switchFeedback = null

  const handleModeChange = useCallback((): void => {
    // Devlet İhale 2886 uygulamasında rejim sabittir: 2886 Sayılı Devlet İhale Kanunu
  }, [])

  return {
    procurementMode,
    handleModeChange,
    isDt,
    switchFeedback
  }
}
