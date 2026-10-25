import React, { useState, useMemo } from 'react'
import { useButceKodHooks, parseButceKod, ButceKod } from './butcekod.hooks'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { ButceKodHeader } from './components/ButceKodHeader'
import { ButceKodStats } from './components/ButceKodStats'
import { ButceKodTable, TabType } from './components/ButceKodTable'
import { ButceKodModal } from './components/ButceKodModal'

export default function ButceKodScreen(): React.JSX.Element {
  const { butceKodList, isLoading, addButceKod, updateButceKod, deleteButceKod } =
    useButceKodHooks()

  const [search, setSearch] = useState('')
  const [selectedTab, setSelectedTab] = useState<TabType>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ButceKod | null>(null)

  // Form State
  const [formKod, setFormKod] = useState('')
  const [formHesapKodu, setFormHesapKodu] = useState('')
  const [formHesapAdi, setFormHesapAdi] = useState('')
  const [formButceTuru, setFormButceTuru] = useState('Mal Alımı')
  const [formAciklama, setFormAciklama] = useState('')
  const [formAktifMi, setFormAktifMi] = useState(1)

  const [copiedKod, setCopiedKod] = useState<string | null>(null)

  const handleCopy = async (text: string): Promise<void> => {
    await copyToClipboard(text)
    setCopiedKod(text)
    setTimeout(() => setCopiedKod(null), 2000)
  }

  // Open Add Modal
  const handleOpenAdd = (): void => {
    setEditingItem(null)
    setFormKod('')
    setFormHesapKodu('')
    setFormHesapAdi('')
    setFormButceTuru('Mal Alımı')
    setFormAciklama('')
    setFormAktifMi(1)
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: ButceKod): void => {
    setEditingItem(item)
    setFormKod(item.kod)
    setFormHesapKodu(item.hesap_kodu || item.kod)
    setFormHesapAdi(item.hesap_adi)
    setFormButceTuru(item.butce_turu || 'Mal Alımı')
    setFormAciklama(item.aciklama || '')
    setFormAktifMi(item.aktif_mi)
    setIsModalOpen(true)
  }

  // Save (Add / Update)
  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formKod.trim() || !formHesapAdi.trim()) {
      alert('Lütfen Bütçe Kodu ve Hesap Adı alanlarını doldurunuz.')
      return
    }

    const parsed = parseButceKod(formKod)

    try {
      if (editingItem) {
        await updateButceKod({
          ...editingItem,
          kod: formKod.trim(),
          hesap_kodu: formHesapKodu.trim() || formKod.trim(),
          hesap_adi: formHesapAdi.trim(),
          butce_turu: formButceTuru,
          aciklama: formAciklama.trim(),
          aktif_mi: formAktifMi,
          duzey: parsed.duzey,
          duzey_1: parsed.duzey_1,
          duzey_2: parsed.duzey_2,
          duzey_3: parsed.duzey_3,
          duzey_4: parsed.duzey_4
        })
      } else {
        await addButceKod({
          kod: formKod.trim(),
          hesap_kodu: formHesapKodu.trim() || formKod.trim(),
          hesap_adi: formHesapAdi.trim(),
          butce_turu: formButceTuru,
          aciklama: formAciklama.trim(),
          aktif_mi: formAktifMi,
          duzey: parsed.duzey,
          duzey_1: parsed.duzey_1,
          duzey_2: parsed.duzey_2,
          duzey_3: parsed.duzey_3,
          duzey_4: parsed.duzey_4
        })
      }
      setIsModalOpen(false)
    } catch (err: unknown) {
      alert('Kaydetme hatası: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Delete
  const handleDelete = async (item: ButceKod): Promise<void> => {
    const confirmed = confirm(
      `"${item.kod} - ${item.hesap_adi}" bütçe kodunu silmek istediğinize emin misiniz?`
    )
    if (confirmed) {
      try {
        await deleteButceKod(item.id)
      } catch (err: unknown) {
        alert('Silme hatası: ' + (err instanceof Error ? err.message : String(err)))
      }
    }
  }

  // Filtering
  const filteredList = useMemo(() => {
    return butceKodList.filter((item) => {
      // Tab filter
      if (selectedTab === 'level4' && item.duzey !== 4) return false
      if (selectedTab === 'upper' && item.duzey === 4) return false
      if (selectedTab === 'mal' && item.butce_turu !== 'Mal Alımı') return false
      if (selectedTab === 'hizmet' && item.butce_turu !== 'Hizmet Alımı') return false
      if (selectedTab === 'yapim' && item.butce_turu !== 'Yapım İşi') return false
      if (selectedTab === 'danismanlik' && item.butce_turu !== 'Danışmanlık') return false

      // Search filter
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        item.kod.toLowerCase().includes(q) ||
        item.hesap_adi.toLowerCase().includes(q) ||
        (item.hesap_kodu && item.hesap_kodu.toLowerCase().includes(q)) ||
        (item.aciklama && item.aciklama.toLowerCase().includes(q)) ||
        (item.butce_turu && item.butce_turu.toLowerCase().includes(q))
      )
    })
  }, [butceKodList, selectedTab, search])

  // Stats
  const stats = useMemo(() => {
    const total = butceKodList.length
    const level4Count = butceKodList.filter((k) => k.duzey === 4).length
    const malCount = butceKodList.filter((k) => k.butce_turu === 'Mal Alımı').length
    const hizmetCount = butceKodList.filter((k) => k.butce_turu === 'Hizmet Alımı').length
    const yapimCount = butceKodList.filter((k) => k.butce_turu === 'Yapım İşi').length
    return { total, level4Count, malCount, hizmetCount, yapimCount }
  }, [butceKodList])

  return (
    <div className="p-6 max-w-400 mx-auto space-y-6">
      <ButceKodHeader onOpenAdd={handleOpenAdd} />

      <ButceKodStats stats={stats} />

      <ButceKodTable
        filteredList={filteredList}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        stats={stats}
        copiedKod={copiedKod}
        onCopy={handleCopy}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <ButceKodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
        formKod={formKod}
        setFormKod={setFormKod}
        formHesapKodu={formHesapKodu}
        setFormHesapKodu={setFormHesapKodu}
        formHesapAdi={formHesapAdi}
        setFormHesapAdi={setFormHesapAdi}
        formButceTuru={formButceTuru}
        setFormButceTuru={setFormButceTuru}
        formAciklama={formAciklama}
        setFormAciklama={setFormAciklama}
        formAktifMi={formAktifMi}
        setFormAktifMi={setFormAktifMi}
        onSave={handleSave}
      />
    </div>
  )
}
