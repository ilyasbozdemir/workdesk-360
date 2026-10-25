import React from 'react'
import { Filter, Search, Building2, PlusCircle, ExternalLink, CheckCircle2 } from 'lucide-react'
import { POZ_KURUMLARI, PozItem } from '../pozKitaplari.data'

interface PozKatalogTabProps {
  selectedKurum: string
  setSelectedKurum: (kurum: string) => void
  selectedYil: number
  setSelectedYil: (yil: number) => void
  selectedDonem: string
  setSelectedDonem: (donem: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  katalogDinamikDonemler: { kod: string; etiket: string }[]
  isLoading: boolean
  filteredPozlar: PozItem[]
  onSelectPozItem: (item: PozItem) => void
  onSwitchToOzelPoz: () => void
  onOpenPozlarScreen: () => void
}

export const PozKatalogTab: React.FC<PozKatalogTabProps> = ({
  selectedKurum,
  setSelectedKurum,
  selectedYil,
  setSelectedYil,
  selectedDonem,
  setSelectedDonem,
  searchQuery,
  setSearchQuery,
  katalogDinamikDonemler,
  isLoading,
  filteredPozlar,
  onSelectPozItem,
  onSwitchToOzelPoz,
  onOpenPozlarScreen
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Filtre ve Arama Alanı */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        {/* Kurumlar Yatay Filtre */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter size={12} /> Kurum:
          </span>
          {POZ_KURUMLARI.map((kurum) => (
            <button
              key={kurum.id}
              type="button"
              onClick={() => setSelectedKurum(kurum.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all border cursor-pointer ${
                selectedKurum === kurum.id
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
              }`}
            >
              {kurum.badge}
            </button>
          ))}
        </div>

        {/* Yıl, Fiyat Araştırma Dönemi ve Arama Inputu */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Poz / Fiyat Yılı
            </label>
            <input
              type="number"
              value={selectedYil}
              onChange={(e) => setSelectedYil(Number(e.target.value) || new Date().getFullYear())}
              placeholder="Yıl (Örn: 2026)"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Fiyat Araştırma Dönemi
            </label>
            <input
              type="text"
              list="katalog-fiyat-donem-list"
              value={selectedDonem}
              onChange={(e) => setSelectedDonem(e.target.value)}
              placeholder="Dönem (Örn: 2026/1)"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
            />
            <datalist id="katalog-fiyat-donem-list">
              {katalogDinamikDonemler.map((d) => (
                <option key={d.kod} value={d.kod}>
                  {d.etiket}
                </option>
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-6 relative">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Hızlı Filtrele & Ara
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={15}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Poz No, İmalat Adı veya OKAS Kodu Ara..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      {/* Poz Listesi */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Pozlar yükleniyor...</div>
        ) : filteredPozlar.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <Building2 size={40} className="opacity-30 text-amber-600" />
            <div className="space-y-1 max-w-md">
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Kayıtlı poz bulunamadı.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Resmî birim fiyat kitaplarından pozları eklemek için{' '}
                <strong>Birim Fiyat Pozları</strong> ekranını kullanabilir veya kitap dışı analizli
                özel poz tanımlayabilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={onSwitchToOzelPoz}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle size={14} /> Yeni Özel Poz Tanımla
              </button>
              <button
                type="button"
                onClick={onOpenPozlarScreen}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={14} /> Poz Yönetim Ekranı
              </button>
            </div>
          </div>
        ) : (
          filteredPozlar.map((item) => (
            <div
              key={item.id || item.poz_no}
              onClick={() => onSelectPozItem(item)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 bg-white dark:bg-slate-900/90 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-md"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700">
                    {item.poz_no}
                  </span>
                  {item.poz_kurumu && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.poz_kurumu}
                    </span>
                  )}
                  {item.yapi_sinifi && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {item.yapi_sinifi}
                    </span>
                  )}
                  {item.okas_kodu && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                      CPV: {item.okas_kodu}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-900 dark:group-hover:text-amber-300 line-clamp-2 leading-relaxed">
                  {item.kalem_adi || item.poz_tanimi}
                </p>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Birim</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">
                    {item.birim || 'm²'}
                  </span>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 group-hover:scale-105 cursor-pointer"
                >
                  <CheckCircle2 size={14} /> Seç
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
