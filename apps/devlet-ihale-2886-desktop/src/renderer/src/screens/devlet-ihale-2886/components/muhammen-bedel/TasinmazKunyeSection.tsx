import React from 'react'
import { Building, Calendar } from 'lucide-react'
import { TasinmazBilgisi, IslemTuru2886 } from '../../types/devletIhale2886.types'

interface TasinmazKunyeSectionProps {
  tasinmaz: TasinmazBilgisi
  setTasinmaz: React.Dispatch<React.SetStateAction<TasinmazBilgisi>>
  islemTuru: IslemTuru2886
  onYuzolcumuChange: (m2: number) => void
  kiralamaSuresiYil: number
  setKiralamaSuresiYil: (val: number) => void
  irtifakSuresiYil: number
  setIrtifakSuresiYil: (val: number) => void
  hasilatPayiOrani: number
  setHasilatPayiOrani: (val: number) => void
  trampaVerilenBedel: number
  setTrampaVerilenBedel: (val: number) => void
  trampaAlinanBedel: number
  setTrampaAlinanBedel: (val: number) => void
  formatMoney: (n: number) => string
}

const cinsiPresets = [
  'Arsa (Ticari İmarlı)',
  'Arsa (Konut İmarlı)',
  'Tarla / Arazi',
  'Dükkan / İşyeri',
  'Büro / Ofis',
  'Depo / Antrepo',
  'Lojman / Konut',
  'Kafeterya / Büfe',
  'Otopark Alanı'
]

