import React, { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Check,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  GitFork,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Users,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import type { RouteAssignee, RouteOverride, RouteValues } from '@temin360/contracts'
import {
  buildMergedPersonelList,
  getTemplateRouteDefinition,
  InstitutionalHeaderProvider
} from '@temin360/document-templates'
import {
  DocumentEngine,
  DocumentRenderer,
  resolveRoute,
  extractDocumentRouteValues,
  applyResolvedRouteToDocumentData
} from '@worksuite-360/document-engine'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useSettingsStore } from '../../store/settingsStore'
import { TEMPLATE_OPTIONS } from '../dosya/components/DocumentPreviewModalV3/templateResolver'
import {
  DOCUMENT_STAGES,
  filterTemplatesByStage
} from '../dosya/components/DocumentPreviewModalV3/stages'
import { DocumentPreviewRotaSection } from '../dosya/components/DocumentPreviewModalV3/components/DocumentPreviewRotaSection'
import { TemplateErrorBoundary } from '../dosya/components/DocumentPreviewModalV3/TemplateErrorBoundary'
import {
  GLOBAL_ROTA_KEY,
  applyRotaConfigToAllTemplates,
  buildSettingsRouteValues,
  getAllSavedRotaConfigs,
  getDirectRotaConfig,
  getRotaConfigForTemplate,
  removeRotaConfigForTemplate,
  saveRotaConfigForTemplate
} from '../../services/rotaDefaultsService'

