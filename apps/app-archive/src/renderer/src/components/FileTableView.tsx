import React from 'react'
import {
  FileText,
  FileSpreadsheet,
  Image,
  Archive,
  File,
  ExternalLink,
  FolderOpen,
  Copy,
  Tag as TagIcon
} from 'lucide-react'
import { FileRecord } from '../../../shared/types'
import { formatFileSize, formatDate } from '../utils/formatters'

interface FileTableViewProps {
  files: FileRecord[]
  selectedFile: FileRecord | null
  onSelectFile: (file: FileRecord) => void
  onOpenFile: (file: FileRecord) => void
  onShowInFolder: (file: FileRecord) => void
  onOpenTagModal: (file: FileRecord) => void
}

export function FileTableView({
  files,
  selectedFile,
  onSelectFile,
  onOpenFile,
  onShowInFolder,
  onOpenTagModal
}: FileTableViewProps): React.JSX.Element {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number
    y: number
    file: FileRecord
  } | null>(null)

  React.useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'pdf':
      case 'word':
        return <FileText className="w-4 h-4 text-blue-500 shrink-0" />
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
      case 'gorsel':
        return <Image className="w-4 h-4 text-purple-500 shrink-0" />
      case 'arsiv':
        return <Archive className="w-4 h-4 text-amber-500 shrink-0" />
      default:
        return <File className="w-4 h-4 text-slate-400 shrink-0" />
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <File className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium">Bu kriterlere uygun dosya bulunamadı.</p>
        <p className="text-xs text-slate-400 mt-1">Belgeler klasörüne yeni dosyalar ekleyebilir veya filtreleri değiştirebilirsiniz.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto relative">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 z-10 select-none">
          <tr>
            <th className="py-2 px-3 font-semibold w-10"></th>
            <th className="py-2 px-3 font-semibold">Dosya Adı</th>
            <th className="py-2 px-3 font-semibold w-24">Boyut</th>
            <th className="py-2 px-3 font-semibold w-36">Değiştirilme</th>
            <th className="py-2 px-3 font-semibold w-24">Konum</th>
            <th className="py-2 px-3 font-semibold w-36">Etiketler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {files.map((file) => {
            const isSelected = selectedFile?.id === file.id
            return (
              <tr
                key={file.id}
                onClick={() => onSelectFile(file)}
                onDoubleClick={() => onOpenFile(file)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  onSelectFile(file)
                  setContextMenu({ x: e.clientX, y: e.clientY, file })
                }}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-200'
                }`}
              >
                <td className="py-2 px-3 text-center">{getFileIcon(file.category)}</td>
                <td className="py-2 px-3 truncate max-w-xs" title={file.name}>
                  {file.name}
                </td>
                <td className="py-2 px-3 text-slate-500 font-mono whitespace-nowrap">
                  {formatFileSize(file.size)}
                </td>
                <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                  {formatDate(file.mtimeMs)}
                </td>
                <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]" title={file.relativePath}>
                  {file.relativePath}
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {(file.tags || []).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Sağ Tık Menüsü */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 w-48 text-xs select-none animate-in fade-in duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onOpenFile(contextMenu.file)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Varsayılan Uygulamada Aç</span>
          </button>
          <button
            onClick={() => {
              onShowInFolder(contextMenu.file)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Klasörde Göster</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.file.path)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Tam Yolu Kopyala</span>
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
          <button
            onClick={() => {
              onOpenTagModal(contextMenu.file)
              setContextMenu(null)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-blue-600 dark:text-blue-400 cursor-pointer font-medium"
          >
            <TagIcon className="w-3.5 h-3.5" />
            <span>Etiket Ekle / Düzenle</span>
          </button>
        </div>
      )}
    </div>
  )
}

