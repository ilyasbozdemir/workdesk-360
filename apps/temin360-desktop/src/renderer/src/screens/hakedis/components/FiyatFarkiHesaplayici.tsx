import React from 'react'
import { Calculator, TrendingUp, Info, HelpCircle } from 'lucide-react'
import { FiyatFarkiParametreleri } from '../types'

interface FiyatFarkiHesaplayiciProps {
  parametreler: FiyatFarkiParametreleri
  onUpdateParametreler: (patch: Partial<FiyatFarkiParametreleri>) => void
  buHakedisImalatTutari: number
  hesaplananFiyatFarki: number
  formatCurrency: (val: number) => string
}

export const FiyatFarkiHesaplayici: React.FC<FiyatFarkiHesaplayiciProps> = ({
  parametreler,
  onUpdateParametreler,
  buHakedisImalatTutari,
  hesaplananFiyatFarki,
  formatCurrency
}) => {
  const endeksOrani =
    parametreler.temelEndeksI0 > 0
      ? (parametreler.guncelEndeksIn / parametreler.temelEndeksI0 - 1)
      : 0
  const endeksYuzde = (endeksOrani * 100).toFixed(2)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Üst Kontrol & Durum Paneli */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              4734 Sayılı Kanun Madde 8 — Fiyat Farkı Hesabı Masası
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            TÜİK Yurt İçi Üretici Fiyat Endeksi (Yİ-ÜFE) ve Kamu İhale Kurumu Esaslarına Göre Fiyat
            Farkı Tespiti
          </p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={parametreler.aktifMi}
            onChange={(e) => onUpdateParametreler({ aktifMi: e.target.checked })}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
          />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Bu Hakedişte Fiyat Farkı Uygula
          </span>
        </label>
      </div>

      {parametreler.aktifMi ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sol: Endeks ve Katsayı Girişleri */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              TÜİK Yİ-ÜFE ve Temel Endeks Değerleri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Temel İhale Ayı Endeksi (I₀)
                </label>
                <input
                  type="number"
                  step="any"
                  value={parametreler.temelEndeksI0}
                  onChange={(e) =>
                    onUpdateParametreler({ temelEndeksI0: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                  placeholder="Örn: 3250.40"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  İhale veya yaklaşık maliyet onay tarihindeki TÜİK endeksi
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Hakediş Ayı Güncel Endeksi (Iₙ)
                </label>
                <input
                  type="number"
                  step="any"
                  value={parametreler.guncelEndeksIn}
                  onChange={(e) =>
                    onUpdateParametreler({ guncelEndeksIn: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                  placeholder="Örn: 3680.15"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  İmalatın gerçekleştiği hakediş dönemine ait TÜİK endeksi
                </span>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2 pt-2">
              Sözleşme Ağırlık Katsayıları (a₁, a₂, b₁, b₂)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">
                  İşçilik Katsayısı (a₁)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parametreler.iscilikKatsayisiA1}
                  onChange={(e) =>
                    onUpdateParametreler({
                      iscilikKatsayisiA1: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">
                  Malzeme/Beton (a₂)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parametreler.malzemeKatsayisiA2}
                  onChange={(e) =>
                    onUpdateParametreler({
                      malzemeKatsayisiA2: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">
                  Akaryakıt (b₁)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parametreler.akaryakitKatsayisiB1}
                  onChange={(e) =>
                    onUpdateParametreler({
                      akaryakitKatsayisiB1: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1">
                  Makine/Amortisman (b₂)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parametreler.makineKatsayisiB2}
                  onChange={(e) =>
                    onUpdateParametreler({
                      makineKatsayisiB2: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <div>
                <strong>Resmî Formül:</strong> F = B × [A × (Iₙ / I₀ - 1)] formülü uyarınca bu
                hakedişte gerçekleşen imalat tutarı baz alınarak fiyat farkı hesabı işletilir.
              </div>
            </div>
          </div>

          {/* Sağ: Hesaplama Özeti Kartı */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <TrendingUp size={15} />
                Fiyat Farkı Sonuç Özeti
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Esas İmalat Tutarı (B):</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(buHakedisImalatTutari)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Endeks Artış Oranı:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    %{endeksYuzde}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Temel Endeks (I₀):</span>
                  <span className="font-mono">{parametreler.temelEndeksI0}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Güncel Endeks (Iₙ):</span>
                  <span className="font-mono">{parametreler.guncelEndeksIn}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-200 dark:border-amber-800/60">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Hesaplanan Fiyat Farkı Tutarı
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {formatCurrency(hesaplananFiyatFarki)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Hakediş İcmaline ve Ödeme Emri Belgesine (ÖEB) otomatik eklenecektir.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
          <HelpCircle size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
          <div className="text-sm font-semibold">Fiyat Farkı Hesabı Devre Dışı</div>
          <p className="text-xs max-w-md mx-auto">
            Sözleşmenizde fiyat farkı verilmesi öngörülmediyse veya bu hakediş döneminde fiyat farkı
            hesaplanmayacaksa bu alanı kapalı tutabilirsiniz.
          </p>
        </div>
      )}
    </div>
  )
}

