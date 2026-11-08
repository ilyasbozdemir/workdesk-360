import React, { useState, useEffect } from 'react'
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Building2,
  TrendingUp,
  ShieldAlert,
  Info,
  Calendar,
  Layers
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { INITIAL_KIK_KOTA } from '@renderer/screens/bkmybs-mali-yonetim/bkmybsMockData'
import { KikKotaModel } from '@renderer/screens/bkmybs-mali-yonetim/types'
import { loadRealBkmybsData } from '@renderer/services/finance/bkmybsDataService'

export const FinancialCompliancePage: React.FC = () => {
  const [idareTipi, setIdareTipi] = useState<'buyuksehir' | 'diger'>('buyuksehir')
  const [kotaData, setKotaData] = useState<KikKotaModel>(INITIAL_KIK_KOTA)

  // Gerçek dosyalardan 22/d harcama ve kota verilerini re'sen çek
  useEffect(() => {
    let isMounted = true
    const fetchRealKota = async () => {
      try {
        const realData = await loadRealBkmybsData()
        if (isMounted && realData && realData.hasRealData) {
          setKotaData(realData.kikKota)
        }
      } catch (err) {
        console.error('KİK kota verileri yüklenirken hata oluştu:', err)
      }
    }
    void fetchRealKota()
    return () => {
      isMounted = false
    }
  }, [])

  // 2026 KİK Eşik Değerleri (Doğrudan Temin Md. 22/d Tek Seferlik Alım Parasal Limitleri)
  const esikDeger = idareTipi === 'buyuksehir' ? 864500 : 288100
  const kullanimYuzdesi = ((kotaData.gerceklesen22dToplami / kotaData.yuzde10TavanTutari) * 100).toFixed(1)
  const yuzdeNum = Number(kullanimYuzdesi)

  return (
    <div className="space-y-6">
      {/* İdare Tipi Seçici ve Eşik Değeri Bilgisi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Scale size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                4734 Sayılı Kanun Madde 62/ı & 22/d Parasal Limit Masası
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                2026 Resmî KİK Tebliği
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İdarenin toplam bütçesinin %10 doğrudan temin harcama tavanı ve birim kotası kontrolü.
            </p>
          </div>
        </div>

        {/* Büyükşehir vs Diğer İdare Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setIdareTipi('buyuksehir')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              idareTipi === 'buyuksehir'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Büyükşehir İdaresi (864.500 ₺)
          </button>
          <button
            onClick={() => setIdareTipi('diger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              idareTipi === 'diger'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Diğer İdareler (288.100 ₺)
          </button>
        </div>
      </div>

      {/* %10 KİK Tavan İlerleme Kartı */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Kurumsal 4734 Sayılı Kanun Madde 62/ı Tavan Kullanımı (%10 Kotası)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  yuzdeNum >= 95
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    : yuzdeNum >= 80
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                }`}
              >
                {yuzdeNum >= 95 ? 'KRİTİK RİSK - KİK İZNİ GEREKLİ' : yuzdeNum >= 80 ? 'UYARI DÜZEYİ' : 'GÜVENLİ LİMİT'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kanun gereği, idarelerin bütçelerine bu amaçla konulan ödeneklerin %10&apos;unu aşan doğrudan temin alımları için Kamu İhale Kurulu&apos;ndan izin alınması zorunludur.
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              %{kullanimYuzdesi}
            </div>
            <div className="text-[11px] text-slate-400">Tavan Kotası Doluluk</div>
          </div>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                yuzdeNum >= 95 ? 'bg-rose-500' : yuzdeNum >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, yuzdeNum)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>Harcanan: {formatCurrency(kotaData.gerceklesen22dToplami)}</span>
            <span>Kalan İzinli Pay: {formatCurrency(kotaData.kalanKotaTutari)}</span>
            <span>%10 Yasal Tavan: {formatCurrency(kotaData.yuzde10TavanTutari)}</span>
          </div>
        </div>
      </div>

      {/* Harcama Birimleri Bazında Kota Dağılımı */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={15} className="text-blue-500" />
            Harcama Birimleri 22/d Kota & Limit Dağılım Cetveli
          </h3>
          <span className="text-xs text-slate-400">
            Tek Seferlik 22/d Eşik Değeri: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(esikDeger)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Harcama Birimi</th>
                <th className="py-3 px-4 text-right">Yıllık Bütçe Payı</th>
                <th className="py-3 px-4 text-right">%10 DT Kotası</th>
                <th className="py-3 px-4 text-right">Gerçekleşen DT</th>
                <th className="py-3 px-4 text-right">Kalan Kota</th>
                <th className="py-3 px-4 text-center">Kota Kullanım</th>
                <th className="py-3 px-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {kotaData.birimDagitimlari.map((birim) => {
                const yuzdeVal = birim.oran
                const kalan = Math.max(0, birim.tahsisEdilen - birim.harcanan)
                return (
                  <tr key={birim.birimAdi} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {birim.birimAdi}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(birim.tahsisEdilen * 10)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(birim.tahsisEdilen)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(birim.harcanan)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(kalan)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              yuzdeVal >= 90 ? 'bg-rose-500' : yuzdeVal >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, yuzdeVal)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 w-8 text-right">
                          %{yuzdeVal.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {yuzdeVal >= 90 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <AlertTriangle size={10} /> Kritik
                        </span>
                      ) : yuzdeVal >= 75 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Info size={10} /> Uyarı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={10} /> Normal
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
