import React, { useState, useEffect } from 'react'
import { DEFAULT_2886_DOSYALAR } from '../../../components/layout/temin-selector/teminSelector.constants'
import {
  getInitial2886Dosyalar,
  persist2886Dosyalar,
  persist2886ActiveDosya
} from '../../../components/layout/temin-selector/teminSelector.storage'
import { Dosya2886Item } from '../../../components/layout/temin-selector/teminSelector.types'
import { DosyaYonetimi2886Stats } from './dosya-yonetimi/DosyaYonetimi2886Stats'
import { DosyaYonetimi2886FilterBar } from './dosya-yonetimi/DosyaYonetimi2886FilterBar'
import { DosyaYonetimi2886Grid } from './dosya-yonetimi/DosyaYonetimi2886Grid'
import { DosyaYonetimi2886Table } from './dosya-yonetimi/DosyaYonetimi2886Table'
import { DosyaYonetimi2886Modal, Dosya2886FormData } from './dosya-yonetimi/DosyaYonetimi2886Modal'
import { DosyaYonetimi2886DeleteModal } from './dosya-yonetimi/DosyaYonetimi2886DeleteModal'

export type { Dosya2886Item }

interface DosyaYonetimi2886TabProps {
  onSelectDosya?: (dosya: Dosya2886Item) => void
  onOpenStudyo?: () => void
  activeDosyaId?: string
}

