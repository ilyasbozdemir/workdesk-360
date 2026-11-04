import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { AppConfig, AppStatus, FileRecord } from '../../shared/types'
import { evaluateRules } from '../../main/rules/engine'
import { useSearch } from './hooks/useSearch'
import { Header } from './components/Header'
import { VirtualFolderTree } from './components/VirtualFolderTree'
import { FileTableView } from './components/FileTableView'
import { FileGridView } from './components/FileGridView'
import { PreviewPanel } from './components/PreviewPanel'
import { RuleEditorModal } from './components/RuleEditorModal'
import { getDateYearMonth } from './utils/formatters'

export function App(): React.JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [status, setStatus] = useState<AppStatus | null>(null)
  const [allFiles, setAllFiles] = useState<FileRecord[]>([])
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null)

  // Filter & Navigation states
  const [activeViewId, setActiveViewId] = useState<string>('view_all')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null)
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null)
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'mtime' | 'ext'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)

  // Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Verileri yükle
  const refreshData = useCallback(async () => {
    if (!window.arsiv360) return
    try {
      const [newStatus, newConfig, newFiles] = await Promise.all([
        window.arsiv360.getStatus(),
        window.arsiv360.getConfig(),
        window.arsiv360.getFiles()
      ])
      setStatus(newStatus)
      setConfig(newConfig)
      setAllFiles(newFiles)
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    }
  }, [])

  useEffect(() => {
    refreshData()
    // Canlı IPC güncelleme dinleyicisi
    const unsub = window.arsiv360?.onFilesUpdated(() => {
      refreshData()
    })
    return () => {
      if (unsub) unsub()
    }
  }, [refreshData])

  // Aktif görünümü bul
  const activeView = useMemo(() => {
    if (!config?.views) return null
    return config.views.find((v) => v.id === activeViewId) || config.views[0]
  }, [config, activeViewId])

  // 1. Sanal Görünüm Kuralını Uygula
  const viewFilteredFiles = useMemo(() => {
    if (!activeView) return allFiles

    // Özel mükerrer (Duplicate) görünümü kontrolü
    if (activeView.isDuplicateView) {
      const hashGroups: Record<string, FileRecord[]> = {}
      for (const f of allFiles) {
        if (f.sha256) {
          if (!hashGroups[f.sha256]) hashGroups[f.sha256] = []
          hashGroups[f.sha256].push(f)
        }
      }
      const dups: FileRecord[] = []
      for (const hash in hashGroups) {
        if (hashGroups[hash].length > 1) {
          dups.push(...hashGroups[hash])
        }
      }
      return dups
    }

    return allFiles.filter((f) => evaluateRules(f, activeView.rules))
  }, [allFiles, activeView])

  // 2. Alt Filtreleri Uygula (Kategori, Tarih Grubu, Etiket)
  const categoryAndDateFiltered = useMemo(() => {
    return viewFilteredFiles.filter((f) => {
      if (activeCategoryFilter && f.category !== activeCategoryFilter) return false
      if (activeDateFilter && getDateYearMonth(f.mtimeMs) !== activeDateFilter) return false
      if (activeTagFilter && !(f.tags || []).map((t) => t.toLowerCase()).includes(activeTagFilter.toLowerCase())) {
        return false
      }
      return true
    })
  }, [viewFilteredFiles, activeCategoryFilter, activeDateFilter, activeTagFilter])

  // 3. Fuse.js Arama Filtresini Uygula
  const searchFilteredFiles = useSearch(categoryAndDateFiltered, searchQuery)

  // 4. Sıralama (Türkçe localeCompare('tr') ile ada göre)
  const sortedFiles = useMemo(() => {
    const list = [...searchFilteredFiles]
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
      } else if (sortBy === 'size') {
        cmp = a.size - b.size
      } else if (sortBy === 'mtime') {
        cmp = a.mtimeMs - b.mtimeMs
      } else if (sortBy === 'ext') {
        cmp = a.ext.localeCompare(b.ext, 'tr')
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return list
  }, [searchFilteredFiles, sortBy, sortDirection])

  const handleSortChange = (newSort: 'name' | 'size' | 'mtime' | 'ext') => {
    if (sortBy === newSort) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(newSort)
      setSortDirection('asc')
    }
  }

  const handleOpenFile = async (file: FileRecord) => {
    try {
      await window.arsiv360.openFile(file.path)
    } catch (err: any) {
      alert(err.message || 'Dosya açılamadı.')
    }
  }

  const handleShowInFolder = async (file: FileRecord) => {
    try {
      await window.arsiv360.showInFolder(file.path)
    } catch (err: any) {
      alert(err.message || 'Klasör açılamadı.')
    }
  }

  const handleAddTag = async (filePath: string, tag: string, sha256?: string | null) => {
    await window.arsiv360.addTag(filePath, tag, sha256)
    refreshData()
  }

  const handleRemoveTag = async (filePath: string, tag: string) => {
    await window.arsiv360.removeTag(filePath, tag)
    refreshData()
  }

  const handleSaveConfig = async (newConfig: AppConfig) => {
    await window.arsiv360.saveConfig(newConfig)
    setConfig(newConfig)
    refreshData()
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        status={status}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        isScanning={Boolean(status?.isScanning)}
        onScanNow={async () => {
          await window.arsiv360.scanNow()
          refreshData()
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <VirtualFolderTree
          views={config?.views || []}
          allFiles={allFiles}
          activeViewId={activeViewId}
          activeCategoryFilter={activeCategoryFilter}
          activeDateFilter={activeDateFilter}
          activeTagFilter={activeTagFilter}
          onSelectView={setActiveViewId}
          onSelectCategory={setActiveCategoryFilter}
          onSelectDateGroup={setActiveDateFilter}
          onSelectTag={setActiveTagFilter}
          onOpenRuleModal={() => setIsRuleModalOpen(true)}
        />

        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50/50 dark:bg-slate-950/40">
          {viewMode === 'table' ? (
            <FileTableView
              files={sortedFiles}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onOpenFile={handleOpenFile}
              onShowInFolder={handleShowInFolder}
              onOpenTagModal={() => {}}
            />
          ) : (
            <FileGridView
              files={sortedFiles}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onOpenFile={handleOpenFile}
              onShowInFolder={handleShowInFolder}
              onOpenTagModal={() => {}}
            />
          )}
        </main>

        <PreviewPanel
          file={selectedFile}
          onOpenFile={handleOpenFile}
          onShowInFolder={handleShowInFolder}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />
      </div>

      {config && (
        <RuleEditorModal
          isOpen={isRuleModalOpen}
          config={config}
          onClose={() => setIsRuleModalOpen(false)}
          onSaveConfig={handleSaveConfig}
        />
      )}
    </div>
  )
}
