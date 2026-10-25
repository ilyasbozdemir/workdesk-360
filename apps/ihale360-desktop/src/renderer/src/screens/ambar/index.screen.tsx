import React, { useState } from 'react'
import { AmbarInput, AmbarStok, useAmbarHooks } from './ambar.hooks'
import { Button } from '../../components/ui/Button'
import { ExcelActions } from '../../components/ui/ExcelActions'
import { StokHareketModal } from './components/StokHareketModal'
import { Boxes, Plus, ShieldCheck } from 'lucide-react'
import { AmbarMetrics } from './components/AmbarMetrics'
import { AmbarTabsHeader, AmbarTabType } from './components/AmbarTabsHeader'
import { AmbarDepolariTab } from './components/AmbarDepolariTab'
import { AmbarStoklarTab } from './components/AmbarStoklarTab'
import { AmbarHareketlerTab } from './components/AmbarHareketlerTab'
import { AmbarTiflerTab } from './components/AmbarTiflerTab'
import { AmbarFormModal, emptyAmbar } from './components/AmbarFormModal'

export default function AmbarScreen({
  isSubComponent = false
}: {
  isSubComponent?: boolean
} = {}): React.JSX.Element {
  void isSubComponent

  const [activeTab, setActiveTab] = useState<AmbarTabType>('ambarlar')
  const [selectedAmbarFilter, setSelectedAmbarFilter] = useState<number | ''>('')
  const [searchTerm, setSearchTerm] = useState('')

  const {
    ambarlar,
    isLoadingAmbarlar,
    stoklar,
    isLoadingStoklar,
    hareketler,
    isLoadingHareketler,
    tifler,
    isLoadingTifler,
    addAmbar,
    updateAmbar,
    deleteAmbar,
    deleteTif
  } = useAmbarHooks(selectedAmbarFilter ? Number(selectedAmbarFilter) : undefined)

  const [form, setForm] = useState<AmbarInput>({ ...emptyAmbar })
  const [isAmbarModalOpen, setIsAmbarModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Stok Hareket Modal
  const [isHareketModalOpen, setIsHareketModalOpen] = useState(false)
  const [selectedStokForHareket, setSelectedStokForHareket] = useState<AmbarStok | null>(null)
  const [defaultHareketType, setDefaultHareketType] = useState<
    'giris' | 'cikis' | 'zimmet' | 'iade' | 'hasar'
  >('zimmet')

  const handleSaveAmbar = async (formData: AmbarInput, id: number | null): Promise<void> => {
    try {
      if (id) {
        await updateAmbar({ id, data: formData })
      } else {
        await addAmbar(formData)
      }
      setForm({ ...emptyAmbar })
      setEditId(null)
      setIsAmbarModalOpen(false)
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        alert('Bu ambar adı zaten kayıtlı!')
      } else {
        alert(`Ambar ${id ? 'güncellenirken' : 'eklenirken'} hata oluştu!`)
      }
    }
  }

  const openEdit = (ambar: any): void => {
    setEditId(ambar.id)
    setForm({
      ambar_adi: ambar.ambar_adi || '',
      aciklama: ambar.aciklama || '',
      adres: ambar.adres || '',
      semt: ambar.semt || '',
      posta_kodu: ambar.posta_kodu || '',
      sehir: ambar.sehir || '',
      telefon: ambar.telefon || '',
      faks: ambar.faks || '',
      web_adresi: ambar.web_adresi || '',
      email: ambar.email || '',
      tasinir_kodu: ambar.tasinir_kodu || '',
      tasinir_adi: ambar.tasinir_adi || ''
    })
    setIsAmbarModalOpen(true)
  }

  const handleDeleteAmbar = async (id: number): Promise<void> => {
    if (confirm('Bu ambar kaydını silmek istediğinize emin misiniz?')) {
      try {
        await deleteAmbar(id)
      } catch {
        alert('Silme sırasında hata oluştu!')
      }
    }
  }

  const handleDeleteTif = async (id: number): Promise<void> => {
    if (confirm('Bu TİF kaydını silmek istediğinize emin misiniz? (Stok hareketleri etkilenmez)')) {
      try {
        await deleteTif(id)
      } catch {
        alert('TİF silinirken hata oluştu!')
      }
    }
  }

  const handleOpenHareketModal = (stok: AmbarStok, type: 'zimmet' | 'cikis'): void => {
    setSelectedStokForHareket(stok)
    setDefaultHareketType(type)
    setIsHareketModalOpen(true)
  }

  // Filtered lists
  const filteredStoklar = stoklar.filter((s) => {
    const matchesSearch =
      s.kalem_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tasinir_kodu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ambar_adi?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredHareketler = hareketler.filter((h) => {
    const matchesSearch =
      h.kalem_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.kisi_veya_birim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.belge_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.dosya_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.ambar_adi?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredTifler = tifler.filter((t) => {
    const matchesSearch =
      t.fis_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.dosya_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.dosya_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ambar_adi?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div
      className={
        isSubComponent
          ? 'flex flex-col gap-6 w-full animate-in fade-in duration-200'
          : 'p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full'
      }
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-850 dark:text-slate-100">
            <Boxes className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Ambar &amp; Stok Yönetimi (TİF)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Depolar, anlık stok durumu, taşınır işlem fişleri (TİF) ve zimmet kayıtlarını tek
            merkezden yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ExcelActions tableName="TANIM_Ambar" title="Ambarlar" uniqueCol="id" />
          <Button
            onClick={() => {
              setSelectedStokForHareket(null)
              setDefaultHareketType('zimmet')
              setIsHareketModalOpen(true)
            }}
            variant="outline"
            className="gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 px-3.5 py-2 text-xs"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Stok Hareketi / Zimmet
          </Button>
          <Button
            onClick={() => {
              setEditId(null)
              setForm({ ...emptyAmbar })
              setIsAmbarModalOpen(true)
            }}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md px-4 py-2 text-xs"
          >
            <Plus className="w-4 h-4" /> Yeni Ambar Deposu
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <AmbarMetrics ambarlar={ambarlar} stoklar={stoklar} hareketler={hareketler} tifler={tifler} />

      {/* NAVIGATION TABS & FILTER BAR */}
      <AmbarTabsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ambarlar={ambarlar}
        stoklarCount={stoklar.length}
        hareketlerCount={hareketler.length}
        tiflerCount={tifler.length}
        selectedAmbarFilter={selectedAmbarFilter}
        setSelectedAmbarFilter={setSelectedAmbarFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* TAB CONTENT: AMBARLAR */}
      {activeTab === 'ambarlar' && (
        <AmbarDepolariTab
          ambarlar={ambarlar}
          isLoadingAmbarlar={isLoadingAmbarlar}
          onOpenEdit={openEdit}
          onDeleteAmbar={handleDeleteAmbar}
        />
      )}

      {/* TAB CONTENT: STOK DURUM CETVELİ */}
      {activeTab === 'stoklar' && (
        <AmbarStoklarTab
          filteredStoklar={filteredStoklar}
          isLoadingStoklar={isLoadingStoklar}
          onOpenHareketModal={handleOpenHareketModal}
        />
      )}

      {/* TAB CONTENT: HAREKETLER & ZİMMET */}
      {activeTab === 'hareketler' && (
        <AmbarHareketlerTab
          filteredHareketler={filteredHareketler}
          isLoadingHareketler={isLoadingHareketler}
        />
      )}

      {/* TAB CONTENT: TAŞINIR İŞLEM FİŞLERİ (TİF) */}
      {activeTab === 'tifler' && (
        <AmbarTiflerTab
          filteredTifler={filteredTifler}
          isLoadingTifler={isLoadingTifler}
          onDeleteTif={handleDeleteTif}
        />
      )}

      {/* AMBAR TANIMLAMA / DÜZENLEME MODAL */}
      <AmbarFormModal
        isOpen={isAmbarModalOpen}
        onClose={() => setIsAmbarModalOpen(false)}
        editId={editId}
        initialForm={form}
        onSave={handleSaveAmbar}
      />

      {/* STOK HAREKET / ZİMMET MODAL */}
      <StokHareketModal
        isOpen={isHareketModalOpen}
        onClose={() => {
          setIsHareketModalOpen(false)
          setSelectedStokForHareket(null)
        }}
        initialStok={selectedStokForHareket}
        defaultHareketTuru={defaultHareketType}
      />
    </div>
  )
}
