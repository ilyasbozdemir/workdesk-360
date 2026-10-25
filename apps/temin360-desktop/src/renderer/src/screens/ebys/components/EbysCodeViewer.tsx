import React, { useState } from 'react'
import { Copy, Check, Download, Code2, FileCode } from 'lucide-react'

interface EbysCodeViewerProps {
  html: string
  css: string
  copyStatus: string | null
  onCopy: (type: 'html' | 'css') => void
  onDownloadHtml: () => void
  onDownloadCss: () => void
}

export const EbysCodeViewer: React.FC<EbysCodeViewerProps> = ({
  html,
  css,
  copyStatus,
  onCopy,
  onDownloadHtml,
  onDownloadCss
}) => {
  const [codeType, setCodeType] = useState<'html' | 'css'>('html')

  const currentCode = codeType === 'html' ? html.trim() : css.trim()

  return (
    <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
      {/* Üst Kontrol Barı */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCodeType('html')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                codeType === 'html'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              HTML Çıktısı (.html)
            </button>
            <button
              onClick={() => setCodeType('css')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                codeType === 'css'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              CSS Stilleri (.css)
            </button>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {codeType === 'html'
              ? `${currentCode.split('\n').length} satır HTML`
              : `${currentCode.split('\n').length} satır CSS`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {copyStatus && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {copyStatus}
            </span>
          )}

          <button
            onClick={() => onCopy(codeType)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Panoya Kopyala
          </button>

          <button
            onClick={codeType === 'html' ? onDownloadHtml : onDownloadCss}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-medium border border-blue-500/30 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Dosya Olarak İndir
          </button>
        </div>
      </div>

      {/* Kod Gövdesi */}
      <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed bg-[#0d1117] text-slate-200 selection:bg-blue-900 custom-scrollbar">
        <pre className="whitespace-pre-wrap break-words">{currentCode}</pre>
      </div>
    </div>
  )
}
