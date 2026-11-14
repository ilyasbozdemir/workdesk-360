import { useState, useEffect, useMemo, useCallback } from 'react'
import { SimpleFile, ItemRecord, OfferRecord } from '../types'
import { useWorkspaceStore } from '../../../store/workspaceStore'

export const INITIAL_FILES: SimpleFile[] = [
  {
    id: 'DT-2026-0042',
    name: 'Belediye hizmet binası bakım işi',
    type: 'Doğrudan Temin',
    date: '12.11.2026',
    status: 'Onay bekliyor',
    amount: 185000,
    unit: 'Fen İşleri Müdürlüğü'
  },
  {
    id: 'DT-2026-0041',
    name: 'Muhtelif kırtasiye malzemesi alımı',
    type: 'Doğrudan Temin',
    date: '10.11.2026',
    status: 'Hazırlanıyor',
    amount: 42750,
    unit: 'Yazı İşleri Müdürlüğü'
  },
  {
    id: 'DT-2026-0039',
    name: 'Araç bakım ve yedek parça alımı',
    type: 'Doğrudan Temin',
    date: '08.11.2026',
    status: 'Tamamlandı',
    amount: 96400,
    unit: 'Destek Hizmetleri'
  },
  {
    id: 'İH-2026-0012',
    name: 'Park ve çevre düzenleme malzemeleri',
    type: 'Açık İhale',
    date: '06.11.2026',
    status: 'Onay bekliyor',
    amount: 640000,
    unit: 'Park ve Bahçeler'
  },
  {
    id: 'DT-2026-0037',
    name: 'İş güvenliği ekipmanları',
    type: 'Doğrudan Temin',
    date: '04.11.2026',
    status: 'Arşivlendi',
    amount: 28500,
    unit: 'İnsan Kaynakları'
  }
]

export function useSimpleLayoutData() {
  const { activeDosyaId, setActiveDosyaId } = useWorkspaceStore()

  const [files, setFiles] = useState<SimpleFile[]>(INITIAL_FILES)
  const [selectedFileId, setSelectedFileId] = useState<string>(INITIAL_FILES[0].id)
  const [globalSearch, setGlobalSearch] = useState('')
  const [fileSearch, setFileSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)

  const [items, setItems] = useState<ItemRecord[]>([
    { name: 'Bakım malzemesi', qty: 12, unit: 'Adet', price: 850 },
    { name: 'Elektrik tesisatı malzemesi', qty: 8, unit: 'Takım', price: 2350 }
  ])

  const [offers, setOffers] = useState<OfferRecord[]>([
    { company: 'Örnek Teknik Ltd.', price: 162000, valid: 'Uygun' },
    { company: 'Demo Yapı A.Ş.', price: 174500, valid: 'Uygun' },
    { company: 'Örnek Tedarik', price: 181000, valid: 'İncelemede' }
  ])

  // Veritabanındaki gerçek dosyaları yükle
  useEffect(() => {
    let isMounted = true
    const loadRealFiles = async () => {
      try {
        if (window.electron?.ipcRenderer) {
          const res = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT id, temin_no, konu, tur, yaklasik_maliyet, created_at, status
             FROM DATA_TeminDosyasi
             WHERE (is_deleted = 0 OR is_deleted IS NULL)
             ORDER BY id DESC LIMIT 50`
          )
          if (isMounted && res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped: SimpleFile[] = res.data.map((d: any) => ({
              id: d.temin_no || `DT-${d.id}`,
              name: d.konu || 'Doğrudan Temin Dosyası',
              type: d.tur === 'hizmet' ? 'Hizmet Alımı' : d.tur === 'yapim' ? 'Yapım İşi' : 'Doğrudan Temin',
              date: d.created_at ? String(d.created_at).slice(0, 10) : '2026-11-14',
              status: d.status || 'Hazırlanıyor',
              amount: Number(d.yaklasik_maliyet) || 0,
              unit: 'Satın Alma Birimi'
            }))
            setFiles(mapped)
            if (mapped[0]) setSelectedFileId(mapped[0].id)
          }
        }
      } catch (e) {
        console.warn('[SimpleLayout] Veritabanından dosyalar okunamadı, hazır şablon kullanılıyor:', e)
      }
    }
    loadRealFiles()
    return () => {
      isMounted = false
    }
  }, [])

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || files[0]
  }, [files, selectedFileId])

  const numericDosyaId = useMemo(() => {
    if (activeDosyaId) return activeDosyaId
    const num = parseInt(selectedFileId.replace(/\D/g, ''), 10)
    return isNaN(num) ? 1 : num
  }, [activeDosyaId, selectedFileId])

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const q = (fileSearch || globalSearch).trim().toLocaleLowerCase('tr')
      const matchesQuery = !q || (f.name + ' ' + f.id).toLocaleLowerCase('tr').includes(q)
      const matchesStatus = !statusFilter || f.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [files, fileSearch, globalSearch, statusFilter])

  const addFile = (newFile: SimpleFile) => {
    setFiles((prev) => [newFile, ...prev])
    setSelectedFileId(newFile.id)
    showToast(`Yeni dosya oluşturuldu: ${newFile.id}`)
  }

  const addItem = (item: ItemRecord) => {
    setItems((prev) => [...prev, item])
    showToast(`Yeni kalem eklendi: ${item.name}`)
  }

  const addOffer = (offer: OfferRecord) => {
    setOffers((prev) => [...prev, offer])
    showToast(`Yeni teklif kaydedildi: ${offer.company}`)
  }

  return {
    files,
    selectedFileId,
    setSelectedFileId,
    selectedFile,
    numericDosyaId,
    setActiveDosyaId,
    filteredFiles,
    globalSearch,
    setGlobalSearch,
    fileSearch,
    setFileSearch,
    statusFilter,
    setStatusFilter,
    toastMsg,
    showToast,
    activeModal,
    setActiveModal,
    items,
    offers,
    addFile,
    addItem,
    addOffer
  }
}
