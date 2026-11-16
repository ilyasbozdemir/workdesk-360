import { useState, useEffect, useCallback } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import {
  syncAndFetchKurulumTakip,
  dismissKurulumInDatabase,
  type KurulumTakipItem
} from './kurulumTakipService'

export interface WorkspaceSetupCheckResult {
  needsSetup: boolean
  isModalOpen: boolean
  openSetupModal: () => void
  closeSetupModal: () => void
  recheckSetup: () => Promise<boolean>
  takipItems: KurulumTakipItem[]
}

export function useWorkspaceSetupCheck(): WorkspaceSetupCheckResult {
  const { activeFilePath } = useWorkspaceStore()
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [takipItems, setTakipItems] = useState<KurulumTakipItem[]>([])

  const checkSetup = useCallback(async (): Promise<boolean> => {
    if (!activeFilePath || typeof window === 'undefined' || !window.electron?.ipcRenderer) {
      setNeedsSetup(false)
      setIsModalOpen(false)
      return false
    }

    try {
      const ipc = window.electron.ipcRenderer

      // 1. Veritabanındaki settings tablosundan kurulum durumunu sorgula
      const settingsRes = await ipc.invoke(
        'db:query',
        `SELECT key, value FROM settings WHERE key IN ('is_initial_setup_completed', 'setup_dismissed', 'is_new_workspace')`
      )
      const settingsMap: Record<string, string> = {}
      if (settingsRes?.success && Array.isArray(settingsRes.data)) {
        for (const row of settingsRes.data) {
          settingsMap[row.key] = row.value
        }
      }

      const isCompleted = settingsMap['is_initial_setup_completed'] === 'true'
      const isDismissed = settingsMap['setup_dismissed'] === 'true'
      const isNewWorkspace = settingsMap['is_new_workspace'] === 'true'

      // SessionStorage kontrolü (yerel oturum)
      const sessionDismissed = sessionStorage.getItem(`setup_dismissed_${activeFilePath}`) === 'true'

      // Eğer kullanıcı kurulumu tamamladıysa veya ertelediyse (veritabanı ya da session bazlı):
      // FARKLI BİR BİLGİSAYARDA DA ASLA OTOMATİK KURULUM POPUPI AÇILMAZ!
      if (isCompleted || isDismissed || sessionDismissed) {
        setNeedsSetup(false)
        setIsModalOpen(false)
        return false
      }

      // 2. Veritabanında mevcut veri var mı?
      const dataRes = await ipc.invoke(
        'db:query',
        `SELECT 
          (SELECT COUNT(*) FROM DATA_TeminDosyasi) as dosyaCount,
          (SELECT COUNT(*) FROM TANIM_Birim) as birimCount,
          (SELECT COUNT(*) FROM TANIM_Personel) as personelCount,
          (SELECT kurum_adi FROM TANIM_Kurum LIMIT 1) as kurumAdi`
      )

      if (dataRes?.success && dataRes.data?.[0]) {
        const row = dataRes.data[0]
        const dosyaCount = Number(row?.dosyaCount ?? 0)
        const birimCount = Number(row?.birimCount ?? 0)
        const personelCount = Number(row?.personelCount ?? 0)
        const kurumAdi = String(row?.kurumAdi || '').trim()
        const isBareKurum = !kurumAdi || kurumAdi === 'Yeni Kurum' || kurumAdi === 'Bilinmeyen Kurum'

        // Eğer dosyada önceden işlenmiş temin dosyası, birimler veya personeller varsa
        // bu dosya sıfır bir veritabanı değildir; başka bir bilgisayardan getirilmiş aktif bir veritabanıdır.
        const hasExistingData =
          dosyaCount > 0 || (!isNewWorkspace && (birimCount > 0 || personelCount > 0 || !isBareKurum))

        if (hasExistingData) {
          // Farklı bilgisayarda tekrar sorulmaması için veritabanına kurulumun tamamlandığını kaydet
          await ipc.invoke('db:save-settings', {
            is_new_workspace: 'false',
            is_initial_setup_completed: 'true',
            setup_dismissed: 'true'
          })
          setNeedsSetup(false)
          setIsModalOpen(false)
          return false
        }

        // Yalnızca açıkça sıfırdan oluşturulmuş ve henüz kurulmamış veritabanında kurulum gereklidir
        const isUnconfigured =
          isNewWorkspace && (birimCount === 0 || personelCount === 0 || isBareKurum)
        setNeedsSetup(isUnconfigured)
        setIsModalOpen(isUnconfigured)

        return isUnconfigured
      }
    } catch (err) {
      console.warn('[useWorkspaceSetupCheck] Kurulum kontrolü yapılamadı:', err)
    }

    setNeedsSetup(false)
    setIsModalOpen(false)
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
    // Veritabanına kalıcı olarak kaydet ki farklı bir bilgisayara dosya taşındığında da hatırlasın
    dismissKurulumInDatabase().catch(() => {})
    setIsModalOpen(false)
  }, [activeFilePath])

  return {
    needsSetup,
    isModalOpen,
    openSetupModal,
    closeSetupModal,
    recheckSetup: checkSetup,
    takipItems
  }
}
