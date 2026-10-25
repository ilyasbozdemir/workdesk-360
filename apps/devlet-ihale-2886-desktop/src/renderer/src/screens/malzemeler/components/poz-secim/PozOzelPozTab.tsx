import React from 'react'
import { Sparkles } from 'lucide-react'
import { POZ_KURUMLARI } from '../pozKitaplari.data'

interface PozOzelPozTabProps {
  ozelPozKurum: string
  setOzelPozKurum: (val: string) => void
  ozelPozNo: string
  setOzelPozNo: (val: string) => void
  ozelPozAdi: string
  setOzelPozAdi: (val: string) => void
  ozelPozYili: number
  setOzelPozYili: (val: number) => void
  ozelFiyatDonemi: string
  setOzelFiyatDonemi: (val: string) => void
  ozelPozBirim: string
  setOzelPozBirim: (val: string) => void
  ozelOkasKodu: string
  setOzelOkasKodu: (val: string) => void
  ozelYapiSinifi: string
  setOzelYapiSinifi: (val: string) => void
  ozelAnalizTarifi: string
  setOzelAnalizTarifi: (val: string) => void
  ozelPozDinamikDonemler: { kod: string; etiket: string }[]
}

export const PozOzelPozTab: React.FC<PozOzelPozTabProps> = ({
  ozelPozKurum,
  setOzelPozKurum,
  ozelPozNo,
  setOzelPozNo,
  ozelPozAdi,
  setOzelPozAdi,
  ozelPozYili,
  setOzelPozYili,
  ozelFiyatDonemi,
  setOzelFiyatDonemi,
  ozelPozBirim,
  setOzelPozBirim,
  ozelOkasKodu,
  setOzelOkasKodu,
  ozelYapiSinifi,
  setOzelYapiSinifi,
  ozelAnalizTarifi,
  setOzelAnalizTarifi,
  ozelPozDinamikDonemler
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-3">
        <Sparkles className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <strong>Özel & Resmî Poz Tanımlama:</strong> Bakanlık kitaplarında yer almayan veya
          idarenizce özel analiz gerektiren yapım işleri için poz numarası, fiyat araştırma dönemi
          (yıl/dönem/ay) ve teknik tarif belirleyebilirsiniz.
        </div>
      </div>

      {/* 1. Satır: Kurum ve Poz No */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Kurum / Kitap Türü <span className="text-red-500">*</span>
          </label>
          <select
            value={ozelPozKurum}
            onChange={(e) => setOzelPozKurum(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {POZ_KURUMLARI.filter((k) => k.id !== 'ALL').map((k) => (
              <option key={k.id} value={k.name}>
                {k.badge} - {k.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Poz Numarası <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={ozelPozNo}
            onChange={(e) => setOzelPozNo(e.target.value)}
            placeholder="Örn: 15.150.1002 veya ÖZEL.01"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold">Hızlı Şablon:</span>
            {['ÖZEL.01', 'ÖZEL.YPM.01', 'İDARE.01', '15.150.1002', 'DSİ.01', 'KGM.01'].map(
              (tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setOzelPozNo(tag)}
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-900/40 dark:hover:text-amber-300 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 2. Satır: Poz / İmalat Tanımı ve Adı (Tam Genişlik) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Poz / İmalat Tanımı ve Adı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={ozelPozAdi}
          onChange={(e) => setOzelPozAdi(e.target.value)}
          placeholder="Örn: C 25/30 basınç dayanım sınıfında hazır beton dökülmesi veya Özel İmalat Ahşap Akustik Panel Kaplama..."
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* 3. Satır: Poz Yılı ve Fiyat Araştırma Dönemi (Yan yana!) + Ölçü Birimi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Poz / Fiyat Yılı <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={ozelPozYili}
            onChange={(e) => setOzelPozYili(Number(e.target.value) || new Date().getFullYear())}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Fiyat Araştırma Dönemi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            list="ozel-fiyat-donem-list"
            value={ozelFiyatDonemi}
            onChange={(e) => setOzelFiyatDonemi(e.target.value)}
            placeholder={`Örn: ${ozelPozYili}/1 veya ${ozelPozYili} Ocak`}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
          <datalist id="ozel-fiyat-donem-list">
            {ozelPozDinamikDonemler.map((d) => (
              <option key={d.kod} value={d.kod}>
                {d.etiket}
              </option>
            ))}
          </datalist>
          <span className="text-[10px] text-slate-400 mt-1 block">
            (1. Dönem: Yıl Başı / Ocak-Haziran, 2. Dönem: Temmuz-Aralık veya Ay bazlı)
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Ölçü Birimi <span className="text-red-500">*</span>
          </label>
          <select
            value={ozelPozBirim}
            onChange={(e) => setOzelPozBirim(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="m²">Metrekare (m²)</option>
            <option value="m³">Metreküp (m³)</option>
            <option value="mt">Metre / Metretül (mt)</option>
            <option value="ton">Ton (ton)</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="Adet">Adet (Adet)</option>
            <option value="Set">Set / Takım (Set)</option>
            <option value="Götürü">Götürü Bedel (Götürü)</option>
          </select>
        </div>
      </div>

      {/* 4. Satır: OKAS Kodu ve Yapı Sınıfı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            İlgili OKAS / CPV Kodu
          </label>
          <input
            type="text"
            value={ozelOkasKodu}
            onChange={(e) => setOzelOkasKodu(e.target.value)}
            placeholder="Örn: 45000000 (İnşaat İşleri)"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Yapı Sınıfı / İş Grubu
          </label>
          <input
            type="text"
            value={ozelYapiSinifi}
            onChange={(e) => setOzelYapiSinifi(e.target.value)}
            placeholder="Örn: III. Sınıf A Grubu Yapılar veya Genel Yapım İşleri"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* 5. Satır: Analiz Tarifi */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Analiz Tarifi & Teknik Şartname Açıklaması
        </label>
        <textarea
          value={ozelAnalizTarifi}
          onChange={(e) => setOzelAnalizTarifi(e.target.value)}
          placeholder="Pozun analiz içeriği, malzeme gereksinimleri, işçilik tarifleri ve piyasa rayiç araştırma esasları..."
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 min-h-22.5 resize-y"
        />
      </div>
    </div>
  )
}
