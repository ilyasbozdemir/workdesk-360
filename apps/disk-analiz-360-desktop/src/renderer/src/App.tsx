import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  FolderOpen,
  HardDrive,
  History,
  Home,
  Layers,
  LayoutDashboard,
  Minus,
  Moon,
  Play,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  StopCircle,
  Sun,
  Terminal,
  Trash2,
  X
} from 'lucide-react'
import {
  AnalysisDashboardSummary,
  CleanupBatchSummary,
  CleanupCandidateGroup,
  CleanupExecutionItemRequest,
  CleanupHistoryRecord,
  DiskAnalyzerSettings,
  DriveInfo,
  DuplicateSummary,
  ExplorerDirectoryResponse,
  FilePreviewResponse,
  IndexedFileRecord,
  IndexedFolderRecord,
  PythonExitEvent,
  PythonMigrationReports,
  PythonOutputEvent,
  ScanErrorRecord,
  ScanProgressPayload,
  ScanSessionRecord,
  TreemapColorMode,
  TreemapViewResponse,
  VirtualFolderRecord
} from '../../shared/types'
import { InteractiveTreemapCanvas } from './components/InteractiveTreemapCanvas'
import { SmartArchiveExplorerView } from './components/SmartArchiveExplorerView'
import { SmartArchiveWorkspaceView } from './components/SmartArchiveWorkspaceView'
import { PythonEngineRunnerView } from './components/PythonEngineRunnerView'
import { PythonReportsAndCleanerView } from './components/PythonReportsAndCleanerView'

declare global {
  interface Window {
    diskAnalizAPI?: {
      getDrives: () => Promise<DriveInfo[]>
      selectFolderDialog: () => Promise<string | null>
      selectFolder?: () => Promise<string | null>
      startScan: (params: {
        rootPath: string
        detectDuplicates?: boolean
      }) => Promise<ScanSessionRecord>
      cancelScan: () => Promise<{ cancelled: boolean }>
      onScanProgress: (callback: (progress: ScanProgressPayload) => void) => () => void
      getDashboardSummary: (rootPath?: string) => Promise<AnalysisDashboardSummary | null>
      getTreemapView: (params: {
        rootPath: string
        folderPath?: string
      }) => Promise<TreemapViewResponse | null>
      searchFiles: (params?: {
        rootPath?: string
        parentPath?: string
        query?: string
        extension?: string
        minSizeBytes?: number
        sortBy?: 'size_desc' | 'size_asc' | 'name_asc' | 'mtime_asc' | 'mtime_desc'
        limit?: number
      }) => Promise<IndexedFileRecord[]>
      getDuplicates: (rootPath?: string) => Promise<DuplicateSummary>
      runDuplicateCheck: (
        rootPath?: string
      ) => Promise<{ summary: DuplicateSummary; stats: unknown }>
      getCleanupCandidates: (rootPath?: string) => Promise<CleanupCandidateGroup[]>
      executeTrashCleanup: (
        requests: CleanupExecutionItemRequest[]
      ) => Promise<CleanupBatchSummary>
      getCleanupHistory: (limit?: number) => Promise<CleanupHistoryRecord[]>
      getScanSessions: (limit?: number) => Promise<ScanSessionRecord[]>
      getScanErrors: (sessionId?: string) => Promise<ScanErrorRecord[]>
      getSettings: () => Promise<DiskAnalyzerSettings>
      updateSettings: (
        updates: Partial<DiskAnalyzerSettings>
      ) => Promise<DiskAnalyzerSettings>
      showInFolder: (targetPath: string) => Promise<boolean>
      listDirectory: (
        dirPath: string,
        options?: { maxDepth?: number }
      ) => Promise<ExplorerDirectoryResponse>
      openFile: (filePath: string) => Promise<{ success: boolean; message?: string }>
      addFileTag: (data: {
        filePath: string
        tag: string
      }) => Promise<{ success: boolean; tags: string[] }>
      removeFileTag: (data: {
        filePath: string
        tag: string
      }) => Promise<{ success: boolean; tags: string[] }>
      bulkTagFiles: (data: {
        filePaths: string[]
        tagsToAdd?: string[]
        tagsToRemove?: string[]
      }) => Promise<{ success: boolean; updatedCount: number }>
      getVirtualFolders: () => Promise<VirtualFolderRecord[]>
      saveVirtualFolders: (folders: VirtualFolderRecord[]) => Promise<{ success: boolean }>
      readFilePreview: (data: {
        filePath: string
        maxBytes?: number
      }) => Promise<FilePreviewResponse>
      runPythonTask: (data: {
        taskId: string
        scriptName: string
        args: string[]
      }) => Promise<{ success: boolean; pid?: number; message?: string }>
      stopPythonTask: (data: {
        taskId: string
      }) => Promise<{ success: boolean; message?: string }>
      onPythonOutput: (callback: (data: PythonOutputEvent) => void) => () => void
      onPythonExit: (callback: (data: PythonExitEvent) => void) => () => void
      getMigrationReports: () => Promise<PythonMigrationReports>
      checkFilesExist: (filePaths: string[]) => Promise<Record<string, boolean>>
      moveFiles: (data: {
        filePaths: string[]
        destinationFolder?: string
      }) => Promise<{
        success: boolean
        successCount: number
        failCount: number
        errors: Array<{ path: string; error: string }>
        targetFolder?: string
      }>
      deleteFiles: (data: {
        filePaths: string[]
        useRecycleBin?: boolean
      }) => Promise<{
        success: boolean
        successCount: number
        failCount: number
        errors: Array<{ path: string; error: string }>
      }>
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
    }
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let val = bytes
  let idx = 0
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024
    idx++
  }
  return `${val.toFixed(idx === 0 ? 0 : val >= 100 ? 0 : 1)} ${units[idx]}`
}

