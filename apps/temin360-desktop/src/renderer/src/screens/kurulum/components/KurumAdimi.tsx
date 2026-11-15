import React from 'react'
import { Building2, Shield, MapPin, Landmark, Sparkles } from 'lucide-react'
import { KurulumKurumData } from '../types'

interface KurumAdimiProps {
  data: KurulumKurumData
  onChange: (data: KurulumKurumData) => void
}

export const KurumAdimi: React.FC<KurumAdimiProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof KurulumKurumData, value: string) => {
    onChange({
      ...data,
      [field]: value
    })
  }

  const handleFillSample = () => {
    onChange({
      kurumAdi: 'KADIKÖY BELEDİYE BAŞKANLIĞI',
      ustKurumAdi: 'T.C. İÇİŞLERİ BAKANLIĞI',
      il: 'İSTANBUL',
      ilce: 'KADIKÖY',
      makamAdi: 'BAŞKANLIK MAKAMINA',
      detsisNo: '934.01',
      harcamaBirimAdi: 'Destek Hizmetleri Müdürlüğü'
    })
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            1. Adım: Kurum ve Antet Bilgileri
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Resmî yazışma antetlerinde ve belgelerde yer alacak kurum kimlik bilgilerinizi tanımlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={handleFillSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Örnek Veri ile Doldur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kurum Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.kurumAdi}
              onChange={(e) => handleChange('kurumAdi', e.target.value)}
              placeholder="Örn: KADIKÖY BELEDİYE BAŞKANLIĞI"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Üst İdari Kurum (Varsa)
            </label>
            <input
              type="text"
              value={data.ustKurumAdi}
              onChange={(e) => handleChange('ustKurumAdi', e.target.value)}
              placeholder="Örn: T.C. İÇİŞLERİ BAKANLIĞI veya İSTANBUL VALİLİĞİ"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> İl
              </label>
              <input
                type="text"
                value={data.il}
                onChange={(e) => handleChange('il', e.target.value)}
                placeholder="Örn: İSTANBUL"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                İlçe
              </label>
              <input
                type="text"
                value={data.ilce}
                onChange={(e) => handleChange('ilce', e.target.value)}
                placeholder="Örn: KADIKÖY"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-slate-400" /> Ana Harcama Birimi
            </label>
            <input
              type="text"
              value={data.harcamaBirimAdi}
              onChange={(e) => handleChange('harcamaBirimAdi', e.target.value)}
              placeholder="Örn: Destek Hizmetleri Müdürlüğü"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Sunum / Makam Adı
            </label>
            <input
              type="text"
              value={data.makamAdi}
              onChange={(e) => handleChange('makamAdi', e.target.value)}
              placeholder="Örn: BAŞKANLIK MAKAMINA veya HARCAMA YETKİLİSİ MAKAMINA"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> DETSİS / Dosya Kodu
            </label>
            <input
              type="text"
              value={data.detsisNo}
              onChange={(e) => handleChange('detsisNo', e.target.value)}
              placeholder="Örn: 934.01 veya 10234521"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Live Antet Preview Card */}
      <div className="mt-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/20 dark:from-slate-900/80 dark:to-blue-950/20">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Resmî Yazışma Yönetmeliği Antet Canlı Görünümü
        </div>
        <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-center font-serif shadow-sm">
          <div className="text-xs text-slate-600 dark:text-slate-300 font-bold tracking-widest">T.C.</div>
          {data.ustKurumAdi && (
            <div className="text-xs text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider">
              {data.ustKurumAdi}
            </div>
          )}
          <div className="text-sm text-slate-900 dark:text-white font-bold uppercase tracking-wide">
            {data.kurumAdi || 'KURUM ADI'}
          </div>
          {data.harcamaBirimAdi && (
            <div className="text-xs text-slate-600 dark:text-slate-400 italic mt-0.5">
              {data.harcamaBirimAdi}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
