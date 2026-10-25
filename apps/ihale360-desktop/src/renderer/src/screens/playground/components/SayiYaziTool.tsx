import React, { useState, useMemo } from 'react'
import { Type, RotateCcw, Sparkles, Copy, Check, Info } from 'lucide-react'
import { convertNumberToWords } from '../../../utils/turkishCalculationUtils'

interface SayiYaziToolProps {
  onCopy: (text: string, key?: string) => void
  copiedKey: string | null
}

export function SayiYaziTool({ onCopy, copiedKey }: SayiYaziToolProps): React.JSX.Element {
  const [sayiInput, setSayiInput] = useState<string>('128450.75')
  const [currencyOpt, setCurrencyOpt] = useState<'TL' | 'USD' | 'EUR' | 'NONE'>('TL')
  const [caseOpt, setCaseOpt] = useState<'UPPER' | 'LOWER' | 'TITLE'>('UPPER')
  const [prefixOpt, setPrefixOpt] = useState<string>('#Yalnız ')
  const [suffixOpt, setSuffixOpt] = useState<string>("'dir#")

  const sayiYaziSonuc = useMemo(() => {
    const num = parseFloat(sayiInput.replace(',', '.'))
    if (isNaN(num)) return ''
    return convertNumberToWords(num, {
      currency: currencyOpt,
      subCurrency:
        currencyOpt === 'TL'
          ? 'KURUŞ'
          : currencyOpt === 'USD' || currencyOpt === 'EUR'
            ? 'CENT'
            : 'NONE',
      prefix: prefixOpt,
      suffix: suffixOpt,
      caseType: caseOpt
    })
  }, [sayiInput, currencyOpt, caseOpt, prefixOpt, suffixOpt])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sol Ayar Paneli */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-600" />
            Sayı &amp; Tutar Girişi
          </h3>
          <button
            type="button"
            onClick={() => {
              setSayiInput('1000000')
              setCurrencyOpt('TL')
              setCaseOpt('UPPER')
            }}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sıfırla
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Dönüştürülecek Tutar / Sayı
          </label>
          <div className="relative">
            <input
              type="text"
              value={sayiInput}
              onChange={(e) => setSayiInput(e.target.value)}
              placeholder="Örn: 125430.50"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          {/* Hızlı Örnekler */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Örnekler:</span>
            {['1250', '45890.50', '1500000', '12345678.90'].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setSayiInput(ex)}
                className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded cursor-pointer transition-colors"
              >
                {parseFloat(ex).toLocaleString('tr-TR')} ₺
              </button>
            ))}
          </div>
        </div>

        {/* Para Birimi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Para Birimi &amp; Kuruş Eki
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'TL', label: 'Türk Lirası (TL)' },
              { id: 'USD', label: 'Dolar ($)' },
              { id: 'EUR', label: 'Euro (€)' },
              { id: 'NONE', label: 'Birimsiz Sayı' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrencyOpt(item.id as any)}
                className={`px-2.5 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer text-center ${
                  currencyOpt === item.id
                    ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Harf Düzeni */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Büyük / Küçük Harf Düzeni
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'UPPER', label: 'TÜMÜ BÜYÜK' },
              { id: 'TITLE', label: 'Baş Harfler Büyük' },
              { id: 'LOWER', label: 'tümü küçük' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCaseOpt(item.id as any)}
                className={`px-2.5 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer text-center ${
                  caseOpt === item.id
                    ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ön Ek ve Son Ek */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Başlangıç Ön Eki
            </label>
            <input
              type="text"
              value={prefixOpt}
              onChange={(e) => setPrefixOpt(e.target.value)}
              placeholder="#Yalnız "
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bitiş Son Eki
            </label>
            <input
              type="text"
              value={suffixOpt}
              onChange={(e) => setSuffixOpt(e.target.value)}
              placeholder="'dir#"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sağ Sonuç Kartı */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border border-blue-800/50 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Yazıyla Tutar Okunuşu
              </span>
              <button
                type="button"
                onClick={() => onCopy(sayiYaziSonuc, 'sayi_yazi')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                {copiedKey === 'sayi_yazi' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    Kopyalandı!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Panoya Kopyala
                  </>
                )}
              </button>
            </div>

            <div className="min-h-[120px] bg-slate-950/60 border border-blue-500/20 rounded-xl p-5 flex items-center justify-center text-center">
              <p className="text-lg md:text-xl font-bold tracking-wide text-blue-50 leading-relaxed select-all">
                {sayiYaziSonuc || 'Lütfen geçerli bir sayı giriniz'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-blue-800/40 text-xs text-blue-200/80">
            <div>
              <span className="block text-[10px] uppercase text-blue-400 font-semibold">
                Rakamla Tutar:
              </span>
              <span className="font-bold text-white text-sm">
                {parseFloat(sayiInput.replace(',', '.') || '0').toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{' '}
                ₺
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-blue-400 font-semibold">
                Para Birimi:
              </span>
              <span className="font-bold text-white">{currencyOpt}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-blue-400 font-semibold">
                Kullanım Yeri:
              </span>
              <span className="font-bold text-white">İhale / Onay Belgeleri</span>
            </div>
          </div>
        </div>

        {/* Bilgilendirme Kutusu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              4734 Sayılı Kamu İhale Kanunu ve Muhasebat Standartları:
            </p>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Resmi belgelerde, onay belgelerinde, yaklaşık maliyet hesap cetvellerinde ve hakediş
              kapaklarında tutarların yazı ile belirtilmesi zorunludur. Yanıltmayı önlemek amacıyla
              metnin başına ve sonuna &quot;#&quot; karakteri veya &quot;Yalnız&quot; ibaresi
              eklenmesi tavsiye edilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
