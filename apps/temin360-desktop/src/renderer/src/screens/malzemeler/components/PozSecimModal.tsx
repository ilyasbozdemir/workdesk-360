import React, { useEffect, useMemo, useState } from 'react'
import { getDinamikFiyatDonemleri, POZ_KURUMLARI, PozItem } from './pozKitaplari.data'
import { useTabStore } from '../../../store/tabStore'
import { APP_ROUTES } from '../../../constants/routeConstants'
import { PozSecimHeader } from './poz-secim/PozSecimHeader'
import { PozKatalogTab } from './poz-secim/PozKatalogTab'
import { PozOzelPozTab } from './poz-secim/PozOzelPozTab'
import { PozSecimFooter } from './poz-secim/PozSecimFooter'

export type SelectedPozData = PozItem

interface PozSecimModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPoz: (data: SelectedPozData) => void
  currentPozNo?: string
  currentYear?: number
}

export const PozSecimModal: React.FC<PozSecimModalProps> = ({
  isOpen,
  onClose,
  onSelectPoz,
  currentPozNo = '',
  currentYear = new Date().getFullYear()
}) => {
  const [activeTab, setActiveTab] = useState<'katalog' | 'ozel_poz'>('katalog')

  // Veritabanından Yapım Pozları
  const [dbPozlar, setDbPozlar] = useState<PozItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Filtreler
  const [selectedKurum, setSelectedKurum] = useState<string>('ALL')
  const [selectedYil, setSelectedYil] = useState<number>(currentYear)
  const [selectedDonem, setSelectedDonem] = useState<string>(`${currentYear}/1`)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Özel Poz Form State
  const [ozelPozNo, setOzelPozNo] = useState<string>(
    currentPozNo?.startsWith('ÖZEL') || currentPozNo?.startsWith('ÖZ') ? currentPozNo : 'ÖZEL.01'
  )
  const [ozelPozAdi, setOzelPozAdi] = useState<string>('')
  const [ozelPozBirim, setOzelPozBirim] = useState<string>('m²')
  const [ozelPozKurum, setOzelPozKurum] = useState<string>('ÇŞB')
  const [ozelPozYili, setOzelPozYili] = useState<number>(currentYear)
  const [ozelFiyatDonemi, setOzelFiyatDonemi] = useState<string>(`${currentYear}/1`)
  const [ozelOkasKodu, setOzelOkasKodu] = useState<string>('45000000')
  const [ozelYapiSinifi, setOzelYapiSinifi] = useState<string>('Genel Yapım İşleri')
  const [ozelAnalizTarifi, setOzelAnalizTarifi] = useState<string>('')

  // Dinamik Fiyat Araştırma Dönemleri Listesi
  const katalogDinamikDonemler = useMemo(() => getDinamikFiyatDonemleri(selectedYil), [selectedYil])
  const ozelPozDinamikDonemler = useMemo(() => getDinamikFiyatDonemleri(ozelPozYili), [ozelPozYili])

  // Pozları veritabanından dinamik çek
  useEffect(() => {
    if (!isOpen) return

    const loadPozlar = async () => {
      try {
        setIsLoading(true)
        if (window.electron?.ipcRenderer) {
          const res = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT * FROM TANIM_Kalem 
             WHERE tipi = 'Yapım' 
                OR (poz_no IS NOT NULL AND poz_no != '')
             ORDER BY id DESC`
          )
          if (res?.success && Array.isArray(res.data)) {
            const mapped: PozItem[] = res.data.map((item: any) => ({
              id: item.id,
              poz_no: item.poz_no || item.barkod_id || `POZ-${item.id}`,
              kalem_adi: item.kalem_adi,
              poz_tanimi: item.poz_tanimi || item.kalem_adi,
              birim: item.birim || item.olcu_birimi || 'm²',
              poz_kurumu: item.kategori || item.poz_grubu_ref_id || 'ÇŞB',
              poz_yili: item.poz_yili ? Number(item.poz_yili) : undefined,
              fiyat_donemi: item.fiyat_donemi || '',
              okas_kodu: item.okas_kodu || '45000000',
              yapi_sinifi: item.yapi_sinifi || item.kategori || 'Genel Yapım İşleri',
              ozelligi: item.ozelligi || item.notlar || ''
            }))
            setDbPozlar(mapped)
          }
        }
      } catch (e) {
        console.error('Pozlar yüklenemedi:', e)
      } finally {
        setIsLoading(false)
      }
    }

    loadPozlar()
  }, [isOpen])

  // Filtreleme
  const filteredPozlar = useMemo(() => {
    return dbPozlar.filter((item) => {
      // Kurum Filtresi
      if (selectedKurum !== 'ALL') {
        const itemKurum = (item.poz_kurumu || '').toLowerCase()
        const targetKurum = selectedKurum.toLowerCase()
        if (
          !itemKurum.includes(targetKurum) &&
          !POZ_KURUMLARI.find((k) => k.id === selectedKurum)
            ?.name.toLowerCase()
            .includes(itemKurum)
        ) {
          return false
        }
      }

      // Yıl Filtresi
      if (selectedYil && item.poz_yili && item.poz_yili !== selectedYil) {
        return false
      }

      // Arama
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNo = item.poz_no?.toLowerCase().includes(q)
        const matchAdi = item.kalem_adi?.toLowerCase().includes(q)
        const matchTanim = item.poz_tanimi?.toLowerCase().includes(q)
        const matchKurum = item.poz_kurumu?.toLowerCase().includes(q)
        const matchYapi = item.yapi_sinifi?.toLowerCase().includes(q)
        const matchOkas = item.okas_kodu?.toLowerCase().includes(q)
        return matchNo || matchAdi || matchTanim || matchKurum || matchYapi || matchOkas
      }

      return true
    })
  }, [dbPozlar, selectedKurum, selectedYil, searchQuery])

  if (!isOpen) return null

  const handleSelectPozItem = (item: PozItem) => {
    onSelectPoz({
      ...item,
      fiyat_donemi: selectedDonem || item.fiyat_donemi || `${selectedYil}/1`,
      poz_yili: selectedYil || item.poz_yili
    })
    onClose()
  }

  const handleOpenPozlarScreen = () => {
    onClose()
    useTabStore.getState().addTab(APP_ROUTES.POZLAR)
  }

  const handleApplyOzelPoz = () => {
    if (!ozelPozAdi.trim()) {
      alert('Lütfen Poz / İmalat Tanımı ve Adını giriniz.')
      return
    }
    if (!ozelPozNo.trim()) {
      alert('Lütfen Poz Numarasını giriniz.')
      return
    }

    onSelectPoz({
      poz_no: ozelPozNo.trim(),
      kalem_adi: ozelPozAdi.trim(),
      poz_tanimi: ozelPozAdi.trim(),
      birim: ozelPozBirim,
      yapi_sinifi: ozelYapiSinifi,
      okas_kodu: ozelOkasKodu.trim(),
      poz_yili: ozelPozYili,
      fiyat_donemi: ozelFiyatDonemi,
      poz_kurumu: ozelPozKurum.trim(),
      ozelligi: ozelAnalizTarifi.trim() || `Özel Analizli Poz (${ozelPozNo})`
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <PozSecimHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          katalogCount={filteredPozlar.length}
          onOpenPozlarScreen={handleOpenPozlarScreen}
          onClose={onClose}
        />

        {/* Tab 1: Kayıtlı Poz Havuzu */}
        {activeTab === 'katalog' && (
          <PozKatalogTab
            selectedKurum={selectedKurum}
            setSelectedKurum={setSelectedKurum}
            selectedYil={selectedYil}
            setSelectedYil={setSelectedYil}
            selectedDonem={selectedDonem}
            setSelectedDonem={setSelectedDonem}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            katalogDinamikDonemler={katalogDinamikDonemler}
            isLoading={isLoading}
            filteredPozlar={filteredPozlar}
            onSelectPozItem={handleSelectPozItem}
            onSwitchToOzelPoz={() => setActiveTab('ozel_poz')}
            onOpenPozlarScreen={handleOpenPozlarScreen}
          />
        )}

        {/* Tab 2: Kitapta Olmayan Özel Poz Tanımla */}
        {activeTab === 'ozel_poz' && (
          <PozOzelPozTab
            ozelPozKurum={ozelPozKurum}
            setOzelPozKurum={setOzelPozKurum}
            ozelPozNo={ozelPozNo}
            setOzelPozNo={setOzelPozNo}
            ozelPozAdi={ozelPozAdi}
            setOzelPozAdi={setOzelPozAdi}
            ozelPozYili={ozelPozYili}
            setOzelPozYili={setOzelPozYili}
            ozelFiyatDonemi={ozelFiyatDonemi}
            setOzelFiyatDonemi={setOzelFiyatDonemi}
            ozelPozBirim={ozelPozBirim}
            setOzelPozBirim={setOzelPozBirim}
            ozelOkasKodu={ozelOkasKodu}
            setOzelOkasKodu={setOzelOkasKodu}
            ozelYapiSinifi={ozelYapiSinifi}
            setOzelYapiSinifi={setOzelYapiSinifi}
            ozelAnalizTarifi={ozelAnalizTarifi}
            setOzelAnalizTarifi={setOzelAnalizTarifi}
            ozelPozDinamikDonemler={ozelPozDinamikDonemler}
          />
        )}

        {/* Modal Footer */}
        <PozSecimFooter
          activeTab={activeTab}
          onClose={onClose}
          onApplyOzelPoz={handleApplyOzelPoz}
        />
      </div>
    </div>
  )
}
