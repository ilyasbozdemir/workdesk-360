import React from 'react'
import { DollarSign, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { YeniDosyaTabProps } from '../../../types'

export function MaliAnalizVeButceSection(props: YeniDosyaTabProps): React.JSX.Element {
  const { formData, setFormData, kodSozlugu, openTextGenerator } = props

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
        <DollarSign className="text-blue-500 w-5 h-5" />
        <h2 className="text-base font-bold text-slate-800 dark:text-white">
          Mali Analiz & Bütçe Harcama Kodları (BETA)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
            Finansman Kodu
          </label>
          <input
            type="text"
            value={formData.finansman_kodu || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                finansman_kodu: e.target.value
              })
            }
            placeholder="Örn: 2, 5 veya 8"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-455">
              Bütçe Kodu / Harcama Tertibi (Ekonomik Kod)
            </label>
            <button
              type="button"
              onClick={() =>
                openTextGenerator?.(
                  'butce_kodu',
                  'Bütçe/Ekonomik Kod Tahmini',
                  'Bütçe Kodu',
                  'Alımın konusuna ve türüne göre (Örn: Mal Alımı, Hizmet Alımı) uygun bir kamu maliyesi ekonomik bütçe kodu veya harcama tertibi tahmin et.'
                )
              }
              className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border-none"
            >
              <Sparkles size={11} /> AI ile Tahmin Et
            </button>
          </div>
          <input
            type="text"
            value={formData.butce_kodu || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                butce_kodu: e.target.value
              })
            }
            placeholder=""
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-slate-200 font-mono font-bold"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-955 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-4">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Mevzuat ve Sistem Parametreleri
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
              Kurumsal Kod (Düzey 1-2-3-4)
            </label>
            <select
              value={formData.e_butce || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  e_butce: e.target.value
                })
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl py-2 px-3 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="">Seçiniz...</option>
              {Array.from(
                new Map(
                  (kodSozlugu ?? []).filter((k) => k.tur === 'kurumsal').map((k) => [k.kod, k])
                ).values()
              ).map((k) => (
                <option key={k.id} value={k.kod}>
                  {k.kod} - {k.aciklama}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-455 mt-1">
              Eksik kodları{' '}
              <Link to="/mevzuat" className="text-blue-600 underline font-semibold">
                Mevzuat & Kodlar
              </Link>{' '}
              ekranından ekleyebilirsiniz.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
              Fonksiyonel Kod (Düzey 1-2-3-4)
            </label>
            <select
              value={formData.fonksiyonel_kod || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fonksiyonel_kod: e.target.value
                })
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl py-2 px-3 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="">Seçiniz...</option>
              {Array.from(
                new Map(
                  (kodSozlugu ?? []).filter((k) => k.tur === 'fonksiyonel').map((k) => [k.kod, k])
                ).values()
              ).map((k) => (
                <option key={k.id} value={k.kod}>
                  {k.kod} - {k.aciklama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
              Muhasebe Birimi (Birim Kodu & Adı)
            </label>
            <select
              value={formData.muhasebe_birimi || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  muhasebe_birimi: e.target.value
                })
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl py-2 px-3 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="">Seçiniz...</option>
              {Array.from(
                new Map(
                  (kodSozlugu ?? [])
                    .filter((k) => k.tur === 'muhasebe_birimi')
                    .map((k) => [k.kod, k])
                ).values()
              ).map((k) => (
                <option key={k.id} value={k.kod}>
                  {k.kod} - {k.aciklama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-455 mb-1.5">
              Harcama Birimi (Birim Kodu & Adı)
            </label>
            <select
              value={formData.harcama_birimi || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  harcama_birimi: e.target.value
                })
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl py-2 px-3 focus:outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="">Seçiniz...</option>
              {Array.from(
                new Map(
                  (kodSozlugu ?? [])
                    .filter((k) => k.tur === 'harcama_birimi')
                    .map((k) => [k.kod, k])
                ).values()
              ).map((k) => (
                <option key={k.id} value={k.kod}>
                  {k.kod} - {k.aciklama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
