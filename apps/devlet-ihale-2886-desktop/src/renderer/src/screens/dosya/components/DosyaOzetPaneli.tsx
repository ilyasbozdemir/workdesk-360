import React from 'react'
import { Link } from '@tanstack/react-router'
import { TrendingUp, Layers, Users, ClipboardList, Gavel, ChevronRight } from 'lucide-react'
import { DosyaNotlariWidget } from '../../notlar/components/DosyaNotlariWidget'

interface DosyaOzetPaneliProps {
  dosyaData: any
  birimAdi: string
  kalemler: any[]
  firmalar: any[]
  activeDosyaId: number | null
  formatMoney: (val: number | null | undefined) => string
  getAsamaLabel: (asamaId: number) => string
}

export const DosyaOzetPaneli: React.FC<DosyaOzetPaneliProps> = ({
  dosyaData,
  birimAdi,
  kalemler,
  firmalar,
  activeDosyaId,
  formatMoney,
  getAsamaLabel
}) => {
  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Yaklaşık Maliyet
            </span>
            <span className="text-lg font-black text-slate-855 dark:text-slate-100 font-mono">
              ₺{formatMoney(dosyaData.yaklasik_maliyet)}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Kalem Sayısı
            </span>
            <span className="text-lg font-black text-slate-855 dark:text-slate-100 font-mono">
              {kalemler.length} adet
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 dark:bg-purple-955/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Teklif Sunan İstekliler
            </span>
            <span className="text-lg font-black text-slate-855 dark:text-slate-100 font-mono">
              {firmalar.length} firma
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Dosya Aşaması
            </span>
            <span className="text-xs font-extrabold text-slate-855 dark:text-slate-150 truncate block">
              {getAsamaLabel(dosyaData.durum_asama_id)}
            </span>
          </div>
        </div>
      </div>

      {/* Detay Panelleri Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Taraf: İdari Bilgiler ve Adımlar */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Bilgi Kartı */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              🏢 İdari Bilgiler & Bütçe
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-550">Talep Eden Birim:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {birimAdi || 'Belirtilmemiş'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-550">Bütçe Yılı:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {dosyaData.butce_yili || 'Belirtilmemiş'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-550">Alım Türü:</span>
                <span className="font-bold uppercase text-slate-855 dark:text-slate-200">
                  {dosyaData.tur === 'mal'
                    ? 'Mal Alımı'
                    : dosyaData.tur === 'hizmet'
                      ? 'Hizmet Alımı'
                      : 'Yapım İşi'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-550">İhale Usulü:</span>
                <span
                  className={`font-mono px-2.5 py-0.5 rounded-lg border text-xs font-bold tracking-tight flex items-center gap-1.5 ${
                    (dosyaData.ihale_tipi || '').toLowerCase().includes('açık') ||
                    (dosyaData.ihale_tipi || '').toLowerCase().includes('ihale') ||
                    (dosyaData.ihale_tipi || '').toLowerCase().includes('pazarlık')
                      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  <Gavel className="w-3.5 h-3.5" />
                  {dosyaData.ihale_tipi || 'Doğrudan Temin'}{' '}
                  {dosyaData.ihale_sekli ? `(${dosyaData.ihale_sekli})` : '(22/d)'}
                </span>
              </div>
            </div>
          </div>

          {/* Dosya Notları & Yapılacaklar (To-Do) Widget'ı */}
          {activeDosyaId && (
            <DosyaNotlariWidget dosyaId={Number(activeDosyaId)} dosyaNo={dosyaData.temin_no} />
          )}

          {/* Aşamalar Kısayolu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              🚀 Süreç Adımları Kısayolları
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/dosya/hazirlik-ve-ihtiyac"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all font-bold text-xs text-slate-700 dark:text-slate-300 group cursor-pointer"
              >
                <span>1. İhtiyaç Listesi & Maliyet & Onay Aşaması</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </Link>
              <Link
                to="/dosya/piyasa-fiyat-arastirmasi"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all font-bold text-xs text-slate-700 dark:text-slate-300 group cursor-pointer"
              >
                <span>2. Piyasa Fiyat Araştırması Aşaması</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </Link>
              <Link
                to="/dosya/siparis-ve-sozlesme"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all font-bold text-xs text-slate-700 dark:text-slate-300 group cursor-pointer"
              >
                <span>3. Sipariş & Sözleşme Aşaması</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </Link>
              <Link
                to="/dosya/kabul-ve-odeme"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-all font-bold text-xs text-slate-700 dark:text-slate-300 group cursor-pointer"
              >
                <span>4. Muayene & Kabul & Ödeme Aşaması</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Malzeme ve Tedarikçiler Tabloları */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Malzemeler */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              📦 Malzeme / Hizmet Kalemleri Listesi
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner max-h-[220px] overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-655 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Malzeme Adı</th>
                    <th className="p-3 text-center">Miktar</th>
                    <th className="p-3 text-center">Birim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-600 dark:text-slate-450">
                  {kalemler.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.kalem_adi}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.miktar}
                      </td>
                      <td className="p-3 text-center text-slate-500 dark:text-slate-400">
                        {item.olcu_birimi || 'Adet'}
                      </td>
                    </tr>
                  ))}
                  {kalemler.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-400 italic">
                        Dosyada henüz kayıtlı malzeme/hizmet bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tedarikçiler */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-455 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              💼 Teklif Veren Tedarikçiler / Firmalar
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner max-h-[220px] overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-655 dark:text-slate-400">
                  <tr>
                    <th className="p-3">Firma Ünvanı</th>
                    <th className="p-3 text-center">Teklif Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-600 dark:text-slate-450">
                  {firmalar.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {f.unvan}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800 font-extrabold tracking-tight">
                          Teklif Eklendi
                        </span>
                      </td>
                    </tr>
                  ))}
                  {firmalar.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-slate-400 italic">
                        Dosyada henüz kayıtlı firma teklifi bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
