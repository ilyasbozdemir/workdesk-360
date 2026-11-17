import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, PackageSearch, Zap, CheckCircle2 } from 'lucide-react'
import { APP_ROUTES } from '../../../../../../constants/routeConstants'
import { useWorkspaceStore } from '../../../../../../store/workspaceStore'
import {
  resolveResenWinner,
  executeSetWinnerTransaction
} from '../../../../../../services/dossier/winnerSyncService'
import { emitAppEvent } from '@renderer/utils/appEvents'

interface QuickFirma {
  id: number
  firma_id: number | null
  unvan: string
  teklif_toplami: number | null
}

export function KabulGuardWarning() {
  const { activeDosyaId } = useWorkspaceStore()
  const [availableFirms, setAvailableFirms] = useState<QuickFirma[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!activeDosyaId) return
    const loadFirms = async () => {
      try {
        const res = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT df.id, df.firma_id,
                  COALESCE(NULLIF(df.unvan, ''), NULLIF(f.unvan, ''), 'İstekli Firma') as unvan,
                  df.teklif_toplami
           FROM DATA_TeminFirma df
           LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
           WHERE df.temin_dosya_id = ?
             AND (COALESCE(df.aktif_mi, 1) = 1 OR df.aktif_mi = '1')
           ORDER BY df.id ASC`,
          [activeDosyaId]
        )
        if (res.success && Array.isArray(res.data)) {
          setAvailableFirms(res.data)
        }
      } catch (e) {
        console.warn('KabulGuardWarning: loadFirms error', e)
      }
    }
    loadFirms()
  }, [activeDosyaId])

  const handleResenAutoSelect = async () => {
    if (!activeDosyaId || isProcessing) return
    setIsProcessing(true)
    try {
      const res = await resolveResenWinner(activeDosyaId)
      if (res.winner) {
        emitAppEvent('dossier:updated', { dosyaId: activeDosyaId })
        emitAppEvent('bids:changed', { dosyaId: activeDosyaId })
      }
    } catch (e) {
      console.error('Re\'sen kazanan seçimi başarısız:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualPick = async (teminFirmaId: number, masterFirmaId: number | null) => {
    if (!activeDosyaId || isProcessing) return
    setIsProcessing(true)
    try {
      const res = await executeSetWinnerTransaction({
        activeDosyaId,
        teminFirmaId,
        masterFirmaId
      })
      if (res.success) {
        emitAppEvent('dossier:updated', { dosyaId: activeDosyaId })
        emitAppEvent('bids:changed', { dosyaId: activeDosyaId })
      }
    } catch (e) {
      console.error('Manuel kazanan seçimi başarısız:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-300/50 dark:border-amber-700/40">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <h3 className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
              Kazanan / Yüklenici Firma Belirlenmedi
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400/90 leading-relaxed max-w-xl">
              Muayene &amp; Kabul ve Ödeme belgelerini oluşturabilmek için yüklenici firmayı belirlemeniz gerekir.
              Teklif tutarlarına veya ıslak imzalı belgelere göre <strong>Re&apos;sen</strong> belirleyebilir veya
              dosyadaki isteklilerden birini tek tıkla seçebilirsiniz.
            </p>
          </div>
        </div>

        {/* HIZLI RE'SEN VE LİSTEDEN SEÇİM ALANI */}
        {availableFirms.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Dosyadaki İsteklilerden Re&apos;sen / Doğrudan Yüklenici Seç:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResenAutoSelect}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ En Uygun Teklifi Re&apos;sen Ata</span>
              </button>

              {availableFirms.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleManualPick(f.id, f.firma_id)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="truncate max-w-[200px]">{f.unvan}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-amber-200 dark:border-amber-800/60 pt-4">
          <Link
            to={APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI}
            className="flex items-center gap-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer border-0"
          >
            <PackageSearch className="w-4 h-4" />
            Piyasa Fiyat Araştırması&apos;na Git
          </Link>
          <Link
            to={APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI}
            className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
