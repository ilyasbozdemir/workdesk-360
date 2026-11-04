import React from 'react'
import {
  FileText,
  ExternalLink,
  FolderOpen,
  Tag as TagIcon,
  X,
  Plus,
  Clock
} from 'lucide-react'
import { FileRecord } from '../../../shared/types'
import { formatFileSize, formatDate } from '../utils/formatters'

interface PreviewPanelProps {
  file: FileRecord | null
  onOpenFile: (file: FileRecord) => void
  onShowInFolder: (file: FileRecord) => void
  onAddTag: (filePath: string, tag: string, sha256?: string | null) => void
  onRemoveTag: (filePath: string, tag: string) => void
}

export function PreviewPanel({
  file,
  onOpenFile,
  onShowInFolder,
  onAddTag,
  onRemoveTag
}: PreviewPanelProps): React.JSX.Element {
  const [newTagInput, setNewTagInput] = React.useState('')
  const [textContent, setTextContent] = React.useState<string | null>(null)
  const [textLoading, setTextLoading] = React.useState(false)

  // Metin dosyalarını arsiv:// protokolüyle çek
  React.useEffect(() => {
    if (!file) {
      setTextContent(null)
      return
    }

    const ext = file.ext.toLowerCase()
    const isText = ['.txt', '.md', '.json', '.log', '.xml', '.csv', '.js', '.ts'].includes(ext)

    if (isText) {
      setTextLoading(true)
      const encoded = encodeURI(file.relativePath.replace(/\\/g, '/'))
      fetch(`arsiv://${encoded}`)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text.slice(0, 10000)) // Maksimum 10KB önizleme
          setTextLoading(false)
        })
        .catch(() => {
          setTextContent('Metin önizlemesi yüklenemedi.')
          setTextLoading(false)
        })
    } else {
      setTextContent(null)
    }
  }, [file])

  if (!file) {
    return (
      <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-slate-400 select-none shrink-0">
        <FileText className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-xs font-medium text-center">Önizlemek için bir dosya seçin</p>
      </aside>
    )
  }

  const encodedUrl = `arsiv://${encodeURI(file.relativePath.replace(/\\/g, '/'))}`
  const isPdf = file.ext.toLowerCase() === '.pdf'
  const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].includes(
    file.ext.toLowerCase()
  )

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTagInput.trim()
    if (trimmed) {
      onAddTag(file.path, trimmed, file.sha256)
      setNewTagInput('')
    }
  }

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Üst Önizleme Alanı */}
      <div className="h-64 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative">
        {isPdf ? (
          <iframe
            src={`${encodedUrl}#toolbar=0`}
            className="w-full h-full border-0"
            title="PDF Önizleme"
          />
        ) : isImage ? (
          <img
            src={encodedUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain p-2"
          />
        ) : textContent !== null ? (
          <div className="w-full h-full p-3 overflow-auto text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-text">
            {textLoading ? 'Yükleniyor...' : textContent}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center select-none text-slate-400">
            <FileText className="w-12 h-12 stroke-[1.2] mb-2 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
              {file.ext} Dosyası
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Doğrudan önizleme desteklenmiyor</span>
          </div>
        )}
      </div>

      {/* Aksiyon Butonları */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenFile(file)}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Aç</span>
        </button>
        <button
          onClick={() => onShowInFolder(file)}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Klasörde Göster</span>
        </button>
      </div>

      {/* Dosya Bilgileri (Metadata) */}
      <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-800 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Dosya Adı
          </span>
          <p className="font-semibold text-slate-800 dark:text-slate-100 break-all select-text mt-0.5">
            {file.name}
          </p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Göreli Konum
          </span>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all select-text mt-0.5">
            {file.relativePath}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Boyut
            </span>
            <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
              {formatFileSize(file.size)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Kategori
            </span>
            <p className="capitalize text-slate-700 dark:text-slate-300 mt-0.5">
              {file.category}
            </p>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Değiştirilme Tarihi
          </span>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
            {formatDate(file.mtimeMs)}
          </p>
        </div>

        {file.sha256 ? (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              SHA-256 Özeti
            </span>
            <p className="font-mono text-[10px] text-slate-500 break-all select-text mt-0.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded border border-slate-200/50 dark:border-slate-800">
              {file.sha256}
            </p>
          </div>
        ) : (
          <div className="text-[10px] text-amber-500 flex items-center gap-1 pt-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Hash kuyrukta hesaplanıyor...</span>
          </div>
        )}
      </div>

      {/* Etiket Yönetimi */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <TagIcon className="w-3 h-3 text-blue-500" />
            Etiketler
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(file.tags || []).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              <span>{t}</span>
              <button
                onClick={() => onRemoveTag(file.path, t)}
                className="hover:text-red-500 cursor-pointer p-0.5"
                title="Etiketi Kaldır"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {(!file.tags || file.tags.length === 0) && (
            <span className="text-xs text-slate-400 italic">Henüz etiket eklenmemiş</span>
          )}
        </div>

        <form onSubmit={handleAddTagSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder="Etiket yazıp Enter'a basın..."
            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer"
            title="Ekle"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  )
}
