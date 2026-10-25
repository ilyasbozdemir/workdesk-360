import { useState, useRef, useMemo, useEffect } from 'react'
import { BASE_DATA, PRESETS } from './constants'
import { RotaAdimi } from './types'
import { useSettingsStore } from '../../../../store/settingsStore'

export interface UseResmiUstYaziOptions {
  dosya?: any
  dosyaContext?: any
  kalemler?: any[]
  firmalar?: any[]
  komisyonlar?: any[]
}

export function useResmiUstYazi(options?: UseResmiUstYaziOptions) {
  const {
    dosya,
    dosyaContext,
    kalemler: initialKalemler,
    firmalar: initialFirmalar,
    komisyonlar: initialKomisyonlar
  } = options || {}

  // Uygulamadaki dinamik kurum ayarları
  const {
    institutionName,
    harcamaBirimAdi,
    logoLeft,
    logoRight,
    institutionLogo,
    detsisKodu,
    adminName,
    adminTitle
  } = useSettingsStore()

  // Dinamik antet: Dosya veya kurum ayarlarından beslenir
  const initialAntet = useMemo(() => {
    const kurum = dosyaContext?.idare_adi || dosya?.idare_adi || institutionName
    const birim = dosyaContext?.birim_adi || dosya?.birim_adi || harcamaBirimAdi
    if (kurum || birim) {
      const lines = ['T.C.']
      if (kurum) lines.push(kurum.toUpperCase())
      if (birim) lines.push(birim)
      return lines.join('\n')
    }
    return BASE_DATA.antet
  }, [dosyaContext, dosya, institutionName, harcamaBirimAdi])

  // Dinamik kalemler: Dosyadaki gerçek ihtiyaç kalemlerinden beslenir
  const initialKalemlerText = useMemo(() => {
    if (initialKalemler && initialKalemler.length > 0) {
      return initialKalemler
        .map((k) => {
          const ad = k.kalem_adi || k.malzeme_adi || k.ad || ''
          const aciklama = k.aciklama || k.ozellik || ''
          const birim = k.birim || 'Adet'
          const miktar = k.miktar || 1
          return `${ad} | ${aciklama} | ${birim} | ${miktar}`
        })
        .join('\n')
    }
    return PRESETS.arastirma.kalemler
  }, [initialKalemler])

  // Dinamik rota adımları: Dosyadaki personel ve onaylayandan beslenir
  const initialRota = useMemo<RotaAdimi[]>(() => {
    const adimlar: RotaAdimi[] = []
    // 1. Hazırlayan
    adimlar.push({
      t: 'Hazırlayan',
      a: dosya?.hazirlayan_personel_adi || adminName || 'Birim Görevlisi',
      u: dosya?.hazirlayan_personel_unvani || adminTitle || 'V.H.K.İ.'
    })

    // 2. Komisyon veya Şube Müdürü Paraf
    if (initialKomisyonlar && initialKomisyonlar.length > 0) {
      initialKomisyonlar.slice(0, 2).forEach((k) => {
        adimlar.push({
          t: 'Paraf',
          a: k.ad || k.personel_adi || k.ad_soyad || '',
          u: k.unvan || k.gorev || 'Komisyon Üyesi'
        })
      })
    } else {
      adimlar.push({
        t: 'Paraf',
        a: '',
        u: 'Şube Müdürü'
      })
    }

    // 3. Onaylayan / Harcama Yetkilisi
    adimlar.push({
      t: 'İmza',
      a: dosya?.onaylayan_personel_adi || '',
      u: dosya?.onaylayan_personel_unvani || 'Harcama Yetkilisi'
    })

    return adimlar
  }, [dosya, adminName, adminTitle, initialKomisyonlar])

  const [templateKey, setTemplateKey] = useState<'arastirma' | 'bos'>('arastirma')
  const [activeRightTab, setActiveRightTab] = useState<'onizleme' | 'rota'>('onizleme')

  // Form states (Gerçek uygulama verileri ile başlar)
  const [antet, setAntet] = useState(initialAntet)
  const [solLogo, setSolLogo] = useState<string>(logoLeft || institutionLogo || '')
  const [sagLogo, setSagLogo] = useState<string>(logoRight || '')
  const [detsis, setDetsis] = useState(detsisKodu || BASE_DATA.detsis)
  const [yil, setYil] = useState(
    dosya?.tarih ? String(new Date(dosya.tarih).getFullYear()) : BASE_DATA.yil
  )
  const [sayisi, setSayisi] = useState(dosya?.dosya_no || dosya?.dosyaNo || BASE_DATA.sayisi)
  const [konu, setKonu] = useState(dosya?.konu || PRESETS.arastirma.konu)
  const [tarih, setTarih] = useState(() => {
    if (dosya?.tarih) {
      try {
        const d = new Date(dosya.tarih)
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
      } catch {
        // fallback
      }
    }
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [dagitimli, setDagitimli] = useState(false)
  const [muhatap, setMuhatap] = useState(PRESETS.arastirma.muhatap)
  const [ilgi, setIlgi] = useState(PRESETS.arastirma.ilgi)
  const [aciklama, setAciklama] = useState(PRESETS.arastirma.aciklama)
  const [imzalar, setImzalar] = useState(
    dosya?.onaylayan_personel_adi
      ? `Harcama Yetkilisi | ${dosya.onaylayan_personel_adi} | ${dosya.onaylayan_personel_unvani || 'Harcama Yetkilisi'}`
      : PRESETS.arastirma.imzalar
  )
  const [eimza, setEimza] = useState(PRESETS.arastirma.eimza)
  const [kod, setKod] = useState('A1B2C3D4-E5F6-7890')
  const [kalemler, setKalemler] = useState(initialKalemlerText)
  const [fiyat, setFiyat] = useState(PRESETS.arastirma.fiyat)
  const [firma, setFirma] = useState(PRESETS.arastirma.firma)
  const [ek, setEk] = useState(PRESETS.arastirma.ek)
  const [gereg, setGereg] = useState(PRESETS.arastirma.gereg)
  const [bilgi, setBilgi] = useState(PRESETS.arastirma.bilgi)
  const [kurumici, setKurumici] = useState(PRESETS.arastirma.kurumici)
  const [adres, setAdres] = useState(BASE_DATA.adres)
  const [web, setWeb] = useState(BASE_DATA.web)
  const [eposta, setEposta] = useState(BASE_DATA.eposta)
  const [kep, setKep] = useState(BASE_DATA.kep)
  const [hazad, setHazad] = useState(dosya?.hazirlayan_personel_adi || adminName || BASE_DATA.hazad)
  const [hazun, setHazun] = useState(
    dosya?.hazirlayan_personel_unvani || adminTitle || BASE_DATA.hazun
  )
  const [haztel, setHaztel] = useState(BASE_DATA.haztel)

  const [copyToast, setCopyToast] = useState(false)

  // Rota state (Dinamik personel ile başlar)
  const [rota, setRota] = useState<RotaAdimi[]>(initialRota)

  // Dosya veya kurum verisi sonradan yüklendiğinde formu senkronize et
  useEffect(() => {
    if (initialAntet && initialAntet !== BASE_DATA.antet) {
      setAntet(initialAntet)
    }
  }, [initialAntet])

  useEffect(() => {
    if (logoLeft) setSolLogo(logoLeft)
    else if (institutionLogo) setSolLogo(institutionLogo)
    if (logoRight) setSagLogo(logoRight)
  }, [logoLeft, logoRight, institutionLogo])

  useEffect(() => {
    if (detsisKodu) setDetsis(detsisKodu)
  }, [detsisKodu])

  useEffect(() => {
    if (dosya?.dosya_no || dosya?.dosyaNo) {
      setSayisi(dosya.dosya_no || dosya.dosyaNo)
    }
    if (dosya?.konu) {
      setKonu(dosya.konu)
    }
    if (dosya?.hazirlayan_personel_adi) {
      setHazad(dosya.hazirlayan_personel_adi)
    }
  }, [dosya])

  useEffect(() => {
    if (initialKalemler && initialKalemler.length > 0) {
      setKalemler(initialKalemlerText)
    }
  }, [initialKalemlerText, initialKalemler])

  useEffect(() => {
    if (initialRota.length > 0) {
      setRota(initialRota)
    }
  }, [initialRota])

  // Accordion active sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    antet: true,
    sayi: false,
    muhatap: true,
    imza: false,
    kalemler: false,
    ek: false,
    alt: false
  })

  const sheetRef = useRef<HTMLDivElement>(null)

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handlePresetChange = (key: 'arastirma' | 'bos') => {
    setTemplateKey(key)
    const p = PRESETS[key]
    setKonu(p.konu)
    setMuhatap(p.muhatap)
    setAciklama(p.aciklama)
    setImzalar(p.imzalar)
    setKalemler(p.kalemler)
    setFiyat(p.fiyat)
    setFirma(p.firma)
    setKurumici(p.kurumici)
    setIlgi(p.ilgi)
    setEk(p.ek)
    setGereg(p.gereg)
    setBilgi(p.bilgi)
    setEimza(p.eimza)
    setDagitimli(false)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'sol' | 'sag') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (side === 'sol') setSolLogo(reader.result as string)
      else setSagLogo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyText = async () => {
    if (!sheetRef.current) return
    try {
      await navigator.clipboard.writeText(sheetRef.current.innerText)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2000)
    } catch {
      // ignore
    }
  }

  const antetLines = useMemo(
    () =>
      antet
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [antet]
  )
  const ilgiLines = useMemo(
    () =>
      ilgi
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [ilgi]
  )
  const aciklamaParagraphs = useMemo(
    () =>
      aciklama
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    [aciklama]
  )
  const imzaList = useMemo(
    () =>
      imzalar
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((x) => {
          const parts = x.split('|').map((z) => z.trim())
          return { g: parts[0] || '', a: parts[1] || '', u: parts[2] || '' }
        }),
    [imzalar]
  )
  const kalemList = useMemo(
    () =>
      kalemler
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((x) => x.split('|').map((z) => z.trim())),
    [kalemler]
  )
  const ekLines = useMemo(
    () =>
      ek
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [ek]
  )
  const geregLines = useMemo(
    () =>
      gereg
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [gereg]
  )
  const bilgiLines = useMemo(
    () =>
      bilgi
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [bilgi]
  )

  const formatTrDate = (isoDate: string) => {
    if (!isoDate) return ''
    const parts = isoDate.split('-')
    if (parts.length !== 3) return isoDate
    return `${parts[2]}.${parts[1]}.${parts[0]}`
  }

  const handleAddRotaStep = () => {
    setRota((prev) => {
      const copy = [...prev]
      copy.splice(Math.max(copy.length - 1, 0), 0, { t: 'Paraf', a: '', u: '' })
      return copy
    })
  }

  const handleDeleteRotaStep = (index: number) => {
    setRota((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleUpdateRotaStep = (index: number, field: keyof RotaAdimi, value: any) => {
    setRota((prev) => prev.map((step, idx) => (idx === index ? { ...step, [field]: value } : step)))
  }

  return {
    templateKey,
    activeRightTab,
    setActiveRightTab,
    antet,
    setAntet,
    solLogo,
    sagLogo,
    detsis,
    setDetsis,
    yil,
    setYil,
    sayisi,
    setSayisi,
    konu,
    setKonu,
    tarih,
    setTarih,
    dagitimli,
    setDagitimli,
    muhatap,
    setMuhatap,
    ilgi,
    setIlgi,
    aciklama,
    setAciklama,
    imzalar,
    setImzalar,
    eimza,
    setEimza,
    kod,
    setKod,
    kalemler,
    setKalemler,
    fiyat,
    setFiyat,
    firma,
    setFirma,
    ek,
    setEk,
    gereg,
    setGereg,
    bilgi,
    setBilgi,
    kurumici,
    setKurumici,
    adres,
    setAdres,
    web,
    setWeb,
    eposta,
    setEposta,
    kep,
    setKep,
    hazad,
    setHazad,
    hazun,
    setHazun,
    haztel,
    setHaztel,
    copyToast,
    rota,
    openSections,
    sheetRef,
    toggleSection,
    handlePresetChange,
    handleLogoUpload,
    handlePrint,
    handleCopyText,
    handleAddRotaStep,
    handleDeleteRotaStep,
    handleUpdateRotaStep,
    antetLines,
    ilgiLines,
    aciklamaParagraphs,
    imzaList,
    kalemList,
    ekLines,
    geregLines,
    bilgiLines,
    formatTrDate
  }
}
