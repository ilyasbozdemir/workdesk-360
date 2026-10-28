import React, { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowUp,
  Calendar,
  ChevronRight,
  Code,
  Edit3,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderKanban,
  FolderOpen,
  FolderPlus,
  FolderSearch,
  HardDrive,
  Image,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Terminal,
  Video,
  X
} from 'lucide-react'
import {
  analyzeArchiveFiles,
  DynamicAnalysisResult,
  extractYear,
  FileItem,
  PRESET_MUNICIPAL_TOPICS
} from '../../../shared/analyzer'
import { DriveInfo, ExplorerSubfolderInfo } from '../../../shared/types'
import { formatBytes } from '../App'

interface SmartArchiveExplorerViewProps {
  drives: DriveInfo[]
  initialDir: string
  isDarkMode: boolean
  onSendToPythonRunner: (sourceDir: string) => void
  onOpenInTreemap: (folderPath: string) => void
}

function getTagBadgeClass(tag: string, isDark: boolean): string {
  const t = tag.toLowerCase()
  if (t.includes('ihale') || t.includes('sartname') || t.includes('temin')) {
    return isDark
      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
      : 'bg-amber-50 text-amber-800 border-amber-300'
  }
  if (t.includes('imar') || t.includes('parsel') || t.includes('ada') || t.includes('cad')) {
    return isDark
      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
  }
  if (t.includes('kamulastirma') || t.includes('tasinmaz') || t.includes('kira')) {
    return isDark
      ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
      : 'bg-purple-50 text-purple-800 border-purple-300'
  }
  if (t.includes('karar') || t.includes('encumen') || t.includes('meclis')) {
    return isDark
      ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
      : 'bg-rose-50 text-rose-800 border-rose-300'
  }
  return isDark
    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
    : 'bg-cyan-50 text-cyan-800 border-cyan-300'
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

export function SmartArchiveExplorerView({
  drives,
  initialDir,
  isDarkMode,
  onSendToPythonRunner,
  onOpenInTreemap
}: SmartArchiveExplorerViewProps): React.JSX.Element {
  const [baseDir, setBaseDir] = useState<string>(initialDir || 'D:\\')
  const [pathInput, setPathInput] = useState<string>(initialDir || 'D:\\')
  const [isEditingPath, setIsEditingPath] = useState(false)
  const [scanDepth, setScanDepth] = useState<number>(2)
  const [files, setFiles] = useState<FileItem[]>([])
  const [realSubfolders, setRealSubfolders] = useState<ExplorerSubfolderInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const [perspective, setPerspective] = useState<
    'topics' | 'folders' | 'years' | 'formats' | 'preset'
  >('topics')
  const [sidebarFilterText, setSidebarFilterText] = useState('')
  const [activeFilter, setActiveFilter] = useState<{
    type: 'topic' | 'folder' | 'year' | 'format' | 'preset'
    value: string
    label: string
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [newTagInput, setNewTagInput] = useState('')

  const loadFiles = async (folderPath: string, depth = scanDepth): Promise<void> => {
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
  }

  useEffect(() => {
    if (initialDir && initialDir !== baseDir) {
      setBaseDir(initialDir)
      setPathInput(initialDir)
    }
  }, [initialDir])

  useEffect(() => {
    loadFiles(baseDir, scanDepth)
    setPathInput(baseDir)
    setActiveFilter(null)
  }, [baseDir, scanDepth])

  const changeDirectory = (newPath: string): void => {
    if (!newPath || !newPath.trim()) return
    const clean = newPath.trim()
    setBaseDir(clean)
    setPathInput(clean)
    setIsEditingPath(false)
  }

  const handleSelectFolder = async (): Promise<void> => {
    const selected = await window.diskAnalizAPI?.selectFolderDialog()
    if (selected) {
      changeDirectory(selected)
    }
  }

  const analysis: DynamicAnalysisResult = useMemo(() => {
    return analyzeArchiveFiles(files, baseDir)
  }, [files, baseDir])

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matches =
          f.name.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q))
        if (!matches) return false
      }

      if (selectedTag && !f.tags.includes(selectedTag)) {
        return false
      }

      if (activeFilter) {
        if (activeFilter.type === 'topic') {
          return f.name.toLowerCase().includes(activeFilter.value.toLowerCase())
        }
        if (activeFilter.type === 'folder') {
          return f.path.includes(activeFilter.value)
        }
        if (activeFilter.type === 'year') {
          return extractYear(f.name, f.mtime) === activeFilter.value
        }
        if (activeFilter.type === 'format') {
          const cluster = analysis.formatClusters.find((c) => c.id === activeFilter.value)
          return cluster ? cluster.files.some((cf) => cf.path === f.path) : true
        }
        if (activeFilter.type === 'preset') {
          return f.path.includes(activeFilter.value)
        }
      }

      return true
    })
  }, [files, searchQuery, selectedTag, activeFilter, analysis])

  const allUniqueTags = useMemo(
    () => Array.from(new Set(files.flatMap((f) => f.tags))),
    [files]
  )

  const handleAddTag = async (file: FileItem): Promise<void> => {
    if (!newTagInput.trim() || !window.diskAnalizAPI) return
    const tag = newTagInput.trim()
    const res = await window.diskAnalizAPI.addFileTag({ filePath: file.path, tag })
    if (res.success) {
      setFiles((prev) => prev.map((f) => (f.path === file.path ? { ...f, tags: res.tags } : f)))
      if (selectedFile?.path === file.path) {
        setSelectedFile({ ...selectedFile, tags: res.tags })
      }
      setNewTagInput('')
    }
  }

  const handleRemoveTag = async (file: FileItem, tag: string): Promise<void> => {
    if (!window.diskAnalizAPI) return
    const res = await window.diskAnalizAPI.removeFileTag({ filePath: file.path, tag })
    if (res.success) {
      setFiles((prev) => prev.map((f) => (f.path === file.path ? { ...f, tags: res.tags } : f)))
      if (selectedFile?.path === file.path) {
        setSelectedFile({ ...selectedFile, tags: res.tags })
      }
    }
  }

  const getFileIcon = (ext: string): React.JSX.Element => {
    switch (ext) {
      case '.pdf':
      case '.doc':
      case '.docx':
      case '.txt':
        return <FileText className="w-7 h-7 text-blue-500 dark:text-blue-400" />
      case '.xls':
      case '.xlsx':
      case '.csv':
        return <FileSpreadsheet className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.webp':
      case '.gif':
        return <Image className="w-7 h-7 text-pink-500 dark:text-pink-400" />
      case '.mp4':
      case '.avi':
      case '.mov':
      case '.mkv':
        return <Video className="w-7 h-7 text-rose-500 dark:text-rose-400" />
      case '.zip':
      case '.rar':
      case '.7z':
        return <Archive className="w-7 h-7 text-amber-500 dark:text-amber-400" />
      case '.dwg':
      case '.dxf':
      case '.ncz':
        return <Layers className="w-7 h-7 text-purple-500 dark:text-purple-400" />
      default:
        return <Code className="w-7 h-7 text-slate-400" />
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Üst Gezgin Çubuğu */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title={isSidebarOpen ? 'Kategori Panelini Daralt' : 'Kategori Panelini Aç'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          {/* Sürücü Butonları */}
          <div className="flex items-center gap-1">
            {drives.map((d) => {
              const active = baseDir.toUpperCase().startsWith(d.driveCode.toUpperCase())
              return (
                <button
                  key={d.mountPath}
                  onClick={() => changeDirectory(d.mountPath)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-mono font-bold flex items-center gap-1 transition ${
                    active
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/40'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5 text-sky-500" />
                  <span>{d.driveCode}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={handleSelectFolder}
            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
          >
            <FolderSearch className="w-3.5 h-3.5" />
            <span>Klasör Seç...</span>
          </button>
        </div>

        {/* Breadcrumb / Düzenlenebilir Dizin Yolu */}
        <div className="flex items-center gap-1.5 flex-1 max-w-2xl min-w-0">
          {getParentDir(baseDir) && (
            <button
              onClick={() => changeDirectory(getParentDir(baseDir)!)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title={`Üst Klasöre Çık: ${getParentDir(baseDir)}`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}

          {!isEditingPath ? (
            <div className="flex-1 flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 min-w-0">
              <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0 mr-1" />
              <div className="flex items-center gap-1 flex-1 overflow-x-auto py-0.5">
                {parseBreadcrumbs(baseDir).map((crumb, idx, arr) => (
                  <div key={crumb.path} className="flex items-center shrink-0">
                    <button
                      onClick={() => changeDirectory(crumb.path)}
                      className={`text-xs px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-slate-800 transition truncate max-w-[160px] ${
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
            <div className="flex-1 flex items-center gap-1">
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

        {/* Hızlı Eylemler */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenInTreemap(baseDir)}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-sky-500/20"
            title="Bu dizini Görsel Disk Haritasında (Treemap) aç"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Treemap Haritası</span>
          </button>
          <button
            onClick={() => onSendToPythonRunner(baseDir)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-500/25"
            title="Bu dizini Native Python Motoruna aktar"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Python ile Tara</span>
          </button>
        </div>
      </div>

      {/* Ana Gövde */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sol Semantik Kümeleme Kenar Çubuğu */}
        {isSidebarOpen && (
          <aside className="w-76 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0">
            <div className="p-3 overflow-y-auto flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-sky-500" />
                  Semantik Kategori Perspektifi
                </span>
                <button
                  onClick={handleSelectFolder}
                  className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 hover:underline"
                >
                  <FolderPlus className="w-3 h-3" />
                  Klasör Aç
                </button>
              </div>

              {/* 5 Perspektif Sekmesi */}
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] mb-2.5">
                <button
                  onClick={() => setPerspective('topics')}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-between transition ${
                    perspective === 'topics'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Konular
                  </span>
                  <span className="text-[9px] font-mono opacity-80">
                    {analysis.smartTopics.length}
                  </span>
                </button>

                <button
                  onClick={() => setPerspective('folders')}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-between transition ${
                    perspective === 'folders'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Folder className="w-3 h-3" /> Klasörler
                  </span>
                  <span className="text-[9px] font-mono opacity-80">
                    {realSubfolders.length || analysis.realFolders.length}
                  </span>
                </button>

                <button
                  onClick={() => setPerspective('years')}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-between transition ${
                    perspective === 'years'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Zaman
                  </span>
                  <span className="text-[9px] font-mono opacity-80">
                    {analysis.yearClusters.length}
                  </span>
                </button>

                <button
                  onClick={() => setPerspective('formats')}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-between transition ${
                    perspective === 'formats'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Türler
                  </span>
                  <span className="text-[9px] font-mono opacity-80">
                    {analysis.formatClusters.length}
                  </span>
                </button>

                <button
                  onClick={() => setPerspective('preset')}
                  className={`col-span-2 py-1 px-2 rounded-lg flex items-center justify-between transition ${
                    perspective === 'preset'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" /> Kurumsal Şablon (00..11)
                  </span>
                  <span className="text-[9px] font-mono opacity-80">
                    {PRESET_MUNICIPAL_TOPICS.length}
                  </span>
                </button>
              </div>

              {/* Kategori İçi Arama */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sidebarFilterText}
                  onChange={(e) => setSidebarFilterText(e.target.value)}
                  placeholder="Kümelerde filtrele..."
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-6 py-1.5 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Tüm Dosyalar */}
              <button
                onClick={() => {
                  setActiveFilter(null)
                  setSelectedTag(null)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition mb-2 border ${
                  !activeFilter && !selectedTag
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold border-sky-500/30'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-sky-500" />
                  Tüm Dosyalar
                </span>
                <span className="text-[10px] font-mono font-bold">{files.length}</span>
              </button>

              {/* Perspektif Listesi */}
              {perspective === 'topics' && (
                <div className="space-y-0.5">
                  {analysis.smartTopics
                    .filter(
                      (t) =>
                        !sidebarFilterText.trim() ||
                        t.label.toLowerCase().includes(sidebarFilterText.toLowerCase())
                    )
                    .map((topic) => {
                      const isActive =
                        activeFilter?.type === 'topic' && activeFilter.value === topic.label
                      return (
                        <button
                          key={topic.id}
                          onClick={() =>
                            setActiveFilter(
                              isActive
                                ? null
                                : {
                                    type: 'topic',
                                    value: topic.label,
                                    label: `Konu: ${topic.label}`
                                  }
                            )
                          }
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                            isActive
                              ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="truncate">{topic.label}</span>
                          <span className="text-[10px] font-mono opacity-75">{topic.count}</span>
                        </button>
                      )
                    })}
                </div>
              )}

              {perspective === 'folders' && (
                <div className="space-y-0.5">
                  {(realSubfolders.length > 0 ? realSubfolders : analysis.realFolders)
                    .filter((f: { name?: string; label?: string }) =>
                      !sidebarFilterText.trim() ||
                      (f.name || f.label || '')
                        .toLowerCase()
                        .includes(sidebarFilterText.toLowerCase())
                    )
                    .map((f: { name?: string; label?: string; fileCount?: number; count?: number }) => {
                      const name = f.name || f.label || ''
                      const count = f.fileCount !== undefined ? f.fileCount : f.count || 0
                      const isActive =
                        activeFilter?.type === 'folder' && activeFilter.value === name
                      return (
                        <button
                          key={name}
                          onClick={() =>
                            setActiveFilter(
                              isActive
                                ? null
                                : { type: 'folder', value: name, label: `Klasör: ${name}` }
                            )
                          }
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {name}
                          </span>
                          <span className="text-[10px] font-mono opacity-75">{count}</span>
                        </button>
                      )
                    })}
                </div>
              )}

              {perspective === 'years' && (
                <div className="space-y-0.5">
                  {analysis.yearClusters.map((c) => {
                    const yr = c.badge || c.label
                    const isActive = activeFilter?.type === 'year' && activeFilter.value === yr
                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          setActiveFilter(
                            isActive
                              ? null
                              : { type: 'year', value: yr, label: `${yr} Yılı Belgeleri` }
                          )
                        }
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{c.label}</span>
                        <span className="text-[10px] font-mono opacity-75">{c.count}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {perspective === 'formats' && (
                <div className="space-y-0.5">
                  {analysis.formatClusters.map((c) => {
                    const isActive =
                      activeFilter?.type === 'format' && activeFilter.value === c.id
                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          setActiveFilter(
                            isActive ? null : { type: 'format', value: c.id, label: c.label }
                          )
                        }
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                          isActive
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">{c.label}</span>
                        <span className="text-[10px] font-mono opacity-75">{c.count}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {perspective === 'preset' && (
                <div className="space-y-0.5">
                  {PRESET_MUNICIPAL_TOPICS.map((topic) => {
                    const isActive =
                      activeFilter?.type === 'preset' && activeFilter.value === topic
                    return (
                      <button
                        key={topic}
                        onClick={() =>
                          setActiveFilter(
                            isActive
                              ? null
                              : { type: 'preset', value: topic, label: `Şablon: ${topic}` }
                          )
                        }
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs truncate flex items-center gap-2 transition ${
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{topic}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Akıllı Etiketler */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-sky-500" />
                    Akıllı Etiketler ({allUniqueTags.length})
                  </span>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-[10px] text-sky-500 hover:underline"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {allUniqueTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                        selectedTag === t
                          ? 'bg-sky-600 text-white border-sky-500'
                          : getTagBadgeClass(t, isDarkMode)
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-500">
              <span>Görüntülenen:</span>
              <b className="font-mono text-sky-500">
                {filteredFiles.length} / {files.length} dosya
              </b>
            </div>
          </aside>
        )}

        {/* Orta Alan: Alt Klasörler + Dosya Grid / Tablo */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Arama + Görünüm + Derinlik Çubuğu */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Dosya adı veya etiket ara... (#ihale, #temin360, .pdf, ada, metraj)"
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-500">Tarama Derinliği:</span>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setScanDepth(d)
                      loadFiles(baseDir, d)
                    }}
                    className={`px-2 py-0.5 rounded-md transition ${
                      scanDepth === d
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {d} Seviye
                  </button>
                ))}
              </div>

              <button
                onClick={() => loadFiles(baseDir, scanDepth)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  viewMode === 'grid'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  viewMode === 'table'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tablo
              </button>
            </div>
          </div>

          {/* Alt Klasörler Şeridi */}
          {realSubfolders.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 flex items-center gap-2 overflow-x-auto shrink-0">
              {realSubfolders.map((sf) => (
                <button
                  key={sf.path}
                  onClick={() => changeDirectory(sf.path)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50 transition flex items-center gap-2 shrink-0 text-left"
                >
                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0 max-w-[160px]">
                    <div className="text-xs font-semibold truncate">{sf.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{sf.fileCount} öğe</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Dosyalar Alanı */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center flex-col gap-2 text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin text-sky-500" />
                <span className="text-xs">Dizin ve semantik kümeler analiz ediliyor...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="h-full flex items-center justify-center flex-col gap-2 text-slate-400">
                <FolderOpen className="w-10 h-10" />
                <span className="text-sm font-semibold">Eşleşen dosya bulunamadı</span>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    onDoubleClick={() => window.diskAnalizAPI?.openFile(file.path)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      selectedFile?.path === file.path
                        ? 'bg-sky-500/10 border-sky-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        {getFileIcon(file.ext)}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {file.ext.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-semibold text-xs line-clamp-2 leading-snug">
                        {file.cleanName}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 mb-1">
                        {formatBytes(file.size)}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {file.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${getTagBadgeClass(
                              t,
                              isDarkMode
                            )}`}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Dosya Adı</th>
                      <th className="py-2.5 px-3">Etiketler</th>
                      <th className="py-2.5 px-3">Tür</th>
                      <th className="py-2.5 px-3 text-right">Boyut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        onDoubleClick={() => window.diskAnalizAPI?.openFile(file.path)}
                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          selectedFile?.path === file.path ? 'bg-sky-500/10' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-medium truncate max-w-md">{file.name}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {file.tags.map((t) => (
                              <span
                                key={t}
                                className={`text-[10px] px-1.5 rounded border ${getTagBadgeClass(
                                  t,
                                  isDarkMode
                                )}`}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400">
                          {file.ext.toUpperCase()}
                        </td>
                        <td className="py-2 px-3 font-mono text-right">{formatBytes(file.size)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sağ Detay ve Etiket Yönetimi Paneli */}
        {selectedFile && (
          <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between overflow-y-auto shrink-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-500" />
                  Dosya Detayları & Etiket
                </h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                {getFileIcon(selectedFile.ext)}
                <p className="font-semibold text-xs text-center mt-2 break-all">
                  {selectedFile.cleanName}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">{formatBytes(selectedFile.size)}</p>
              </div>

              <div className="mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tam Yol</span>
                <p className="font-mono text-[11px] break-all bg-slate-100 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-1 select-all">
                  {selectedFile.path}
                </p>
              </div>

              <div className="mt-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-sky-500" />
                  Etiketleri Yönet
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedFile.tags.map((t) => (
                    <span
                      key={t}
                      className={`text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${getTagBadgeClass(
                        t,
                        isDarkMode
                      )}`}
                    >
                      #{t}
                      <button
                        onClick={() => handleRemoveTag(selectedFile, t)}
                        className="hover:text-rose-500 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Etiket ekle (örn: ihale)"
                    className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag(selectedFile)}
                  />
                  <button
                    onClick={() => handleAddTag(selectedFile)}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={() => window.diskAnalizAPI?.openFile(selectedFile.path)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Dosyayı Aç
              </button>
              <button
                onClick={() => window.diskAnalizAPI?.showInFolder(selectedFile.path)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
              >
                <Folder className="w-3.5 h-3.5" />
                Klasörde Göster
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