export function formatDateTr(msOrIso?: number | string): string {
  if (!msOrIso) return '-'
  const d = typeof msOrIso === 'number' ? new Date(msOrIso) : new Date(msOrIso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

type ActiveTab =
  | 'workspace'
  | 'overview'
  | 'explorer'
  | 'treemap'
  | 'python_runner'
  | 'python_reports'
  | 'files'
  | 'duplicates'
  | 'cleanup'
  | 'history'
  | 'settings'

export function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [pythonReports, setPythonReports] = useState<PythonMigrationReports | null>(null)

  // Sürücüler ve Seçili Kök Dizin
  const [drives, setDrives] = useState<DriveInfo[]>([])
  const [selectedRootPath, setSelectedRootPath] = useState<string>('')
  const [detectDuplicatesOnScan, setDetectDuplicatesOnScan] = useState<boolean>(true)

  // Tarama İlerlemesi
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<ScanProgressPayload | null>(null)

  // Veri Durumları
  const [dashboard, setDashboard] = useState<AnalysisDashboardSummary | null>(null)
  const [treemapView, setTreemapView] = useState<TreemapViewResponse | null>(null)
  const [currentTreemapFolder, setCurrentTreemapFolder] = useState<string>('')
  const [treemapHistoryStack, setTreemapHistoryStack] = useState<string[]>([])
  const [treemapColorMode, setTreemapColorMode] = useState<TreemapColorMode>('folder')
  const [selectedTreemapItemPath, setSelectedTreemapItemPath] = useState<string | null>(null)
  const [treemapExtFilter, setTreemapExtFilter] = useState<string>('all')
  const [treemapSortBy, setTreemapSortBy] = useState<
    'size_desc' | 'name_asc' | 'mtime_desc'
  >('size_desc')

  // Dosya Arama & Filtreleme
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const [fileExtFilter, setFileExtFilter] = useState('all')
  const [fileSortBy, setFileSortBy] = useState<
    'size_desc' | 'size_asc' | 'name_asc' | 'mtime_asc' | 'mtime_desc'
  >('size_desc')
  const [searchedFiles, setSearchedFiles] = useState<IndexedFileRecord[]>([])

  // Mükerrer Dosyalar
  const [duplicateSummary, setDuplicateSummary] = useState<DuplicateSummary>({
    totalGroups: 0,
    totalDuplicateFiles: 0,
    totalRecoverableBytes: 0,
    groups: []
  })

  // Güvenli Temizlik Adayları ve Seçim Sepeti
  const [cleanupGroups, setCleanupGroups] = useState<CleanupCandidateGroup[]>([])
  const [selectedCleanupMap, setSelectedCleanupMap] = useState<
    Map<string, CleanupExecutionItemRequest>
  >(new Map())
  const [showConfirmCleanupModal, setShowConfirmCleanupModal] = useState(false)
  const [lastCleanupResult, setLastCleanupResult] =
    useState<CleanupBatchSummary | null>(null)
  const [isExecutingCleanup, setIsExecutingCleanup] = useState(false)

  // Geçmiş ve Ayarlar
  const [scanSessions, setScanSessions] = useState<ScanSessionRecord[]>([])
  const [cleanupHistory, setCleanupHistory] = useState<CleanupHistoryRecord[]>([])
  const [scanErrors, setScanErrors] = useState<ScanErrorRecord[]>([])
  const [settings, setSettings] = useState<DiskAnalyzerSettings>({
    excludedPaths: [],
    largeFileThresholdMb: 100,
    oldFileThresholdDays: 180,
    followSymlinks: false
  })
  const [newExcludedPathInput, setNewExcludedPathInput] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 3200)
  }, [])

  const loadAllViews = useCallback(
    async (targetRoot?: string) => {
      const api = window.diskAnalizAPI
      if (!api) return

      const root = targetRoot ?? selectedRootPath
      const [
        drvList,
        dash,
        dups,
        candidates,
        sessions,
        clnHist,
        errs,
        cfg,
        pyReps
      ] = await Promise.all([
        api.getDrives(),
        api.getDashboardSummary(root || undefined),
        api.getDuplicates(root || undefined),
        api.getCleanupCandidates(root || undefined),
        api.getScanSessions(25),
        api.getCleanupHistory(100),
        api.getScanErrors(),
        api.getSettings(),
        api.getMigrationReports ? api.getMigrationReports() : Promise.resolve({})
      ])

      setDrives(drvList)
      setPythonReports(pyReps)
      if (!root && drvList.length > 0) {
        const nonSys = drvList.find((d) => !d.isSystemDrive && d.accessible) || drvList[0]
        setSelectedRootPath(nonSys.mountPath)
      }

      const effectiveRoot = dash?.session?.rootPath || root || drvList[0]?.mountPath || ''
      setDashboard(dash)
      setDuplicateSummary(dups)
      setCleanupGroups(candidates)
      setScanSessions(sessions)
      setCleanupHistory(clnHist)
      setScanErrors(errs)
      if (cfg) setSettings(cfg)

      if (effectiveRoot) {
        const tView = await api.getTreemapView({
          rootPath: effectiveRoot,
          folderPath: currentTreemapFolder || effectiveRoot
        })
        setTreemapView(tView)
        if (!currentTreemapFolder) {
          setCurrentTreemapFolder(effectiveRoot)
        }
      }

      const files = await api.searchFiles({
        rootPath: effectiveRoot || undefined,
        query: fileSearchQuery,
        extension: fileExtFilter,
        sortBy: fileSortBy,
        limit: 150
      })
      setSearchedFiles(files)
    },
    [
      selectedRootPath,
      currentTreemapFolder,
      fileSearchQuery,
      fileExtFilter,
      fileSortBy
    ]
  )

  useEffect(() => {
    loadAllViews()
  }, [])

  useEffect(() => {
    const api = window.diskAnalizAPI
    if (!api) return
    const unsubscribe = api.onScanProgress((progress) => {
      setScanProgress(progress)
    })
    return () => unsubscribe()
  }, [])

  // Dosya arama parametreleri değiştiğinde tabloyu güncelle
  useEffect(() => {
    const api = window.diskAnalizAPI
    if (!api) return
    const effectiveRoot = dashboard?.session?.rootPath || selectedRootPath
    api
      .searchFiles({
        rootPath: effectiveRoot || undefined,
        query: fileSearchQuery,
        extension: fileExtFilter,
        sortBy: fileSortBy,
        limit: 150
      })
      .then(setSearchedFiles)
      .catch(() => {})
  }, [fileSearchQuery, fileExtFilter, fileSortBy, selectedRootPath, dashboard?.session?.rootPath])

  // Tarama Başlat
  const handleStartScan = async (customPath?: string): Promise<void> => {
    const api = window.diskAnalizAPI
    if (!api) return
    const target = customPath || selectedRootPath
    if (!target) {
      showToast('Lütfen önce taranacak bir disk veya klasör seçin.')
      return
    }

    setSelectedRootPath(target)
    setCurrentTreemapFolder(target)
    setTreemapHistoryStack([])
    setSelectedTreemapItemPath(null)
    setIsScanning(true)

    try {
      const session = await api.startScan({
        rootPath: target,
        detectDuplicates: detectDuplicatesOnScan
      })
      await loadAllViews(session.rootPath)
      showToast(
        session.status === 'cancelled'
          ? `Tarama durduruldu (${session.totalFiles.toLocaleString('tr-TR')} dosya indekslendi).`
          : `Tarama tamamlandı: ${session.totalFiles.toLocaleString('tr-TR')} dosya (${formatBytes(session.totalBytes)}).`
      )
    } catch (err: unknown) {
      showToast(
        `Tarama hatası: ${err instanceof Error ? err.message : String(err)}`
      )
    } finally {
      setIsScanning(false)
    }
  }

  const handleCancelScan = async (): Promise<void> => {
    await window.diskAnalizAPI?.cancelScan()
    showToast('Tarama durdurma isteği gönderildi...')
  }

  const handleSelectCustomFolder = async (): Promise<void> => {
    const picked = await window.diskAnalizAPI?.selectFolderDialog()
    if (picked) {
      setSelectedRootPath(picked)
      setCurrentTreemapFolder(picked)
      setTreemapHistoryStack([])
      await loadAllViews(picked)
    }
  }

  // Treemap Recursive Klasör Gezinme (Drill-down)
  const navigateTreemapToFolder = async (
    targetFolderPath: string,
    pushHistory = true
  ): Promise<void> => {
    const api = window.diskAnalizAPI
    if (!api) return
    const effectiveRoot = dashboard?.session?.rootPath || selectedRootPath
    if (!effectiveRoot) return

    if (
      pushHistory &&
      currentTreemapFolder &&
      currentTreemapFolder.toLowerCase() !== targetFolderPath.toLowerCase()
    ) {
      setTreemapHistoryStack((prev) => [...prev, currentTreemapFolder])
    }

    setCurrentTreemapFolder(targetFolderPath)
    setSelectedTreemapItemPath(targetFolderPath)

    const view = await api.getTreemapView({
      rootPath: effectiveRoot,
      folderPath: targetFolderPath
    })
    setTreemapView(view)
  }

  const handleTreemapBack = async (): Promise<void> => {
    if (treemapHistoryStack.length === 0) return
    const previous = treemapHistoryStack[treemapHistoryStack.length - 1]
    setTreemapHistoryStack((prev) => prev.slice(0, -1))
    await navigateTreemapToFolder(previous, false)
  }

  const handleTreemapRoot = async (): Promise<void> => {
    const effectiveRoot = dashboard?.session?.rootPath || selectedRootPath
    if (!effectiveRoot) return
    setTreemapHistoryStack([])
    await navigateTreemapToFolder(effectiveRoot, false)
  }

  // Güvenli Temizlik Seçim Sepeti Yönetimi
  const toggleCleanupSelection = (
    item: CleanupExecutionItemRequest,
    duplicateGroupTotalCount?: number,
    duplicateGroupPaths?: string[]
  ): void => {
    setSelectedCleanupMap((prev) => {
      const next = new Map(prev)
      const key = item.fullPath.toLowerCase()
      if (next.has(key)) {
        next.delete(key)
        return next
      }

      // Mükerrer grupta son kopya koruması kontrolü
      if (
        duplicateGroupTotalCount &&
        duplicateGroupPaths &&
        duplicateGroupTotalCount >= 2
      ) {
        const alreadySelectedInGroup = duplicateGroupPaths.filter((p) =>
          next.has(p.toLowerCase())
        ).length
        if (alreadySelectedInGroup + 1 >= duplicateGroupTotalCount) {
          showToast(
            'Son kopya koruması: Mükerrer grupta en az 1 dosya korunmalıdır!'
          )
          return prev
        }
      }

      next.set(key, item)
      return next
    })
  }

  const selectedCleanupTotalBytes = useMemo(() => {
    let sum = 0
    for (const item of selectedCleanupMap.values()) {
      sum += item.expectedSizeBytes
    }
    return sum
  }, [selectedCleanupMap])

  const handleExecuteCleanup = async (): Promise<void> => {
    const api = window.diskAnalizAPI
    if (!api || selectedCleanupMap.size === 0) return

    setIsExecutingCleanup(true)
    try {
      const requests: CleanupExecutionItemRequest[] = Array.from(
        selectedCleanupMap.values()
      )
      const result = await api.executeTrashCleanup(requests)
      setLastCleanupResult(result)
      setSelectedCleanupMap(new Map())
      setShowConfirmCleanupModal(false)
      await loadAllViews()
      showToast(
        `${result.successCount} dosya Geri Dönüşüm Kutusu’na taşındı (${formatBytes(result.estimatedSavedBytes)}).`
      )
    } catch (err: unknown) {
      showToast(
        `Temizlik hatası: ${err instanceof Error ? err.message : String(err)}`
      )
    } finally {
      setIsExecutingCleanup(false)
    }
  }

  // Treemap & Liste Senkron Filtrelenmiş Öğeler
  const filteredTreemapNodes = useMemo(() => {
    if (!treemapView) return []
    return treemapView.treemapNodes.filter((n) => {
      if (treemapExtFilter === 'all') return true
      if (n.kind === 'folder') return true
      return (n.extension || '').toLowerCase() === treemapExtFilter.toLowerCase()
    })
  }, [treemapView, treemapExtFilter])

  const sortedTreemapListItems = useMemo(() => {
    if (!treemapView) return { folders: [] as IndexedFolderRecord[], files: [] as IndexedFileRecord[] }
    const folders = [...treemapView.childrenFolders]
    const files = treemapView.childrenFiles.filter((f) =>
      treemapExtFilter === 'all'
        ? true
        : f.extension.toLowerCase() === treemapExtFilter.toLowerCase()
    )

    if (treemapSortBy === 'name_asc') {
      folders.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      files.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    } else if (treemapSortBy === 'mtime_desc') {
      files.sort((a, b) => b.mtimeMs - a.mtimeMs)
    } else {
      folders.sort((a, b) => b.recursiveBytes - a.recursiveBytes)
      files.sort((a, b) => b.sizeBytes - a.sizeBytes)
    }

    return { folders, files }
  }, [treemapView, treemapExtFilter, treemapSortBy])

  const selectedTreemapDetails = useMemo(() => {
    if (!selectedTreemapItemPath || !treemapView) return null
    const lower = selectedTreemapItemPath.toLowerCase()
    const fld = treemapView.childrenFolders.find(
      (f) => f.fullPath.toLowerCase() === lower
    )
    if (fld) {
      return {
        kind: 'folder' as const,
        name: fld.name,
        fullPath: fld.fullPath,
        sizeBytes: fld.recursiveBytes,
        fileCount: fld.recursiveFileCount,
        folderCount: fld.recursiveFolderCount,
        updatedAt: fld.updatedAt
      }
    }
    const fl = treemapView.childrenFiles.find(
      (f) => f.fullPath.toLowerCase() === lower
    )
    if (fl) {
      return {
        kind: 'file' as const,
        name: fl.name,
        fullPath: fl.fullPath,
        sizeBytes: fl.sizeBytes,
        extension: fl.extension,
        mtimeMs: fl.mtimeMs,
        cleanupCategory: fl.cleanupCategory
      }
    }
    return null
  }, [selectedTreemapItemPath, treemapView])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* =========================================================================
          1. ÜST ÇUBUK (WorkDesk 360 Standart Kurumsal Başlık)
         ========================================================================= */}
      <header
        className="flex flex-col bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-50 select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />

        <div className="h-9 flex items-center justify-between px-3 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-sm tracking-tight">
              <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                D
              </div>
              <span>DİSK ANALİZ 360</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                Treemap & Güvenli Temizlik
              </span>
            </div>

            <nav className="flex items-center space-x-1 pl-2 text-xs text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('workspace')}
                className={`px-2.5 py-1 rounded transition-colors font-bold ${
                  activeTab === 'workspace'
                    ? 'bg-sky-600 text-white'
                    : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400'
                }`}
              >
                Görsel Dosya Çalışma Alanı
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-semibold"
              >
                Semantik Kümeleme
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('treemap')}
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                Disk Haritası (Treemap)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                Genel Bakış
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('python_runner')}
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors font-semibold text-emerald-600 dark:text-emerald-400"
              >
                Python Motoru
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('python_reports')}
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                Rapor & Betikler
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cleanup')}
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                Güvenli Temizlik
              </button>
              <button
                type="button"
                onClick={() => loadAllViews()}
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Yenile</span>
              </button>
            </nav>
          </div>

          {/* Orta: Aktif Hedef Sürücü / Dizin Bilgisi */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="flex items-center space-x-2 text-xs bg-slate-200/60 dark:bg-slate-800/70 px-3 py-1 rounded-full border border-slate-300/50 dark:border-slate-700/60 max-w-md truncate">
              <span
                className={`w-2 h-2 rounded-full ${
                  isScanning ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                Hedef: {selectedRootPath || 'Sürücü Seçilmedi'}
              </span>
              {dashboard?.session && (
                <span className="text-slate-400">
                  ({formatBytes(dashboard.session.totalBytes)})
                </span>
              )}
            </div>
          </div>

          {/* Sağ: Tema ve Pencere Kontrolleri */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              title={isDarkMode ? 'Açık Tema' : 'Koyu Tema'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="flex items-center pl-2 space-x-1 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.diskAnalizAPI?.minimizeWindow()}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                title="Küçült"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => window.diskAnalizAPI?.maximizeWindow()}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                title="Ekranı Kapla"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => window.diskAnalizAPI?.closeWindow()}
                className="p-1.5 rounded hover:bg-red-600 hover:text-white text-slate-400 transition-colors"
                title="Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Alt Hızlı Eylem Çubuğu */}
        <div className="h-11 px-4 flex items-center justify-between bg-slate-100/90 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <select
              value={selectedRootPath}
              onChange={(e) => {
                setSelectedRootPath(e.target.value)
                setCurrentTreemapFolder(e.target.value)
                setTreemapHistoryStack([])
                loadAllViews(e.target.value)
              }}
              className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-800 dark:text-slate-100"
            >
              {drives.map((drv) => (
                <option key={drv.mountPath} value={drv.mountPath}>
                  {drv.driveCode} {drv.label} ({formatBytes(drv.usedBytes)} /{' '}
                  {formatBytes(drv.totalBytes)} - %{drv.usagePercent})
                </option>
              ))}
              {selectedRootPath &&
                !drives.some(
                  (d) =>
                    d.mountPath.toLowerCase() === selectedRootPath.toLowerCase()
                ) && (
                  <option value={selectedRootPath}>
                    Özel Klasör: {selectedRootPath}
                  </option>
                )}
            </select>

            <button
              type="button"
              onClick={handleSelectCustomFolder}
              disabled={isScanning}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Klasör Seç...</span>
            </button>

            {!isScanning ? (
              <button
                type="button"
                onClick={() => handleStartScan()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Taramayı Başlat</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelScan}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Taramayı Durdur</span>
              </button>
            )}

            <label className="flex items-center space-x-1.5 pl-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={detectDuplicatesOnScan}
                onChange={(e) => setDetectDuplicatesOnScan(e.target.checked)}
                className="rounded border-slate-600"
              />
              <span>3 Aşamalı SHA-256 Mükerrer Doğrulaması</span>
            </label>
          </div>

          {/* Sağ: Güvenli Temizlik Sepeti Özeti */}
          <div className="flex items-center space-x-2">
            {selectedCleanupMap.size > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmCleanupModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  Çöp Kutusu Onayı ({selectedCleanupMap.size} Dosya •{' '}
                  {formatBytes(selectedCleanupTotalBytes)})
                </span>
              </button>
            )}
            <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Salt-Okunur Tarama & Çöp Kutusu Koruması Aktif</span>
            </div>
          </div>
        </div>

        {/* Canlı Tarama İlerleme Şeridi */}
        {isScanning && scanProgress && (
          <div className="px-4 py-2 bg-blue-950/80 border-t border-blue-800/60 flex items-center justify-between text-xs text-blue-100">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              <span className="font-semibold shrink-0">
                {scanProgress.phase === 'scanning_tree'
                  ? 'Dizin Ağacı Taranıyor...'
                  : scanProgress.phase === 'aggregating_folders'
                    ? 'Klasör Boyutları Hesaplanıyor...'
                    : 'Mükerrer Dosyalar SHA-256 ile Doğrulanıyor...'}
              </span>
              <span className="text-blue-300 truncate text-[11px]">
                {scanProgress.currentPath}
              </span>
            </div>
            <div className="flex items-center space-x-4 shrink-0 text-[11px]">
              <span>
                Dosya: <b>{scanProgress.scannedFiles.toLocaleString('tr-TR')}</b>
              </span>
              <span>
                Klasör: <b>{scanProgress.scannedFolders.toLocaleString('tr-TR')}</b>
              </span>
              <span>
                Boyut: <b>{formatBytes(scanProgress.totalBytes)}</b>
              </span>
              <span>
                Önbellek Hash: <b>{scanProgress.incrementalReusedCount}</b>
              </span>
              <span>
                Süre: <b>{(scanProgress.elapsedMs / 1000).toFixed(1)} sn</b>
              </span>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. ANA GÖVDE: SOL SIDEBAR + İÇERİK ALANI
         ========================================================================= */}
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-200 shrink-0 select-none ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="h-11 flex items-center justify-between px-3 border-b border-slate-800">
            {!sidebarCollapsed ? (
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Disk Yönetimi
                </span>
              </div>
            ) : (
              <HardDrive className="w-4 h-4 text-blue-400 mx-auto" />
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            {[
              {
                id: 'workspace' as const,
                label: 'Görsel Çalışma Alanı (TagSpaces)',
                icon: LayoutDashboard,
                badge: undefined
              },
              {
                id: 'overview' as const,
                label: 'Genel Bakış & Diskler',
                icon: HardDrive,
                badge: drives.length
              },
              {
                id: 'explorer' as const,
                label: 'Semantik Kümeleme Gezgini',
                icon: FolderOpen,
                badge: undefined
              },
              {
                id: 'treemap' as const,
                label: 'Disk Haritası (Treemap)',
                icon: Layers,
                badge: treemapView?.childrenFolders.length
              },
              {
                id: 'python_runner' as const,
                label: 'Python Motoru & Konsol',
                icon: Terminal,
                badge: undefined
              },
              {
                id: 'python_reports' as const,
                label: 'Python Rapor & Betikler',
                icon: BarChart2,
                badge:
                  pythonReports?.duplicate?.summary?.duplicate_groups_count ||
                  pythonReports?.duplicate?.duplicates?.length
              },
              {
                id: 'files' as const,
                label: 'Büyük & Eski Dosyalar',
                icon: FileSearch,
                badge: dashboard?.session?.totalFiles
              },
              {
                id: 'duplicates' as const,
                label: 'Mükerrer Analiz (SQLite)',
                icon: Copy,
                badge: duplicateSummary.totalGroups
              },
              {
                id: 'cleanup' as const,
                label: 'Güvenli Temizlik',
                icon: Sparkles,
                badge: selectedCleanupMap.size || undefined
              },
              {
                id: 'history' as const,
                label: 'İşlem & Hata Geçmişi',
                icon: History,
                badge: scanErrors.length || undefined
              },
              {
                id: 'settings' as const,
                label: 'Kapsam & Ayarlar',
                icon: Settings
              }
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="p-2.5 border-t border-slate-800 text-[11px] text-slate-400">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="text-slate-200 font-medium">
                    Native Python + SQLite WAL
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Win32 ctypes • os.scandir • SHA-256
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ANA İÇERİK PANELİ */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {toastMessage && (
            <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-blue-500/60 text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* =====================================================================
              ARŞİV 360 SEKMELERİ: GÖRSEL ÇALIŞMA ALANI (TAGSPACES), AKILLI GEZGİN, PYTHON MOTORU
             ===================================================================== */}
          {activeTab === 'workspace' && (
            <div className="h-[calc(100vh-7.5rem)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <SmartArchiveWorkspaceView
                drives={drives}
                initialDir={selectedRootPath || 'D:\\'}
                isDarkMode={isDarkMode}
                onSendToPythonRunner={(dir) => {
                  setSelectedRootPath(dir)
                  setActiveTab('python_runner')
                }}
                onOpenInTreemap={(dir) => {
                  setSelectedRootPath(dir)
                  setCurrentTreemapFolder(dir)
                  setActiveTab('treemap')
                  loadAllViews(dir)
                }}
              />
            </div>
          )}

          {activeTab === 'explorer' && (
            <div className="h-[calc(100vh-7.5rem)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <SmartArchiveExplorerView
                drives={drives}
                initialDir={selectedRootPath || 'D:\\'}
                isDarkMode={isDarkMode}
                onSendToPythonRunner={(dir) => {
                  setSelectedRootPath(dir)
                  setActiveTab('python_runner')
                }}
                onOpenInTreemap={(dir) => {
                  setSelectedRootPath(dir)
                  setCurrentTreemapFolder(dir)
                  setActiveTab('treemap')
                  loadAllViews(dir)
                }}
              />
            </div>
          )}

          {activeTab === 'python_runner' && (
            <div className="h-[calc(100vh-7.5rem)]">
              <PythonEngineRunnerView
                drives={drives}
                sourceDir={selectedRootPath || 'D:\\'}
                onChangeSourceDir={(dir) => setSelectedRootPath(dir)}
                onReportsUpdated={() => {
                  loadAllViews()
                  showToast('Python görevi tamamlandı ve raporlar güncellendi.')
                }}
              />
            </div>
          )}

          {activeTab === 'python_reports' && (
            <PythonReportsAndCleanerView
              reports={pythonReports}
              onReloadReports={async () => {
                await loadAllViews()
                showToast('Python raporları yeniden yüklendi.')
              }}
              onNavigateToPythonRunner={() => setActiveTab('python_runner')}
              onShowToast={showToast}
            />
          )}

          {/* =====================================================================
              EKRAN 1: GENEL BAKIŞ (OVERVIEW)
             ===================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Sürücü Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {drives.map((drv) => {
                  const isSelected =
                    selectedRootPath.toLowerCase() === drv.mountPath.toLowerCase()
                  return (
                    <div
                      key={drv.mountPath}
                      onClick={() => {
                        setSelectedRootPath(drv.mountPath)
                        setCurrentTreemapFolder(drv.mountPath)
                        loadAllViews(drv.mountPath)
                      }}
                      className={`cursor-pointer rounded-xl p-4 border transition-all ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="font-bold text-sm">
                              {drv.driveCode} {drv.label}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {drv.fileSystem} •{' '}
                              {drv.isSystemDrive ? 'Sistem Sürücüsü' : 'Veri Birimi'}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            drv.usagePercent >= 85
                              ? 'bg-red-500/20 text-red-400'
                              : drv.usagePercent >= 70
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          %{drv.usagePercent} Dolu
                        </span>
                      </div>

                      <div className="mt-3 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            drv.usagePercent >= 85
                              ? 'bg-red-500'
                              : drv.usagePercent >= 70
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, drv.usagePercent)}%` }}
                        />
                      </div>

                      <div className="mt-2.5 flex justify-between text-[11px] text-slate-400">
                        <span>Kullanılan: {formatBytes(drv.usedBytes)}</span>
                        <span>Boş: {formatBytes(drv.freeBytes)}</span>
                        <span>Toplam: {formatBytes(drv.totalBytes)}</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">
                          {drv.accessible ? 'Erişilebilir' : drv.error}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartScan(drv.mountPath)
                          }}
                          disabled={isScanning}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold"
                        >
                          Bu Sürücüyü Tara
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Son Tarama Özet Kartları */}
              {dashboard?.session ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Taranan Konum</div>
                      <div className="font-bold text-sm truncate mt-0.5">
                        {dashboard.session.rootPath}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">
                        Durum: {dashboard.session.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">İndekslenen Boyut</div>
                      <div className="font-bold text-base text-blue-400 mt-0.5">
                        {formatBytes(dashboard.session.totalBytes)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {dashboard.session.totalFiles.toLocaleString('tr-TR')} dosya •{' '}
                        {dashboard.session.totalFolders.toLocaleString('tr-TR')} klasör
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">
                        Doğrulanmış Mükerrer Kazanımı
                      </div>
                      <div className="font-bold text-base text-amber-400 mt-0.5">
                        {formatBytes(duplicateSummary.totalRecoverableBytes)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {duplicateSummary.totalGroups} grup (en az 1 kopya korunarak)
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Artımlı Hash Önbelleği</div>
                      <div className="font-bold text-base text-emerald-400 mt-0.5">
                        {dashboard.session.incrementalReusedCount.toLocaleString('tr-TR')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Değişmeyen dosya yeniden hash’lenmedi
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <div className="text-[11px] text-slate-400">Atlanan / İzin Hataları</div>
                      <div className="font-bold text-base text-slate-200 mt-0.5">
                        {dashboard.session.skippedCount + dashboard.session.errorCount}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Symlink/Junction: {dashboard.session.skippedCount} • Hata:{' '}
                        {dashboard.session.errorCount}
                      </div>
                    </div>
                  </div>

                  {/* En Çok Alan Kullanan Klasörler & Uzantı Dağılımı */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          En Çok Alan Kullanan Klasörler
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('treemap')}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          Etkileşimli Haritada Aç →
                        </button>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {dashboard.topFolders.slice(0, 12).map((fld) => {
                          const pct =
                            dashboard.session && dashboard.session.totalBytes > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    (fld.recursiveBytes /
                                      dashboard.session.totalBytes) *
                                      100
                                  )
                                )
                              : 0
                          return (
                            <div
                              key={fld.fullPath}
                              onClick={() => {
                                setActiveTab('treemap')
                                navigateTreemapToFolder(fld.fullPath)
                              }}
                              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="font-semibold text-slate-100 truncate">
                                  📁 {fld.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {fld.fullPath}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-bold text-blue-400">
                                  {formatBytes(fld.recursiveBytes)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  %{pct} • {fld.recursiveFileCount} dosya
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Dosya Türlerine ve Boyut Aralıklarına Göre Dağılım */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                          Uzantı ve Dosya Türüne Göre Dağılım
                        </h3>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {dashboard.extensionStats.slice(0, 10).map((ext) => (
                            <div
                              key={ext.extension}
                              className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-semibold text-blue-400">
                                  {ext.extension}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {ext.categoryLabel} ({ext.fileCount} dosya)
                                </span>
                              </div>
                              <div className="font-semibold">
                                {formatBytes(ext.totalBytes)} (%{ext.percentage})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                          Boyut Aralıklarına Göre Dağılım
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {dashboard.sizeBuckets.map((b) => (
                            <div
                              key={b.bucketId}
                              className="p-2 rounded bg-slate-800/40 border border-slate-800 text-xs flex justify-between"
                            >
                              <span className="text-slate-300 truncate">{b.label}</span>
                              <span className="font-bold text-blue-400 shrink-0 ml-2">
                                {formatBytes(b.totalBytes)} ({b.fileCount})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <HardDrive className="w-10 h-10 text-blue-500 mx-auto" />
                  <div className="text-sm font-bold">
                    Analize Başlamak İçin Yukarıdan Bir Sürücü veya Klasör Seçip Taramayı Başlatın
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl mx-auto">
                    Disk Analiz 360 tarama sırasında hiçbir dosyayı silmez veya değiştirmez.
                    Sonuçlar yerel SQLite WAL indeksine kaydedilir ve etkileşimli Treemap
                    haritası üzerinde anında gezinebilir hale gelir.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              EKRAN 2: ETKİLEŞİMLİ DİSK HARİTASI (TREEMAP & KLASÖR GEZGİNİ)
             ===================================================================== */}
          {activeTab === 'treemap' && (
            <div className="flex flex-col space-y-3 h-[calc(100vh-130px)]">
              {/* Üst Gezinme Çubuğu: Geri, Kök, Breadcrumb ve Renk/Sıralama Kontrolleri */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={handleTreemapBack}
                    disabled={treemapHistoryStack.length === 0}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs flex items-center space-x-1"
                    title="Bir Önceki Klasöre Dön"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Geri</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTreemapRoot}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs flex items-center space-x-1"
                    title="Kök Dizine Dön"
                  >
                    <Home className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kök Dizin</span>
                  </button>

                  {/* Tıklanabilir Breadcrumb Yolu */}
                  <div className="flex items-center space-x-1 overflow-x-auto px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs max-w-2xl">
                    {(treemapView?.breadcrumbs || []).map((crumb, idx, arr) => (
                      <React.Fragment key={crumb.fullPath}>
                        <button
                          type="button"
                          onClick={() => navigateTreemapToFolder(crumb.fullPath)}
                          className={`hover:text-blue-400 truncate max-w-[160px] ${
                            idx === arr.length - 1
                              ? 'font-bold text-blue-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {crumb.name}
                        </button>
                        {idx < arr.length - 1 && (
                          <span className="text-slate-600">/</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Sağ: Seçili Klasör Özeti ve Renk Modu */}
                <div className="flex items-center space-x-2 text-xs">
                  {treemapView?.currentFolder && (
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">
                      Toplam:{' '}
                      <b className="text-blue-400">
                        {formatBytes(treemapView.currentFolder.recursiveBytes)}
                      </b>{' '}
                      • {treemapView.currentFolder.recursiveFileCount} dosya •{' '}
                      {treemapView.currentFolder.recursiveFolderCount} alt klasör
                    </span>
                  )}

                  <select
                    value={treemapExtFilter}
                    onChange={(e) => setTreemapExtFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                  >
                    <option value="all">Uzantı: Tümü</option>
                    {dashboard?.extensionStats.map((ext) => (
                      <option key={ext.extension} value={ext.extension}>
                        {ext.extension}
                      </option>
                    ))}
                  </select>

                  <select
                    value={treemapColorMode}
                    onChange={(e) =>
                      setTreemapColorMode(e.target.value as TreemapColorMode)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                  >
                    <option value="folder">Renk: Klasör Hiyerarşisi</option>
                    <option value="extension">Renk: Dosya Türü (Uzantı)</option>
                    <option value="size_range">Renk: Boyut Aralığı</option>
                    <option value="age">Renk: Dosya Yaşı</option>
                  </select>

                  <select
                    value={treemapSortBy}
                    onChange={(e) =>
                      setTreemapSortBy(
                        e.target.value as 'size_desc' | 'name_asc' | 'mtime_desc'
                      )
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                  >
                    <option value="size_desc">Sırala: Boyut (Azalan)</option>
                    <option value="name_asc">Sırala: Ad (A-Z)</option>
                    <option value="mtime_desc">Sırala: Tarih (Yeni)</option>
                  </select>
                </div>
              </div>

              {/* Bayat İndeks Uyarısı */}
              {treemapView?.isIndexStale && (
                <div className="bg-amber-950/60 border border-amber-600/60 text-amber-200 px-3 py-2 rounded-lg text-xs flex items-center justify-between">
                  <span>
                    ⚠️ {treemapView.staleReason || 'İndeks verileri güncel olmayabilir.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartScan()}
                    className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-semibold"
                  >
                    Şimdi Yeniden Tara
                  </button>
                </div>
              )}

              {/* Üst Yarı: Etkileşimli Canvas Treemap */}
              <div className="flex-1 min-h-[300px]">
                <InteractiveTreemapCanvas
                  nodes={filteredTreemapNodes}
                  colorMode={treemapColorMode}
                  selectedPath={selectedTreemapItemPath}
                  onSelectNode={(node) => {
                    if (node.kind !== 'aggregated_small') {
                      setSelectedTreemapItemPath(node.fullPath)
                    }
                  }}
                  onDrillDownFolder={(folderPath) => navigateTreemapToFolder(folderPath)}
                  onOpenInExplorer={(targetPath) =>
                    window.diskAnalizAPI?.showInFolder(targetPath)
                  }
                  onAddFileToCleanup={(node) => {
                    if (node.kind === 'file') {
                      toggleCleanupSelection({
                        fullPath: node.fullPath,
                        expectedSizeBytes: node.sizeBytes,
                        expectedMtimeMs: node.mtimeMs || 0
                      })
                      showToast(`Temizlik önizlemesine eklendi: ${node.name}`)
                    }
                  }}
                  formatBytes={formatBytes}
                />
              </div>

              {/* Alt Yarı: Senkronize Klasör/Dosya Listesi + Seçili Öğe Denetçisi */}
              <div className="h-60 grid grid-cols-1 lg:grid-cols-3 gap-3 shrink-0">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      Klasör İçeriği ({sortedTreemapListItems.folders.length} Klasör,{' '}
                      {sortedTreemapListItems.files.length} Dosya)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tek tık: Haritada seç • Klasöre çift tık: İçine gir
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                    {sortedTreemapListItems.folders.map((fld) => {
                      const isSel =
                        selectedTreemapItemPath?.toLowerCase() ===
                        fld.fullPath.toLowerCase()
                      return (
                        <div
                          key={fld.fullPath}
                          onClick={() => setSelectedTreemapItemPath(fld.fullPath)}
                          onDoubleClick={() => navigateTreemapToFolder(fld.fullPath)}
                          className={`px-3 py-1.5 flex items-center justify-between cursor-pointer ${
                            isSel
                              ? 'bg-blue-600/25 text-white'
                              : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                            <span>📁</span>
                            <span className="font-semibold truncate">{fld.name}</span>
                            <span className="text-[10px] text-slate-400">
                              ({fld.recursiveFileCount} dosya)
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="font-bold text-blue-400">
                              {formatBytes(fld.recursiveBytes)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigateTreemapToFolder(fld.fullPath)
                              }}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-[10px]"
                            >
                              İçine Gir →
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {sortedTreemapListItems.files.map((fl) => {
                      const isSel =
                        selectedTreemapItemPath?.toLowerCase() ===
                        fl.fullPath.toLowerCase()
                      return (
                        <div
                          key={fl.fullPath}
                          onClick={() => setSelectedTreemapItemPath(fl.fullPath)}
                          onDoubleClick={() =>
                            window.diskAnalizAPI?.showInFolder(fl.fullPath)
                          }
                          className={`px-3 py-1.5 flex items-center justify-between cursor-pointer ${
                            isSel
                              ? 'bg-blue-600/25 text-white'
                              : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                            <span>📄</span>
                            <span className="truncate">{fl.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {fl.extension}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="text-[10px] text-slate-400">
                              {formatDateTr(fl.mtimeMs)}
                            </span>
                            <span className="font-semibold text-emerald-400">
                              {formatBytes(fl.sizeBytes)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Sağ: Seçili Öğe Ayrıntı Paneli */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between text-xs">
                  {selectedTreemapDetails ? (
                    <div className="space-y-2">
                      <div className="font-bold text-sm text-white truncate">
                        {selectedTreemapDetails.kind === 'folder' ? '📁 ' : '📄 '}
                        {selectedTreemapDetails.name}
                      </div>
                      <div className="text-[11px] text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800 max-h-16 overflow-y-auto">
                        {selectedTreemapDetails.fullPath}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-slate-400">Boyut: </span>
                          <b className="text-blue-400">
                            {formatBytes(selectedTreemapDetails.sizeBytes)}
                          </b>
                        </div>
                        {selectedTreemapDetails.kind === 'folder' ? (
                          <div>
                            <span className="text-slate-400">İçerik: </span>
                            <b>
                              {selectedTreemapDetails.fileCount} dosya /{' '}
                              {selectedTreemapDetails.folderCount} klasör
                            </b>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400">Tarih: </span>
                            <b>{formatDateTr(selectedTreemapDetails.mtimeMs)}</b>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center my-auto">
                      Harita veya listeden bir dosya/klasör seçerek ayrıntılarını görüntüleyin.
                    </div>
                  )}

                  {selectedTreemapDetails && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                      {selectedTreemapDetails.kind === 'folder' && (
                        <button
                          type="button"
                          onClick={() =>
                            navigateTreemapToFolder(selectedTreemapDetails.fullPath)
                          }
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          Klasöre Gir
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          window.diskAnalizAPI?.showInFolder(
                            selectedTreemapDetails.fullPath
                          )
                        }
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Gezgin’de Göster</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            selectedTreemapDetails.fullPath
                          )
                          showToast('Tam yol panoya kopyalandı.')
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700"
                      >
                        Yolu Kopyala
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              EKRAN 3: BÜYÜK & ESKİ DOSYA İNCELEME (FILES)
             ===================================================================== */}
          {activeTab === 'files' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    placeholder="Dosya adı veya tam yol içinde ara..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs"
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <select
                    value={fileExtFilter}
                    onChange={(e) => setFileExtFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5"
                  >
                    <option value="all">Tüm Uzantılar</option>
                    {dashboard?.extensionStats.map((e) => (
                      <option key={e.extension} value={e.extension}>
                        {e.extension} ({e.fileCount})
                      </option>
                    ))}
                  </select>
                  <select
                    value={fileSortBy}
                    onChange={(e) =>
                      setFileSortBy(
                        e.target.value as
                          | 'size_desc'
                          | 'size_asc'
                          | 'name_asc'
                          | 'mtime_asc'
                          | 'mtime_desc'
                      )
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5"
                  >
                    <option value="size_desc">En Büyük Dosyalar</option>
                    <option value="mtime_asc">En Eski Değiştirilenler</option>
                    <option value="mtime_desc">En Yeni Değiştirilenler</option>
                    <option value="name_asc">Dosya Adı (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-2.5">Seç</th>
                      <th className="p-2.5">Dosya Adı & Tam Yolu</th>
                      <th className="p-2.5">Uzantı</th>
                      <th className="p-2.5">Son Değiştirilme</th>
                      <th className="p-2.5 text-right">Boyut</th>
                      <th className="p-2.5 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {searchedFiles.map((file) => {
                      const checked = selectedCleanupMap.has(
                        file.fullPath.toLowerCase()
                      )
                      return (
                        <tr key={file.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleCleanupSelection({
                                  fullPath: file.fullPath,
                                  expectedSizeBytes: file.sizeBytes,
                                  expectedMtimeMs: file.mtimeMs
                                })
                              }
                            />
                          </td>
                          <td className="p-2.5 max-w-lg">
                            <div className="font-semibold text-slate-100 truncate">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {file.fullPath}
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-blue-400">
                            {file.extension}
                          </td>
                          <td className="p-2.5 text-slate-300">
                            {formatDateTr(file.mtimeMs)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-400">
                            {formatBytes(file.sizeBytes)}
                          </td>
                          <td className="p-2.5 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                window.diskAnalizAPI?.showInFolder(file.fullPath)
                              }
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px]"
                            >
                              Konumu Aç
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(file.fullPath)
                                showToast('Tam yol kopyalandı.')
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px]"
                            >
                              Kopyala
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =====================================================================
              EKRAN 4: MÜKERRER DOSYALAR (3 AŞAMALI TAM SHA-256 DOĞRULAMALI)
             ===================================================================== */}
          {activeTab === 'duplicates' && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Doğrulanmış Mükerrer Dosya Grupları (Boyut + 64KB Ön Eleme + Tam SHA-256)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hangi dosyanın orijinal olduğu kendiliğinden varsayılmaz. Her grupta en az 1
                    kopya korunur; kazanılabilir maksimum alan <b>(N - 1) × Boyut</b> formülüyle
                    hesaplanır.
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800">
                    Grup: <b>{duplicateSummary.totalGroups}</b>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    Maks. Kazanılabilir Alan:{' '}
                    <b>{formatBytes(duplicateSummary.totalRecoverableBytes)}</b>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {duplicateSummary.groups.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                    Bu tarama kapsamında doğrulanmış mükerrer dosya grubu bulunmadı.
                  </div>
                ) : (
                  duplicateSummary.groups.map((grp) => {
                    const groupPaths = grp.files.map((f) => f.fullPath)
                    const selectedInGroup = grp.files.filter((f) =>
                      selectedCleanupMap.has(f.fullPath.toLowerCase())
                    )
                    return (
                      <div
                        key={grp.groupKey}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                      >
                        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-semibold">
                              {grp.fileCount} Kopya
                            </span>
                            <span className="text-slate-300">
                              Birim Boyut: <b>{formatBytes(grp.sizeBytes)}</b>
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              SHA-256: {grp.sha256.slice(0, 20)}...
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-slate-400">
                              Korunacak: <b>{grp.fileCount - selectedInGroup.length}</b>
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              Maks. Kazanım ((N-1)×S):{' '}
                              {formatBytes(grp.maxRecoverableBytes)}
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-800/60 text-xs">
                          {grp.files.map((f) => {
                            const isChecked = selectedCleanupMap.has(
                              f.fullPath.toLowerCase()
                            )
                            return (
                              <div
                                key={f.id}
                                className="px-4 py-2 flex items-center justify-between hover:bg-slate-800/40"
                              >
                                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      toggleCleanupSelection(
                                        {
                                          fullPath: f.fullPath,
                                          expectedSizeBytes: f.sizeBytes,
                                          expectedMtimeMs: f.mtimeMs,
                                          duplicateGroupSha256: grp.sha256
                                        },
                                        grp.fileCount,
                                        groupPaths
                                      )
                                    }
                                  />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-100 truncate">
                                      {f.name}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate">
                                      {f.fullPath}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 shrink-0">
                                  <span className="text-[11px] text-slate-400">
                                    Değiştirilme: {formatDateTr(f.mtimeMs)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.diskAnalizAPI?.showInFolder(f.fullPath)
                                    }
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px]"
                                  >
                                    Klasörde Göster
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* =====================================================================
              EKRAN 5: GÜVENLİ TEMİZLİK ÖNERİLERİ (SAFE CLEANUP)
             ===================================================================== */}
          {activeTab === 'cleanup' && (
            <div className="space-y-4">
              {lastCleanupResult && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-xs space-y-1.5">
                  <div className="font-bold text-sm text-emerald-300">
                    Son Güvenli Temizlik Özeti (Geri Dönüşüm Kutusu)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    <div>
                      Taşınan Dosya: <b>{lastCleanupResult.successCount}</b> (Engellenen:{' '}
                      {lastCleanupResult.blockedCount}, Hata: {lastCleanupResult.failedCount})
                    </div>
                    <div>
                      Tahmini Alan Kazanımı:{' '}
                      <b className="text-emerald-400">
                        {formatBytes(lastCleanupResult.estimatedSavedBytes)}
                      </b>
                    </div>
                    <div>
                      Ölçülen Anlık Boş Alan Farkı:{' '}
                      <b className="text-blue-400">
                        {formatBytes(lastCleanupResult.measuredFreeSpaceDeltaBytes)}
                      </b>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Not: Çöp Kutusu aynı diskte olduğundan çöp boşaltılana kadar fiziksel boş
                      alan değişmeyebilir.
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {cleanupGroups.map((group) => (
                  <div
                    key={group.category}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                  >
                    <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white">
                            {group.title}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              group.riskLevel === 'low'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : group.riskLevel === 'medium'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {group.riskLevel === 'low'
                              ? 'Düşük Risk'
                              : group.riskLevel === 'medium'
                                ? 'Orta Risk'
                                : 'İnceleme Gerekli'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {group.guidanceNote}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-bold text-blue-400">
                          {formatBytes(group.estimatedBytes)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {group.fileCount} aday dosya
                        </div>
                      </div>
                    </div>

                    {group.items.length > 0 && (
                      <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                        {group.items.slice(0, 30).map((item) => {
                          const isChecked = selectedCleanupMap.has(
                            item.fullPath.toLowerCase()
                          )
                          return (
                            <div
                              key={item.id}
                              className="px-4 py-2 flex items-center justify-between hover:bg-slate-800/40"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    toggleCleanupSelection({
                                      fullPath: item.fullPath,
                                      expectedSizeBytes: item.sizeBytes,
                                      expectedMtimeMs: item.mtimeMs
                                    })
                                  }
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-100 truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {item.fullPath}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 shrink-0">
                                <span className="text-[11px] text-slate-400">
                                  {formatDateTr(item.mtimeMs)}
                                </span>
                                <span className="font-semibold text-blue-400">
                                  {formatBytes(item.sizeBytes)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              EKRAN 6: İŞLEM GEÇMİŞİ VE TARAMA HATALARI (HISTORY)
             ===================================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Son Tarama Oturumları ({scanSessions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  {scanSessions.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-slate-200 truncate">
                          {s.rootPath}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateTr(s.startedAt)} • {s.totalFiles} dosya
                        </div>
                      </div>
                      <span className="font-semibold text-blue-400 shrink-0">
                        {formatBytes(s.totalBytes)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Güvenli Temizlik İşlem Geçmişi (Çöp Kutusu Logları)
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto text-xs">
                  {cleanupHistory.length === 0 ? (
                    <div className="text-slate-400 py-4 text-center">
                      Henüz temizlik işlemi yapılmadı.
                    </div>
                  ) : (
                    cleanupHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-medium text-slate-200 truncate">
                            {h.filePath}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDateTr(h.createdAt)} •{' '}
                            {h.errorMessage || 'Geri Dönüşüm Kutusu’na taşındı'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              h.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : h.status === 'blocked'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {h.status.toUpperCase()}
                          </span>
                          <div className="text-[11px] font-semibold mt-1">
                            {formatBytes(h.sizeBytes)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Atlanan Öğeler (Symlink/Junction) ve Erişim Kısıtlamaları
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto text-xs">
                  {scanErrors.length === 0 ? (
                    <div className="text-slate-400 py-4 text-center">
                      Erişim hatası veya atlanan öğe kaydı bulunmuyor.
                    </div>
                  ) : (
                    scanErrors.map((err) => (
                      <div
                        key={err.id}
                        className="p-2.5 rounded bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                            {err.errorCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {err.itemType}
                          </span>
                        </div>
                        <div className="font-medium text-slate-200 truncate mt-1">
                          {err.targetPath}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {err.errorMessage}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              EKRAN 7: AYARLAR (SETTINGS)
             ===================================================================== */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 max-w-2xl space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">
                Tarama Kapsamı, Eşik Değerleri ve Hariç Tutulan Dizinler
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Büyük Dosya Eşiği (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.largeFileThresholdMb}
                    onChange={(e) => {
                      const val = Math.max(10, Number(e.target.value) || 100)
                      window.diskAnalizAPI
                        ?.updateSettings({ largeFileThresholdMb: val })
                        .then((res) => res && setSettings(res))
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Eski Dosya Eşiği (Gün)
                  </label>
                  <input
                    type="number"
                    value={settings.oldFileThresholdDays}
                    onChange={(e) => {
                      const val = Math.max(7, Number(e.target.value) || 180)
                      window.diskAnalizAPI
                        ?.updateSettings({ oldFileThresholdDays: val })
                        .then((res) => res && setSettings(res))
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400">
                  Tarama Dışı Bırakılan Dizinler (Excluded Paths)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newExcludedPathInput}
                    onChange={(e) => setNewExcludedPathInput(e.target.value)}
                    placeholder="Örn: C:\Windows\WinSxS"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newExcludedPathInput.trim()) return
                      const updated = [
                        ...settings.excludedPaths,
                        newExcludedPathInput.trim()
                      ]
                      window.diskAnalizAPI
                        ?.updateSettings({ excludedPaths: updated })
                        .then((res) => {
                          if (res) setSettings(res)
                          setNewExcludedPathInput('')
                        })
                    }}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white font-semibold"
                  >
                    Ekle
                  </button>
                </div>

                <div className="space-y-1 pt-2">
                  {settings.excludedPaths.map((p) => (
                    <div
                      key={p}
                      className="flex items-center justify-between px-3 py-1.5 rounded bg-slate-950 border border-slate-800"
                    >
                      <span className="font-mono">{p}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = settings.excludedPaths.filter(
                            (item) => item !== p
                          )
                          window.diskAnalizAPI
                            ?.updateSettings({ excludedPaths: updated })
                            .then((res) => res && setSettings(res))
                        }}
                        className="text-red-400 hover:underline"
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          GÜVENLİ TEMİZLİK (GERİ DÖNÜŞÜM KUTUSU) ONAY MODALI
         ========================================================================= */}
      {showConfirmCleanupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Güvenli Temizlik Onayı (Windows Geri Dönüşüm Kutusu)</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Seçtiğiniz <b>{selectedCleanupMap.size} adet dosya</b> kalıcı olarak
              silinmeyecek, işletim sisteminin <b>Geri Dönüşüm Kutusu’na</b>{' '}
              taşınacaktır. İşlem öncesinde her dosyanın boyutu, değiştirilme tarihi,
              sembolik bağ/junction durumu ve sistem yolu koruması yeniden doğrulanır.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
              {(Array.from(selectedCleanupMap.values()) as CleanupExecutionItemRequest[]).map(
                (item) => (
                  <div
                    key={item.fullPath}
                    className="flex items-center justify-between py-1 border-b border-slate-900"
                  >
                    <span className="truncate pr-3 text-slate-300">
                      {item.fullPath}
                    </span>
                    <span className="font-semibold text-blue-400 shrink-0">
                      {formatBytes(item.expectedSizeBytes)}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                Tahmini Kazanılacak Alan:{' '}
                <b className="text-emerald-400 text-sm">
                  {formatBytes(selectedCleanupTotalBytes)}
                </b>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmCleanupModal(false)}
                  disabled={isExecutingCleanup}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCleanup}
                  disabled={isExecutingCleanup}
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  {isExecutingCleanup
                    ? 'Taşınıyor...'
                    : 'Geri Dönüşüm Kutusu’na Taşı'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default App
