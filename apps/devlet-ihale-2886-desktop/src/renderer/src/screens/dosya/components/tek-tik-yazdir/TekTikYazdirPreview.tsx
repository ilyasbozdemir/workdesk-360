import React from 'react'
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer } from 'lucide-react'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'

interface TekTikYazdirPreviewProps {
  currentPreviewSablon: Sablon | null
  selectedSablonsCount: number
  activePreviewIndex: number
  setActivePreviewIndex: React.Dispatch<React.SetStateAction<number>>
  zoomLevel: number
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>
  previewHtml: string
}

export const TekTikYazdirPreview: React.FC<TekTikYazdirPreviewProps> = ({
  currentPreviewSablon,
  selectedSablonsCount,
  activePreviewIndex,
  setActivePreviewIndex,
  zoomLevel,
  setZoomLevel,
  previewHtml
}) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Preview Toolbar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={16} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-bold text-white truncate">
            {currentPreviewSablon ? currentPreviewSablon.ad : 'Önizlenecek Belge Seçilmedi'}
          </span>
          {currentPreviewSablon && (
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              ({currentPreviewSablon.dosya_adi})
            </span>
          )}
        </div>

        {/* Zoom & Page Navigation */}
        {selectedSablonsCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActivePreviewIndex((prev) => Math.max(0, prev - 1))}
                disabled={activePreviewIndex === 0}
                className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-semibold text-slate-200 px-1">
                {activePreviewIndex + 1} / {selectedSablonsCount}
              </span>
              <button
                onClick={() =>
                  setActivePreviewIndex((prev) => Math.min(selectedSablonsCount - 1, prev + 1))
                }
                disabled={activePreviewIndex >= selectedSablonsCount - 1}
                className="p-1 rounded text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
                title="Uzaklaştır"
              >
                <ZoomOut size={14} />
              </button>
              <span className="font-mono text-slate-200 w-12 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(175, z + 15))}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
                title="Yakınlaştır"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Content Viewport */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-950/90 custom-scrollbar">
        {currentPreviewSablon ? (
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease'
            }}
            className="shadow-2xl rounded-xs overflow-hidden bg-white text-black min-h-[1050px] w-[794px] shrink-0 my-2"
          >
            <iframe
              title="Live Preview"
              srcDoc={previewHtml}
              className="w-full h-full min-h-[1050px] border-0"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 text-slate-500 my-auto">
            <Printer size={48} className="stroke-[1.5] mb-3 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">Önizleme İçin Belge Seçin</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Sol listeden yazdırmak veya önizlemek istediğiniz resmi evrakları işaretleyin.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
