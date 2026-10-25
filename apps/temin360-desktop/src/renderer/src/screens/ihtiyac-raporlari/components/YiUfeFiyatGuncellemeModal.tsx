import React, { useEffect, useMemo, useState } from 'react'
import {
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react'
import {
  IhtiyacRaporu,
  IhtiyacRaporuKalem,
  ihtiyacRaporuService
} from '../../../services/ihtiyacRaporuService'
import { yiUfeService, AY_ISIMLERI } from '../../../services/yiUfeService'
import { formatCurrency } from '../../../utils/formatters'
import { calculateTotals } from '../../../utils/ihtiyacRaporuTotals'

interface YiUfeFiyatGuncellemeModalProps {
  isOpen: boolean
  onClose: () => void
  rapor: IhtiyacRaporu
  kalemler: IhtiyacRaporuKalem[]
  onSuccess: () => void
}

export function YiUfeFiyatGuncellemeModal({
  isOpen,
  onClose,
  rapor,
  kalemler,
  onSuccess
}: YiUfeFiyatGuncellemeModalProps): React.JSX.Element | null {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Seçili kalem ID'leri (varsayılan: fiyatı olan veya tüm kalemler)
  const [selectedKalemIds, setSelectedKalemIds] = useState<Set<number>>(new Set())

  // TÜİK Baz ve Hedef Dönem State'leri
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [baseYear, setBaseYear] = useState<number>(currentYear - 1)
  const [baseMonth, setBaseMonth] = useState<number>(1)

  const [targetYear, setTargetYear] = useState<number>(currentYear)
  const [targetMonth, setTargetMonth] = useState<number>(8)

  const [addNoteToRapor, setAddNoteToRapor] = useState(true)

  // Endeks verilerini yükle ve başlangıç değerlerini ayarla
  useEffect(() => {
    if (!isOpen) return

    void (async () => {
      setLoading(true)
      await yiUfeService.loadFromDatabase()
      const latest = yiUfeService.getLatest()
      if (latest) {
        setTargetYear(latest.yil)
        setTargetMonth(latest.ay)
      }

      // Rapor tarihi varsa baz yıl olarak oradan başla, yoksa 1 yıl öncesi
      if (rapor.tarih) {
        const parsed = new Date(rapor.tarih)
        if (!isNaN(parsed.getFullYear())) {
          setBaseYear(parsed.getFullYear() - 1)
          setBaseMonth(parsed.getMonth() + 1 || 1)
        }
      }

      // Tüm kalemleri varsayılan olarak seç
      const initialSet = new Set<number>()
      kalemler.forEach((k, idx) => {
        initialSet.add(k.id || idx + 1)
      })
      setSelectedKalemIds(initialSet)

      setLoading(false)
    })()
  }, [isOpen, rapor, kalemler])

  // Yıl seçenekleri (Mevcut TÜİK verisindeki yıllar)
  const yearOptions = useMemo(() => {
    const list = yiUfeService.getMonthlyList()
    const years = Array.from(new Set(list.map((m) => m.yil))).sort((a, b) => b - a)
    if (years.length === 0) {
      return [2026, 2025, 2024, 2023, 2022, 2021, 2020]
    }
    return years
  }, [loading])

  // Baz ve Hedef Endeks Değerleri
  const baseIndex = useMemo(() => {
    return yiUfeService.getIndex(baseYear, baseMonth) || 1
  }, [baseYear, baseMonth, loading])

  const targetIndex = useMemo(() => {
    return yiUfeService.getIndex(targetYear, targetMonth) || 1
  }, [targetYear, targetMonth, loading])

  // Katsayı: Pn = In / I0
  const factor = useMemo(() => {
    if (baseIndex <= 0) return 1
    return targetIndex / baseIndex
  }, [baseIndex, targetIndex])

  const percentChange = useMemo(() => {
    return (factor - 1) * 100
  }, [factor])

  // Hesaplanan yeni kalemler listesi
  const calculatedKalemler = useMemo(() => {
    return kalemler.map((k, idx) => {
      const id = k.id || idx + 1
      const isSelected = selectedKalemIds.has(id)
      const currentPrice = Number(k.tahmini_birim_fiyat) || 0
      const newPrice = isSelected ? Math.round(currentPrice * factor * 100) / 100 : currentPrice
      const miktar = Number(k.miktar) || 1
      const oldRowTotal = currentPrice * miktar
      const newRowTotal = newPrice * miktar
      const fark = newRowTotal - oldRowTotal

      return {
        ...k,
        id,
        isSelected,
        currentPrice,
        newPrice,
        oldRowTotal,
        newRowTotal,
        fark
      }
    })
  }, [kalemler, selectedKalemIds, factor])

  // Toplam Tutar Karşılaştırması
  const totalOld = useMemo(() => {
    return calculatedKalemler.reduce((acc, k) => acc + k.oldRowTotal, 0)
  }, [calculatedKalemler])

  const totalNew = useMemo(() => {
    return calculatedKalemler.reduce((acc, k) => acc + k.newRowTotal, 0)
  }, [calculatedKalemler])

  const totalDiff = totalNew - totalOld

  // Seçim işlemleri
  const toggleSelectAll = (): void => {
    if (selectedKalemIds.size === kalemler.length) {
      setSelectedKalemIds(new Set())
    } else {
      setSelectedKalemIds(new Set(kalemler.map((k, idx) => k.id || idx + 1)))
    }
  }

  const toggleSelectOne = (id: number): void => {
    const next = new Set(selectedKalemIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedKalemIds(next)
  }

  // Kaydet ve Raporu Güncelle
  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true)

      const updatedKalemlerList: IhtiyacRaporuKalem[] = calculatedKalemler.map((k) => ({
        id: k.id,
        rapor_id: rapor.id,
        sira_no: k.sira_no,
        kalem_adi: k.kalem_adi,
        tipi: k.tipi,
        birim: k.birim,
        miktar: k.miktar,
        kdv_orani: k.kdv_orani,
        tasinir_kodu: k.tasinir_kodu,
        okas_kodu: k.okas_kodu,
        poz_no: k.poz_no,
        aciklama: k.aciklama,
        tahmini_birim_fiyat: k.isSelected ? k.newPrice : k.currentPrice
      }))

      // Yeni toplam tutar hesabı
      const newTotals = calculateTotals(updatedKalemlerList)

      // Not veya gerekçe ekleme
      let updatedNotlar = rapor.notlar || ''
      if (addNoteToRapor) {
        const ufeNote = `[TÜİK Yİ-ÜFE Güncellemesi (${new Date().toLocaleDateString('tr-TR')}): Baz Dönem: ${AY_ISIMLERI[baseMonth - 1]} ${baseYear} (Endeks: ${baseIndex.toFixed(2)}) -> Hedef Dönem: ${AY_ISIMLERI[targetMonth - 1]} ${targetYear} (Endeks: ${targetIndex.toFixed(2)}), Katsayı (Pn): ${factor.toFixed(4)} (%${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)})]`
        updatedNotlar = updatedNotlar ? `${updatedNotlar}\n\n${ufeNote}` : ufeNote
      }

      await ihtiyacRaporuService.updateRapor(
        rapor.id,
        {
          tahmini_butce: newTotals.genelToplam,
          notlar: updatedNotlar
        },
        updatedKalemlerList
      )

      setSuccessMessage('Kalem birim fiyatları TÜİK Yİ-ÜFE katsayısı ile başarıyla güncellendi!')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 900)
    } catch (err: unknown) {
      console.error('TÜİK güncelleme hatası:', err)
      alert('Fiyatlar güncellenirken bir hata oluştu: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Başlığı */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                TÜİK Yİ-ÜFE Esaslarına Göre Fiyat Güncelleme
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800">
                  2003=100
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Geçmiş alım fiyatlarını resmî TÜİK Yİ-ÜFE katsayısı (Pn = In / I0) ile güncel döneme
                taşıyın.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Başarı Mesajı */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <span className="text-xs font-bold">{successMessage}</span>
            </div>
          )}

          {/* Dönem Seçici ve Katsayı Kartı */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Baz Dönem (Eski Alım) */}
            <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                1. Baz Dönem (Eski Alım / Fiyat Tarihi - I0)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Yıl
                  </label>
                  <select
                    value={baseYear}
                    onChange={(e) => setBaseYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Ay
                  </label>
                  <select
                    value={baseMonth}
                    onChange={(e) => setBaseMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    {AY_ISIMLERI.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Baz Endeks (I0):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {baseIndex.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>

            {/* Dönüşüm / Katsayı İkonu */}
            <div className="md:col-span-2 flex flex-col items-center justify-center p-2 text-center bg-cyan-50/60 dark:bg-cyan-950/20 rounded-2xl border border-cyan-100 dark:border-cyan-900/40">
              <span className="text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400">
                Katsayı (Pn)
              </span>
              <span className="text-xl font-mono font-black text-cyan-700 dark:text-cyan-300">
                {factor.toFixed(4)}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                  percentChange >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {percentChange >= 0 ? '+' : ''}%{percentChange.toFixed(2)}
              </span>
            </div>

            {/* Hedef Dönem (Güncel Tarih) */}
            <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                2. Hedef Dönem (Güncel İhale / Fiyat - In)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Yıl
                  </label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Ay
                  </label>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    {AY_ISIMLERI.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Hedef Endeks (In):</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {targetIndex.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Kalemler Tablosu ve Karşılaştırma */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedKalemIds.size === kalemler.length && kalemler.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="select-all"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Tümünü Seç ({selectedKalemIds.size} / {kalemler.length} Kalem Seçili)
                </label>
              </div>

              <span className="text-[11px] text-slate-400">
                Seçilen kalemlerin birim fiyatları TÜİK katsayısı ile çarpılacaktır.
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 dark:bg-slate-950/30 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Kalem Adı</th>
                    <th className="py-2.5 px-3 text-right w-24">Miktar</th>
                    <th className="py-2.5 px-3 text-right w-32">Mevcut Fiyat</th>
                    <th className="py-2.5 px-3 text-center w-8">
                      <ChevronRight size={14} className="mx-auto text-slate-400" />
                    </th>
                    <th className="py-2.5 px-3 text-right w-36 text-cyan-600 dark:text-cyan-400">
                      TÜİK Güncel Fiyat
                    </th>
                    <th className="py-2.5 px-3 text-right w-32">Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {calculatedKalemler.map((k) => (
                    <tr
                      key={k.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                        k.isSelected ? 'bg-cyan-50/20 dark:bg-cyan-950/10' : 'opacity-60'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={k.isSelected}
                          onChange={() => toggleSelectOne(k.id)}
                          className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-850 dark:text-slate-100 block">
                          {k.kalem_adi}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {k.birim} • %{k.kdv_orani} KDV
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {k.miktar} {k.birim}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {formatCurrency(k.currentPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">→</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-700 dark:text-cyan-300">
                        {formatCurrency(k.newPrice)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono text-xs font-bold ${
                          k.fark > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : k.fark < 0
                              ? 'text-rose-600'
                              : 'text-slate-400'
                        }`}
                      >
                        {k.fark > 0 ? '+' : ''}
                        {formatCurrency(k.fark)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rapor Notuna Ekleme Tercihi */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <input
              type="checkbox"
              id="add-note"
              checked={addNoteToRapor}
              onChange={(e) => setAddNoteToRapor(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <label
              htmlFor="add-note"
              className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Rapor açıklamalarına / notlarına resmî TÜİK Yİ-ÜFE güncelleme gerekçesini ve
              katsayısını otomatik ekle
            </label>
          </div>
        </div>

        {/* Modal Alt Barı & Özet */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Eski Ara Toplam:
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-bold">
                {formatCurrency(totalOld)}
              </span>
            </div>
            <div className="text-slate-300">→</div>
            <div>
              <span className="text-cyan-600 dark:text-cyan-400 block text-[10px] uppercase font-bold">
                Yeni Ara Toplam:
              </span>
              <span className="text-cyan-700 dark:text-cyan-300 font-black text-sm">
                {formatCurrency(totalNew)}
              </span>
            </div>
            <div className="hidden sm:block pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] uppercase font-bold">
                Toplam Fark:
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                +{formatCurrency(totalDiff)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              onClick={handleSave}
              disabled={saving || selectedKalemIds.size === 0}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={14} />
                  <span>Fiyatları Güncelle ve Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
