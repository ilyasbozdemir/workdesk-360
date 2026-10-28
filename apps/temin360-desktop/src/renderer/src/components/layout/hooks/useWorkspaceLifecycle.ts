import { useEffect } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTabStore } from '../../../store/tabStore'
import { APP_ROUTES } from '../../../constants/routeConstants'

export function useWorkspaceLifecycle(
  isAnyWindowMode: boolean,
  navigate: (options: { to: string }) => void,
  queryClient: QueryClient
): void {
  const { activeFilePath, openWorkspace, loadActiveMeta } = useWorkspaceStore()
  const { loadSettings } = useSettingsStore()
  const { addTab, clearTabs } = useTabStore()

  // Listen for db change invalidations from main process
  useEffect(() => {
    if (!window.electron) return
    const removeListener = window.electron.ipcRenderer.on('db:invalidated', () => {
      queryClient.invalidateQueries()
      loadActiveMeta()
    })
    return () => {
      if (removeListener) removeListener()
    }
  }, [queryClient, loadActiveMeta])

  // Listen for tabs returned from detached windows
  useEffect(() => {
    if (!window.electron) return
    const removeListener = window.electron.ipcRenderer.on(
      'tab:returned-from-window',
      (_, data: { path: string }) => {
        addTab(data.path)
        navigate({ to: data.path })
      }
    )
    return () => {
      if (removeListener) removeListener()
    }
  }, [addTab, navigate])

  // When opened as a detached window, restore workspace context from URL params
  useEffect(() => {
    if (!isAnyWindowMode) return
    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const wpFromSearch = searchParams.get('wp')
    const wpFromHash = hashParams.get('wp')
    const workspacePath = wpFromSearch || wpFromHash

    const dosyaId =
      searchParams.get('dosyaId') ||
      hashParams.get('dosyaId') ||
      sessionStorage.getItem('workspace_dosya_id') ||
      localStorage.getItem('active_dosya_id')

    if (dosyaId) {
      sessionStorage.setItem('workspace_dosya_id', dosyaId)
      localStorage.setItem('active_dosya_id', dosyaId)
    }

    const decodedPath = workspacePath
      ? decodeURIComponent(workspacePath)
      : sessionStorage.getItem('workspace_path') || localStorage.getItem('workspace_path')

    if (decodedPath) {
      sessionStorage.setItem('workspace_path', decodedPath)
      sessionStorage.setItem('workspace_auth', 'true')

      useWorkspaceStore.setState({
        activeFilePath: decodedPath,
        fileName: decodedPath.split(/[/\\]/).pop() || 'Bilinmeyen Dosya',
        isAuthenticated: true,
        activeDosyaId: dosyaId ? parseInt(dosyaId, 10) : null
      })
      loadSettings()
      loadActiveMeta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnyWindowMode])

  useEffect(() => {
    if (isAnyWindowMode) return

    const handleDteFileOpen = async (filePath: string) => {
      const currentActivePath = useWorkspaceStore.getState().activeFilePath
      if (!currentActivePath) {
        alert(
          `Dışarıdan veri aktarım dosyası (.dte) algılandı, ancak aktif bir kurum dosyası açık değil.\nLütfen önce bir çalışma dosyası (.temin) açın veya oluşturun.`
        )
        return
      }

      const fileBaseName = filePath.split('\\').pop()?.split('/').pop() || 'veri'
      const confirmImport = confirm(
        `"${fileBaseName}" veri dosyasındaki kayıtları aktif kurumunuza aktarmak istiyor musunuz?`
      )

      if (!confirmImport) return

      try {
        const res = await window.electron.ipcRenderer.invoke('db:import-dte', filePath)
        if (res.success) {
          let msg = ''
          if (res.importedFirmsCount > 0) {
            msg += `${res.importedFirmsCount} adet firma `
          }
          if (res.importedItemsCount > 0) {
            msg += `${msg ? 've ' : ''}${res.importedItemsCount} adet malzeme/hizmet kalemi `
          }

          if (!msg) {
            msg = 'Aktarılacak yeni kayıt bulunamadı veya atlandı.'
          } else {
            msg += 'başarıyla içe aktarıldı.'
          }

          if (res.warnings && res.warnings.length > 0) {
            msg += `\n(Uyarılar: ${res.warnings.join(', ')})`
          }

          alert(msg)
          queryClient.clear()
        } else {
          alert(`İçe aktarma başarısız oldu!\nHata: ${res.error || 'Bilinmeyen hata'}`)
        }
      } catch (err: any) {
        alert(`İçe aktarma sırasında hata oluştu!\nHata: ${err.message}`)
      }
    }

    const handleOpenExternalWorkspace = async (filePath: string) => {
      if (!filePath) return
      try {
        if (filePath.toLowerCase().endsWith('.dte')) {
          handleDteFileOpen(filePath)
          return
        }

        if (!filePath.toLowerCase().endsWith('.temin')) {
          alert('Yalnızca .temin uzantılı Temin 360 proje dosyaları desteklenmektedir.')
          return
        }

        let result = await openWorkspace(filePath, false)
        if (result.requiresMigration) {
          result = await openWorkspace(filePath, true)
        }

        if (result.success) {
          queryClient.clear()
          clearTabs()
          navigate({ to: APP_ROUTES.DASHBOARD })
        } else if (result.error) {
          alert(`Çalışma dosyası açılamadı!\n\nDosya: ${filePath}\nHata: ${result.error}`)
        }
      } catch (err: any) {
        console.error('External file open error:', err)
        alert(`Çalışma dosyası açılırken hata oluştu!\n\nHata: ${err.message}`)
      }
    }

    let isMounted = true

    const initWorkspace = async (): Promise<void> => {
      try {
        const initialFile = await window.electron?.ipcRenderer.invoke('get-initial-file')
        if (initialFile) {
          console.log('[PageWrapper] Başlangıçta çift tıklanan dosya açılıyor:', initialFile)
          await handleOpenExternalWorkspace(initialFile)
          return
        }
      } catch (e) {
        console.warn('get-initial-file hatası:', e)
      }

      try {
        const res = await window.electron?.ipcRenderer.invoke('db:get-settings')
        const dbIsOpen = res && res.institutionName && !res.institutionName.includes('Hata')
        const targetPath = activeFilePath || localStorage.getItem('workspace_path')

        if (!dbIsOpen && targetPath && isMounted) {
          let result = await openWorkspace(targetPath, false)
          if (result.requiresMigration) {
            result = await openWorkspace(targetPath, true)
          }
          if (result.success) {
            queryClient.clear()
          } else {
            console.warn('Önceki çalışma alanı dosyası bulunamadı, son dosya kaydı temizleniyor:', targetPath)
            localStorage.removeItem('workspace_path')
            sessionStorage.removeItem('workspace_path')
          }
        }
      } catch (e) {
        console.warn('Otomatik son dosya yükleme başarısız:', e)
      }
    }

    initWorkspace()

    const removeListener = window.electron?.ipcRenderer.on(
      'open-external-file',
      async (_, filePath) => {
        handleOpenExternalWorkspace(filePath)
      }
    )

    const removeNavListener = window.electron?.ipcRenderer.on('app:navigate', (_, route) => {
      if (route) {
        navigate({ to: route })
      }
    })

    return () => {
      isMounted = false
      if (removeListener) removeListener()
      if (removeNavListener) removeNavListener()
    }
  }, [isAnyWindowMode, activeFilePath, clearTabs, navigate, openWorkspace, queryClient])
}
