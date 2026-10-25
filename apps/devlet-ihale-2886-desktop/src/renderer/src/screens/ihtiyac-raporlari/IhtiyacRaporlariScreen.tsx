import React, { useEffect, useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Link2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FolderOpen
} from 'lucide-react'
import { ViewToggle, DataViewMode } from '../../components/ui/ViewToggle'
import { IhtiyacRaporu, ihtiyacRaporuService } from '../../services/ihtiyacRaporuService'
import { dbClient } from '../../services/db/dbClient'
import { IhtiyacRaporuList } from './components/IhtiyacRaporuList'
import { IhtiyacRaporuEditorView } from './components/IhtiyacRaporuEditorView'
import { IhtiyacRaporuDetailView } from './components/IhtiyacRaporuDetailView'
import { DosyaBaglamaModal } from './components/DosyaBaglamaModal'
import { useTabStore } from '../../store/tabStore'
import { useWorkspaceStore } from '../../store/workspaceStore'

type ScreenView = 'list' | 'editor' | 'detail'

export default function IhtiyacRaporlariScreen(): React.JSX.Element {
  const { activeDosyaId } = useWorkspaceStore()
  const [raporlar, setRaporlar] = useState<IhtiyacRaporu[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<
    'all' | 'taslak' | 'onaylandi' | 'dosyaya_aktarildi' | 'iptal'
  >('all')
  const [baglantiFilter, setBaglantiFilter] = useState<'all' | 'bagli' | 'bagimsiz'>('all')
  const [viewMode, setViewMode] = useState<DataViewMode>('list')
  const [showGuide, setShowGuide] = useState(false)

  // Dynamic Dossier Scope State
  const [filterDosyaId, setFilterDosyaId] = useState<number | null>(null)
  const [activeDosyaInfo, setActiveDosyaInfo] = useState<{
    id: number
    dosya_no: string
    konu: string
    tur?: string
  } | null>(null)

  // Full Screen Navigation State (No modals for create/edit/detail)
  const [currentView, setCurrentView] = useState<ScreenView>('list')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null)

  // Dossier Connection Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkingRapor, setLinkingRapor] = useState<IhtiyacRaporu | null>(null)

  // Fetch active / filtered dossier summary info
  useEffect(() => {
    const targetId = filterDosyaId || activeDosyaId
    if (!targetId) return
    let isCurrent = true
    dbClient
      .queryFirst<{ id: number; dosya_no: string; konu: string; tur: string }>(
        `SELECT id, COALESCE(temin_no, dosya_no, 'Dosya #' || id) AS dosya_no, konu, tur FROM DATA_TeminDosyasi WHERE id = ?`,
        [targetId]
      )
      .then((res) => {
        if (isCurrent) setActiveDosyaInfo(res)
      })
      .catch(() => {
        if (isCurrent) setActiveDosyaInfo(null)
      })
    return () => {
      isCurrent = false
    }
  }, [filterDosyaId, activeDosyaId])

  // Tab Title synchronization
  useEffect(() => {
    const activeTabPath = useTabStore.getState().activeTabPath
    if (!activeTabPath) return

    if (currentView === 'editor') {
      const label = editingId ? 'İhtiyaç Raporu Düzenle' : 'Yeni İhtiyaç Raporu'
      useTabStore.getState().updateTabLabel(activeTabPath, label)
    } else if (currentView === 'detail') {
      const rapor = raporlar.find((r) => r.id === selectedDetailId)
      const label = rapor ? `Rapor: ${rapor.rapor_no}` : 'İhtiyaç Raporu Detayı'
      useTabStore.getState().updateTabLabel(activeTabPath, label)
    } else if (filterDosyaId) {
      useTabStore
        .getState()
        .updateTabLabel(activeTabPath, `İhtiyaç Raporları (Dosya #${filterDosyaId})`)
    } else {
      useTabStore.getState().updateTabLabel(activeTabPath, 'İhtiyaç Raporları (Havuz)')
    }
  }, [currentView, editingId, selectedDetailId, raporlar, filterDosyaId])

  // Deep-linking & external window parameter listener
  useEffect(() => {
    const parseUrlParams = (): void => {
      const hash = window.location.hash || ''
      const hashIdx = hash.indexOf('?')
      const hashParams = hashIdx !== -1 ? new URLSearchParams(hash.substring(hashIdx)) : null
      const searchParams = new URLSearchParams(window.location.search)

      const action = hashParams?.get('action') || searchParams.get('action')
      const idStr = hashParams?.get('id') || searchParams.get('id')
      const id = idStr ? parseInt(idStr, 10) : null
      const dosyaIdParam = hashParams?.get('dosyaId') || searchParams.get('dosyaId')

      if (dosyaIdParam) {
        setFilterDosyaId(parseInt(dosyaIdParam, 10))
      }

      if (action === 'yeni') {
        setCurrentView('editor')
        setEditingId(null)
      } else if (action === 'duzenle' && id) {
        setCurrentView('editor')
        setEditingId(id)
      } else if (action === 'detay' && id) {
        setCurrentView('detail')
        setSelectedDetailId(id)
      }
    }

    parseUrlParams()
    window.addEventListener('hashchange', parseUrlParams)
    window.addEventListener('popstate', parseUrlParams)
    return () => {
      window.removeEventListener('hashchange', parseUrlParams)
      window.removeEventListener('popstate', parseUrlParams)
    }
  }, [])

  const loadRaporlar = async (): Promise<void> => {
    try {
      setLoading(true)
      const list = await ihtiyacRaporuService.getRaporlar({
        search,
        durum: activeTab === 'all' ? undefined : activeTab,
        baglantiDurumu: baglantiFilter,
        temin_dosya_id: filterDosyaId != null ? filterDosyaId : undefined
      })
      setRaporlar(list)
    } catch (err) {
      console.error('İhtiyaç raporları yüklenirken hata:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    ihtiyacRaporuService
      .getRaporlar({
        search,
        durum: activeTab === 'all' ? undefined : activeTab,
        baglantiDurumu: baglantiFilter,
        temin_dosya_id: filterDosyaId != null ? filterDosyaId : undefined
      })
      .then((list) => {
        if (!ignore) {
          setRaporlar(list)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('İhtiyaç raporları yüklenirken hata:', err)
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [search, activeTab, baglantiFilter, filterDosyaId])

  // Stats calculation
  const stats = useMemo(() => {
    const total = raporlar.length
    const taslak = raporlar.filter((r) => r.durum === 'taslak').length
    const onayli = raporlar.filter((r) => r.durum === 'onaylandi').length
    const bagli = raporlar.filter((r) => r.temin_dosya_id || r.durum === 'dosyaya_aktarildi').length
    return { total, taslak, onayli, bagli }
  }, [raporlar])

  // Handlers - directly switch screens
  const handleOpenNew = (): void => {
    setEditingId(null)
    setCurrentView('editor')
  }

  const handleEdit = (id: number): void => {
    setEditingId(id)
    setCurrentView('editor')
  }

  const handleSelectDetail = (id: number): void => {
    setSelectedDetailId(id)
    setCurrentView('detail')
  }

  const handleDuplicate = async (id: number): Promise<void> => {
    try {
      const newId = await ihtiyacRaporuService.duplicateRapor(id)
      await loadRaporlar()
      setSelectedDetailId(newId)
      setCurrentView('detail')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      alert('Rapor kopyalanırken hata: ' + message)
    }
  }

  const handleDelete = async (id: number, no: string): Promise<void> => {
    if (!confirm(`"${no}" numaralı ihtiyaç raporunu silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      await ihtiyacRaporuService.deleteRapor(id)
      await loadRaporlar()
      if (selectedDetailId === id) {
        setSelectedDetailId(null)
        setCurrentView('list')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      alert('Rapor silinirken hata: ' + message)
    }
  }

  const handleOpenLinkModal = (rapor: IhtiyacRaporu): void => {
    setLinkingRapor(rapor)
    setLinkModalOpen(true)
  }

  // 1. TAM EKRAN: Rapor Oluşturma veya Düzenleme Ekranı
  if (currentView === 'editor') {
    return (
      <IhtiyacRaporuEditorView
        editId={editingId}
        initialTeminDosyaId={filterDosyaId || activeDosyaId}
        onBack={() => {
          setCurrentView('list')
          setEditingId(null)
          loadRaporlar()
        }}
        onSuccess={(savedId) => {
          loadRaporlar()
          setSelectedDetailId(savedId)
          setCurrentView('detail')
        }}
      />
    )
  }

  // 2. TAM EKRAN: Rapor Detay & Kalemler Görüntüleme Ekranı
  if (currentView === 'detail' && selectedDetailId) {
    return (
      <>
        <IhtiyacRaporuDetailView
          raporId={selectedDetailId}
          onBack={() => {
            setCurrentView('list')
            setSelectedDetailId(null)
            loadRaporlar()
          }}
          onEdit={(id) => {
            setEditingId(id)
            setCurrentView('editor')
          }}
          onDuplicate={(id) => {
            handleDuplicate(id)
          }}
          onOpenLinkModal={(rep) => {
            handleOpenLinkModal(rep)
          }}
        />

        <DosyaBaglamaModal
          isOpen={linkModalOpen}
          rapor={linkingRapor}
          onClose={() => setLinkModalOpen(false)}
          onSuccess={() => {
            loadRaporlar()
          }}
        />
      </>
    )
  }

  // 3. TAM EKRAN: İhtiyaç Raporları Liste Ekranı
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-7 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
                İhtiyaç Raporları
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bağımsız İhtiyaç Tespiti, Lüzum Müzekkeresi & Alım Öncesi Taslak Havuzu
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 select-none">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <HelpCircle size={15} className="text-cyan-600" />
            <span>Süreç Rehberi</span>
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            {filterDosyaId ? 'Bu Dosyaya Yeni Rapor' : 'Yeni İhtiyaç Raporu'}
          </button>
        </div>
      </div>

      {/* Dynamic Active File / Scope Bar */}
      {activeDosyaId || filterDosyaId ? (
        <div className="bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-cyan-50/50 dark:from-blue-950/20 dark:via-slate-900 dark:to-cyan-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FolderOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                  Aktif Alım Dosyası
                </span>
                <span className="text-xs font-mono font-bold text-blue-900 dark:text-blue-300">
                  #{activeDosyaInfo?.dosya_no || filterDosyaId || activeDosyaId}
                </span>
                {activeDosyaInfo?.tur && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {activeDosyaInfo.tur}
                  </span>
                )}
              </div>
              <p className="text-xs font-extrabold text-slate-850 dark:text-slate-100 mt-1 line-clamp-1">
                {activeDosyaInfo?.konu || 'Aktif Doğrudan Temin Dosyası'}
              </p>
            </div>
          </div>

          {/* Dynamic Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs self-start md:self-auto">
            <button
              onClick={() => setFilterDosyaId(activeDosyaId || filterDosyaId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterDosyaId != null
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Link2 size={14} />
              <span>Bu Dosyaya Bağlı Raporlar</span>
            </button>

            <button
              onClick={() => setFilterDosyaId(null)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterDosyaId === null
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Tüm Raporlar Havuzu (Genel)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Genel İhtiyaç Raporları Havuzu
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Şu anda aktif bir alım dosyası açık değil. Hazırladığınız tüm raporlar bağımsız
                taslak olarak saklanır; daha sonra istediğiniz alım dosyasına bağlanabilir.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Process Distinction & Guide Banner */}
      {showGuide && (
        <div className="bg-linear-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Önerilen Sistem Mimarisi
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Bağımsız İhtiyaç Raporu Akışı ve Kavram Ayrımı
              </h3>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Rehberi Gizle"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 rounded-2xl space-y-1.5 shadow-xs">
              <span className="text-cyan-700 dark:text-cyan-400 font-bold block">
                1. İhtiyaç Raporu Oluştur
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
                İhtiyaç kalemlerini, miktarları, teknik özellikleri ve alım gerekçesini aktif bir
                dosya seçmeden hazırlayın.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 p-4 rounded-2xl space-y-1.5 shadow-xs">
              <span className="text-amber-700 dark:text-amber-400 font-bold block">
                2. Taslak Olarak Sakla
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
                Henüz belirli bir doğrudan temin veya ihaleye bağlamadan veritabanında güvenle
                saklayın; sonra tekrar açın.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl space-y-1.5 shadow-xs">
              <span className="text-purple-700 dark:text-purple-400 font-bold block">
                3. Kopyala & Yeni Rapor
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
                Önceki rapordaki kalemleri tek tıkla kopyalayın; yeni bağımsız kimlikle miktarları
                ve tarihleri güncelleyin.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl space-y-1.5 shadow-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block">
                4. Alım Dosyasına Bağla
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
                Raporu dilediğiniz bir alım dosyasına bağlayın ve kalemleri dosyanın İhtiyaç
                Listesi&apos;ne klonlayın.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-2">
            <span>
              💡 <strong className="text-slate-700 dark:text-slate-200">Kavram Ayrımı:</strong>{' '}
              İhtiyaç Raporu (Hazırlık Belgesi) ≠ İhtiyaç Listesi (Dosya Kalemleri) ≠ Piyasa Fiyat
              Araştırması ≠ Yaklaşık Maliyet.
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Toplam Rapor
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-extrabold text-slate-850 dark:text-slate-100">
              {stats.total}
            </span>
            <FileSpreadsheet size={18} className="text-blue-500 opacity-60" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Taslak Olarak Bekleyen
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
              {stats.taslak}
            </span>
            <Clock size={18} className="text-amber-500 opacity-60" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Onaylanan Raporlar
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.onayli}
            </span>
            <CheckCircle2 size={18} className="text-emerald-500 opacity-60" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Dosyaya Aktarılanlar
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-extrabold text-purple-600 dark:text-purple-400">
              {stats.bagli}
            </span>
            <Link2 size={18} className="text-purple-500 opacity-60" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tümü ({stats.total})
          </button>

          <button
            onClick={() => setActiveTab('taslak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'taslak'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Taslaklar ({stats.taslak})
          </button>

          <button
            onClick={() => setActiveTab('onaylandi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'onaylandi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Onaylananlar ({stats.onayli})
          </button>

          <button
            onClick={() => setActiveTab('dosyaya_aktarildi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dosyaya_aktarildi'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Dosyaya Bağlı ({stats.bagli})
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Connection Filter */}
          <select
            value={baglantiFilter}
            onChange={(e) => setBaglantiFilter(e.target.value as 'all' | 'bagli' | 'bagimsiz')}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">Tüm Bağlantı Durumları</option>
            <option value="bagli">Yalnızca Dosyaya Bağlılar</option>
            <option value="bagimsiz">Yalnızca Bağımsız / Bağsızlar</option>
          </select>
        </div>

        {/* Right: Search & View Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rapor no, konu veya bağlı dosya ara..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Toggle */}
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Reports List */}
      <IhtiyacRaporuList
        raporlar={raporlar}
        loading={loading}
        viewMode={viewMode}
        hasFilters={Boolean(search.trim() || activeTab !== 'all' || baglantiFilter !== 'all')}
        onClearFilters={() => {
          setSearch('')
          setActiveTab('all')
          setBaglantiFilter('all')
        }}
        onSelect={handleSelectDetail}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onOpenLinkModal={handleOpenLinkModal}
        onOpenNew={handleOpenNew}
      />

      {/* Link to Dossier Modal (accessible from list) */}
      <DosyaBaglamaModal
        isOpen={linkModalOpen}
        rapor={linkingRapor}
        onClose={() => setLinkModalOpen(false)}
        onSuccess={() => {
          loadRaporlar()
        }}
      />
    </div>
  )
}
