import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../../store/workspaceStore'

export interface TableStat {
  tableName: string
  label: string
  count: number
  description: string
}

export type PackageFile = 'meta.json' | 'database.sqlite' | 'attachments/'

export function useDosyaScreenData() {
  const { activeMeta, activeFilePath, fileName, activeDosyaId } = useWorkspaceStore()
  const [selectedFile, setSelectedFile] = useState<PackageFile>('meta.json')
  const [copied, setCopied] = useState(false)

  const queryClient = useQueryClient()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [changelog, setChangelog] = useState<
    { version: string; notes: string; schema_max: number }[]
  >([])
  const [backlog, setBacklog] = useState<{ title: string; items: string[] }[]>([])
  const [activeHistoryTab, setActiveHistoryTab] = useState<'releases' | 'backlog'>('releases')

  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  // Aktif Dosya Detay States
  const [dosyaData, setDosyaData] = useState<any>(null)
  const [kalemler, setKalemler] = useState<any[]>([])
  const [firmalar, setFirmalar] = useState<any[]>([])
  const [birimAdi, setBirimAdi] = useState<string>('')
  const [loadingDosya, setLoadingDosya] = useState<boolean>(!!activeDosyaId)

  // DTE Data Transfer States
  const [dteContentType, setDteContentType] = useState<'firms' | 'items' | 'all'>('firms')
  const [dteStatus, setDteStatus] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [dteLoading, setDteLoading] = useState(false)

  // Database stats state
  const [dbStats, setDbStats] = useState<TableStat[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Auto-Updater States
  const [updaterStatus, setUpdaterStatus] = useState<string>('idle')
  const [updateVersion, setUpdateVersion] = useState<string>('')
  const [updaterError, setUpdaterError] = useState<string>('')

  useEffect(() => {
    if (!window.electron) return
    window.electron.ipcRenderer
      .invoke('get-changelog')
      .then((res) => {
        if (res && res.success) {
          setChangelog(res.changelog || [])
          setBacklog(res.backlog || [])
        } else if (Array.isArray(res)) {
          setChangelog(res)
        }
      })
      .catch(console.error)
  }, [])

  // Aktif Dosya Özet Detaylarını Yükle
  useEffect(() => {
    if (!window.electron || !activeDosyaId) {
      return
    }

    const fetchDosyaDetails = async () => {
      setLoadingDosya(true)
      try {
        const dosyaRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT * FROM DATA_TeminDosyasi WHERE id = ?',
          [activeDosyaId]
        )
        if (dosyaRes.success && dosyaRes.data.length > 0) {
          const dosya = dosyaRes.data[0]
          setDosyaData(dosya)

          // Birim adını getir
          if (dosya.birim_id) {
            const birimRes = await window.electron.ipcRenderer.invoke(
              'db:query',
              'SELECT birim_adi FROM TANIM_Birim WHERE id = ?',
              [dosya.birim_id]
            )
            if (birimRes.success && birimRes.data.length > 0) {
              setBirimAdi(birimRes.data[0].birim_adi)
            }
          } else {
            setBirimAdi('')
          }

          // Kalemleri getir
          const kalemRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            'SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC',
            [activeDosyaId]
          )
          if (kalemRes.success) {
            setKalemler(kalemRes.data || [])
          }

          // Firmaları getir
          const firmaRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT df.*, f.unvan 
             FROM DATA_TeminFirma df 
             JOIN TANIM_Firma f ON df.firma_id = f.id 
             WHERE df.temin_dosya_id = ?`,
            [activeDosyaId]
          )
          if (firmaRes.success) {
            setFirmalar(firmaRes.data || [])
          }
        } else {
          setDosyaData(null)
        }
      } catch (err) {
        console.error('Failed to load active file details:', err)
      } finally {
        setLoadingDosya(false)
      }
    }

    fetchDosyaDetails()
  }, [activeDosyaId, refreshTrigger])

  const handleExportDte = async (): Promise<void> => {
    setDteLoading(true)
    setDteStatus(null)
    try {
      const res = await window.electron.ipcRenderer.invoke('db:export-dte', dteContentType)
      if (res.success) {
        setDteStatus({
          type: 'success',
          message: `Veriler başarıyla dışa aktarıldı. (${res.recordCount} kayıt)`
        })
      } else {
        if (res.error !== 'İptal edildi') {
          setDteStatus({
            type: 'error',
            message: `Dışa aktarma hatası: ${res.error}`
          })
        }
      }
    } catch (err: any) {
      setDteStatus({
        type: 'error',
        message: err.message || 'Dışa aktarım sırasında beklenmedik hata.'
      })
    } finally {
      setDteLoading(false)
    }
  }

  const handleImportDte = async (): Promise<void> => {
    setDteLoading(true)
    setDteStatus(null)
    try {
      const res = await window.electron.ipcRenderer.invoke('db:import-dte')
      if (res.success) {
        let msg = ''
        if (res.importedFirmsCount > 0) {
          msg += `${res.importedFirmsCount} adet firma `
        }
        if (res.importedItemsCount > 0) {
          msg += `${msg ? 've ' : ''}${res.importedItemsCount} adet malzeme/hizmet kalemi `
        }

        if (res.totalImportedCount > 0 && !msg) {
          msg = `Toplam ${res.totalImportedCount} adet kayıt `
        }

        if (!msg && res.totalImportedCount === 0) {
          msg = 'Aktarılacak yeni kayıt bulunamadı veya atlandı.'
        } else {
          msg += 'başarıyla içe aktarıldı.'
        }

        if (res.warnings && res.warnings.length > 0) {
          msg += ` (Uyarı: ${res.warnings.join(', ')})`
        }

        setDteStatus({
          type: 'success',
          message: msg
        })

        // Invalidate react-query cache
        queryClient.invalidateQueries()
        // Refresh local stats
        setRefreshTrigger((prev) => prev + 1)
      } else {
        if (res.error !== 'İptal edildi') {
          setDteStatus({
            type: 'error',
            message: `İçe aktarma hatası: ${res.error}`
          })
        }
      }
    } catch (err: any) {
      setDteStatus({
        type: 'error',
        message: err.message || 'İçe aktarım sırasında beklenmedik hata.'
      })
    } finally {
      setDteLoading(false)
    }
  }

  useEffect(() => {
    if (!window.electron) return

    const removeListener = window.electron.ipcRenderer.on(
      'updater:status',
      (_, data: { status: string; version?: string; error?: string }) => {
        setUpdaterStatus(data.status)
        if (data.version) setUpdateVersion(data.version)
        if (data.error) setUpdaterError(data.error)
      }
    )

    return () => {
      if (removeListener) removeListener()
    }
  }, [])

  const handleCheckUpdates = async (): Promise<void> => {
    setUpdaterStatus('checking')
    setUpdaterError('')
    try {
      const res = await window.electron.ipcRenderer.invoke('updater:check')
      if (!res.success) {
        setUpdaterStatus('error')
        setUpdaterError(res.error || 'Güncelleme kontrolü başarısız.')
      }
    } catch (err: any) {
      setUpdaterStatus('error')
      setUpdaterError(err.message || 'Hata oluştu.')
    }
  }

  const handleQuitAndInstall = async (): Promise<void> => {
    try {
      await window.electron.ipcRenderer.invoke('updater:quit-and-install')
    } catch (err: any) {
      alert('Güncelleme yüklenirken hata oluştu: ' + err.message)
    }
  }

  // Fetch SQLite stats when workspace changes or database.sqlite is selected
  useEffect(() => {
    if (!window.electron || !activeFilePath) return

    const fetchStats = async (): Promise<void> => {
      setLoadingStats(true)
      setStatsError(null)
      try {
        const tables = [
          {
            name: 'DATA_TeminDosyasi',
            label: 'Doğrudan Temin Dosyaları',
            desc: 'Süreçteki doğrudan temin dosyaları ve ihale teklifleri'
          },
          {
            name: 'TANIM_Birim',
            label: 'Kurum Birimleri',
            desc: 'Bütçe harcaması yapan belediye müdürlükleri/birimleri'
          },
          {
            name: 'TANIM_Personel',
            label: 'Personel Havuzu',
            desc: 'Evraklarda imza yetkilisi olan kurum çalışanları'
          },
          {
            name: 'TANIM_Mevzuat',
            label: 'Mevzuat ve Limitler',
            desc: 'Yıllara göre doğrudan temin bütçe ve KDV limitleri'
          },
          {
            name: 'TANIM_Firma',
            label: 'Kayıtlı Firmalar',
            desc: 'Sistemde kayıtlı tedarikçiler ve firmalar havuzu'
          },
          {
            name: 'TANIM_Kalem',
            label: 'Malzeme/Hizmet Kütüphanesi',
            desc: 'Yaklaşık maliyet kalem kütüphanesi'
          },
          {
            name: 'settings',
            label: 'Sistem Ayarları',
            desc: 'Uygulamanın yerel yapılandırma anahtar-değer çiftleri'
          }
        ]

        const statsPromises = tables.map(async (table) => {
          const res = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT COUNT(*) as row_count FROM ${table.name}`
          )
          if (res.success && res.data && res.data.length > 0) {
            return {
              tableName: table.name,
              label: table.label,
              count: res.data[0].row_count,
              description: table.desc
            }
          }
          return {
            tableName: table.name,
            label: table.label,
            count: 0,
            description: table.desc
          }
        })

        const results = await Promise.all(statsPromises)
        setDbStats(results)
      } catch (err: any) {
        console.error('Veritabanı istatistikleri alınamadı:', err)
        setStatsError(err.message || 'İstatistikler okunamadı.')
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [activeFilePath, refreshTrigger])

  const handleCopyPath = (): void => {
    if (!activeFilePath) return
    navigator.clipboard.writeText(activeFilePath)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getAsamaLabel = (asamaId: number) => {
    switch (asamaId) {
      case 1:
        return '1. İhtiyaç Listesi & Maliyet & Onay'
      case 2:
        return '2. Piyasa Fiyat Araştırması'
      case 3:
        return '3. Sipariş & Sözleşme'
      case 4:
        return '4. Muayene & Kabul & Ödeme İşlemleri'
      case 5:
        return '5. Dosya Kapatıldı'
      default:
        return '1. İhtiyaç Listesi & Maliyet & Onay'
    }
  }

  const formatMoney = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0,00'
    return val.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const rawJson = activeMeta
    ? JSON.stringify(
        {
          dtal_version: activeMeta.dtal_version,
          app_version: activeMeta.app_version,
          created_at: activeMeta.created_at,
          institution: activeMeta.institution,
          schema_version: activeMeta.schema_version
        },
        null,
        2
      )
    : ''

  return {
    activeMeta,
    activeFilePath,
    fileName,
    activeDosyaId,
    selectedFile,
    setSelectedFile,
    copied,
    handleCopyPath,
    changelog,
    backlog,
    activeHistoryTab,
    setActiveHistoryTab,
    showTechnicalDetails,
    setShowTechnicalDetails,
    dosyaData,
    kalemler,
    firmalar,
    birimAdi,
    loadingDosya,
    dteContentType,
    setDteContentType,
    dteStatus,
    dteLoading,
    handleExportDte,
    handleImportDte,
    dbStats,
    loadingStats,
    statsError,
    updaterStatus,
    updateVersion,
    updaterError,
    handleCheckUpdates,
    handleQuitAndInstall,
    getAsamaLabel,
    formatMoney,
    rawJson
  }
}
