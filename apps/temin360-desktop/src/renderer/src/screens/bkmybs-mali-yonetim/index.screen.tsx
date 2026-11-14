import React, { useState, useEffect, useMemo } from 'react'
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
import {
  loadRealBkmybsData,
  calculateKikKotaFromData
} from '@renderer/services/finance/bkmybsDataService'
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
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
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

  // 2.1 BÜTÇE YILI & TEMİN DOSYASI SEÇİCİ STATE
  const queryYil = searchParams.get('yil')
  const [selectedYil, setSelectedYil] = useState<string>(queryYil || '2026')

  const queryDosyaId = searchParams.get('dosyaId')
  const workspaceDosyaId = useWorkspaceStore((state) => state.activeDosyaId)
  const [selectedDosyaId, setSelectedDosyaId] = useState<number | null>(() => {
    if (queryDosyaId) return Number(queryDosyaId)
    return workspaceDosyaId || null
  })

  // Store'daki activeDosyaId güncellendiğinde burayı da senkronize tut
  useEffect(() => {
    if (workspaceDosyaId !== undefined) {
      setSelectedDosyaId(workspaceDosyaId)
    }
  }, [workspaceDosyaId])

  const handleDosyaChange = (dosyaId: number | null) => {
    setSelectedDosyaId(dosyaId)
    useWorkspaceStore.getState().setActiveDosyaId(dosyaId)
  }

  const handleYilChange = (yil: string) => {
    setSelectedYil(yil)
  }

  // 3. RAW MALİ VERİ MODELLERİ (Veritabanından Re'sen Yüklenir)
  const [rawTertipler, setRawTertipler] = useState<ButceTertip[]>(INITIAL_BUTCE_TERTIPLERI)
  const [rawKikKota, setRawKikKota] = useState<KikKotaModel>(INITIAL_KIK_KOTA)
  const [rawMifListesi, setRawMifListesi] = useState<MifKayit[]>(INITIAL_MIF_LISTESI)
  const [rawTkysListesi, setRawTkysListesi] = useState(INITIAL_TKYS_LISTESI)
  const [rawEmanetListesi, setRawEmanetListesi] = useState(INITIAL_EMANET_LISTESI)
  const [rawSozlesmeListesi, setRawSozlesmeListesi] = useState(INITIAL_SOZLESME_LISTESI)
  const [dosyalar, setDosyalar] = useState<any[]>([])

  // Veritabanındaki gerçek dosyalardan yaklaşık maliyet, onay belgeleri ve hakedişleri re'sen çek
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const realData = await loadRealBkmybsData()
        if (isMounted) {
          if (realData) {
            setRawTertipler(realData.tertipler || [])
            setRawKikKota(realData.kikKota || INITIAL_KIK_KOTA)
            setRawMifListesi(realData.mifListesi || [])
            setRawTkysListesi(realData.tkysListesi || [])
            setRawEmanetListesi(realData.emanetListesi || [])
            setRawSozlesmeListesi(realData.sozlesmeListesi || [])
            setDosyalar(realData.dosyalar || [])
          } else {
            setRawTertipler([])
            setRawKikKota(INITIAL_KIK_KOTA)
            setRawMifListesi([])
            setRawTkysListesi([])
            setRawEmanetListesi([])
            setRawSozlesmeListesi([])
            setDosyalar([])
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

  // 3.1 DİNAMİK YIL LİSTESİ
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>(['2026', '2025', '2024'])
    dosyalar.forEach((d) => {
      const y = d.butce_yili || (d.tarih ? new Date(d.tarih).getFullYear() : null)
      if (y) yearsSet.add(String(y))
    })
    rawTertipler.forEach((t) => {
      if (t.yil) yearsSet.add(String(t.yil))
    })
    const sorted = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a))
    return [...sorted, 'ALL']
  }, [dosyalar, rawTertipler])

  // 3.2 FİLTRELENMİŞ TERTİPLER & DOSYALAR
  const tertipler = useMemo(() => {
    if (selectedYil === 'ALL') return rawTertipler
    const yNum = Number(selectedYil)
    const matched = rawTertipler.filter((t) => t.yil === yNum)
    return matched.length > 0 ? matched : rawTertipler
  }, [rawTertipler, selectedYil])

  const filteredDosyalar = useMemo(() => {
    if (selectedYil === 'ALL') return dosyalar
    const yNum = Number(selectedYil)
    return dosyalar.filter((d) => {
      const dYil = Number(d.butce_yili) || (d.tarih ? new Date(d.tarih).getFullYear() : 2026)
      return dYil === yNum
    })
  }, [dosyalar, selectedYil])

  // 3.3 RE'SEN YENİDEN HESAPLANAN 22/D KİK KOTASI
  const kikKota = useMemo(() => {
    return calculateKikKotaFromData(tertipler, filteredDosyalar, rawKikKota.idareTuru)
  }, [tertipler, filteredDosyalar, rawKikKota.idareTuru])

  // 3.4 FİLTRELENMİŞ MİF, TKYS, SÖZLEŞME VE EMANET LİSTELERİ
  const mifListesi = useMemo(() => {
    return rawMifListesi.filter((m) => {
      if (selectedDosyaId && m.dosyaId !== selectedDosyaId) return false
      if (selectedYil !== 'ALL') {
        const mYil = m.tarih
          ? new Date(m.tarih).getFullYear()
          : m.faturaTarihi
          ? new Date(m.faturaTarihi).getFullYear()
          : 2026
        if (mYil !== Number(selectedYil) && !m.mifNo.includes(selectedYil)) return false
      }
      return true
    })
  }, [rawMifListesi, selectedYil, selectedDosyaId])

  const tkysListesi = useMemo(() => {
    return rawTkysListesi.filter((t) => {
      if (selectedDosyaId) {
        if (t.dosyaId) {
          if (t.dosyaId !== selectedDosyaId) return false
        } else {
          const matchDosya = dosyalar.find((d) => d.id === selectedDosyaId)
          if (matchDosya && t.dosyaNo !== matchDosya.temin_no) return false
        }
      }
      if (selectedYil !== 'ALL') {
        const tYil = t.muayeneKabulTarihi ? new Date(t.muayeneKabulTarihi).getFullYear() : 2026
        if (tYil !== Number(selectedYil) && !t.tifNo.includes(selectedYil)) return false
      }
      return true
    })
  }, [rawTkysListesi, selectedYil, selectedDosyaId, dosyalar])

  const sozlesmeListesi = useMemo(() => {
    return rawSozlesmeListesi.filter((s) => {
      if (selectedDosyaId) {
        if (s.dosyaId) {
          if (s.dosyaId !== selectedDosyaId) return false
        } else {
          const matchDosya = dosyalar.find((d) => d.id === selectedDosyaId)
          if (matchDosya && s.dosyaNo !== matchDosya.temin_no) return false
        }
      }
      if (selectedYil !== 'ALL') {
        const sYil = s.sozlesmeTarihi ? new Date(s.sozlesmeTarihi).getFullYear() : 2026
        if (sYil !== Number(selectedYil) && !s.sozlesmeNo.includes(selectedYil)) return false
      }
      return true
    })
  }, [rawSozlesmeListesi, selectedYil, selectedDosyaId, dosyalar])

  const emanetListesi = useMemo(() => {
    return rawEmanetListesi.filter((e) => {
      if (selectedDosyaId) {
        if (e.dosyaId) {
          if (e.dosyaId !== selectedDosyaId) return false
        } else {
          const matchDosya = dosyalar.find((d) => d.id === selectedDosyaId)
          if (matchDosya && e.dosyaNo !== matchDosya.temin_no) return false
        }
      }
      if (selectedYil !== 'ALL') {
        const eYil = e.alinisTarihi ? new Date(e.alinisTarihi).getFullYear() : 2026
        if (eYil !== Number(selectedYil)) return false
      }
      return true
    })
  }, [rawEmanetListesi, selectedYil, selectedDosyaId, dosyalar])

  // 4. MODALLAR STATE
  const [isAktarModalOpen, setIsAktarModalOpen] = useState(false)

  // İdare Türü Güncelleme (Büyükşehir vs Diğer)
  const handleUpdateIdareTuru = (turu: 'buyuksehir' | 'diger') => {
    const newEsik = turu === 'buyuksehir' ? 864500 : 288100
    setRawKikKota((prev) => ({
      ...prev,
      idareTuru: turu,
      esikDeger: newEsik
    }))
  }

  // MİF Durum Güncelleme
  const handleMifDurumGuncelle = (mifId: string, yeniDurum: MifKayit['durum']) => {
    setRawMifListesi((prev) =>
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
    setRawMifListesi((prev) => [yeniMif, ...prev])
    handleTabChange('mif')
  }

  // Özet İstatistik Hesaplamaları (Filtrelenmiş verilere göre)
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
        selectedYil={selectedYil}
        onYilChange={handleYilChange}
        availableYears={availableYears}
        selectedDosyaId={selectedDosyaId}
        onDosyaChange={handleDosyaChange}
        dosyalar={dosyalar}
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
          <DosyalarVeFaturalariTab
            activeRole={activeRole}
            selectedYil={selectedYil}
            selectedDosyaId={selectedDosyaId}
          />
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
