import React, { useState, useMemo } from 'react'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'
import { applyCommonDataToTemplate } from './ciktiWizardFieldMapping'
import { Calendar, User, ShieldAlert, Check, RefreshCw, AlertTriangle, Layers } from 'lucide-react'

export interface CommonWizardData {
  tarih: string
  muhatap: string
  hazirlayanAdi: string
  hazirlayanUnvan: string
  onaylayanAdi: string
  onaylayanUnvan: string
  talepEdenAdi: string
  talepEdenUnvan: string
}

interface CiktiWizardCommonDataStepProps {
  selectedSablons: Sablon[]
  activeDosya?: Record<string, unknown> | null
  commonData: CommonWizardData
  setCommonData: React.Dispatch<React.SetStateAction<CommonWizardData>>
  documentDataMap: Record<string, Record<string, unknown>>
  setDocumentDataMap: React.Dispatch<React.SetStateAction<Record<string, Record<string, unknown>>>>
  onProceed: () => void
  onBack: () => void
}

export function CiktiWizardCommonDataStep({
  selectedSablons,
  activeDosya,
  commonData,
  setCommonData,
  documentDataMap,
  setDocumentDataMap,
  onProceed,
  onBack
}: CiktiWizardCommonDataStepProps): React.JSX.Element {
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false)
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null)

  // Etki analizi: Seçili belgelerde hangi alanlar güncellenecek, hangileri ezilecek?
  const impactAnalysis = useMemo(() => {
    let affectedCount = 0
    const overwrittenMap: Record<string, string[]> = {}
    const appliedMap: Record<string, string[]> = {}

    for (const sablon of selectedSablons) {
      const templateId = (sablon.dosya_adi || '').replace(/\.html$/, '').trim()
      const existing = documentDataMap[templateId] || {}
      const res = applyCommonDataToTemplate(existing, templateId, commonData, overwriteExisting)

      if (res.appliedFields.length > 0) {
        affectedCount++
        appliedMap[sablon.ad] = res.appliedFields
      }
      if (res.overwrittenFields.length > 0) {
        overwrittenMap[sablon.ad] = res.overwrittenFields
      }
    }

    return { affectedCount, overwrittenMap, appliedMap }
  }, [selectedSablons, documentDataMap, commonData, overwriteExisting])

  const handleApplyToAll = (): void => {
    const nextMap = { ...documentDataMap }
    let count = 0

    for (const sablon of selectedSablons) {
      const templateId = (sablon.dosya_adi || '').replace(/\.html$/, '').trim()
      const existing = nextMap[templateId] || {}
      const res = applyCommonDataToTemplate(existing, templateId, commonData, overwriteExisting)
      nextMap[templateId] = res.updatedData
      if (res.appliedFields.length > 0) count++
    }

    setDocumentDataMap(nextMap)
    setAppliedNotification(`${count} seçili belgeye ortak bilgiler başarıyla aktarıldı.`)
    setTimeout(() => setAppliedNotification(null), 4000)
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar bg-slate-900/60 text-slate-100">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* HEADER EXPLANATION */}
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold">
              2
            </span>
            Ortak Bilgiler (Toplu Aktarım)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Seçili {selectedSablons.length} belgeye tek seferde tarih, muhatap ve imza yetkilisi
            bilgilerini uygulayın. Dolu alanlar ezme koruması ile güvence altındadır.
          </p>
        </div>

        {appliedNotification && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-600/60 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
        )}

        {/* INPUT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarih */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              Belge / Evrak Tarihi
            </label>
            <input
              type="date"
              value={commonData.tarih}
              onChange={(e) => setCommonData((prev) => ({ ...prev, tarih: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-400 block">
              Seçili belgelerin tarih alanlarına aktarılır.
            </span>
          </div>

          {/* Muhatap / Hitap Makamı */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              Muhatap / Sunulacak Makam
            </label>
            <input
              type="text"
              placeholder="Örn: Destek Hizmetleri Müdürlüğüne / Makamına"
              value={commonData.muhatap}
              onChange={(e) => setCommonData((prev) => ({ ...prev, muhatap: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-purple-500"
            />
            <span className="text-[10px] text-slate-400 block">
              Destekleyen belgelerin sunulacak makam veya muhatap alanına eşlenir.
            </span>
          </div>

          {/* Hazırlayan Personel */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              Hazırlayan Personel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Ad Soyad"
                value={commonData.hazirlayanAdi}
                onChange={(e) =>
                  setCommonData((prev) => ({ ...prev, hazirlayanAdi: e.target.value }))
                }
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Unvan (Örn: V.H.K.İ.)"
                value={commonData.hazirlayanUnvan}
                onChange={(e) =>
                  setCommonData((prev) => ({ ...prev, hazirlayanUnvan: e.target.value }))
                }
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Dosyadaki `hazirlayan_personel_id` kaynağından varsayılan alınabilir.
            </span>
          </div>

          {/* Harcama Yetkilisi / Onaylayan */}
          <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-400" />
              Harcama Yetkilisi / Onaylayan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Ad Soyad"
                value={commonData.onaylayanAdi}
                onChange={(e) =>
                  setCommonData((prev) => ({ ...prev, onaylayanAdi: e.target.value }))
                }
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Unvan (Örn: Harcama Yetkilisi)"
                value={commonData.onaylayanUnvan}
                onChange={(e) =>
                  setCommonData((prev) => ({ ...prev, onaylayanUnvan: e.target.value }))
                }
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Dosyadaki `onay_personel_id` kaynağından beslenir.
            </span>
          </div>
        </div>

        {/* OVERWRITE PROTECTION TOGGLE & IMPACT ANALYSIS */}
        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-2xl space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2.5">
              <ShieldAlert
                className={`w-4 h-4 ${overwriteExisting ? 'text-amber-400' : 'text-blue-400'}`}
              />
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Dolu Alanların Üzerine Yaz (Ezme Koruması)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {overwriteExisting
                    ? 'DİKKAT: Belgelerdeki mevcut dolu alanların üzerine ortak bilgiler yazılacaktır.'
                    : 'Korumalı: Sadece boş olan alanlar doldurulur, önceden kaydedilmiş bilgiler korunur.'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          {/* IMPACT CARD */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span>Etkilenecek Belge Sayısı:</span>
              <span className="text-blue-400 font-bold">
                {impactAnalysis.affectedCount} / {selectedSablons.length} Belge
              </span>
            </div>

            {Object.keys(impactAnalysis.overwrittenMap).length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Üzerine Yazılacak Alanlar:</span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar text-[10px] text-slate-400">
                  {Object.entries(impactAnalysis.overwrittenMap).map(([name, fields]) => (
                    <div key={name} className="flex justify-between">
                      <span className="text-slate-300">• {name}</span>
                      <span className="text-amber-300/90 font-mono">{fields.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* APPLY BUTTON */}
          <button
            type="button"
            onClick={handleApplyToAll}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-99 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ortak Bilgileri Seçili Belgelere Şimdi Uygula</span>
          </button>
        </div>

        {/* BOTTOM NAV */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            ← 1. Belgeler Adımına Dön
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
          >
            3. Göster / Gizle Adımına Geç →
          </button>
        </div>
      </div>
    </div>
  )
}
