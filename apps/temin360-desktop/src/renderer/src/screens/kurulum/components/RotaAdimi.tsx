import React from 'react'
import { GitFork, ShieldCheck, Award } from 'lucide-react'
import { KurulumBirimItem, KurulumPersonelItem, KurulumRotaData } from '../types'

interface RotaAdimiProps {
  rota: KurulumRotaData
  birimler: KurulumBirimItem[]
  personeller: KurulumPersonelItem[]
  onChange: (rota: KurulumRotaData) => void
}

export const RotaAdimi: React.FC<RotaAdimiProps> = ({ rota, birimler, personeller, onChange }) => {
  const handleChange = (field: keyof KurulumRotaData, value: any) => {
    onChange({
      ...rota,
      [field]: value
    })
  }

  const harcamaAdaylari = personeller.filter(
    (p) => p.rol === 'harcama_yetkilisi' || p.unvan.toLowerCase().includes('başkan') || p.unvan.toLowerCase().includes('müdür')
  )
  const gerceklestirmeAdaylari = personeller.filter(
    (p) => p.rol === 'gerceklestirme_gorevlisi' || p.unvan.toLowerCase().includes('müdür') || p.unvan.toLowerCase().includes('şef')
  )
  const muhasebeAdaylari = personeller.filter(
    (p) => p.rol === 'muhasebe' || p.unvan.toLowerCase().includes('muhasebe') || p.unvan.toLowerCase().includes('mutemet')
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <GitFork className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          4. Adım: Belge Rota & Onay Yetkilileri Varsayılanları
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Yeni dosya açıldığında veya belge önizlendiğinde otomatik atanacak temel yetkilileri belirleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Harcama Yetkilisi */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
            <Award className="w-4 h-4 text-amber-600" />
            Varsayılan Harcama Yetkilisi
          </div>
          <p className="text-xs text-slate-500">
            Onay belgelerinde, görevlendirme olurunda ve sözleşmelerde imza açacak en üst harcama yetkilisi.
          </p>
          <select
            value={rota.varsayilanHarcamaYetkilisiId ?? ''}
            onChange={(e) => handleChange('varsayilanHarcamaYetkilisiId', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value="">-- Personel Seçiniz --</option>
            {(harcamaAdaylari.length > 0 ? harcamaAdaylari : personeller).map((p, idx) => (
              <option key={idx} value={p.adSoyad}>
                {p.adSoyad} ({p.unvan}) - {p.birim}
              </option>
            ))}
          </select>
        </div>

        {/* Gerçekleştirme Görevlisi */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Varsayılan Gerçekleştirme Görevlisi
          </div>
          <p className="text-xs text-slate-500">
            Dosyayı hazırlayan, harcama talimatını düzenleyen ve ödeme emrini paraf eden yetkili.
          </p>
          <select
            value={rota.varsayilanGerceklestirmeId ?? ''}
            onChange={(e) => handleChange('varsayilanGerceklestirmeId', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value="">-- Personel Seçiniz --</option>
            {(gerceklestirmeAdaylari.length > 0 ? gerceklestirmeAdaylari : personeller).map((p, idx) => (
              <option key={idx} value={p.adSoyad}>
                {p.adSoyad} ({p.unvan}) - {p.birim}
              </option>
            ))}
          </select>
        </div>

        {/* Muhasebe Yetkilisi / Mutemet */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-800 dark:text-purple-300">
            <span className="text-base">💰</span>
            Varsayılan Muhasebe Yetkilisi / Mutemet
          </div>
          <p className="text-xs text-slate-500">
            Harcama pusulası, avans kapatma ve MİF ödeme emirlerinde görev alacak muhasebe yetkilisi.
          </p>
          <select
            value={rota.varsayilanMuhasebeId ?? ''}
            onChange={(e) => handleChange('varsayilanMuhasebeId', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value="">-- Personel Seçiniz --</option>
            {(muhasebeAdaylari.length > 0 ? muhasebeAdaylari : personeller).map((p, idx) => (
              <option key={idx} value={p.adSoyad}>
                {p.adSoyad} ({p.unvan}) - {p.birim}
              </option>
            ))}
          </select>
        </div>

        {/* Varsayılan Harcama Birimi & Limit */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-300">
            <span className="text-base">🏢</span>
            Varsayılan İşlem Yapan Birim
          </div>
          <p className="text-xs text-slate-500">
            Sistemde yeni dosya açıldığında dosyanın otomatik bağlanacağı birim.
          </p>
          <select
            value={rota.varsayilanBirimAdi ?? ''}
            onChange={(e) => handleChange('varsayilanBirimAdi', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800 dark:text-slate-100"
          >
            <option value="">-- Birim Seçiniz --</option>
            {birimler.map((b, idx) => (
              <option key={idx} value={b.birimAdi}>
                {b.birimAdi}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
