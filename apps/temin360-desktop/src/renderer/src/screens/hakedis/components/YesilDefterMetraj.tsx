import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  Sparkles,
  Calculator,
  RefreshCw
} from 'lucide-react'
import { HakedisKalem } from '../types'

interface YesilDefterMetrajProps {
  kalemler: HakedisKalem[]
  onUpdateKalem: (id: string, patch: Partial<HakedisKalem>) => void
  onAddKalem: (kalem: HakedisKalem) => void
  onRemoveKalem: (id: string) => void
  onLoadFromActiveDosya?: () => void
  formatCurrency: (val: number) => string
}

export const YesilDefterMetraj: React.FC<YesilDefterMetrajProps> = ({
  kalemler,
  onUpdateKalem,
  onAddKalem,
  onRemoveKalem,
  onLoadFromActiveDosya,
  formatCurrency
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newPozNo, setNewPozNo] = useState('')
  const [newAciklama, setNewAciklama] = useState('')
  const [newBirim, setNewBirim] = useState('Adet')
  const [newSozlesmeMiktar, setNewSozlesmeMiktar] = useState<number>(1)
  const [newBirimFiyat, setNewBirimFiyat] = useState<number>(1000)

  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAciklama.trim()) return

    const newKalem: HakedisKalem = {
      id: 'kalem-' + Date.now(),
      pozNo: newPozNo || 'POZ-' + (kalemler.length + 1),
      aciklama: newAciklama,
      birim: newBirim,
      sozlesmeMiktar: Number(newSozlesmeMiktar) || 1,
      birimFiyat: Number(newBirimFiyat) || 0,
      oncekiMetraj: 0,
      buHakedisMetraj: Number(newSozlesmeMiktar) || 1
    }

    onAddKalem(newKalem)
    setIsAddingNew(false)
    setNewPozNo('')
    setNewAciklama('')
    setNewSozlesmeMiktar(1)
    setNewBirimFiyat(1000)
  }

  // Toplamlar
  const toplamSozlesmeTutari = kalemler.reduce(
    (acc, k) => acc + k.sozlesmeMiktar * k.birimFiyat,
    0
  )
  const toplamOncekiTutar = kalemler.reduce((acc, k) => acc + k.oncekiMetraj * k.birimFiyat, 0)
  const toplamBuHakedisTutar = kalemler.reduce(
    (acc, k) => acc + k.buHakedisMetraj * k.birimFiyat,
    0
  )
  const toplamKumulatifTutar = kalemler.reduce(
    (acc, k) => acc + (k.oncekiMetraj + k.buHakedisMetraj) * k.birimFiyat,
    0
  )

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Üst İşlem Butonları */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Layers size={16} className="text-emerald-500" />
            Yeşil Defter &amp; İmalat Metraj Cetveli
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kamu İhale ve Hakediş.org standardında kalem bazlı metraj, birim fiyat ve gerçekleşme
            kayıtları.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onLoadFromActiveDosya && (
            <button
              onClick={onLoadFromActiveDosya}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
              title="Aktif Doğrudan Temin Dosyasının Kalemlerini Getir"
            >
              <RefreshCw size={13} />
              Aktif Dosya Kalemlerini Yükle
            </button>
          )}

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            Yeni Poz / İş Kalemi Ekle
          </button>
        </div>
      </div>

      {/* Yeni Poz Ekleme Formu */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNewSubmit}
          className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 space-y-3"
        >
          <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            Hakediş Cetveline Yeni Kalem / Poz Ekle
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Poz / Kod</label>
              <input
                type="text"
                value={newPozNo}
                onChange={(e) => setNewPozNo(e.target.value)}
                placeholder="Örn: 15.120.1001"
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-600 dark:text-slate-400 mb-1">
                İş Kalemi Açıklaması
              </label>
              <input
                type="text"
                value={newAciklama}
                onChange={(e) => setNewAciklama(e.target.value)}
                placeholder="Örn: Betonarme Betonu Dökülmesi"
                required
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Birimi</label>
              <select
                value={newBirim}
                onChange={(e) => setNewBirim(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="Adet">Adet</option>
                <option value="m">Metre (m)</option>
                <option value="m²">Metrekare (m²)</option>
                <option value="m³">Metreküp (m³)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="Ton">Ton</option>
                <option value="Saat">Saat</option>
                <option value="Ay">Ay</option>
                <option value="Paket">Paket</option>
                <option value="Takım">Takım</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Sözleşme Mik.</label>
              <input
                type="number"
                step="any"
                value={newSozlesmeMiktar}
                onChange={(e) => setNewSozlesmeMiktar(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Birim Fiyat (₺)</label>
              <input
                type="number"
                step="any"
                value={newBirimFiyat}
                onChange={(e) => setNewBirimFiyat(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1 text-xs rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Kalemi Kaydet
            </button>
          </div>
        </form>
      )}

      {/* Yeşil Defter Tablosu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-200 select-none">
              <th className="py-2.5 px-3 w-12 text-center">Sıra</th>
              <th className="py-2.5 px-3 w-28">Poz / Kod</th>
              <th className="py-2.5 px-3">İş Kalemi &amp; İmalat Açıklaması</th>
              <th className="py-2.5 px-2 w-16 text-center">Birim</th>
              <th className="py-2.5 px-2 w-24 text-right">Sözl. Miktar</th>
              <th className="py-2.5 px-2 w-24 text-right">Birim Fiyat</th>
              <th className="py-2.5 px-2 w-24 text-right bg-slate-200/50 dark:bg-slate-800/40">
                Önceki Metraj
              </th>
              <th className="py-2.5 px-2 w-28 text-right bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                Bu Hakediş (Metraj)
              </th>
              <th className="py-2.5 px-2 w-24 text-right font-bold">Toplam Metraj</th>
              <th className="py-2.5 px-3 w-28 text-right bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold">
                Bu Hak. Tutar
              </th>
              <th className="py-2.5 px-2 w-16 text-center">Oran</th>
              <th className="py-2.5 px-2 w-10 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {kalemler.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400">
                  Henüz hakediş kalemi eklenmedi. "Yeni Poz / İş Kalemi Ekle" veya "Aktif Dosya
                  Kalemlerini Yükle" butonuna tıklayın.
                </td>
              </tr>
            ) : (
              kalemler.map((kalem, index) => {
                const toplamMetraj = kalem.oncekiMetraj + kalem.buHakedisMetraj
                const buHakedisTutar = kalem.buHakedisMetraj * kalem.birimFiyat
                const yuzde =
                  kalem.sozlesmeMiktar > 0
                    ? Math.round((toplamMetraj / kalem.sozlesmeMiktar) * 100)
                    : 0

                return (
                  <tr
                    key={kalem.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-center font-mono text-slate-400">{index + 1}</td>
                    <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                      <input
                        type="text"
                        value={kalem.pozNo}
                        onChange={(e) => onUpdateKalem(kalem.id, { pozNo: e.target.value })}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-slate-100">
                      <input
                        type="text"
                        value={kalem.aciklama}
                        onChange={(e) => onUpdateKalem(kalem.id, { aciklama: e.target.value })}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 text-xs font-semibold"
                      />
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500 font-medium">
                      {kalem.birim}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600 dark:text-slate-400">
                      {kalem.sozlesmeMiktar}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(kalem.birimFiyat)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono bg-slate-50 dark:bg-slate-800/20 text-slate-500">
                      <input
                        type="number"
                        step="any"
                        value={kalem.oncekiMetraj}
                        onChange={(e) =>
                          onUpdateKalem(kalem.id, {
                            oncekiMetraj: parseFloat(e.target.value) || 0
                          })
                        }
                        className="w-20 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono bg-emerald-50/70 dark:bg-emerald-950/30">
                      <input
                        type="number"
                        step="any"
                        value={kalem.buHakedisMetraj}
                        onChange={(e) =>
                          onUpdateKalem(kalem.id, {
                            buHakedisMetraj: parseFloat(e.target.value) || 0
                          })
                        }
                        className="w-24 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {toplamMetraj}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                      {formatCurrency(buHakedisTutar)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          yuzde > 100
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        %{yuzde}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => onRemoveKalem(kalem.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                        title="Kalemi Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {kalemler.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <td colSpan={4} className="py-3 px-3 text-right uppercase tracking-wider">
                  Genel Toplamlar:
                </td>
                <td className="py-3 px-2 text-right font-mono text-slate-500">-</td>
                <td className="py-3 px-2 text-right font-mono text-slate-500">-</td>
                <td className="py-3 px-2 text-right font-mono text-slate-700 dark:text-slate-300">
                  {formatCurrency(toplamOncekiTutar)}
                </td>
                <td className="py-3 px-2 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  İmalat Toplamı
                </td>
                <td className="py-3 px-2 text-right font-mono font-bold">
                  {formatCurrency(toplamKumulatifTutar)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(toplamBuHakedisTutar)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

