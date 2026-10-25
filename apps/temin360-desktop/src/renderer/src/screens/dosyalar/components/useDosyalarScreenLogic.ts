import React, { useEffect, useState, useMemo } from 'react'
import { TeminDosyasi, useDosyalarHooks } from '../dosyalar.hooks'
import { useProjeHooks } from '../../../hooks/useProjeHooks'
import { useTabStore } from '../../../store/tabStore'
import { useRouterState } from '@tanstack/react-router'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { logActivity } from '../../../utils/logger'
import { formatDosyaNo } from '../../../utils/formatDosyaNo'

export function useDosyalarScreenLogic() {
  const {
    dosyalar,
    isLoadingDosyalar,
    deleteDosya,
    hardDeleteDosya,
    updateDosya,
    bulkDeleteDosyalar,
    bulkHardDeleteDosyalar
  } = useDosyalarHooks()
  const { projeler } = useProjeHooks()
  const { activeDosyaId, setActiveDosyaId, activeMeta, activeFilePath } = useWorkspaceStore()
  const { updateTabLabel } = useTabStore()
  const routerState = useRouterState()

  const searchParams = new URLSearchParams(window.location.search)
  const isWindowMode = searchParams.get('mode') === 'window'

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')
  const [filterTur, setFilterTur] = useState<string>('hepsi')
  const [filterYil, setFilterYil] = useState<string>('hepsi')
  const [filterStatus, setFilterStatus] = useState<string>('hepsi')
  const [filterProjeId, setFilterProjeId] = useState<string>('hepsi')
  const [filterTag, setFilterTag] = useState<string>('hepsi')

  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const toggleGroup = (baseKonu: string) => {
    setExpandedGroups((prev) =>
      prev.includes(baseKonu) ? prev.filter((g) => g !== baseKonu) : [...prev, baseKonu]
    )
  }

  const [selectedDosyaForMaliyet, setSelectedDosyaForMaliyet] = useState<any | null>(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedFileForAI, setSelectedFileForAI] = useState<Partial<TeminDosyasi> | null>(null)

  const [ekapModalOpen, setEkapModalOpen] = useState(false)
  const [ekapInputVal, setEkapInputVal] = useState('')
  const [ekapTargetId, setEkapTargetId] = useState<number | null>(null)

  useEffect(() => {
    const handleClear = (): void => {
      setSelectedDosyaForMaliyet(null)
    }
    window.addEventListener('app:clear-overlays', handleClear)
    return () => window.removeEventListener('app:clear-overlays', handleClear)
  }, [])

  useEffect(() => {
    if (isWindowMode) return
    const currentHref = routerState.location.href
    if (currentHref === '/' || currentHref.includes('dashboard')) {
      updateTabLabel(currentHref, 'Anasayfa')
    } else {
      updateTabLabel(currentHref, 'Doğrudan Temin')
    }
  }, [routerState.location.href, updateTabLabel, isWindowMode])

  const handleSaveMaliyetAyarlari = async (): Promise<void> => {
    if (!selectedDosyaForMaliyet) return

    let finalMaliyet = Number(selectedDosyaForMaliyet.yaklasik_maliyet) || 0
    const kdvRate = Number(selectedDosyaForMaliyet.kdv) || 0
    const isKdvDahil = Number(selectedDosyaForMaliyet.yaklasik_maliyet_kdv_dahil_mi) === 1

    if (isKdvDahil && kdvRate > 0) {
      finalMaliyet = Number((finalMaliyet / (1 + kdvRate / 100)).toFixed(2))
    }

    await updateDosya({
      id: selectedDosyaForMaliyet.id,
      yaklasik_maliyet: finalMaliyet,
      kdv: selectedDosyaForMaliyet.kdv,
      yaklasik_maliyet_hesaplamasi: selectedDosyaForMaliyet.yaklasik_maliyet_hesaplamasi,
      yaklasik_maliyet_kdv_dahil_mi: 0 // Her zaman veritabanında KDV hariç olarak standardize ediyoruz
    })
    setSelectedDosyaForMaliyet(null)
  }

  const handleOpenMaliyetAyarlari = (dosya: any): void => {
    setSelectedDosyaForMaliyet({ ...dosya })
  }

  const handleOpenAI = (dosya: Partial<TeminDosyasi>) => {
    setSelectedFileForAI(dosya)
    setShowAIModal(true)
  }

  const handleOpenInNewWindow = (dosya: TeminDosyasi) => {
    if (!dosya) return
    const wpParam = activeFilePath ? `&wp=${encodeURIComponent(activeFilePath)}` : ''
    window.electron?.ipcRenderer.send('window:open-secondary', {
      path: '/dosyalar',
      search: `?id=${dosya.id}&mode=window${wpParam}`,
      title: `DT: ${dosya.konu}`
    })
  }

  const handleDelete = async (id: number, skipConfirm = false): Promise<void> => {
    if (
      skipConfirm ||
      confirm(
        'Bu dosyayı iptal etmek istediğinize emin misiniz? Dosya listelerde "İptal Edildi" olarak işaretlenecektir.'
      )
    ) {
      const dosya = dosyalar.find((d) => d.id === id)
      await deleteDosya(id)
      if (dosya) {
        await logActivity(
          'Dosya İptal Edildi',
          `${dosya.temin_no || 'NO BELİRSİZ'} numaralı dosya iptal edildi olarak işaretlendi.`,
          'warning'
        )
      }
      if (activeDosyaId === id) setActiveDosyaId(null)
    }
  }

  const handleHardDelete = async (id: number): Promise<void> => {
    if (
      confirm(
        'DİKKAT: Bu dosyayı veritabanından KALICI OLARAK SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz!'
      )
    ) {
      try {
        await hardDeleteDosya(id)
        if (activeDosyaId === id) setActiveDosyaId(null)
      } catch (error: any) {
        let errorMsg = error?.message || 'Bilinmeyen bir hata oluştu.'
        if (errorMsg.includes('FOREIGN KEY') || errorMsg.includes('CONSTRAINT')) {
          errorMsg =
            'Bu dosyayı silemezsiniz çünkü bu dosyaya bağlı alt kayıtlar (fatura, komisyon üyeleri, yüklenen evraklar vb.) mevcut. Dosyayı kalıcı olarak silebilmek için önce o kayıtları silmeniz gerekmektedir.\n\nTeknik Hata: ' +
            errorMsg
        }
        alert('Silme İşlemi Başarısız!\n\n' + errorMsg)
      }
    }
  }

  const handleBulkDelete = async (ids: number[]): Promise<void> => {
    await bulkDeleteDosyalar(ids)
    await logActivity(
      'Toplu Dosya İptali',
      `${ids.length} adet dosya iptal edildi olarak işaretlendi.`,
      'warning'
    )
    if (activeDosyaId && ids.includes(activeDosyaId)) setActiveDosyaId(null)
  }

  const handleBulkHardDelete = async (ids: number[]): Promise<void> => {
    try {
      await bulkHardDeleteDosyalar(ids)
      if (activeDosyaId && ids.includes(activeDosyaId)) setActiveDosyaId(null)
    } catch (error: any) {
      const errorMsg = error?.message || 'Bilinmeyen bir hata oluştu.'
      alert('Toplu Silme İşlemi Başarısız!\n\n' + errorMsg)
    }
  }

  const handleUpdateStatus = async (id: number, status: string): Promise<void> => {
    await updateDosya({ id, status })
    const dosya = dosyalar.find((d) => d.id === id)
    if (dosya) {
      if (status === 'tamamlandi') {
        await logActivity(
          'Dosya Tamamlandı',
          `${dosya.temin_no || 'NO BELİRSİZ'} numaralı dosya tamamlandı olarak işaretlendi.`,
          'success'
        )
      } else if (status === 'devam_ediyor') {
        await logActivity(
          'Dosya Aktife Alındı',
          `${dosya.temin_no || 'NO BELİRSİZ'} numaralı dosya tekrar aktife alındı.`,
          'info'
        )
      }
    }
  }

  const handleEkapGonder = (id: number): void => {
    setEkapTargetId(id)
    setEkapInputVal('')
    setEkapModalOpen(true)
  }

  const handleEkapGonderSubmit = async (): Promise<void> => {
    if (!ekapTargetId) return
    const id = ekapTargetId
    const ekapNo = ekapInputVal.trim()
    if (!ekapNo) return

    await updateDosya({ id, is_ekap_sent: 1, ekap_no: ekapNo })
    const dosya = dosyalar.find((d) => d.id === id)
    if (dosya) {
      await logActivity(
        'EKAP Kilit',
        `${dosya.temin_no || 'NO BELİRSİZ'} numaralı dosya kilitlendi (İKN: ${ekapNo}).`,
        'success'
      )
    }
    setEkapModalOpen(false)
    setEkapTargetId(null)
  }

  const handleKilidiAc = async (id: number): Promise<void> => {
    if (
      confirm(
        'Kilidi açarsanız dosyanın EKAP bağlantısı/kilit durumu iptal edilecektir. Düzenlemeye devam edebilmek için emin misiniz?'
      )
    ) {
      await updateDosya({ id, is_ekap_sent: 0, ekap_no: null })
      const dosya = dosyalar.find((d) => d.id === id)
      if (dosya) {
        await logActivity(
          'EKAP Kilit Açıldı',
          `${dosya.temin_no || 'NO BELİRSİZ'} numaralı dosyanın kilidi açıldı.`,
          'warning'
        )
      }
    }
  }

  const uniqueYillar = Array.from(
    new Set(
      dosyalar
        .map((d) => {
          if (d.butce_yili) return d.butce_yili
          if (d.dosya_acilis_tarihi) {
            return new Date(d.dosya_acilis_tarihi).getFullYear()
          }
          if (d.created_at) return new Date(d.created_at).getFullYear()
          return new Date().getFullYear()
        })
        .filter(Boolean)
    )
  ).sort((a, b) => b - a)

  const uniqueTags = useMemo(() => {
    const set = new Set<string>()
    dosyalar.forEach((d) => {
      if (d.tags) {
        try {
          const parsed = JSON.parse(d.tags)
          if (Array.isArray(parsed)) parsed.forEach((t: string) => set.add(t))
        } catch {
          if (typeof d.tags === 'string') {
            d.tags.split(',').forEach((t: string) => set.add(t.trim()))
          }
        }
      }
    })
    return Array.from(set).filter(Boolean)
  }, [dosyalar])

  const filteredDosyalar = dosyalar.filter((d) => {
    const matchSearch =
      (d.konu || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.temin_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.birim_adi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.proje_adi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.proje_kodu || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.tags || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchTur = filterTur === 'hepsi' || d.tur === filterTur

    const dosyaYili =
      d.butce_yili ||
      (d.dosya_acilis_tarihi
        ? new Date(d.dosya_acilis_tarihi).getFullYear()
        : new Date(d.created_at).getFullYear())
    const matchYil = filterYil === 'hepsi' || dosyaYili.toString() === filterYil

    const matchStatus =
      filterStatus === 'hepsi' ||
      (filterStatus === 'aktif' && d.is_deleted !== 1 && d.status !== 'tamamlandi') ||
      (filterStatus === 'iptal_edildi' && d.is_deleted === 1) ||
      (filterStatus === 'tamamlandi' && d.status === 'tamamlandi' && d.is_deleted !== 1)

    const matchProje = filterProjeId === 'hepsi' || d.project_id?.toString() === filterProjeId
    const matchTag = filterTag === 'hepsi' || Boolean(d.tags && d.tags.includes(filterTag))

    return matchSearch && matchTur && matchYil && matchStatus && matchProje && matchTag
  })

  const aktifDosyalar = dosyalar.filter((d) => d.is_deleted !== 1)

  const groupedDosyalar = useMemo(() => {
    const groups: { baseKonu: string; files: typeof dosyalar }[] = []

    filteredDosyalar.forEach((dosya) => {
      const baseMatch = (dosya.konu || '').match(/^(.*?)\s*\(\d+\)$/)
      const baseKonu = baseMatch ? baseMatch[1].trim() : (dosya.konu || '').trim()

      let group = groups.find((g) => g.baseKonu.toLowerCase() === baseKonu.toLowerCase())
      if (!group) {
        group = { baseKonu, files: [] }
        groups.push(group)
      }
      group.files.push(dosya)
    })

    const getFileTime = (f: (typeof dosyalar)[0]) => {
      if (f.dosya_acilis_tarihi) return new Date(f.dosya_acilis_tarihi).getTime()
      if (f.created_at) return new Date(f.created_at).getTime()
      return 0
    }

    groups.forEach((g) => {
      g.files.sort((a, b) => getFileTime(b) - getFileTime(a))
    })

    groups.sort((a, b) => {
      const maxA = Math.max(...a.files.map(getFileTime))
      const maxB = Math.max(...b.files.map(getFileTime))
      return maxB - maxA
    })

    return groups
  }, [filteredDosyalar, dosyalar])

  const toplamMaliyet = aktifDosyalar.reduce((acc, d) => acc + (d.yaklasik_maliyet || 0), 0)
  const tamamlananCount = aktifDosyalar.filter((d) => d.status === 'tamamlandi').length
  const taslakCount = aktifDosyalar.filter((d) => !d.durum_asama_id).length

  const formatMoney = (val: number) =>
    val ? val.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0.00'

  const getDosyaNoLabel = (d: any) => formatDosyaNo(d)

  const aktifCount = aktifDosyalar.filter(
    (d) => d.durum_asama_id && d.status !== 'tamamlandi'
  ).length

  return {
    dosyalar,
    isLoadingDosyalar,
    projeler,
    activeDosyaId,
    setActiveDosyaId,
    activeMeta,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    filterTur,
    setFilterTur,
    filterYil,
    setFilterYil,
    filterStatus,
    setFilterStatus,
    filterProjeId,
    setFilterProjeId,
    filterTag,
    setFilterTag,
    expandedGroups,
    toggleGroup,
    selectedDosyaForMaliyet,
    setSelectedDosyaForMaliyet,
    showAIModal,
    setShowAIModal,
    selectedFileForAI,
    setSelectedFileForAI,
    ekapModalOpen,
    setEkapModalOpen,
    ekapInputVal,
    setEkapInputVal,
    handleSaveMaliyetAyarlari,
    handleOpenMaliyetAyarlari,
    handleOpenAI,
    handleOpenInNewWindow,
    handleDelete,
    handleHardDelete,
    handleBulkDelete,
    handleBulkHardDelete,
    handleUpdateStatus,
    handleEkapGonder,
    handleEkapGonderSubmit,
    handleKilidiAc,
    uniqueYillar,
    uniqueTags,
    filteredDosyalar,
    groupedDosyalar,
    toplamMaliyet,
    tamamlananCount,
    taslakCount,
    aktifCount,
    formatMoney,
    getDosyaNoLabel
  }
}
