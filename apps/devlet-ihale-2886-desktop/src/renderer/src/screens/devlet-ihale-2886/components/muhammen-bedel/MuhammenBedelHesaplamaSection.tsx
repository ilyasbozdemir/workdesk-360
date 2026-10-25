import React from 'react'
import { Calculator, FileCheck, Percent, CheckCircle } from 'lucide-react'
import {
  MuhammenBedelHesabi,
  IslemTuru2886,
  TasinmazBilgisi
} from '../../types/devletIhale2886.types'

interface MuhammenBedelHesaplamaSectionProps {
  hesap: MuhammenBedelHesabi
  setHesap: React.Dispatch<React.SetStateAction<MuhammenBedelHesabi>>
  islemTuru: IslemTuru2886
  tasinmaz: TasinmazBilgisi
  emsalOrtalama: number
  formatMoney: (n: number) => string
  onBirimFiyatChange: (val: number) => void
  onTakdirBedelChange: (val: number) => void
  onTeminatOraniChange: (oran: number) => void
  onOpenTutanakModal: () => void
}

export const MuhammenBedelHesaplamaSection: React.FC<MuhammenBedelHesaplamaSectionProps> = ({
  hesap,
  setHesap,
  islemTuru,
  tasinmaz,
  emsalOrtalama,
  formatMoney,
  onBirimFiyatChange,
  onTakdirBedelChange,
  onTeminatOraniChange,
  onOpenTutanakModal
}) => {
  return (
    <div className="bg-linear-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-xs font-bold text-blue-950 dark:text-blue-100 uppercase tracking-wider">
              Muhammen Bedel & İhale Katılım Teminatı Hesabı
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              2886 sayılı Kanun Md. 9 (Kıymet Takdiri) ve Md. 25 (Geçici Teminat)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">Karar No:</span>
            <input
              type="text"
              placeholder="2026/KTK-01"
              value={hesap.kararNo}
              onChange={(e) => setHesap({ ...hesap, kararNo: e.target.value })}
              className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold"
            />
          </div>
          <button
            type="button"
            onClick={onOpenTutanakModal}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Karar Tutanağı</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {/* Birim m2 */}
        <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              Birim m² Rayici{' '}
              {islemTuru === 'kiralama'
                ? '(Aylık/Yıllık)'
                : islemTuru === 'irtifak'
                  ? '(Yıllık)'
                  : ''}
            </span>
            <Percent className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-center">
            <span className="text-slate-400 font-bold mr-1">₺</span>
            <input
              type="number"
              placeholder="0"
              value={hesap.birimFiyatM2 || ''}
              onChange={(e) => onBirimFiyatChange(Number(e.target.value) || 0)}
              className="w-full font-mono font-bold text-slate-800 dark:text-slate-100 text-base bg-transparent focus:outline-hidden"
            />
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {emsalOrtalama > 0
              ? `Emsal Ort: ₺${formatMoney(emsalOrtalama)}`
              : 'Komisyon birim rayici'}
          </span>
        </div>

        {/* Hesaplanan Değer */}
        <div className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">
            Hesaplanan Değer (m² x Rayiç)
          </span>
          <div className="mt-1.5 font-mono font-bold text-slate-700 dark:text-slate-200 text-base">
            ₺{formatMoney(hesap.hesaplananBedel)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {tasinmaz.yuzolcumuM2} m² toplam alan karşılığı
          </span>
        </div>

        {/* Takdir Edilen Muhammen Bedel */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-blue-500 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              Takdir Edilen Muhammen Bedel
            </span>
            <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-blue-600 font-bold mr-1">₺</span>
            <input
              type="number"
              placeholder="0"
              value={hesap.takdirEdilenMuhammenBedel || ''}
              onChange={(e) => onTakdirBedelChange(Number(e.target.value) || 0)}
              className="w-full font-mono font-extrabold text-blue-700 dark:text-blue-300 text-lg bg-transparent focus:outline-hidden"
            />
          </div>
          <span className="text-[10px] text-blue-500 block mt-0.5">
            İhale asgari açılış taban fiyatı
          </span>
        </div>

        {/* Geçici Teminat */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              Geçici Teminat (%{hesap.geciciTeminatOrani})
            </span>
            <div className="flex gap-1">
              {[3, 5, 10].map((oran) => (
                <button
                  key={oran}
                  type="button"
                  onClick={() => onTeminatOraniChange(oran)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    hesap.geciciTeminatOrani === oran
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  %{oran}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 font-mono font-extrabold text-emerald-800 dark:text-emerald-200 text-lg">
            ₺{formatMoney(hesap.geciciTeminatTutari)}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
            2886 Md. 25 uyarınca katılım şartı
          </span>
        </div>
      </div>
    </div>
  )
}
