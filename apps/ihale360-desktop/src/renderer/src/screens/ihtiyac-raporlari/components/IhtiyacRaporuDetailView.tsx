import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeAlert,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Link2,
  Package,
  TrendingUp
} from 'lucide-react'
import {
  IhtiyacRaporu,
  IhtiyacRaporuKalem,
  ihtiyacRaporuService
} from '../../../services/ihtiyacRaporuService'
import { calculateTotals } from '../../../utils/ihtiyacRaporuTotals'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../../constants/routeConstants'
import { DetayTab } from '../tabs/DetayTab'
import { LuzumMuzekkeresiTab } from '../tabs/LuzumMuzekkeresiTab'
import { LuzumOnayEkiTab } from '../tabs/LuzumOnayEkiTab'
import { YiUfeFiyatGuncellemeModal } from './YiUfeFiyatGuncellemeModal'

interface DetailViewProps {
  raporId: number
  onBack: () => void
  onEdit: (raporId: number) => void
  onDuplicate: (raporId: number) => void
  onOpenLinkModal: (rapor: IhtiyacRaporu) => void
}

type DetailTab = 'detay' | 'luzum_muzekkeresi' | 'luzum_onay_eki'

export function IhtiyacRaporuDetailView({
  raporId,
  onBack,
  onEdit,
  onDuplicate,
  onOpenLinkModal
}: DetailViewProps): React.JSX.Element {
  const [rapor, setRapor] = useState<IhtiyacRaporu | null>(null)
  const [kalemler, setKalemler] = useState<IhtiyacRaporuKalem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('detay')
  const [isYiUfeModalOpen, setIsYiUfeModalOpen] = useState(false)

  const { setActiveDosyaId } = useWorkspaceStore()
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rep, items] = await Promise.all([
        ihtiyacRaporuService.getRaporById(raporId),
        ihtiyacRaporuService.getRaporKalemleri(raporId)
      ])

      if (!rep) {
        throw new Error(`İhtiyaç raporu bulunamadı (ID: ${raporId})`)
      }

      setRapor(rep)
      setKalemler(items || [])
    } catch (err: unknown) {
      console.error('İhtiyaç raporu detay yüklenemedi:', err)
      const msg =
        err instanceof Error ? err.message : 'İhtiyaç raporu detayları yüklenirken bir hata oluştu.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [raporId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  const getStatusBadge = (durum: string): React.JSX.Element => {
    switch (durum) {
      case 'onaylandi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs">
            <CheckCircle2 size={13} />
            Onaylandı
          </span>
        )
      case 'dosyaya_aktarildi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-xs">
            <Link2 size={13} />
            Dosyaya Aktarıldı
          </span>
        )
      case 'inceleniyor':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100/70 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-xs">
            <Clock size={13} />
            İnceleniyor
          </span>
        )
      case 'iptal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs">
            <BadgeAlert size={13} />
            İptal
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-xs">
            <Clock size={13} />
            Taslak
          </span>
        )
    }
  }

  const handleNavigateToDosya = (dosyaId: number): void => {
    setActiveDosyaId(dosyaId)
    navigate({ to: APP_ROUTES.HAZIRLIK_VE_IHTIYAC as string })
  }

  // Tek kaynak üzerinden tutar hesabı
  const totals = useMemo(() => calculateTotals(kalemler), [kalemler])

  // Hata Durumu
  if (error) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
          <BadgeAlert size={28} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
            İhtiyaç Raporu Yüklenemedi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{error}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Listeye Dön
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  // Yükleme Durumu
  if (loading || !rapor) {
    return (
      <div className="p-12 text-center text-slate-500 max-w-7xl mx-auto space-y-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium">İhtiyaç raporu detayları yükleniyor...</p>
      </div>
    )
  }

  const hasTotalDiff =
    rapor.tahmini_butce !== null &&
    rapor.tahmini_butce !== undefined &&
    Math.abs(Number(rapor.tahmini_butce) - totals.genelToplam) > 0.01

  return (
    <div className="w-full max-w-462.5 mx-auto p-3 sm:p-5 space-y-4 animate-in fade-in duration-200">
      {/* 1. ÜST BİLGİ & AKSİYON BARI (Kompakt, Modern ve Yer Tasarruflu) */}
      <header className="bg-white dark:bg-slate-900 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Sol Taraf: Geri Dönüş, Breadcrumb, Rapor No, Başlık ve Durum */}
        <div className="flex items-center gap-3 min-w-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Listeye Dön"
          >
            <ArrowLeft size={15} />
            <span className="text-xs font-bold hidden sm:inline">Listeye Dön</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-xs font-extrabold border border-blue-400/30 shrink-0">
              {rapor.rapor_no}
            </span>

            {getStatusBadge(rapor.durum)}

            <span className="text-xs text-slate-500 dark:text-slate-400 hidden xl:flex items-center gap-1 font-medium shrink-0">
              <Calendar size={13} className="text-slate-400" />
              {formatDate(rapor.tarih)}
            </span>

            {(rapor.evrak_sayisi || rapor.dosya_evrak_sayisi) && (
              <span
                className="hidden md:inline-flex px-2 py-0.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-[11px] font-bold border border-purple-400/30 shrink-0"
                title="Resmî EBYS Evrak Sayısı"
              >
                EBYS: {rapor.evrak_sayisi || rapor.dosya_evrak_sayisi}
              </span>
            )}

            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {rapor.baslik}
            </h1>
          </div>
        </div>

        {/* Sağ Taraf: Tahmini Bedel Özeti ve Aksiyon Butonları */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400">Tahmini Bedel:</span>
            <span className="text-sm font-mono font-black text-cyan-700 dark:text-cyan-400">
              {formatCurrency(totals.genelToplam)}
            </span>
            {hasTotalDiff && (
              <span
                className="text-amber-500 cursor-help"
                title={`Kayıtlı Bedel Farkı: ${formatCurrency(rapor.tahmini_butce || 0)}`}
              >
                <BadgeAlert size={14} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsYiUfeModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="TÜİK Yİ-ÜFE Endeksleri ile Birim Fiyatları Güncelle / Eskale Et"
            >
              <TrendingUp size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>TÜİK Fiyat Güncelle</span>
            </button>

            <button
              onClick={() => onDuplicate(rapor.id)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Raporu Kopyala"
            >
              <Copy size={13} className="text-slate-500" />
              <span className="hidden sm:inline">Kopyala</span>
            </button>

            {rapor.temin_dosya_id ? (
              <button
                onClick={() => {
                  setActiveDosyaId(rapor.temin_dosya_id!)
                  navigate({ to: APP_ROUTES.HAZIRLIK_VE_IHTIYAC })
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title={`Bağlı Satın Alma Dosyasına Git (${rapor.dosya_no || '#' + rapor.temin_dosya_id})`}
              >
                <ExternalLink size={13} />
                <span>Dosyaya Git</span>
                {rapor.dosya_no && (
                  <span className="bg-blue-500/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                    {rapor.dosya_no}
                  </span>
                )}
              </button>
            ) : null}

            {!rapor.temin_dosya_id ? (
              <button
                onClick={() => onOpenLinkModal(rapor)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Link2 size={13} />
                <span>Dosyaya Bağla</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenLinkModal(rapor)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Dosya Bağlantısını Değiştir / Kaldır"
              >
                <Link2 size={13} />
                <span>Bağlantı</span>
              </button>
            )}

            <button
              onClick={() => onEdit(rapor.id)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Edit size={13} />
              <span>Düzenle</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SAĞLI SOLLU STÜDYO DÜZENİ (SPLIT VIEW) */}
      <div className="flex flex-col xl:flex-row gap-4 items-start w-full">
        {/* SOL PANEL: Rapor Detayları, Gerekçe & Kalemler */}
        {activeTab !== 'luzum_onay_eki' && (
          <aside
            className={`w-full xl:w-[42%] 2xl:w-[38%] transition-all duration-300 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden h-[calc(100vh-140px)] min-h-175`}
          >
            {/* Sol Panel Üst Kontrolleri */}
            <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Rapor Verileri &amp; Kalemler
                </span>
              </div>

              {/* Sol Panel Sekme Filtresi */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('detay')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === 'detay'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Tümü
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('luzum_muzekkeresi')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === 'luzum_muzekkeresi'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  Kalemler ({kalemler.length})
                </button>
              </div>
            </div>

            {/* Sol Panel İçerik Alanı (Kaydırılabilir) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <DetayTab
                rapor={rapor}
                kalemler={kalemler}
                totals={totals}
                onEdit={onEdit}
                onNavigateToDosya={handleNavigateToDosya}
                onOpenYiUfeModal={() => setIsYiUfeModalOpen(true)}
                filterSection={activeTab === 'luzum_muzekkeresi' ? 'items' : 'all'}
              />
            </div>
          </aside>
        )}

        {/* SAĞ PANEL: Canlı Belge Stüdyosu & Önizleme */}
        <main
          className={`flex-1 w-full ${
            activeTab === 'luzum_onay_eki' ? 'xl:w-full' : 'xl:w-[58%] 2xl:w-[62%]'
          } transition-all duration-300 flex flex-col bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden h-[calc(100vh-140px)] min-h-175`}
        >
          {/* Sağ Panel Başlık & Şablon Seçici */}
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('detay')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab !== 'luzum_onay_eki'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet size={14} />
                <span>Lüzum Müzekkeresi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('luzum_onay_eki')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'luzum_onay_eki'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Package size={14} />
                <span>Onay Eki (Çizelge)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                Canlı A4 Şablon Önizlemesi
              </span>
            </div>
          </div>

          {/* Sağ Panel Belge Gövdesi */}
          <div className="flex-1 w-full h-full overflow-hidden relative">
            {activeTab === 'luzum_onay_eki' ? (
              <LuzumOnayEkiTab
                raporId={raporId}
                dosyaId={rapor.temin_dosya_id}
                onClose={() => setActiveTab('detay')}
                className="relative w-full h-full min-h-160 rounded-none border-0 overflow-hidden bg-slate-100 dark:bg-slate-950"
              />
            ) : (
              <LuzumMuzekkeresiTab
                raporId={raporId}
                dosyaId={rapor.temin_dosya_id}
                onClose={() => setActiveTab('detay')}
                className="relative w-full h-full min-h-160 rounded-none border-0 overflow-hidden bg-slate-100 dark:bg-slate-950"
              />
            )}
          </div>
        </main>
      </div>

      {/* TÜİK Yİ-ÜFE Fiyat Güncelleme / Eskalasyon Modalı */}
      <YiUfeFiyatGuncellemeModal
        isOpen={isYiUfeModalOpen}
        onClose={() => setIsYiUfeModalOpen(false)}
        rapor={rapor}
        kalemler={kalemler}
        onSuccess={loadData}
      />
    </div>
  )
}
