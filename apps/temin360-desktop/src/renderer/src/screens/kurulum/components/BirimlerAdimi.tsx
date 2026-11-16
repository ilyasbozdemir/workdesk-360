import React, { useState } from 'react'
import { FolderTree, Plus, Trash2, Sparkles, Building } from 'lucide-react'
import { KurulumBirimItem } from '../types'

interface BirimlerAdimiProps {
  birimler: KurulumBirimItem[]
  onChange: (birimler: KurulumBirimItem[]) => void
}

const PRESET_BIRIMLER: KurulumBirimItem[] = [
  { birimAdi: 'Destek Hizmetleri Müdürlüğü', antetEkSatir: 'Destek Hizmetleri Müdürlüğü', sunumMakami: 'BAŞKANLIK MAKAMINA' },
  { birimAdi: 'Fen İşleri Müdürlüğü', antetEkSatir: 'Fen İşleri Müdürlüğü', sunumMakami: 'BAŞKANLIK MAKAMINA' },
  { birimAdi: 'Park ve Bahçeler Müdürlüğü', antetEkSatir: 'Park ve Bahçeler Müdürlüğü', sunumMakami: 'BAŞKANLIK MAKAMINA' },
  { birimAdi: 'Mali Hizmetler Müdürlüğü', antetEkSatir: 'Mali Hizmetler Müdürlüğü', sunumMakami: 'BAŞKANLIK MAKAMINA' },
  { birimAdi: 'Bilgi İşlem Müdürlüğü', antetEkSatir: 'Bilgi İşlem Müdürlüğü', sunumMakami: 'BAŞKANLIK MAKAMINA' }
]

export const BirimlerAdimi: React.FC<BirimlerAdimiProps> = ({ birimler, onChange }) => {
  const [newBirimAdi, setNewBirimAdi] = useState('')
  const [newAntetEkSatir, setNewAntetEkSatir] = useState('')
  const [newSunumMakami, setNewSunumMakami] = useState('BAŞKANLIK MAKAMINA')

  const handleAddBirim = () => {
    if (!newBirimAdi.trim()) return
    const newItem: KurulumBirimItem = {
      id: Date.now(),
      birimAdi: newBirimAdi.trim(),
      antetEkSatir: newAntetEkSatir.trim() || newBirimAdi.trim(),
      sunumMakami: newSunumMakami.trim() || 'BAŞKANLIK MAKAMINA'
    }
    onChange([...birimler, newItem])
    setNewBirimAdi('')
    setNewAntetEkSatir('')
  }

  const handleRemoveBirim = (index: number) => {
    const next = [...birimler]
    next.splice(index, 1)
    onChange(next)
  }

  const handleLoadPresets = () => {
    const existingNames = new Set(birimler.map((b) => b.birimAdi.toLowerCase()))
    const toAdd = PRESET_BIRIMLER.filter((p) => !existingNames.has(p.birimAdi.toLowerCase()))
    onChange([...birimler, ...toAdd])
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            2. Adım: Harcama Birimleri ve Müdürlükler
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Doğrudan temin ve ihale süreçlerini yürüten müdürlüklerinizi / harcama birimlerinizi ekleyin.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadPresets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Standart Birimleri Yükle
        </button>
      </div>

      {/* Birim Ekleme Satırı */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-blue-600" /> Yeni Birim / Müdürlük Ekle
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <input
              type="text"
              value={newBirimAdi}
              onChange={(e) => {
                setNewBirimAdi(e.target.value)
                if (!newAntetEkSatir) setNewAntetEkSatir(e.target.value)
              }}
              placeholder="Birim Adı (Örn: Destek Hizmetleri Md.)"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddBirim()
              }}
            />
          </div>
          <div>
            <input
              type="text"
              value={newAntetEkSatir}
              onChange={(e) => setNewAntetEkSatir(e.target.value)}
              placeholder="Antet Ek Satırı (İsteğe bağlı)"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddBirim()
              }}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSunumMakami}
              onChange={(e) => setNewSunumMakami(e.target.value)}
              placeholder="Sunum Makamı"
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddBirim()
              }}
            />
            <button
              type="button"
              onClick={handleAddBirim}
              disabled={!newBirimAdi.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Eklenen Birimler Tablosu */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Birim / Müdürlük Adı</th>
              <th className="py-2.5 px-4">Antet Ek Satırı</th>
              <th className="py-2.5 px-4">Sunum Makamı</th>
              <th className="py-2.5 px-4 w-16 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {birimler.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                  Henüz birim eklenmedi. &quot;Standart Birimleri Yükle&quot; butonuna basabilir veya yukarıdan ekleyebilirsiniz.
                </td>
              </tr>
            ) : (
              birimler.map((b, idx) => (
                <tr key={`birim_row_${b.id ?? idx}_${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-4 text-center text-xs text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    {b.birimAdi}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600 dark:text-slate-400">{b.antetEkSatir || b.birimAdi}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">{b.sunumMakami || 'BAŞKANLIK MAKAMINA'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveBirim(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                      title="Birimi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
