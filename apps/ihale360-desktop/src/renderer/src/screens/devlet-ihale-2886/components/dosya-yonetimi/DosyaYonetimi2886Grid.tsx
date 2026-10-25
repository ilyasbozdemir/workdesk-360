import React from 'react'
import { Calendar, Edit3, Copy, Trash2, Sparkles, Building2 } from 'lucide-react'
import { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'
import { formatMoney, getTurBadge, getUsulLabel } from './dosyaYonetimi2886.utils'

interface DosyaYonetimi2886GridProps {
  filteredDosyalar: Dosya2886Item[]
  activeDosyaId?: string
  onOpenEditModal: (dosya: Dosya2886Item) => void
  onDuplicate: (dosya: Dosya2886Item) => void
  onDeleteRequest: (dosya: Dosya2886Item) => void
  onSelectAndOpenStudio: (dosya: Dosya2886Item) => void
  onRestoreDefaults: () => void
}

export const DosyaYonetimi2886Grid: React.FC<DosyaYonetimi2886GridProps> = ({
  filteredDosyalar,
  activeDosyaId,
  onOpenEditModal,
  onDuplicate,
  onDeleteRequest,
  onSelectAndOpenStudio,
  onRestoreDefaults
}) => {
  if (filteredDosyalar.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Kayıtlı 2886 İhale Dosyası Bulunamadı
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Arama kriterlerinizi değiştirebilir veya yukarıdaki butonu kullanarak yeni bir ihale
          dosyası oluşturabilirsiniz.
        </p>
        <button
          type="button"
          onClick={onRestoreDefaults}
          className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Örnek 2886 Dosyalarını Geri Yükle
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {filteredDosyalar.map((d) => {
        const isActive =
          activeDosyaId === d.id || localStorage.getItem('temin_2886_active_dosya')?.includes(d.id)
        const bedel =
          d.muhammenBedel?.takdirEdilenMuhammenBedel || d.muhammenBedel?.hesaplananBedel || 0

        return (
          <div
            key={d.id}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group ${
              isActive
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900'
            }`}
          >
            <div>
              {/* Kart Üst Başlık & Rozetler */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                    {d.ihaleKayitNo}
                  </span>
                  {getTurBadge(d.islemTuru)}
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {getUsulLabel(d.usul)}
                </span>
              </div>

              {/* Taşınmaz Adı / Konusu */}
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-2">
                {d.ihaleAdi}
              </h4>

              {/* Künye Özet Bilgileri */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Ada / Parsel</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {d.tasinmaz?.ada && d.tasinmaz?.parsel
                      ? `${d.tasinmaz.ada} / ${d.tasinmaz.parsel}`
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Yüzölçümü</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {d.tasinmaz?.yuzolcumuM2 ? `${d.tasinmaz.yuzolcumuM2} m²` : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">İhale Tarihi</span>
                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {d.ihaleTarihi} {d.ihaleSaati && `(${d.ihaleSaati})`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Muhammen Bedel</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₺{formatMoney(bedel)}
                  </span>
                </div>
              </div>
            </div>

            {/* Kart Alt Butonları */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenEditModal(d)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Dosya Bilgilerini Düzenle"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicate(d)}
                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg transition-colors cursor-pointer"
                  title="Dosyayı Klonla / Çoğalt"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRequest(d)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                  title="Dosyayı Kesin Olarak Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelectAndOpenStudio(d)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stüdyoda Aç</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
