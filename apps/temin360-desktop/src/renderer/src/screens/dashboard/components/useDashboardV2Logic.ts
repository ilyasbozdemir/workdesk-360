import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useSettingsStore } from '../../../store/settingsStore'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { useAnnouncements, useDashboardStats, useSmartAlerts } from '../dashboard.hooks'
import { useDosyalarHooks } from '../../dosyalar/dosyalar.hooks'
import { useAyarlarHooks } from '../../ayarlar/ayarlar.hooks'
import { logActivity } from '../../../utils/logger'
import {
  getInitial2886Dosyalar,
  getInitial2886ActiveDosya
} from '../../../components/layout/temin-selector/teminSelector.storage'
import { Dosya2886Item } from '../../../components/layout/temin-selector/teminSelector.types'
import {
  buildTeminPillars,
  formatCurrency,
  getAsamaDetails,
  getInstitutionTypeLabel
} from './dashboardV2.helpers'
import { IS_DT_EDITION } from '../../../../../shared/edition'

export function useDashboardV2Logic() {
  const navigate = useNavigate()
  const {
    institutionName,
    limitType,
    institutionType,
    kurumsalKod,
    fonksiyonelKod,
    muhasebeBirimAdi,
    harcamaBirimAdi,
    adminName,
    adminTitle,
    adminUsername
  } = useSettingsStore()

  const { activeDosyaId, setActiveDosyaId } = useWorkspaceStore()

  // 2886 Dosyaları ve Aktif 2886 Dosyası (Temin 360 DT sürümünde tamamen kapalı)
  const [dosyalar2886, setDosyalar2886] = useState<Dosya2886Item[]>(() =>
    IS_DT_EDITION ? [] : getInitial2886Dosyalar()
  )
  const [active2886Dosya, setActive2886Dosya] = useState<Dosya2886Item | null>(() =>
    IS_DT_EDITION ? null : getInitial2886ActiveDosya()
  )

  useEffect(() => {
    if (IS_DT_EDITION) return
    const handleReload2886 = (): void => {
      setDosyalar2886(getInitial2886Dosyalar())
      setActive2886Dosya(getInitial2886ActiveDosya())
    }
    window.addEventListener('devlet-ihale-2886-reloaded', handleReload2886)
    window.addEventListener('storage', handleReload2886)
    return () => {
      window.removeEventListener('devlet-ihale-2886-reloaded', handleReload2886)
      window.removeEventListener('storage', handleReload2886)
    }
  }, [])

  // Mod Seçici Durumu
  const [procurementMode, setProcurementMode] = useState<
    'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886' | 'all'
  >(() => {
    if (IS_DT_EDITION) return 'dogrudan_temin'
    const saved = localStorage.getItem('temin_procurement_mode')
    if (saved === 'devlet_ihale_2886' || saved === 'ihale') return 'dogrudan_temin'
    return (saved as 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886') || 'dogrudan_temin'
  })

  const isIhale = false

  useEffect(() => {
    if (IS_DT_EDITION) return
    const handleModeChange = (e: any): void => {
      if (e.detail?.mode) {
        setProcurementMode(e.detail.mode)
      }
    }
    window.addEventListener('procurement-mode-change', handleModeChange)
    return () => {
      window.removeEventListener('procurement-mode-change', handleModeChange)
    }
  }, [])

  const switchProcurementMode = (
    mode: 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886' | 'all'
  ): void => {
    if (IS_DT_EDITION) return
    setProcurementMode(mode)
    if (mode !== 'all') {
      localStorage.setItem('temin_procurement_mode', mode)
      window.dispatchEvent(
        new CustomEvent('procurement-mode-change', {
          detail: { mode }
        })
      )
    }
  }

  const { stats, isLoading } = useDashboardStats(procurementMode)
  const { announcements } = useAnnouncements()
  const { dosyalar } = useDosyalarHooks()
  const { settings } = useAyarlarHooks()

  const isMailConfigured = !!settings.smtp_host
  const isAiConfigured = Boolean(
    settings.ai_gemini_api_key?.trim() ||
    settings.ai_openai_api_key?.trim() ||
    settings.ai_anthropic_api_key?.trim()
  )

  const [showAIModal, setShowAIModal] = useState(false)
  const [showAiMissingModal, setShowAiMissingModal] = useState(false)
  const [selectedFileForAI, setSelectedFileForAI] = useState<any>(null)
  const [activePillar, setActivePillar] = useState<'T' | 'E' | 'M' | 'I' | 'N'>('T')
  const [searchTerm, setSearchTerm] = useState('')

  // Zaman tabanlı karşılama
  const greeting = (() => {
    const hours = new Date().getHours()
    if (hours >= 6 && hours < 12) return 'Günaydın'
    if (hours >= 12 && hours < 18) return 'İyi Günler'
    if (hours >= 18 && hours < 23) return 'İyi Akşamlar'
    return 'İyi Geceler'
  })()

  const currentDate = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date())

  const kurumTuruLabel = getInstitutionTypeLabel(institutionType || '')

  // 4734 Sayılı Kanun Madde 22/d KİK Eşik Değeri
  const kikLimit = limitType === 'buyuksehir' ? 1021827 : 340391

  // Bütçe / Harcama Tür Dağılımı
  const totalCat =
    (stats.malYaklasikMaliyet || 0) +
      (stats.hizmetYaklasikMaliyet || 0) +
      (stats.yapimYaklasikMaliyet || 0) +
      (stats.danismanlikYaklasikMaliyet || 0) || 1
  const malPct = Math.round(((stats.malYaklasikMaliyet || 0) / totalCat) * 100)
  const hizmetPct = Math.round(((stats.hizmetYaklasikMaliyet || 0) / totalCat) * 100)
  const yapimPct = Math.round(((stats.yapimYaklasikMaliyet || 0) / totalCat) * 100)
  const danismanlikPct = Math.max(0, 100 - malPct - hizmetPct - yapimPct)

  // Asamalar Sorgusu
  const fetchAsamalar = async (): Promise<any[]> => {
    const res = await window.electron.ipcRenderer.invoke(
      'db:query',
      'SELECT * FROM TANIM_Asama WHERE aktif_mi = 1 ORDER BY asama_sira ASC'
    )
    if (!res.success) throw new Error(res.error)
    return res.data
  }

  const { data: asamalar = [] } = useQuery<any[]>({
    queryKey: ['asamalar_dashboard_v2'],
    queryFn: fetchAsamalar
  })

  // Harcama Yetkilisi
  const fetchHarcamaYetkilisi = async (): Promise<{
    ad_soyad: string
    unvan: string | null
  } | null> => {
    const res = await window.electron.ipcRenderer.invoke(
      'db:query',
      `SELECT p.ad_soyad, p.unvan 
       FROM TANIM_Roller r 
       LEFT JOIN TANIM_Personel p ON r.varsayilan_personel_id = p.id 
       WHERE r.rol_kodu = 'harcama_yetkilisi'`
    )
    if (!res.success) throw new Error(res.error)
    return res.data[0] || null
  }

  const { data: harcamaYetkilisi = null } = useQuery({
    queryKey: ['harcama_yetkilisi_dashboard_v2'],
    queryFn: fetchHarcamaYetkilisi
  })

  const smartAlerts = useSmartAlerts(settings, activeDosyaId, null)

  useEffect(() => {
    if (isLoading) return

    const notifiedStr = localStorage.getItem('dta_notified_syslog_keys') || '[]'
    let notifiedKeys: string[] = []
    try {
      notifiedKeys = JSON.parse(notifiedStr)
    } catch {
      notifiedKeys = []
    }

    const newNotifiedKeys = [...notifiedKeys]
    let hasNewLog = false

    if (!isMailConfigured) {
      const key = 'smtp_not_configured'
      if (!notifiedKeys.includes(key)) {
        logActivity(
          'Mail (SMTP) Yapılandırılmamış',
          'Posta sunucu ayarlarınız eksik. Bildirimler ve onay mailleri devre dışı kalabilir.',
          'warning'
        )
        newNotifiedKeys.push(key)
        hasNewLog = true
      }
    }

    smartAlerts.forEach((alert) => {
      if (alert.type === 'error' || alert.type === 'warning') {
        const key = `alert_${alert.id}`
        if (!notifiedKeys.includes(key)) {
          logActivity(alert.title, alert.message, alert.type)
          newNotifiedKeys.push(key)
          hasNewLog = true
        }
      }
    })

    if (hasNewLog) {
      localStorage.setItem('dta_notified_syslog_keys', JSON.stringify(newNotifiedKeys))
    }
  }, [smartAlerts, isMailConfigured, isLoading])

  // Konsolide veya Moda Göre Filtrelenmiş Dosyalar
  const filteredDosyalar = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()

    let pool: any[] = []
    if (procurementMode === 'devlet_ihale_2886') {
      pool = dosyalar2886
    } else if (procurementMode === 'all') {
      pool = [...dosyalar, ...dosyalar2886]
    } else {
      pool = dosyalar
    }

    if (!q) return pool

    return pool.filter((d) => {
      const no = (d.temin_no || d.ihaleKayitNo || '').toLowerCase()
      const subject = (d.konu || d.ihaleAdi || '').toLowerCase()
      const dept = (d.harcama_birimi || d.tasinmaz?.ilce || '').toLowerCase()
      return no.includes(q) || subject.includes(q) || dept.includes(q)
    })
  }, [searchTerm, procurementMode, dosyalar, dosyalar2886])

  // Aktif Dosya Bilgisi (4734 veya 2886)
  const activeDosya = useMemo(() => {
    if (!IS_DT_EDITION && procurementMode === 'devlet_ihale_2886') {
      return active2886Dosya
    }
    const found4734 = dosyalar.find((d) => d.id === activeDosyaId)
    if (found4734) return found4734
    if (!IS_DT_EDITION && procurementMode === 'all' && active2886Dosya) return active2886Dosya
    return null
  }, [procurementMode, active2886Dosya, dosyalar, activeDosyaId])

  const teminPillars = useMemo(
    () => buildTeminPillars(stats, kikLimit, limitType, formatCurrency),
    [stats, kikLimit, limitType]
  )

  const currentPillar = teminPillars.find((p) => p.key === activePillar) || teminPillars[0]

  const resolveAsamaDetails = (asamaSira: number) => getAsamaDetails(asamaSira, asamalar)

  return {
    navigate,
    institutionName,
    limitType,
    kurumsalKod,
    fonksiyonelKod,
    muhasebeBirimAdi,
    harcamaBirimAdi,
    adminName,
    adminTitle,
    adminUsername,
    activeDosyaId,
    setActiveDosyaId,
    procurementMode,
    isIhale,
    switchProcurementMode,
    stats,
    isLoading,
    announcements,
    isAiConfigured,
    showAIModal,
    setShowAIModal,
    showAiMissingModal,
    setShowAiMissingModal,
    selectedFileForAI,
    setSelectedFileForAI,
    activePillar,
    setActivePillar,
    searchTerm,
    setSearchTerm,
    greeting,
    currentDate,
    kurumTuruLabel,
    kikLimit,
    totalCat,
    malPct,
    hizmetPct,
    yapimPct,
    danismanlikPct,
    harcamaYetkilisi,
    smartAlerts,
    filteredDosyalar,
    activeDosya,
    teminPillars,
    currentPillar,
    resolveAsamaDetails
  }
}
