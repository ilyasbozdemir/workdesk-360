import React, { useState, useEffect } from 'react'
import { useRouterState, useNavigate } from '@tanstack/react-router'
import {
  BkmybsTabKey,
  KamuRole,
  MifKayit,
  KikKotaModel,
  ButceTertip
} from './types'
import {
  INITIAL_BUTCE_TERTIPLERI,
  INITIAL_KIK_KOTA,
  INITIAL_MIF_LISTESI,
  INITIAL_TKYS_LISTESI,
  INITIAL_EMANET_LISTESI,
  INITIAL_SOZLESME_LISTESI
} from './bkmybsMockData'
import { loadRealBkmybsData } from '@renderer/services/finance/bkmybsDataService'
import { BkmybsHeader } from './components/BkmybsHeader'
import { ButceOdenekTab } from './components/tabs/ButceOdenekTab'
import { KikLimitTab } from './components/tabs/KikLimitTab'
import { MifOebTab } from './components/tabs/MifOebTab'
import { TkysZimmetTab } from './components/tabs/TkysZimmetTab'
import { EmanetTeminatTab } from './components/tabs/EmanetTeminatTab'
import { SozlesmeTaahhutTab } from './components/tabs/SozlesmeTaahhutTab'
import { MaliIslemlereAktarModal } from './components/modals/MaliIslemlereAktarModal'
import { DosyalarVeFaturalariTab } from './components/tabs/DosyalarVeFaturalariTab'
import { MevzuatScreen } from '@renderer/screens/system/MevzuatScreen'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { useTabStore } from '@renderer/store/tabStore'
import { useGlobalDocumentPreviewStore } from '@renderer/store/globalDocumentPreviewStore'

