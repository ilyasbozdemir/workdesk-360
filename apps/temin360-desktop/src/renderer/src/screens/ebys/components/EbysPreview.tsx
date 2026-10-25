import React from 'react'
import { EbysTemplate } from '../ebys.types'
import { ShieldCheck, Info } from 'lucide-react'

interface EbysPreviewProps {
  template: EbysTemplate
  html: string
  css: string
  zoomLevel: number
}

export const EbysPreview: React.FC<EbysPreviewProps> = ({ template, html, css, zoomLevel }) => {
  return (
    <div className="flex-1 bg-slate-100/90 dark:bg-slate-950 overflow-auto p-6 flex flex-col items-center justify-start relative custom-scrollbar">
      {/* Üst Bilgi Barı */}
      <div className="w-full max-w-[210mm] mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Mevzuat Uyumu:</strong> {template.complianceNotes[0]}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Standart A4 (210 × 297 mm)</span>
        </div>
      </div>

      {/* A4 Kağıt Taşıyıcı ve Zoom Konteyneri */}
      <div
        className="transition-transform duration-150 origin-top flex flex-col items-center drop-shadow-2xl"
        style={{
          transform: `scale(${zoomLevel / 100})`,
          marginBottom: `${(zoomLevel / 100) * 40}px`
        }}
      >
        {/* Enjekte Edilen CSS */}
        <style dangerouslySetInnerHTML={{ __html: css }} />

        {/* Gerçek Belge HTML Çıktısı */}
        <div
          className="ebys-document-container border border-slate-300 shadow-2xl rounded-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
