import React, { useState } from 'react'
import { ShieldAlert, Eye, X, AlertTriangle, Lock } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { InspectionTimeline } from './InspectionTimeline'

export const TamperAlertBanner: React.FC = () => {
  const { isTampered, tamperReason, activeMeta } = useWorkspaceStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const hasTamper = isTampered || Boolean(activeMeta?.is_tampered)
  if (!hasTamper) return null

  const reason = tamperReason || activeMeta?.tamper_reason || 'Kriptografik zincir mührü kırılmış veya log kaydı değiştirilmiş.'

  return (
    <>
      <div className="bg-rose-600 text-white px-5 py-3.5 flex flex-wrap items-center justify-between shadow-md z-40 border-b border-rose-700 animate-in fade-in duration-300">
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-rose-700/80 rounded-xl text-white shadow-inner flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                <span>Adli Bilişim Alarmı: Veri Bütünlüğü Bozulmuş!</span>
              </h3>
              <span className="bg-rose-950/80 text-rose-200 border border-rose-400/40 text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" />
                SALT OKUNUR (TEFTİŞ MODU)
              </span>
            </div>
            <p className="text-xs text-rose-100 mt-0.5 leading-relaxed">
              Bu dosyanın denetim izinde (Audit Logs) yetkisiz dış müdahale veya kırık blok tespit edilmiştir. Sistem otomatik olarak <strong>Kilitli / Teftiş Moduna</strong> alınmıştır.
              {reason ? ` (${reason})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-900 bg-white hover:bg-rose-50 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-rose-700" />
            Teftiş Çizelgesini İncele
          </button>
        </div>
      </div>

      {/* Teftiş Kurulu Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Adli Bilişim & Blokzincir Teftiş Kurulu İncelemesi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Zincir bütünlüğü analizi, tahrif edilen bloklar ve donanım imza dökümü
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <InspectionTimeline
                title="Dosya Denetim İzi & Adli Delil Raporu"
                showHeader={true}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 text-xs text-slate-500">
              <span className="font-mono">WorkDesk 360 Forensics Engine v1.0</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
