import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Personel, PersonelWithRoles, usePersonelHooks } from './personel.hooks'
import { useBirimlerHooks } from '../birimler/birimler.hooks'
import { useKurumHooks } from '../kurum/kurum.hooks'
import { DataViewMode } from '../../components/ui/ViewToggle'
import { PersonelDetailView } from './components/PersonelDetailView'
import { PersonelFormView } from './components/PersonelFormView'
import { PersonelListView } from './components/PersonelListView'
import { PersonelIzinMerkeziView } from './components/PersonelIzinMerkeziView'
import { Users, CalendarDays } from 'lucide-react'

type ScreenState = 'list' | 'view' | 'form'

export default function PersonelScreen({
  isSubComponent = false
}: {
  isSubComponent?: boolean
}): React.ReactNode {
  const {
    personelList,
    rollerList,
    isLoading: isPersonelLoading,
    addPersonel,
    updatePersonel,
    deletePersonel
  } = usePersonelHooks()
  const { birimler } = useBirimlerHooks()
  const { kurumData, fetchKurum } = useKurumHooks()

  useEffect(() => {
    if (!isSubComponent) {
      fetchKurum()
    }
  }, [fetchKurum, isSubComponent])

  const getPersonelTabFromLocation = (): 'kadro' | 'izinler' => {
    if (typeof window === 'undefined') return 'kadro'
    const hash = window.location.hash || ''
    const hashIdx = hash.indexOf('?')
    const hashParams = hashIdx !== -1 ? new URLSearchParams(hash.substring(hashIdx)) : null
    const searchParams = new URLSearchParams(window.location.search)
    return (hashParams?.get('tab') || searchParams.get('tab')) === 'izinler' ? 'izinler' : 'kadro'
  }
  const [activeMainTab, setActiveMainTab] = useState<'kadro' | 'izinler'>(
    getPersonelTabFromLocation()
  )

  useEffect(() => {
    const handleLocationChange = () => {
      setActiveMainTab(getPersonelTabFromLocation())
    }
    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const [screenState, setScreenState] = useState<ScreenState>('list')
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>('grid')
  const [editingPersonel, setEditingPersonel] = useState<Personel | null>(null)
  const [viewingPersonel, setViewingPersonel] = useState<Personel | null>(null)
  const [vcardQrUrl, setVcardQrUrl] = useState<string | null>(null)

  useEffect(() => {
    if (viewingPersonel) {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${viewingPersonel.ad_soyad}`,
        viewingPersonel.unvan ? `TITLE:${viewingPersonel.unvan}` : '',
        viewingPersonel.birim ? `ORG:${viewingPersonel.birim}` : '',
        viewingPersonel.telefon ? `TEL;TYPE=CELL:${viewingPersonel.telefon}` : '',
        viewingPersonel.eposta ? `EMAIL;TYPE=PREF,INTERNET:${viewingPersonel.eposta}` : '',
        'END:VCARD'
      ]
        .filter(Boolean)
        .join('\n')

      QRCode.toDataURL(vcard, {
        margin: 2,
        width: 250,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      })
        .then((url) => setVcardQrUrl(url))
        .catch(console.error)
    } else {
      setTimeout(() => {
        setVcardQrUrl(null)
      }, 0)
    }
  }, [viewingPersonel])

  const [formData, setFormData] = useState<PersonelWithRoles>({
    ad_soyad: '',
    unvan: '',
    gorev: '',
    sicil_no: '',
    birim: '',
    telefon: '',
    eposta: '',
    aktif_mi: 1,
    assignedRoles: [],
    avatar: null
  })

  const openForm = (e?: React.MouseEvent, personel?: Personel): void => {
    if (e) e.stopPropagation()
    if (personel) {
      setEditingPersonel(personel)
      const rolesForPersonel = rollerList
        .filter((r) => r.varsayilan_personel_id === personel.id)
        .map((r) => r.rol_kodu)
      setFormData({
        ...personel,
        gorev: personel.gorev || '',
        assignedRoles: rolesForPersonel
      })
    } else {
      setEditingPersonel(null)
      setFormData({
        ad_soyad: '',
        unvan: '',
        gorev: '',
        sicil_no: '',
        birim: '',
        telefon: '',
        eposta: '',
        aktif_mi: 1,
        assignedRoles: [],
        avatar: null
      })
    }
    setScreenState('form')
  }

  const closeForm = (): void => {
    setScreenState('list')
    setEditingPersonel(null)
  }

  const handleViewClick = (personel: Personel) => {
    setViewingPersonel(personel)
    setScreenState('view')
  }

  const closeView = () => {
    setViewingPersonel(null)
    setScreenState('list')
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      if (editingPersonel) {
        await updatePersonel({ ...formData, id: editingPersonel.id })
      } else {
        await addPersonel(formData)
      }
      closeForm()
    } catch (err) {
      console.error(err)
      alert('Kayıt sırasında bir hata oluştu!')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number): Promise<void> => {
    e.stopPropagation()
    if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      try {
        await deletePersonel(id)
      } catch (err) {
        console.error(err)
        alert('Silme sırasında bir hata oluştu!')
      }
    }
  }

  const toggleRole = (rol_kodu: string, isChecked: boolean) => {
    setFormData((prev) => {
      let roles = prev.assignedRoles || []
      if (isChecked) {
        if (rol_kodu === 'harcama_yetkilisi') {
          roles = [...roles, 'harcama_yetkilisi', 'ihale_yetkilisi']
        } else {
          roles = [...roles, rol_kodu]
        }
        roles = Array.from(new Set(roles))
      } else {
        roles = roles.filter((r) => r !== rol_kodu)
      }
      return { ...prev, assignedRoles: roles }
    })
  }

  if (screenState === 'view' && viewingPersonel) {
    return (
      <PersonelDetailView
        viewingPersonel={viewingPersonel}
        rollerList={rollerList}
        vcardQrUrl={vcardQrUrl}
        closeView={closeView}
        openForm={openForm}
      />
    )
  }

  if (screenState === 'form') {
    return (
      <PersonelFormView
        editingPersonel={editingPersonel}
        formData={formData}
        setFormData={setFormData}
        rollerList={rollerList}
        birimler={birimler}
        kurumData={kurumData}
        closeForm={closeForm}
        handleSubmit={handleSubmit}
        toggleRole={toggleRole}
      />
    )
  }

  return (
    <div
      className={
        isSubComponent ? 'w-full' : 'p-6 max-w-[1600px] mx-auto flex flex-col gap-6 w-full'
      }
    >
      {!isSubComponent && (
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveMainTab('kadro')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'kadro'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kadro & Özlük Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveMainTab('izinler')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMainTab === 'izinler'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>İzin & Rapor Takip Merkezi (657 Memur & 4857 İşçi)</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-400 text-amber-950 font-black shadow-xs">
              MEVZUAT RACONU
            </span>
          </button>
        </div>
      )}

      {activeMainTab === 'izinler' ? (
        <PersonelIzinMerkeziView
          personelList={personelList}
          kurumAdi={kurumData?.kurum_adi}
          harcamaYetkilisiAdi={kurumData?.harcama_yetkilisi}
        />
      ) : (
        <PersonelListView
          personelList={personelList}
          rollerList={rollerList}
          isPersonelLoading={isPersonelLoading}
          isSubComponent={isSubComponent}
          dataViewMode={dataViewMode}
          setDataViewMode={setDataViewMode}
          openForm={openForm}
          handleViewClick={handleViewClick}
          handleDelete={handleDelete}
        />
      )}
    </div>
  )
}
