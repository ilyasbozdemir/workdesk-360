import React, { useState } from 'react'
import { FileText, Image as ImageIcon, Sliders } from 'lucide-react'
import { SubTool } from './belge-donusturucu/types'
import { DocxToPdfSection } from './belge-donusturucu/DocxToPdfSection'
import { ImagesToPdfSection } from './belge-donusturucu/ImagesToPdfSection'
import { ImageCompressorSection } from './belge-donusturucu/ImageCompressorSection'

export function BelgeDonusturucuTab(): React.JSX.Element {
  const [activeSubTool, setActiveSubTool] = useState<SubTool>('docx-to-pdf')

  return (
    <div className="space-y-6">
      {/* Üst Alt-Araç Seçim Sekmeleri */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900/90 rounded-2xl border border-slate-300/60 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTool('docx-to-pdf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTool === 'docx-to-pdf'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Word (.docx) ➔ PDF Çevirici</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTool('images-to-pdf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTool === 'images-to-pdf'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Görsellerden (JPG/PNG) ➔ Çoklu PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTool('image-converter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTool === 'image-converter'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Görsel Format & Boyut Sıkıştırıcı (EKAP)</span>
        </button>
      </div>

      {/* 1. SEKME: WORD (.DOCX) ➔ PDF ÇEVİRİCİ */}
      {activeSubTool === 'docx-to-pdf' && <DocxToPdfSection />}

      {/* 2. SEKME: GÖRSELLERDEN ➔ ÇOKLU PDF */}
      {activeSubTool === 'images-to-pdf' && <ImagesToPdfSection />}

      {/* 3. SEKME: GÖRSEL FORMAT & BOYUT SIKIŞTIRICI (EKAP) */}
      {activeSubTool === 'image-converter' && <ImageCompressorSection />}
    </div>
  )
}