export const TasinmazKunyeSection: React.FC<TasinmazKunyeSectionProps> = ({
  tasinmaz,
  setTasinmaz,
  islemTuru,
  onYuzolcumuChange,
  kiralamaSuresiYil,
  setKiralamaSuresiYil,
  irtifakSuresiYil,
  setIrtifakSuresiYil,
  hasilatPayiOrani,
  setHasilatPayiOrani,
  trampaVerilenBedel,
  setTrampaVerilenBedel,
  trampaAlinanBedel,
  setTrampaAlinanBedel,
  formatMoney
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-500" />
          1. Taşınmaz / Mal Bilgileri ve Tapu Kaydı
        </h3>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {islemTuru === 'satis' && '🏷️ Mülkiyet Satışı'}
          {islemTuru === 'kiralama' && '🏢 Kiralama İşlemi'}
          {islemTuru === 'irtifak' && '📜 İrtifak / Üst Hakkı'}
          {islemTuru === 'irtifak_intifa' && '📜 İrtifak / İntifa'}
          {islemTuru === 'trampa' && '🔄 Trampa (Takas)'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="text-[11px] font-semibold text-slate-500">İl</label>
          <input
            type="text"
            placeholder="İl giriniz..."
            value={tasinmaz.il}
            onChange={(e) => setTasinmaz({ ...tasinmaz, il: e.target.value })}
            className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500">İlçe</label>
          <input
            type="text"
            placeholder="İlçe giriniz..."
            value={tasinmaz.ilce}
            onChange={(e) => setTasinmaz({ ...tasinmaz, ilce: e.target.value })}
            className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500">Mahalle / Köy</label>
          <input
            type="text"
            placeholder="Mahalle veya köy..."
            value={tasinmaz.mahalleKoy}
            onChange={(e) => setTasinmaz({ ...tasinmaz, mahalleKoy: e.target.value })}
            className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500">Ada / Parsel</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Ada"
              value={tasinmaz.ada}
              onChange={(e) => setTasinmaz({ ...tasinmaz, ada: e.target.value })}
              className="w-1/2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            />
            <input
              type="text"
              placeholder="Parsel"
              value={tasinmaz.parsel}
              onChange={(e) => setTasinmaz({ ...tasinmaz, parsel: e.target.value })}
              className="w-1/2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500">Yüzölçümü (m²)</label>
          <input
            type="number"
            placeholder="0"
            value={tasinmaz.yuzolcumuM2 || ''}
            onChange={(e) => onYuzolcumuChange(Number(e.target.value) || 0)}
            className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-blue-600 dark:text-blue-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Cinsi & Nitelik</span>
            <span className="text-[10px] text-slate-400">Hızlı seçim aşağıda</span>
          </label>
          <input
            type="text"
            placeholder="Taşınmaz cinsi (Örn: Arsa, Dükkan, Tarla)..."
            value={tasinmaz.cinsi}
            onChange={(e) => setTasinmaz({ ...tasinmaz, cinsi: e.target.value })}
            className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {cinsiPresets.slice(0, 5).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTasinmaz({ ...tasinmaz, cinsi: preset })}
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500">Hisse / Mevcut Durum</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              placeholder="Hisse (1/1)"
              value={tasinmaz.hisseOrani}
              onChange={(e) => setTasinmaz({ ...tasinmaz, hisseOrani: e.target.value })}
              className="w-1/2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            />
            <select
              value={tasinmaz.mevcutDurumu}
              onChange={(e) => setTasinmaz({ ...tasinmaz, mevcutDurumu: e.target.value })}
              className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            >
              <option value="Boş">Boş</option>
              <option value="Kirada">Kirada</option>
              <option value="İşgalli / Ecrimisilli">İşgalli</option>
              <option value="Tahsisli">Tahsisli</option>
            </select>
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="text-[11px] font-semibold text-slate-500">Adres / Konum Detayı</label>
          <input
            type="text"
            placeholder="Açık adres / mevkii bilgisi..."
            value={tasinmaz.adres}
            onChange={(e) => setTasinmaz({ ...tasinmaz, adres: e.target.value })}
            className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* İşlem Türüne Özel Ek Parametreler */}
      {islemTuru === 'kiralama' && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Kiralama Süresi:</span>
              <select
                value={kiralamaSuresiYil}
                onChange={(e) => setKiralamaSuresiYil(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg font-bold text-amber-700 dark:text-amber-300"
              >
                <option value={1}>1 Yıl (Standart)</option>
                <option value={3}>3 Yıl (Azami Genel İdare Yetkisi)</option>
                <option value={5}>5 Yıl (Meclis/Bakanlık İzni Gerekir)</option>
                <option value={10}>10 Yıl (Özel Tesis / Yatırım Şartlı)</option>
              </select>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              ⚠️ 2886 Md. 64: 3 yıldan fazla süreli kiralamalarda yetkili organ onayı zorunludur.
            </p>
          </div>
        </div>
      )}

      {islemTuru === 'irtifak' && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                İrtifak / Üst Hakkı Süresi (Yıl)
              </label>
              <input
                type="number"
                value={irtifakSuresiYil}
                onChange={(e) => setIrtifakSuresiYil(Number(e.target.value) || 0)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Yıllık Hasılat Payı Oranı (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={hasilatPayiOrani}
                onChange={(e) => setHasilatPayiOrani(Number(e.target.value) || 0)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {islemTuru === 'trampa' && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-purple-900 dark:text-purple-300">
                İdare Taşınmazı Rayici (₺)
              </label>
              <input
                type="number"
                value={trampaVerilenBedel}
                onChange={(e) => setTrampaVerilenBedel(Number(e.target.value) || 0)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-purple-900 dark:text-purple-300">
                Alınacak Taşınmaz Rayici (₺)
              </label>
              <input
                type="number"
                value={trampaAlinanBedel}
                onChange={(e) => setTrampaAlinanBedel(Number(e.target.value) || 0)}
                className="w-full mt-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg font-bold font-mono"
              />
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-300 dark:border-purple-700 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-medium">Denkleştirme Farkı:</span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">
                {trampaAlinanBedel >= trampaVerilenBedel
                  ? `+₺${formatMoney(trampaAlinanBedel - trampaVerilenBedel)} (İdare Lehine)`
                  : `-₺${formatMoney(trampaVerilenBedel - trampaAlinanBedel)} (İdare Öder)`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
