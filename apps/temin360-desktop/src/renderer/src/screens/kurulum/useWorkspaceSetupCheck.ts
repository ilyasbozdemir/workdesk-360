import { useState, useEffect, useCallback } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'

export interface WorkspaceSetupCheckResult {
  needsSetup: boolean
  isModalOpen: boolean
  openSetupModal: () => void
  closeSetupModal: () => void
  recheckSetup: () => Promise<boolean>
}

export function useWorkspaceSetupCheck(): WorkspaceSetupCheckResult {
  const { activeFilePath } = useWorkspaceStore()
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const checkSetup = useCallback(async (): Promise<boolean> => {
    if (!activeFilePath || typeof window === 'undefined' || !window.electron?.ipcRenderer) {
      setNeedsSetup(false)
      return false
    }

    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
          (SELECT COUNT(*) FROM TANIM_Birim) as birimCount,
          (SELECT COUNT(*) FROM TANIM_Personel) as personelCount,
          (SELECT kurum_adi FROM TANIM_Kurum LIMIT 1) as kurumAdi`
      )

      if (res?.success && res.data?.[0]) {
        const row = res.data[0]
        const birimCount = Number(row?.birimCount ?? 0)
        const personelCount = Number(row?.personelCount ?? 0)
        const kurumAdi = String(row?.kurumAdi || '').trim()
        const isBareKurum = !kurumAdi || kurumAdi === 'Yeni Kurum' || kurumAdi === 'Bilinmeyen Kurum'

        const isUnconfigured = birimCount === 0 || personelCount === 0 || isBareKurum
        setNeedsSetup(isUnconfigured)

        // Eğer henüz kurulum yapılmamışsa ve bu oturumda kapatılmamışsa modalı otomatik aç
        const dismissKey = `setup_dismissed_${activeFilePath}`
        const isDismissed = sessionStorage.getItem(dismissKey) === 'true'

        if (isUnconfigured && !isDismissed) {
          setIsModalOpen(true)
        }

        return isUnconfigured
      }
    } catch (err) {
      console.warn('[useWorkspaceSetupCheck] Kurulum kontrolü yapılamadı:', err)
    }

    setNeedsSetup(false)
    return false
  }, [activeFilePath])

  useEffect(() => {
    checkSetup()
  }, [checkSetup])

  const openSetupModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeSetupModal = useCallback(() => {
    if (activeFilePath) {
      sessionStorage.setItem(`setup_dismissed_${activeFilePath}`, 'true')
    }
    setIsModalOpen(false)
  }, [activeFilePath])

  return {
    needsSetup,
    isModalOpen,
    openSetupModal,
    closeSetupModal,
    recheckSetup: checkSetup
  }
}
