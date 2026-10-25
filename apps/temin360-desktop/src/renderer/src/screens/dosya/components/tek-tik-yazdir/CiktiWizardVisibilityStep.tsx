import React from 'react'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'
import { getTemplateSupportedFlags } from './ciktiWizardFieldMapping'
import { Eye, Lock, CheckCircle2, Sliders } from 'lucide-react'

interface CiktiWizardVisibilityStepProps {
  selectedSablons: Sablon[]
  documentDataMap: Record<string, Record<string, unknown>>
  setDocumentDataMap: React.Dispatch<React.SetStateAction<Record<string, Record<string, unknown>>>>
  onProceed: () => void
  onBack: () => void
}

export function CiktiWizardVisibilityStep({
  selectedSablons,
  documentDataMap,
  setDocumentDataMap,
  onProceed,
  onBack
}: CiktiWizardVisibilityStepProps): React.JSX.Element {
  const handleToggleFlag = (templateId: string, flagKey: string, currentValue: boolean): void => {
    setDocumentDataMap((prev) => {
      const existing = prev[templateId] || {}
      return {
        ...prev,
        [templateId]: {
          ...existing,
          [flagKey]: !currentValue
        }
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar bg-slate-900/60 text-slate-100">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* HEADER */}
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
              3
            </span>
            Göster / Gizle Seçenekleri
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yalnızca ilgili şablonun desteklediği bölümler ve imza blokları listelenir. Mevzuat
            gereği zorunlu (statutory) olan bloklar kilitlidir ve gizlenemez.
          </p>
        </div>

        {/* DOCUMENTS LIST */}
        <div className="space-y-4">
          {selectedSablons.map((sablon) => {
            const templateId = (sablon.dosya_adi || '').replace(/\.html$/, '').trim()
            const supportedFlags = getTemplateSupportedFlags(templateId)
            const docData = documentDataMap[templateId] || {}

            return (
              <div
                key={sablon.id}
                className="p-4 bg-slate-800/50 border border-slate-700/70 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-slate-200">{sablon.ad}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{sablon.dosya_adi}</span>
                </div>

                {supportedFlags.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    Bu belge için yapılandırılabilir ek görünürlük bayrağı bulunmamaktadır (tüm
                    standart alanlar etkindir).
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {supportedFlags.map((flag) => {
                      const isStatutory = flag.isStatutory === true
                      const currentValue =
                        docData[flag.key] !== undefined
                          ? Boolean(docData[flag.key])
                          : flag.defaultValue

                      return (
                        <div
                          key={flag.key}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                            isStatutory
                              ? 'bg-slate-900/60 border-slate-800 opacity-90'
                              : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-0.5 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-200">{flag.label}</span>
                              {isStatutory && (
                                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-semibold">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Zorunlu</span>
                                </span>
                              )}
                            </div>
                            {flag.description && (
                              <p className="text-[10px] text-slate-400 leading-tight">
                                {flag.description}
                              </p>
                            )}
                          </div>

                          {isStatutory ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Sabit</span>
                            </div>
                          ) : (
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={currentValue}
                                onChange={() =>
                                  handleToggleFlag(templateId, flag.key, currentValue)
                                }
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* BOTTOM NAV */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            ← 2. Ortak Bilgiler Adımına Dön
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
          >
            4. Kontrol Adımına Geç →
          </button>
        </div>
      </div>
    </div>
  )
}