export function DosyaYonetimi2886Tab({
  onSelectDosya,
  onOpenStudyo,
  activeDosyaId
}: DosyaYonetimi2886TabProps): React.JSX.Element {
  const [dosyalar, setDosyalar] = useState<Dosya2886Item[]>(() => getInitial2886Dosyalar())

  // Başlık (Header) seçici ve diğer pencerelerle %100 Gerçek Zamanlı Senkronizasyon
  useEffect(() => {
    const handleReload = (): void => {
      setDosyalar(getInitial2886Dosyalar())
    }

    window.addEventListener('devlet-ihale-2886-reloaded', handleReload)
    window.addEventListener('storage', handleReload)
    return () => {
      window.removeEventListener('devlet-ihale-2886-reloaded', handleReload)
      window.removeEventListener('storage', handleReload)
    }
  }, [])

  // Yardımcı Kaydetme ve Yayınlama Fonksiyonu
  const saveAndBroadcast = (newList: Dosya2886Item[]): void => {
    setDosyalar(newList)
    persist2886Dosyalar(newList)
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTur, setFilterTur] = useState<string>('hepsi')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Modallar
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingDosya, setEditingDosya] = useState<Dosya2886Item | null>(null)
  const [deleteModalDosya, setDeleteModalDosya] = useState<Dosya2886Item | null>(null)

  // Hızlı Ekle / Düzenle Form State
  const [formData, setFormData] = useState<Dosya2886FormData>({
    ihaleKayitNo: '',
    ihaleAdi: '',
    islemTuru: 'satis',
    usul: 'acik_teklif_45',
    muhammenBedel: 2500000,
    ihaleTarihi: new Date().toISOString().split('T')[0],
    ihaleSaati: '14:00',
    ihaleYeri: 'Belediye Encümen Toplantı Salonu',
    il: 'Ankara',
    ilce: 'Çankaya',
    mahalleKoy: 'Merkez Mah.',
    ada: '101',
    parsel: '1',
    yuzolcumuM2: 500,
    cinsi: 'Arsa Satışı',
    adres: ''
  })

  const openNewModal = (): void => {
    setEditingDosya(null)
    setFormData({
      ihaleKayitNo: `2026/2886-ST-0${dosyalar.length + 1}`,
      ihaleAdi: '',
      islemTuru: 'satis',
      usul: 'acik_teklif_45',
      muhammenBedel: 2500000,
      ihaleTarihi: new Date().toISOString().split('T')[0],
      ihaleSaati: '14:00',
      ihaleYeri: 'Belediye Encümen Toplantı Salonu',
      il: 'Ankara',
      ilce: 'Çankaya',
      mahalleKoy: 'Merkez Mah.',
      ada: '101',
      parsel: '1',
      yuzolcumuM2: 500,
      cinsi: 'Arsa Satışı',
      adres: ''
    })
    setShowNewModal(true)
  }

  const openEditModal = (dosya: Dosya2886Item): void => {
    setEditingDosya(dosya)
    setFormData({
      ihaleKayitNo: dosya.ihaleKayitNo,
      ihaleAdi: dosya.ihaleAdi,
      islemTuru: dosya.islemTuru,
      usul: dosya.usul,
      muhammenBedel:
        dosya.muhammenBedel?.takdirEdilenMuhammenBedel || dosya.muhammenBedel?.hesaplananBedel || 0,
      ihaleTarihi: dosya.ihaleTarihi,
      ihaleSaati: dosya.ihaleSaati || '14:00',
      ihaleYeri: dosya.ihaleYeri || 'Belediye Encümen Toplantı Salonu',
      il: dosya.tasinmaz?.il || '',
      ilce: dosya.tasinmaz?.ilce || '',
      mahalleKoy: dosya.tasinmaz?.mahalleKoy || '',
      ada: dosya.tasinmaz?.ada || '',
      parsel: dosya.tasinmaz?.parsel || '',
      yuzolcumuM2: dosya.tasinmaz?.yuzolcumuM2 || 0,
      cinsi: dosya.tasinmaz?.cinsi || '',
      adres: dosya.tasinmaz?.adres || ''
    })
    setShowNewModal(true)
  }

  const handleSaveQuickDosya = (e: React.FormEvent, openInStudio = false): void => {
    e.preventDefault()
    if (!formData.ihaleAdi.trim()) return

    const bedel = Number(formData.muhammenBedel) || 0
    const geciciTeminat = Math.round(bedel * 0.03)

    let savedItem: Dosya2886Item

    if (editingDosya) {
      savedItem = {
        ...editingDosya,
        ihaleKayitNo: formData.ihaleKayitNo,
        ihaleAdi: formData.ihaleAdi,
        islemTuru: formData.islemTuru,
        usul: formData.usul,
        ihaleTarihi: formData.ihaleTarihi,
        ihaleSaati: formData.ihaleSaati,
        ihaleYeri: formData.ihaleYeri,
        tasinmaz: {
          ...editingDosya.tasinmaz,
          il: formData.il,
          ilce: formData.ilce,
          mahalleKoy: formData.mahalleKoy,
          ada: formData.ada,
          parsel: formData.parsel,
          yuzolcumuM2: Number(formData.yuzolcumuM2) || 0,
          cinsi: formData.cinsi,
          adres: formData.adres
        },
        muhammenBedel: {
          ...editingDosya.muhammenBedel,
          hesaplananBedel: bedel,
          takdirEdilenMuhammenBedel: bedel,
          geciciTeminatTutari: geciciTeminat
        }
      }
      const updatedList = dosyalar.map((d) => (d.id === editingDosya.id ? savedItem : d))
      saveAndBroadcast(updatedList)
    } else {
      savedItem = {
        id: `2886-${Date.now()}`,
        ihaleKayitNo: formData.ihaleKayitNo,
        ihaleAdi: formData.ihaleAdi,
        islemTuru: formData.islemTuru,
        usul: formData.usul,
        ihaleTarihi: formData.ihaleTarihi,
        ihaleSaati: formData.ihaleSaati,
        ihaleYeri: formData.ihaleYeri,
        tasinmaz: {
          il: formData.il,
          ilce: formData.ilce,
          mahalleKoy: formData.mahalleKoy,
          ada: formData.ada,
          parsel: formData.parsel,
          yuzolcumuM2: Number(formData.yuzolcumuM2) || 0,
          cinsi: formData.cinsi,
          hisseOrani: '1/1',
          mevcutDurumu: 'Boş',
          adres: formData.adres
        },
        muhammenBedel: {
          hesaplananBedel: bedel,
          takdirEdilenMuhammenBedel: bedel,
          geciciTeminatTutari: geciciTeminat,
          kdvOrani: 20
        }
      }
      const updatedList = [savedItem, ...dosyalar]
      saveAndBroadcast(updatedList)
    }

    persist2886ActiveDosya(savedItem)
    setShowNewModal(false)
    setEditingDosya(null)

    if (openInStudio && onSelectDosya) {
      onSelectDosya(savedItem)
    }
  }

  // Kesin ve Kalıcı Silme Fonksiyonu
  const handleDeleteConfirm = (): void => {
    if (!deleteModalDosya) return
    const idToDelete = deleteModalDosya.id
    const kayitNoToDelete = deleteModalDosya.ihaleKayitNo

    const updatedList = dosyalar.filter(
      (d) => d.id !== idToDelete && d.ihaleKayitNo !== kayitNoToDelete
    )

    try {
      const activeRaw = localStorage.getItem('temin_2886_active_dosya')
      if (activeRaw) {
        const activeItem = JSON.parse(activeRaw)
        if (activeItem.id === idToDelete || activeItem.ihaleKayitNo === kayitNoToDelete) {
          persist2886ActiveDosya(updatedList[0] || null)
        }
      }
    } catch {
      // ignore
    }

    saveAndBroadcast(updatedList)
    setDeleteModalDosya(null)
  }

  const handleDuplicate = (dosya: Dosya2886Item): void => {
    const clone: Dosya2886Item = {
      ...dosya,
      id: `2886-${Date.now()}`,
      ihaleKayitNo: `${dosya.ihaleKayitNo}-KOPYA`,
      ihaleAdi: `${dosya.ihaleAdi} (Kopya)`
    }
    saveAndBroadcast([clone, ...dosyalar])
  }

  // Arama & Filtreleme
  const filteredDosyalar = dosyalar.filter((d) => {
    const q = searchQuery.toLowerCase()
    const matchQ =
      (d.ihaleAdi && d.ihaleAdi.toLowerCase().includes(q)) ||
      (d.ihaleKayitNo && d.ihaleKayitNo.toLowerCase().includes(q)) ||
      (d.tasinmaz?.ada && d.tasinmaz.ada.toLowerCase().includes(q)) ||
      (d.tasinmaz?.parsel && d.tasinmaz.parsel.toLowerCase().includes(q)) ||
      (d.tasinmaz?.ilce && d.tasinmaz.ilce.toLowerCase().includes(q))

    const matchTur =
      filterTur === 'hepsi' ||
      d.islemTuru === filterTur ||
      (filterTur === 'irtifak' && (d.islemTuru === 'irtifak_hakki' || d.islemTuru === 'irtifak'))

    return matchQ && matchTur
  })

  const handleSelectAndOpenStudio = (dosya: Dosya2886Item): void => {
    persist2886ActiveDosya(dosya)
    onSelectDosya?.(dosya)
  }

  return (
    <div className="space-y-4">
      {/* 1. İSTATİSTİK KARTLARI */}
      <DosyaYonetimi2886Stats dosyalar={dosyalar} />

      {/* 2. ARAMA, FİLTRE VE AKSİYON ÇUBUĞU */}
      <DosyaYonetimi2886FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterTur={filterTur}
        setFilterTur={setFilterTur}
        totalCount={dosyalar.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenStudyo={onOpenStudyo}
        onOpenNewModal={openNewModal}
      />

      {/* 3. DOSYA LİSTESİ: KART VEYA TABLO GÖRÜNÜMÜ */}
      {viewMode === 'grid' ? (
        <DosyaYonetimi2886Grid
          filteredDosyalar={filteredDosyalar}
          activeDosyaId={activeDosyaId}
          onOpenEditModal={openEditModal}
          onDuplicate={handleDuplicate}
          onDeleteRequest={(d) => setDeleteModalDosya(d)}
          onSelectAndOpenStudio={handleSelectAndOpenStudio}
          onRestoreDefaults={() => saveAndBroadcast(DEFAULT_2886_DOSYALAR)}
        />
      ) : (
        <DosyaYonetimi2886Table
          filteredDosyalar={filteredDosyalar}
          activeDosyaId={activeDosyaId}
          onOpenEditModal={openEditModal}
          onDeleteRequest={(d) => setDeleteModalDosya(d)}
          onSelectAndOpenStudio={handleSelectAndOpenStudio}
        />
      )}

      {/* 4. HIZLI DOSYA EKLEME / DÜZENLEME MODALI */}
      <DosyaYonetimi2886Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        editingDosya={editingDosya}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveQuickDosya}
      />

      {/* 5. SİLME ONAY MODALI */}
      <DosyaYonetimi2886DeleteModal
        deleteModalDosya={deleteModalDosya}
        onClose={() => setDeleteModalDosya(null)}
        onConfirmDelete={handleDeleteConfirm}
      />
    </div>
  )
}
