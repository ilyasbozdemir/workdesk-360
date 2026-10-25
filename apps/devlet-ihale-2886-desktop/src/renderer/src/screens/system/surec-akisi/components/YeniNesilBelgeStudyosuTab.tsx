import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileSignature,
  FileText,
  Maximize2,
  Minimize2,
  Printer,
  Search,
  Send,
  Sparkles,
  X
} from 'lucide-react'
import { BelgeAyarlariPaneli } from './BelgeAyarlariPaneli'
import { TopluAyarOnayModal } from './TopluAyarOnayModal'
import { ResmiUstYaziTab } from '../../../ebys/components/ResmiUstYaziTab'
import IslakImzaliBelgeScreen from '../../../islak-imza/islak-imzali-belge.screen'
import { mergeEvrakSettings, validateDocumentSettings } from '../documentSettingsUtils'
import type { DocumentEvrakSettings, EbysRotaAdimi } from '../documentSettings.types'
import { TemplateRegistryService } from '@temin360/document-templates'
import { dosyaSablonVeriService } from '../../../../modules/dosya-sablon-veri'
import { resolveTemplateConfig } from '../../../dosya/components/DocumentPreviewModalV3/templateResolver'

const EMPTY_SETTINGS: DocumentEvrakSettings = {}

interface BelgeItem {
  id: string
  kod?: string
  ad: string
  zorunlu?: boolean
  asamaNo?: number
  asamaAdi?: string
  tamamlandi?: boolean
  pdfVar?: boolean
}

interface YeniNesilBelgeStudyosuTabProps {
  dosya: any
  belgeler: BelgeItem[]
  kalemler: any[]
  firmalar: any[]
  komisyonlar: any[]
  toplamBedel: number
  dosyaContext?: any
  onBelgeOlustur?: (belge: any) => Promise<any>
  onPreviewBelge?: (belge: any) => void
  onNavigateToV2?: () => void
  onClose?: () => void
}

