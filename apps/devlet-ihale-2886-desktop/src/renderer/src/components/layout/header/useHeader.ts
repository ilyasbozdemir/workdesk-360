import { useState, useCallback, useEffect } from 'react'
import { useNavigate, NavigateFn } from '@tanstack/react-router'
import { useShallow } from 'zustand/react/shallow'
import { useTheme } from '../../providers/ThemeProvider'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useProcurementMode } from './hooks/useProcurementMode'
import { useWorkspaceSave } from './hooks/useWorkspaceSave'
import { useUpdaterStatus } from './hooks/useUpdaterStatus'
import { useVisibleMenuCount } from './hooks/useVisibleMenuCount'
import { ProcurementMode } from '../temin-selector/teminSelector.types'

export interface UseHeaderReturn {
  navigate: NavigateFn
  theme: string
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  activeDosyaId: number | null
  fileName: string | null
  isDirty: boolean
  institutionLogo: string | null
  logoLeft: string | null
  showAboutModal: boolean
  setShowAboutModal: React.Dispatch<React.SetStateAction<boolean>>
  showUpdateModal: boolean
  setShowUpdateModal: React.Dispatch<React.SetStateAction<boolean>>
  switchFeedback: string | null
  saveFeedback: string | null
  updateStatus: { status: string; version?: string } | null
  maxVisibleMenus: number
  procurementMode: ProcurementMode
  isDt: boolean
  handleModeChange: (mode: ProcurementMode) => void
  handleSaveAndSync: () => Promise<void>
  handleCloseWorkspace: () => Promise<void>
  handleClose: () => void
}

export function useHeader(): UseHeaderReturn {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const { activeDosyaId, fileName, isDirty } = useWorkspaceStore(
    useShallow((state) => ({
      activeDosyaId: state.activeDosyaId,
      fileName: state.fileName,
      isDirty: state.isDirty
    }))
  )

  const { institutionLogo, logoLeft } = useSettingsStore(
    useShallow((state) => ({
      institutionLogo: state.institutionLogo,
      logoLeft: state.logoLeft
    }))
  )

  const [showAboutModal, setShowAboutModal] = useState(false)

  const { procurementMode, handleModeChange, isDt, switchFeedback } = useProcurementMode()
  const { saveFeedback, handleSaveAndSync } = useWorkspaceSave()
  const { updateStatus, showUpdateModal, setShowUpdateModal } = useUpdaterStatus()
  const maxVisibleMenus = useVisibleMenuCount()

  const handleCloseWorkspace = useCallback(async (): Promise<void> => {
    window.dispatchEvent(new CustomEvent('workspace-close-request'))
  }, [])

  const handleClose = useCallback((): void => {
    window.electron?.ipcRenderer.send('window-close')
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveAndSync()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSaveAndSync])

  return {
    navigate,
    theme,
    setTheme,
    activeDosyaId,
    fileName,
    isDirty,
    institutionLogo,
    logoLeft,
    showAboutModal,
    setShowAboutModal,
    showUpdateModal,
    setShowUpdateModal,
    switchFeedback,
    saveFeedback,
    updateStatus,
    maxVisibleMenus,
    procurementMode,
    isDt,
    handleModeChange,
    handleSaveAndSync,
    handleCloseWorkspace,
    handleClose
  }
}
