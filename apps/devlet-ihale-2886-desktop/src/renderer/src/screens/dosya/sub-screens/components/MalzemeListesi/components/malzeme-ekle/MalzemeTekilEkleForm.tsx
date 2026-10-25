import React from 'react'
import { Plus, Sparkles } from 'lucide-react'

interface MalzemeTekilEkleFormProps {
  isYapim: boolean
  isHizmet: boolean
  isAiConfigured: boolean
  aiLoading: boolean
  kalemAdi: string
  setKalemAdi: (val: string) => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  showSuggestions: boolean
  setShowSuggestions: (val: boolean) => void
  filteredSuggestions: any[]
  handleSelectSuggestion: (item: any) => void
  tipi: string
  setTipi: (val: string) => void
  birim: string
  setBirim: (val: string) => void
  units: { ad: string }[]
  miktar: number
  setMiktar: (val: number) => void
  kdvOrani: number
  setKdvOrani: (val: number) => void
  tasinirKodu: string
  setTasinirKodu: (val: string) => void
  okasKodu: string
  setOkasKodu: (val: string) => void
  aciklama: string
  setAciklama: (val: string) => void
  handleAiAçiklama: () => void
  handleAddItem: (e: React.FormEvent) => void
  onClose: () => void
}

export const MalzemeTekilEkleForm: React.FC<MalzemeTekilEkleFormProps> = ({
  isYapim,
  isHizmet,
  isAiConfigured,
  aiLoading,
  kalemAdi,
  setKalemAdi,
  searchQuery,
  setSearchQuery,
  showSuggestions,
  setShowSuggestions,
  filteredSuggestions,
  handleSelectSuggestion,
  tipi,
  setTipi,
  birim,
  setBirim,
  units,
  miktar,
  setMiktar,
  kdvOrani,
  setKdvOrani,
  tasinirKodu,
  setTasinirKodu,
  okasKodu,
  setOkasKodu,
  aciklama,
  setAciklama,
  handleAiAçiklama,
  handleAddItem,
  onClose
}) => {
  return (
    <form onSubmit={handleAddItem} className="space-y-4">
      {/* Kalem Arama / Autocomplete */}
      <div className="relative">
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          {isYapim
            ? 'İmalat / İş Kalemi (Poz Tanımı)'
            : isHizmet
              ? 'Hizmet Tanımı / Alım Konusu'
              : 'Malzeme / Ürün Adı'}{' '}
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setKalemAdi(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={
            isYapim
              ? 'Örn: İç Cephe Alçı Sıva Tamiratı ve Silikonlu Boya Yapılması'
              : isHizmet
                ? 'Örn: Split Klimalar Periyodik Bakım ve Soğutucu Gaz Dolumu'
                : 'Örn: A4 80 gr/m² Fotokopi Kağıdı'
          }
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100 font-bold transition-all"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
            {filteredSuggestions.map((item: any) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs text-slate-700 dark:text-slate-200 font-semibold transition-colors flex flex-col cursor-pointer"
              >
                <span>{item.kalem_adi}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Tip: {item.tipi} | Birim: {item.birim} | KDV: %{item.kdv_orani}{' '}
                  {item.tasinir_kodu
                    ? isYapim
                      ? `| Poz No: ${item.tasinir_kodu}`
                      : `| Taşınır: ${item.tasinir_kodu}`
                    : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Türü & Birimi & Miktar & KDV - 4 Kolon Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Kalem Türü
          </label>
          <select
            value={tipi}
            onChange={(e) => setTipi(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
          >
            <option value="Yapım">Yapım İşi</option>
            <option value="Mal">Mal Alımı</option>
            <option value="Hizmet">Hizmet Alımı</option>
            <option value="Danışmanlık">Danışmanlık Alımı</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Ölçü Birimi
          </label>
          <select
            value={birim}
            onChange={(e) => setBirim(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
          >
            {units.map((u: { ad: string }, idx: number) => (
              <option key={idx} value={u.ad}>
                {u.ad}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Miktar <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            required
            min="0.01"
            value={miktar}
            onChange={(e) => setMiktar(parseFloat(e.target.value) || 1)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 font-black"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            KDV Oranı (%)
          </label>
          <select
            value={kdvOrani}
            onChange={(e) => setKdvOrani(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
          >
            <option value="0">%0</option>
            <option value="1">%1</option>
            <option value="10">%10</option>
            <option value="20">%20</option>
          </select>
        </div>
      </div>

      {/* Taşınır & OKAS Kodları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            {isYapim
              ? 'Bakanlık / ÇŞB Poz No'
              : isHizmet
                ? 'Hizmet / Faaliyet Kodu'
                : 'Taşınır Kodu'}
          </label>
          <input
            type="text"
            value={tasinirKodu}
            onChange={(e) => setTasinirKodu(e.target.value)}
            placeholder={
              isYapim
                ? 'Örn: 15.120.1001 veya Y.25.001/01'
                : isHizmet
                  ? 'Örn: HZM-01 veya 50730000-1'
                  : 'Örn: 150.01.01.01'
            }
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-800 dark:text-slate-100 font-mono"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            OKAS Kodu
          </label>
          <input
            type="text"
            value={okasKodu}
            onChange={(e) => setOkasKodu(e.target.value)}
            placeholder="Örn: 45442110-1"
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-800 dark:text-slate-100 font-mono"
          />
        </div>
      </div>

      {/* Açıklama & AI Öneri */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {isYapim
              ? 'İmalat & Poz Tarifi / Şartname'
              : isHizmet
                ? 'Hizmet Şartnamesi & Kapsamı'
                : 'Teknik Şartname / Açıklama'}
          </label>
          {isAiConfigured && (
            <button
              type="button"
              onClick={handleAiAçiklama}
              disabled={(!kalemAdi && !searchQuery) || aiLoading}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
              {aiLoading
                ? 'AI Üretiyor...'
                : isYapim
                  ? 'AI Poz & İmalat Tarifi'
                  : isHizmet
                    ? 'AI Hizmet Şartnamesi'
                    : 'AI Şartname Önerisi'}
            </button>
          )}
        </div>
        <textarea
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder={
            isYapim
              ? 'İmalatın uygulama şartları, kullanılacak malzeme standartları (TSE/CE), montaj ve işçilik detayları...'
              : isHizmet
                ? 'Hizmetin kapsamı, çalışma periyotları, personel/araç yeterlilikleri ve kabul kriterleri...'
                : 'Malzemenin teknik özellikleri, marka/model, standartlar veya ambalaj bilgileri...'
          }
          rows={3}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Butonlar */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          İptal
        </button>
        <button
          type="submit"
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {isYapim
            ? 'Pozu Kaydet ve Dosyaya Ekle'
            : isHizmet
              ? 'Hizmeti Kaydet ve Dosyaya Ekle'
              : 'Kaydet ve Dosyaya Ekle'}
        </button>
      </div>
    </form>
  )
}
