import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../constants/routeConstants'
import { Kalem, useMalzemelerHooks } from './malzemeler.hooks'
import { DataViewMode } from '../../components/ui/ViewToggle'

export function useMalzemelerScreenLogic() {
  const navigate = useNavigate()
  const { kalemList, isLoading: isKalemLoading, deleteKalem } = useMalzemelerHooks()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Tümü') // Tümü, Mal, Hizmet, Personel, Hizmet, Diğer, Yapım
  const [viewMode, setViewMode] = useState<DataViewMode>('list')
  const [groupMode, setGroupMode] = useState<'none' | 'tasinir' | 'okas'>('none')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleEdit = (item: Kalem) => {
    navigate({
      to: APP_ROUTES.YENI_MALZEME,
      search: { id: item.id } as Record<string, unknown>
    })
  }

  const handleDelete = async (id: number, barkod_id: string, kalem_adi: string) => {
    try {
      const checkRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT COUNT(*) as sayi FROM DATA_TeminKalem WHERE barkod_id = ?`,
        [barkod_id]
      )
      if (checkRes.success && checkRes.data?.[0]?.sayi > 0) {
        const kullanimSayisi = checkRes.data[0].sayi
        alert(
          `"${kalem_adi}" kalemi silinemez!\n\n` +
            `Bu malzeme/hizmet, ${kullanimSayisi} doğrudan temin dosyasında (kalem olarak) kullanılmaktadır.\n\n` +
            `Silmek istiyorsanız önce ilgili temin dosyalarından bu kalemi kaldırmanız gerekmektedir.`
        )
        return
      }
    } catch {
      alert('Kullanım kontrolü yapılamadı. Lütfen tekrar deneyin.')
      return
    }

    if (confirm(`"${kalem_adi}" kaydını silmek istediğinize emin misiniz?`)) {
      try {
        await deleteKalem(id)
      } catch (error: any) {
        alert('Silinirken hata oluştu: ' + error.message)
      }
    }
  }

  const handleDeleteKalem = (item: Kalem) => {
    handleDelete(item.id, item.barkod_id, item.kalem_adi)
  }

  const filteredList = useMemo(() => {
    return kalemList.filter((m) => {
      const matchesSearch =
        m.kalem_adi.toLowerCase().includes(search.toLowerCase()) ||
        (m.tasinir_kodu || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.okas_kodu || '').toLowerCase().includes(search.toLowerCase()) ||
        m.barkod_id.toLowerCase().includes(search.toLowerCase())

      const matchesTab =
        activeTab === 'Tümü' ||
        m.tipi === activeTab ||
        (activeTab === 'Hizmet' && m.tipi?.startsWith('Hizmet'))

      return matchesSearch && matchesTab
    })
  }, [kalemList, search, activeTab])

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredList.map((x) => x.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('Lütfen silinecek kalemleri seçin.')
      return
    }

    if (!confirm(`Seçilen ${selectedIds.length} kalemi silmek istediğinize emin misiniz?`)) {
      return
    }

    let deletedCount = 0
    const inUseNames: string[] = []
    const failedNames: string[] = []

    for (const id of selectedIds) {
      const item = kalemList.find((x) => x.id === id)
      if (!item) continue

      try {
        const checkRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(*) as sayi FROM DATA_TeminKalem WHERE barkod_id = ?`,
          [item.barkod_id]
        )
        if (checkRes.success && checkRes.data?.[0]?.sayi > 0) {
          inUseNames.push(item.kalem_adi)
          continue
        }

        await deleteKalem(id)
        deletedCount++
      } catch (err: any) {
        failedNames.push(`${item.kalem_adi} (${err.message})`)
      }
    }

    let msg = ''
    if (deletedCount > 0) {
      msg += `${deletedCount} adet kalem başarıyla silindi.\n`
    }
    if (inUseNames.length > 0) {
      msg += `\n⚠️ Aşağıdaki ${inUseNames.length} kalem doğrudan temin dosyalarında kullanıldığı için SİLİNEMEDİ:\n`
      msg += inUseNames.map((n) => `- ${n}`).join('\n') + '\n'
    }
    if (failedNames.length > 0) {
      msg += `\n❌ Aşağıdaki ${failedNames.length} kalemi silerken hata oluştu:\n`
      msg += failedNames.map((n) => `- ${n}`).join('\n') + '\n'
    }

    alert(msg)
    setSelectedIds([])
  }

  const groupedItems = useMemo(() => {
    if (groupMode === 'none') {
      return { Tümü: filteredList }
    }

    const groups: Record<string, typeof filteredList> = {}

    filteredList.forEach((item) => {
      let key = 'Diğer / Kodsuz'
      if (groupMode === 'tasinir') {
        if (item.tasinir_kodu) {
          const parts = item.tasinir_kodu.split('.')
          if (parts.length >= 2) {
            key = `${parts[0]}.${parts[1]}`
          } else {
            key = parts[0]
          }
        } else {
          key = 'Taşınır Kodsuz'
        }
      } else if (groupMode === 'okas') {
        if (item.okas_kodu) {
          const cleanOkas = item.okas_kodu.replace(/[^0-9]/g, '')
          if (cleanOkas.length >= 2) {
            key = `${cleanOkas.substring(0, 2)}xx`
          } else if (cleanOkas.length > 0) {
            key = `${cleanOkas}x`
          } else {
            key = item.okas_kodu
          }
        } else {
          key = 'OKAS Kodsuz'
        }
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
    })

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const isAExtra = a.includes('Kodsuz') || a.includes('Diğer')
      const isBExtra = b.includes('Kodsuz') || b.includes('Diğer')
      if (isAExtra && !isBExtra) return 1
      if (!isAExtra && isBExtra) return -1
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
      })
    })

    const sortedGroups: Record<string, typeof filteredList> = {}
    sortedKeys.forEach((k) => {
      sortedGroups[k] = groups[k]
    })

    return sortedGroups
  }, [filteredList, groupMode])

  return {
    kalemList,
    isKalemLoading,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    groupMode,
    setGroupMode,
    selectedIds,
    setSelectedIds,
    handleToggleSelect,
    handleEdit,
    handleDeleteKalem,
    handleToggleSelectAll,
    handleDeleteSelected,
    filteredList,
    groupedItems
  }
}
