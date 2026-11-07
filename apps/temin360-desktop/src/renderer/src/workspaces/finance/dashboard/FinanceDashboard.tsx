import React from 'react'
import {
  Coins,
  Scale,
  Receipt,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { useWorkspaceContextStore } from '@renderer/store/workspaceContextStore'

export const FinanceDashboard: React.FC<{
  onNavigateTab: (tabId: string) => void
}> = ({ onNavigateTab }) => {
  const { canAccessFinancialServices, canAccessAccounting } = useWorkspaceContextStore()

  return (
    <div className="space-y-6">
      {/* 4 Önemli Mali Metrik Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: 5018 Kullanılabilir Serbest Ödenek */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>5018 Serbest Ödenek</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Coins size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(2250000)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> Toplam Ödeneğin %62,5&apos;i serbest
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('budget-tracking')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <span>Bütçe Tertipleri Masası</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Kart 2: 4734 Md. 62/ı KİK %10 Kotası */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>%10 KİK Tavan Kullanımı</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Scale size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              %42,8
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> KİK İzin Limiti Güvenli Bölgede
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('compliance-check')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            <span>Kota & Limit İncele</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Kart 3: Bekleyen Ödeme Emri Belgeleri */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>İmza Bekleyen ÖEB</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Receipt size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
              3 Belge
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Net Tutar: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(482881)}</strong>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('oeb-drafts')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            <span>ÖEB Masasına Git</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Kart 4: Teminat ve Emanetler */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Aktif Teminatlar (Banka)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(190000)}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">
              3 Mektup Kasada Aktif
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('guarantees-escrow')}
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <span>Emanet Masasını Aç</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Orta Grid: İki Bölümlü Hızlı Kontrol Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Satın Alma'dan Gelen ve Mali İnceleme Bekleyen Dosyalar */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                Mali İnceleme Bekleyen Satın Alma Dosyaları
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                4734 Doğrudan Temin sürecinden aktarılan ve bloke/tahakkuk bekleyen işler
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('incoming-procurements')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Tümünü Gör
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 1,
                dosyaNo: '2026/DT-104',
                konu: 'Hizmet Binası Güvenlik ve Ağ Donanımı Alımı',
                firma: 'Mega Bilişim Ltd. Şti.',
                tutar: 245000,
                durum: 'ÖEB Hazırlanacak'
              },
              {
                id: 2,
                dosyaNo: '2026/DT-108',
                konu: 'Kütüphane Süreli Yayın ve Kitap Alımı',
                firma: 'Kültür Kitap Dağıtım A.Ş.',
                tutar: 88500,
                durum: 'Bloke Bekliyor'
              },
              {
                id: 3,
                dosyaNo: '2026/DT-112',
                konu: 'Hizmet Araçları Periyodik Bakım Hizmeti',
                firma: 'Öz Ulaşım Otomotiv Sanayi Ltd.',
                tutar: 165000,
                durum: 'Tevkifat Kontrolü'
              }
            ].map((dosya) => (
              <div
                key={dosya.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-blue-600 dark:text-blue-400">
                      {dosya.dosyaNo}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-amber-500/10 text-amber-600">
                      {dosya.durum}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {dosya.konu}
                  </div>
                  <div className="text-[10px] text-slate-400">{dosya.firma}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {formatCurrency(dosya.tutar)}
                  </div>
                  <button
                    onClick={() => onNavigateTab('incoming-procurements')}
                    className="text-[10px] text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-0.5"
                  >
                    <span>İşleme Al</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ Kolon: Mali Uygunluk ve Bütçe Sağlık Durumu */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart size={16} className="text-emerald-500" />
              Mali Uygunluk & Denetim Durumu
            </h3>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1.5">
              <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> 5018 Harcama Kontrolü Aktif
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                Tüm satın alma dosyaları bütçe tertibine bağlanmadan ve kanuni vergi kesintileri yapılmadan ödemeye sevk edilemez.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">2026 Yılı 22/d Eşik Değeri (Büyükşehir):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">864.500 ₺</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Sözleşme Damga Vergisi Oranı:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">Binde 9,48</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">İhale Karar Pulu Oranı:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">Binde 5,69</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Kesin Teminat Mektubu Oranı:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">%6</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('tax-deductions')}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Yasal Kesinti ve Vergi Hesaplayıcıyı Aç</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
