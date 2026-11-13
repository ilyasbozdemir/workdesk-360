import React, { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Check,
  CheckCircle2,
  Compass,
  FileText,
  FolderOpen,
  GitFork,
  Globe,
  RotateCcw,
  Save,
  Sparkles,
  Users
} from 'lucide-react'
import type { RouteAssignee, RouteOverride, RouteValues } from '@temin360/contracts'
import {
  buildMergedPersonelList,
  getTemplateRouteDefinition,
  InstitutionalHeaderProvider
} from '@temin360/document-templates'
import {
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
  const { institutionName } = useSettingsStore()
  const [scopeMode, setScopeMode] = useState<'global' | 'dosya'>(() =>
    activeDosyaId ? 'dosya' : 'global'
  )
  const effectiveDosyaId = scopeMode === 'dosya' && activeDosyaId ? activeDosyaId : null

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(GLOBAL_ROTA_KEY)
  const [selectedStageId, setSelectedStageId] = useState<number | 'all'>('all')
  const [personelListesi, setPersonelListesi] = useState<any[]>([])
  const [birimListesi, setBirimListesi] = useState<any[]>([])
  const [kurumInfo, setKurumInfo] = useState<any>(null)
  const [dosyaInfo, setDosyaInfo] = useState<any>(null)
  const [savedConfigs, setSavedConfigs] = useState<Record<string, any>>(() =>
    getAllSavedRotaConfigs()
  )
  const [toastMsg, setToastMsg] = useState<string | null>(null)

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

    const baseDocData: Record<string, any> = {
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
      komisyonUyeleri: conf?.komisyonUyeleri || [],
      olurYazisi: conf?.olurYazisi ?? true,
      routeOverrides: []
    }

    const docValues = extractDocumentRouteValues(baseDocData, activeDefinition)
    const resolved = resolveRoute({
      definition: activeDefinition,
      settings: settingsValues,
      document: docValues,
      overrides: [],
      strict: false
    })

    setFormData(applyResolvedRouteToDocumentData(baseDocData, resolved))
  }, [
    selectedTemplateId,
    effectiveDosyaId,
    savedConfigs,
    dosyaInfo,
    kurumInfo,
    birimListesi,
    personelListesi,
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
    if (selectedStageId === 'all') return TEMPLATE_OPTIONS
    return filterTemplatesByStage(selectedStageId, TEMPLATE_OPTIONS)
  }, [selectedStageId])

  const activeTemplateTitle = useMemo(() => {
    if (selectedTemplateId === GLOBAL_ROTA_KEY) {
      return 'Tüm Belgeler İçin Genel Varsayılan Rota'
    }
    const found = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplateId)
    return found?.title || selectedTemplateId
  }, [selectedTemplateId])

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
    const gerceklestirmeVal = slots.gerceklestirmeGorevlisi as RouteAssignee | undefined
    const onaylayanVal = slots.onaylayan as RouteAssignee | undefined
    const makamVal = slots.sunulacakMakam as RouteAssignee | undefined
    const komisyonVal = (slots.komisyon ||
      slots.fiyatArastirmaGorevlileri ||
      slots.muayeneKomisyonu) as RouteAssignee[] | undefined

    return {
      belgeModu: (formData.belgeModu || 'standart') as any,
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

  const handleSaveCurrent = () => {
    saveRotaConfigForTemplate(selectedTemplateId, buildCurrentConfigToSave(), effectiveDosyaId)
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
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Şablon Bazlı Belge Rota &amp; Görevli Yönetimi</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-bold">
                SLOT ROTA SİSTEMİ
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Her belgenin kendi şablonundaki Kurumsal Antet, İlgili Birim / Müdürlük, Hazırlayan,
              Onaylayan, Komisyon / Araştırma Görevlileri (`person-list`) ve Sunulacak Makam (`unit`)
              alanlarını Belge Önizleme ile birebir aynı yapıda merkezi olarak yapılandırın.
            </p>
          </div>
        </div>

        {/* Kapsam Seçimi: Genel Kurum vs Aktif Dosya */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setScopeMode('global')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                scopeMode === 'global'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Genel Varsayılan (Settings)</span>
            </button>
            {activeDosyaId && (
              <button
                type="button"
                onClick={() => setScopeMode('dosya')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
        <div className="mx-6 mt-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Ana İçerik: Sol Şablon Listesi + Sağ Dinamik Slot Yapılandırma */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* SOL PANEL: Şablon Seçici */}
        <div className="col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {/* Genel Varsayılan Kartı */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTemplateId(GLOBAL_ROTA_KEY)}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                selectedTemplateId === GLOBAL_ROTA_KEY
                  ? 'bg-purple-50/90 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">
                    🌐 Tüm Belgeler İçin Genel Varsayılan Rota
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Özel ayarı olmayan tüm şablonlar buradaki görevli/makam atamalarını kullanır
                  </div>
                </div>
              </div>
              {selectedTemplateId === GLOBAL_ROTA_KEY && (
                <Check className="w-4 h-4 text-purple-600 shrink-0" />
              )}
            </button>
          </div>

          {/* Aşama Filtreleri */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Aşamaya Göre Belgeler
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedStageId('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
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
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-0">
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
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{tpl.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {tpl.categoryLabel} &bull; {tplDef.slots.length} Slot
                        {hasListSlot ? ' (Komisyon/Liste)' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {directConf ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                        Özel Tanımlı
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Varsayılan
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* SAĞ PANEL: Seçili Şablon İçin Dinamik Slot & Görevli Düzenleyici */}
        <div className="col-span-7 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {/* Sağ Üst Başlık ve Kaydet Aksiyonları */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Şablon Rota Şeması ({activeDefinition.slots.length} Slot)
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  &bull; <Users className="w-3 h-3" /> {mergedPersonel.length} Personel &bull;{' '}
                  <Building2 className="w-3 h-3" /> {birimListesi.length} Birim
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {activeTemplateTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCurrent}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Özel ayarı sil ve genel varsayılana dön"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
              <button
                type="button"
                onClick={handleApplyToAll}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Bu ayarları tüm 30 şablona uygula"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Tüm Belgelere Uygula</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCurrent}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Varsayılan Olarak Kaydet</span>
              </button>
            </div>
          </div>

          {/* Sağ Gövde: Şablonun Slotlarına Göre Dinamik Rota Formu */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
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
      </div>
    </div>
  )
}
