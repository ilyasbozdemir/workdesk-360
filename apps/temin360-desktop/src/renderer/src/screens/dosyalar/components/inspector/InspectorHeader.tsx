import React from 'react'
import { Edit, ExternalLink, FileSpreadsheet, Layers, X } from 'lucide-react'
import { exportDogrudanTeminMasterExcel } from '../../../../services/excelExportService'
import { useTabStore } from '../../../../store/tabStore'
import { useWorkspaceStore } from '../../../../store/workspaceStore'
import { useNavigate } from '@tanstack/react-router'
import { statusLabelMap, turLabelMap } from './types'
import { APP_ROUTES } from '../../../../constants/routeConstants'

interface InspectorHeaderProps {
  dosya: any
  subData: any
  mode?: 'modal' | 'screen'
  onClose?: () => void
}

export const InspectorHeader: React.FC<InspectorHeaderProps> = ({
  dosya,
  subData,
  mode = 'modal',
  onClose
}) => {
  const { addTab } = useTabStore()
  const navigate = useNavigate()

  const handleOpenAsTab = () => {
    handleGoToTakip()
  }

  const handleEdit = () => {
    if (onClose) onClose()
    const route = `/dosyalar/yeni?id=${dosya.id}`
    addTab(route)
    navigate({ to: route })
  }

  const handleGoToTakip = () => {
    if (onClose) onClose()
    if (dosya?.id) {
      useWorkspaceStore.getState().setActiveDosyaId(dosya.id)
    }
    try {
      localStorage.setItem('temin_takip_view_mode', 'detay')
      window.dispatchEvent(
        new CustomEvent('takip:view-mode-changed', {
          detail: { mode: 'detay', dosyaId: dosya?.id }
        })
      )
    } catch {
      // ignore
    }
    addTab(APP_ROUTES.DOSYA_DETAY)
    navigate({ to: APP_ROUTES.DOSYA_DETAY })
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 shrink-0">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0 font-black text-sm tracking-wider">
          DT
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
              {dosya.temin_no
                ? `DT-${dosya.butce_yili || '2026'}/${dosya.temin_no}`
                : `#${dosya.id}`}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-lg">
              {dosya.konu || 'Dosya Künyesi'}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {statusLabelMap[dosya.status] || 'Devam Ediyor'}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            Birim:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {dosya.birim_adi || dosya.harcama_birimi || 'Belirtilmemiş'}
            </strong>{' '}
            • Tür:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {turLabelMap[dosya.tur] || 'Mal'}
            </strong>{' '}
            • Bütçe Yılı:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {dosya.butce_yili || '2026'}
            </strong>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleGoToTakip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-all text-xs font-bold cursor-pointer shadow-xs active:scale-95"
          title="Süreç Takip Paneline Git"
        >
          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Süreç Takip Paneli
        </button>

        {mode === 'modal' && (
          <button
            onClick={handleOpenAsTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-all text-xs font-bold cursor-pointer shadow-xs active:scale-95"
            title="Dosya Künyesini Tam Ekran Sekmede Aç"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Sekmede Aç
          </button>
        )}

        <button
          onClick={() => {
            exportDogrudanTeminMasterExcel({
              dosya,
              kalemler: subData.kalemler,
              firmalar: subData.firmalar,
              teklifler: subData.teklifler,
              komisyon: subData.komisyon
            })
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-xs font-bold cursor-pointer shadow-xs active:scale-95"
          title="Master Excel İndir (.xlsx)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Master Excel
        </button>

        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all text-xs font-bold cursor-pointer shadow-xs active:scale-95"
          title="Dosya Düzenleme Formuna Git"
        >
          <Edit className="w-3.5 h-3.5" />
          Düzenle
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
