import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Kalem, useMalzemelerHooks } from './malzemeler.hooks'
import { useOlcuBirimleri } from '../olcubirimleri/olcubirimleri.hooks'
import { useOkasKodHooks } from '../okaskod/okaskod.hooks'
import { useTasinirKodHooks } from '../tasinirkod/tasinirkod.hooks'
import { generateBarcode } from '../../utils/barcodeUtils'
import { SelectedPozData } from './components/PozSecimModal'
import { HizliKalemRow } from '../dosya/sub-screens/components/MalzemeListesi/HizliTopluKalemGrid'
import { APP_ROUTES } from '../../constants/routeConstants'
import { useTabStore } from '../../store/tabStore'

export function useYeniMalzeme() {
  const search: any = useSearch({ strict: false })
  const editId = search?.id ? Number(search.id) : null

  const navigate = useNavigate()
  const { addKalem, updateKalem, kalemList } = useMalzemelerHooks()
  const { data: birimler = [] } = useOlcuBirimleri()
  const { okasKodList, isLoading: isOkasLoading } = useOkasKodHooks()
  const { tasinirKodList, isLoading: isTasinirLoading } = useTasinirKodHooks()
  const { updateTabLabel, activeTabPath } = useTabStore()

  // Entry Mode: 'batch' for fast Excel-style multiple items or 'single' for detailed single item form
  const [entryMode, setEntryMode] = useState<'batch' | 'single'>(editId ? 'single' : 'batch')

  // Form State
  const [formData, setFormData] = useState<Partial<Kalem>>(() => ({
    tipi: 'Mal',
    birim: 'Adet',
    mensei: 'Yerli',
    kdv_orani: 20,
    aktif_mi: 1,
    personel_asgari_fark_oran: 0,
    fiyat_donemi: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
      2,
      '0'
    )}`,
    poz_yili: new Date().getFullYear(),
    barkod_id: generateBarcode()
  }))

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload')
  const [customImageUrl, setCustomImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadedEditIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (editId) {
      const typeLabel = formData.tipi
        ? `Kalem Düzenle (${formData.tipi})`
        : 'Kalem Düzenle (Mal/Hizmet/Yapım)'
      document.title = `${typeLabel} - DT`
      if (activeTabPath && activeTabPath.startsWith(APP_ROUTES.YENI_MALZEME)) {
        updateTabLabel(activeTabPath, typeLabel)
      }
    } else {
      document.title = 'Mal/Hizmet/Yapım İşi Ekle - DT'
      if (activeTabPath && activeTabPath.startsWith(APP_ROUTES.YENI_MALZEME)) {
        updateTabLabel(activeTabPath, 'Yeni Kalem Tanımla (Mal/Hizmet/Yapım)')
      }
    }
  }, [editId, formData.tipi, activeTabPath, updateTabLabel])

  useEffect(() => {
    if (!editId) {
      loadedEditIdRef.current = null
      return
    }

    // Eğer bu editId zaten forma yüklendiyse, arka plandaki kalemList güncellemeleri formu ezmesin
    if (loadedEditIdRef.current === editId) {
      return
    }

    setEntryMode('single')

    const populateForm = (item: Partial<Kalem>) => {
      setFormData({
        ...item,
        tipi: item.tipi?.startsWith('Hizmet') ? 'Hizmet' : item.tipi === 'Yapım' ? 'Yapım' : 'Mal'
      })
      loadedEditIdRef.current = editId
    }

    let isMounted = true
    const existing = kalemList.find((k) => k.id === editId)
    if (existing) {
      populateForm(existing)
    } else {
      window.electron.ipcRenderer
        .invoke('db:query', 'SELECT * FROM TANIM_Kalem WHERE id = ?', [editId])
        .then((res: any) => {
          if (isMounted && res.success && res.data?.[0]) {
            populateForm(res.data[0])
          }
        })
        .catch((err: unknown) => {
          console.error('[useYeniMalzeme] Kayıt yükleme hatası:', err)
        })
    }

    return () => {
      isMounted = false
    }
  }, [editId, kalemList])

  const [isOkasModalOpen, setIsOkasModalOpen] = useState(false)
  const [isTasinirModalOpen, setIsTasinirModalOpen] = useState(false)
  const [isPozModalOpen, setIsPozModalOpen] = useState(false)

  const handleSelectPoz = (data: SelectedPozData) => {
    setFormData((prev) => ({
      ...prev,
      poz_no: data.poz_no,
      kalem_adi:
        prev.kalem_adi && prev.kalem_adi !== 'Yeni Kalem' ? prev.kalem_adi : data.kalem_adi,
      poz_tanimi: data.poz_tanimi || data.kalem_adi,
      birim: data.birim || prev.birim || 'm²',
      olcu_birimi: data.birim || prev.olcu_birimi || 'm²',
      yapi_sinifi: data.yapi_sinifi || prev.yapi_sinifi,
      okas_kodu: data.okas_kodu || prev.okas_kodu,
      poz_yili: data.poz_yili || prev.poz_yili || new Date().getFullYear(),
      fiyat_donemi: data.fiyat_donemi || prev.fiyat_donemi || '2026/1',
      ozelligi: data.ozelligi || prev.ozelligi || data.poz_tanimi
    }))
  }

  const [isEditingBarkod, setIsEditingBarkod] = useState(false)
  const [barkodError, setBarkodError] = useState('')

  const checkBarkod = async (barkod: string) => {
    const trimmed = barkod ? barkod.trim() : ''
    if (!trimmed) return
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id FROM TANIM_Kalem WHERE barkod_id = ? AND id != ?',
        [trimmed, editId || 0]
      )
      if (res.success && res.data && res.data.length > 0) {
        setBarkodError('Bu Barkod / ID sistemde zaten kayıtlı!')
      } else {
        setBarkodError('')
      }
    } catch (error) {
      console.error('[useYeniMalzeme] checkBarkod hatası:', error)
    }
  }

  const [okasSearch, setOkasSearch] = useState('')
  const [tasinirSearch, setTasinirSearch] = useState('')

  const filteredOkas = okasKodList
    .filter(
      (k) =>
        k.kod.includes(okasSearch) ||
        (k.aciklama || '').toLowerCase().includes(okasSearch.toLowerCase())
    )
    .slice(0, 50)

  const filteredTasinir = tasinirKodList
    .filter(
      (k) =>
        k.tam_kod.includes(tasinirSearch) ||
        (k.aciklama || '').toLowerCase().includes(tasinirSearch.toLowerCase())
    )
    .slice(0, 50)

  const [isAiGeneratingOkas, setIsAiGeneratingOkas] = useState(false)

  const handleAiOkasSuggest = async () => {
    if (!formData.kalem_adi) {
      alert('Lütfen önce Mal/Hizmet/Yapım Adı alanını doldurunuz.')
      return
    }

    setIsAiGeneratingOkas(true)
    try {
      const prompt = `Aşağıdaki malzeme/hizmet/yapım işi için en uygun OKAS (Ortak Kamu Alımları Sözlüğü) kodunu ve kısa bir açıklamasını öner. Yalnızca şu formatta cevap ver: "KOD: AÇIKLAMA". Örnek: "15010101: A4 Kağıt". Tanım: ${formData.kalem_adi}`
      const res = await window.api.aiGenerate({ prompt })

      if (res.success && res.data) {
        const text = res.data.trim()
        const codeMatch = text.match(/^([\d.]+)/)
        if (codeMatch && codeMatch[1]) {
          setFormData((prev) => ({ ...prev, okas_kodu: codeMatch[1] }))
          alert(`Yapay Zeka Önerisi:\n\n${text}`)
        } else {
          alert(`Yapay Zeka Önerisi:\n\n${text}\n\nLütfen listeden doğrulayarak seçin.`)
        }
      } else {
        alert('AI Hatası: ' + (res.error || 'Bilinmeyen hata'))
      }
    } catch (err: any) {
      alert('AI İsteği sırasında hata oluştu: ' + err.message)
    } finally {
      setIsAiGeneratingOkas(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Görsel boyutu en fazla 5 MB olmalıdır.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setFormData((prev) => ({ ...prev, gorsel_url: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleApplyImageUrl = () => {
    const url = customImageUrl.trim()
    if (!url) {
      alert('Lütfen geçerli bir görsel URL adresi giriniz.')
      return
    }
    setFormData((prev) => ({ ...prev, gorsel_url: url }))
    setCustomImageUrl('')
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Görsel boyutu en fazla 5 MB olmalıdır.')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setFormData((prev) => ({ ...prev, gorsel_url: base64 }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (stayOpen: boolean = false) => {
    if (!formData.kalem_adi || !formData.barkod_id) {
      alert('Lütfen zorunlu alanları (Adı, Kodu/Barkodu) doldurunuz.')
      return
    }

    if (barkodError) {
      alert('Barkod hatasını düzeltmeden kaydedemezsiniz: ' + barkodError)
      return
    }

    const currentBarkod = formData.barkod_id.trim()
    try {
      const checkRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id FROM TANIM_Kalem WHERE barkod_id = ? AND id != ?',
        [currentBarkod, editId || 0]
      )
      if (checkRes.success && checkRes.data && checkRes.data.length > 0) {
        setBarkodError('Bu Barkod / ID sistemde zaten kayıtlı!')
        alert(
          'Bu Barkod / ID sistemde zaten kayıtlı! Lütfen farklı bir barkod giriniz veya yeni üretiniz.'
        )
        return
      }
    } catch (err: unknown) {
      console.error('[useYeniMalzeme] Kayıt öncesi barkod kontrol hatası:', err)
    }

    setIsSaving(true)
    try {
      const dataToSave = {
        ...formData,
        tipi:
          formData.tipi === 'Hizmet'
            ? formData.is_personel
              ? 'Hizmet, Personel'
              : 'Hizmet, Diğer'
            : formData.tipi || 'Mal',
        birim: formData.olcu_birimi || formData.birim || 'Adet'
      }

      if (editId) {
        await updateKalem({ ...dataToSave, id: editId } as any)
        setToastMessage('Kayıt başarıyla güncellendi!')
      } else {
        await addKalem(dataToSave)
        setToastMessage('Yeni kalem başarıyla kaydedildi!')
      }

      if (stayOpen) {
        // Reset form for next entry
        loadedEditIdRef.current = null
        setFormData({
          tipi: formData.tipi || 'Mal',
          birim: 'Adet',
          mensei: 'Yerli',
          kdv_orani: 20,
          aktif_mi: 1,
          personel_asgari_fark_oran: 0,
          fiyat_donemi: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
            2,
            '0'
          )}`,
          poz_yili: new Date().getFullYear(),
          barkod_id: generateBarcode()
        })
        if (editId) {
          navigate({ to: APP_ROUTES.YENI_MALZEME } as any)
        }
        setTimeout(() => setToastMessage(null), 4000)
      } else {
        navigate({ to: APP_ROUTES.MALZEMELER })
      }
    } catch (err: any) {
      alert('Kaydedilirken hata oluştu: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBatchSaveInLibrary = async (
    commonData: {
      tipi: string
      okas_kodu?: string
      tasinir_kodu_prefix?: string
      kdv_orani: number
      birim: string
    },
    rows: HizliKalemRow[]
  ): Promise<boolean> => {
    setIsSaving(true)
    try {
      let count = 0
      for (const row of rows) {
        if (!row.kalem_adi || !row.kalem_adi.trim()) continue
        const finalTipi = row.tipi || commonData.tipi || 'Mal'
        const finalBirim = row.birim || commonData.birim || 'Adet'
        const finalOkas = row.okas_kodu || commonData.okas_kodu || ''
        const finalTasinir =
          row.tasinir_kodu || (commonData.tasinir_kodu_prefix ? commonData.tasinir_kodu_prefix : '')
        const finalKdv = row.kdv_orani ?? commonData.kdv_orani ?? 20

        await addKalem({
          kalem_adi: row.kalem_adi.trim(),
          tipi: finalTipi,
          birim: finalBirim,
          olcu_birimi: finalBirim,
          okas_kodu: finalOkas,
          tasinir_kodu: finalTasinir,
          kdv_orani: finalKdv,
          mensei: 'Yerli',
          aktif_mi: 1,
          notlar: row.aciklama || null,
          ozelligi: row.aciklama || null,
          barkod_id: generateBarcode(),
          fiyat_donemi: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        })
        count++
      }
      setToastMessage(`${count} adet kalem kütüphaneye başarıyla kaydedildi!`)
      setTimeout(() => {
        navigate({ to: APP_ROUTES.MALZEMELER })
      }, 1000)
      return true
    } catch (err: any) {
      alert('Toplu kayıt sırasında hata: ' + err.message)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const selectedType: 'Mal' | 'Hizmet' | 'Yapım' =
    formData.tipi === 'Yapım' ? 'Yapım' : formData.tipi === 'Hizmet' ? 'Hizmet' : 'Mal'

  return {
    editId,
    navigate,
    birimler,
    entryMode,
    setEntryMode,
    formData,
    setFormData,
    selectedType,
    toastMessage,
    isSaving,
    imageInputMode,
    setImageInputMode,
    customImageUrl,
    setCustomImageUrl,
    fileInputRef,
    isOkasModalOpen,
    setIsOkasModalOpen,
    isTasinirModalOpen,
    setIsTasinirModalOpen,
    isPozModalOpen,
    setIsPozModalOpen,
    handleSelectPoz,
    isEditingBarkod,
    setIsEditingBarkod,
    barkodError,
    setBarkodError,
    checkBarkod,
    okasSearch,
    setOkasSearch,
    tasinirSearch,
    setTasinirSearch,
    filteredOkas,
    filteredTasinir,
    isOkasLoading,
    isTasinirLoading,
    isAiGeneratingOkas,
    handleAiOkasSuggest,
    handleImageUpload,
    handleApplyImageUrl,
    handleImageDrop,
    handleSave,
    handleBatchSaveInLibrary
  }
}
