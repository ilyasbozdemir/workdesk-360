import React from 'react'
import { Database } from 'lucide-react'
import { BIRIM_KATEGORILERI } from '../../olcubirimleri/olcubirimleri.hooks'
import type { Kalem } from '../malzemeler.hooks'

interface TeknikDetayCardProps {
  formData: Partial<Kalem>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Kalem>>>
  selectedType: 'Mal' | 'Hizmet' | 'Yapım'
  birimler: any[]
}

export const TeknikDetayCard: React.FC<TeknikDetayCardProps> = ({
  formData,
  setFormData,
  selectedType,
  birimler
}) => {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <Database className="text-blue-600 dark:text-blue-400" size={18} />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Ölçü Birimi & Teknik Özellikler
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Ölçü Birimi <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.birim || 'Adet'}
            onChange={(e) => {
              const val = e.target.value
              setFormData((prev) => ({
                ...prev,
                birim: val,
                olcu_birimi: val
              }))
            }}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* Türe Göre Önerilen Resmi Birimler */}
            {selectedType === 'Yapım' ? (
              <optgroup label="⭐ Yapım İşi İçin Sık Kullanılanlar">
                <option value="m²">Metrekare (m²)</option>
                <option value="m³">Metreküp (m³)</option>
                <option value="mt">Metretül / Metre (mt)</option>
                <option value="ton">Ton (ton)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="Adet">Adet (Adet)</option>
                <option value="Set">Set / Takım (Set)</option>
                <option value="Götürü">Götürü Bedel (Götürü)</option>
              </optgroup>
            ) : selectedType === 'Hizmet' ? (
              <optgroup label="⭐ Hizmet Alımı İçin Sık Kullanılanlar">
                <option value="kişi/ay">Kişi Başı Aylık (kişi/ay)</option>
                <option value="kişi/gün">Kişi Başı Günlük (kişi/gün)</option>
                <option value="kişi/saat">Kişi Başı Saatlik (kişi/saat)</option>
                <option value="Ay">Ay (Ay)</option>
                <option value="Gün">Gün (Gün)</option>
                <option value="Saat">Saat (saat)</option>
                <option value="Sefer">Sefer / Uçuş / Tur (Sefer)</option>
                <option value="Adet">Adet (Adet)</option>
                <option value="Götürü">Götürü Bedel (Götürü)</option>
              </optgroup>
            ) : (
              <optgroup label="⭐ Mal Alımı İçin Sık Kullanılanlar">
                <option value="Adet">Adet (Adet)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="lt">Litre (lt)</option>
                <option value="m">Metre (m)</option>
                <option value="m²">Metrekare (m²)</option>
                <option value="Paket">Paket (Paket)</option>
                <option value="Koli">Koli (Koli)</option>
                <option value="Kutu">Kutu (Kutu)</option>
                <option value="Takım">Takım / Set (Takım)</option>
                <option value="Ton">Ton (Ton)</option>
              </optgroup>
            )}

            {/* Veritabanı Ölçü Birimleri Havuzundan Kategorili Liste */}
            {BIRIM_KATEGORILERI.map((kategori) => {
              const categoryUnits = birimler.filter(
                (b) => b.aktif_mi && (b.kategori || 'Diğer') === kategori
              )
              if (categoryUnits.length === 0) return null
              return (
                <optgroup key={kategori} label={`📁 ${kategori}`}>
                  {categoryUnits.map((b) => {
                    const unitValue = b.kisa_ad || b.sembol || b.ad
                    const unitLabel =
                      b.kisa_ad && b.kisa_ad !== b.ad ? `${b.ad} (${b.kisa_ad})` : b.ad
                    return (
                      <option key={b.id} value={unitValue}>
                        {unitLabel}
                      </option>
                    )
                  })}
                </optgroup>
              )
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Menşei / Üretim
          </label>
          <select
            value={formData.mensei || 'Yerli'}
            onChange={(e) => {
              const val = e.target.value
              setFormData((prev) => ({ ...prev, mensei: val }))
            }}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Yerli">🇹🇷 Yerli Malı</option>
            <option value="İthal">🌍 İthal Ürün / Yabancı</option>
            <option value="">(Belirtilmemiş)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Özelliği / Teknik Şartname & Poz Açıklaması
        </label>
        <textarea
          value={formData.ozelligi || formData.poz_tanimi || ''}
          onChange={(e) => {
            const val = e.target.value
            setFormData((prev) => ({
              ...prev,
              ozelligi: val,
              poz_tanimi: val
            }))
          }}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px] resize-y"
          placeholder="Teknik detaylar, marka/model gereksinimleri veya işçilik tarifleri..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          Notlar / Açıklama (İç Kullanım)
        </label>
        <input
          type="text"
          value={formData.notlar || ''}
          onChange={(e) => {
            const val = e.target.value
            setFormData((prev) => ({ ...prev, notlar: val }))
          }}
          placeholder="Satın alma birimi için iç notlar..."
          className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
        />
      </div>
    </div>
  )
}
