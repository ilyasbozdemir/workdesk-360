import React from 'react'
import {
  FileText,
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2
} from 'lucide-react'
import { HakedisBilgileri } from '../types'

interface HakedisOzetKapakProps {
  bilgiler: HakedisBilgileri
  onUpdateBilgiler: (patch: Partial<HakedisBilgileri>) => void
  buHakedisImalatTutari: number
  fiyatFarkiTutari: number
  toplamKesintiler: number
  netOdenecekTutar: number
  formatCurrency: (val: number) => string
}

export const HakedisOzetKapak: React.FC<HakedisOzetKapakProps> = ({
  bilgiler,
  onUpdateBilgiler,
  buHakedisImalatTutari,
  fiyatFarkiTutari,
  toplamKesintiler,
  netOdenecekTutar,
  formatCurrency
}) => {
  const toplamImalat = bilgiler.oncekiHakedislerToplami + buHakedisImalatTutari
  const toplamBrut = toplamImalat + fiyatFarkiTutari
  const kalanSozlesme = Math.max(0, bilgiler.sozlesmeBedeli - toplamImalat)
  const gerceklesmeYuzdesi =
    bilgiler.sozlesmeBedeli > 0
      ? Math.min(100, Math.round((toplamImalat / bilgiler.sozlesmeBedeli) * 100))
      : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Üst Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Sözleşme Bedeli</span>
            <Building size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(bilgiler.sozlesmeBedeli)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">İhale/Sözleşme tescil tutarı</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Bu Hakediş İmalatı</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(buHakedisImalatTutari)}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">
            + {formatCurrency(fiyatFarkiTutari)} Fiyat Farkı
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Kümülatif Toplam</span>
            <TrendingUp size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {formatCurrency(toplamImalat)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Kalan: {formatCurrency(kalanSozlesme)}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-emerald-100 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Net Ödenecek</span>
            <FileCheck2 size={18} />
          </div>
          <div className="text-2xl font-black">{formatCurrency(netOdenecekTutar)}</div>
          <div className="text-[11px] text-emerald-100/90 font-medium mt-1">
            Kesintiler Düşüldükten Sonra
          </div>
        </div>
      </div>

      {/* 2. İlerleme Çubuğu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            İşin Fiziksel ve Parasal Gerçekleşme Oranı
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
            %{gerceklesmeYuzdesi}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${gerceklesmeYuzdesi}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
          <span>Başlangıç (0 ₺)</span>
          <span>Önceki Hakedişler: {formatCurrency(bilgiler.oncekiHakedislerToplami)}</span>
          <span>Hedef: {formatCurrency(bilgiler.sozlesmeBedeli)}</span>
        </div>
      </div>

      {/* 3. Sözleşme ve Proje Bilgileri Düzenleme Formu */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          Hakediş Başlık ve Sözleşme Bilgileri (Hakediş.org Formatı)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              İşin / Hizmetin Adı
            </label>
            <input
              type="text"
              value={bilgiler.isAdi}
              onChange={(e) => onUpdateBilgiler({ isAdi: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
              placeholder="Örn: Hizmet Binası Onarımı veya Sunucu Bakım Hizmeti"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Yüklenici Firma / Müteahhit
            </label>
            <input
              type="text"
              value={bilgiler.yukleniciFirma}
              onChange={(e) => onUpdateBilgiler({ yukleniciFirma: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
              placeholder="Yüklenici Ticaret Ünvanı"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Dosya / İhale Kayıt No
            </label>
            <input
              type="text"
              value={bilgiler.dosyaNo}
              onChange={(e) => onUpdateBilgiler({ dosyaNo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
              placeholder="Örn: 2026/DT-142 veya 2026/89452"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Sözleşme Bedeli (₺)
            </label>
            <input
              type="number"
              value={bilgiler.sozlesmeBedeli || ''}
              onChange={(e) =>
                onUpdateBilgiler({ sozlesmeBedeli: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Önceki Hakedişler Toplamı (₺)
            </label>
            <input
              type="number"
              value={bilgiler.oncekiHakedislerToplami || ''}
              onChange={(e) =>
                onUpdateBilgiler({
                  oncekiHakedislerToplami: parseFloat(e.target.value) || 0
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Hakediş Düzenleme Tarihi
            </label>
            <input
              type="date"
              value={bilgiler.hakedisTarihi}
              onChange={(e) => onUpdateBilgiler({ hakedisTarihi: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              İşe Başlama Tarihi
            </label>
            <input
              type="date"
              value={bilgiler.iseBaslamaTarihi}
              onChange={(e) => onUpdateBilgiler({ iseBaslamaTarihi: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Sözleşme Bitiş Tarihi
            </label>
            <input
              type="date"
              value={bilgiler.isBitimTarihi}
              onChange={(e) => onUpdateBilgiler({ isBitimTarihi: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Süre Uzatımı (Gün)
            </label>
            <input
              type="number"
              value={bilgiler.sureUzatimiGun || ''}
              onChange={(e) =>
                onUpdateBilgiler({ sureUzatimiGun: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Resmi Hakediş İcmali Tablosu (Hakediş.org Resmî Şablonu) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Hakediş İcmal Cetveli (Özet Tablosu)
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
            Hakediş No: {bilgiler.hakedisNo}
          </span>
        </div>

        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 font-bold text-slate-600 dark:text-slate-300">
              <th className="py-2.5 px-4">Sıra</th>
              <th className="py-2.5 px-4">İşlem / Mali Kalem</th>
              <th className="py-2.5 px-4 text-right">Tutar (₺)</th>
              <th className="py-2.5 px-4">Mevzuat &amp; Formül Açıklaması</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <tr>
              <td className="py-2.5 px-4 font-mono font-bold text-slate-400">1</td>
              <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                Önceki Hakedişler Toplamı (A)
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-medium">
                {formatCurrency(bilgiler.oncekiHakedislerToplami)}
              </td>
              <td className="py-2.5 px-4 text-slate-400">
                1'den {bilgiler.hakedisNo - 1}. hakedişe kadar ödenen imalatlar
              </td>
            </tr>
            <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
              <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">2</td>
              <td className="py-2.5 px-4 font-bold text-emerald-700 dark:text-emerald-300">
                Bu Hakediş Yapılan İşler Tutarı (B)
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(buHakedisImalatTutari)}
              </td>
              <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                Yeşil defter ve metraj cetvelinden gelen toplam
              </td>
            </tr>
            <tr className="font-semibold bg-slate-50 dark:bg-slate-800/40">
              <td className="py-2.5 px-4 font-mono font-bold text-slate-500">3</td>
              <td className="py-2.5 px-4 font-bold">Toplam İmalat Tutarı (A + B)</td>
              <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(toplamImalat)}
              </td>
              <td className="py-2.5 px-4 text-slate-500">Kümülatif gerçekleşen fiziki iş</td>
            </tr>
            <tr>
              <td className="py-2.5 px-4 font-mono font-bold text-slate-400">4</td>
              <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                Fiyat Farkı Tutarı (F)
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                {formatCurrency(fiyatFarkiTutari)}
              </td>
              <td className="py-2.5 px-4 text-slate-400">4734 m. 8 ve Yİ-ÜFE esaslı artış</td>
            </tr>
            <tr className="bg-slate-100/60 dark:bg-slate-800/60 font-bold">
              <td className="py-2.5 px-4 font-mono font-bold text-slate-500">5</td>
              <td className="py-2.5 px-4">Toplam Hakediş Brüt Tutarı</td>
              <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(toplamBrut)}
              </td>
              <td className="py-2.5 px-4 text-slate-500">İmalat + Fiyat Farkı Toplamı</td>
            </tr>
            <tr className="text-rose-600 dark:text-rose-400">
              <td className="py-2.5 px-4 font-mono font-bold text-rose-500">6</td>
              <td className="py-2.5 px-4 font-semibold">Toplam Yasal Kesintiler</td>
              <td className="py-2.5 px-4 text-right font-mono font-bold">
                - {formatCurrency(toplamKesintiler)}
              </td>
              <td className="py-2.5 px-4">Stopaj, Damga Vergisi, Karar Pulu, KDV Tevkifatı</td>
            </tr>
            <tr className="bg-emerald-600 text-white font-black text-sm">
              <td className="py-3 px-4 font-mono">7</td>
              <td className="py-3 px-4">NET ÖDENECEK HAKEDİŞ TUTARI</td>
              <td className="py-3 px-4 text-right font-mono text-base tracking-wide">
                {formatCurrency(netOdenecekTutar)}
              </td>
              <td className="py-3 px-4 text-emerald-100 font-normal text-xs">
                Ödeme Emri Belgesi (ÖEB) ve Banka Talimatına Esas Tutar
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

