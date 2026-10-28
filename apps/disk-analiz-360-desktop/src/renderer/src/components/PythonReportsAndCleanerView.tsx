import React, { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  HardDrive,
  List,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Terminal,
  Trash2
} from 'lucide-react'
import { PythonMigrationReports } from '../../../shared/types'
import { generateSafeCleanupScript } from '../../../shared/scriptGenerator'
import { formatBytes } from '../App'

interface PythonReportsAndCleanerViewProps {
  reports: PythonMigrationReports | null
  onReloadReports: () => Promise<void>
  onNavigateToPythonRunner: () => void
  onShowToast: (msg: string) => void
}

interface DuplicateFileEntry {
  path: string
  drive: string
  folder: string
  filename: string
  modified: string
}

function organizeFilesIntoTree(files: DuplicateFileEntry[]): {
  commonRoot: string
  branches: Array<{ subfolder: string; files: DuplicateFileEntry[] }>
} {
  if (!files || files.length === 0) {
    return { commonRoot: '', branches: [] }
  }

  const splitPaths = files.map((f) => {
    const dir = f.folder || f.path.replace(/[\\/][^\\/]+$/, '')
    return dir.replace(/\//g, '\\').split('\\').filter(Boolean)
  })

  let commonParts: string[] = [...(splitPaths[0] || [])]
  for (let i = 1; i < splitPaths.length; i++) {
    const parts = splitPaths[i]
    let j = 0
    while (
      j < commonParts.length &&
      j < parts.length &&
      commonParts[j].toLowerCase() === parts[j].toLowerCase()
    ) {
      j++
    }
    commonParts = commonParts.slice(0, j)
  }

  const commonRoot = commonParts.join('\\')
  const branchMap = new Map<string, DuplicateFileEntry[]>()

  files.forEach((f, idx) => {
    const parts = splitPaths[idx]
    const relParts = parts.slice(commonParts.length)
    const subfolder = relParts.length > 0 ? relParts.join('\\') : '(Kök Dizin)'
    const list = branchMap.get(subfolder) || []
    list.push(f)
    branchMap.set(subfolder, list)
  })

  const branches = Array.from(branchMap.entries()).map(([subfolder, list]) => ({
    subfolder,
    files: list
  }))

  return { commonRoot, branches }
}

export function PythonReportsAndCleanerView({
  reports,
  onReloadReports,
  onNavigateToPythonRunner,
  onShowToast
}: PythonReportsAndCleanerViewProps): React.JSX.Element {
  const [selectedDuplicatePaths, setSelectedDuplicatePaths] = useState<string[]>([])
  const [duplicateViewMode, setDuplicateViewMode] = useState<'tree' | 'list'>('tree')
  const [duplicatePlatform, setDuplicatePlatform] = useState<'powershell' | 'cmd' | 'bash'>(
    'powershell'
  )
  const [isDuplicateSafeMode, setIsDuplicateSafeMode] = useState(true)
  const [showScriptPreview, setShowScriptPreview] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)
  const [fileExistMap, setFileExistMap] = useState<Record<string, boolean>>({})
  const [isCheckingLive, setIsCheckingLive] = useState(false)
  const [isExecutingAction, setIsExecutingAction] = useState(false)

  const duplicateList = reports?.duplicate?.duplicates || []
  const dupSummary = reports?.duplicate?.summary

  const checkLiveExistence = async (): Promise<void> => {
    const api = window.diskAnalizAPI
    if (!api || duplicateList.length === 0) return
    setIsCheckingLive(true)
    try {
      const allPaths = duplicateList
        .slice(0, 80)
        .flatMap((g) => (g.files || []).map((f) => f.path))
      const map = await api.checkFilesExist(allPaths)
      setFileExistMap(map)
    } finally {
      setIsCheckingLive(false)
    }
  }

  useEffect(() => {
    if (duplicateList.length > 0) {
      checkLiveExistence()
    }
  }, [duplicateList.length])

  const selectedSizeFormatted = useMemo(() => {
    let bytes = 0
    const pathSet = new Set(selectedDuplicatePaths)
    duplicateList.forEach((group) => {
      ;(group.files || []).forEach((f) => {
        if (pathSet.has(f.path)) {
          bytes += group.size_bytes || 0
        }
      })
    })
    return formatBytes(bytes)
  }, [duplicateList, selectedDuplicatePaths])

  const toggleDuplicatePath = (path: string): void => {
    setSelectedDuplicatePaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }

  const autoSelectKeepFirst = (): void => {
    const toSelect: string[] = []
    duplicateList.forEach((group) => {
      const files = group.files || []
      for (let i = 1; i < files.length; i++) {
        toSelect.push(files[i].path)
      }
    })
    setSelectedDuplicatePaths(toSelect)
  }

  const autoSelectKeepNewest = (): void => {
    const toSelect: string[] = []
    duplicateList.forEach((group) => {
      const files = [...(group.files || [])].sort((a, b) =>
        (b.modified || '').localeCompare(a.modified || '')
      )
      for (let i = 1; i < files.length; i++) {
        toSelect.push(files[i].path)
      }
    })
    setSelectedDuplicatePaths(toSelect)
  }

  const autoSelectKeepOldest = (): void => {
    const toSelect: string[] = []
    duplicateList.forEach((group) => {
      const files = [...(group.files || [])].sort((a, b) =>
        (a.modified || '').localeCompare(b.modified || '')
      )
      for (let i = 1; i < files.length; i++) {
        toSelect.push(files[i].path)
      }
    })
    setSelectedDuplicatePaths(toSelect)
  }

  const handleDirectMove = async (pathsToMove?: string[]): Promise<void> => {
    const api = window.diskAnalizAPI
    if (!api) return
    const targetPaths = pathsToMove || selectedDuplicatePaths
    if (targetPaths.length === 0) {
      onShowToast('Lütfen taşınacak en az bir dosya seçin.')
      return
    }
    setIsExecutingAction(true)
    try {
      const res = await api.moveFiles({ filePaths: targetPaths })
      onShowToast(
        `Karantinaya Taşındı: ${res.successCount} başarılı (${res.failCount} hata) -> _SILINECEK_KOPYALAR`
      )
      setSelectedDuplicatePaths((prev) => prev.filter((p) => !targetPaths.includes(p)))
      await checkLiveExistence()
    } finally {
      setIsExecutingAction(false)
    }
  }

  const handleDirectDelete = async (pathsToDelete?: string[]): Promise<void> => {
    const api = window.diskAnalizAPI
    if (!api) return
    const targetPaths = pathsToDelete || selectedDuplicatePaths
    if (targetPaths.length === 0) {
      onShowToast('Lütfen Çöp Kutusuna gönderilecek en az bir dosya seçin.')
      return
    }
    setIsExecutingAction(true)
    try {
      const res = await api.deleteFiles({ filePaths: targetPaths, useRecycleBin: true })
      onShowToast(
        `Çöp Kutusuna Gönderildi: ${res.successCount} başarılı (${res.failCount} hata)`
      )
      setSelectedDuplicatePaths((prev) => prev.filter((p) => !targetPaths.includes(p)))
      await checkLiveExistence()
    } finally {
      setIsExecutingAction(false)
    }
  }

  const generateScriptContent = (
    platform: 'powershell' | 'cmd' | 'bash',
    paths: string[],
    isSafe: boolean
  ): string => {
    return generateSafeCleanupScript(platform, paths, isSafe, selectedSizeFormatted)
  }

  const handleCopyScript = async (): Promise<void> => {
    const text = generateScriptContent(
      duplicatePlatform,
      selectedDuplicatePaths,
      isDuplicateSafeMode
    )
    await navigator.clipboard.writeText(text)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  const handleDownloadScript = (): void => {
    const text = generateScriptContent(
      duplicatePlatform,
      selectedDuplicatePaths,
      isDuplicateSafeMode
    )
    const ext =
      duplicatePlatform === 'powershell' ? 'ps1' : duplicatePlatform === 'cmd' ? 'bat' : 'sh'
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kopya_temizle_${duplicatePlatform}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Eksik / Kısmi Tarama Uyarısı (Varsa) */}
      {dupSummary && dupSummary.scan_status === 'PARTIAL_WITH_ERRORS' && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs space-y-1">
          <div className="font-bold text-sm text-amber-400">
            ⚠️ Kısmi Tarama Uyarısı ({dupSummary.total_errors_count || 0} Erişim / Doğrulama Kaydı)
          </div>
          <p>
            Tarama sırasında{' '}
            <b>{dupSummary.skipped_unreadable_dirs_count || 0}</b> klasör ve{' '}
            <b>{dupSummary.skipped_unreadable_files_count || 0}</b> dosya yetki/erişim hatası
            nedeniyle atlandı;{' '}
            <b>{dupSummary.changed_during_scan_count || 0}</b> dosya ise tarama esnasında
            değiştiği (TOCTOU) için mükerrer grubuna dahil edilmedi.
          </p>
        </div>
      )}

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center justify-between">
            <span>Python Motoru Taranan Dosya</span>
            {dupSummary?.scan_status && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  dupSummary.scan_status === 'COMPLETE'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {dupSummary.scan_status === 'COMPLETE' ? 'Eksiksiz' : 'Kısmi'}
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-sky-500 mt-1 font-mono">
            {dupSummary?.total_files_scanned?.toLocaleString('tr-TR') ||
              reports?.migration?.total_files?.toLocaleString('tr-TR') ||
              '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {dupSummary?.total_size_scanned_formatted || 'scanner.py çıktısı'} •{' '}
            {dupSummary?.zero_byte_files_count ?? 0} adet 0B dosya
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Mükerrer Dosya Grubu
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1 font-mono">
            {dupSummary?.duplicate_groups_count ?? duplicateList.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            SHA-256 tam içerik doğrulamalı
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Kurtarılabilir Alan (İsraf)
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-1 font-mono">
            {dupSummary?.total_wasted_formatted || '0 B'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Çapraz Disk: {dupSummary?.cross_drive_groups_count ?? 0} grup
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Kısaltılan Uzun Yollar (MAX_PATH)
          </div>
          <div className="text-2xl font-black text-rose-500 mt-1 font-mono">
            {reports?.migration?.shortened_count ??
              reports?.migration?.summary?.shortened_paths_count ??
              0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Windows 220 karakter koruması
          </div>
        </div>
      </div>

      {/* Mükerrer Dosya Ayıklama & Otomatik Komut Betiği Oluşturucu */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-500" />
              Mükerrer Dosya Ayıklama, Ağaç Görünümü & Çoklu Platform Betik Üretici
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kopyaları tek tıkla `_SILINECEK_KOPYALAR` karantinasına taşıyın, Çöp Kutusuna gönderin
              veya PowerShell/CMD/Bash betiği üretin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-500 border border-sky-500/30">
              {selectedDuplicatePaths.length} kopya seçili ({selectedSizeFormatted})
            </span>
            <button
              onClick={checkLiveExistence}
              disabled={isCheckingLive}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isCheckingLive ? 'animate-spin text-sky-500' : ''}`}
              />
              <span>Canlı Disk Kontrolü</span>
            </button>
            <button
              onClick={onReloadReports}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Raporları Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doğrudan İşletim Sistemi Eylemleri */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-300 block">
                Doğrudan İşletim Sistemi Eylemleri (Terminal Gerektirmez)
              </span>
              <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                Sistem koruması kontrolüyle karantinaya taşıyabilir veya Çöp Kutusuna gönderebilirsiniz.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDirectMove()}
              disabled={selectedDuplicatePaths.length === 0 || isExecutingAction}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Karantinaya Taşı ({selectedDuplicatePaths.length})</span>
            </button>
            <button
              onClick={() => handleDirectDelete()}
              disabled={selectedDuplicatePaths.length === 0 || isExecutingAction}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Çöp Kutusuna Gönder ({selectedDuplicatePaths.length})</span>
            </button>
          </div>
        </div>

        {/* Akıllı Seçim & Betik Çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Akıllı Seçim:
            </span>
            <button
              onClick={autoSelectKeepFirst}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white"
            >
              İlkini Tut, Kalanları Seç
            </button>
            <button
              onClick={autoSelectKeepNewest}
              className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              En Yeniyi Tut
            </button>
            <button
              onClick={autoSelectKeepOldest}
              className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              En Eskiyi Tut
            </button>
            <button
              onClick={() => setSelectedDuplicatePaths([])}
              className="px-2.5 py-1 rounded-lg text-xs text-rose-500 border border-rose-500/30 hover:bg-rose-500/10"
            >
              Temizle
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg p-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
              {(['powershell', 'cmd', 'bash'] as const).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setDuplicatePlatform(plat)}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    duplicatePlatform === plat
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {plat === 'powershell' ? 'PS1' : plat === 'cmd' ? 'CMD' : 'Bash'}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isDuplicateSafeMode}
                onChange={(e) => setIsDuplicateSafeMode(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Güvenli Mod</span>
            </label>

            <button
              onClick={() => setShowScriptPreview((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-sky-500" />
              <span>{showScriptPreview ? 'Gizle' : 'Betik Önizle'}</span>
            </button>
            <button
              onClick={handleCopyScript}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white flex items-center gap-1"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
            <button
              onClick={handleDownloadScript}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>İndir</span>
            </button>
          </div>
        </div>

        {showScriptPreview && (
          <pre className="rounded-xl border border-slate-800 bg-[#090d16] p-4 text-xs font-mono text-sky-300 overflow-x-auto max-h-60">
            {generateScriptContent(
              duplicatePlatform,
              selectedDuplicatePaths,
              isDuplicateSafeMode
            )}
          </pre>
        )}

        {/* Görünüm Modu (Ağaç vs Liste) */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold text-slate-500">
            Mükerrer Dosya Grupları ({duplicateList.length} grup)
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setDuplicateViewMode('tree')}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 ${
                duplicateViewMode === 'tree'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-500'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" /> Ağaç Görünümü
            </button>
            <button
              onClick={() => setDuplicateViewMode('list')}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 ${
                duplicateViewMode === 'list'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Düz Liste
            </button>
          </div>
        </div>

        {/* Mükerrer Gruplar */}
        {duplicateList.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-sm">
              Henüz Python `scanner.py` raporu (`duplicate_report.json`) oluşturulmadı.
            </p>
            <button
              onClick={onNavigateToPythonRunner}
              className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" /> Python Motorunda Tarama Başlat
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {duplicateList.slice(0, 50).map((group, idx) => {
              const files = group.files || []
              const treeData = organizeFilesIntoTree(files)
              return (
                <div
                  key={group.group_id || idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">
                        {idx + 1}. {files[0]?.filename || 'Dosya'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        -{group.wasted_formatted} israf
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>
                        Tekil: <b className="text-slate-700 dark:text-slate-200">{group.size_formatted}</b>
                      </span>
                      <span>
                        Adet: <b className="text-slate-700 dark:text-slate-200">{group.count}</b>
                      </span>
                      <span className="font-mono text-[10px]">
                        SHA: {group.hash?.substring(0, 10)}...
                      </span>
                    </div>
                  </div>

                  {duplicateViewMode === 'tree' ? (
                    <div className="p-2.5 space-y-2">
                      {treeData.commonRoot && (
                        <div className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] font-mono text-sky-500 flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 shrink-0" />
                          <span>Ortak Kök: {treeData.commonRoot}\</span>
                        </div>
                      )}
                      {treeData.branches.map((branch, bIdx) => (
                        <div key={branch.subfolder || bIdx} className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-500">
                            <span>├──</span>
                            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">{branch.subfolder}</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            {branch.files.map((f) => {
                              const isSelected = selectedDuplicatePaths.includes(f.path)
                              const exists = fileExistMap[f.path] !== false
                              return (
                                <div
                                  key={f.path}
                                  onClick={() => exists && toggleDuplicatePath(f.path)}
                                  className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                                    !exists
                                      ? 'opacity-50 border-slate-200 dark:border-slate-800'
                                      : isSelected
                                        ? 'bg-rose-500/10 border-rose-500/40'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <input
                                      type="checkbox"
                                      disabled={!exists}
                                      checked={isSelected && exists}
                                      onChange={() => {}}
                                      className="rounded accent-rose-500"
                                    />
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        !exists
                                          ? 'bg-slate-500/20 text-slate-400'
                                          : isSelected
                                            ? 'bg-rose-500/20 text-rose-400'
                                            : 'bg-emerald-500/20 text-emerald-400'
                                      }`}
                                    >
                                      {!exists ? 'Yok' : isSelected ? 'Silinecek' : 'Saklanacak'}
                                    </span>
                                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-mono text-[11px] truncate">{f.path}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {exists && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDirectMove([f.path])
                                          }}
                                          className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-semibold"
                                        >
                                          Taşı
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDirectDelete([f.path])
                                          }}
                                          className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px] font-semibold"
                                        >
                                          Çöpe At
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.diskAnalizAPI?.showInFolder(f.path)
                                      }}
                                      className="p-1 text-slate-400 hover:text-sky-400"
                                      title="Klasörde Göster"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {files.map((f) => {
                        const isSelected = selectedDuplicatePaths.includes(f.path)
                        const exists = fileExistMap[f.path] !== false
                        return (
                          <div
                            key={f.path}
                            onClick={() => exists && toggleDuplicatePath(f.path)}
                            className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-rose-500/10 border-rose-500/40'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                disabled={!exists}
                                checked={isSelected && exists}
                                onChange={() => {}}
                              />
                              <span className="font-mono text-[11px] truncate">{f.path}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{f.modified}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

