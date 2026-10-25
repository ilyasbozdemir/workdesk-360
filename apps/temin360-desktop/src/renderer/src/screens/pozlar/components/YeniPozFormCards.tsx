import React from 'react'
import {
  BookOpen,
  Building2,
  Check,
  DollarSign,
  FileText,
  Layers,
  Link2,
  Plus,
  Trash2
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../utils/cn'
import { PozItem, PozFiyatGecmisi } from '../pozlar.hooks'
import { POZ_KURUMLARI } from '../../malzemeler/components/pozKitaplari.data'
import { OLCU_BIRIMLERI_LIST, POZ_TIPLERI, YAPI_SINIFLARI_LIST } from '../yeni.constants'

interface YeniPozFormCardsProps {
  formData: Partial<PozItem>
  setFormData: React.Dispatch<React.SetStateAction<Partial<PozItem>>>
  fiyatListesi: PozFiyatGecmisi[]
  aktifFasikuller: string[]
  handleKurumPrefix: (prefix: string, kurumId: string) => void
  handleAddFiyatRow: () => void
  handleUpdateFiyatRow: (index: number, field: keyof PozFiyatGecmisi, value: any) => void
  handleDeleteFiyatRow: (index: number) => void
}

export function YeniPozFormCards({
  formData,
  setFormData,
  fiyatListesi,
  aktifFasikuller,
  handleKurumPrefix,
  handleAddFiyatRow,
  handleUpdateFiyatRow,
  handleDeleteFiyatRow
}: YeniPozFormCardsProps): React.JSX.Element {
  return (
    <div className="lg:col-span-7 space-y-6">
      {/* Kart 1: Poz No, Eski Poz No & Kurum Bilgileri */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Temel Poz, Kurum & Fasikül Bilgileri
            </h2>
            <p className="text-[11px] text-slate-500">
              Yeni poz no, eski poz no ilişkisi, yayımlayan kurum ve fasikül seçimi
            </p>
          </div>
        </div>

        {/* Hızlı Kurum Seçicisi */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Resmî Bakanlık / İdare Birim Fiyat Kitabı <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {POZ_KURUMLARI.filter((k) => k.id !== 'ALL').map((kurum) => {
              const isSelected = (formData.poz_kurumu || formData.kategori) === kurum.id
              return (
                <button
                  key={kurum.id}
                  type="button"
                  onClick={() =>
                    handleKurumPrefix(
                      kurum.id === 'ÇŞB'
                        ? '15.'
                        : kurum.id === 'KGM'
                          ? '04.'
                          : kurum.id === 'DSİ'
                            ? '07.'
                            : kurum.id === 'İLBANK'
                              ? '18.'
                              : 'ÖZEL.',
                      kurum.id
                    )
                  }
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer',
                    isSelected
                      ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">{kurum.badge}</span>
                    {isSelected && <Check size={14} className="text-amber-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {kurum.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Poz No & Eski Poz No */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Yeni Poz No <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-amber-600 font-mono font-bold">2019+ Formatı</span>
            </div>
            <input
              type="text"
              value={formData.poz_no || ''}
              onChange={(e) => setFormData({ ...formData, poz_no: e.target.value })}
              placeholder="Örn: 15.110.1001"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div className="sm:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Link2 size={13} className="text-blue-500" />
                <span>Eski Poz No / Dönüşen Kod</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">2018 Öncesi</span>
            </div>
            <input
              type="text"
              value={formData.eski_poz_no || ''}
              onChange={(e) => setFormData({ ...formData, eski_poz_no: e.target.value })}
              placeholder="Örn: 14.040/1"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Bulunduğu Kitap / Fasikül ve Poz Tipi */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-7 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen size={13} className="text-slate-400" />
              <span>Bulunduğu Kitap & Fasikül</span>
            </label>
            <input
              type="text"
              list="fasikul-datalist"
              value={formData.fasikul || ''}
              onChange={(e) => setFormData({ ...formData, fasikul: e.target.value })}
              placeholder="Örn: Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            <datalist id="fasikul-datalist">
              {aktifFasikuller.map((fas, i) => (
                <option key={i} value={fas} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers size={13} className="text-slate-400" />
              <span>Pozun Tipi</span>
            </label>
            <select
              value={formData.poz_tipi || 'Analiz'}
              onChange={(e) => setFormData({ ...formData, poz_tipi: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              {POZ_TIPLERI.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ad}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ölçü Birimi, Bülten Yılı & KDV */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Ölçü Birimi <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.birim || 'm³'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  birim: e.target.value,
                  olcu_birimi: e.target.value
                })
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              {OLCU_BIRIMLERI_LIST.map((b) => (
                <option key={b.kod} value={b.kod}>
                  {b.ad}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Poz / Bülten Yılı
            </label>
            <select
              value={formData.poz_yili || new Date().getFullYear()}
              onChange={(e) => {
                const yil = Number(e.target.value) || new Date().getFullYear()
                setFormData((prev) => ({
                  ...prev,
                  poz_yili: yil
                }))
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="2026">2026 Yılı</option>
              <option value="2025">2025 Yılı</option>
              <option value="2024">2024 Yılı</option>
              <option value="2023">2023 Yılı</option>
              <option value="2022">2022 Yılı</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              KDV Oranı (%)
            </label>
            <select
              value={formData.kdv_orani ?? 20}
              onChange={(e) => setFormData({ ...formData, kdv_orani: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value={20}>%20 KDV</option>
              <option value={10}>%10 KDV</option>
              <option value={1}>%1 KDV</option>
              <option value={0}>%0 (Muaf)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kart 2: İmalat Tanımı ve Uzun Tanım (Teknik Şartname) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              2. İmalat Tanımı & Uzun Teknik Tarifi
            </h2>
            <p className="text-[11px] text-slate-500">
              Resmî kısa tanım, teknik tarif şartname metni ve özel notlar
            </p>
          </div>
        </div>

        {/* Kısa Tanım */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Tanım (Kısa Başlık / İmalat Adı) <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={formData.kalem_adi || formData.poz_tanimi || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                kalem_adi: e.target.value,
                poz_tanimi: e.target.value
              })
            }
            placeholder="Örn: Her cins zeminde el ile yapılan (geniş-dar) derin kazılarda derinlik zammı..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        {/* Uzun Tanım */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Uzun Tanım (Teknik Şartname & Kapsam Metni)
          </label>
          <textarea
            value={formData.ozelligi || ''}
            onChange={(e) => setFormData({ ...formData, ozelligi: e.target.value })}
            rows={4}
            placeholder="Her cins zeminde el ile yapılan (geniş-dar) derin kazılara derinlik zammı (iksasız kazılarda) F=103,125 x H -206,25 (%25 yüklenici kârı ve genel giderler dahil)..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Yapı Sınıfı & OKAS Kodu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Yapı Sınıfı
            </label>
            <select
              value={formData.yapi_sinifi || 'Genel Yapım İşleri'}
              onChange={(e) => setFormData({ ...formData, yapi_sinifi: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              {YAPI_SINIFLARI_LIST.map((ys) => (
                <option key={ys} value={ys}>
                  {ys}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              OKAS / CPV Kodu
            </label>
            <input
              type="text"
              value={formData.okas_kodu || ''}
              onChange={(e) => setFormData({ ...formData, okas_kodu: e.target.value })}
              placeholder="Örn: 45000000"
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Kart 3: Dönemsel Birim Fiyatlar Tablosu & Fiyat Geçmişi */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Dönemsel Birim Fiyatlar & Fiyat Geçmişi
              </h2>
              <p className="text-[11px] text-slate-500">
                Bakanlık/İdare bülten dönemlerine göre birim fiyatları (TL) girin
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddFiyatRow}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs py-1.5 px-3"
          >
            <Plus size={14} />
            <span>Dönem / Fiyat Ekle</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-2.5 pl-3">Birim Fiyat Tarihi / Dönemi</th>
                <th className="p-2.5">Birim Fiyatı (TL)</th>
                <th className="p-2.5 text-right pr-3">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fiyatListesi.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2.5 pl-3">
                    <input
                      type="text"
                      value={row.donem}
                      onChange={(e) => handleUpdateFiyatRow(idx, 'donem', e.target.value)}
                      placeholder="Örn: 2026/1"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-2.5">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={row.fiyat || ''}
                        onChange={(e) => handleUpdateFiyatRow(idx, 'fiyat', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2.5 py-1.5 pr-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                        ₺
                      </span>
                    </div>
                  </td>
                  <td className="p-2.5 text-right pr-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteFiyatRow(idx)}
                      disabled={fiyatListesi.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-20 cursor-pointer"
                      title="Satırı Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
