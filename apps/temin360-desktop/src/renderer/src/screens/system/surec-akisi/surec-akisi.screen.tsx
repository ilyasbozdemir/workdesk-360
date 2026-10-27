import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSurecAkisi } from './hooks/useSurecAkisi'
import { SurecAkisiHeader } from './components/SurecAkisiHeader'
import { BelgeOnizlemeModal } from './components/BelgeOnizlemeModal'
import { OzetTab } from './components/tabs/OzetTab'
import { MalzemeTab } from './components/tabs/MalzemeTab'
import { FirmalarTab } from './components/tabs/FirmalarTab'
import { KomisyonTab } from './components/tabs/KomisyonTab'
import { BelgelerTab } from './components/tabs/BelgelerTab'
import { SurecTab } from './components/tabs/SurecTab'
import { DTEbysStudyosuTab } from './components/DTEbysStudyosuTab'
import { YeniNesilBelgeStudyosuTab } from './components/YeniNesilBelgeStudyosuTab'
import { APP_ROUTES } from '../../../constants/routeConstants'

export default function SurecAkisiScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const {
    activeDosya,
    dosyaContext,
    dosya,
    selectedTab,
    setSelectedTab,
    kalemler,
    firmalar,
    komisyonlar,
    belgeler,
    selectedBelge,
    setSelectedBelge,
    menuAcikId,
    setMenuAcikId,
    previewBelge,
    setPreviewBelge,
    selectedAsamaFilter,
    setSelectedAsamaFilter,
    taranmisBelgeler,
    surukleniyor,
    setSurukleniyor,
    expandedKomisyon,
    setExpandedKomisyon,
    stagesWithStatus,
    toggleTask,
    belgeOlustur,
    dosyalariEkle,
    taranmisBelgeSil,
    toplamBedel,
    overallProgress,
    belgeTamamlanan,
    pdfYuklenenSayisi,
    filteredBelgeler
  } = useSurecAkisi()

  const [isStudioOpen, setIsStudioOpen] = React.useState(false)

  const tabs = [
    { id: 'ozet', label: 'Özet' },
    { id: 'malzeme', label: 'Malzeme Listesi' },
    { id: 'firmalar', label: 'İstekli Firmalar' },
    { id: 'komisyon', label: 'Komisyon' },
    { id: 'belgeler', label: 'Belgeler' },
    { id: 'surec', label: 'Süreç' },
    { id: 'ebys', label: 'EBYS & Resmî Yazışma' }
  ]

  const handleNavigateCiktiMerkezi = () =>
    navigate({ to: APP_ROUTES.CIKTI_MERKEZI_DASHBOARD as any })
  const handleNavigateFirmalar = () => navigate({ to: APP_ROUTES.FIRMALAR as any })
  const handleNavigateKomisyonlar = () => navigate({ to: APP_ROUTES.KOMISYONLAR as any })

  const handleBelgeOlustur = React.useCallback(
    async (b: any) => {
      belgeOlustur(Number(b.id))
    },
    [belgeOlustur]
  )

  const normalizedBelgeler = React.useMemo(() => {
    return belgeler.map((b: any, idx: number) => ({
      ...b,
      id: String(b.kod || b.id || `doc-${idx}`),
      zorunlu: Boolean(b.zorunlu || b.zorunluMu)
    }))
  }, [belgeler])

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900/60 p-6 animate-in fade-in duration-500 overflow-y-auto">
      <div className="w-full space-y-6">
        {/* Header & Stats Banner */}
        <SurecAkisiHeader
          dosya={dosya}
          konu={activeDosya?.konu}
          komisyonlarCount={komisyonlar.length}
          stagesWithStatus={stagesWithStatus}
          onSelectTab={setSelectedTab}
          onOpenStudio={() => setIsStudioOpen(true)}
        />

        {/* Tab Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-955 rounded-t-xl'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Views */}
        {selectedTab === 'ozet' && (
          <OzetTab
            overallProgress={overallProgress}
            pdfYuklenenSayisi={pdfYuklenenSayisi}
            belgelerLength={belgeler.length}
            toplamBedel={toplamBedel}
            kalemlerLength={kalemler.length}
            belgeTamamlanan={belgeTamamlanan}
            stagesWithStatus={stagesWithStatus}
            komisyonlar={komisyonlar}
            onSelectTab={setSelectedTab}
          />
        )}

        {selectedTab === 'malzeme' && (
          <MalzemeTab
            kalemler={kalemler}
            toplamBedel={toplamBedel}
            belgeler={belgeler}
            onPreview={setPreviewBelge}
            onDosyalariEkle={dosyalariEkle}
            onNavigateCiktiMerkezi={handleNavigateCiktiMerkezi}
            onSelectTab={setSelectedTab}
          />
        )}

        {selectedTab === 'firmalar' && (
          <FirmalarTab
            firmalar={firmalar}
            belgeler={belgeler}
            onPreview={setPreviewBelge}
            onDosyalariEkle={dosyalariEkle}
            onNavigateFirmalar={handleNavigateFirmalar}
            onNavigateCiktiMerkezi={handleNavigateCiktiMerkezi}
            onSelectTab={setSelectedTab}
          />
        )}

        {selectedTab === 'komisyon' && (
          <KomisyonTab
            komisyonlar={komisyonlar}
            expandedKomisyon={expandedKomisyon}
            setExpandedKomisyon={setExpandedKomisyon}
            belgeler={belgeler}
            onPreview={setPreviewBelge}
            onDosyalariEkle={dosyalariEkle}
            onNavigateKomisyonlar={handleNavigateKomisyonlar}
            onNavigateCiktiMerkezi={handleNavigateCiktiMerkezi}
            onSelectTab={setSelectedTab}
          />
        )}

        {selectedTab === 'belgeler' && (
          <BelgelerTab
            belgeler={belgeler}
            selectedBelge={selectedBelge}
            setSelectedBelge={setSelectedBelge}
            menuAcikId={menuAcikId}
            setMenuAcikId={setMenuAcikId}
            taranmisBelgeler={taranmisBelgeler}
            surukleniyor={surukleniyor}
            setSurukleniyor={setSurukleniyor}
            onPreview={setPreviewBelge}
            onBelgeOlustur={belgeOlustur}
            onDosyalariEkle={dosyalariEkle}
            onTaranmisBelgeSil={taranmisBelgeSil}
            onNavigateCiktiMerkezi={handleNavigateCiktiMerkezi}
          />
        )}

        {selectedTab === 'surec' && (
          <SurecTab
            stagesWithStatus={stagesWithStatus}
            filteredBelgeler={filteredBelgeler}
            selectedAsamaFilter={selectedAsamaFilter}
            setSelectedAsamaFilter={setSelectedAsamaFilter}
            onToggleTask={toggleTask}
            onSelectTab={setSelectedTab}
            onPreview={setPreviewBelge}
            onDosyalariEkle={dosyalariEkle}
            onNavigateCiktiMerkezi={handleNavigateCiktiMerkezi}
          />
        )}

        {selectedTab === 'ebys' && (
          <DTEbysStudyosuTab
            dosya={dosya || activeDosya || {}}
            kalemler={kalemler || []}
            firmalar={firmalar || []}
            komisyonlar={komisyonlar || []}
            toplamBedel={toplamBedel || 0}
            dosyaContext={dosyaContext}
          />
        )}
      </div>

      {/* Document Preview & Print Modal */}
      <BelgeOnizlemeModal
        previewBelge={previewBelge}
        onClose={() => setPreviewBelge(null)}
        dosya={dosya}
        kalemler={kalemler}
        firmalar={firmalar}
        komisyonlar={komisyonlar}
        toplamBedel={toplamBedel}
        dosyaContext={dosyaContext}
        onBelgeOlustur={belgeOlustur}
        onDosyalariEkle={dosyalariEkle}
      />

      {/* Belge & Resmî Yazışma Stüdyosu - Tam Ekran Stüdyo Modu */}
      {isStudioOpen && (
        <div className="dark fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200 text-slate-100">
          <div className="w-full max-w-7xl mx-auto flex-1">
            <YeniNesilBelgeStudyosuTab
              dosya={dosya}
              belgeler={normalizedBelgeler}
              kalemler={kalemler}
              firmalar={firmalar}
              komisyonlar={komisyonlar}
              toplamBedel={toplamBedel}
              dosyaContext={dosyaContext}
              onBelgeOlustur={handleBelgeOlustur}
              onPreviewBelge={setPreviewBelge}
              onClose={() => setIsStudioOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
