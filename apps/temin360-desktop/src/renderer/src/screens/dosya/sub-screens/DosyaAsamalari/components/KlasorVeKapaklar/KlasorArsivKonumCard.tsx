import React, { useState } from 'react'
import { MapPin, Save, Plus, Check, Loader2 } from 'lucide-react'

interface KlasorArsivKonumCardProps {
  isDosyaClosed: boolean
  arsivLokasyon: string
  klasorNo: string
  rafNo: string
  globalArsivLokasyonlari: string[]
  onArsivLokasyonChange: (val: string) => void
  onKlasorNoChange: (val: string) => void
  onRafNoChange: (val: string) => void
  onSaveKonum?: () => Promise<void> | void
  onAddLocation?: (loc: string) => Promise<void> | void
  isSaving?: boolean
  saveSuccess?: boolean
}

export function KlasorArsivKonumCard({
  isDosyaClosed,
  arsivLokasyon,
  klasorNo,
  rafNo,
  globalArsivLokasyonlari,
  onArsivLokasyonChange,
  onKlasorNoChange,
  onRafNoChange,
  onSaveKonum,
  onAddLocation,
  isSaving = false,
  saveSuccess = false
}: KlasorArsivKonumCardProps): React.JSX.Element {
  const [isAddingLoc, setIsAddingLoc] = useState(false)
  const [newLocName, setNewLocName] = useState('')

  const handleAddNewLocation = async (): Promise<void> => {
    if (!newLocName.trim() || !onAddLocation) return
    await onAddLocation(newLocName.trim())
    onArsivLokasyonChange(newLocName.trim())
    setNewLocName('')
    setIsAddingLoc(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-500" />
          Fiziksel Arşiv Konumu
        </h4>
        {saveSuccess && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <Check className="w-3.5 h-3.5" /> Konum Kaydedildi
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Arşiv Lokasyonu / Dolap
              <span className="ml-2 font-normal text-slate-400">(Kurum Ayarlarından)</span>
            </label>
            {!isDosyaClosed && onAddLocation && !isAddingLoc && (
              <button
                type="button"
                onClick={() => setIsAddingLoc(true)}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Yeni Lokasyon
              </button>
            )}
          </div>

          {isAddingLoc ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                autoFocus
                placeholder="Örn: 3. Kat Arşiv Odası B-2..."
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewLocation()}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddNewLocation}
                disabled={!newLocName.trim()}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => setIsAddingLoc(false)}
                className="px-2.5 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                İptal
              </button>
            </div>
          ) : (
            <select
              disabled={isDosyaClosed}
              value={arsivLokasyon}
              onChange={(e) => onArsivLokasyonChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all disabled:opacity-60 cursor-pointer"
            >
              <option value="">-- Lokasyon Seçiniz --</option>
              {globalArsivLokasyonlari.map((lokasyon) => (
                <option key={lokasyon} value={lokasyon}>
                  {lokasyon}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Klasör / Sıra No
          </label>
          <input
            type="text"
            disabled={isDosyaClosed}
            placeholder="Örn: 2026-05"
            value={klasorNo}
            onChange={(e) => onKlasorNoChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Raf No</label>
          <input
            type="text"
            disabled={isDosyaClosed}
            placeholder="Örn: 3. Raf / B Bölümü"
            value={rafNo}
            onChange={(e) => onRafNoChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={isDosyaClosed || isSaving}
          onClick={onSaveKonum}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> Konumu Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  )
}
