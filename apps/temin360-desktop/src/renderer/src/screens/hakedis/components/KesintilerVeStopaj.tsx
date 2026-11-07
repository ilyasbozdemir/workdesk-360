import React from 'react'
import {
  Percent,
  Receipt,
  Scale,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CreditCard,
  Building2
} from 'lucide-react'
import { KesintiParametreleri } from '../types'

interface KesintilerVeStopajProps {
  parametreler: KesintiParametreleri
  onUpdateParametreler: (patch: Partial<KesintiParametreleri>) => void
  brutHakedisTutari: number // Bu hakediş imalat + fiyat farkı
  hesaplananStopaj: number
  hesaplananDamga: number
  hesaplananKararPulu: number
  hesaplananKdv: number
  hesaplananKdvTevkifat: number
  toplamKesintiler: number
  netOdenecekTutar: number
  formatCurrency: (val: number) => string
  onAktarToOeb?: () => void
}

export const KesintilerVeStopaj: React.FC<KesintilerVeStopajProps> = ({
  parametreler,
  onUpdateParametreler,
  brutHakedisTutari,
  hesaplananStopaj,
  hesaplananDamga,
  hesaplananKararPulu,
  hesaplananKdv,
  hesaplananKdvTevkifat,
  toplamKesintiler,
  netOdenecekTutar,
  formatCurrency,
  onAktarToOeb
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Başlık & Açıklama */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Receipt size={17} className="text-rose-500" />
          Yasal Kesintiler, Stopaj, Damga Vergisi &amp; KDV Tevkifatı Masası
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          5018 Sayılı Kamu Mali Yönetimi Kanunu ve 193 Sayılı Gelir Vergisi Kanunu Uyarınca Hakediş
          Tahakkuk Kesintileri
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol 2 Kolon: Kesinti Parametreleri & Ayarlar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Vergi ve Harç Kesintileri Formu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Vergi ve Yasal Kesinti Oranları
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gelir/Kurumlar Vergisi Stopajı (GVK md. 94)
                </label>
                <select
                  value={parametreler.stopajOrani}
                  onChange={(e) =>
                    onUpdateParametreler({ stopajOrani: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value={0}>%0 — Stopajsız (Mal Alımı / Tek Yıllık Hizmet)</option>
                  <option value={0.05}>%5 — Yıllara Sâri Yapım ve Onarım İşleri</option>
                  <option value={0.03}>%3 — Özel Teşvikli / Muafiyetli</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hakediş Damga Vergisi (Kanuni Oran: ‰ 9,48)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={parametreler.damgaVergisiOrani}
                    onChange={(e) =>
                      onUpdateParametreler({
                        damgaVergisiOrani: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">‰ 9,48</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Karar Pulu Kesintisi (Kanuni Oran: ‰ 5,69)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={parametreler.kararPuluOrani}
                    onChange={(e) =>
                      onUpdateParametreler({
                        kararPuluOrani: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">‰ 5,69</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  KDV Tevkifat Oranı
                </label>
                <select
                  value={`${parametreler.kdvTevkifatOraniPay}/${parametreler.kdvTevkifatOraniPayda}`}
                  onChange={(e) => {
                    const [pay, payda] = e.target.value.split('/').map(Number)
                    onUpdateParametreler({
                      kdvTevkifatOraniPay: pay,
                      kdvTevkifatOraniPayda: payda
                    })
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                >
                  <option value="0/10">Tevkifatsız (0/10)</option>
                  <option value="4/10">4/10 — Yapım İşleri ve Onarım</option>
                  <option value="5/10">5/10 — Etüt, Plan, Proje, Denetim</option>
                  <option value="7/10">7/10 — Temizlik, Çevre, Bahçe Bakım</option>
                  <option value="9/10">9/10 — Güvenlik Hizmetleri</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Avans Mahsubu (₺)
                </label>
                <input
                  type="number"
                  step="any"
                  value={parametreler.avansMahsubu || ''}
                  onChange={(e) =>
                    onUpdateParametreler({
                      avansMahsubu: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gecikme Cezası &amp; Nefaset Kesintisi (₺)
                </label>
                <input
                  type="number"
                  step="any"
                  value={parametreler.cezaVeDigerKesintiler || ''}
                  onChange={(e) =>
                    onUpdateParametreler({
                      cezaVeDigerKesintiler: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Kesinti Kalemleri Detay Tablosu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Kesintiler Dökümü
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Gelir/Kurumlar Vergisi Stopajı (%{parametreler.stopajOrani * 100})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(hesaplananStopaj)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Hakediş Damga Vergisi (‰ {(parametreler.damgaVergisiOrani * 1000).toFixed(2)})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(hesaplananDamga)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    Karar Pulu Kesintisi (‰ {(parametreler.kararPuluOrani * 1000).toFixed(2)})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(hesaplananKararPulu)}
                  </td>
                </tr>
                {parametreler.kdvTevkifatOraniPay > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      KDV Tevkifat Tutarı (
                      {parametreler.kdvTevkifatOraniPay}/{parametreler.kdvTevkifatOraniPayda})
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      - {formatCurrency(hesaplananKdvTevkifat)}
                    </td>
                  </tr>
                )}
                {parametreler.avansMahsubu > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      Avans Mahsubu
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      - {formatCurrency(parametreler.avansMahsubu)}
                    </td>
                  </tr>
                )}
                {parametreler.cezaVeDigerKesintiler > 0 && (
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      Gecikme / Ceza Kesintisi
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      - {formatCurrency(parametreler.cezaVeDigerKesintiler)}
                    </td>
                  </tr>
                )}
                <tr className="bg-rose-50/50 dark:bg-rose-950/20 font-bold">
                  <td className="py-3 px-4 text-rose-700 dark:text-rose-300 uppercase">
                    Toplam Kesintiler
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                    - {formatCurrency(toplamKesintiler)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sağ Kolon: Tahakkuk & Ödenecek Kartı */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tahakkuk Özeti
              </span>
              <CreditCard size={18} className="text-emerald-400" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Brüt Hakediş Tutarı:</span>
                <span className="font-mono font-bold">{formatCurrency(brutHakedisTutari)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hesaplanan KDV (%20):</span>
                <span className="font-mono font-medium">{formatCurrency(hesaplananKdv)}</span>
              </div>
              <div className="flex justify-between text-rose-300 font-semibold">
                <span>Toplam Kesintiler:</span>
                <span className="font-mono">- {formatCurrency(toplamKesintiler)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Yükleniciye Ödenecek Net Tutar
              </div>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {formatCurrency(netOdenecekTutar)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Banka hesabına aktarılacak hak ediş bedeli.
              </div>
            </div>
          </div>

          {/* 5018 ÖEB'ye Aktarma Butonu */}
          {onAktarToOeb && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Building2 size={16} />
                5018 Mali Entegrasyon
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Bu hakediş tahakkukunu ve yasal kesintilerini doğrudan Mali Hizmetler ÖEB (Ödeme
                Emri Belgesi) ve MİF taslaklarına aktarın.
              </p>
              <button
                type="button"
                onClick={onAktarToOeb}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer hover:scale-[1.01]"
              >
                <span>Ödeme Emri Belgesine (ÖEB) Aktar</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
