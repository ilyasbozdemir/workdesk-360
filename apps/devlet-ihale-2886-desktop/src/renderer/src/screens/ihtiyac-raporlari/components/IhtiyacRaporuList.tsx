import React from 'react'
import {
  FileText,
  Calendar,
  Building2,
  User,
  Package,
  Edit,
  Copy,
  Trash2,
  Link2,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  BadgeAlert,
  SearchX
} from 'lucide-react'
import { IhtiyacRaporu } from '../../../services/ihtiyacRaporuService'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { useNavigate } from '@tanstack/react-router'
import { DataViewMode } from '../../../components/ui/ViewToggle'

interface ListProps {
  raporlar: IhtiyacRaporu[]
  loading: boolean
  viewMode?: DataViewMode
  hasFilters?: boolean
  onClearFilters?: () => void
  onSelect: (raporId: number) => void
  onEdit: (raporId: number) => void
  onDuplicate: (raporId: number) => void
  onDelete: (raporId: number, raporNo: string) => void
  onOpenLinkModal: (rapor: IhtiyacRaporu) => void
  onOpenNew: () => void
}

export function IhtiyacRaporuList({
  raporlar,
  loading,
  viewMode = 'list',
  hasFilters = false,
  onClearFilters,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onOpenLinkModal,
  onOpenNew
}: ListProps): React.JSX.Element {
  const { setActiveDosyaId } = useWorkspaceStore()
  const navigate = useNavigate()

  const handleNavigateToDosya = (e: React.MouseEvent, dosyaId: number): void => {
    e.stopPropagation()
    setActiveDosyaId(dosyaId)
    navigate({ to: '/dosya/hazirlik-ve-ihtiyac' as any })
  }

  const renderStatusBadge = (durum: string): React.JSX.Element => {
    switch (durum) {
      case 'onaylandi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={12} />
            Onaylandı
          </span>
        )
      case 'dosyaya_aktarildi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Link2 size={12} />
            Dosyaya Aktarıldı
          </span>
        )
      case 'inceleniyor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-100/70 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Clock size={12} />
            İnceleniyor
          </span>
        )
      case 'iptal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <BadgeAlert size={12} />
            İptal
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock size={12} />
            Taslak
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">İhtiyaç raporları listeleniyor...</p>
      </div>
    )
  }

  // Boş durum (Arama filtresi veya hiç kayıt yoksa)
  if (raporlar.length === 0) {
    if (hasFilters) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs space-y-5 my-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <SearchX size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Arama Kriterlerine Uygun Rapor Bulunamadı
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Girilen arama terimine veya seçilen filtreye uygun ihtiyaç raporu bulunamadı.
              Filtreleri temizleyerek tüm kayıtları listeleyebilirsiniz.
            </p>
          </div>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-xs space-y-6 my-8">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <FileText size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Kayıtlı İhtiyaç Raporu Bulunmuyor
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Aktif bir alım dosyası oluşturmadan bağımsız ihtiyaç raporu hazırlayabilir, gerekçeleri
            kayıt altına alabilir ve dilediğiniz zaman bir alım dosyasına bağlayabilirsiniz.
          </p>
        </div>
        <button
          onClick={onOpenNew}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
        >
          <FileText size={15} />
          İlk İhtiyaç Raporunu Oluştur
        </button>
      </div>
    )
  }

  // 1. Tablo Görünümü
  if (viewMode === 'table') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10.5px] border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Rapor No</th>
                <th className="py-3 px-4 min-w-[220px]">Rapor Başlığı & Gerekçe</th>
                <th className="py-3 px-4">Talep Eden</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-center">Kalem</th>
                <th className="py-3 px-4 text-right">Tahmini Bütçe</th>
                <th className="py-3 px-4 min-w-[180px]">Bağlı Alım Dosyası</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {raporlar.map((r) => {
                const isLinked = !!r.temin_dosya_id
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelect(r.id)}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      {r.rapor_no}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {r.baslik}
                      </div>
                      {r.gerekce && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                          {r.gerekce}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {r.talep_eden_personel || '—'}
                      </div>
                      {r.birim_adi && (
                        <div className="text-[10.5px] text-purple-600 dark:text-purple-400">
                          {r.birim_adi}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                        <Package size={11} className="text-emerald-500" />
                        {r.kalem_sayisi || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {r.tahmini_butce ? formatCurrency(r.tahmini_butce) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {isLinked ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                            [{r.dosya_no || `Dosya #${r.temin_dosya_id}`}]
                          </span>
                          <span
                            className="text-slate-600 dark:text-slate-400 truncate max-w-[140px] text-[11px]"
                            title={r.dosya_konu || ''}
                          >
                            {r.dosya_konu}
                          </span>
                          <button
                            onClick={(e) => handleNavigateToDosya(e, r.temin_dosya_id!)}
                            className="p-1 text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 rounded-md transition-colors"
                            title="Alım Dosyasına Git"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Bağımsız / Bağsız</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDate(r.tarih)}
                    </td>
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelect(r.id)}
                          className="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Görüntüle"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => onEdit(r.id)}
                          className="p-1.5 text-slate-450 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDuplicate(r.id)}
                          className="p-1.5 text-slate-450 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Kopyalayarak Bağımsız Yeni Rapor Oluştur"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => onOpenLinkModal(r)}
                          className="p-1.5 text-slate-450 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors cursor-pointer"
                          title={isLinked ? 'Dosya Bağlantısını Değiştir' : 'Alım Dosyasına Bağla'}
                        >
                          <Link2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(r.id, r.rapor_no)}
                          className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Raporu Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // 2. Grid (Kutu) Görünümü
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {raporlar.map((r) => {
          const isLinked = !!r.temin_dosya_id
          return (
            <div
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="group bg-white dark:bg-slate-900 border border-slate-200/80 hover:border-blue-400/80 dark:border-slate-800 dark:hover:border-blue-500/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200/60 dark:border-blue-800/60">
                    {r.rapor_no}
                  </span>
                  {renderStatusBadge(r.durum)}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {r.baslik}
                  </h3>
                  {r.gerekce && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {r.gerekce}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {r.birim_adi && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 size={13} className="text-purple-500 shrink-0" />
                      <span className="truncate">{r.birim_adi}</span>
                    </div>
                  )}
                  {r.talep_eden_personel && (
                    <div className="flex items-center gap-1.5 truncate">
                      <User size={13} className="text-blue-500 shrink-0" />
                      <span className="truncate">{r.talep_eden_personel}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Package size={13} className="text-emerald-500 shrink-0" />
                      {r.kalem_sayisi || 0} Kalem
                    </span>
                    {r.tahmini_butce ? (
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(r.tahmini_butce)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Linked Dossier Info */}
                {isLinked && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {r.dosya_no || `Dosya #${r.temin_dosya_id}`}
                      </span>
                      <button
                        onClick={(e) => handleNavigateToDosya(e, r.temin_dosya_id!)}
                        className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                      >
                        Aç <ExternalLink size={10} />
                      </button>
                    </div>
                    {r.dosya_konu && (
                      <p className="text-slate-600 dark:text-slate-300 truncate">{r.dosya_konu}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div
                className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(r.tarih)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelect(r.id)}
                    className="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Görüntüle"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => onEdit(r.id)}
                    className="p-1.5 text-slate-450 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => onDuplicate(r.id)}
                    className="p-1.5 text-slate-450 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Kopyalayarak Bağımsız Yeni Rapor Oluştur"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => onOpenLinkModal(r)}
                    className="p-1.5 text-slate-450 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-lg transition-colors cursor-pointer"
                    title={isLinked ? 'Dosya Bağlantısını Değiştir' : 'Alım Dosyasına Bağla'}
                  >
                    <Link2 size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(r.id, r.rapor_no)}
                    className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Raporu Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 3. Liste (Satır Kartları) Görünümü (Varsayılan)
  return (
    <div className="space-y-3.5">
      {raporlar.map((r) => {
        const isLinked = !!r.temin_dosya_id
        return (
          <div
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 hover:border-blue-400/80 dark:border-slate-800 dark:hover:border-blue-500/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left: Info */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200/60 dark:border-blue-800/60">
                  {r.rapor_no}
                </span>
                {renderStatusBadge(r.durum)}
                <span className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-1 font-medium">
                  <Calendar size={12} />
                  {formatDate(r.tarih)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {r.baslik}
                </h3>
                {r.gerekce && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {r.gerekce}
                  </p>
                )}
              </div>

              {/* Meta Chips */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                {r.birim_adi && (
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-purple-500 shrink-0" />
                    {r.birim_adi}
                  </span>
                )}
                {r.talep_eden_personel && (
                  <span className="flex items-center gap-1">
                    <User size={13} className="text-blue-500 shrink-0" />
                    {r.talep_eden_personel}
                  </span>
                )}
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Package size={13} className="text-emerald-500 shrink-0" />
                  {r.kalem_sayisi || 0} Kalem
                </span>
                {r.tahmini_butce ? (
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(r.tahmini_butce)}
                  </span>
                ) : null}
              </div>

              {/* Linked Dossier Info */}
              {isLinked && (
                <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <Link2 size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Bağlı Dosya:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      [{r.dosya_no || `Dosya #${r.temin_dosya_id}`}]
                    </span>
                    <span className="truncate max-w-xs">{r.dosya_konu}</span>
                  </div>

                  <button
                    onClick={(e) => handleNavigateToDosya(e, r.temin_dosya_id!)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="İlgili Alım Dosyasına Git"
                  >
                    Dosyaya Git
                    <ExternalLink size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div
              className="flex items-center gap-1.5 md:self-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onSelect(r.id)}
                className="p-2 text-slate-450 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors cursor-pointer"
                title="Görüntüle"
              >
                <Eye size={16} />
              </button>

              <button
                onClick={() => onEdit(r.id)}
                className="p-2 text-slate-450 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-colors cursor-pointer"
                title="Düzenle"
              >
                <Edit size={16} />
              </button>

              <button
                onClick={() => onDuplicate(r.id)}
                className="p-2 text-slate-450 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl transition-colors cursor-pointer"
                title="Kopyalayarak Bağımsız Yeni Rapor Oluştur"
              >
                <Copy size={16} />
              </button>

              <button
                onClick={() => onOpenLinkModal(r)}
                className="p-2 text-slate-450 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl transition-colors cursor-pointer"
                title={isLinked ? 'Dosya Bağlantısını Değiştir' : 'Alım Dosyasına Bağla'}
              >
                <Link2 size={16} />
              </button>

              <button
                onClick={() => onDelete(r.id, r.rapor_no)}
                className="p-2 text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                title="Raporu Sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
