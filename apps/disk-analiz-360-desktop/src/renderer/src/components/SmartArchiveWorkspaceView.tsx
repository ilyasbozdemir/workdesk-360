import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowUp,
  Calendar,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileCode,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderKanban,
  FolderOpen,
  FolderPlus,
  FolderSearch,
  HardDrive,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutGrid,
  List,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Table as TableIcon,
  Tag,
  Video,
  X
} from 'lucide-react'
import {
  DriveInfo,
  ExplorerSubfolderInfo,
  FilePreviewResponse,
  VirtualFolderRecord,
  WorkspaceViewMode
} from '../../../shared/types'
import { formatBytes, formatDateTr } from '../App'

export interface WorkspaceFileItem {
  name: string
  cleanName: string
  path: string
  isDirectory: boolean
  size: number
  ext: string
  mtime: string
  tags: string[]
}

interface SmartArchiveWorkspaceViewProps {
  drives: DriveInfo[]
  initialDir: string
  isDarkMode: boolean
  onSendToPythonRunner: (sourceDir: string) => void
  onOpenInTreemap: (folderPath: string) => void
}

function getTagBadgeColor(tag: string, isDark: boolean): { bg: string; text: string; border: string } {
  const t = tag.toLowerCase()
  if (t.includes('ihale') || t.includes('sartname') || t.includes('temin') || t.includes('teklif')) {
    return {
      bg: isDark ? 'bg-amber-950/70' : 'bg-amber-100',
      text: isDark ? 'text-amber-300' : 'text-amber-800',
      border: isDark ? 'border-amber-700/60' : 'border-amber-300'
    }
  }
  if (t.includes('imar') || t.includes('parsel') || t.includes('ada') || t.includes('yapi') || t.includes('ruhsat')) {
    return {
      bg: isDark ? 'bg-emerald-950/70' : 'bg-emerald-100',
      text: isDark ? 'text-emerald-300' : 'text-emerald-800',
      border: isDark ? 'border-emerald-700/60' : 'border-emerald-300'
    }
  }
  if (t.includes('kamulastirma') || t.includes('tasinmaz') || t.includes('kira') || t.includes('ecrimisil')) {
    return {
      bg: isDark ? 'bg-purple-950/70' : 'bg-purple-100',
      text: isDark ? 'text-purple-300' : 'text-purple-800',
      border: isDark ? 'border-purple-700/60' : 'border-purple-300'
    }
  }
  if (t.includes('karar') || t.includes('encumen') || t.includes('meclis') || t.includes('tutanak')) {
    return {
      bg: isDark ? 'bg-rose-950/70' : 'bg-rose-100',
      text: isDark ? 'text-rose-300' : 'text-rose-800',
      border: isDark ? 'border-rose-700/60' : 'border-rose-300'
    }
  }
  if (t.includes('pdf') || t.includes('belge') || t.includes('evrak')) {
    return {
      bg: isDark ? 'bg-blue-950/70' : 'bg-blue-100',
      text: isDark ? 'text-blue-300' : 'text-blue-800',
      border: isDark ? 'border-blue-700/60' : 'border-blue-300'
    }
  }
  return {
    bg: isDark ? 'bg-cyan-950/70' : 'bg-cyan-100',
    text: isDark ? 'text-cyan-300' : 'text-cyan-800',
    border: isDark ? 'border-cyan-700/60' : 'border-cyan-300'
  }
}

function parseBreadcrumbs(dirPath: string): { name: string; path: string }[] {
  const normalized = dirPath.replace(/\//g, '\\').replace(/\\+$/, '')
  if (!normalized) return []
  const parts = normalized.split('\\')
  const crumbs: { name: string; path: string }[] = []
  let current = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue
    if (i === 0 && part.endsWith(':')) {
      current = part + '\\'
      crumbs.push({ name: part, path: current })
    } else {
      current = current.endsWith('\\') ? current + part : current + '\\' + part
      crumbs.push({ name: part, path: current })
    }
  }
  return crumbs
}

