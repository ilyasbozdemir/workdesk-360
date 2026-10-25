import { useState, useMemo, useCallback } from 'react'
import { type ModulPaketi, type ModulKategoriFiltresi } from '../modulMagazasi.types'
import { RESMI_MODUL_PAKETLERI } from '../data/moduller.data'
import { useModuleStore } from '@renderer/store/moduleStore'

export function useModulMagazasiLogic() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKategori, setActiveKategori] = useState<ModulKategoriFiltresi>('tum')
  const [activeDetailModul, setActiveDetailModul] = useState<ModulPaketi | null>(null)

  // Global store
  const {
    installedIds,
    isInstalled,
    isTrashed,
    getRemainingTrashDays,
    installModule,
    trashModule,
    restoreModule,
    permanentlyDeleteModule,
    trashedModules
  } = useModuleStore()

  // Kurulum animasyonu durumu
  const [installingId, setInstallingId] = useState<string | null>(null)

  // Kaldırma onay modalı adayı
  const [uninstallCandidate, setUninstallCandidate] = useState<ModulPaketi | null>(null)

  const handleStartInstall = useCallback(
    (id: string) => {
      setInstallingId(id)
      setTimeout(() => {
        installModule(id)
        setInstallingId(null)
      }, 1000)
    },
    [installModule]
  )

  const handleRestore = useCallback(
    (id: string) => {
      restoreModule(id)
    },
    [restoreModule]
  )

  const handlePromptUninstall = useCallback((modul: ModulPaketi) => {
    setUninstallCandidate(modul)
  }, [])

  const handleConfirmTrash = useCallback(
    (retentionDays: number) => {
      if (uninstallCandidate) {
        trashModule(uninstallCandidate.id, retentionDays)
        setUninstallCandidate(null)
      }
    },
    [uninstallCandidate, trashModule]
  )

  const handleConfirmPermanent = useCallback(() => {
    if (uninstallCandidate) {
      permanentlyDeleteModule(uninstallCandidate.id)
      setUninstallCandidate(null)
    }
  }, [uninstallCandidate, permanentlyDeleteModule])

  const handleCloseUninstallModal = useCallback(() => {
    setUninstallCandidate(null)
  }, [])

  const filteredModuller = useMemo(() => {
    return RESMI_MODUL_PAKETLERI.filter((modul) => {
      // Çöp kutusu veya Kurulu filtresi
      if (activeKategori === 'cop_kutusu') {
        if (!isTrashed(modul.id)) return false
      } else if (activeKategori === 'kurulu') {
        if (!installedIds.includes(modul.id)) return false
      } else if (activeKategori === 'tip_modul') {
        if (modul.paketTipi !== 'modul') return false
      } else if (activeKategori === 'tip_extension') {
        if (modul.paketTipi !== 'extension') return false
      } else if (activeKategori === 'tip_utils') {
        if (modul.paketTipi !== 'utils') return false
      } else if (activeKategori !== 'tum') {
        if (modul.kategori !== activeKategori) return false
      }

      // Arama filtresi
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const inBaslik = modul.baslik.toLowerCase().includes(query)
      const inKod = modul.kod.toLowerCase().includes(query)
      const inMevzuat = modul.mevzuat.toLowerCase().includes(query)
      const inAciklama = modul.kisaAciklama.toLowerCase().includes(query)
      const inEtiket = modul.etiketler.some((e) => e.toLowerCase().includes(query))
      const inBelge = modul.belgeler.some((b) => b.ad.toLowerCase().includes(query))

      return inBaslik || inKod || inMevzuat || inAciklama || inEtiket || inBelge
    })
  }, [activeKategori, searchQuery, installedIds, isTrashed])

  const stats = useMemo(() => {
    const installedCount = RESMI_MODUL_PAKETLERI.filter((m) => installedIds.includes(m.id)).length
    const trashedCount = RESMI_MODUL_PAKETLERI.filter((m) => isTrashed(m.id)).length
    return {
      total: RESMI_MODUL_PAKETLERI.length,
      installed: installedCount,
      trashed: trashedCount,
      available: RESMI_MODUL_PAKETLERI.length - installedCount - trashedCount,
      totalTemplates: RESMI_MODUL_PAKETLERI.reduce((sum, m) => sum + m.belgeler.length, 0)
    }
  }, [installedIds, isTrashed])

  return {
    searchQuery,
    setSearchQuery,
    activeKategori,
    setActiveKategori,
    activeDetailModul,
    setActiveDetailModul,
    installedIds,
    isInstalled,
    isTrashed,
    getRemainingTrashDays,
    installingId,
    handleStartInstall,
    handleRestore,
    uninstallCandidate,
    handlePromptUninstall,
    handleConfirmTrash,
    handleConfirmPermanent,
    handleCloseUninstallModal,
    filteredModuller,
    stats,
    trashedModules
  }
}
