import React from 'react'
import {
  FileText,
  Printer,
  Download,
  BookOpen,
  Code2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PenTool
} from 'lucide-react'
import { StudioTab } from '../hooks/useEbysStudio'

interface EbysHeaderProps {
  activeTab: StudioTab
  setActiveTab: (tab: StudioTab) => void
  zoomLevel: number
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>
  onPrint: () => void
  onDownloadHtml: () => void
  onDownloadCss: () => void
  onOpenMevzuat: () => void
  templateName: string
}

export const EbysHeader: React.FC<EbysHeaderProps> = ({
  activeTab,
  setActiveTab,
  zoomLevel,
  setZoomLevel,
  onPrint,
  onDownloadHtml,
  onDownloadCss,
  onOpenMevzuat,
  templateName
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* SOL: Başlık & Rozetler */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Türkçe EBYS Resmî Yazışma Şablonları &amp; Stüdyosu
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              YÖNETMELİK 2646 UYUMLU
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aktif Şablon:{' '}
            <span className="text-blue-600 dark:text-blue-400 font-medium">{templateName}</span> •
            A4 Resmî Belge Standardı &amp; e-Yazışma (EYP 2.0)
          </p>
        </div>
      </div>

      {/* SAĞ: Sekmeler ve Aksiyon Butonları */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Görünüm Sekmeleri */}
        <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Canlı TipTap Editörü
            <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              A4
            </span>
          </button>
          <button
            onClick={() => setActiveTab('resmi_yazi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'resmi_yazi'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Resmî Üst Yazı
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Şablon Önizleme
          </button>
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'html'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            HTML Kodu
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'css'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            CSS Stilleri
          </button>
          <button
            onClick={onOpenMevzuat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mevzuat'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Mevzuat &amp; Rehber
          </button>
        </div>

        {/* Zoom Kontrolleri */}
        {(activeTab === 'preview' || activeTab === 'resmi_yazi') && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-700 dark:text-slate-300 gap-1.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              title="Uzaklaştır"
              className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono font-semibold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              title="Yakınlaştır"
              className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(90)}
              title="Sıfırla (%90)"
              className="p-1 hover:text-blue-500 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrint}
            title="Yazdır / PDF Olarak Kaydet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Yazdır / PDF</span>
          </button>

          <button
            onClick={onDownloadHtml}
            title="HTML Olarak İndir"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>HTML İndir</span>
          </button>

          <button
            onClick={onDownloadCss}
            title="CSS Dosyasını İndir"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>CSS İndir</span>
          </button>
        </div>
      </div>
    </div>
  )
}