function getParentDir(dirPath: string): string | null {
  const normalized = dirPath.replace(/\//g, '\\').replace(/\\+$/, '')
  if (/^[a-zA-Z]:$/.test(normalized)) return null
  const lastSlash = normalized.lastIndexOf('\\')
  if (lastSlash === -1) return null
  const parent = normalized.slice(0, lastSlash)
  if (/^[a-zA-Z]:$/.test(parent)) return parent + '\\'
  return parent || null
}

export function SmartArchiveWorkspaceView({
  drives,
  initialDir,
  isDarkMode,
  onSendToPythonRunner,
  onOpenInTreemap
}: SmartArchiveWorkspaceViewProps): React.JSX.Element {
  // 1. Gezinti ve Dizin Durumları
  const [baseDir, setBaseDir] = useState<string>(initialDir || 'D:\\')
  const [pathInput, setPathInput] = useState<string>(initialDir || 'D:\\')
  const [isEditingPath, setIsEditingPath] = useState(false)
  const [scanDepth, setScanDepth] = useState<number>(2)
  const [files, setFiles] = useState<WorkspaceFileItem[]>([])
  const [realSubfolders, setRealSubfolders] = useState<ExplorerSubfolderInfo[]>([])
  const [loading, setLoading] = useState(false)

  // 2. Paneller
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightDetailOpen, setIsRightDetailOpen] = useState(true)

  // 3. Görünüm & Sıralama (Izgara, Liste, Ayrıntı, Galeri)
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('grid')
  const [sortBy, setSortBy] = useState<
    'name_asc' | 'name_desc' | 'size_desc' | 'size_asc' | 'mtime_desc' | 'mtime_asc'
  >('name_asc')

  // 4. Sanal Klasörler & Koleksiyonlar (Kullanıcı Tanımlı Gruplar)
  const [virtualFolders, setVirtualFolders] = useState<VirtualFolderRecord[]>([])
  const [activeVirtualFolderId, setActiveVirtualFolderId] = useState<string | null>(null)
  const [activeSmartView, setActiveSmartView] = useState<
    'none' | 'large_files' | 'recent_7d' | 'zero_byte' | 'cad_docs' | 'images_media' | 'contracts'
  >('none')
  const [showNewVirtualFolderModal, setShowNewVirtualFolderModal] = useState(false)
  const [newVirtualFolderName, setNewVirtualFolderName] = useState('')
  const [newVirtualFolderColor, setNewVirtualFolderColor] = useState('#0284c7')

  // 5. Arama, Filtreler & Etiketler
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedExtCategory, setSelectedExtCategory] = useState<
    'all' | 'documents' | 'sheets' | 'cad' | 'images' | 'archives' | 'zero'
  >('all')

  // 6. Seçim & Toplu İşlemler
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [primarySelectedFile, setPrimarySelectedFile] = useState<WorkspaceFileItem | null>(null)
  const [previewData, setPreviewData] = useState<FilePreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Toplu Etiket & Sanal Klasör Modalları
  const [showBulkTagModal, setShowBulkTagModal] = useState(false)
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [showAddToVirtualFolderDropdown, setShowAddToVirtualFolderDropdown] = useState(false)
  const [newSingleTagInput, setNewSingleTagInput] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 3000)
  }, [])

  // Sanal Klasörleri Yükle
  const loadVirtualFolders = useCallback(async () => {
    const api = window.diskAnalizAPI
    if (!api?.getVirtualFolders) return
    try {
      const vfs = await api.getVirtualFolders()
      setVirtualFolders(vfs || [])
    } catch (e) {
      console.error('Virtual folders load error:', e)
    }
  }, [])

  // Dosyaları Yükle
  const loadFiles = useCallback(
    async (folderPath: string, depth = scanDepth): Promise<void> => {
      const api = window.diskAnalizAPI
      if (!api) return
      setLoading(true)
      try {
        const res = await api.listDirectory(folderPath, { maxDepth: depth })
        if (res && res.success) {
          setFiles(res.items || [])
          setRealSubfolders(res.subfolders || [])
          if (res.targetDir && res.targetDir !== baseDir) {
            setBaseDir(res.targetDir)
            setPathInput(res.targetDir)
          }
        }
      } catch (err) {
        console.error('Error loading files:', err)
      } finally {
        setLoading(false)
      }
    },
    [baseDir, scanDepth]
  )

  useEffect(() => {
    loadVirtualFolders()
  }, [loadVirtualFolders])

  useEffect(() => {
    if (initialDir && initialDir !== baseDir) {
      setBaseDir(initialDir)
      setPathInput(initialDir)
    }
  }, [initialDir])

  useEffect(() => {
    loadFiles(baseDir, scanDepth)
    setPathInput(baseDir)
    setSelectedPaths(new Set())
    setPrimarySelectedFile(null)
  }, [baseDir, scanDepth, loadFiles])

  // Seçili dosya değiştiğinde önizleme getir
  useEffect(() => {
    const api = window.diskAnalizAPI
    if (!primarySelectedFile || !api?.readFilePreview) {
      setPreviewData(null)
      return
    }

    let isMounted = true
    setPreviewLoading(true)

    api
      .readFilePreview({ filePath: primarySelectedFile.path, maxBytes: 48 * 1024 })
      .then((res) => {
        if (isMounted) {
          setPreviewData(res)
          setPreviewLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPreviewData({
            success: false,
            filePath: primarySelectedFile.path,
            fileName: primarySelectedFile.name,
            fileSize: primarySelectedFile.size,
            mtime: primarySelectedFile.mtime,
            category: 'binary',
            error: err instanceof Error ? err.message : String(err)
          })
          setPreviewLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [primarySelectedFile])

  const changeDirectory = (newPath: string): void => {
    if (!newPath || !newPath.trim()) return
    const clean = newPath.trim()
    setBaseDir(clean)
    setPathInput(clean)
    setIsEditingPath(false)
    setActiveVirtualFolderId(null)
    setActiveSmartView('none')
  }

  const handleSelectFolderDialog = async (): Promise<void> => {
    const selected = await window.diskAnalizAPI?.selectFolderDialog()
    if (selected) {
      changeDirectory(selected)
    }
  }

  // Tüm benzersiz etiketler ve dosya sayıları
  const tagStats = useMemo(() => {
    const map = new Map<string, number>()
    for (const f of files) {
      for (const t of f.tags) {
        map.set(t, (map.get(t) || 0) + 1)
      }
    }
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'tr'))
  }, [files])

  // Akıllı ve filtrelenmiş dosya kümesi
  const displayFiles = useMemo(() => {
    return files
      .filter((file) => {
        // Sanal Klasör Filtresi
        if (activeVirtualFolderId) {
          const vf = virtualFolders.find((v) => v.id === activeVirtualFolderId)
          if (!vf || !vf.filePaths.includes(file.path)) {
            return false
          }
        }

        // Akıllı Görünüm Filtresi
        if (activeSmartView === 'large_files' && file.size < 100 * 1024 * 1024) return false
        if (activeSmartView === 'zero_byte' && file.size !== 0) return false
        if (activeSmartView === 'recent_7d') {
          const m = new Date(file.mtime).getTime()
          const now = Date.now()
          if (now - m > 7 * 86400 * 1000) return false
        }
        if (activeSmartView === 'cad_docs') {
          const ext = file.ext.toLowerCase()
          if (!['.dwg', '.dxf', '.ncz', '.dgn'].includes(ext)) return false
        }
        if (activeSmartView === 'images_media') {
          const ext = file.ext.toLowerCase()
          if (!['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'].includes(ext)) return false
        }
        if (activeSmartView === 'contracts') {
          const lower = file.name.toLowerCase()
          const isContract =
            lower.includes('sozlesme') ||
            lower.includes('ihale') ||
            lower.includes('sartname') ||
            file.tags.some((t) => t.includes('ihale') || t.includes('sozlesme'))
          if (!isContract) return false
        }

        // Kategori Uzantı Filtresi
        if (selectedExtCategory !== 'all') {
          const ext = file.ext.toLowerCase()
          if (selectedExtCategory === 'zero' && file.size !== 0) return false
          if (selectedExtCategory === 'documents' && !['.pdf', '.doc', '.docx', '.txt', '.odt'].includes(ext)) return false
          if (selectedExtCategory === 'sheets' && !['.xls', '.xlsx', '.csv', '.ods'].includes(ext)) return false
          if (selectedExtCategory === 'cad' && !['.dwg', '.dxf', '.ncz'].includes(ext)) return false
          if (selectedExtCategory === 'images' && !['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) return false
          if (selectedExtCategory === 'archives' && !['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return false
        }

        // Çoklu Etiket Filtresi
        if (selectedTags.length > 0) {
          const hasAllTags = selectedTags.every((st) => file.tags.includes(st))
          if (!hasAllTags) return false
        }

        // Global Arama Filtresi (Ad, Temiz Ad, Etiketler)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matches =
            file.name.toLowerCase().includes(q) ||
            file.cleanName.toLowerCase().includes(q) ||
            file.ext.toLowerCase().includes(q) ||
            file.tags.some((t) => t.toLowerCase().includes(q))
          if (!matches) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.cleanName.localeCompare(b.cleanName, 'tr')
        if (sortBy === 'name_desc') return b.cleanName.localeCompare(a.cleanName, 'tr')
        if (sortBy === 'size_desc') return b.size - a.size
        if (sortBy === 'size_asc') return a.size - b.size
        if (sortBy === 'mtime_desc') return new Date(b.mtime).getTime() - new Date(a.mtime).getTime()
        if (sortBy === 'mtime_asc') return new Date(a.mtime).getTime() - new Date(b.mtime).getTime()
        return 0
      })
  }, [
    files,
    activeVirtualFolderId,
    virtualFolders,
    activeSmartView,
    selectedExtCategory,
    selectedTags,
    searchQuery,
    sortBy
  ])

  // Çoklu Seçim Yöneticisi
  const toggleSelectPath = (path: string, e?: React.MouseEvent): void => {
    const next = new Set(selectedPaths)
    if (e?.shiftKey && primarySelectedFile) {
      // Shift ile aralık seçimi
      const lastIdx = displayFiles.findIndex((f) => f.path === primarySelectedFile.path)
      const curIdx = displayFiles.findIndex((f) => f.path === path)
      if (lastIdx !== -1 && curIdx !== -1) {
        const [start, end] = lastIdx < curIdx ? [lastIdx, curIdx] : [curIdx, lastIdx]
        for (let i = start; i <= end; i++) {
          next.add(displayFiles[i].path)
        }
      }
    } else if (next.has(path)) {
      next.delete(path)
    } else {
      next.add(path)
    }

    setSelectedPaths(next)
    const clickedFile = files.find((f) => f.path === path) || null
    if (clickedFile) setPrimarySelectedFile(clickedFile)
  }

  const selectAllFiltered = (): void => {
    setSelectedPaths(new Set(displayFiles.map((f) => f.path)))
  }

  const clearSelection = (): void => {
    setSelectedPaths(new Set())
  }

  // Sanal Klasör Oluşturma
  const handleCreateVirtualFolder = async (): Promise<void> => {
    if (!newVirtualFolderName.trim() || !window.diskAnalizAPI?.saveVirtualFolders) return
    const newVf: VirtualFolderRecord = {
      id: `vf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newVirtualFolderName.trim(),
      color: newVirtualFolderColor,
      filePaths: Array.from(selectedPaths),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const updated = [...virtualFolders, newVf]
    setVirtualFolders(updated)
    await window.diskAnalizAPI.saveVirtualFolders(updated)
    setNewVirtualFolderName('')
    setShowNewVirtualFolderModal(false)
    showToast(`'${newVf.name}' sanal klasörü oluşturuldu (${newVf.filePaths.length} dosya eklendi).`)
  }

  // Dosyaları Sanal Klasöre Ekle / Çıkar
  const handleToggleFileInVirtualFolder = async (
    vfId: string,
    filePaths: string[]
  ): Promise<void> => {
    if (!window.diskAnalizAPI?.saveVirtualFolders) return
    const updated = virtualFolders.map((vf) => {
      if (vf.id !== vfId) return vf
      const set = new Set(vf.filePaths)
      for (const p of filePaths) {
        if (set.has(p)) {
          set.delete(p)
        } else {
          set.add(p)
        }
      }
      return { ...vf, filePaths: Array.from(set), updatedAt: new Date().toISOString() }
    })
    setVirtualFolders(updated)
    await window.diskAnalizAPI.saveVirtualFolders(updated)
    setShowAddToVirtualFolderDropdown(false)
    showToast('Sanal klasör dosyaları güncellendi.')
  }

  // Sanal Klasörden Dosyayı Kaldır (Fiziksel Silmez!)
  const handleRemoveFromActiveVirtualFolder = async (path: string): Promise<void> => {
    if (!activeVirtualFolderId || !window.diskAnalizAPI?.saveVirtualFolders) return
    const updated = virtualFolders.map((vf) => {
      if (vf.id !== activeVirtualFolderId) return vf
      return {
        ...vf,
        filePaths: vf.filePaths.filter((p) => p !== path),
        updatedAt: new Date().toISOString()
      }
    })
    setVirtualFolders(updated)
    await window.diskAnalizAPI.saveVirtualFolders(updated)
    showToast('Dosya sanal klasörden çıkarıldı (Fiziksel dosya diskte korunmaktadır).')
  }

  // Tekil Etiket Ekle
  const handleAddTag = async (file: WorkspaceFileItem): Promise<void> => {
    if (!newSingleTagInput.trim() || !window.diskAnalizAPI?.addFileTag) return
    const tag = newSingleTagInput.trim()
    const res = await window.diskAnalizAPI.addFileTag({ filePath: file.path, tag })
    if (res.success) {
      setFiles((prev) => prev.map((f) => (f.path === file.path ? { ...f, tags: res.tags } : f)))
      if (primarySelectedFile?.path === file.path) {
        setPrimarySelectedFile({ ...primarySelectedFile, tags: res.tags })
      }
      setNewSingleTagInput('')
      showToast(`'#${tag}' etiketi eklendi.`)
    }
  }

  // Tekil Etiket Kaldır
  const handleRemoveTag = async (file: WorkspaceFileItem, tag: string): Promise<void> => {
    if (!window.diskAnalizAPI?.removeFileTag) return
    const res = await window.diskAnalizAPI.removeFileTag({ filePath: file.path, tag })
    if (res.success) {
      setFiles((prev) => prev.map((f) => (f.path === file.path ? { ...f, tags: res.tags } : f)))
      if (primarySelectedFile?.path === file.path) {
        setPrimarySelectedFile({ ...primarySelectedFile, tags: res.tags })
      }
      showToast(`'#${tag}' etiketi kaldırıldı.`)
    }
  }

  // Toplu Etiket Ekle
  const handleApplyBulkTags = async (): Promise<void> => {
    if (!bulkTagInput.trim() || selectedPaths.size === 0 || !window.diskAnalizAPI?.bulkTagFiles) return
    const tags = bulkTagInput
      .split(/[,;\s]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean)

    if (tags.length === 0) return

    const targets = Array.from(selectedPaths)
    const res = await window.diskAnalizAPI.bulkTagFiles({
      filePaths: targets,
      tagsToAdd: tags
    })

    if (res.success) {
      setFiles((prev) =>
        prev.map((f) => {
          if (!selectedPaths.has(f.path)) return f
          const merged = Array.from(new Set([...f.tags, ...tags]))
          return { ...f, tags: merged }
        })
      )
      setBulkTagInput('')
      setShowBulkTagModal(false)
      showToast(`${res.updatedCount} seçili dosyaya etiketler uygulandı.`)
    }
  }

  // Dosya İkonu Belirleyici
  const getFileIcon = (ext: string, className = 'w-7 h-7'): React.JSX.Element => {
    switch (ext.toLowerCase()) {
      case '.pdf':
        return <FileText className={`${className} text-rose-500 dark:text-rose-400`} />
      case '.doc':
      case '.docx':
      case '.odt':
      case '.txt':
        return <FileText className={`${className} text-blue-500 dark:text-blue-400`} />
      case '.xls':
      case '.xlsx':
      case '.csv':
        return <FileSpreadsheet className={`${className} text-emerald-600 dark:text-emerald-400`} />
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.webp':
      case '.gif':
      case '.svg':
        return <ImageIcon className={`${className} text-pink-500 dark:text-pink-400`} />
      case '.mp4':
      case '.avi':
      case '.mov':
      case '.mkv':
        return <Video className={`${className} text-violet-500 dark:text-violet-400`} />
      case '.zip':
      case '.rar':
      case '.7z':
      case '.tar':
      case '.gz':
        return <Archive className={`${className} text-amber-500 dark:text-amber-400`} />
      case '.dwg':
      case '.dxf':
      case '.ncz':
        return <Layers className={`${className} text-purple-600 dark:text-purple-400`} />
      case '.js':
      case '.ts':
      case '.json':
      case '.sql':
      case '.py':
        return <FileCode className={`${className} text-cyan-500 dark:text-cyan-400`} />
      default:
        return <FileQuestion className={`${className} text-slate-400`} />
    }
  }

  // Seçili dosyanın dahil olduğu sanal klasörler
  const containingVirtualFolders = useMemo(() => {
    if (!primarySelectedFile) return []
    return virtualFolders.filter((vf) => vf.filePaths.includes(primarySelectedFile.path))
  }, [primarySelectedFile, virtualFolders])

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none">
      {/* =========================================================================
          1. ÜST ARAÇ ÇUBUĞU (Breadcrumbs, Arama, Filtreler, Görünümler)
         ========================================================================= */}
      <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2.5 shrink-0 z-20">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Sol Kenar Çubuğu Aç/Kapat Butonu */}
          <button
            onClick={() => setIsLeftSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title={isLeftSidebarOpen ? 'Sol Paneli Daralt' : 'Sol Paneli Aç'}
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          {/* Sürücü Harfleri */}
          <div className="hidden sm:flex items-center gap-1">
            {drives.map((d) => {
              const active = baseDir.toUpperCase().startsWith(d.driveCode.toUpperCase())
              return (
                <button
                  key={d.mountPath}
                  onClick={() => changeDirectory(d.mountPath)}
                  className={`px-2 py-1 text-xs rounded-lg border font-mono font-bold flex items-center gap-1 transition ${
                    active && !activeVirtualFolderId
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5 text-sky-500" />
                  <span>{d.driveCode}</span>
                </button>
              )
            })}
          </div>

          {/* Üst Dizin Butonu */}
          {getParentDir(baseDir) && !activeVirtualFolderId && (
            <button
              onClick={() => changeDirectory(getParentDir(baseDir)!)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title={`Üst Klasöre Çık: ${getParentDir(baseDir)}`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}

          {/* Breadcrumb veya Sanal Klasör Başlığı */}
          {activeVirtualFolderId ? (
            <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-300">
              <FolderKanban className="w-4 h-4 text-sky-500" />
              <span>
                Sanal Klasör:{' '}
                {virtualFolders.find((v) => v.id === activeVirtualFolderId)?.name || 'Koleksiyon'}
              </span>
              <button
                onClick={() => setActiveVirtualFolderId(null)}
                className="hover:text-rose-500 ml-1 p-0.5 rounded"
                title="Sanal klasör filtresini kaldır"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !isEditingPath ? (
            <div className="flex-1 flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 min-w-0 max-w-xl">
              <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0 mr-1" />
              <div className="flex items-center gap-1 flex-1 overflow-x-auto py-0.5">
                {parseBreadcrumbs(baseDir).map((crumb, idx, arr) => (
                  <div key={crumb.path} className="flex items-center shrink-0">
                    <button
                      onClick={() => changeDirectory(crumb.path)}
                      className={`text-xs px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-slate-800 transition truncate max-w-[140px] ${
                        idx === arr.length - 1
                          ? 'font-bold text-sky-600 dark:text-sky-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {crumb.name}
                    </button>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsEditingPath(true)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                title="Yolu Elle Düzenle"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-1 max-w-xl">
              <input
                type="text"
                autoFocus
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') changeDirectory(pathInput)
                  if (e.key === 'Escape') setIsEditingPath(false)
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-950 border border-sky-500 rounded-xl px-3 py-1 text-xs font-mono focus:outline-none"
              />
              <button
                onClick={() => changeDirectory(pathInput)}
                className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-xs font-semibold"
              >
                Git
              </button>
              <button
                onClick={() => setIsEditingPath(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Global Arama Çubuğu */}
        <div className="relative w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara (#etiket, ad, .pdf)..."
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-7 py-1 text-xs focus:outline-none focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Görünüm Seçici (Grid, List, Details, Gallery) */}
        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
          <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Izgara Görünümü (Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Liste Görünümü (List)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'details'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Ayrıntılı Görünüm (Details)"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'gallery'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Galeri / Medya Görünümü (Gallery)"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sıralama Açılır Menüsü */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="name_asc">Ad (A → Z)</option>
            <option value="name_desc">Ad (Z → A)</option>
            <option value="size_desc">Boyut (En Büyük)</option>
            <option value="size_asc">Boyut (En Küçük)</option>
            <option value="mtime_desc">Tarih (En Yeni)</option>
            <option value="mtime_asc">Tarih (En Eski)</option>
          </select>

          {/* Sağ Detay Paneli Aç/Kapat Butonu */}
          <button
            onClick={() => setIsRightDetailOpen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title={isRightDetailOpen ? 'Sağ Detay Panelini Kapat' : 'Sağ Detay Panelini Aç'}
          >
            {isRightDetailOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. İKİNCİL FİLTRE VE TOPLU İŞLEM ÇUBUĞU (Aktif Filtre Çipleri)
         ========================================================================= */}
      <div className="px-4 py-1.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/40 flex items-center justify-between gap-2 flex-wrap shrink-0">
        {/* Kategori Filtre Butonları */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
          <button
            onClick={() => setSelectedExtCategory('all')}
            className={`px-2 py-0.5 rounded-full border transition ${
              selectedExtCategory === 'all'
                ? 'bg-sky-600 text-white border-sky-500 font-bold'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            Tümü ({files.length})
          </button>
          <button
            onClick={() => setSelectedExtCategory('documents')}
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              selectedExtCategory === 'documents'
                ? 'bg-blue-600 text-white border-blue-500 font-bold'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3 h-3 text-blue-400" />
            <span>Belgeler & PDF</span>
          </button>
          <button
            onClick={() => setSelectedExtCategory('sheets')}
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              selectedExtCategory === 'sheets'
                ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
            <span>Tablolar & Excel</span>
          </button>
          <button
            onClick={() => setSelectedExtCategory('cad')}
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              selectedExtCategory === 'cad'
                ? 'bg-purple-600 text-white border-purple-500 font-bold'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>CAD / Proje</span>
          </button>
          <button
            onClick={() => setSelectedExtCategory('images')}
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              selectedExtCategory === 'images'
                ? 'bg-pink-600 text-white border-pink-500 font-bold'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-3 h-3 text-pink-400" />
            <span>Görseller</span>
          </button>
          <button
            onClick={() => setSelectedExtCategory('zero')}
            className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
              selectedExtCategory === 'zero'
                ? 'bg-rose-600 text-white border-rose-500 font-bold'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Boş (0 B)</span>
          </button>
        </div>

        {/* Aktif Etiket Filtre Çipleri */}
        {selectedTags.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
            <span className="text-[11px] text-slate-500 font-semibold">Aktif Etiketler:</span>
            {selectedTags.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-600 text-white shadow-2xs"
              >
                #{st}
                <button
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== st))}
                  className="hover:text-rose-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedTags([])}
              className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline ml-1"
            >
              Hepsini Kaldır
            </button>
          </div>
        )}

        {/* Çoklu Seçim Eylem Çubuğu (Toplu İşlemler) */}
        {selectedPaths.size > 0 && (
          <div className="flex items-center gap-2 bg-sky-500/15 border border-sky-500/30 rounded-xl px-2.5 py-1 text-xs">
            <span className="font-bold text-sky-700 dark:text-sky-300">
              {selectedPaths.size} dosya seçildi
            </span>
            <button
              onClick={() => setShowBulkTagModal(true)}
              className="px-2 py-0.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-1"
            >
              <Tag className="w-3 h-3" />
              <span>Etiketle</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowAddToVirtualFolderDropdown((prev) => !prev)}
                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1"
              >
                <FolderPlus className="w-3 h-3" />
                <span>Sanal Klasöre Ekle</span>
              </button>

              {/* Sanal Klasör Seçim Açılır Menüsü */}
              {showAddToVirtualFolderDropdown && (
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 text-xs">
                  <div className="font-bold text-slate-500 text-[10px] uppercase mb-1.5 px-1">
                    Sanal Klasör Seç:
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {virtualFolders.map((vf) => (
                      <button
                        key={vf.id}
                        onClick={() =>
                          handleToggleFileInVirtualFolder(vf.id, Array.from(selectedPaths))
                        }
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: vf.color }}
                          />
                          <span className="truncate">{vf.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {vf.filePaths.length}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowAddToVirtualFolderDropdown(false)
                      setShowNewVirtualFolderModal(true)
                    }}
                    className="w-full mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 font-bold text-left px-2 py-1 rounded hover:bg-sky-50 dark:hover:bg-sky-950/50 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Yeni Sanal Klasör...</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={clearSelection}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs"
              title="Seçimi temizle"
            >
              Vazgeç
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. ANA ÇALIŞMA GÖVDESİ (Sol Sidebar, Merkez Grid/List/Gallery, Sağ Detay)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* SOL KENAR ÇUBUĞU (Diskler, Sanal Klasörler, Akıllı Görünümler, Etiketler) */}
        {isLeftSidebarOpen && (
          <aside className="w-68 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
            <div className="p-3 space-y-4">
              {/* Bölüm 1: Diskler ve Fiziksel Gezinti */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Fiziksel Diskler
                </span>
                <div className="space-y-0.5">
                  {drives.map((d) => {
                    const isSelected =
                      baseDir.toUpperCase().startsWith(d.driveCode.toUpperCase()) &&
                      !activeVirtualFolderId
                    return (
                      <button
                        key={d.mountPath}
                        onClick={() => changeDirectory(d.mountPath)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold border border-sky-500/30'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <HardDrive className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate">
                            {d.driveCode} {d.label}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatBytes(d.freeBytes)} boş
                        </span>
                      </button>
                    )
                  })}
                  <button
                    onClick={handleSelectFolderDialog}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition"
                  >
                    <FolderSearch className="w-3.5 h-3.5" />
                    <span>Özel Klasör Aç...</span>
                  </button>
                </div>
              </div>

              {/* Bölüm 2: Sanal Klasörler & Koleksiyonlar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FolderKanban className="w-3 h-3 text-indigo-500" />
                    Sanal Klasörler ({virtualFolders.length})
                  </span>
                  <button
                    onClick={() => setShowNewVirtualFolderModal(true)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400"
                    title="Yeni Sanal Klasör Oluştur"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-0.5">
                  {virtualFolders.map((vf) => {
                    const isActive = activeVirtualFolderId === vf.id
                    return (
                      <button
                        key={vf.id}
                        onClick={() => {
                          setActiveVirtualFolderId(isActive ? null : vf.id)
                          setActiveSmartView('none')
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/40'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: vf.color }}
                          />
                          <span className="truncate">{vf.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          {vf.filePaths.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bölüm 3: Akıllı Görünümler (Smart Views) */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Akıllı Görünümler
                </span>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveSmartView(activeSmartView === 'large_files' ? 'none' : 'large_files')
                      setActiveVirtualFolderId(null)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                      activeSmartView === 'large_files'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Büyük Dosyalar (&gt;100 MB)</span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSmartView(activeSmartView === 'recent_7d' ? 'none' : 'recent_7d')
                      setActiveVirtualFolderId(null)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                      activeSmartView === 'recent_7d'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Son 7 Günde Değişenler</span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSmartView(activeSmartView === 'cad_docs' ? 'none' : 'cad_docs')
                      setActiveVirtualFolderId(null)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                      activeSmartView === 'cad_docs'
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold border border-purple-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      <span>CAD / İmar Çizimleri</span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSmartView(activeSmartView === 'contracts' ? 'none' : 'contracts')
                      setActiveVirtualFolderId(null)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                      activeSmartView === 'contracts'
                        ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold border border-sky-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      <span>İhale & Sözleşmeler</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Bölüm 4: Etiketler Matrisi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3 text-sky-500" />
                    Etiketler ({tagStats.length})
                  </span>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-[10px] text-sky-500 hover:underline"
                    >
                      Sıfırla
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 max-h-56 overflow-y-auto pr-1">
                  {tagStats.map(({ tag, count }) => {
                    const isSelected = selectedTags.includes(tag)
                    const colors = getTagBadgeColor(tag, isDarkMode)
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          setSelectedTags((prev) =>
                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                          )
                        }
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-500 font-bold'
                            : `${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`
                        }`}
                      >
                        <span>#{tag}</span>
                        <span className="text-[8px] opacity-75 font-mono">({count})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Alt Bilgi */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <span>Gezinti Derinliği:</span>
              <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setScanDepth(d)
                      loadFiles(baseDir, d)
                    }}
                    className={`px-1.5 py-0.2 rounded transition ${
                      scanDepth === d ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* ORTA İÇERİK ALANI (Grid, List, Details, Gallery) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/40 dark:bg-slate-950/30">
          {/* Alt Klasörler Hızlı Gezinti Şeridi */}
          {realSubfolders.length > 0 && !activeVirtualFolderId && (
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Alt Klasörler:
              </span>
              {realSubfolders.map((sf) => (
                <button
                  key={sf.path}
                  onClick={() => changeDirectory(sf.path)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 transition flex items-center gap-1.5 shrink-0 text-left shadow-2xs"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold truncate max-w-[150px]">{sf.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({sf.fileCount})</span>
                </button>
              ))}
            </div>
          )}

          {/* Dosya Listesi İçeriği */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center flex-col gap-2.5 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
                <span className="text-xs font-semibold">Dosyalar taranıyor ve etiketleniyor...</span>
              </div>
            ) : displayFiles.length === 0 ? (
              <div className="h-full flex items-center justify-center flex-col gap-3 text-slate-400 p-8 text-center">
                <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Görüntülenecek Dosya Bulunamadı
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Uygulanan arama veya filtre kriterlerine uygun dosya yok ya da klasör boş.
                  </p>
                </div>
                {(searchQuery || selectedTags.length > 0 || selectedExtCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedTags([])
                      setSelectedExtCategory('all')
                    }}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* ================= IZGARA GÖRÜNÜMÜ (GRID) ================= */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {displayFiles.map((file) => {
                  const isSelected = selectedPaths.has(file.path)
                  const isPrimary = primarySelectedFile?.path === file.path
                  return (
                    <div
                      key={file.path}
                      onClick={(e) => toggleSelectPath(file.path, e)}
                      onDoubleClick={() => window.diskAnalizAPI?.openFile(file.path)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative select-none ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 shadow-sm ring-1 ring-sky-500/30'
                          : isPrimary
                            ? 'bg-sky-500/5 border-sky-400 dark:border-sky-500/50'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:shadow-sm'
                      }`}
                    >
                      {/* Seçim Rozeti */}
                      <div className="absolute top-2.5 right-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 text-sky-600 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2 pr-6">
                          {getFileIcon(file.ext)}
                          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                            {file.ext.replace('.', '') || 'DOSYA'}
                          </span>
                        </div>
                        <p
                          className="font-bold text-xs line-clamp-2 leading-snug break-all text-slate-800 dark:text-slate-100"
                          title={file.name}
                        >
                          {file.cleanName}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                          <span className="font-mono">{formatBytes(file.size)}</span>
                          <span>{formatDateTr(file.mtime).split(' ')[0]}</span>
                        </div>

                        {/* Etiket Rozetleri */}
                        <div className="flex flex-wrap gap-1">
                          {file.tags.slice(0, 3).map((t) => {
                            const colors = getTagBadgeColor(t, isDarkMode)
                            return (
                              <span
                                key={t}
                                className={`text-[9px] px-1.5 py-0.2 rounded-full border font-semibold ${colors.bg} ${colors.text} ${colors.border}`}
                              >
                                #{t}
                              </span>
                            )
                          })}
                          {file.tags.length > 3 && (
                            <span className="text-[8px] text-slate-400 font-bold self-center">
                              +{file.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : viewMode === 'list' ? (
              /* ================= LİSTE GÖRÜNÜMÜ (LIST) ================= */
              <div className="space-y-1">
                {displayFiles.map((file) => {
                  const isSelected = selectedPaths.has(file.path)
                  return (
                    <div
                      key={file.path}
                      onClick={(e) => toggleSelectPath(file.path, e)}
                      onDoubleClick={() => window.diskAnalizAPI?.openFile(file.path)}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 text-sky-600 rounded cursor-pointer"
                        />
                        {getFileIcon(file.ext, 'w-5 h-5')}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-100">
                            {file.cleanName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{file.path}</p>
                        </div>
                      </div>

                      {/* Etiketler */}
                      <div className="hidden sm:flex items-center gap-1 shrink-0 max-w-xs overflow-hidden">
                        {file.tags.slice(0, 4).map((t) => {
                          const colors = getTagBadgeColor(t, isDarkMode)
                          return (
                            <span
                              key={t}
                              className={`text-[9px] px-1.5 py-0.2 rounded-full border font-semibold ${colors.bg} ${colors.text} ${colors.border}`}
                            >
                              #{t}
                            </span>
                          )
                        })}
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-20">
                          {formatBytes(file.size)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono w-28">
                          {formatDateTr(file.mtime)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : viewMode === 'details' ? (
              /* ================= AYRINTILI GÖRÜNÜM (DETAILS) ================= */
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedPaths.size === displayFiles.length && displayFiles.length > 0
                          }
                          onChange={(e) => (e.target.checked ? selectAllFiltered() : clearSelection())}
                          className="w-3.5 h-3.5 text-sky-600 rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3">Dosya Adı</th>
                      <th className="py-2.5 px-3">Etiketler</th>
                      <th className="py-2.5 px-3">Uzantı / Tür</th>
                      <th className="py-2.5 px-3">Son Değişiklik</th>
                      <th className="py-2.5 px-3 text-right">Boyut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {displayFiles.map((file) => {
                      const isSelected = selectedPaths.has(file.path)
                      return (
                        <tr
                          key={file.path}
                          onClick={(e) => toggleSelectPath(file.path, e)}
                          onDoubleClick={() => window.diskAnalizAPI?.openFile(file.path)}
                          className={`cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            isSelected ? 'bg-sky-500/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3.5 h-3.5 text-sky-600 rounded cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100 max-w-sm truncate">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.ext, 'w-4 h-4')}
                              <span className="truncate">{file.cleanName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {file.tags.map((t) => {
                                const colors = getTagBadgeColor(t, isDarkMode)
                                return (
                                  <span
                                    key={t}
                                    className={`text-[9px] px-1.5 py-0.2 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
                                  >
                                    #{t}
                                  </span>
                                )
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono uppercase text-slate-400 text-[10px]">
                            {file.ext.replace('.', '') || '-'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {formatDateTr(file.mtime)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-700 dark:text-slate-300">
                            {formatBytes(file.size)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ================= GALERİ GÖRÜNÜMÜ (GALLERY) ================= */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayFiles.map((file) => {
                  const isSelected = selectedPaths.has(file.path)
                  return (
                    <div
                      key={file.path}
                      onClick={(e) => toggleSelectPath(file.path, e)}
                      onDoubleClick={() => window.diskAnalizAPI?.openFile(file.path)}
                      className={`rounded-2xl border overflow-hidden cursor-pointer flex flex-col justify-between transition group ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 shadow-md ring-2 ring-sky-500/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-500/50 shadow-xs'
                      }`}
                    >
                      {/* Önizleme Vitrini */}
                      <div className="h-40 bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative p-3 border-b border-slate-100 dark:border-slate-800">
                        {getFileIcon(file.ext, 'w-14 h-14')}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/70 text-white font-mono text-[9px] uppercase font-bold">
                          {file.ext.replace('.', '') || 'DOSYA'}
                        </span>
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="font-bold text-xs truncate mb-1" title={file.name}>
                          {file.cleanName}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2">
                          <span>{formatBytes(file.size)}</span>
                          <span>{formatDateTr(file.mtime).split(' ')[0]}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((t) => {
                            const colors = getTagBadgeColor(t, isDarkMode)
                            return (
                              <span
                                key={t}
                                className={`text-[9px] px-1.5 py-0.2 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
                              >
                                #{t}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* =========================================================================
              4. ALT DURUM ÇUBUĞU (Durum Göstergesi & Metrikler)
             ========================================================================= */}
          <div className="px-4 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                Toplam: <b className="font-mono text-slate-800 dark:text-slate-200">{files.length}</b>{' '}
                dosya (
                {formatBytes(files.reduce((acc, f) => acc + f.size, 0))})
              </span>
              <span>•</span>
              <span>
                Filtrelenen:{' '}
                <b className="font-mono text-sky-600 dark:text-sky-400">{displayFiles.length}</b> dosya
              </span>
              {selectedPaths.size > 0 && (
                <>
                  <span>•</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    Seçili: {selectedPaths.size} dosya (
                    {formatBytes(
                      files
                        .filter((f) => selectedPaths.has(f.path))
                        .reduce((acc, f) => acc + f.size, 0)
                    )}
                    )
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenInTreemap(baseDir)}
                className="hover:text-sky-500 text-[11px] font-semibold flex items-center gap-1"
              >
                <Layers className="w-3 h-3 text-sky-500" />
                <span>Treemap&apos;te Aç</span>
              </button>
              <span>•</span>
              <button
                onClick={() => onSendToPythonRunner(baseDir)}
                className="hover:text-emerald-500 text-[11px] font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Python Analiz</span>
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ AYRINTI VE CANLI ÖNİZLEME PANELİ (Önizleme & Detay) */}
        {isRightDetailOpen && (
          <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
            {primarySelectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                    <Eye className="w-4 h-4 text-sky-500" />
                    <span>Dosya Önizleme & Detay</span>
                  </h3>
                  <button
                    onClick={() => setPrimarySelectedFile(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Görsel / Metin Canlı Önizleyici */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 overflow-hidden">
                  {previewLoading ? (
                    <div className="h-36 flex items-center justify-center flex-col gap-2 text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
                      <span className="text-[10px]">Önizleme oluşturuluyor...</span>
                    </div>
                  ) : previewData?.previewUrl ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={previewData.previewUrl}
                        alt={primarySelectedFile.name}
                        className="max-h-48 rounded-xl object-contain shadow-xs border border-slate-200 dark:border-slate-800"
                      />
                      <span className="text-[10px] text-slate-400 mt-2 font-mono">
                        {primarySelectedFile.ext.toUpperCase()} Görseli
                      </span>
                    </div>
                  ) : previewData?.textContent ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>İlk {previewData.lineCount || 0} Satır Metin</span>
                        <span>UTF-8</span>
                      </div>
                      <pre className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 max-h-44 overflow-auto whitespace-pre-wrap break-all">
                        {previewData.textContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4">
                      {getFileIcon(primarySelectedFile.ext, 'w-12 h-12')}
                      <span className="text-xs font-bold mt-2 text-center break-all">
                        {primarySelectedFile.cleanName}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 font-mono">
                        {formatBytes(primarySelectedFile.size)} • {primarySelectedFile.ext.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Metadata Bilgileri */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Dosya Adı</span>
                    <p className="font-semibold text-xs break-all mt-0.5 select-all">
                      {primarySelectedFile.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Fiziksel Yol</span>
                    <p className="font-mono text-[10px] break-all bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 mt-0.5 select-all">
                      {primarySelectedFile.path}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Boyut</span>
                      <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">
                        {formatBytes(primarySelectedFile.size)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Değişiklik</span>
                      <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                        {formatDateTr(primarySelectedFile.mtime).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ait Olduğu Sanal Klasörler (Koleksiyonlar & Konumlar) */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Dahil Olduğu Sanal Klasörler
                  </span>
                  {containingVirtualFolders.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">
                      Henüz hiçbir sanal klasöre eklenmemiş.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {containingVirtualFolders.map((vf) => (
                        <div
                          key={vf.id}
                          className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: vf.color }}
                            />
                            <span className="truncate">{vf.name}</span>
                          </span>
                          <button
                            onClick={() => handleRemoveFromActiveVirtualFolder(primarySelectedFile.path)}
                            className="hover:text-rose-500 ml-1 text-slate-400"
                            title="Sanal klasörden çıkar"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Etiket Yönetimi (Çoklu Etiketleme & Renk Rozetleri) */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-sky-500" />
                      <span>Etiketleri Düzenle</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {primarySelectedFile.tags.map((t) => {
                      const colors = getTagBadgeColor(t, isDarkMode)
                      return (
                        <span
                          key={t}
                          className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          #{t}
                          <button
                            onClick={() => handleRemoveTag(primarySelectedFile, t)}
                            className="hover:text-rose-500 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newSingleTagInput}
                      onChange={(e) => setNewSingleTagInput(e.target.value)}
                      placeholder="Yeni etiket (örn: ihale)..."
                      className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-sky-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(primarySelectedFile)}
                    />
                    <button
                      onClick={() => handleAddTag(primarySelectedFile)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-2 text-slate-400 p-6 text-center">
                <Info className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Dosya Seçilmedi
                </h4>
                <p className="text-[11px] text-slate-400">
                  Önizleme ve metadata bilgilerini incelemek için listeden bir dosya seçin.
                </p>
              </div>
            )}

            {/* Alt Hızlı İşlemler Butonları */}
            {primarySelectedFile && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => window.diskAnalizAPI?.openFile(primarySelectedFile.path)}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Varsayılan Uygulamayla Aç</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => window.diskAnalizAPI?.showInFolder(primarySelectedFile.path)}
                    className="py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition text-slate-700 dark:text-slate-200"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gezginde Göster</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(primarySelectedFile.path)
                      showToast('Dosya yolu panoya kopyalandı!')
                    }}
                    className="py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition text-slate-700 dark:text-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-500" />
                    <span>Yolu Kopyala</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* =========================================================================
          5. MODALLAR (Yeni Sanal Klasör & Toplu Etiketleme)
         ========================================================================= */}
      {/* A. Yeni Sanal Klasör Modalı */}
      {showNewVirtualFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
                <FolderPlus className="w-4 h-4 text-sky-500" />
                <span>Yeni Sanal Klasör / Koleksiyon</span>
              </h3>
              <button
                onClick={() => setShowNewVirtualFolderModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sanal klasörler dosyaları fiziksel diskte kopyalamadan veya taşımadan tek bir grupta
              düzenlemenizi sağlar.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Koleksiyon Adı *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Örn: 2026 Kamulaştırma Dosyaları"
                  value={newVirtualFolderName}
                  onChange={(e) => setNewVirtualFolderName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Klasör Rengi
                </label>
                <div className="flex items-center gap-2">
                  {['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewVirtualFolderColor(c)}
                      className={`w-6 h-6 rounded-full transition ${
                        newVirtualFolderColor === c ? 'ring-2 ring-offset-2 ring-sky-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {selectedPaths.size > 0 && (
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-300 text-xs">
                  ✓ Şu an seçili olan <b>{selectedPaths.size}</b> dosya bu sanal klasöre eklenecek.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewVirtualFolderModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleCreateVirtualFolder}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. Toplu Etiketleme Modalı */}
      {showBulkTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
                <Tag className="w-4 h-4 text-sky-500" />
                <span>Seçili {selectedPaths.size} Dosyaya Toplu Etiket Uygula</span>
              </h3>
              <button
                onClick={() => setShowBulkTagModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Etiketler (Virgülle ayırarak girin)
              </label>
              <input
                type="text"
                autoFocus
                placeholder="ihale, 2026, onayli, sartname"
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkTagModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleApplyBulkTags}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
              >
                Etiketleri Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. Toast Bildirim Balonu */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
