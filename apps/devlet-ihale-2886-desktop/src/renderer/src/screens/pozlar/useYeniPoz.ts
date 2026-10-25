import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { PozItem, usePozlarHooks, PozFiyatGecmisi } from './pozlar.hooks'
import { getDinamikFiyatDonemleri } from '../malzemeler/components/pozKitaplari.data'
import { APP_ROUTES } from '../../constants/routeConstants'
import { FASIKULLER_MAP, ORNEK_POZ_SABLONLARI } from './yeni.constants'

export function useYeniPoz() {
  const search: any = useSearch({ strict: false })
  const editId = search?.id ? Number(search.id) : null

  const navigate = useNavigate()
  const { pozList, addPoz, updatePoz } = usePozlarHooks()

  const [formData, setFormData] = useState<Partial<PozItem>>(() => ({
    poz_no: '',
    eski_poz_no: '',
    fasikul: 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
    poz_tipi: 'Analiz',
    kalem_adi: '',
    poz_tanimi: '',
    birim: 'm³',
    olcu_birimi: 'm³',
    poz_kurumu: 'ÇŞB',
    kategori: 'ÇŞB',
    poz_yili: new Date().getFullYear(),
    fiyat_donemi: `${new Date().getFullYear()}/1`,
    okas_kodu: '45000000',
    yapi_sinifi: 'Genel Yapım İşleri',
    kdv_orani: 20,
    birim_fiyat: 0,
    aktif_mi: 1,
    ozelligi: '',
    notlar: ''
  }))

  const [fiyatListesi, setFiyatListesi] = useState<PozFiyatGecmisi[]>([
    { donem: `${new Date().getFullYear()}/1`, fiyat: 0 }
  ])

  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)

  const initialFormRef = useRef<string>('')
  const initialFiyatRef = useRef<string>('')

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(formData) !== initialFormRef.current ||
      JSON.stringify(fiyatListesi) !== initialFiyatRef.current
    )
  }, [formData, fiyatListesi])

  const handleNavigateBack = useCallback(() => {
    navigate({ to: APP_ROUTES.POZLAR })
  }, [navigate])

  const handleTryClose = useCallback(() => {
    if (!isDirty) {
      handleNavigateBack()
    } else {
      setShowUnsavedModal(true)
    }
  }, [isDirty, handleNavigateBack])

  useEffect(() => {
    document.title = editId ? 'Birim Fiyat Pozu Düzenle - DT' : 'Yeni Birim Fiyat Pozu Tanımla - DT'

    if (editId && pozList.length > 0) {
      const existing = pozList.find((p) => p.id === editId)
      if (existing) {
        setFormData({
          ...existing,
          poz_kurumu: existing.poz_kurumu || existing.kategori || 'ÇŞB',
          kategori: existing.kategori || existing.poz_kurumu || 'ÇŞB',
          fasikul: existing.fasikul || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
          poz_tipi: existing.poz_tipi || 'Analiz',
          eski_poz_no: existing.eski_poz_no || '',
          birim: existing.birim || existing.olcu_birimi || 'm²',
          olcu_birimi: existing.olcu_birimi || existing.birim || 'm²',
          poz_tanimi: existing.poz_tanimi || existing.kalem_adi || '',
          kdv_orani: existing.kdv_orani ?? 20,
          aktif_mi: existing.aktif_mi ?? 1,
          birim_fiyat: existing.birim_fiyat || 0
        })

        if (existing.birim_fiyatlar) {
          try {
            const parsed = JSON.parse(existing.birim_fiyatlar)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFiyatListesi(parsed)
            }
          } catch {
            if (existing.birim_fiyat) {
              setFiyatListesi([
                {
                  donem: existing.fiyat_donemi || `${existing.poz_yili || 2026}/1`,
                  fiyat: existing.birim_fiyat
                }
              ])
            }
          }
        } else if (existing.birim_fiyat) {
          setFiyatListesi([
            {
              donem: existing.fiyat_donemi || `${existing.poz_yili || 2026}/1`,
              fiyat: existing.birim_fiyat
            }
          ])
        }
      }
    }
    setTimeout(() => {
      initialFormRef.current = JSON.stringify(
        editId && pozList.find((p) => p.id === editId)
          ? { ...pozList.find((p) => p.id === editId) }
          : formData
      )
    }, 50)
  }, [editId, pozList])

  const dinamikDonemler = useMemo(
    () => getDinamikFiyatDonemleri(formData.poz_yili || new Date().getFullYear()),
    [formData.poz_yili]
  )

  const aktifFasikuller = useMemo(() => {
    const kurum = formData.poz_kurumu || formData.kategori || 'ÇŞB'
    return FASIKULLER_MAP[kurum] || FASIKULLER_MAP.ÇŞB
  }, [formData.poz_kurumu, formData.kategori])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleApplyTemplate = (tpl: (typeof ORNEK_POZ_SABLONLARI)[0]) => {
    setFormData((prev) => ({
      ...prev,
      poz_no: tpl.poz_no,
      eski_poz_no: tpl.eski_poz_no,
      fasikul: tpl.fasikul,
      poz_tipi: tpl.poz_tipi,
      kalem_adi: tpl.kalem_adi,
      poz_tanimi: tpl.kalem_adi,
      birim: tpl.birim,
      olcu_birimi: tpl.birim,
      poz_kurumu: tpl.kurum,
      kategori: tpl.kurum,
      yapi_sinifi: tpl.yapi_sinifi,
      okas_kodu: tpl.okas_kodu,
      ozelligi: tpl.ozelligi,
      birim_fiyat: tpl.fiyatlar?.[0]?.fiyat || 0,
      fiyat_donemi: tpl.fiyatlar?.[0]?.donem || '2026/1'
    }))
    if (tpl.fiyatlar) {
      setFiyatListesi(tpl.fiyatlar)
    }
    showToast(`"${tpl.baslik}" şablonu uygulandı!`)
  }

  const handleKurumPrefix = (prefix: string, kurumId: string) => {
    const fasikuller = FASIKULLER_MAP[kurumId] || FASIKULLER_MAP.ÇŞB
    setFormData((prev) => {
      let currentNo = prev.poz_no || ''
      if (!currentNo || currentNo.includes('.')) {
        currentNo = prefix
      }
      return {
        ...prev,
        poz_kurumu: kurumId,
        kategori: kurumId,
        fasikul: fasikuller[0] || prev.fasikul,
        poz_no: currentNo
      }
    })
  }

  const handleAddFiyatRow = () => {
    const currentYear = formData.poz_yili || new Date().getFullYear()
    const nextDonem = `${currentYear}/${fiyatListesi.length + 1}`
    setFiyatListesi((prev) => [{ donem: nextDonem, fiyat: 0 }, ...prev])
  }

  const handleUpdateFiyatRow = (index: number, field: keyof PozFiyatGecmisi, value: any) => {
    setFiyatListesi((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: field === 'fiyat' ? Number(value) || 0 : value
      }
      if (index === 0 && field === 'fiyat') {
        setFormData((f) => ({ ...f, birim_fiyat: Number(value) || 0 }))
      }
      if (index === 0 && field === 'donem') {
        setFormData((f) => ({ ...f, fiyat_donemi: String(value) }))
      }
      return updated
    })
  }

  const handleDeleteFiyatRow = (index: number) => {
    setFiyatListesi((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.poz_no?.trim()) {
      showToast('Lütfen Poz Numarasını giriniz.')
      return
    }

    if (!formData.kalem_adi?.trim() && !formData.poz_tanimi?.trim()) {
      showToast('Lütfen İmalat / Poz Tanımını giriniz.')
      return
    }

    setIsSaving(true)
    try {
      const guncelFiyat =
        fiyatListesi.length > 0 ? fiyatListesi[0].fiyat : Number(formData.birim_fiyat) || 0
      const guncelDonem =
        fiyatListesi.length > 0 ? fiyatListesi[0].donem : formData.fiyat_donemi || '2026/1'

      const payload: Partial<PozItem> = {
        ...formData,
        kalem_adi: formData.kalem_adi?.trim() || formData.poz_tanimi?.trim() || formData.poz_no,
        poz_tanimi:
          formData.ozelligi?.trim() ||
          formData.poz_tanimi?.trim() ||
          formData.kalem_adi?.trim() ||
          '',
        eski_poz_no: formData.eski_poz_no?.trim() || null,
        fasikul: formData.fasikul?.trim() || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
        poz_tipi: formData.poz_tipi || 'Analiz',
        poz_kurumu: formData.poz_kurumu || formData.kategori || 'ÇŞB',
        kategori: formData.poz_kurumu || formData.kategori || 'ÇŞB',
        birim: formData.birim || 'm²',
        olcu_birimi: formData.birim || 'm²',
        poz_yili: formData.poz_yili || new Date().getFullYear(),
        fiyat_donemi: guncelDonem,
        birim_fiyat: guncelFiyat,
        birim_fiyatlar: JSON.stringify(fiyatListesi),
        kdv_orani: Number(formData.kdv_orani) ?? 20,
        aktif_mi: formData.aktif_mi ?? 1
      }

      if (editId) {
        await updatePoz({ id: editId, data: payload })
        showToast('Birim fiyat pozu ve fiyat geçmişi güncellendi.')
      } else {
        await addPoz(payload as Omit<PozItem, 'id'>)
        showToast('Yeni birim fiyat pozu ve fiyat geçmişi kaydedildi.')
      }

      initialFormRef.current = JSON.stringify(formData)
      initialFiyatRef.current = JSON.stringify(fiyatListesi)
      setTimeout(() => {
        navigate({ to: APP_ROUTES.POZLAR })
      }, 600)
    } catch (err: any) {
      alert('Kaydedilirken hata oluştu: ' + (err?.message || 'Bilinmeyen hata'))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    editId,
    formData,
    setFormData,
    fiyatListesi,
    isSaving,
    toastMessage,
    showUnsavedModal,
    setShowUnsavedModal,
    isDirty,
    dinamikDonemler,
    aktifFasikuller,
    handleNavigateBack,
    handleTryClose,
    handleApplyTemplate,
    handleKurumPrefix,
    handleAddFiyatRow,
    handleUpdateFiyatRow,
    handleDeleteFiyatRow,
    handleSubmit
  }
}
