import React, { useState } from 'react'
import {
  Calculator,
  Percent,
  Receipt,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'

export const TaxDeductionsPage: React.FC = () => {
  const [brutTutar, setBrutTutar] = useState<number>(150000)
  const [kdvOrani, setKdvOrani] = useState<number>(20)
  const [tevkifatOrani, setTevkifatOrani] = useState<number>(5) // 5/10
  const [sozlesmeVarMi, setSozlesmeVarMi] = useState<boolean>(true)
  const [kararPuluHesaplansinMi, setKararPuluHesaplansinMi] = useState<boolean>(true)

  // Hesaplamalar
  const kdvTutari = (brutTutar * kdvOrani) / 100
  const tevkifEdilenKdv = (kdvTutari * tevkifatOrani) / 10
  const yukleniciyeOdenenKdv = kdvTutari - tevkifEdilenKdv

  // Damga Vergisi (Sözleşme Binde 9,48)
  const damgaVergisiOrani = 0.00948
  const damgaVergisi = sozlesmeVarMi ? brutTutar * damgaVergisiOrani : 0

  // Karar Pulu (İhale / Komisyon Kararı Binde 5,69)
  const kararPuluOrani = 0.00569
  const kararPulu = kararPuluHesaplansinMi ? brutTutar * kararPuluOrani : 0

  // Toplam Yasal Kesintiler
  const toplamKesinti = damgaVergisi + kararPulu + tevkifEdilenKdv
  const toplamAlacakliyaOdenecek = brutTutar + yukleniciyeOdenenKdv - damgaVergisi - kararPulu

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Vergi, Karar Pulu ve KDV Tevkifatı Hesaplama Motoru
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              488 Sayılı Damga Vergisi Kanunu ve KDV Genel Uygulama Tebliği uyarınca yasal tahakkuk kesintileri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/50">
            Sözleşme DV: ‰ 9,48
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/50">
            Karar Pulu: ‰ 5,69
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Parametre Giriş Formu */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt size={16} className="text-purple-500" />
            Tahakkuk & Matrah Parametreleri
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hakediş / Fatura Brüt Matrahı (KDV Hariç)
            </label>
            <div className="relative">
              <input
                type="number"
                value={brutTutar}
                onChange={(e) => setBrutTutar(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-slate-100"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₺
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                KDV Oranı (%)
              </label>
              <select
                value={kdvOrani}
                onChange={(e) => setKdvOrani(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={20}>%20 (Standart)</option>
                <option value={10}>%10 (İndirimli)</option>
                <option value={1}>%1 (Temel Gıda)</option>
                <option value={0}>%0 (KDV Muaf)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                KDV Tevkifat Oranı
              </label>
              <select
                value={tevkifatOrani}
                onChange={(e) => setTevkifatOrani(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={0}>Tevkifat Yok (0/10)</option>
                <option value={2}>2/10 (Temizlik, Bakım)</option>
                <option value={3}>3/10 (Özel Güvenlik)</option>
                <option value={5}>5/10 (Danışmanlık, Denetim)</option>
                <option value={7}>7/10 (Yemek, Organizasyon)</option>
                <option value={9}>9/10 (Servis Taşımacılığı)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sozlesmeVarMi}
                onChange={(e) => setSozlesmeVarMi(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Sözleşme Damga Vergisi Kesintisi Yap (Binde 9,48)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={kararPuluHesaplansinMi}
                onChange={(e) => setKararPuluHesaplansinMi(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                İhale Karar Pulu Kesintisi Yap (Binde 5,69)
              </span>
            </label>
          </div>
        </div>

        {/* Sağ Kolon: Tahakkuk Cetveli Özeti */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Resmî Tahakkuk & Kesinti Cetveli</span>
              <span className="text-xs font-normal text-slate-400">5018 ÖEB Ek Cetveli</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Brüt Tutar (KDV Hariç Matrah):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(brutTutar)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Hesaplanan KDV (%{kdvOrani}):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(kdvTutari)}</span>
              </div>

              {tevkifatOrani > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20 px-2 rounded-lg text-purple-900 dark:text-purple-300">
                  <span>Tevkif Edilen KDV ({tevkifatOrani}/10 - Vergi Dairesine):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(tevkifEdilenKdv)}</span>
                </div>
              )}

              {sozlesmeVarMi && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 px-2 text-slate-700 dark:text-slate-300">
                  <span>Sözleşme Damga Vergisi (‰ 9,48):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(damgaVergisi)}</span>
                </div>
              )}

              {kararPuluHesaplansinMi && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 px-2 text-slate-700 dark:text-slate-300">
                  <span>İhale Karar Pulu (‰ 5,69):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(kararPulu)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-bold text-rose-600 dark:text-rose-400">
                <span>Toplam Yasal Kesintiler:</span>
                <span>-{formatCurrency(toplamKesinti)}</span>
              </div>
            </div>
          </div>

          {/* Net Tutar Vurgusu */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Hak Sahibine Ödenecek Net Tutar
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(toplamAlacakliyaOdenecek)}
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              5018 Sayılı Kanun Uyarınca<br />ÖEB Düzenlemeye Esas
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

