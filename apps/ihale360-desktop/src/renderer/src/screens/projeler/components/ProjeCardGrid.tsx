import React from 'react'
import {
  FolderKanban,
  Plus,
  Search,
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  Edit2,
  Trash2
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Proje } from '../../../hooks/useProjeHooks'
import { DURUM_CONFIG } from '../constants'

interface ProjeCardGridProps {
  isLoadingProjeler: boolean
  filteredProjeler: Proje[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  durumFilter: 'all' | 'devam' | 'planlama' | 'tamamlandi'
  setDurumFilter: (durum: 'all' | 'devam' | 'planlama' | 'tamamlandi') => void
  handleOpenCreate: () => void
  handleOpenEdit: (p: Proje) => void
  handleOpenDetail: (p: Proje, tab: 'ozet' | 'dosyalar' | 'duzenle') => void
  setDeletingProje: (p: Proje) => void
}

export function ProjeCardGrid({
  isLoadingProjeler,
  filteredProjeler,
  searchTerm,
  setSearchTerm,
  durumFilter,
  setDurumFilter,
  handleOpenCreate,
  handleOpenEdit,
  handleOpenDetail,
  setDeletingProje
}: ProjeCardGridProps): React.JSX.Element {
  return (
    <>
      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Proje adı, kodu veya lokasyon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Durum Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 w-full sm:w-auto overflow-x-auto">
          {(
            [
              { id: 'all', label: 'Tümü' },
              { id: 'devam', label: 'Devam Eden' },
              { id: 'planlama', label: 'Planlama' },
              { id: 'tamamlandi', label: 'Tamamlandı' }
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setDurumFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                durumFilter === t.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoadingProjeler ? (
        <div className="py-20 text-center text-xs text-slate-400">Projeler yükleniyor...</div>
      ) : filteredProjeler.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto">
            <FolderKanban size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Kayıtlı Proje Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Arama kriterlerinize uygun proje bulunamadı veya henüz bir proje tanımlanmadı.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="text-xs bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={14} className="mr-1" /> İlk Projeyi Tanımla
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjeler.map((p) => {
            const durumBadge = DURUM_CONFIG[p.durum] || DURUM_CONFIG.devam
            const harcamaYuzde = p.harcama_yuzdesi || 0

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Sol Üst Renk Vurgusu */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: p.renk || '#3b82f6' }}
                />

                <div className="space-y-4 pt-1">
                  {/* Üst Bar: Kod & Durum */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/80">
                      {p.proje_kodu}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${durumBadge.color}`}
                    >
                      {durumBadge.label}
                    </span>
                  </div>

                  {/* Başlık & Açıklama */}
                  <div>
                    <h3
                      onClick={() => handleOpenDetail(p, 'ozet')}
                      className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {p.proje_adi}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                      {p.aciklama || 'Açıklama belirtilmemiş.'}
                    </p>
                  </div>

                  {/* Lokasyon & Tarihler */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{p.lokasyon || 'Tüm Birimler'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Calendar size={13} className="text-slate-400 shrink-0" />
                      <span>{p.bitis_tarihi || p.baslangic_tarihi || 'Tarih Yok'}</span>
                    </div>
                  </div>

                  {/* Finansal İlerleme Çubuğu */}
                  <div className="space-y-1.5 pt-1 bg-slate-50/60 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-500">
                        Harcama / Ödenek
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                        %{harcamaYuzde}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          harcamaYuzde > 90
                            ? 'bg-red-500'
                            : harcamaYuzde > 70
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, harcamaYuzde)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {p.harcanan_tutar ? `${p.harcanan_tutar.toLocaleString('tr-TR')} ₺` : '0 ₺'}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {p.toplam_butce
                          ? `${p.toplam_butce.toLocaleString('tr-TR')} ₺`
                          : 'Bütçe Yok'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alt Aksiyonlar & Dosya Sayısı */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenDetail(p, 'dosyalar')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors group/btn cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>{p.dosya_sayisi || 0} Bağlı Dosya</span>
                    <ChevronRight
                      size={14}
                      className="group-hover/btn:translate-x-0.5 transition-transform"
                    />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDetail(p, 'ozet')}
                      title="Proje Detay Ekranı"
                      className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Geniş Görünüm
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      title="Projeyi Düzenle"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingProje(p)}
                      title="Projeyi Sil"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
