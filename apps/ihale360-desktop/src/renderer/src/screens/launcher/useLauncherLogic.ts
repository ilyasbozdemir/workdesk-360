import React, { useState, useEffect } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from '../../components/providers/ThemeProvider'

export function useLauncherLogic() {
  const { openWorkspace, createWorkspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  // Modal states for creating a new institution
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [pendingFilePath, setPendingFilePath] = useState<string | null>(null)

  // Migration states
  const [showMigrationModal, setShowMigrationModal] = useState(false)
  const [migrationData, setMigrationData] = useState<{
    filePath: string
    pendingUpdates: any[]
  } | null>(null)

  const [institutionName, setInstitutionName] = useState('')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Recent files state
  const [recentFiles, setRecentFiles] = useState<
    { name: string; path: string; lastOpened: number }[]
  >([])

  useEffect(() => {
    // Fetch recent files on mount
    window.electron?.ipcRenderer
      .invoke('app:get-recent-files')
      .then((files) => {
        if (files) setRecentFiles(files)
      })
      .catch(console.error)
  }, [])

  const handleCreateNewFile = async (): Promise<void> => {
    try {
      const res = await window.electron?.ipcRenderer.invoke('dialog:showSaveDialog')
      if (!res.canceled && res.filePath) {
        const fileName = res.filePath.split(/[/\\]/).pop() || 'Yeni Kurum'
        const projectName = fileName.replace(/\.(ihale|ihale360)$/i, '')

        setPendingFilePath(res.filePath)
        setInstitutionName(projectName)
        setShowCreateModal(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleChangeSaveLocation = async (): Promise<void> => {
    try {
      const res = await window.electron?.ipcRenderer.invoke('dialog:showSaveDialog')
      if (!res.canceled && res.filePath) {
        const fileName = res.filePath.split(/[/\\]/).pop() || 'Yeni Kurum'
        const projectName = fileName.replace(/\.(ihale|ihale360)$/i, '')
        setPendingFilePath(res.filePath)
        if (
          !institutionName ||
          institutionName === 'Yeni Kurum' ||
          institutionName === 'Yeni Dosya'
        ) {
          setInstitutionName(projectName)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleModalSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!pendingFilePath) return

    setCreating(true)
    try {
      const result = await createWorkspace(
        pendingFilePath,
        institutionName,
        undefined,
        username,
        password
      )
      if (result.success) {
        queryClient.clear()
        setShowCreateModal(false)
        setPendingFilePath(null)
      } else {
        alert(`Kurum dosyası oluşturulamadı!\nHata: ${result.error || 'Bilinmeyen hata'}`)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Hata oluştu!\nHata: ${err.message || 'Bilinmeyen hata'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleOpenFile = async (): Promise<void> => {
    try {
      const res = await window.electron?.ipcRenderer.invoke('dialog:showOpenDialog')
      if (!res.canceled && res.filePath) {
        if (!res.filePath.toLowerCase().endsWith('.temin')) {
          alert('Yalnızca .temin uzantılı Temin 360 proje dosyaları desteklenmektedir.')
          return
        }

        const result = await openWorkspace(res.filePath, false)

        if (result.requiresMigration) {
          setMigrationData({
            filePath: res.filePath,
            pendingUpdates: result.pendingUpdates || []
          })
          setShowMigrationModal(true)
          return
        }

        if (result.success) {
          queryClient.clear()
        } else {
          alert(`Kurum dosyası açılamadı!\nHata: ${result.error || 'Bilinmeyen hata'}`)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenRecent = async (filePath: string): Promise<void> => {
    try {
      if (!filePath.toLowerCase().endsWith('.temin')) {
        alert('Yalnızca .temin uzantılı Temin 360 proje dosyaları desteklenmektedir.')
        return
      }

      const result = await openWorkspace(filePath, false)
      if (result.requiresMigration) {
        setMigrationData({
          filePath,
          pendingUpdates: result.pendingUpdates || []
        })
        setShowMigrationModal(true)
        return
      }
      if (result.success) {
        queryClient.clear()
      } else {
        const errorMsg = result.error || 'Bilinmeyen hata'
        if (
          errorMsg.includes('ENOENT') ||
          errorMsg.includes('bulunamadı') ||
          errorMsg.includes('no such file')
        ) {
          const remove = window.confirm(
            `Dosya bulunamadı veya taşınmış:\n${filePath}\n\nBu dosyayı son açılanlar listesinden kaldırmak ister misiniz?`
          )
          if (remove) {
            const updated = await window.electron?.ipcRenderer.invoke(
              'app:remove-recent-file',
              filePath
            )
            if (Array.isArray(updated)) {
              setRecentFiles(updated)
            } else {
              setRecentFiles((prev) => prev.filter((f) => f.path !== filePath))
            }
          }
        } else {
          alert(`Kurum dosyası açılamadı!\nHata: ${errorMsg}`)
        }
      }
    } catch (e: any) {
      console.error(e)
      alert(`Hata oluştu!\nHata: ${e?.message || 'Bilinmeyen hata'}`)
    }
  }

  const handleRemoveRecent = async (filePath: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    const confirmDelete = window.confirm(
      'Bu dosyayı son açılanlar listesinden kaldırmak istediğinize emin misiniz?'
    )
    if (!confirmDelete) return

    try {
      const res = await window.electron?.ipcRenderer.invoke('app:remove-recent-file', filePath)
      if (Array.isArray(res)) {
        setRecentFiles(res)
      } else {
        setRecentFiles((prev) => prev.filter((file) => file.path !== filePath))
      }
    } catch (err) {
      console.error('Son açılan dosya kaldırılırken hata oluştu:', err)
      setRecentFiles((prev) => prev.filter((file) => file.path !== filePath))
    }
  }

  const handleConfirmMigration = async (): Promise<void> => {
    if (!migrationData) return
    setCreating(true)
    try {
      const result = await openWorkspace(migrationData.filePath, true)
      if (result.success) {
        queryClient.clear()
        setShowMigrationModal(false)
        setMigrationData(null)
      } else {
        alert(`Veritabanı güncellenemedi veya dosya açılamadı!\nHata: ${result.error}`)
      }
    } catch (err: any) {
      alert(`Hata oluştu!\nHata: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleMinimize = (): void => window.electron?.ipcRenderer.send('window-minimize')
  const handleMaximize = (): void => window.electron?.ipcRenderer.send('window-maximize')
  const handleClose = (): void => {
    window.electron?.ipcRenderer.invoke('app:force-quit').catch(() => {
      window.electron?.ipcRenderer.send('window-close')
    })
  }

  return {
    theme,
    setTheme,
    showCreateModal,
    setShowCreateModal,
    showNetworkModal,
    setShowNetworkModal,
    pendingFilePath,
    setPendingFilePath,
    showMigrationModal,
    setShowMigrationModal,
    migrationData,
    setMigrationData,
    institutionName,
    setInstitutionName,
    username,
    setUsername,
    password,
    setPassword,
    creating,
    showPassword,
    setShowPassword,
    recentFiles,
    handleCreateNewFile,
    handleChangeSaveLocation,
    handleModalSubmit,
    handleOpenFile,
    handleOpenRecent,
    handleRemoveRecent,
    handleConfirmMigration,
    handleMinimize,
    handleMaximize,
    handleClose
  }
}