export default function BkmybsMaliYonetimScreen(): React.JSX.Element {
  const router = useRouterState()
  const navigate = useNavigate()
  const { addTab } = useTabStore()
  const { institutionName } = useSettingsStore()

  // 1. ROL MODELİ (RBAC) STATE
  const [activeRole, setActiveRole] = useState<KamuRole>(() => {
    const saved = localStorage.getItem('bkmybs_active_role')
    return (saved as KamuRole) || 'mali_hizmetler'
  })

  const handleRoleChange = (role: KamuRole) => {
    setActiveRole(role)
    localStorage.setItem('bkmybs_active_role', role)
  }

  // 2. SEKMELER VE URL (?tab=...) SENKRONİZASYONU
  const searchStr =
    typeof router.location.search === 'string'
      ? router.location.search
      : typeof window !== 'undefined'
      ? window.location.search
      : ''
  const searchParams = new URLSearchParams(searchStr || '')
  const queryTab = searchParams.get('tab') as BkmybsTabKey | null
  const [activeTab, setActiveTab] = useState<BkmybsTabKey>(queryTab || 'butce')

  useEffect(() => {
    if (queryTab && ['butce', 'limit', 'mif', 'tkys', 'emanet', 'sozlesme', 'dosyalar', 'mevzuat'].includes(queryTab)) {
      setActiveTab(queryTab)
    }
  }, [queryTab])

  const handleTabChange = (tab: BkmybsTabKey) => {
    setActiveTab(tab)
    const newPath = `/bkmybs-mali-yonetim?tab=${tab}`
    addTab(newPath)
    navigate({ to: newPath })
  }

  // 3. MALİ VERİ MODELLERİ (Veritabanından Re'sen Yüklenir)
  const [tertipler, setTertipler] = useState<ButceTertip[]>(INITIAL_BUTCE_TERTIPLERI)
  const [kikKota, setKikKota] = useState<KikKotaModel>(INITIAL_KIK_KOTA)
  const [mifListesi, setMifListesi] = useState<MifKayit[]>(INITIAL_MIF_LISTESI)
  const [tkysListesi, setTkysListesi] = useState(INITIAL_TKYS_LISTESI)
  const [emanetListesi, setEmanetListesi] = useState(INITIAL_EMANET_LISTESI)
  const [sozlesmeListesi, setSozlesmeListesi] = useState(INITIAL_SOZLESME_LISTESI)

  // Veritabanındaki gerçek dosyalardan yaklaşık maliyet, onay belgeleri ve hakedişleri re'sen çek
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const realData = await loadRealBkmybsData()
        if (isMounted) {
          if (realData) {
            setTertipler(realData.tertipler || [])
            setKikKota(realData.kikKota || INITIAL_KIK_KOTA)
            setMifListesi(realData.mifListesi || [])
            setTkysListesi(realData.tkysListesi || [])
            setEmanetListesi(realData.emanetListesi || [])
            setSozlesmeListesi(realData.sozlesmeListesi || [])
          } else {
            setTertipler([])
            setKikKota(INITIAL_KIK_KOTA)
            setMifListesi([])
            setTkysListesi([])
            setEmanetListesi([])
            setSozlesmeListesi([])
          }
        }
      } catch (err) {
        console.error('Mali veriler yüklenirken hata oluştu:', err)
      }
    }
    void fetchData()

    const handleRefresh = () => {
      void fetchData()
    }
    window.addEventListener('app:db-changed', handleRefresh)
    window.addEventListener('focus', handleRefresh)

    return () => {
      isMounted = false
      window.removeEventListener('app:db-changed', handleRefresh)
      window.removeEventListener('focus', handleRefresh)
    }
  }, [])

  // 4. MODALLAR STATE
  const [isAktarModalOpen, setIsAktarModalOpen] = useState(false)

  // İdare Türü Güncelleme (Büyükşehir vs Diğer)
  const handleUpdateIdareTuru = (turu: 'buyuksehir' | 'diger') => {
    const newEsik = turu === 'buyuksehir' ? 864500 : 288100
    setKikKota((prev) => ({
      ...prev,
      idareTuru: turu,
      esikDeger: newEsik
    }))
  }

  // MİF Durum Güncelleme
  const handleMifDurumGuncelle = (mifId: string, yeniDurum: MifKayit['durum']) => {
    setMifListesi((prev) =>
      prev.map((m) =>
        m.id === mifId
          ? {
              ...m,
              durum: yeniDurum,
              onaylayan:
                yeniDurum === 'onaylandi' ? 'Sistem Yöneticisi (Harcama Yetkilisi)' : m.onaylayan
            }
          : m
      )
    )
  }

  // Yeni MİF Ekleme (Mali İşlemlere Aktarım Sonrası)
  const handleYeniMifEklendi = (yeniMif: MifKayit) => {
    setMifListesi((prev) => [yeniMif, ...prev])
    handleTabChange('mif')
  }

  // Özet İstatistik Hesaplamaları
  const toplamKullanilabilirOdenek = tertipler.reduce((acc, t) => acc + t.kullanilabilirOdenek, 0)
  const toplamBaslangicOdenegi = tertipler.reduce((acc, t) => acc + t.baslangicOdenegi, 0)
  const bekleyenMifSayisi = mifListesi.filter((m) => m.durum !== 'onaylandi').length
  const onayliMifSayisi = mifListesi.filter((m) => m.durum === 'onaylandi').length
  const bekleyenTifSayisi = tkysListesi.filter((t) => t.durum === 'ambarda').length
  const aktifTeminatToplami = emanetListesi
    .filter((e) => e.iadeDurumu === 'emanette')
    .reduce((acc, e) => acc + e.tutar, 0)
  const yururlukteSozlesmeBedeli = sozlesmeListesi
    .filter((s) => s.durum === 'yururlukte')
    .reduce((acc, s) => acc + s.sozlesmeBedeli, 0)

  return (
    <div className="p-6 md:p-8 w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500 max-w-7xl mx-auto">
      {/* 1. ÜST COMMAND BAR, SWITCHER & METRİKLER */}
      <BkmybsHeader
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        kikKota={kikKota}
        toplamKullanilabilirOdenek={toplamKullanilabilirOdenek}
        toplamBaslangicOdenegi={toplamBaslangicOdenegi}
        bekleyenMifSayisi={bekleyenMifSayisi}
        onayliMifSayisi={onayliMifSayisi}
        bekleyenTifSayisi={bekleyenTifSayisi}
        aktifTeminatToplami={aktifTeminatToplami}
        yururlukteSozlesmeBedeli={yururlukteSozlesmeBedeli}
      />

      {/* 2. AKTİF SEKME İÇERİĞİ */}
      <div className="min-h-[500px]">
        {activeTab === 'butce' && (
          <ButceOdenekTab tertipler={tertipler} activeRole={activeRole} />
        )}

        {activeTab === 'limit' && (
          <KikLimitTab
            kikKota={kikKota}
            onUpdateIdareTuru={handleUpdateIdareTuru}
            activeRole={activeRole}
          />
        )}

        {activeTab === 'mif' && (
          <MifOebTab
            mifListesi={mifListesi}
            onOpenOebModal={(mif) => {
              useGlobalDocumentPreviewStore.getState().openDocument({
                documentId: 'odeme-yazisi',
                dosyaId: mif.dosyaId,
                documentTitle: `Ödeme Emri Belgesi — ${mif.dosyaNo || '#' + mif.dosyaId}`
              })
            }}
            onMifDurumGuncelle={handleMifDurumGuncelle}
            activeRole={activeRole}
          />
        )}

        {activeTab === 'tkys' && (
          <TkysZimmetTab tkysListesi={tkysListesi} activeRole={activeRole} />
        )}

        {activeTab === 'emanet' && (
          <EmanetTeminatTab emanetListesi={emanetListesi} activeRole={activeRole} />
        )}

        {activeTab === 'sozlesme' && (
          <SozlesmeTaahhutTab sozlesmeListesi={sozlesmeListesi} activeRole={activeRole} />
        )}

        {activeTab === 'dosyalar' && (
          <DosyalarVeFaturalariTab activeRole={activeRole} />
        )}

        {activeTab === 'mevzuat' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
            <MevzuatScreen />
          </div>
        )}
      </div>

      {/* 4. MALİ İŞLEMLERE AKTAR & MİF ÜRET MODALI */}
      <MaliIslemlereAktarModal
        isOpen={isAktarModalOpen}
        onClose={() => setIsAktarModalOpen(false)}
        tertipler={tertipler}
        onAktar={handleYeniMifEklendi}
      />
    </div>
  )
}
