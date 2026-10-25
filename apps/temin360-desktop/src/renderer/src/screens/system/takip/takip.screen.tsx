/* eslint-disable */
import React, { useState } from 'react'
import {
  BookOpen,
  Columns3,
  Edit,
  ExternalLink,
  Layers,
  LayoutDashboard,
  Package,
  Trash2,
  Users
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../../constants/routeConstants'

import { useTakip } from './components/useTakip'
import { TakipHeader, TakipViewMode } from './components/TakipHeader'
import { TakipActiveDosyaSummary } from './components/TakipActiveDosyaSummary'
import { TakipDosyaTarihlerWidget } from './components/TakipDosyaTarihlerWidget'
import { TakipUretilenBelgelerWidget } from './components/TakipUretilenBelgelerWidget'
import { TakipAsamaStepper } from './components/TakipAsamaStepper'
import { TakipIsAkisiYonergesi } from './components/TakipIsAkisiYonergesi'
import { TakipKalemlerVeFirmalarGrid } from './components/TakipKalemlerVeFirmalarGrid'
import { TakipDosyaDetayBilgileri } from './components/TakipDosyaDetayBilgileri'
import { TakipAsamaAciklamalari } from './components/TakipAsamaAciklamalari'
import { TakipGenelMetrikView } from './components/TakipGenelMetrikView'
import { TakipKanbanBoard } from './components/TakipKanbanBoard'
import { TakipGridView } from './components/TakipGridView'
import { TakipListView } from './components/TakipListView'
import { TakipDosyaDetayDialog } from './components/TakipDosyaDetayDialog'
import { DosyaNotlariWidget } from '../../notlar/components/DosyaNotlariWidget'
import { useQueryClient } from '@tanstack/react-query'
import type { TeminDosyasi } from '../../dosyalar/dosyalar.hooks'

export function TakipScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const {
    activeDosyaId,
    setActiveDosyaId,
    activeDosya,
    dosyalar,
    dbBelgeler,
    allBelgeler,
    kalemler,
    firmalar,
    komisyonlar,
    stages,
    dbAsamalar,
    currentAsamaSira,
    STAGE_ROUTES,
    STAGE_SHORT_LABELS,
    status,
    setStatus,
    acilisTarihi,
    setAcilisTarihi,
    sonTeklifTarihi,
    setSonTeklifTarihi,
    teminTarihi,
    setTeminTarihi,
    teslimTarihi,
    setTeslimTarihi,
    notlar,
    setNotlar,
    saveLoading,
    saveMessage,
    handleEditDosya,
    handleSurecAkisi,
    handleOpenInNewWindow,
    handleDelete,
    handleUpdateDosya,
    handleToggleSign,
    formatCurrency
  } = useTakip()

  const queryClient = useQueryClient()

  // Ana Görünüm Modu: Kullanıcının son seçtiği görünüm (localStorage ile korunur)
  const [viewMode, setViewModeState] = useState<TakipViewMode>(() => {
    try {
      const saved = localStorage.getItem('temin_takip_view_mode') as TakipViewMode
      if (saved && ['kanban', 'grid', 'list', 'metrik', 'detay'].includes(saved)) {
        return saved
      }
    } catch {
      // ignore
    }
    return 'kanban'
  })

  const setViewMode = (mode: TakipViewMode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem('temin_takip_view_mode', mode)
    } catch {
      // ignore
    }
  }

  // Detay modu seçildiğinde aktif dosya yoksa mevcut ilk dosyayı otomatik seç
  React.useEffect(() => {
    if (viewMode === 'detay' && !activeDosyaId && dosyalar.length > 0) {
      setActiveDosyaId(dosyalar[0].id)
    }
  }, [viewMode, activeDosyaId, dosyalar, setActiveDosyaId])

  // Trello Benzeri Kart Detay Dialog'u State'i
  const [selectedDetailDosya, setSelectedDetailDosya] = useState<TeminDosyasi | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleOpenDetailModal = (dosya: TeminDosyasi) => {
    setActiveDosyaId(dosya.id)
    setSelectedDetailDosya(dosya)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
  }

  const handleDosyaUpdatedInModal = (updated: Partial<TeminDosyasi> & { id: number }) => {
    queryClient.invalidateQueries({ queryKey: ['temin_dosyalari'] })
    if (selectedDetailDosya && selectedDetailDosya.id === updated.id) {
      setSelectedDetailDosya((prev) => (prev ? { ...prev, ...updated } : null))
    }
  }

  // Ortak Arama ve Filtreleme Durumu (Görünüm değişiminde sıfırlanmaz)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYil, setSelectedYil] = useState('all')
  const [selectedTur, setSelectedTur] = useState('all')

  const uniqueYillar = React.useMemo(() => {
    const years = new Set<number>()
    dosyalar.forEach((d) => {
      const y =
        d.butce_yili ||
        (d.dosya_acilis_tarihi ? new Date(d.dosya_acilis_tarihi).getFullYear() : null)
      if (y) years.add(y)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [dosyalar])

  const filteredDosyalar = React.useMemo(() => {
    return dosyalar.filter((d) => {
      if (d.is_deleted === 1) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchKonu = (d.konu || '').toLowerCase().includes(q)
        const matchNo = (d.temin_no || '').toLowerCase().includes(q)
        const matchBirim = (
          (d as { birim_adi?: string; birim?: string }).birim_adi ||
          (d as { birim?: string }).birim ||
          ''
        )
          .toLowerCase()
          .includes(q)
        if (!matchKonu && !matchNo && !matchBirim) return false
      }

      if (selectedYil !== 'all') {
        const dYear =
          d.butce_yili ||
          (d.dosya_acilis_tarihi ? new Date(d.dosya_acilis_tarihi).getFullYear() : null)
        if (String(dYear) !== selectedYil) return false
      }

      if (selectedTur !== 'all') {
        if (d.tur !== selectedTur) return false
      }

      return true
    })
  }, [dosyalar, searchQuery, selectedYil, selectedTur])

  // Tabbed Görünüm (Dosya Detayı alt sekmeleri)
  const [activeTab, setActiveTab] = useState<'ozet' | 'kalemler' | 'komisyon' | 'mevzuat'>('ozet')

  const tabs = [
    {
      id: 'ozet',
      label: 'Genel Bakış & Tarihler',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'kalemler',
      label: 'Malzeme & Firmalar',
      icon: Package,
      badge: kalemler.length > 0 ? kalemler.length : null
    },
    {
      id: 'komisyon',
      label: 'Yetkili & Komisyon Detayları',
      icon: Users,
      badge: komisyonlar.length > 0 ? komisyonlar.length : null
    },
    {
      id: 'mevzuat',
      label: 'İş Akışı & Yönerge',
      icon: BookOpen,
      badge: null
    }
  ]

  const isKanban = viewMode === 'kanban'

  return (
    <div
      className={`flex flex-col gap-6 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        isKanban ? 'h-[calc(100vh-7rem)] min-h-0' : 'pb-10'
      }`}
    >
      {/* HEADER SECTION */}
      <div className="shrink-0">
        <TakipHeader
          activeDosya={activeDosya}
          onEditClick={handleEditDosya}
          activeView={viewMode}
          setActiveView={setViewMode}
          onOpenWizard={() => {
            navigate({ to: APP_ROUTES.YENI_DOSYA, search: { initialStage: 1 } })
          }}
        />
      </div>

      {/* GÖRÜNÜM 1: KANBAN İŞ AKIŞI TAHTASI */}
      {viewMode === 'kanban' && (
        <div className="flex flex-col flex-1 min-h-0">
          <TakipKanbanBoard
            dosyalar={dosyalar}
            activeDosyaId={activeDosyaId}
            setActiveDosyaId={(id) => {
              setActiveDosyaId(id)
            }}
            formatCurrency={formatCurrency}
            onOpenWizard={(targetStage) => {
              navigate({
                to: APP_ROUTES.YENI_DOSYA,
                search: { initialStage: targetStage || 1 }
              })
            }}
            onOpenSurec={(d) => {
              setActiveDosyaId(d.id)
              const route = STAGE_ROUTES[d.durum_asama_id || 1] || '/dosya/hazirlik-ve-ihtiyac'
              navigate({ to: route })
            }}
            onEdit={(dosyaId) => {
              navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` })
            }}
            onOpenDetail={handleOpenDetailModal}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedYil={selectedYil}
            setSelectedYil={setSelectedYil}
            selectedTur={selectedTur}
            setSelectedTur={setSelectedTur}
          />
        </div>
      )}

      {/* GÖRÜNÜM 2: GRID / KART GÖRÜNÜMÜ */}
      {viewMode === 'grid' && (
        <TakipGridView
          dosyalar={filteredDosyalar}
          activeDosyaId={activeDosyaId}
          setActiveDosyaId={(id) => {
            setActiveDosyaId(id)
          }}
          formatCurrency={formatCurrency}
          onOpenDetail={handleOpenDetailModal}
          onOpenSurec={(d) => {
            setActiveDosyaId(d.id)
            const route = STAGE_ROUTES[d.durum_asama_id || 1] || '/dosya/hazirlik-ve-ihtiyac'
            navigate({ to: route })
          }}
          onEdit={(dosyaId) => {
            navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` })
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedYil={selectedYil}
          setSelectedYil={setSelectedYil}
          selectedTur={selectedTur}
          setSelectedTur={setSelectedTur}
          uniqueYillar={uniqueYillar}
          totalCount={dosyalar.length}
          onOpenWizard={() => {
            navigate({
              to: APP_ROUTES.YENI_DOSYA,
              search: { initialStage: 1 }
            })
          }}
        />
      )}

      {/* GÖRÜNÜM 3: KOMPAKT LİSTE GÖRÜNÜMÜ */}
      {viewMode === 'list' && (
        <TakipListView
          dosyalar={filteredDosyalar}
          activeDosyaId={activeDosyaId}
          setActiveDosyaId={(id) => {
            setActiveDosyaId(id)
          }}
          formatCurrency={formatCurrency}
          onOpenDetail={handleOpenDetailModal}
          onOpenSurec={(d) => {
            setActiveDosyaId(d.id)
            const route = STAGE_ROUTES[d.durum_asama_id || 1] || '/dosya/hazirlik-ve-ihtiyac'
            navigate({ to: route })
          }}
          onEdit={(dosyaId) => {
            navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` })
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedYil={selectedYil}
          setSelectedYil={setSelectedYil}
          selectedTur={selectedTur}
          setSelectedTur={setSelectedTur}
          uniqueYillar={uniqueYillar}
          totalCount={dosyalar.length}
          onOpenWizard={() => {
            navigate({
              to: APP_ROUTES.YENI_DOSYA,
              search: { initialStage: 1 }
            })
          }}
        />
      )}

      {/* GÖRÜNÜM 2: SEÇİLİ AKTİF DOSYA DETAYI */}
      {viewMode === 'detay' && (
        <>
          {activeDosya ? (
            <div className="space-y-6">
              {/* Hızlı Aksiyon & Durum Çubuğu */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Aktif Dosya:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100/60 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                    {activeDosya.temin_no || 'Dosya No Yok'}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-md">
                    {activeDosya.konu}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEditDosya}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    title="Dosya Bilgilerini Düzenle"
                  >
                    <Edit size={13} />
                    Dosyayı Düzenle
                  </button>

                  <button
                    type="button"
                    onClick={handleSurecAkisi}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    title="Süreç Akışı ve Belge Stüdyosu Ekranını Aç"
                  >
                    <Layers size={13} />
                    Süreç Akışı & Stüdyo
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInNewWindow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Yeni Pencerede Aç"
                  >
                    <ExternalLink size={13} />
                    Yeni Pencere
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors cursor-pointer"
                    title="Dosyayı Sil / İptal Et"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* TAB BAR (SEKMELER) */}
              <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-2xs'
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-t-xl'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.badge !== null && (
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                              isActive
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* SEKME 1: GENEL BAKIŞ & TARİHLER (ÖZET KOKPİTİ) */}
              {activeTab === 'ozet' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 space-y-6">
                      <TakipActiveDosyaSummary
                        activeDosya={activeDosya}
                        kalemler={kalemler}
                        firmalar={firmalar}
                        formatCurrency={formatCurrency}
                        onEditClick={handleEditDosya}
                        onSurecAkisiClick={handleSurecAkisi}
                        onOpenNewWindowClick={handleOpenInNewWindow}
                        onDeleteClick={handleDelete}
                      />

                      <TakipAsamaStepper
                        stages={stages}
                        currentAsamaSira={currentAsamaSira}
                        stageRoutes={STAGE_ROUTES}
                        stageShortLabels={STAGE_SHORT_LABELS}
                      />
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                      {activeDosyaId && (
                        <DosyaNotlariWidget
                          dosyaId={activeDosyaId}
                          dosyaNo={activeDosya?.temin_no}
                        />
                      )}

                      <TakipDosyaTarihlerWidget
                        status={status}
                        setStatus={setStatus}
                        acilisTarihi={acilisTarihi}
                        setAcilisTarihi={setAcilisTarihi}
                        sonTeklifTarihi={sonTeklifTarihi}
                        setSonTeklifTarihi={setSonTeklifTarihi}
                        teminTarihi={teminTarihi}
                        setTeminTarihi={setTeminTarihi}
                        teslimTarihi={teslimTarihi}
                        setTeslimTarihi={setTeslimTarihi}
                        notlar={notlar}
                        setNotlar={setNotlar}
                        saveLoading={saveLoading}
                        saveMessage={saveMessage}
                        onSubmit={handleUpdateDosya}
                      />

                      <TakipUretilenBelgelerWidget
                        dbBelgeler={dbBelgeler}
                        onToggleSign={handleToggleSign}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SEKME 2: MALZEME & FİRMALAR TABLOSU */}
              {activeTab === 'kalemler' && (
                <div className="space-y-6">
                  <TakipKalemlerVeFirmalarGrid kalemler={kalemler} firmalar={firmalar} />
                </div>
              )}

              {/* SEKME 3: YETKİLİ & KOMİSYON BİLGİLERİ */}
              {activeTab === 'komisyon' && (
                <div className="space-y-6">
                  <TakipDosyaDetayBilgileri
                    activeDosya={activeDosya}
                    komisyonlar={komisyonlar}
                    onEditClick={handleEditDosya}
                  />
                </div>
              )}

              {/* SEKME 4: İŞ AKIŞI & MEVZUAT YÖNERGESİ */}
              {activeTab === 'mevzuat' && (
                <div className="space-y-6">
                  <TakipIsAkisiYonergesi />

                  <TakipAsamaAciklamalari stages={stages} currentAsamaSira={currentAsamaSira} />
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Columns3 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  İncelenecek Aktif Dosya Seçilmedi
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Dosya detaylarını ve evraklarını görüntülemek için lütfen Kanban tahtasından bir
                  dosya seçin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Kanban Tahtasına Git
              </button>
            </div>
          )}
        </>
      )}

      {/* GÖRÜNÜM 3: GENEL METRİK VE DAĞILIM GÖRÜNÜMÜ */}
      {viewMode === 'metrik' && (
        <TakipGenelMetrikView
          dosyalar={dosyalar}
          allBelgeler={allBelgeler}
          stages={stages}
          dbAsamalar={dbAsamalar}
          formatCurrency={formatCurrency}
          setActiveDosyaId={(id) => {
            setActiveDosyaId(id)
            setViewMode('detay')
          }}
        />
      )}

      {/* TRELLO BENZERI KART DETAY DIALOG'U */}
      <TakipDosyaDetayDialog
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        dosya={selectedDetailDosya}
        formatCurrency={formatCurrency}
        onEdit={(dosyaId) => {
          handleCloseDetailModal()
          navigate({ to: `${APP_ROUTES.YENI_DOSYA}?id=${dosyaId}` })
        }}
        onOpenSurec={(d) => {
          handleCloseDetailModal()
          setActiveDosyaId(d.id)
          const route = STAGE_ROUTES[d.durum_asama_id || 1] || '/dosya/hazirlik-ve-ihtiyac'
          navigate({ to: route })
        }}
        onDosyaUpdated={handleDosyaUpdatedInModal}
      />
    </div>
  )
}

export default TakipScreen
