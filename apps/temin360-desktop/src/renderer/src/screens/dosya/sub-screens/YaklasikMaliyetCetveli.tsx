import React, { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  Compass,
  Copy,
  CreditCard,
  Edit2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
  X
} from 'lucide-react'
import { cn } from '../../../utils/cn'
import { Modal } from '../../../components/ui/Modal'

import { SubScreen } from '../SubScreens.screen'

export function YaklasikMaliyetCetveli(): React.JSX.Element {
  const { activeDosyaId } = useWorkspaceStore()
  const [items, setItems] = useState<any[]>([])
  const [firms, setFirms] = useState<any[]>([])
  const [bids, setBids] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const loadMatrix = async (): Promise<void> => {
    if (!activeDosyaId) return
    setLoading(true)
    try {
      const resItems = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC',
        [activeDosyaId]
      )
      const resFirms = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT df.id as temin_firma_id, f.unvan, f.id as firma_id 
         FROM DATA_TeminFirma df 
         JOIN TANIM_Firma f ON df.firma_id = f.id 
         WHERE df.temin_dosya_id = ?`,
        [activeDosyaId]
      )
      const resBids = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?',
        [activeDosyaId]
      )

      if (resItems.success) setItems(resItems.data)
      if (resFirms.success) setFirms(resFirms.data)

      if (resBids.success) {
        const bidsMap: Record<string, number> = {}
        resBids.data.forEach((b: any) => {
          bidsMap[`${b.temin_kalem_id}_${b.temin_firma_id}`] = b.birim_fiyat
        })
        setBids(bidsMap)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatrix()
  }, [activeDosyaId])

  const handlePriceChange = (itemId: number, teminFirmaId: number, val: string): void => {
    const numVal = parseFloat(val) || 0
    setBids((prev) => ({
      ...prev,
      [`${itemId}_${teminFirmaId}`]: numVal
    }))
  }

  const handleSavePrice = async (itemId: number, teminFirmaId: number): Promise<void> => {
    const price = bids[`${itemId}_${teminFirmaId}`] || 0
    try {
      // Atomic DELETE and INSERT
      await window.electron.ipcRenderer.invoke(
        'db:run',
        'DELETE FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ? AND temin_kalem_id = ? AND temin_firma_id = ?',
        [activeDosyaId, itemId, teminFirmaId]
      )
      if (price > 0) {
        await window.electron.ipcRenderer.invoke(
          'db:run',
          'INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat) VALUES (?, ?, ?, ?)',
          [activeDosyaId, itemId, teminFirmaId, price]
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Calculation helpers
  const getItemPrices = (itemId: number): number[] => {
    return firms.map((f) => bids[`${itemId}_${f.temin_firma_id}`] || 0).filter((p) => p > 0)
  }

  const getItemMinPrice = (itemId: number): number => {
    const prices = getItemPrices(itemId)
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const getItemAvgPrice = (itemId: number): number => {
    const prices = getItemPrices(itemId)
    if (prices.length === 0) return 0
    const sum = prices.reduce((a, b) => a + b, 0)
    return sum / prices.length
  }

  const getFirmTotal = (teminFirmaId: number): number => {
    return items.reduce((sum, item) => {
      const price = bids[`${item.id}_${teminFirmaId}`] || 0
      return sum + item.miktar * price
    }, 0)
  }

  const getEstimatedCostTotal = (): number => {
    return items.reduce((sum, item) => {
      const avg = getItemAvgPrice(item.id)
      return sum + item.miktar * avg
    }, 0)
  }

  const handleSaveToDosya = async (): Promise<void> => {
    const total = getEstimatedCostTotal()
    if (total === 0) {
      alert('Yaklaşık maliyet ₺0.00 olamaz. Lütfen önce teklif fiyatları girin.')
      return
    }

    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET yaklasik_maliyet = ? WHERE id = ?',
        [total, activeDosyaId]
      )
      if (res.success) {
        alert(
          `Yaklaşık maliyet başarıyla güncellendi: ₺ ${total.toLocaleString('tr-TR', {
            minimumFractionDigits: 2
          })}`
        )
      } else {
        alert(res.error)
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <SubScreen
      title="Yaklaşık Maliyet Hesap Cetveli"
      icon={FileSpreadsheet}
      description="İstekli tedarikçilerin fiyat tekliflerini girin ve piyasa ortalama yaklaşık maliyetini hesaplayın."
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-855 dark:text-slate-150">
              Teklif Girişleri & Maliyet Tablosu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fiyat girdikten sonra kaydetmek için alandan çıkın (onBlur).
            </p>
          </div>

          {items.length > 0 && firms.length > 0 && (
            <button
              onClick={handleSaveToDosya}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Maliyeti Dosyaya Kaydet
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">Yükleniyor...</div>
        ) : items.length === 0 || firms.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-slate-350" />
            <p className="text-xs">
              Bu ekranda işlem yapabilmek için dosyada en az **1 adet malzeme kalemi** ve **1 adet
              istekli firma** bulunmalıdır.
            </p>
            <div className="flex gap-3 mt-3">
              <Link
                to="/dosya/hazirlik-ve-ihtiyac"
                className="text-blue-600 underline font-bold text-xs"
              >
                Kalem Ekle
              </Link>
              <Link
                to="/dosya/piyasa-fiyat-arastirmasi"
                className="text-blue-600 underline font-bold text-xs"
              >
                Firma Ekle
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse border border-slate-200 dark:border-slate-800 text-[11px]">
              <thead>
                <tr className="bg-slate-55 dark:bg-slate-950 font-bold">
                  <th className="border border-slate-200 dark:border-slate-800 p-2.5 min-w-[150px]">
                    Malzeme Adı (Miktar)
                  </th>
                  {firms.map((f) => (
                    <th
                      key={f.temin_firma_id}
                      className="border border-slate-200 dark:border-slate-800 p-2.5 text-center min-w-[120px]"
                    >
                      <span className="block truncate max-w-[110px]" title={f.unvan}>
                        {f.unvan}
                      </span>
                      <span className="text-[9px] text-slate-400 font-normal">
                        Birim Teklifi (₺)
                      </span>
                    </th>
                  ))}
                  <th className="border border-slate-200 dark:border-slate-800 p-2.5 text-center min-w-[90px] bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400">
                    En Düşük (₺)
                  </th>
                  <th className="border border-slate-200 dark:border-slate-800 p-2.5 text-center min-w-[90px] bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-450">
                    Ortalama (₺)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-250 dark:divide-slate-800">
                {items.map((item) => {
                  const minPrice = getItemMinPrice(item.id)
                  const avgPrice = getItemAvgPrice(item.id)

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10">
                      <td className="border border-slate-200 dark:border-slate-800 p-2.5 font-bold text-slate-800 dark:text-slate-200">
                        <div>{item.kalem_adi}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {item.miktar} {item.birim}
                        </div>
                      </td>

                      {firms.map((f) => {
                        const price = bids[`${item.id}_${f.temin_firma_id}`] || 0
                        const isMin = price > 0 && price === minPrice

                        return (
                          <td
                            key={f.temin_firma_id}
                            className={cn(
                              'border border-slate-200 dark:border-slate-800 p-2 text-center transition-colors',
                              isMin && 'bg-green-50/40 dark:bg-green-950/15'
                            )}
                          >
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={bids[`${item.id}_${f.temin_firma_id}`] || ''}
                              onChange={(e) =>
                                handlePriceChange(item.id, f.temin_firma_id, e.target.value)
                              }
                              onBlur={() => handleSavePrice(item.id, f.temin_firma_id)}
                              className="w-full p-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded text-center text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            {price > 0 && (
                              <span className="text-[9px] text-slate-400 block mt-1">
                                Toplam: ₺
                                {(price * item.miktar).toLocaleString('tr-TR', {
                                  minimumFractionDigits: 2
                                })}
                              </span>
                            )}
                          </td>
                        )
                      })}

                      {/* En Düşük Fiyat */}
                      <td className="border border-slate-200 dark:border-slate-800 p-2 text-center font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-900/5">
                        {minPrice > 0
                          ? `₺ ${minPrice.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2
                            })}`
                          : '-'}
                      </td>

                      {/* Ortalama Fiyat */}
                      <td className="border border-slate-200 dark:border-slate-800 p-2 text-center font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/5">
                        {avgPrice > 0
                          ? `₺ ${avgPrice.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2
                            })}`
                          : '-'}
                      </td>
                    </tr>
                  )
                })}

                {/* Toplam Satırı */}
                <tr className="bg-slate-50 dark:bg-slate-950 font-black">
                  <td className="border border-slate-200 dark:border-slate-800 p-3 text-right">
                    TOPLAM TEKLİFLER:
                  </td>
                  {firms.map((f) => {
                    const total = getFirmTotal(f.temin_firma_id)
                    return (
                      <td
                        key={f.temin_firma_id}
                        className="border border-slate-200 dark:border-slate-800 p-3 text-center font-mono text-slate-800 dark:text-slate-100"
                      >
                        ₺{' '}
                        {total.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2
                        })}
                      </td>
                    )
                  })}
                  <td className="border border-slate-200 dark:border-slate-800 p-3 bg-blue-50/30 dark:bg-blue-900/10"></td>
                  <td className="border border-slate-200 dark:border-slate-800 p-3 text-center font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/15">
                    ₺{' '}
                    {getEstimatedCostTotal().toLocaleString('tr-TR', {
                      minimumFractionDigits: 2
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SubScreen>
  )
}
