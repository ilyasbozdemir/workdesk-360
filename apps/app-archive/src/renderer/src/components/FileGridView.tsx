import React from 'react'
import {
  FileText,
  FileSpreadsheet,
  Image,
  Archive,
  File
} from 'lucide-react'
import { FileRecord } from '../../../shared/types'
import { formatFileSize, formatDateOnly } from '../utils/formatters'

interface FileGridViewProps {
  files: FileRecord[]
  selectedFile: FileRecord | null
  onSelectFile: (file: FileRecord) => void
  onOpenFile: (file: FileRecord) => void
  onShowInFolder: (file: FileRecord) => void
  onOpenTagModal?: (file: FileRecord) => void
}

export function FileGridView({
  files,
  selectedFile,
  onSelectFile,
  onOpenFile,
  onShowInFolder
}: FileGridViewProps): React.JSX.Element {
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'pdf':
      case 'word':
        return <FileText className="w-8 h-8 text-blue-500 mb-2" />
      case 'excel':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-500 mb-2" />
      case 'gorsel':
        return <Image className="w-8 h-8 text-purple-500 mb-2" />
      case 'arsiv':
        return <Archive className="w-8 h-8 text-amber-500 mb-2" />
      default:
        return <File className="w-8 h-8 text-slate-400 mb-2" />
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <File className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-medium">Bu kriterlere uygun dosya bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 content-start">
      {files.map((file) => {
        const isSelected = selectedFile?.id === file.id
        return (
          <div
            key={file.id}
            onClick={() => onSelectFile(file)}
            onDoubleClick={() => onOpenFile(file)}
            onContextMenu={(e) => {
              e.preventDefault()
              onSelectFile(file)
              onShowInFolder(file)
            }}
            className={`p-3 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {getFileIcon(file.category)}
            <span
              className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 break-all w-full leading-tight"
              title={file.name}
            >
              {file.name}
            </span>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-mono">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{formatDateOnly(file.mtimeMs)}</span>
            </div>
            {file.tags && file.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
                {file.tags.map((t) => (
                  <span
                    key={t}
                    className="px-1 py-0.2 rounded text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