export function YeniNesilBelgeStudyosuTab({
  dosya,
  belgeler,
  kalemler,
  firmalar,
  komisyonlar,
  toplamBedel,
  dosyaContext,
  onBelgeOlustur,
  onPreviewBelge,
  onNavigateToV2,
  onClose
}: YeniNesilBelgeStudyosuTabProps): React.JSX.Element {
  const [selectedDocId, setSelectedDocId] = useState<string>(belgeler[0]?.id || 'luzum-muzekkeresi')
  const [searchQuery, setSearchQuery] = useState('')
  const [evrakSettingsMap, setEvrakSettingsMap] = useState<Record<string, DocumentEvrakSettings>>(
    {}
  )
  const [isTopluAyarModalOpen, setIsTopluAyarModalOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Seçili belgeyi al
  const selectedDoc = useMemo(() => {
    return belgeler.find((b) => b.id === selectedDocId) || belgeler[0]
  }, [belgeler, selectedDocId])

  // Aktif belgenin evrak ayarları
  const currentEvrakSettings = useMemo(() => {
    if (!selectedDoc?.id) return EMPTY_SETTINGS
    return evrakSettingsMap[selectedDoc.id] || EMPTY_SETTINGS
  }, [evrakSettingsMap, selectedDoc])

  // Belge arama filtrelemesi
  const filteredBelgeler = useMemo(() => {
    if (!searchQuery.trim()) return belgeler
    const q = searchQuery.toLowerCase()
    return belgeler.filter(
      (b) =>
        b.ad.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.asamaAdi && b.asamaAdi.toLowerCase().includes(q))
    )
  }, [belgeler, searchQuery])

  // Her belgenin eksiklik doğrulamasını yap
  const validationMap = useMemo(() => {
    const result: Record<string, ReturnType<typeof validateDocumentSettings>> = {}
    belgeler.forEach((b) => {
      const template = TemplateRegistryService.getTemplateById(b.id)
      const evrak = evrakSettingsMap[b.id]
      result[b.id] = validateDocumentSettings(b.id, evrak, template)
    })
    return result
  }, [belgeler, evrakSettingsMap])

  // Debounce Timer Ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Unmount'ta debounce temizliği
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // DB Kalıcılık: CQRS dosyaSablonVeriService üzerinden güncelleme
  const saveEvrakSettingsToDb = useCallback(
    async (docId: string, settings: DocumentEvrakSettings) => {
      if (!dosya?.id) return
      try {
        const existingData = await dosyaSablonVeriService.getVeri(dosya.id, docId)
        const existingJson = existingData?.veri_json || '{}'
        const updatedJson = mergeEvrakSettings(existingJson, settings)
        await dosyaSablonVeriService.saveVeri(dosya.id, docId, updatedJson)
      } catch (err) {
        console.error('Evrak ayarları CQRS kaydı sırasında hata:', err)
      }
    },
    [dosya?.id]
  )

  // Evrak ayarı değiştiğinde state anında güncellenir, DB kaydı 400ms debounce edilir
  const handleEvrakSettingsChange = (updated: DocumentEvrakSettings) => {
    setEvrakSettingsMap((prev) => ({
      ...prev,
      [selectedDoc.id]: updated
    }))

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      saveEvrakSettingsToDb(selectedDoc.id, updated)
    }, 400)
  }

  // Toplu Ayar Uygulama: Dosyadaki personel bilgilerini ve onay rotasını tüm belgelere senkronize et (Paralel)
  const handleConfirmTopluAyar = async () => {
    const hazirlayanPersonel = dosya?.hazirlayan_personel_adi || 'Birim Görevlisi'
    const onayPersonel = dosya?.onaylayan_personel_adi || 'Harcama Yetkilisi'

    const defaultRota: EbysRotaAdimi[] = [
      {
        sira: 1,
        tur: 'hazirlayan',
        adSoyad: hazirlayanPersonel,
        unvan: 'Birim Görevlisi'
      },
      {
        sira: 2,
        tur: 'imza',
        adSoyad: onayPersonel,
        unvan: 'Harcama Yetkilisi'
      }
    ]

    const newMap = { ...evrakSettingsMap }
    await Promise.all(
      belgeler.map(async (b) => {
        const existing = newMap[b.id] || {}
        const updated: DocumentEvrakSettings = {
          ...existing,
          rotaAdimlari:
            existing.rotaAdimlari && existing.rotaAdimlari.length > 0
              ? existing.rotaAdimlari
              : defaultRota,
          rotaOnaylandi: true,
          sonGuncelleme: new Date().toISOString()
        }
        newMap[b.id] = updated
        await saveEvrakSettingsToDb(b.id, updated)
      })
    )
    setEvrakSettingsMap(newMap)
    setIsTopluAyarModalOpen(false)
  }

  // Açılışta TÜM belgelerin veritabanındaki kayıtlı evrak ayarlarını TOPLU yükle
  // Böylece henüz tıklanmamış belgeler de gerçek durumlarını yansıtır
  useEffect(() => {
    let isCancelled = false
    async function loadAllSavedSettings() {
      if (!dosya?.id || !belgeler || belgeler.length === 0) return
      try {
        const results = await Promise.all(
          belgeler.map(async (b) => {
            const data = await dosyaSablonVeriService.getVeri(dosya.id, b.id)
            if (data?.veri_json) {
              try {
                const parsed = JSON.parse(data.veri_json)
                if (parsed.evrakSettings) {
                  return {
                    id: b.id,
                    settings: parsed.evrakSettings as DocumentEvrakSettings
                  }
                }
              } catch {
                return null
              }
            }
            return null
          })
        )

        if (!isCancelled) {
          const loadedMap: Record<string, DocumentEvrakSettings> = {}
          results.forEach((item) => {
            if (item && item.settings) {
              loadedMap[item.id] = item.settings
            }
          })
          setEvrakSettingsMap((prev) => ({
            ...loadedMap,
            ...prev
          }))
        }
      } catch (err) {
        console.error('Toplu evrak ayarları okunamadı:', err)
      }
    }
    loadAllSavedSettings()
    return () => {
      isCancelled = true
    }
  }, [dosya?.id, belgeler])

  // Seçili belgenin şablon bileşeni çözücüsü
  const resolvedTemplate = useMemo(() => {
    return resolveTemplateConfig(selectedDoc?.id)
  }, [selectedDoc?.id])

  // Şablon bileşenine akacak zengin bağlam verisi
  const templateContextData = useMemo(() => {
    const idareAdi = dosyaContext?.idare_adi || dosya?.idare_adi || 'T.C. Kamu İdaresi'
    const birimAdi =
      dosyaContext?.birim_adi || dosya?.birim_adi || 'Destek Hizmetleri Dairesi Başkanlığı'
    const konu = dosya?.konu || dosya?.ad || 'Doğrudan Temin Mal/Hizmet Alımı'
    const dosyaNo = dosya?.dosya_no || dosya?.dosyaNo || '2026/DT-001'
    const tarih = dosya?.tarih || new Date().toLocaleDateString('tr-TR')

    return {
      idareAdi,
      birimAdi,
      dosyaNo,
      tarih,
      islemTarihi: tarih,
      konu,
      isTanimi: konu,
      kalemler: kalemler || [],
      malzemeler: kalemler || [],
      firmalar: firmalar || [],
      istekliler: firmalar || [],
      komisyonlar: komisyonlar || [],
      toplamBedel: toplamBedel || 0,
      yaklasikMaliyet: toplamBedel || 0,
      onaylayan: {
        adSoyad: dosya?.onaylayan_personel_adi || 'Harcama Yetkilisi',
        unvan: 'Harcama Yetkilisi'
      },
      hazirlayan: {
        adSoyad: dosya?.hazirlayan_personel_adi || 'Birim Görevlisi',
        unvan: 'Birim Görevlisi'
      },
      muhatap: currentEvrakSettings?.muhatap,
      ilgiListesi: currentEvrakSettings?.ilgiListesi,
      ekListesi: currentEvrakSettings?.ekListesi,
      dagitimListesi: currentEvrakSettings?.dagitimListesi,
      rotaAdimlari: currentEvrakSettings?.rotaAdimlari
    }
  }, [dosya, dosyaContext, kalemler, firmalar, komisyonlar, toplamBedel, currentEvrakSettings])

  // Firma listesi
  const firmalarList = useMemo(() => {
    return firmalar.map((f, i) => ({
      id: f.id || i + 1,
      unvan: f.unvan || f.firma_adi || `Firma ${i + 1}`
    }))
  }, [firmalar])

  const [activeSubView, setActiveSubView] = useState<'belgeler' | 'ust_yazi' | 'islak_imza'>(
    'belgeler'
  )

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 text-slate-100'
          : 'w-full flex flex-col gap-4 animate-in fade-in duration-300 text-slate-100'
      }
    >
      {/* Üst Bilgi Rozeti & Görünüm Seçici */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/25 ring-1 ring-blue-400/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Doğrudan Temin Belge &amp; Resmî Yazışma Stüdyosu
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shadow-xs">
                EYP 2.0 &amp; Yönetmelik Uyumlu
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tüm belgelerin muhatap, ilgi, ekler, dağıtım ve imza/paraf rotasını tek merkezden
              yönetin.
            </p>
          </div>
        </div>

        {/* Eylemler: Görünüm Seçici & Tam Ekran */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubView('belgeler')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'belgeler'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dosya Belgeleri &amp; Şablonlar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('ust_yazi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'ust_yazi'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/70'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Resmî Üst Yazı Düzenleyici (EYP)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('islak_imza')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'islak_imza'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850/70'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>Islak İmzalı Belge &amp; Takip</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-md transition-all cursor-pointer shrink-0"
            title={isFullScreen ? 'Pencere Moduna Dön' : 'Tam Ekran Stüdyo'}
          >
            {isFullScreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isFullScreen ? 'Pencereye Dön' : 'Tam Ekran'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 shadow-md transition-all cursor-pointer shrink-0"
              title="Stüdyodan Çık"
            >
              <X className="w-3.5 h-3.5" />
              <span>Stüdyoyu Kapat</span>
            </button>
          )}
        </div>
      </div>

      {activeSubView === 'islak_imza' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100">
          <IslakImzaliBelgeScreen
            isEmbedded={true}
            initialBilgiler={{
              konu:
                dosya?.konu || dosya?.ad || 'Doğrudan Temin Süreci Kapsamında Islak İmzalı Evrak',
              belgeSayisi: dosya?.dosya_no ? `${dosya.dosya_no}/TEMİN` : '2026/TEMİN-0142'
            }}
          />
        </div>
      ) : activeSubView === 'ust_yazi' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100">
          <ResmiUstYaziTab
            dosya={dosya}
            dosyaContext={dosyaContext}
            kalemler={kalemler}
            firmalar={firmalar}
            komisyonlar={komisyonlar}
          />
        </div>
      ) : (
        /* 3 SÜTUNLU ANA ÇALIŞMA ALANI */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[720px] items-stretch">
          {/* SOL SÜTUN (3 Kolon): BELGE LİSTESİ */}
          <div className="lg:col-span-3 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Arama Alanı */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/60">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Belge veya aşama ara..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Belge Kartları Listesi */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[660px]">
              {filteredBelgeler.map((belge, idx) => {
                const isSelected = belge.id === selectedDoc?.id
                const validation = validationMap[belge.id]
                const hasWarnings = validation && !validation.isValid

                return (
                  <div
                    key={`${belge.id}-${idx}`}
                    onClick={() => setSelectedDocId(belge.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedDocId(belge.id)
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/70 text-white shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-850/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-blue-400' : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`text-xs line-clamp-1 ${
                            isSelected ? 'font-bold text-white' : 'font-medium text-slate-200'
                          }`}
                        >
                          {belge.ad}
                        </span>
                      </div>
                      {belge.zorunlu && (
                        <span className="text-[10px] font-bold text-rose-300 bg-rose-950/60 border border-rose-800/70 px-1.5 py-0.5 rounded-md shrink-0">
                          Zorunlu
                        </span>
                      )}
                    </div>

                    {/* Eksiklik Uyarısı Rozetleri */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {belge.asamaAdi && (
                        <span className="text-[10px] text-slate-400 bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.5 rounded-md">
                          {belge.asamaAdi}
                        </span>
                      )}

                      {hasWarnings &&
                        validation.warnings.map((warn, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/70 px-1.5 py-0.5 rounded-md"
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            {warn}
                          </span>
                        ))}

                      {validation?.isValid && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/70 px-1.5 py-0.5 rounded-md font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Hazır
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ORTA SÜTUN (5 Kolon): CANLI ÖNİZLEME */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Önizleme Üst Çubuğu */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Önizleme: {selectedDoc?.ad}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onPreviewBelge && (
                  <button
                    type="button"
                    onClick={() => onPreviewBelge(selectedDoc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Tam Ekran Resmi Önizleme & Düzenleme"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Genişlet</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onPreviewBelge) {
                      onPreviewBelge(selectedDoc)
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer shadow-md shadow-blue-600/30"
                  title="Yazdır veya PDF Oluştur"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
              </div>
            </div>

            {/* Canlı Belge Çerçevesi & A4 Tuvali */}
            <div className="flex-1 bg-slate-950/90 p-4 md:p-6 flex items-start justify-center overflow-auto min-h-[580px]">
              {resolvedTemplate?.component ? (
                <div className="w-full max-w-3xl bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-700/60 p-6 md:p-10 my-2 transition-all">
                  <resolvedTemplate.component data={templateContextData as any} />
                </div>
              ) : (
                <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-slate-200 animate-in fade-in zoom-in-98 duration-200">
                  {/* Resmi Antet Taslağı */}
                  <div className="text-center border-b border-slate-800 pb-4">
                    <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      {dosyaContext?.idare_adi || dosya?.idare_adi || 'T.C. KAMU İDARESİ'}
                    </div>
                    <div className="text-xs font-semibold text-slate-300 mt-0.5">
                      {dosyaContext?.birim_adi ||
                        dosya?.birim_adi ||
                        'Destek Hizmetleri Dairesi Başkanlığı'}
                    </div>
                    <h3 className="text-sm font-bold text-blue-400 uppercase mt-2 tracking-wide">
                      {selectedDoc?.ad || 'Resmî Belge'}
                    </h3>
                  </div>

                  {/* Belge Künyesi */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dosya / Referans:</span>
                      <span className="font-bold text-white">
                        {dosya?.dosya_no || dosya?.dosyaNo || '2026/DT-001'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tarih:</span>
                      <span className="font-bold text-white">
                        {dosya?.tarih || new Date().toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Aşama:</span>
                      <span className="font-semibold text-indigo-400">
                        {selectedDoc?.asamaAdi || 'Süreç Belgesi'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Zorunluluk:</span>
                      <span
                        className={`font-semibold ${
                          selectedDoc?.zorunlu ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {selectedDoc?.zorunlu ? 'Zorunlu Belge' : 'Opsiyonel'}
                      </span>
                    </div>
                  </div>

                  {/* Evrak Ayarları Özeti */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Muhatap Kurum/Birim:</span>
                      <span className="font-semibold text-slate-200 max-w-[200px] truncate text-right">
                        {currentEvrakSettings?.muhatap?.hitap || 'Tanımlanmamış (Varsayılan)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">İlgi ve Ekler:</span>
                      <span className="font-semibold text-slate-200">
                        {currentEvrakSettings?.ilgiListesi?.length || 0} İlgi,{' '}
                        {currentEvrakSettings?.ekListesi?.length || 0} Ek
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">İmza / Paraf Rotası:</span>
                      <span className="font-semibold text-slate-200">
                        {currentEvrakSettings?.rotaAdimlari?.length || 0} Görevli / Yetkili
                      </span>
                    </div>
                  </div>

                  {/* Eylem Butonu */}
                  {onPreviewBelge && (
                    <button
                      type="button"
                      onClick={() => onPreviewBelge(selectedDoc)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Canlı Belgeyi Tam Ekranda Önizle &amp; Yazdır</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SAĞ SÜTUN (4 Kolon): BELGE AYARLARI PANELİ */}
          <div className="lg:col-span-4 flex flex-col">
            <BelgeAyarlariPaneli
              selectedBelgeId={selectedDoc?.id}
              belgeAdi={selectedDoc?.ad}
              evrakSettings={currentEvrakSettings}
              onChange={handleEvrakSettingsChange}
              dosyaFirmalari={firmalarList}
              oncekiBelgeler={belgeler.map((b) => ({
                id: b.id,
                baslik: b.ad
              }))}
              onTopluUygulaClick={() => setIsTopluAyarModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Toplu Ayar Onay Modali */}
      <TopluAyarOnayModal
        isOpen={isTopluAyarModalOpen}
        onClose={() => setIsTopluAyarModalOpen(false)}
        onConfirm={handleConfirmTopluAyar}
        dosyaKonu={dosya?.konu}
        etkilenecekBelgeler={belgeler.map((b) => ({ id: b.id, ad: b.ad }))}
        hazirlayanAd={dosya?.hazirlayan_personel_adi}
        onaylayanAd={dosya?.onaylayan_personel_adi}
      />
    </div>
  )
}