export default function RotaYonetimiScreen(): React.JSX.Element {
  const { activeDosyaId } = useWorkspaceStore()
  const { institutionName, logoLeft, logoRight } = useSettingsStore()
  const [scopeMode, setScopeMode] = useState<'global' | 'dosya'>(() =>
    activeDosyaId ? 'dosya' : 'global'
  )
  const effectiveDosyaId = scopeMode === 'dosya' && activeDosyaId ? activeDosyaId : null

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(GLOBAL_ROTA_KEY)
  const [selectedStageId, setSelectedStageId] = useState<number | 'all'>('all')
  const [templateSearch, setTemplateSearch] = useState<string>('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [personelListesi, setPersonelListesi] = useState<any[]>([])
  const [birimListesi, setBirimListesi] = useState<any[]>([])
  const [kurumInfo, setKurumInfo] = useState<any>(null)
  const [dosyaInfo, setDosyaInfo] = useState<any>(null)
  const [dosyaKomisyonListesi, setDosyaKomisyonListesi] = useState<any[]>([])
  const [savedConfigs, setSavedConfigs] = useState<Record<string, any>>(() =>
    getAllSavedRotaConfigs()
  )
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Canlı A4 Belge Önizleme Durumları
  const [showPreview, setShowPreview] = useState<boolean>(true)
  const [previewScale, setPreviewScale] = useState<number>(0.45)
  const [samplePreviewTemplateKey, setSamplePreviewTemplateKey] = useState<string>(
    'piyasa-fiyat-arastirma-gorevlendirmesi'
  )
  const [baseDocData, setBaseDocData] = useState<Record<string, any>>({})
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Veritabanından kurum, personel, birim ve aktif dosya bilgilerini yükle
  useEffect(() => {
    let mounted = true
    const loadDbData = async () => {
      try {
        const ipc = (window as any)?.electron?.ipcRenderer
        if (!ipc) return

        const [pRes, bRes, kRes] = await Promise.all([
          ipc.invoke('db:query', 'SELECT * FROM TANIM_Personel WHERE aktif_mi = 1 ORDER BY ad_soyad ASC'),
          ipc.invoke('db:query', 'SELECT * FROM TANIM_Birim WHERE aktif_mi = 1 ORDER BY birim_adi ASC'),
          ipc.invoke('db:query', 'SELECT * FROM TANIM_Kurum LIMIT 1')
        ])

        if (!mounted) return
        if (pRes?.success && Array.isArray(pRes.data)) {
          setPersonelListesi(pRes.data)
        }
        let loadedBirimler: any[] = []
        if (bRes?.success && Array.isArray(bRes.data)) {
          loadedBirimler = [...bRes.data]
          setBirimListesi(loadedBirimler)
        }
        if (kRes?.success && Array.isArray(kRes.data) && kRes.data[0]) {
          setKurumInfo(kRes.data[0])
        }

        if (activeDosyaId) {
          const dRes = await ipc.invoke(
            'db:query',
            'SELECT * FROM DATA_TeminDosyasi WHERE id = ?',
            [activeDosyaId]
          )
          if (mounted && dRes?.success && dRes.data?.[0]) {
            const dRow = dRes.data[0]
            setDosyaInfo(dRow)

            // Aktif dosyanın komisyon atamalarını çek (TANIM_Personel ile zenginleştirilmiş)
            try {
              const komRes = await ipc.invoke(
                'db:query',
                `SELECT tk.*, 
                        COALESCE(NULLIF(tk.ad_soyad, ''), NULLIF(p.ad_soyad, ''), '') as resolved_ad_soyad,
                        COALESCE(NULLIF(tk.unvan, ''), NULLIF(p.unvan, ''), '') as resolved_unvan,
                        COALESCE(NULLIF(tk.birim, ''), NULLIF(p.birim, ''), '') as resolved_birim
                 FROM DATA_TeminKomisyon tk
                 LEFT JOIN TANIM_Personel p ON tk.personel_id = p.id
                 WHERE tk.temin_dosya_id = ? AND (tk.belgede_goster = 1 OR tk.belgede_goster IS NULL)
                 ORDER BY tk.id ASC`,
                [activeDosyaId]
              )
              if (mounted && komRes?.success && Array.isArray(komRes.data)) {
                setDosyaKomisyonListesi(komRes.data)
              }
            } catch (komErr) {
              console.warn('Dosya komisyon üyeleri yüklenemedi:', komErr)
            }

            // Dosyanın "İhalesi Yapılacak Birim / Müdürlük" alanı TANIM_Birim'de yoksa otomatik ekle ve bağla
            const rawDosyaBirim = String(
              dRow.birim || dRow.harcama_birimi || dRow.antet_ek_satir || ''
            ).trim()
            if (rawDosyaBirim) {
              const lowerTarget = rawDosyaBirim.toLocaleLowerCase('tr-TR')
              const existingBirim = loadedBirimler.find(
                (b) =>
                  (dRow.birim_id && Number(b.id) === Number(dRow.birim_id)) ||
                  String(b.birim_adi || b.ad || '')
                    .trim()
                    .toLocaleLowerCase('tr-TR') === lowerTarget
              )
              if (!existingBirim) {
                try {
                  const upperTitle = rawDosyaBirim.toLocaleUpperCase('tr-TR')
                  const defaultMakam =
                    dRow.sunulacak_makam ||
                    (upperTitle.endsWith('MÜDÜRLÜĞÜ')
                      ? `${upperTitle}NE`
                      : upperTitle.endsWith('BAŞKANLIĞI')
                      ? `${upperTitle}NA`
                      : `${upperTitle} MAKAMINA`)
                  const insRes = await ipc.invoke(
                    'db:run',
                    `INSERT INTO TANIM_Birim (ad, birim_adi, antet_ek_satir, sunum_makami, ihtiyac_yeri_eki, aktif_mi)
                     VALUES (?, ?, ?, ?, ?, 1)`,
                    [
                      rawDosyaBirim,
                      rawDosyaBirim,
                      dRow.antet_ek_satir || rawDosyaBirim,
                      defaultMakam,
                      dRow.ihtiyac_yeri || `${rawDosyaBirim} Hizmet Binası`
                    ]
                  )
                  if (insRes?.success && insRes.lastInsertRowid) {
                    const newBirimId = Number(insRes.lastInsertRowid)
                    await ipc.invoke(
                      'db:run',
                      'UPDATE DATA_TeminDosyasi SET birim_id = ? WHERE id = ? AND (birim_id IS NULL OR birim_id = 0)',
                      [newBirimId, activeDosyaId]
                    )
                    const createdBirim = {
                      id: newBirimId,
                      birim_adi: rawDosyaBirim,
                      antet_ek_satir: dRow.antet_ek_satir || rawDosyaBirim,
                      sunum_makami: defaultMakam,
                      ihtiyac_yeri_eki: dRow.ihtiyac_yeri || `${rawDosyaBirim} Hizmet Binası`,
                      aktif_mi: 1
                    }
                    if (mounted) {
                      setBirimListesi((prev) => [...prev, createdBirim])
                      setDosyaInfo((prev: any) =>
                        prev ? { ...prev, birim_id: prev.birim_id || newBirimId } : prev
                      )
                    }
                  }
                } catch {}
              }
            }
          }
        }
      } catch (err) {
        console.error('Rota yönetimi verileri yüklenemedi:', err)
      }
    }
    loadDbData()
    return () => {
      mounted = false
    }
  }, [activeDosyaId])

  // Kayıtlı rota değişikliklerini dinle
  useEffect(() => {
    const refresh = () => setSavedConfigs(getAllSavedRotaConfigs())
    window.addEventListener('temin360:rota-defaults-updated', refresh)
    return () => window.removeEventListener('temin360:rota-defaults-updated', refresh)
  }, [])

  const activeDefinition = useMemo(
    () => getTemplateRouteDefinition(selectedTemplateId),
    [selectedTemplateId]
  )

  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const conf = getRotaConfigForTemplate(selectedTemplateId, effectiveDosyaId)
    const settingsValues = buildSettingsRouteValues(selectedTemplateId, effectiveDosyaId)

    const fallbackKurumAdi =
      conf?.kurumAdi || kurumInfo?.kurum_adi || institutionName || 'KAMU KURUMU'
    const baseKurumAntet = InstitutionalHeaderProvider.parseKurumBaseAntetLines(
      kurumInfo,
      fallbackKurumAdi
    )

    const initialBirimId =
      conf?.birimId ?? (effectiveDosyaId ? dosyaInfo?.birim_id : null) ?? null
    const initialBirimAdi =
      conf?.birimAdi ||
      (effectiveDosyaId
        ? dosyaInfo?.birim || dosyaInfo?.harcama_birimi || dosyaInfo?.antet_ek_satir || ''
        : '') ||
      ''
    const initialAntetEkSatir =
      conf?.antetEkSatir || (effectiveDosyaId ? dosyaInfo?.antet_ek_satir || '' : '') || ''

    const birimRes = InstitutionalHeaderProvider.resolveBirimSelection({
      birimId: initialBirimId,
      birimAdi: initialBirimAdi,
      birimList: birimListesi,
      personelList: personelListesi,
      kurumRow: kurumInfo,
      baseAntetLines: baseKurumAntet,
      dosyaAntetEkSatir: initialAntetEkSatir,
      fallbackInstitutionName: fallbackKurumAdi
    })

    const resolvedAntetLines =
      Array.isArray(conf?.antetSatirlari) && conf.antetSatirlari.length > 0
        ? [...conf.antetSatirlari]
        : birimRes.antetSatirlari

    const resolvedBirimName = birimRes.birimAdi || initialBirimAdi

    const baseDocDataObj: Record<string, any> = {
      kurumAdi: fallbackKurumAdi,
      birimId: birimRes.birimId ?? initialBirimId,
      birim_id: birimRes.birimId ?? initialBirimId,
      birimAdi: resolvedBirimName,
      birim_adi: resolvedBirimName,
      birim: resolvedBirimName,
      mudurluk: resolvedBirimName,
      harcamaBirimi: resolvedBirimName,
      harcama_birimi: resolvedBirimName,
      ihalesiYapilacakBirim: resolvedBirimName,
      antetEkSatir: birimRes.antetEkSatir || initialAntetEkSatir,
      antet_ek_satir: birimRes.antetEkSatir || initialAntetEkSatir,
      antetSatirlari: resolvedAntetLines,
      hazirlayanPersonelAdi:
        conf?.hazirlayanPersonelAdi ||
        dosyaInfo?.hazirlayan_ad_soyad ||
        birimRes.gerceklestirmeGorevlisiAdi ||
        '',
      hazirlayanPersonelUnvan:
        conf?.hazirlayanPersonelUnvan ||
        dosyaInfo?.hazirlayan_unvan ||
        birimRes.gerceklestirmeGorevlisiUnvan ||
        '',
      gerceklestirmeGorevlisiAdi:
        conf?.gerceklestirmeGorevlisiAdi ||
        dosyaInfo?.gerceklestirme_gorevlisi_ad_soyad ||
        birimRes.gerceklestirmeGorevlisiAdi ||
        '',
      gerceklestirmeGorevlisiUnvani:
        conf?.gerceklestirmeGorevlisiUnvani ||
        dosyaInfo?.gerceklestirme_gorevlisi_unvan ||
        birimRes.gerceklestirmeGorevlisiUnvan ||
        '',
      onaylayanPersonelAdi:
        conf?.onaylayanPersonelAdi ||
        dosyaInfo?.harcama_yetkilisi_ad_soyad ||
        birimRes.harcamaYetkilisiAdi ||
        '',
      onaylayanPersonelUnvan:
        conf?.onaylayanPersonelUnvan ||
        dosyaInfo?.harcama_yetkilisi_unvan ||
        birimRes.harcamaYetkilisiUnvan ||
        '',
      sunulacakMakamAdi:
        conf?.sunulacakMakamAdi ||
        dosyaInfo?.sunulacak_makam ||
        birimRes.sunulacakMakamAdi ||
        '',
      komisyonUyeleri: (() => {
        if (Array.isArray(conf?.komisyonUyeleri) && conf.komisyonUyeleri.length > 0) {
          return conf.komisyonUyeleri
        }
        // Eğer Rota Yönetimi'nde henüz özel bir şablon ayarı kaydedilmemişse,
        // dosyanın DATA_TeminKomisyon masasındaki güncel personellerini kullan:
        if (Array.isArray(dosyaKomisyonListesi) && dosyaKomisyonListesi.length > 0) {
          const isMuayeneTemplate =
            selectedTemplateId.includes('muayene') || selectedTemplateId.includes('kabul')
          const filtered = dosyaKomisyonListesi.filter((tk) => {
            const gorev = String(tk.gorev || '').toLowerCase()
            const tur = String(tk.komisyon_turu || '').toLowerCase()
            if (isMuayeneTemplate) {
              return tur.includes('muayene') || tur.includes('kabul')
            }
            // Maliyet & Piyasa Fiyat Araştırması için Harcama Yetkilisi ve Gerçekleştirme Hariç
            return (
              !gorev.includes('harcama yetkili') &&
              !gorev.includes('gerçekleştirme') &&
              !gorev.includes('gerceklestirme') &&
              !gorev.includes('muhasebe')
            )
          })
          return filtered.map((tk) => ({
            id: tk.personel_id || tk.id,
            adSoyad: tk.resolved_ad_soyad || tk.ad_soyad || '',
            unvan: tk.resolved_unvan || tk.unvan || '',
            gorevi: tk.gorev || 'Fiyat Araştırma Görevlisi',
            imzaTuru: tk.imza_turu || 'İmza',
            asilMi: tk.asli_yedek === 'Yedek' ? 0 : 1,
            birimId: tk.birim_id,
            birim: tk.resolved_birim || tk.birim
          }))
        }
        return []
      })(),
      olurYazisi: conf?.olurYazisi ?? true,
      routeOverrides: []
    }

    const docValues = extractDocumentRouteValues(baseDocDataObj, activeDefinition)
    const resolved = resolveRoute({
      definition: activeDefinition,
      settings: settingsValues,
      document: docValues,
      overrides: [],
      strict: false
    })

    setFormData(applyResolvedRouteToDocumentData(baseDocDataObj, resolved))
  }, [
    selectedTemplateId,
    effectiveDosyaId,
    savedConfigs,
    dosyaInfo,
    kurumInfo,
    birimListesi,
    personelListesi,
    dosyaKomisyonListesi,
    institutionName,
    activeDefinition
  ])

  const mergedPersonel = useMemo(
    () =>
      buildMergedPersonelList(
        personelListesi,
        {
          ...dosyaInfo,
          ...formData
        },
        null,
        null
      ),
    [personelListesi, dosyaInfo, formData]
  )

  const filteredTemplates = useMemo(() => {
    let list =
      selectedStageId === 'all'
        ? TEMPLATE_OPTIONS
        : filterTemplatesByStage(selectedStageId, TEMPLATE_OPTIONS)

    if (templateSearch.trim()) {
      const q = templateSearch.trim().toLocaleLowerCase('tr-TR')
      list = list.filter(
        (t) =>
          t.title.toLocaleLowerCase('tr-TR').includes(q) ||
          t.id.toLocaleLowerCase('tr-TR').includes(q) ||
          (t.categoryLabel && t.categoryLabel.toLocaleLowerCase('tr-TR').includes(q))
      )
    }
    return list
  }, [selectedStageId, templateSearch])

  const activeTemplateTitle = useMemo(() => {
    if (selectedTemplateId === GLOBAL_ROTA_KEY) {
      return 'Tüm Belgeler İçin Genel Varsayılan Rota'
    }
    const found = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplateId)
    return found?.title || selectedTemplateId
  }, [selectedTemplateId])

  // Önizlenecek şablon anahtarı (Genel seçiliyken örnek şablonu, aksi halde doğrudan seçili şablonu gösterir)
  const effectivePreviewTemplateKey = useMemo(() => {
    if (selectedTemplateId === GLOBAL_ROTA_KEY) {
      return samplePreviewTemplateKey || 'piyasa-fiyat-arastirma-gorevlendirmesi'
    }
    return selectedTemplateId
  }, [selectedTemplateId, samplePreviewTemplateKey])

  // Önizlenecek şablonun temel veri modelini DocumentEngine üzerinden yükle
  useEffect(() => {
    let mounted = true
    const loadBase = async () => {
      setIsLoadingPreview(true)
      try {
        const targetKey = effectivePreviewTemplateKey
        if (!targetKey) return

        const docRecord = await DocumentEngine.loadOrCreateDocument({
          dosyaId: effectiveDosyaId || 0,
          templateKey: targetKey,
          forceDefault: !effectiveDosyaId
        })
        if (mounted && docRecord) {
          setBaseDocData({
            ...(docRecord.headerData || {}),
            ...(docRecord.data || {})
          })
        }
      } catch (err) {
        console.warn('Rota önizleme ana verisi yüklenemedi:', err)
      } finally {
        if (mounted) setIsLoadingPreview(false)
      }
    }
    loadBase()
    return () => {
      mounted = false
    }
  }, [effectivePreviewTemplateKey, effectiveDosyaId])

  // Rota editöründeki canlı değişiklikleri şablonun tam verisine harmanla
  const previewMergedData = useMemo(() => {
    const merged: Record<string, any> = {
      ...(baseDocData || {}),
      ...formData
    }

    if (
      formData.antetSatirlari &&
      Array.isArray(formData.antetSatirlari) &&
      formData.antetSatirlari.length > 0
    ) {
      merged.antetSatirlari = formData.antetSatirlari
    }
    if (formData.birimAdi) {
      merged.birimAdi = formData.birimAdi
      merged.birim = formData.birimAdi
      merged.mudurluk = formData.birimAdi
      merged.harcamaBirimi = formData.birimAdi
    }
    if (formData.kurumAdi) {
      merged.kurumAdi = formData.kurumAdi
    }
    if (formData.onaylayanPersonelAdi) {
      merged.onaylayanPersonelAdi = formData.onaylayanPersonelAdi
      merged.onaylayanPersonelUnvan = formData.onaylayanPersonelUnvan
      merged.harcamaYetkilisiAdi = formData.onaylayanPersonelAdi
      merged.harcamaYetkilisiUnvan = formData.onaylayanPersonelUnvan
      merged.baskanAdi = formData.onaylayanPersonelAdi
    }
    if (formData.hazirlayanPersonelAdi) {
      merged.hazirlayanPersonelAdi = formData.hazirlayanPersonelAdi
      merged.hazirlayanPersonelUnvan = formData.hazirlayanPersonelUnvan
      merged.gerceklestirmeGorevlisiAdi =
        formData.gerceklestirmeGorevlisiAdi || formData.hazirlayanPersonelAdi
      merged.gerceklestirmeGorevlisiUnvan =
        formData.gerceklestirmeGorevlisiUnvan || formData.hazirlayanPersonelUnvan
    }
    if (Array.isArray(formData.komisyonUyeleri)) {
      merged.komisyonUyeleri = formData.komisyonUyeleri
      merged.gorevliler = formData.komisyonUyeleri
      merged.fiyatKomisyonu = formData.komisyonUyeleri
      merged.muayeneKomisyonu = formData.komisyonUyeleri
      merged.gorevlendirilenler = formData.komisyonUyeleri
      merged.dagitimListesi = formData.komisyonUyeleri
    }
    if (formData.sunulacakMakamAdi) {
      merged.sunulacakMakamAdi = formData.sunulacakMakamAdi
      merged.sunulacakMakam = formData.sunulacakMakamAdi
      merged.makam = formData.sunulacakMakamAdi
    }
    if (formData.olurYazisi !== undefined) {
      merged.olurYazisi = formData.olurYazisi
    }

    merged.solLogo = formData.solLogo || logoLeft || null
    merged.sagLogo = formData.sagLogo || logoRight || null

    return merged
  }, [baseDocData, formData, logoLeft, logoRight])

  const buildCurrentConfigToSave = () => {
    const docValues = extractDocumentRouteValues(formData, activeDefinition)
    const settingsValues = buildSettingsRouteValues(selectedTemplateId, effectiveDosyaId)
    const rawOverrides: RouteOverride[] = Array.isArray(formData?.routeOverrides)
      ? formData.routeOverrides
      : []
    const allowed = new Set(activeDefinition.slots.map((s) => s.id))
    const validOverrides = rawOverrides.filter((o) => o && allowed.has(o.slotId))

    const resolved = resolveRoute({
      definition: activeDefinition,
      settings: settingsValues,
      document: docValues,
      overrides: validOverrides,
      strict: false
    })

    const slots: RouteValues = {}
    for (const step of resolved.steps) {
      if (step.value !== null) {
        slots[step.id] = step.value
      }
    }

    const hazirlayanVal = slots.hazirlayan as RouteAssignee | undefined
    const gerceklestirmeVal = slots.gerceklestirme as RouteAssignee | undefined
    const onaylayanVal = slots.onaylayan as RouteAssignee | undefined
    const makamVal = slots.makam as RouteAssignee | undefined
    const komisyonVal = slots.komisyon as RouteAssignee[] | undefined

    return {
      rota: Array.isArray(formData.rota) ? formData.rota : [],
      slots,
      birimId: formData.birimId ?? formData.birim_id ?? undefined,
      birimAdi:
        formData.birimAdi ||
        formData.birim_adi ||
        formData.birim ||
        formData.mudurluk ||
        undefined,
      antetEkSatir: formData.antetEkSatir || formData.antet_ek_satir || undefined,
      kurumAdi: formData.kurumAdi || undefined,
      antetSatirlari:
        Array.isArray(formData.antetSatirlari) && formData.antetSatirlari.length > 0
          ? formData.antetSatirlari
          : undefined,
      hazirlayanPersonelAdi: hazirlayanVal?.name || formData.hazirlayanPersonelAdi,
      hazirlayanPersonelUnvan: hazirlayanVal?.title || formData.hazirlayanPersonelUnvan,
      gerceklestirmeGorevlisiAdi:
        gerceklestirmeVal?.name || formData.gerceklestirmeGorevlisiAdi,
      gerceklestirmeGorevlisiUnvani:
        gerceklestirmeVal?.title || formData.gerceklestirmeGorevlisiUnvani,
      onaylayanPersonelAdi: onaylayanVal?.name || formData.onaylayanPersonelAdi,
      onaylayanPersonelUnvan: onaylayanVal?.title || formData.onaylayanPersonelUnvan,
      sunulacakMakamAdi: makamVal?.name || formData.sunulacakMakamAdi,
      komisyonUyeleri: Array.isArray(komisyonVal)
        ? komisyonVal.map((m) => ({
            id: m.id,
            adSoyad: m.name,
            unvan: m.title,
            gorevi: m.role,
            imzaTuru: m.imzaTuru || 'İmza',
            asilMi: m.asilMi ?? 1,
            birimId: m.unitId,
            birim: m.unitName
          }))
        : undefined,
      olurYazisi: formData.olurYazisi ?? true
    }
  }

  const handleSaveCurrent = async () => {
    const configToSave = buildCurrentConfigToSave()
    saveRotaConfigForTemplate(selectedTemplateId, configToSave, effectiveDosyaId)

    // Eğer aktif dosya seçiliyse, veritabanındaki kayıtlı snapshot'ı da hemen rota ile senkronize et
    if (effectiveDosyaId && selectedTemplateId !== GLOBAL_ROTA_KEY) {
      try {
        const ipc = (window as any)?.electron?.ipcRenderer
        if (ipc) {
          const snapshotPatch = {
            antetSatirlari: configToSave.antetSatirlari,
            birimAdi: configToSave.birimAdi,
            birimId: configToSave.birimId,
            antetEkSatir: configToSave.antetEkSatir,
            antetBirimGosterilsin: (configToSave as any).antetBirimGosterilsin !== false,
            hazirlayanPersonelAdi: configToSave.hazirlayanPersonelAdi,
            hazirlayanPersonelUnvan: configToSave.hazirlayanPersonelUnvan,
            onaylayanPersonelAdi: configToSave.onaylayanPersonelAdi,
            onaylayanPersonelUnvan: configToSave.onaylayanPersonelUnvan,
            gerceklestirmeGorevlisiAdi: configToSave.gerceklestirmeGorevlisiAdi,
            gerceklestirmeGorevlisiUnvan: configToSave.gerceklestirmeGorevlisiUnvani,
            olurYazisi: configToSave.olurYazisi,
            komisyonUyeleri: configToSave.komisyonUyeleri,
            gorevlendirilenler: configToSave.komisyonUyeleri,
            fiyatKomisyonu: configToSave.komisyonUyeleri,
            dagitimListesi: configToSave.komisyonUyeleri
          }
          const updRes = await ipc.invoke(
            'db:run',
            `UPDATE DATA_TeminBelgeSnapshot 
             SET veri_json = json_patch(COALESCE(veri_json, '{}'), ?),
                 updated_at = CURRENT_TIMESTAMP
             WHERE dosya_id = ? AND (
               sablon_kodu = ? 
               OR sablon_kodu = ? 
               OR sablon_kodu = ? 
               OR sablon_kodu = ?
               OR sablon_kodu = ?
               OR sablon_kodu = ?
             )`,
            [
              JSON.stringify(snapshotPatch),
              effectiveDosyaId,
              selectedTemplateId,
              selectedTemplateId.replace(/-/g, '_'),
              selectedTemplateId.replace(/_/g, '-'),
              `${selectedTemplateId}.html`,
              `${selectedTemplateId.replace(/-/g, '_')}.html`,
              `${selectedTemplateId.replace(/_/g, '-')}.html`
            ]
          )
          if (!updRes?.changes || updRes.changes === 0) {
            await ipc.invoke(
              'db:run',
              `INSERT INTO DATA_TeminBelgeSnapshot (dosya_id, sablon_kodu, veri_json, sablon_versiyon, created_at, updated_at)
               VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [effectiveDosyaId, selectedTemplateId, JSON.stringify(snapshotPatch)]
            )
          }
          window.dispatchEvent(
            new CustomEvent('documents:changed', { detail: { dosyaId: effectiveDosyaId } })
          )
        }
      } catch (err) {
        console.warn('Snapshot senkronizasyon hatası:', err)
      }
    }

    showToast(
      selectedTemplateId === GLOBAL_ROTA_KEY
        ? 'Genel varsayılan rota kaydedildi'
        : `"${activeTemplateTitle}" için varsayılan rota kaydedildi`
    )
  }

  const handleApplyToAll = () => {
    applyRotaConfigToAllTemplates(
      TEMPLATE_OPTIONS.map((t) => t.id),
      buildCurrentConfigToSave(),
      effectiveDosyaId
    )
    showToast('Rota ve görevli ayarları tüm 30 belge şablonuna varsayılan olarak uygulandı!')
  }

  const handleResetCurrent = () => {
    removeRotaConfigForTemplate(selectedTemplateId, effectiveDosyaId)
    showToast('Seçili şablonun özel rota ayarı sıfırlandı')
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Üst Başlık ve Kapsam Seçici */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <GitFork className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
              <span>Şablon Bazlı Belge Rota &amp; Görevli Yönetimi</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-bold shrink-0">
                SLOT ROTA SİSTEMİ
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Kurumsal Antet, İlgili Birim, Hazırlayan, Onaylayan ve Komisyon Görevlilerini canlı A4 önizlemesiyle yönetin.
            </p>
          </div>
        </div>

        {/* Eylem Çubuğu: Önizleme Toggle + Kapsam Seçimi */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Canlı Önizleme Aç/Kapat Butonu */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showPreview
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={showPreview ? 'Canlı A4 Önizleme Panelini Gizle' : 'Canlı A4 Önizleme Panelini Aç'}
          >
            {showPreview ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showPreview ? 'Canlı Önizleme Açık' : 'Önizlemeyi Göster'}</span>
          </button>

          {/* Kapsam Seçimi: Genel Kurum vs Aktif Dosya */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setScopeMode('global')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                scopeMode === 'global'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Genel Varsayılan</span>
            </button>
            {activeDosyaId && (
              <button
                type="button"
                onClick={() => setScopeMode('dosya')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  scopeMode === 'dosya'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Aktif Dosya (#{activeDosyaId})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bildirim Toast */}
      {toastMsg && (
        <div className="mx-5 mt-2.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Ana İçerik: Sol Şablon Listesi + Orta Dinamik Slot Yapılandırma + Sağ Canlı A4 Önizleme */}
      <div className="flex-1 min-h-0 flex gap-4 p-4 lg:p-5 overflow-hidden">
        {/* SOL PANEL: Şablon Seçici (Daraltılabilir / Expandable) */}
        {isSidebarCollapsed ? (
          <div className="w-12 shrink-0 flex flex-col items-center py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              title="Şablon Listesini Aç (Genişlet)"
              className="p-2 rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-5 h-5" />
            </button>
            <div className="w-6 h-px bg-slate-200 dark:bg-slate-800" />
            <div
              className="text-[10px] font-bold text-slate-400 [writing-mode:vertical-lr] rotate-180 tracking-wider uppercase select-none"
            >
              Şablon Listesi ({TEMPLATE_OPTIONS.length})
            </div>
          </div>
        ) : (
          <div className="w-64 lg:w-72 xl:w-80 shrink-0 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {/* Header: Başlık ve Daraltma Butonu */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Belge Şablonları ({TEMPLATE_OPTIONS.length})
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                title="Şablon Listesini Gizle (Alanı Genişlet)"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Genel Varsayılan Kartı */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTemplateId(GLOBAL_ROTA_KEY)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                  selectedTemplateId === GLOBAL_ROTA_KEY
                    ? 'bg-purple-50/90 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">
                      🌐 Genel Varsayılan Rota
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Tüm belgelerin ortak slot atamaları
                    </div>
                  </div>
                </div>
                {selectedTemplateId === GLOBAL_ROTA_KEY && (
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                )}
              </button>
            </div>

            {/* Arama ve Aşama Filtreleri */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Şablon ara..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedStageId('all')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                    selectedStageId === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tümü ({TEMPLATE_OPTIONS.length})
                </button>
                {DOCUMENT_STAGES.map((stg) => (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => setSelectedStageId(stg.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                      selectedStageId === stg.id
                        ? `${stg.badgeBg} ${stg.badgeText} ring-1 ring-blue-500/30`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {stg.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Şablon Listesi */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-0">
              {filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId
                const directConf = getDirectRotaConfig(tpl.id, effectiveDosyaId)
                const tplDef = getTemplateRouteDefinition(tpl.id)
                const hasListSlot = tplDef.slots.some((s) => s.kind === 'person-list')

                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{tpl.title}</div>
                        <div className="text-[9.5px] text-slate-400 truncate">
                          {tpl.categoryLabel} &bull; {tplDef.slots.length} Slot
                          {hasListSlot ? ' (Komisyon)' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {directConf ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                          Özel
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                          Genel
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ORTA PANEL: Seçili Şablon İçin Dinamik Slot & Görevli Düzenleyici */}
        <div
          className={`${
            showPreview ? 'w-[420px] lg:w-[460px] xl:w-[490px] shrink-0' : 'flex-1 min-w-0'
          } flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all`}
        >
          {/* Sol Panel Daraltıldığında Üstte Görünen Hızlı Seçim Barı */}
          {isSidebarCollapsed && (
            <div className="px-3 py-2 border-b border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/30 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Şablon listesini aç (Genişlet)"
                className="p-1.5 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer transition-colors"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                Şablon Seçimi:
              </span>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-purple-500 cursor-pointer"
              >
                <option value={GLOBAL_ROTA_KEY}>🌐 Genel Varsayılan Rota (Tüm Belgeler)</option>
                <optgroup label="Tüm Belge Şablonları">
                  {TEMPLATE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Üst Başlık ve Kaydet Aksiyonları */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {selectedTemplateId === GLOBAL_ROTA_KEY
                    ? 'Genel Slot Şeması'
                    : `Şablon Slot Şeması (${activeDefinition.slots.length} Slot)`}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  &bull; <Users className="w-3 h-3" /> {mergedPersonel.length} Personel
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {activeTemplateTitle}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleResetCurrent}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Özel ayarı sil ve genel varsayılana dön"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
              <button
                type="button"
                onClick={handleApplyToAll}
                className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Bu ayarları tüm 30 şablona uygula"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Tümüne Uygula</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCurrent}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>

          {/* Gövde: DocumentPreviewRotaSection */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
            <DocumentPreviewRotaSection
              formData={formData}
              setFormData={setFormData}
              personelListesi={mergedPersonel}
              birimListesi={birimListesi}
              supportsOlur={true}
              templateId={selectedTemplateId}
              dosyaId={effectiveDosyaId}
            />
          </div>
        </div>

        {/* SAĞ PANEL: Canlı Belge Önizlemesi (A4 Tuvali) */}
        {showPreview && (
          <div className="flex-1 min-w-[360px] flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs animate-in fade-in duration-200">
            {/* Önizleme Araç Çubuğu */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                    Canlı Belge Önizlemesi
                  </span>
                  {selectedTemplateId === GLOBAL_ROTA_KEY ? (
                    <div className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                      <span>Örnek Şablon:</span>
                      <select
                        value={samplePreviewTemplateKey}
                        onChange={(e) => setSamplePreviewTemplateKey(e.target.value)}
                        className="bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded px-1.5 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-200 cursor-pointer max-w-[200px] truncate"
                      >
                        {TEMPLATE_OPTIONS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 block truncate">
                      {activeTemplateTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Zoom & Kontroller */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewScale((prev) => Math.max(0.25, parseFloat((prev - 0.05).toFixed(2))))}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                  title="Küçült"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/80 dark:border-slate-700">
                  {[0.35, 0.45, 0.55].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPreviewScale(s)}
                      className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded cursor-pointer transition-all ${
                        Math.abs(previewScale - s) < 0.01
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      %{Math.round(s * 100)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewScale((prev) => Math.min(1.0, parseFloat((prev + 0.05).toFixed(2))))}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                  title="Büyüt"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-1"
                  title="Önizlemeyi Gizle"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Kağıt Çizim Alanı */}
            <div className="flex-1 bg-slate-100/90 dark:bg-slate-950 flex justify-center overflow-auto p-4 custom-scrollbar min-h-0 min-w-0 relative [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] dark:[background-image:radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:24px_24px]">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Belge şablonu hazırlanıyor...</span>
                </div>
              ) : (
                <TemplateErrorBoundary>
                  <div className="origin-top transition-transform duration-150">
                    <DocumentRenderer
                      templateKey={effectivePreviewTemplateKey}
                      data={previewMergedData}
                      orientation="portrait"
                      chrome="paper"
                      scale={previewScale}
                      isEditing={false}
                    />
                  </div>
                </TemplateErrorBoundary>
              )}
            </div>

            {/* Alt Bilgilendirme Çubuğu */}
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
              <span className="truncate">
                💡 Rota panelindeki yetkili ve komisyon seçimleri anında A4 sayfasına yansıtılır.
              </span>
              <span className="font-mono text-[9px] text-slate-400/80 shrink-0 ml-2">
                Ölçek: %{Math.round(previewScale * 100)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
