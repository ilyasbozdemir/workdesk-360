import React from 'react'
import { FileCheck, Archive, Download, Printer } from 'lucide-react'

interface TekTikYazdirActionBarProps {
  selectedCount: number
  pageSize: string
  orientation: string
  processingAction: 'print' | 'pdf' | 'zip' | null
  onAction: (action: 'print' | 'pdf' | 'zip') => Promise<void>
}

export const TekTikYazdirActionBar: React.FC<TekTikYazdirActionBarProps> = ({
  selectedCount,
  pageSize,
  orientation,
  processingAction,
  onAction
}) => {
  return (
    <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <FileCheck size={14} className="text-emerald-400" />
          <strong className="text-white">{selectedCount}</strong> Belge Hazır
        </span>
        <span className="hidden sm:inline text-slate-600">•</span>
        <span className="hidden sm:inline">
          Kağıt:{' '}
          <strong className="text-slate-200">
            {pageSize} ({orientation === 'portrait' ? 'Dikey' : 'Yatay'})
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Export ZIP */}
        <button
          onClick={() => onAction('zip')}
          disabled={selectedCount === 0 || !!processingAction}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          <Archive size={14} />
          ZIP Paketi
        </button>

        {/* Export PDF */}
        <button
          onClick={() => onAction('pdf')}
          disabled={selectedCount === 0 || !!processingAction}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          <Download size={14} />
          PDF Olarak Kaydet
        </button>

        {/* DIRECT PRINT BUTTON */}
        <button
          onClick={() => onAction('print')}
          disabled={selectedCount === 0 || !!processingAction}
          className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
        >
          <Printer size={16} className="stroke-[2.5]" />
          {processingAction === 'print' ? 'Yazdırılıyor...' : '🖨️ Tek Tıkla Yazdır'}
        </button>
      </div>
    </div>
  )
}
