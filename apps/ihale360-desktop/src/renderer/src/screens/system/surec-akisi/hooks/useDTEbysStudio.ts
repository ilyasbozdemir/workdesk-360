import { useState, useMemo, useCallback, useEffect } from 'react'
import { EBYS_TEMPLATES } from '../../../ebys/data/ebysTemplates.data'
import { EbysCategory, EbysTemplateVariables, EbysTemplate } from '../../../ebys/ebys.types'
import { dosyaSablonVeriService } from '../../../../modules/dosya-sablon-veri'

export interface UseDTEbysStudioProps {
  dosya: any
  kalemler: any[]
  firmalar: any[]
  komisyonlar: any[]
  toplamBedel: number
  dosyaContext?: any
}

export type DTEbysStudioTab = 'preview' | 'variables' | 'resmi_yazi' | 'html' | 'css' | 'mevzuat'

export function useDTEbysStudio({
  dosya,
  kalemler,
  firmalar,
  komisyonlar,
  toplamBedel,
  dosyaContext
}: UseDTEbysStudioProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ust_yazi_standart')
  const [activeCategory, setActiveCategory] = useState<EbysCategory>('hepsi')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<DTEbysStudioTab>('preview')
  const [zoomLevel, setZoomLevel] = useState<number>(90)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'templates' | 'variables'>('templates')
  const [isSaved, setIsSaved] = useState(false)

  const selectedTemplate = useMemo(() => {
    return EBYS_TEMPLATES.find((t) => t.id === selectedTemplateId) || EBYS_TEMPLATES[0]
  }, [selectedTemplateId])

  // Doğrudan temin dosya verilerinden EBYS değişkenlerini türet (kalıtım)
  const mapDosyaToEbysVariables = useCallback(
    (template: EbysTemplate): EbysTemplateVariables => {
      const vars = { ...template.defaultVariables }

      // 1. Kurum & Birim
      const kurum = dosyaContext?.kurum || {}
      vars.kurumAdi = kurum.ad || dosya?.kurum_adi || 'T.C. İDARE BAŞKANLIĞI'
      vars.birimAdi =
        dosya?.birim_adi ||
        dosyaContext?.birim ||
        dosya?.harcama_birimi ||
        'Destek Hizmetleri Müdürlüğü'

      // 2. Sayı & Tarih
      const dosyaNo = dosya?.dosya_no || dosya?.id || '2026/01'
      const kayitNo = dosya?.fiziksel_kayit_no || dosya?.onay_belge_no || '12345678-934'
      vars.sayi = `E-${kayitNo}-${dosyaNo}`

      const onayTarihi = dosya?.onay_tarihi || dosya?.created_at
      if (onayTarihi) {
        try {
          const d = new Date(onayTarihi)
          vars.tarih = d.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        } catch {
          vars.tarih = new Date().toLocaleDateString('tr-TR')
        }
      } else {
        vars.tarih = new Date().toLocaleDateString('tr-TR')
      }

      // 3. Konu
      vars.konu = dosya?.konu || 'Doğrudan Temin Usulü İle Mal / Hizmet Alımı İşi'

      // 4. Muhatap
      if (firmalar && firmalar.length > 0) {
        const ilkFirma = firmalar[0]
        vars.muhatap = (ilkFirma.unvan || ilkFirma.firma_adi || '').toUpperCase()
        vars.muhatapEk = '(Doğrudan Temin İsteklisi)'
      }

      // 5. İlgi & Metin
      const mevzuatMaddesi = dosya?.kanun_maddesi || '4734 Sayılı Kamu İhale Kanununun 22/d Maddesi'
      vars.ilgi = `İdaremizin ${vars.tarih} tarihli ve ${dosyaNo} sayılı doğrudan temin onay belgesi.`

      const kalemOzeti =
        kalemler && kalemler.length > 0
          ? `${kalemler.length} kalem ihtiyaç malzemesi`
          : 'muhtelif ihtiyaç malzemeleri'

      vars.metin = `Müdürlüğümüz ihtiyacı olan ve yukarıda konusu belirtilen ${kalemOzeti}, ${mevzuatMaddesi} uyarınca doğrudan temin usulü ile temin edilecektir. Söz konusu alıma ilişkin şartlar ve teknik hususlar ekte yer almaktadır.`
      vars.sonucParagrafi =
        'Bahse konu işe ait kaşeli ve imzalı teklif mektubunuzun belirtilen tarih ve saate kadar idaremize teslim edilmesi hususunda gereğini rica ederim.'

      // 6. İmzalar & Yetkililer
      const hazirlayan = dosya?.hazirlayan_personel_adi || 'Birim Satınalma Sorumlusu'
      const onaylayan =
        dosya?.onaylayan_personel_adi || dosya?.harcama_yetkilisi_adi || 'Harcama Yetkilisi'

      vars.imzaAdi = onaylayan
      vars.imzaUnvani = 'Harcama Yetkilisi'
      vars.uygunGorusAdi = hazirlayan
      vars.uygunGorusUnvani = 'Satınalma Şefi'

      // 7. Ekler
      const ekListesi: string[] = []
      if (kalemler && kalemler.length > 0) {
        ekListesi.push(`1- İhtiyaç Listesi (${kalemler.length} Kalem)`)
      }
      ekListesi.push('2- Fiyat Teklif Formu Cetveli')
      ekListesi.push('3- İdari ve Teknik Şartname')
      vars.ekler = ekListesi

      // 8. Dağıtım
      if (firmalar && firmalar.length > 0) {
        vars.dagitimGeregi = firmalar.map((f: any) => f.unvan || f.firma_adi || 'İstekli Firma')
      } else {
        vars.dagitimGeregi = ['İlgili Firmalara']
      }
      vars.dagitimBilgi = ['Mali Hizmetler Müdürlüğü', 'Teftiş Kurulu Başkanlığı']

      // 9. İletişim Bilgileri
      if (kurum.telefon) vars.iletisimTelefon = kurum.telefon
      if (kurum.eposta) vars.iletisimEposta = kurum.eposta
      if (kurum.web) vars.iletisimWeb = kurum.web
      if (kurum.adres) vars.iletisimAdres = kurum.adres

      return vars
    },
    [dosya, dosyaContext, kalemler, firmalar, komisyonlar, toplamBedel]
  )

  // Aktif değişkenler
  const [variables, setVariables] = useState<EbysTemplateVariables>(() => {
    return mapDosyaToEbysVariables(selectedTemplate)
  })

  // Dosya veya Şablon değiştiğinde değişkenleri yeniden senkronize et
  useEffect(() => {
    setVariables(mapDosyaToEbysVariables(selectedTemplate))
  }, [selectedTemplate, mapDosyaToEbysVariables])

  const handleSelectTemplate = useCallback(
    (id: string) => {
      const target = EBYS_TEMPLATES.find((t) => t.id === id)
      if (target) {
        setSelectedTemplateId(id)
        setVariables(mapDosyaToEbysVariables(target))
      }
    },
    [mapDosyaToEbysVariables]
  )

  const handleVariableChange = useCallback((field: keyof EbysTemplateVariables, value: any) => {
    setVariables((prev) => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleResetVariables = useCallback(() => {
    setVariables(mapDosyaToEbysVariables(selectedTemplate))
  }, [selectedTemplate, mapDosyaToEbysVariables])

  const filteredTemplates = useMemo(() => {
    return EBYS_TEMPLATES.filter((tpl) => {
      const matchesCategory = activeCategory === 'hepsi' || tpl.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        tpl.name.toLowerCase().includes(query) ||
        tpl.description.toLowerCase().includes(query) ||
        tpl.categoryLabel.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  const currentHtml = useMemo(() => {
    return selectedTemplate.generateHtml(variables)
  }, [selectedTemplate, variables])

  const currentCss = useMemo(() => {
    return selectedTemplate.generateCss()
  }, [selectedTemplate])

  const handleCopyCode = useCallback(
    async (type: 'html' | 'css') => {
      const textToCopy = type === 'html' ? currentHtml : currentCss
      try {
        await navigator.clipboard.writeText(textToCopy)
        setCopyStatus(type === 'html' ? 'HTML Kopyalandı!' : 'CSS Kopyalandı!')
        setTimeout(() => setCopyStatus(null), 2500)
      } catch {
        setCopyStatus('Kopyalama başarısız oldu')
        setTimeout(() => setCopyStatus(null), 2000)
      }
    },
    [currentHtml, currentCss]
  )

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${variables.konu || selectedTemplate.name}</title>
  <style>
    ${currentCss}
    @page { size: A4 portrait; margin: 20mm 25mm 20mm 25mm; }
  </style>
</head>
<body>
  ${currentHtml}
</body>
</html>`)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }, [currentHtml, currentCss, variables.konu, selectedTemplate.name])

  // Evrakı Doğrudan Temin Dosyasına Kaydet (CQRS dosyaSablonVeriService)
  const handleSaveToDosya = useCallback(async () => {
    if (!dosya?.id) return
    try {
      const docCode = `ebys_${selectedTemplate.id}`
      await dosyaSablonVeriService.saveVeri(dosya.id, docCode, JSON.stringify(variables))
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error('EBYS belgesi dosyaya kaydedilemedi:', err)
    }
  }, [dosya?.id, selectedTemplate.id, variables])

  return {
    selectedTemplate,
    selectedTemplateId,
    activeCategory,
    searchQuery,
    activeTab,
    zoomLevel,
    copyStatus,
    sidebarTab,
    variables,
    filteredTemplates,
    currentHtml,
    currentCss,
    isSaved,
    setSelectedTemplateId: handleSelectTemplate,
    setActiveCategory,
    setSearchQuery,
    setActiveTab,
    setZoomLevel,
    setSidebarTab,
    handleVariableChange,
    handleResetVariables,
    handleCopyCode,
    handlePrint,
    handleSaveToDosya
  }
}
