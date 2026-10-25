import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useProjeHooks, useProjeDosyalari, Proje, ProjeInput } from '../../hooks/useProjeHooks'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { COLOR_PRESETS, generateDefaultProjectCode } from './constants'
import { APP_ROUTES } from '../../constants/routeConstants'

export function useProjelerScreen() {
  const navigate = useNavigate()
  const { setActiveDosyaId } = useWorkspaceStore()
  const { projeler, isLoadingProjeler, addProje, updateProje, deleteProje } = useProjeHooks()

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [durumFilter, setDurumFilter] = useState<'all' | 'devam' | 'planlama' | 'tamamlandi'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProje, setEditingProje] = useState<Proje | null>(null)
  const [detailProje, setDetailProje] = useState<Proje | null>(null)
  const [detailTab, setDetailTab] = useState<'ozet' | 'dosyalar' | 'duzenle'>('ozet')
  const [deletingProje, setDeletingProje] = useState<Proje | null>(null)

  // Form State
  const [formCode, setFormCode] = useState(generateDefaultProjectCode)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formBudget, setFormBudget] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formDurum, setFormDurum] = useState<'planlama' | 'devam' | 'tamamlandi'>('devam')
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0])

  // Sub-query for files of selected detail project
  const { data: projeDosyalari = [], isLoading: isLoadingDosyalar } = useProjeDosyalari(
    detailProje?.id
  )

  // Computed summary metrics
  const summary = useMemo(() => {
    const totalProjects = projeler.length
    const totalBudget = projeler.reduce((acc, p) => acc + (p.toplam_butce || 0), 0)
    const totalSpent = projeler.reduce((acc, p) => acc + (p.harcanan_tutar || 0), 0)
    const totalRemaining = totalBudget - totalSpent
    const activeCount = projeler.filter((p) => p.durum === 'devam').length
    const overallPercentage =
      totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0

    return {
      totalProjects,
      totalBudget,
      totalSpent,
      totalRemaining: Math.max(0, totalRemaining),
      activeCount,
      overallPercentage
    }
  }, [projeler])

  // Filtered projects list
  const filteredProjeler = useMemo(() => {
    return projeler.filter((p) => {
      const matchSearch =
        p.proje_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.proje_kodu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.lokasyon && p.lokasyon.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchDurum = durumFilter === 'all' || p.durum === durumFilter

      return matchSearch && matchDurum
    })
  }, [projeler, searchTerm, durumFilter])

  // Handlers
  const handleOpenCreate = () => {
    setEditingProje(null)
    setFormCode(generateDefaultProjectCode())
    setFormName('')
    setFormDesc('')
    setFormBudget('')
    setFormStartDate('')
    setFormEndDate('')
    setFormLocation('')
    setFormDurum('devam')
    setFormColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)])
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (proje: Proje) => {
    setEditingProje(proje)
    setFormCode(proje.proje_kodu)
    setFormName(proje.proje_adi)
    setFormDesc(proje.aciklama || '')
    setFormBudget(proje.toplam_butce ? String(proje.toplam_butce) : '')
    setFormStartDate(proje.baslangic_tarihi || '')
    setFormEndDate(proje.bitis_tarihi || '')
    setFormLocation(proje.lokasyon || '')
    setFormDurum(proje.durum)
    setFormColor(proje.renk || COLOR_PRESETS[0])
    setIsCreateModalOpen(true)
  }

  const handleOpenDetail = (proje: Proje, tab: 'ozet' | 'dosyalar' | 'duzenle' = 'ozet') => {
    setDetailProje(proje)
    setDetailTab(tab)
    // Synchronize edit form fields if switching to edit tab
    setFormCode(proje.proje_kodu)
    setFormName(proje.proje_adi)
    setFormDesc(proje.aciklama || '')
    setFormBudget(proje.toplam_butce ? String(proje.toplam_butce) : '')
    setFormStartDate(proje.baslangic_tarihi || '')
    setFormEndDate(proje.bitis_tarihi || '')
    setFormLocation(proje.lokasyon || '')
    setFormDurum(proje.durum)
    setFormColor(proje.renk || COLOR_PRESETS[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: ProjeInput = {
      proje_kodu: formCode.trim(),
      proje_adi: formName.trim(),
      aciklama: formDesc.trim() || null,
      toplam_butce: formBudget ? Number(formBudget) : 0,
      baslangic_tarihi: formStartDate || null,
      bitis_tarihi: formEndDate || null,
      lokasyon: formLocation.trim() || null,
      durum: formDurum,
      renk: formColor,
      aktif_mi: 1
    }

    const targetProje = editingProje || detailProje

    if (targetProje) {
      await updateProje({ id: targetProje.id, data: payload })
      if (detailProje?.id === targetProje.id) {
        setDetailProje((prev) => (prev ? ({ ...prev, ...payload } as Proje) : null))
      }
    } else {
      await addProje(payload)
    }

    setIsCreateModalOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProje) return
    await deleteProje(deletingProje.id)
    if (detailProje?.id === deletingProje.id) {
      setDetailProje(null)
    }
    setDeletingProje(null)
  }

  const handleNavigateToDosya = (dosyaId: number) => {
    setActiveDosyaId(dosyaId)
    navigate({ to: APP_ROUTES.DOSYA_DETAY })
  }

  return {
    projeler,
    isLoadingProjeler,
    projeDosyalari,
    isLoadingDosyalar,
    searchTerm,
    setSearchTerm,
    durumFilter,
    setDurumFilter,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingProje,
    detailProje,
    setDetailProje,
    detailTab,
    setDetailTab,
    deletingProje,
    setDeletingProje,
    formCode,
    setFormCode,
    formName,
    setFormName,
    formDesc,
    setFormDesc,
    formBudget,
    setFormBudget,
    formStartDate,
    setFormStartDate,
    formEndDate,
    setFormEndDate,
    formLocation,
    setFormLocation,
    formDurum,
    setFormDurum,
    formColor,
    setFormColor,
    summary,
    filteredProjeler,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleSubmit,
    handleDeleteConfirm,
    handleNavigateToDosya
  }
}
