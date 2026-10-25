import { useState, useMemo, useEffect } from 'react'
import Mustache from 'mustache'
import type { Dosya2886Item } from '../../../../components/layout/temin-selector/teminSelector.types'
import {
  getInitial2886Dosyalar,
  persist2886Dosyalar,
  persist2886ActiveDosya
} from '../../../../components/layout/temin-selector/teminSelector.storage'
import { sayiyiYaziyaCevir } from '../../../../constants/sayiEslesmeleri'
import type { FormDataType, CustomField, StudyoLeftTab } from './studyoTypes'
import { STANDARD_2886_TEMPLATES } from './standard2886Templates.data'
import {
  getFormDataForDosya,
  getCustomFieldsForDosya,
  getEditorContentForDosya
} from './studyoHelpers'

export function useBelgeVeSablonStudyo(initialDosyaId?: string) {
  const [dosyalar, setDosyalar] = useState<Dosya2886Item[]>(() => getInitial2886Dosyalar())
  const [selectedDosyaId, setSelectedDosyaId] = useState<string>(() => {
    if (initialDosyaId) return initialDosyaId
    try {
      const activeRaw = localStorage.getItem('temin_2886_active_dosya')
      if (activeRaw) {
        const item = JSON.parse(activeRaw)
        return item.id || ''
      }
    } catch {
      // ignore
    }
    const initial = getInitial2886Dosyalar()
    return initial[0]?.id || 'new'
  })

  // Gerçek zamanlı senkronizasyon
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

  const currentDosya = useMemo(() => {
    return dosyalar.find((d) => d.id === selectedDosyaId) || null
  }, [dosyalar, selectedDosyaId])

  // Form Değerleri
  const [formData, setFormData] = useState<FormDataType>(() => {
    const initialList = getInitial2886Dosyalar()
    const target = initialDosyaId
      ? initialList.find((d) => d.id === initialDosyaId)
      : initialList[0]
    return getFormDataForDosya(target || null, initialList.length)
  })

  // Özel Dinamik Form Builder Alanları
  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    const initialList = getInitial2886Dosyalar()
    const target = initialDosyaId
      ? initialList.find((d) => d.id === initialDosyaId)
      : initialList[0]
    return getCustomFieldsForDosya(target || null)
  })

  // Yeni Alan Ekleme Popover / Modal state
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldTip, setNewFieldTip] = useState<
    'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli'
  >('metin')
  const [newFieldVal, setNewFieldVal] = useState('')
  const [showAddField, setShowAddField] = useState(false)

  // Aktif Şablon ve TipTap HTML İçeriği
  const [selectedTemplateKod, setSelectedTemplateKod] = useState<string>('2886-EVR-01')
  const [editorContent, setEditorContent] = useState<string>(() => {
    const initialList = getInitial2886Dosyalar()
    const target = initialDosyaId
      ? initialList.find((d) => d.id === initialDosyaId)
      : initialList[0]
    return getEditorContentForDosya(target || null)
  })
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  // Sol Panel Sekmesi
  const [leftTab, setLeftTab] = useState<StudyoLeftTab>('form')

  const handleSelectDosyaId = (dosyaId: string): void => {
    setSelectedDosyaId(dosyaId)
    const target = dosyalar.find((d) => d.id === dosyaId) || null
    setFormData(getFormDataForDosya(target, dosyalar.length))
    setCustomFields(getCustomFieldsForDosya(target))
    setEditorContent(getEditorContentForDosya(target))
    if (target?.aktifSablonKodu) {
      setSelectedTemplateKod(target.aktifSablonKodu)
    }
  }

  // Şablon Değiştirildiğinde
  const handleSelectTemplate = (kod: string): void => {
    setSelectedTemplateKod(kod)
    const t = STANDARD_2886_TEMPLATES.find((item) => item.kod === kod)
    if (t) {
      setEditorContent(t.templateHtml)
    }
  }

  // Değişken Değerleri Nesnesi (Interpolation Context)
  const templateContext = useMemo(() => {
    const bedelNum = Number(formData.muhammenBedel) || 0
    const geciciTeminatNum = Math.round(bedelNum * 0.03)

    const islemTuruLabels: Record<string, string> = {
      satis: 'Taşınmaz Satışı (Mülkiyet Devri)',
      kiralama: 'Taşınmaz Kiralaması',
      irtifak_hakki: 'Sınırlı Ayni Hak / İrtifak',
      trampa: 'Trampa (Mülkiyet Takası)'
    }

    const usulLabels: Record<string, string> = {
      acik_teklif_45: 'Madde 45 (Açık Teklif Usulü)',
      kapali_teklif_36: 'Madde 36 (Kapalı Teklif Usulü)',
      pazarlik_51: 'Madde 51 (Pazarlık Usulü)'
    }

    const baseCtx: Record<string, string | number> = {
      kurum_adi: formData.kurumAdi || 'İDARE BAŞKANLIĞI',
      dosya_no: formData.ihaleKayitNo,
      sayi_no: formData.sayiNo,
      karar_no: formData.kararNo,
      tarih: new Date().toLocaleDateString('tr-TR'),
      ihale_tarihi: formData.ihaleTarihi,
      ihale_saati: formData.ihaleSaati,
      ihale_yeri: formData.ihaleYeri,
      tasinmaz_adi: formData.ihaleAdi,
      islem_turu_adi: islemTuruLabels[formData.islemTuru] || formData.islemTuru,
      ihale_usulu: usulLabels[formData.usul] || formData.usul,
      ada: formData.ada,
      parsel: formData.parsel,
      ada_parsel: `${formData.ada} / ${formData.parsel}`,
      mahalle_ilce: `${formData.mahalleKoy} / ${formData.ilce} / ${formData.il}`,
      yuzolcumu: formData.yuzolcumuM2,
      tasinmaz_cinsi: formData.cinsi,
      muhammen_bedel: bedelNum.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      muhammen_bedel_yaziyla: sayiyiYaziyaCevir(bedelNum),
      gecici_teminat: geciciTeminatNum.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
      gecici_teminat_yaziyla: sayiyiYaziyaCevir(geciciTeminatNum)
    }

    // Custom fields ekle
    customFields.forEach((cf) => {
      baseCtx[cf.key] = cf.deger
    })

    return baseCtx
  }, [formData, customFields])

  // Canlı Değişkenleri Belgeye Enjekte Et
  const handleInjectPlaceholders = (): void => {
    try {
      const rendered = Mustache.render(editorContent, templateContext)
      setEditorContent(rendered)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch {
      // ignore
    }
  }

  // Yeni Alan Ekleme
  const handleAddCustomField = (): void => {
    if (!newFieldLabel.trim()) return
    const key =
      newFieldKey.trim() ||
      newFieldLabel
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')

    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      key,
      label: newFieldLabel.trim(),
      tip: newFieldTip,
      deger: newFieldVal
    }

    setCustomFields([...customFields, newField])
    setNewFieldKey('')
    setNewFieldLabel('')
    setNewFieldVal('')
    setShowAddField(false)
  }

  // Özel Alan Silme
  const handleDeleteCustomField = (id: string): void => {
    setCustomFields(customFields.filter((cf) => cf.id !== id))
  }

  // Özel Alan Değerini Güncelleme
  const handleCustomFieldChange = (id: string, value: string): void => {
    setCustomFields(customFields.map((cf) => (cf.id === id ? { ...cf, deger: value } : cf)))
  }

  const saveDosyaToStorage = (savedItem: Dosya2886Item): void => {
    const exists = dosyalar.some((d) => d.id === savedItem.id)
    let updatedList: Dosya2886Item[]
    if (exists) {
      updatedList = dosyalar.map((d) => (d.id === savedItem.id ? savedItem : d))
    } else {
      updatedList = [savedItem, ...dosyalar]
      setSelectedDosyaId(savedItem.id)
    }
    setDosyalar(updatedList)
    persist2886Dosyalar(updatedList)
    persist2886ActiveDosya(savedItem)
  }

  // Sürüm Kaydetme (Snapshot)
  const handleSaveRevision = (): void => {
    if (!currentDosya) return
    const currentRevisions = currentDosya.surumler || []
    const now = new Date()
    const timestamp = now.getTime()
    const newRev = {
      id: timestamp,
      baslik: `Sürüm ${currentRevisions.length + 1} (${now.toLocaleTimeString('tr-TR')})`,
      tarih: now.toLocaleString('tr-TR'),
      html: editorContent
    }
    const updatedDosya: Dosya2886Item = {
      ...currentDosya,
      surumler: [newRev, ...currentRevisions]
    }
    saveDosyaToStorage(updatedDosya)
  }

  // Tüm Değişiklikleri Dosyaya Kaydet
  const handleSaveDosya = (): void => {
    const bedel = Number(formData.muhammenBedel) || 0
    const geciciTeminat = Math.round(bedel * 0.03)
    const now = new Date()
    const autoId = `2886-${now.getTime()}`

    const dosyaToSave: Dosya2886Item = {
      id: currentDosya ? currentDosya.id : autoId,
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
      },
      belgeIcerikHtml: editorContent,
      aktifSablonKodu: selectedTemplateKod,
      ozelAlanlar: customFields,
      surumler: currentDosya?.surumler || []
    }

    saveDosyaToStorage(dosyaToSave)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  // Word (.doc) Dışa Aktarma
  const handleExportWord = (): void => {
    const fileTitle = formData.ihaleAdi || '2886-Ihale-Belgesi'
    const cleanTitle = fileTitle.replace(/[^a-zA-Z0-9_-]/g, '_')
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${formData.ihaleAdi}</title>
        <style>
          @page { size: A4 portrait; margin: 2cm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #000; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #999; padding: 6px 8px; font-size: 10.5pt; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        ${editorContent}
      </body>
      </html>
    `
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cleanTitle}_2886.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Yazdırma (Print)
  const handlePrint = (): void => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${formData.ihaleAdi} - 2886 Belge</title>
            <style>
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; color: #1e293b; padding: 10px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; }
            </style>
          </head>
          <body>
            ${editorContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  // Değişken Kopyalama
  const handleCopyVar = (key: string): void => {
    const tag = `{{${key}}}`
    navigator.clipboard.writeText(tag)
    setCopiedVar(key)
    setTimeout(() => setCopiedVar(null), 1800)
  }

  return {
    dosyalar,
    selectedDosyaId,
    currentDosya,
    formData,
    setFormData,
    customFields,
    setCustomFields,
    newFieldKey,
    setNewFieldKey,
    newFieldLabel,
    setNewFieldLabel,
    newFieldTip,
    setNewFieldTip,
    newFieldVal,
    setNewFieldVal,
    showAddField,
    setShowAddField,
    selectedTemplateKod,
    editorContent,
    setEditorContent,
    savedSuccess,
    copiedVar,
    leftTab,
    setLeftTab,
    handleSelectDosyaId,
    handleSelectTemplate,
    templateContext,
    handleInjectPlaceholders,
    handleAddCustomField,
    handleDeleteCustomField,
    handleCustomFieldChange,
    handleSaveRevision,
    handleSaveDosya,
    handleExportWord,
    handlePrint,
    handleCopyVar
  }
}

export type UseBelgeVeSablonStudyoReturn = ReturnType<typeof useBelgeVeSablonStudyo>
