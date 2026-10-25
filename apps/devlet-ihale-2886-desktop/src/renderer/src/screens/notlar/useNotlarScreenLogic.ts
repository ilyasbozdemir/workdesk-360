import React, { useState, useMemo } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useNotlarHooks } from './notlar.hooks'
import { NotVeGorev, NotOncelik, NotTip } from './types'
import { useWorkspaceStore } from '../../store/workspaceStore'

export function useNotlarScreenLogic() {
  const location = useLocation()
  const {
    notlar,
    isLoadingNotlar,
    dosyalar,
    refetchNotlar,
    createNot,
    toggleNot,
    togglePin,
    updateNot,
    deleteNot
  } = useNotlarHooks()

  const activeDosyaId = useWorkspaceStore((s) => s.activeDosyaId)

  // Filtre durumları
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'todo' | 'not' | 'completed'>('all')
  const [selectedOncelik, setSelectedOncelik] = useState<'all' | NotOncelik>('all')
  const [selectedKategori, setSelectedKategori] = useState('all')

  // URL parametresinden veya hash'ten dosyaId oku
  const paramDosyaId = useMemo<number | null>(() => {
    try {
      const searchObj = (location.search as Record<string, unknown>) || {}
      if (searchObj.dosyaId) {
        const parsed = parseInt(String(searchObj.dosyaId), 10)
        if (!isNaN(parsed)) return parsed
      }
      const rawHash = window.location.hash || ''
      const match = rawHash.match(/[?&]dosyaId=([0-9]+)/)
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10)
        if (!isNaN(parsed)) return parsed
      }
    } catch (e) {
      void e
    }
    return null
  }, [location.search, location.hash])

  // Kullanıcı filtreyi elle değiştirdiğinde override kullanılır
  const [selectedDosyaOverride, setSelectedDosyaOverride] = useState<
    number | 'all' | 'general' | null
  >(null)

  const selectedDosya =
    selectedDosyaOverride !== null ? selectedDosyaOverride : (paramDosyaId ?? 'all')

  const setSelectedDosya = (
    val:
      | number
      | 'all'
      | 'general'
      | ((prev: number | 'all' | 'general') => number | 'all' | 'general')
  ): void => {
    if (typeof val === 'function') {
      setSelectedDosyaOverride((prev) => {
        const current = prev !== null ? prev : (paramDosyaId ?? 'all')
        return val(current)
      })
    } else {
      setSelectedDosyaOverride(val)
    }
  }

  const [viewMode, setViewMode] = useState<'list' | 'sticky'>('list')

  // Hızlı Ekleme Çubuğu Durumları
  const [quickTitle, setQuickTitle] = useState('')
  const [quickTip, setQuickTip] = useState<NotTip>('todo')
  const [quickOncelik, setQuickOncelik] = useState<NotOncelik>('orta')
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false)

  // Modal Durumu
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NotVeGorev | null>(null)

  // İstatistikler
  const stats = useMemo(() => {
    const total = notlar.length
    const completed = notlar.filter((n) => n.tamamlandi === 1).length
    const pending = total - completed
    const today = new Date().toISOString().split('T')[0]
    const urgent = notlar.filter(
      (n) => n.tamamlandi === 0 && (n.oncelik === 'acil' || n.oncelik === 'yuksek')
    ).length
    const todayOrOverdue = notlar.filter(
      (n) => n.tamamlandi === 0 && n.vade_tarihi && n.vade_tarihi <= today
    ).length

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, pending, completed, urgent, todayOrOverdue, completionRate }
  }, [notlar])

  // Filtrelenmiş liste
  const filteredNotlar = useMemo(() => {
    return notlar.filter((item) => {
      // 1. Sekme Filtresi
      if (tab === 'todo' && (item.tip !== 'todo' || item.tamamlandi === 1)) return false
      if (tab === 'not' && item.tip !== 'not' && item.tip !== 'hatirlatici') return false
      if (tab === 'completed' && item.tamamlandi !== 1) return false

      // 2. Arama Filtresi
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = item.baslik.toLowerCase().includes(q)
        const matchContent = item.icerik ? item.icerik.toLowerCase().includes(q) : false
        const matchDosya = item.dosya_no ? item.dosya_no.toLowerCase().includes(q) : false
        if (!matchTitle && !matchContent && !matchDosya) return false
      }

      // 3. Öncelik Filtresi
      if (selectedOncelik !== 'all' && item.oncelik !== selectedOncelik) return false

      // 4. Kategori Filtresi
      if (selectedKategori !== 'all' && item.kategori !== selectedKategori) return false

      // 5. Dosya Filtresi
      if (selectedDosya === 'general' && item.temin_dosya_id !== null) return false
      if (typeof selectedDosya === 'number' && item.temin_dosya_id !== selectedDosya) return false

      return true
    })
  }, [notlar, tab, search, selectedOncelik, selectedKategori, selectedDosya])

  // Hızlı Görev Ekleme
  const handleQuickAdd = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!quickTitle.trim()) return

    try {
      setIsQuickSubmitting(true)
      const defaultDosya =
        typeof selectedDosya === 'number'
          ? selectedDosya
          : selectedDosya === 'general'
            ? null
            : activeDosyaId || null

      await createNot({
        baslik: quickTitle.trim(),
        tip: quickTip,
        oncelik: quickOncelik,
        temin_dosya_id: defaultDosya,
        kategori: 'Genel',
        renk: quickTip === 'not' ? 'amber' : 'slate'
      })
      setQuickTitle('')
    } catch (err) {
      console.error('Hızlı not eklenemedi:', err)
    } finally {
      setIsQuickSubmitting(false)
    }
  }

  return {
    notlar,
    isLoadingNotlar,
    dosyalar,
    refetchNotlar,
    createNot,
    toggleNot,
    togglePin,
    updateNot,
    deleteNot,
    activeDosyaId,
    search,
    setSearch,
    tab,
    setTab,
    selectedOncelik,
    setSelectedOncelik,
    selectedKategori,
    setSelectedKategori,
    selectedDosya,
    setSelectedDosya,
    viewMode,
    setViewMode,
    quickTitle,
    setQuickTitle,
    quickTip,
    setQuickTip,
    quickOncelik,
    setQuickOncelik,
    isQuickSubmitting,
    handleQuickAdd,
    isModalOpen,
    setIsModalOpen,
    editingItem,
    setEditingItem,
    stats,
    filteredNotlar
  }
}
