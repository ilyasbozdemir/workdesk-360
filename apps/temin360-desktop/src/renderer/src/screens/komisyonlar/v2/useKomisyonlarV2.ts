import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { resolveCommissionCategory } from '@temin360/document-templates'
import {
  copyCommissionBetweenDossiers,
  applyInstitutionalTemplateToDossier
} from '../../../services/commission/commissionSeedService'
import type {
  DosyaFilterMode,
  DosyaKomisyonItem,
  DosyaKomisyonMember,
  GlobalHistoryItem,
  KomisyonV2MainTab
} from './types'

export function useKomisyonlarV2() {
  const queryClient = useQueryClient()

  // Ana Sekme: 'dosyalar' | 'sablonlar' | 'tarihce'
  const [activeTab, setActiveTab] = useState<KomisyonV2MainTab>('dosyalar')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<DosyaFilterMode>('all')

  // Seçili Dosya Detay Görünümü (Tam Ekran)
  const [selectedDosya, setSelectedDosya] = useState<{
    id: number
    dosya_no: string
    is_tanimi: string
    initialTab: 'kadro' | 'revizyon'
  } | null>(null)

  // Kadro Kopyalama Modalı State
  const [copyTargetDosya, setCopyTargetDosya] = useState<DosyaKomisyonItem | null>(null)
  const [selectedSourceDosyaId, setSelectedSourceDosyaId] = useState<number | null>(null)
  const [isCopying, setIsCopying] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // Kurumsal Şablon Düzenleme Modalı State
  const [editingTemplateKomisyon, setEditingTemplateKomisyon] = useState<{
    id: number
    ad: string
  } | null>(null)

  // 1. Kurumsal Genel Komisyon Şablonu Tanımları ve Üyeleri
  const {
    data: templateData = { komisyonlar: [], piyasaDefaults: [], muayeneDefaults: [] },
    isLoading: isTemplateLoading,
    refetch: refetchTemplate
  } = useQuery({
    queryKey: ['kurumsal-komisyon-tanimlari'],
    queryFn: async () => {
      const kRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM TANIM_Komisyon WHERE aktif_mi = 1 ORDER BY id ASC'
      )
      const komisyonlar = kRes.success ? kRes.data || [] : []

      const uRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT u.id as role_id, u.komisyon_id, u.asil_mi, u.personel_id, 
                COALESCE(p.ad_soyad, 'İsimsiz') as ad_soyad, 
                COALESCE(p.unvan, '') as unvan, 
                COALESCE(g.ad, 'Üye') as gorev_adi,
                k.ad as komisyon_adi,
                k.tur as komisyon_tur_kodu
         FROM TANIM_KomisyonUye u
         LEFT JOIN TANIM_Personel p ON u.personel_id = p.id
         LEFT JOIN TANIM_KomisyonGorevi g ON u.gorev_id = g.id
         LEFT JOIN TANIM_Komisyon k ON u.komisyon_id = k.id
         WHERE u.personel_id IS NOT NULL
         ORDER BY u.komisyon_id ASC, u.sira ASC`
      )
      const members = uRes.success ? uRes.data || [] : []

      const isPiyasaCheck = (m: any): boolean => {
        if (m.komisyon_id === 1) return true
        const cat = resolveCommissionCategory(m)
        if (cat === 'maliyet') return true
        const str = `${m.komisyon_adi || ''} ${m.gorev_adi || ''}`.toLowerCase()
        return str.includes('maliyet') || str.includes('fiyat') || str.includes('piyasa')
      }

      const isMuayeneCheck = (m: any): boolean => {
        if (m.komisyon_id === 2) return true
        const cat = resolveCommissionCategory(m)
        if (cat === 'muayene') return true
        const str = `${m.komisyon_adi || ''} ${m.gorev_adi || ''}`.toLowerCase()
        return str.includes('muayene') || str.includes('kabul')
      }

      const piyasaDefaults: DosyaKomisyonMember[] = members.filter(isPiyasaCheck).map((m: any) => ({
        id: m.role_id,
        personel_id: m.personel_id,
        ad_soyad: m.ad_soyad,
        unvan: m.unvan,
        gorev_adi: m.gorev_adi,
        asli_mi: m.asil_mi,
        asli_yedek: m.asil_mi === 1 ? 'Asil' : 'Yedek'
      }))

      const muayeneDefaults: DosyaKomisyonMember[] = members
        .filter(isMuayeneCheck)
        .map((m: any) => ({
          id: m.role_id,
          personel_id: m.personel_id,
          ad_soyad: m.ad_soyad,
          unvan: m.unvan,
          gorev_adi: m.gorev_adi,
          asli_mi: m.asil_mi,
          asli_yedek: m.asil_mi === 1 ? 'Asil' : 'Yedek'
        }))

      return {
        komisyonlar,
        members,
        piyasaDefaults,
        muayeneDefaults
      }
    }
  })

  // 2. Dosya Komisyonları Listesi Sorgusu (Dosya Bazlı Kadrolar)
  const {
    data: dosyaKomisyonList = [],
    isLoading: isDosyaLoading,
    isRefetching: isDosyaRefetching,
    refetch: refetchDosyaList
  } = useQuery<DosyaKomisyonItem[]>({
    queryKey: ['dosya-komisyonlari-v2-list'],
    queryFn: async () => {
      const dosyaRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT d.id, 
                COALESCE(d.dosya_no, d.temin_no, '#' || d.id) as dosya_no, 
                COALESCE(d.is_tanimi, d.konu, 'Doğrudan Temin Dosyası') as is_tanimi, 
                d.created_at,
                (SELECT COUNT(*) FROM DATA_TeminKomisyonHistory h WHERE h.temin_dosya_id = d.id) as history_count
         FROM DATA_TeminDosyasi d
         WHERE COALESCE(d.is_deleted, 0) = 0
         ORDER BY d.id DESC`
      )
      if (!dosyaRes.success) return []
      const dosyalar = dosyaRes.data || []

      const membersRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT k.id, k.temin_dosya_id, k.komisyon_id, k.komisyon_turu, k.asli_yedek, k.personel_id, k.gorev, k.updated_at,
                COALESCE(k.ad_soyad, p.ad_soyad) as ad_soyad, 
                COALESCE(k.unvan, p.unvan) as unvan, 
                COALESCE(k.gorev, 'Üye') as gorev_adi
         FROM DATA_TeminKomisyon k
         LEFT JOIN TANIM_Personel p ON k.personel_id = p.id
         ORDER BY k.id ASC`
      )
      const members = membersRes.success ? membersRes.data || [] : []

      const isPiyasa = (m: any): boolean => {
        if (m.komisyon_id === 1) return true
        const cat = resolveCommissionCategory(m)
        if (cat === 'maliyet') return true
        const str = `${m.komisyon_turu || ''} ${m.gorev || ''} ${m.gorev_adi || ''}`.toLowerCase()
        return (
          str.includes('yaklaşık') ||
          str.includes('yaklasik') ||
          str.includes('maliyet') ||
          str.includes('fiyat') ||
          str.includes('piyasa')
        )
      }

      const isMuayene = (m: any): boolean => {
        if (m.komisyon_id === 2) return true
        const cat = resolveCommissionCategory(m)
        if (cat === 'muayene') return true
        const str = `${m.komisyon_turu || ''} ${m.gorev || ''} ${m.gorev_adi || ''}`.toLowerCase()
        return str.includes('muayene') || str.includes('kabul')
      }

      return dosyalar.map((d: any) => {
        const dosyaMembers = members.filter((m: any) => m.temin_dosya_id === d.id)
        const isCustomized = dosyaMembers.length > 0

        let piyasaMembers: DosyaKomisyonMember[] = []
        let muayeneMembers: DosyaKomisyonMember[] = []
        let source: 'custom' | 'template' | 'empty' = 'empty'

        if (isCustomized) {
          source = 'custom'
          piyasaMembers = dosyaMembers.filter(isPiyasa).map((m: any) => ({
            id: m.id,
            personel_id: m.personel_id,
            ad_soyad: m.ad_soyad,
            unvan: m.unvan,
            gorev_adi: m.gorev_adi,
            asli_yedek: m.asli_yedek || 'Asil'
          }))
          muayeneMembers = dosyaMembers.filter(isMuayene).map((m: any) => ({
            id: m.id,
            personel_id: m.personel_id,
            ad_soyad: m.ad_soyad,
            unvan: m.unvan,
            gorev_adi: m.gorev_adi,
            asli_yedek: m.asli_yedek || 'Asil'
          }))
        } else if (
          templateData.piyasaDefaults.length > 0 ||
          templateData.muayeneDefaults.length > 0
        ) {
          source = 'template'
          piyasaMembers = templateData.piyasaDefaults
          muayeneMembers = templateData.muayeneDefaults
        } else {
          source = 'empty'
        }

        let lastUpdate: string | null = null
        dosyaMembers.forEach((m: any) => {
          if (m.updated_at) {
            if (!lastUpdate || new Date(m.updated_at) > new Date(lastUpdate)) {
              lastUpdate = m.updated_at
            }
          }
        })

        return {
          ...d,
          isCustomized,
          source,
          piyasaMembers,
          muayeneMembers,
          totalMembersCount: isCustomized
            ? dosyaMembers.length
            : piyasaMembers.length + muayeneMembers.length,
          lastUpdate
        }
      })
    }
  })

  // 3. Tüm Dosyaların Global Revizyon Çizelgesi (Audit Log)
  const {
    data: globalHistoryList = [],
    isLoading: isGlobalHistoryLoading,
    refetch: refetchGlobalHistory
  } = useQuery<GlobalHistoryItem[]>({
    queryKey: ['global-komisyon-history-list'],
    queryFn: async () => {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT h.id, h.temin_dosya_id, h.komisyon_turu, h.islem_turu, h.islem_yapan, h.snapshot_data, h.created_at,
                COALESCE(d.dosya_no, d.temin_no, '#' || d.id) as dosya_no,
                COALESCE(d.is_tanimi, d.konu, 'Doğrudan Temin Dosyası') as is_tanimi
         FROM DATA_TeminKomisyonHistory h
         LEFT JOIN DATA_TeminDosyasi d ON h.temin_dosya_id = d.id
         ORDER BY h.id DESC
         LIMIT 150`
      )
      return res.success ? res.data || [] : []
    }
  })

  // Tek Tıkla Kurumsal Şablonu Dosyaya Uygulama
  const handleApplyTemplate = async (dosyaId: number): Promise<void> => {
    try {
      const res = await applyInstitutionalTemplateToDossier(dosyaId)
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['dosya-komisyonlari-v2-list'] })
        queryClient.invalidateQueries({ queryKey: ['global-komisyon-history-list'] })
        refetchDosyaList()
      } else {
        alert('Kurumsal şablon aktarılırken hata: ' + (res.error || 'Bilinmeyen hata'))
      }
    } catch (err: any) {
      alert('Aktarım hatası: ' + err.message)
    }
  }

  // Başka Dosyadan Kadro Kopyalama İşlemi
  const handleExecuteCopy = async (): Promise<void> => {
    if (!copyTargetDosya || !selectedSourceDosyaId) return
    setIsCopying(true)
    setCopyFeedback(null)
    try {
      const res = await copyCommissionBetweenDossiers(copyTargetDosya.id, selectedSourceDosyaId)
      if (res.success) {
        setCopyFeedback('Kadro başarıyla kopyalandı ve bu dosyaya özel olarak kaydedildi!')
        queryClient.invalidateQueries({ queryKey: ['dosya-komisyonlari-v2-list'] })
        queryClient.invalidateQueries({ queryKey: ['global-komisyon-history-list'] })
        setTimeout(() => {
          setCopyTargetDosya(null)
          setSelectedSourceDosyaId(null)
          setCopyFeedback(null)
          refetchDosyaList()
        }, 1200)
      } else {
        setCopyFeedback('Hata: ' + (res.error || 'Kopyalama başarısız oldu'))
      }
    } catch (err: any) {
      setCopyFeedback('Hata: ' + err.message)
    } finally {
      setIsCopying(false)
    }
  }

  // Filtrelenmiş Dosya Listesi
  const filteredDosyaList = useMemo(() => {
    return dosyaKomisyonList.filter((item) => {
      const term = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !term ||
        item.dosya_no?.toLowerCase().includes(term) ||
        item.is_tanimi?.toLowerCase().includes(term) ||
        item.piyasaMembers.some((m) => m.ad_soyad?.toLowerCase().includes(term)) ||
        item.muayeneMembers.some((m) => m.ad_soyad?.toLowerCase().includes(term))

      if (!matchesSearch) return false

      if (filterMode === 'custom') return item.source === 'custom'
      if (filterMode === 'template') return item.source === 'template'
      if (filterMode === 'empty') return item.source === 'empty'

      return true
    })
  }, [dosyaKomisyonList, searchTerm, filterMode])

  // Filtrelenmiş Global Tarihçe Listesi
  const filteredHistoryList = useMemo(() => {
    if (!searchTerm.trim()) return globalHistoryList
    const term = searchTerm.toLowerCase().trim()
    return globalHistoryList.filter(
      (h) =>
        h.dosya_no?.toLowerCase().includes(term) ||
        h.is_tanimi?.toLowerCase().includes(term) ||
        h.komisyon_turu?.toLowerCase().includes(term) ||
        h.islem_turu?.toLowerCase().includes(term) ||
        h.snapshot_data?.toLowerCase().includes(term)
    )
  }, [globalHistoryList, searchTerm])

  const totalFiles = dosyaKomisyonList.length
  const customFilesCount = dosyaKomisyonList.filter((d) => d.source === 'custom').length
  const templateFilesCount = dosyaKomisyonList.filter((d) => d.source === 'template').length
  const emptyFilesCount = dosyaKomisyonList.filter((d) => d.source === 'empty').length

  const availableSourceDosyalar = dosyaKomisyonList.filter(
    (d) => copyTargetDosya && d.id !== copyTargetDosya.id && d.totalMembersCount > 0
  )
  const selectedSourceItem = availableSourceDosyalar.find((d) => d.id === selectedSourceDosyaId)

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filterMode,
    setFilterMode,
    selectedDosya,
    setSelectedDosya,
    copyTargetDosya,
    setCopyTargetDosya,
    selectedSourceDosyaId,
    setSelectedSourceDosyaId,
    isCopying,
    copyFeedback,
    setCopyFeedback,
    editingTemplateKomisyon,
    setEditingTemplateKomisyon,
    templateData,
    isTemplateLoading,
    refetchTemplate,
    dosyaKomisyonList,
    isDosyaLoading,
    isDosyaRefetching,
    refetchDosyaList,
    globalHistoryList,
    isGlobalHistoryLoading,
    refetchGlobalHistory,
    handleApplyTemplate,
    handleExecuteCopy,
    filteredDosyaList,
    filteredHistoryList,
    totalFiles,
    customFilesCount,
    templateFilesCount,
    emptyFilesCount,
    availableSourceDosyalar,
    selectedSourceItem
  }
}
