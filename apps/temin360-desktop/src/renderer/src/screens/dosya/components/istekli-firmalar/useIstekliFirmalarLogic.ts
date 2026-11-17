import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../../../../store/workspaceStore'
import { dialogs } from '../../../../components/ui/AlertDialogProvider'

export interface TeminFirmaItem {
  id: number
  temin_firma_id: number
  firma_id?: number
  unvan: string
  kara_liste?: number
  kara_liste_neden?: string
  vergi_no?: string
  vergi_dairesi?: string
  deneyim_skoru?: number
  teklif_durumu?: string
  yasaklilik_durumu?: string
  yasaklilik_belgesi?: string | null
  telefon?: string
  email?: string
  adres?: string
  [key: string]: any
}

export function useIstekliFirmalarLogic() {
  const { activeDosyaId } = useWorkspaceStore()
  const [associatedFirms, setAssociatedFirms] = useState<TeminFirmaItem[]>([])
  const [allFirms, setAllFirms] = useState<TeminFirmaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFirmaForQuery, setActiveFirmaForQuery] = useState<TeminFirmaItem | null>(null)

  const loadFirms = async (): Promise<void> => {
    if (!activeDosyaId) return
    setLoading(true)
    try {
      const resAssoc = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT df.id as temin_firma_id, f.*, df.teklif_durumu, df.yasaklilik_durumu, df.yasaklilik_belgesi 
         FROM DATA_TeminFirma df 
         JOIN TANIM_Firma f ON df.firma_id = f.id 
         WHERE df.temin_dosya_id = ?`,
        [activeDosyaId]
      )
      const resAll = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM TANIM_Firma WHERE aktif_mi = 1 ORDER BY unvan ASC'
      )
      if (resAssoc.success) setAssociatedFirms(resAssoc.data)
      if (resAll.success) setAllFirms(resAll.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFirms()
  }, [activeDosyaId])

  const handleAddFirm = async (firma: TeminFirmaItem): Promise<void> => {
    if (associatedFirms.some((af) => af.id === firma.id || af.firma_id === firma.id)) {
      await dialogs.alert({
        title: 'Firma Zaten Ekli',
        message: 'Bu firma zaten eklenmiş.',
        variant: 'warning'
      })
      return
    }
    if (firma.kara_liste === 1) {
      const confirmAdd = await dialogs.confirm({
        title: 'Kara Liste Uyarısı',
        message:
          `⚠️ DİKKAT: "${firma.unvan}" firması KARA LİSTEDEDİR!\n\n` +
          `Gerekçe: ${firma.kara_liste_neden || 'Belirtilmemiş.'}\n\n` +
          `Yine de bu doğrudan temin dosyasına eklemek istiyor musunuz?`,
        variant: 'danger',
        confirmText: 'Yine de Ekle'
      })
      if (!confirmAdd) return
    }
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:run',
        "INSERT INTO DATA_TeminFirma (temin_dosya_id, firma_id, teklif_durumu) VALUES (?, ?, 'Davet Edildi')",
        [activeDosyaId, firma.id]
      )
      if (res.success) {
        loadFirms()
      } else {
        await dialogs.alert({
          title: 'Hata',
          message: 'Firma eklenirken hata: ' + res.error,
          variant: 'danger'
        })
      }
    } catch (err: any) {
      await dialogs.alert({
        title: 'Hata',
        message: err.message,
        variant: 'danger'
      })
    }
  }

  const handleRemoveFirm = async (teminFirmaId: number): Promise<void> => {
    const ok = await dialogs.confirm({
      title: 'Tedarikçiyi Kaldır',
      message: 'Bu tedarikçiyi dosyadan çıkarmak istediğinize emin misiniz?',
      variant: 'warning',
      confirmText: 'Evet, Çıkar'
    })
    if (!ok) return
    try {
      await window.electron.ipcRenderer.invoke(
        'db:run',
        'DELETE FROM DATA_TeminKalemTeklif WHERE temin_firma_id = ?',
        [teminFirmaId]
      )
      const res = await window.electron.ipcRenderer.invoke(
        'db:run',
        'DELETE FROM DATA_TeminFirma WHERE id = ?',
        [teminFirmaId]
      )
      if (res.success) loadFirms()
    } catch (err: any) {
      await dialogs.alert({
        title: 'Hata',
        message: err.message,
        variant: 'danger'
      })
    }
  }

  const handleCloseQueryModal = (): void => {
    setActiveFirmaForQuery(null)
    loadFirms()
  }

  const handleDeleteBelge = async (): Promise<void> => {
    if (!activeFirmaForQuery) return
    const ok = await dialogs.confirm({
      title: 'Belgeyi Kaldır',
      message: 'Bu belgeyi dosyadan kaldırmak istediğinize emin misiniz?',
      variant: 'warning',
      confirmText: 'Evet, Kaldır'
    })
    if (!ok) return
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminFirma SET yasaklilik_belgesi = NULL WHERE id = ?',
        [activeFirmaForQuery.temin_firma_id]
      )
      if (res.success) {
        setActiveFirmaForQuery({
          ...activeFirmaForQuery,
          yasaklilik_belgesi: null
        })
      }
    } catch (err: any) {
      await dialogs.alert({
        title: 'Hata',
        message: 'Belge kaldırılırken hata: ' + err.message,
        variant: 'danger'
      })
    }
  }

  const handleUploadBelge = async (): Promise<void> => {
    if (!activeFirmaForQuery) return
    try {
      const openRes = await window.electron.ipcRenderer.invoke('dialog:showOpenDialog')
      if (openRes.success && openRes.filePaths && openRes.filePaths.length > 0) {
        const uploadRes = await window.electron.ipcRenderer.invoke(
          'workspace:upload-file',
          openRes.filePaths[0]
        )
        if (uploadRes.success) {
          const dbRes = await window.electron.ipcRenderer.invoke(
            'db:run',
            'UPDATE DATA_TeminFirma SET yasaklilik_belgesi = ? WHERE id = ?',
            [uploadRes.relativePath, activeFirmaForQuery.temin_firma_id]
          )
          if (dbRes.success) {
            setActiveFirmaForQuery({
              ...activeFirmaForQuery,
              yasaklilik_belgesi: uploadRes.relativePath
            })
            await dialogs.alert({
              title: 'Başarılı',
              message: 'Sorgulama belgesi başarıyla dosyaya kaydedildi.',
              variant: 'success'
            })
          } else {
            await dialogs.alert({
              title: 'Hata',
              message: 'Veritabanına kaydedilirken hata: ' + dbRes.error,
              variant: 'danger'
            })
          }
        } else {
          await dialogs.alert({
            title: 'Hata',
            message: 'Dosya yüklenirken hata: ' + uploadRes.error,
            variant: 'danger'
          })
        }
      }
    } catch (err: any) {
      await dialogs.alert({
        title: 'Hata',
        message: 'Hata: ' + err.message,
        variant: 'danger'
      })
    }
  }

  const handleUpdateYasaklilikDurumu = async (status: string): Promise<void> => {
    if (!activeFirmaForQuery) return
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminFirma SET yasaklilik_durumu = ? WHERE id = ?',
        [status, activeFirmaForQuery.temin_firma_id]
      )
      if (res.success) {
        setActiveFirmaForQuery({
          ...activeFirmaForQuery,
          yasaklilik_durumu: status
        })
      }
    } catch (err: any) {
      await dialogs.alert({
        title: 'Hata',
        message: 'Durum güncellenirken hata: ' + err.message,
        variant: 'danger'
      })
    }
  }

  const unassociatedFirms = allFirms.filter(
    (f) =>
      !associatedFirms.some((af) => af.id === f.id) &&
      f.unvan.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return {
    associatedFirms,
    loading,
    searchQuery,
    setSearchQuery,
    activeFirmaForQuery,
    setActiveFirmaForQuery,
    unassociatedFirms,
    handleAddFirm,
    handleRemoveFirm,
    handleCloseQueryModal,
    handleDeleteBelge,
    handleUploadBelge,
    handleUpdateYasaklilikDurumu
  }
}
