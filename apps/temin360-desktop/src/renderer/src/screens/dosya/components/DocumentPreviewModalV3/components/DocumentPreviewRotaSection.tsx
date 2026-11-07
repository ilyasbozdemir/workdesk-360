import React from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  GitFork,
  MoveDown,
  MoveUp,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserCheck,
  Users
} from 'lucide-react'
import type {
  ResolvedRouteStep,
  RouteAssignee,
  RouteOverride,
  RouteValue,
  RouteValues
} from '@temin360/contracts'
import {
  cleanPersonelName,
  buildMergedPersonelList,
  filterPersonelByBirim,
  validateBirimAndPersonelAssignments,
  getTemplateRouteDefinition
} from '@temin360/document-templates'
import {
  InstitutionalHeaderProvider,
  resolveRoute,
  extractDocumentRouteValues,
  applyResolvedRouteToDocumentData
} from '@worksuite-360/document-engine'
import {
  buildSettingsRouteValues,
  saveRotaConfigForTemplate,
  GLOBAL_ROTA_KEY
} from '../../../../../services/rotaDefaultsService'

export type BelgeModuType = 'standart' | 'koordinasyonlu' | 'hizli_onay'

export interface RotaAdimItem {
  t?: 'Hazırlayan' | 'Paraf' | 'Koordinasyon' | 'İmza' | 'Olur' | string
  a?: string
  u?: string
  tarih?: string
  sira?: number
}

interface DocumentPreviewRotaSectionProps {
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  personelListesi?: Array<{
    id?: number | string
    ad_soyad?: string
    unvan?: string
    birim?: string
    birim_id?: number | string | null
    aktif_mi?: number | boolean | null
  }>
  birimListesi?: Array<{
    id?: number | string
    birim_adi?: string
    sunum_makami?: string
    ad?: string
    kisa_ad?: string
    antet_ek_satir?: string
    ihtiyac_yeri_eki?: string
    harcama_yetkilisi_id?: number
    harcama_yetkilisi_unvan?: string
    gerceklestirme_gorevlisi_id?: number
    gerceklestirme_gorevlisi_unvan?: string
    ilgili_personel_id?: number
    aktif_mi?: number | boolean | null
  }>
  supportsOlur?: boolean
  templateId?: string
  dosyaId?: number | string | null
}

function getOriginMeta(origin: ResolvedRouteStep['origin']): {
  label: string
  className: string
} {
  switch (origin) {
    case 'override':
      return {
        label: '✏️ Manuel Seçim',
        className:
          'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      }
    case 'document':
      return {
        label: '📁 Dosyadan',
        className:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
      }
    case 'settings':
      return {
        label: '⚙️ Varsayılan Ayar',
        className:
          'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
      }
    default:
      return {
        label: 'Atanmadı',
        className:
          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
      }
  }
}

export function DocumentPreviewRotaSection({
  formData,
  setFormData,
  personelListesi = [],
  birimListesi = [],
  templateId,
  dosyaId
}: DocumentPreviewRotaSectionProps): React.JSX.Element {
  const [savedFeedback, setSavedFeedback] = React.useState<string | null>(null)
  const [settingsVersion, setSettingsVersion] = React.useState(0)
  const [allowCrossUnitPersonnel, setAllowCrossUnitPersonnel] = React.useState<boolean>(
    () => Boolean(formData?.allowCrossUnitPersonnel)
  )
  const [showAntetLinesEditor, setShowAntetLinesEditor] = React.useState<boolean>(false)

  React.useEffect(() => {
    const onUpdated = () => setSettingsVersion((v) => v + 1)
    window.addEventListener('temin360:rota-defaults-updated', onUpdated)
    return () => window.removeEventListener('temin360:rota-defaults-updated', onUpdated)
  }, [])

  const definition = React.useMemo(
    () => getTemplateRouteDefinition(templateId || GLOBAL_ROTA_KEY),
    [templateId]
  )

  const activeBirimList = React.useMemo(() => {
    if (birimListesi && birimListesi.length > 0) return birimListesi
    if (Array.isArray(formData?.birimListesi) && formData.birimListesi.length > 0) {
      return formData.birimListesi
    }
    if (typeof window !== 'undefined' && Array.isArray((window as any).__activeBirimListesi)) {
      return (window as any).__activeBirimListesi
    }
    return []
  }, [birimListesi, formData?.birimListesi])

  const currentBirimId = formData?.birimId ?? formData?.birim_id ?? null
  const currentBirimAdi =
    formData?.birimAdi ||
    formData?.birim_adi ||
    formData?.birim ||
    formData?.mudurluk ||
    formData?.harcamaBirimi ||
    ''

  const currentAntetLines: string[] = React.useMemo(() => {
    if (Array.isArray(formData?.antetSatirlari) && formData.antetSatirlari.length > 0) {
      return formData.antetSatirlari.map((s: unknown) => String(s ?? ''))
    }
    if (typeof formData?.antetSatirlari === 'string' && formData.antetSatirlari.trim()) {
      try {
        const parsed = JSON.parse(formData.antetSatirlari)
        if (Array.isArray(parsed)) return parsed.map((s: unknown) => String(s ?? ''))
      } catch {
        return formData.antetSatirlari
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
    }
    return InstitutionalHeaderProvider.parseKurumBaseAntetLines(
      null,
      formData?.kurumAdi || 'KAMU KURUMU'
    )
  }, [formData?.antetSatirlari, formData?.kurumAdi])

  const currentBirimResolution = React.useMemo(
    () =>
      InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: currentBirimId,
        birimAdi: currentBirimAdi,
        birimList: activeBirimList,
        personelList: personelListesi,
        baseAntetLines: currentAntetLines,
        fallbackInstitutionName: formData?.kurumAdi
      }),
    [
      currentBirimId,
      currentBirimAdi,
      activeBirimList,
      personelListesi,
      currentAntetLines,
      formData?.kurumAdi
    ]
  )

  const rawMergedPersonelList = React.useMemo(
    () =>
      buildMergedPersonelList(personelListesi, {
        ...formData,
        birimId: undefined,
        birim_id: undefined,
        birimAdi: undefined,
        birim: undefined,
        mudurluk: undefined
      }),
    [personelListesi, formData]
  )

  const filteredPersonelResult = React.useMemo(
    () =>
      filterPersonelByBirim(rawMergedPersonelList, {
        birimId: currentBirimResolution.birimId ?? currentBirimId,
        birimAdi: currentBirimResolution.birimAdi || currentBirimAdi,
        birimList: activeBirimList,
        includeOtherUnits: allowCrossUnitPersonnel
      }),
    [
      rawMergedPersonelList,
      currentBirimResolution.birimId,
      currentBirimResolution.birimAdi,
      currentBirimId,
      currentBirimAdi,
      activeBirimList,
      allowCrossUnitPersonnel
    ]
  )

  const mergedPersonelList = filteredPersonelResult.filteredList

  const resolvedRoute = React.useMemo(() => {
    const documentValues = extractDocumentRouteValues(formData, definition)
    const settingsValues = buildSettingsRouteValues(templateId || GLOBAL_ROTA_KEY, dosyaId)
    const rawOverrides: RouteOverride[] = Array.isArray(formData?.routeOverrides)
      ? formData.routeOverrides
      : []
    const allowed = new Set(definition.slots.map((s) => s.id))
    const validOverrides = rawOverrides.filter((o) => o && allowed.has(o.slotId))

    return resolveRoute({
      definition,
      settings: settingsValues,
      document: documentValues,
      overrides: validOverrides,
      strict: false
    })
  }, [definition, formData, templateId, dosyaId, settingsVersion])

  // Seçili birim ve mevcut atanmış personeller arasındaki uyumsuzluk / pasiflik uyarıları
  const validationWarnings = React.useMemo(() => {
    const assignedPersons: Array<{
      slotId: string
      slotLabel: string
      name: string
      id?: string | number | null
    }> = []

    for (const step of resolvedRoute.steps) {
      if (!step.value) continue
      if (step.kind === 'person' && !Array.isArray(step.value)) {
        if (step.value.name) {
          assignedPersons.push({
            slotId: step.id,
            slotLabel: step.label,
            name: step.value.name,
            id: step.value.id
          })
        }
      } else if (step.kind === 'person-list' && Array.isArray(step.value)) {
        for (const member of step.value) {
          if (member?.name) {
            assignedPersons.push({
              slotId: step.id,
              slotLabel: step.label,
              name: member.name,
              id: member.id
            })
          }
        }
      }
    }

    if (Array.isArray(formData?.rota)) {
      for (const r of formData.rota) {
        if (r?.a && String(r.a).trim()) {
          assignedPersons.push({
            slotId: 'rota',
            slotLabel: r.t || 'Rota Adımı',
            name: String(r.a).trim()
          })
        }
      }
    }

    return validateBirimAndPersonelAssignments({
      birimId: currentBirimId,
      birimAdi: currentBirimAdi,
      birimList: activeBirimList,
      personelList: personelListesi,
      assignedPersons
    })
  }, [
    currentBirimId,
    currentBirimAdi,
    activeBirimList,
    personelListesi,
    resolvedRoute.steps,
    formData?.rota
  ])

  // Birim değiştiğinde resmi antet ve birim alanlarını çöz; mevcut manuel görevli seçimlerini SİLME!
  const handleSelectBirim = (rawBirimId: string) => {
    setFormData((prev: any) => {
      if (!rawBirimId) {
        return {
          ...prev,
          birimId: null,
          birim_id: null
        }
      }

      const prevLines = Array.isArray(prev?.antetSatirlari)
        ? prev.antetSatirlari
        : currentAntetLines

      const res = InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: rawBirimId,
        birimList: activeBirimList,
        personelList: personelListesi,
        baseAntetLines: prevLines,
        fallbackInstitutionName: prev?.kurumAdi
      })

      const existingOverrides: RouteOverride[] = Array.isArray(prev?.routeOverrides)
        ? prev.routeOverrides
        : []
      const hasOverrideFor = (slotId: string) =>
        existingOverrides.some((o) => o && o.slotId === slotId && o.value !== null)

      const nextData: Record<string, any> = {
        ...prev,
        birimId: res.birimId ?? rawBirimId,
        birim_id: res.birimId ?? rawBirimId,
        birimAdi: res.birimAdi || prev?.birimAdi,
        birim_adi: res.birimAdi || prev?.birim_adi,
        birim: res.birimAdi || prev?.birim,
        mudurluk: res.mudurluk || prev?.mudurluk,
        harcamaBirimi: res.harcamaBirimi || prev?.harcamaBirimi,
        harcama_birimi: res.harcamaBirimi || prev?.harcama_birimi,
        antetEkSatir: res.antetEkSatir || prev?.antetEkSatir,
        antetSatirlari: res.antetSatirlari
      }

      if (res.ihtiyacYeri && !hasOverrideFor('ihtiyacYeri')) {
        nextData.ihtiyacYeri = res.ihtiyacYeri
        nextData.talepEdenBirim = res.birimAdi || res.ihtiyacYeri
      }

      if (res.sunulacakMakamAdi && !hasOverrideFor('sunulacakMakam')) {
        nextData.sunulacakMakamAdi = res.sunulacakMakamAdi
        nextData.sunulacakMakam = res.sunulacakMakamAdi
      }

      // Manuel görevli seçimi YOKSA ve alanda henüz görevli atanmamışsa birimin varsayılan yetkililerini doldur
      if (
        res.harcamaYetkilisiAdi &&
        !hasOverrideFor('onaylayan') &&
        !String(prev?.onaylayanPersonelAdi || '').trim()
      ) {
        nextData.onaylayanPersonelAdi = res.harcamaYetkilisiAdi
        nextData.onaylayanPersonelUnvan =
          res.harcamaYetkilisiUnvan || prev?.onaylayanPersonelUnvan || 'Harcama Yetkilisi'
        nextData.harcamaYetkilisiAdi = res.harcamaYetkilisiAdi
        nextData.harcamaYetkilisiUnvan =
          res.harcamaYetkilisiUnvan || prev?.harcamaYetkilisiUnvan || 'Harcama Yetkilisi'
      }

      if (
        res.gerceklestirmeGorevlisiAdi &&
        !hasOverrideFor('hazirlayan') &&
        !hasOverrideFor('gerceklestirmeGorevlisi') &&
        !String(prev?.hazirlayanPersonelAdi || '').trim()
      ) {
        nextData.hazirlayanPersonelAdi = res.gerceklestirmeGorevlisiAdi
        nextData.hazirlayanPersonelUnvan =
          res.gerceklestirmeGorevlisiUnvan || prev?.hazirlayanPersonelUnvan || ''
      }

      return nextData
    })
  }

  const handleRefreshAntetFromBirim = () => {
    setFormData((prev: any) => {
      const baseOnly = InstitutionalHeaderProvider.parseKurumBaseAntetLines(
        null,
        prev?.kurumAdi || 'KAMU KURUMU'
      )
      const res = InstitutionalHeaderProvider.resolveBirimSelection({
        birimId: prev?.birimId ?? prev?.birim_id,
        birimAdi: prev?.birimAdi || prev?.birim || prev?.mudurluk,
        birimList: activeBirimList,
        personelList: personelListesi,
        baseAntetLines: baseOnly,
        fallbackInstitutionName: prev?.kurumAdi
      })
      return {
        ...prev,
        antetSatirlari: res.antetSatirlari,
        antetEkSatir: res.antetEkSatir || prev?.antetEkSatir
      }
    })
  }

  const handleUpdateAntetLine = (idx: number, val: string) => {
    setFormData((prev: any) => {
      const next = [...currentAntetLines]
      next[idx] = val
      return {
        ...prev,
        antetSatirlari: next
      }
    })
  }

  const handleAddAntetLine = () => {
    setFormData((prev: any) => ({
      ...prev,
      antetSatirlari: [...currentAntetLines, '']
    }))
  }

  const handleRemoveAntetLine = (idx: number) => {
    if (currentAntetLines.length <= 1) return
    setFormData((prev: any) => ({
      ...prev,
      antetSatirlari: currentAntetLines.filter((_, i) => i !== idx)
    }))
  }

  const handleToggleCrossUnitPersonnel = (checked: boolean) => {
    setAllowCrossUnitPersonnel(checked)
    setFormData((prev: any) => ({
      ...prev,
      allowCrossUnitPersonnel: checked
    }))
  }

  // Bir slotun değerini güncelle ve formData'daki şablon alanlarına uygula
  const updateSlotOverride = (slotId: string, newValue: RouteValue) => {
    setFormData((prev: any) => {
      const existingOverrides: RouteOverride[] = Array.isArray(prev?.routeOverrides)
        ? prev.routeOverrides.filter((o: RouteOverride) => o.slotId !== slotId)
        : []
      const nextOverrides: RouteOverride[] = [...existingOverrides, { slotId, value: newValue }]

      const documentValues = extractDocumentRouteValues(prev, definition)
      const settingsValues = buildSettingsRouteValues(templateId || GLOBAL_ROTA_KEY, dosyaId)
      const allowed = new Set(definition.slots.map((s) => s.id))
      const validOverrides = nextOverrides.filter((o) => o && allowed.has(o.slotId))

      const nextResolved = resolveRoute({
        definition,
        settings: settingsValues,
        document: documentValues,
        overrides: validOverrides,
        strict: false
      })

      const updatedData = applyResolvedRouteToDocumentData(
        {
          ...prev,
          routeOverrides: validOverrides
        },
        nextResolved
      )
      return updatedData
    })
  }

  // Bir slotun manuel override'ını kaldırıp dosya/ayar varsayılanına döndür
  const clearSlotOverride = (slotId: string) => {
    setFormData((prev: any) => {
      const nextOverrides: RouteOverride[] = Array.isArray(prev?.routeOverrides)
        ? prev.routeOverrides.filter((o: RouteOverride) => o.slotId !== slotId)
        : []
      const documentValues = extractDocumentRouteValues(prev, definition)
      const settingsValues = buildSettingsRouteValues(templateId || GLOBAL_ROTA_KEY, dosyaId)
      const allowed = new Set(definition.slots.map((s) => s.id))
      const validOverrides = nextOverrides.filter((o) => o && allowed.has(o.slotId))

      const nextResolved = resolveRoute({
        definition,
        settings: settingsValues,
        document: documentValues,
        overrides: validOverrides,
        strict: false
      })

      return applyResolvedRouteToDocumentData(
        {
          ...prev,
          routeOverrides: validOverrides
        },
        nextResolved
      )
    })
  }

  // Mevcut çözülmüş slotları ve birim/antet ayarlarını varsayılan ayar (settings) olarak kaydet
  const handleSaveAsDefault = (targetKey: string, successText: string) => {
    const slotsToSave: RouteValues = {}
    for (const step of resolvedRoute.steps) {
      if (step.value !== null) {
        slotsToSave[step.id] = step.value
      }
    }

    const hazirlayanVal = slotsToSave.hazirlayan as RouteAssignee | undefined
    const gerceklestirmeVal = slotsToSave.gerceklestirmeGorevlisi as RouteAssignee | undefined
    const onaylayanVal = slotsToSave.onaylayan as RouteAssignee | undefined
    const makamVal = slotsToSave.sunulacakMakam as RouteAssignee | undefined
    const komisyonVal = (slotsToSave.komisyon ||
      slotsToSave.fiyatArastirmaGorevlileri ||
      slotsToSave.muayeneKomisyonu) as RouteAssignee[] | undefined

    saveRotaConfigForTemplate(
      targetKey,
      {
        belgeModu: 'standart',
        rota: [],
        slots: slotsToSave,
        birimId: currentBirimResolution.birimId ?? currentBirimId ?? undefined,
        birimAdi: currentBirimResolution.birimAdi || currentBirimAdi || undefined,
        antetSatirlari: currentAntetLines.length > 0 ? currentAntetLines : undefined,
        hazirlayanPersonelAdi: hazirlayanVal?.name || formData?.hazirlayanPersonelAdi,
        hazirlayanPersonelUnvan: hazirlayanVal?.title || formData?.hazirlayanPersonelUnvan,
        gerceklestirmeGorevlisiAdi:
          gerceklestirmeVal?.name || formData?.gerceklestirmeGorevlisiAdi,
        gerceklestirmeGorevlisiUnvani:
          gerceklestirmeVal?.title || formData?.gerceklestirmeGorevlisiUnvani,
        onaylayanPersonelAdi: onaylayanVal?.name || formData?.onaylayanPersonelAdi,
        onaylayanPersonelUnvan: onaylayanVal?.title || formData?.onaylayanPersonelUnvan,
        sunulacakMakamAdi: makamVal?.name || formData?.sunulacakMakamAdi,
        komisyonUyeleri: Array.isArray(komisyonVal)
          ? komisyonVal.map((m) => ({
              id: m.id,
              adSoyad: m.name,
              unvan: m.title,
              gorevi: m.role
            }))
          : undefined,
        olurYazisi: formData?.olurYazisi
      },
      dosyaId
    )
    setSavedFeedback(successText)
    setTimeout(() => setSavedFeedback(null), 2500)
  }

  const selectedBirimOptionValue =
    currentBirimResolution.matchedBirim?.id !== undefined
      ? String(currentBirimResolution.matchedBirim.id)
      : currentBirimId !== null && currentBirimId !== undefined
      ? String(currentBirimId)
      : ''

  return (
    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
      {/* ========================================================= */}
      {/* 1. KURUMSAL ANTET & İLGİLİ BİRİM (TANIM_Kurum - TANIM_Birim) */}
      {/* ========================================================= */}
      <div className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs shadow-2xs">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
              Kurumsal Antet &amp; İlgili Birim
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAntetFromBirim}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 cursor-pointer"
              title="Seçili birimin resmi antet satırlarını yeniden oluştur"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setShowAntetLinesEditor((v) => !v)}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-2.5 h-2.5" />
              <span>{showAntetLinesEditor ? 'Anteti Gizle' : 'Antet Satırları'}</span>
            </button>
          </div>
        </div>

        {/* İlgili Birim Seçimi */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
            Harcama / İşlem Birimi (Birim Seçimi Antet ve Personeli Bağlar)
          </label>
          <select
            data-testid="rota-birim-select"
            value={selectedBirimOptionValue}
            onChange={(e) => handleSelectBirim(e.target.value)}
            className="w-full text-[11px] px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">🏢 Birim Seçiniz (Kurum Varsayılanı)...</option>
            {activeBirimList.map((b: any, bIdx: number) => {
              const bId = b.id !== undefined && b.id !== null ? String(b.id) : `birim_${bIdx}`
              const bLabel = b.birim_adi || b.ad || b.kisa_ad || `Birim #${bId}`
              const isPassive =
                b.aktif_mi === 0 || b.aktif_mi === '0' || b.aktif_mi === false || b.is_active === 0
              return (
                <option key={bId} value={bId}>
                  {bLabel}
                  {isPassive ? ' [Pasif]' : ''}
                </option>
              )
            })}
          </select>
        </div>

        {/* Antet Önizleme Kutusu */}
        <div
          data-testid="rota-antet-preview"
          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center space-y-0.5"
        >
          {currentAntetLines.map((line, idx) => (
            <div
              key={idx}
              className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-tight truncate"
            >
              {line}
            </div>
          ))}
        </div>

        {/* Antet Satırlarını Düzenle (Açılır Panel) */}
        {showAntetLinesEditor && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            {currentAntetLines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <input
                  type="text"
                  value={line}
                  onChange={(e) => handleUpdateAntetLine(idx, e.target.value)}
                  placeholder={`${idx + 1}. Antet Satırı`}
                  className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] text-slate-800 dark:text-slate-100"
                />
                {currentAntetLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAntetLine(idx)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-red-500 cursor-pointer"
                    title="Satırı sil"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddAntetLine}
              className="w-full py-1 border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Antet Satırı Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. BİRİM & PERSONEL UYUMLULUK / PASİFLİK UYARILARI */}
      {/* ========================================================= */}
      {validationWarnings.length > 0 && (
        <div
          data-testid="rota-birim-warnings"
          className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-1 text-[11px] text-amber-800 dark:text-amber-200"
        >
          <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Birim &amp; Personel Kontrol Bildirimi ({validationWarnings.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] leading-snug">
            {validationWarnings.map((w, idx) => (
              <li key={idx}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. GÖREVLİ & ROTA BAŞLIĞI + BİRİM FİLTRESİ ANAHTARI */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <GitFork className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Belge Görevli &amp; Rota Alanları ({resolvedRoute.steps.length})</span>
        </span>
        <span className="text-[10px] font-medium text-slate-400">
          v{resolvedRoute.definitionVersion}
        </span>
      </div>

      {/* Birim Bazlı Personel Filtreleme / Diğer Birimlerden Yetkili Personel Seçimi */}
      {filteredPersonelResult.hasUnitDataInPool && (
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-lg text-[10px]">
          <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
            {allowCrossUnitPersonnel
              ? `🌐 Tüm birimler (${filteredPersonelResult.primaryUnitPersonel.length} birim + ${filteredPersonelResult.otherUnitPersonel.length} diğer)`
              : `🏢 Birim filtresi aktif (${filteredPersonelResult.primaryUnitPersonel.length} personel)`}
          </span>
          <label className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer shrink-0">
            <input
              data-testid="toggle-cross-unit-personel"
              type="checkbox"
              checked={allowCrossUnitPersonnel}
              onChange={(e) => handleToggleCrossUnitPersonnel(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Diğer Birimleri Göster</span>
          </label>
        </div>
      )}

      {/* Şablonun Slotları Üzerinden Dinamik Form */}
      <div className="space-y-2.5">
        {resolvedRoute.steps.map((step) => {
          const originMeta = getOriginMeta(step.origin)

          if (step.kind === 'person') {
            const currentPerson: RouteAssignee | null =
              step.value && !Array.isArray(step.value) ? step.value : null
            const baseStepPool = buildMergedPersonelList(
              personelListesi,
              {
                ...formData,
                birimId: undefined,
                birim_id: undefined,
                birimAdi: undefined,
                birim: undefined,
                mudurluk: undefined
              },
              currentPerson?.name,
              currentPerson?.title
            )
            const stepFilterRes = filterPersonelByBirim(baseStepPool, {
              birimId: currentBirimResolution.birimId ?? currentBirimId,
              birimAdi: currentBirimResolution.birimAdi || currentBirimAdi,
              birimList: activeBirimList,
              includeOtherUnits: allowCrossUnitPersonnel,
              currentSelectedNames: currentPerson?.name ? [currentPerson.name] : []
            })
            const stepPersonelList = stepFilterRes.filteredList

            const matchedP = stepPersonelList.find(
              (p) =>
                cleanPersonelName(p.ad_soyad).toLowerCase() ===
                cleanPersonelName(currentPerson?.name).toLowerCase()
            )
            const selectedVal = matchedP ? String(matchedP.id || matchedP.ad_soyad) : ''

            return (
              <div
                key={step.id}
                className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {step.label}
                    </span>
                    {step.required && (
                      <span className="text-[9px] text-rose-500 font-bold" title="Zorunlu alan">
                        *
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${originMeta.className}`}
                    >
                      {originMeta.label}
                    </span>
                    {step.origin === 'override' && (
                      <button
                        type="button"
                        onClick={() => clearSlotOverride(step.id)}
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Manuel seçimi kaldır, varsayılana dön"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {step.description && (
                  <p className="text-[10px] text-slate-400 leading-tight">{step.description}</p>
                )}

                {stepPersonelList.length > 0 && (
                  <select
                    data-testid={`rota-person-select-${step.id}`}
                    value={selectedVal}
                    onChange={(e) => {
                      const val = e.target.value
                      if (!val) {
                        updateSlotOverride(step.id, null)
                        return
                      }
                      const p = stepPersonelList.find(
                        (item) => String(item.id || item.ad_soyad) === val
                      )
                      if (p) {
                        updateSlotOverride(step.id, {
                          id: String(p.id || p.ad_soyad),
                          name: cleanPersonelName(p.ad_soyad),
                          title: p.unvan || currentPerson?.title || ''
                        })
                      }
                    }}
                    className="w-full text-[11px] px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="">👤 Personel Havuzundan Seç...</option>
                    {allowCrossUnitPersonnel &&
                    stepFilterRes.hasUnitDataInPool &&
                    stepFilterRes.primaryUnitPersonel.length > 0 &&
                    stepFilterRes.otherUnitPersonel.length > 0 ? (
                      <>
                        <optgroup label="🏢 İlgili Birim Personeli">
                          {stepFilterRes.primaryUnitPersonel.map((p, pIdx) => (
                            <option key={`pri_${p.id || pIdx}`} value={String(p.id || p.ad_soyad)}>
                              {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ''}`}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="🌐 Diğer Birim Personelleri">
                          {stepFilterRes.otherUnitPersonel.map((p, pIdx) => (
                            <option key={`oth_${p.id || pIdx}`} value={String(p.id || p.ad_soyad)}>
                              {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ''}`}
                              {p.birim ? ` — [${p.birim}]` : ''}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    ) : (
                      stepPersonelList.map((p, pIdx) => (
                        <option key={p.id || pIdx} value={String(p.id || p.ad_soyad)}>
                          {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ''}`}
                        </option>
                      ))
                    )}
                  </select>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={currentPerson?.name || ''}
                    onChange={(e) => {
                      const name = e.target.value
                      updateSlotOverride(step.id, {
                        id: currentPerson?.id || `person_${name}`,
                        name,
                        title: currentPerson?.title || ''
                      })
                    }}
                    placeholder="Adı Soyadı"
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    value={currentPerson?.title || ''}
                    onChange={(e) => {
                      const title = e.target.value
                      updateSlotOverride(step.id, {
                        id: currentPerson?.id || `person_${currentPerson?.name || 'custom'}`,
                        name: currentPerson?.name || '',
                        title
                      })
                    }}
                    placeholder="Unvanı"
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              </div>
            )
          }

          if (step.kind === 'person-list') {
            const currentList: RouteAssignee[] = Array.isArray(step.value) ? step.value : []

            const handleAddMember = () => {
              const unusedPerson = mergedPersonelList.find(
                (p) =>
                  !currentList.some(
                    (m) =>
                      cleanPersonelName(m.name).toLowerCase() ===
                      cleanPersonelName(p.ad_soyad).toLowerCase()
                  )
              )
              const nextMember: RouteAssignee = unusedPerson
                ? {
                    id: String(unusedPerson.id || unusedPerson.ad_soyad),
                    name: cleanPersonelName(unusedPerson.ad_soyad),
                    title: unusedPerson.unvan || '',
                    role: currentList.length === 0 ? 'Başkan' : 'Üye'
                  }
                : {
                    id: `member_${Date.now()}`,
                    name: '',
                    title: '',
                    role: currentList.length === 0 ? 'Başkan' : 'Üye'
                  }
              updateSlotOverride(step.id, [...currentList, nextMember])
            }

            const handleUpdateMember = (idx: number, patch: Partial<RouteAssignee>) => {
              const next = currentList.map((item, i) => (i === idx ? { ...item, ...patch } : item))
              updateSlotOverride(step.id, next)
            }

            const handleRemoveMember = (idx: number) => {
              const next = currentList.filter((_, i) => i !== idx)
              updateSlotOverride(step.id, next)
            }

            const handleMoveMember = (idx: number, dir: 'up' | 'down') => {
              if (dir === 'up' && idx === 0) return
              if (dir === 'down' && idx === currentList.length - 1) return
              const target = dir === 'up' ? idx - 1 : idx + 1
              const next = [...currentList]
              const tmp = next[idx]
              next[idx] = next[target]
              next[target] = tmp
              updateSlotOverride(step.id, next)
            }

            return (
              <div
                key={step.id}
                className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {step.label} ({currentList.length})
                    </span>
                    {step.required && (
                      <span className="text-[9px] text-rose-500 font-bold" title="Zorunlu liste">
                        *
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${originMeta.className}`}
                    >
                      {originMeta.label}
                    </span>
                    {step.origin === 'override' && (
                      <button
                        type="button"
                        onClick={() => clearSlotOverride(step.id)}
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Manuel seçimi kaldır, varsayılana dön"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {step.description && (
                  <p className="text-[10px] text-slate-400 leading-tight">{step.description}</p>
                )}

                {currentList.length === 0 ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center space-y-1.5">
                    <p className="text-[11px] text-slate-500">
                      Henüz bu liste için görevli/komisyon üyesi atanmadı.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Görevli / Üye Ekle</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {currentList.map((member, idx) => {
                      const baseMemberPool = buildMergedPersonelList(
                        personelListesi,
                        {
                          ...formData,
                          birimId: undefined,
                          birim_id: undefined,
                          birimAdi: undefined,
                          birim: undefined,
                          mudurluk: undefined
                        },
                        member.name,
                        member.title
                      )
                      const memberFilterRes = filterPersonelByBirim(baseMemberPool, {
                        birimId: currentBirimResolution.birimId ?? currentBirimId,
                        birimAdi: currentBirimResolution.birimAdi || currentBirimAdi,
                        birimList: activeBirimList,
                        includeOtherUnits: allowCrossUnitPersonnel,
                        currentSelectedNames: member.name ? [member.name] : []
                      })
                      const memberPool = memberFilterRes.filteredList

                      const matched = memberPool.find(
                        (p) =>
                          cleanPersonelName(p.ad_soyad).toLowerCase() ===
                          cleanPersonelName(member.name).toLowerCase()
                      )
                      const selectedVal = matched ? String(matched.id || matched.ad_soyad) : ''

                      return (
                        <div
                          key={member.id || idx}
                          className="p-2 bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-lg space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-500">
                              #{idx + 1}. Görevli / Üye
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveMember(idx, 'up')}
                                disabled={idx === 0}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveMember(idx, 'down')}
                                disabled={idx === currentList.length - 1}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(idx)}
                                className="p-0.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {memberPool.length > 0 && (
                            <select
                              value={selectedVal}
                              onChange={(e) => {
                                const val = e.target.value
                                const p = memberPool.find(
                                  (item) => String(item.id || item.ad_soyad) === val
                                )
                                if (p) {
                                  handleUpdateMember(idx, {
                                    id: String(p.id || p.ad_soyad),
                                    name: cleanPersonelName(p.ad_soyad),
                                    title: p.unvan || member.title || ''
                                  })
                                }
                              }}
                              className="w-full text-[11px] px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer"
                            >
                              <option value="">👤 Personel Seç...</option>
                              {allowCrossUnitPersonnel &&
                              memberFilterRes.hasUnitDataInPool &&
                              memberFilterRes.primaryUnitPersonel.length > 0 &&
                              memberFilterRes.otherUnitPersonel.length > 0 ? (
                                <>
                                  <optgroup label="🏢 İlgili Birim Personeli">
                                    {memberFilterRes.primaryUnitPersonel.map((p, pIdx) => (
                                      <option
                                        key={`pri_${p.id || pIdx}`}
                                        value={String(p.id || p.ad_soyad)}
                                      >
                                        {p.label ||
                                          `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ''}`}
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="🌐 Diğer Birim Personelleri">
                                    {memberFilterRes.otherUnitPersonel.map((p, pIdx) => (
                                      <option
                                        key={`oth_${p.id || pIdx}`}
                                        value={String(p.id || p.ad_soyad)}
                                      >
                                        {p.label ||
                                          `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ''}`}
                                        {p.birim ? ` — [${p.birim}]` : ''}
                                      </option>
                                    ))}
                                  </optgroup>
                                </>
                              ) : (
                                memberPool.map((p, pIdx) => (
                                  <option key={p.id || pIdx} value={String(p.id || p.ad_soyad)}>
                                    {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ''}`}
                                  </option>
                                ))
                              )}
                            </select>
                          )}

                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="text"
                              value={member.name || ''}
                              onChange={(e) => handleUpdateMember(idx, { name: e.target.value })}
                              placeholder="Adı Soyadı"
                              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]"
                            />
                            <input
                              type="text"
                              value={member.title || ''}
                              onChange={(e) => handleUpdateMember(idx, { title: e.target.value })}
                              placeholder="Unvanı"
                              className="px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]"
                            />
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="w-full py-1 border border-dashed border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Görevli / Üye Ekle</span>
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // step.kind === 'unit'
          const currentUnit: RouteAssignee | null =
            step.value && !Array.isArray(step.value) ? step.value : null

          return (
            <div
              key={step.id}
              className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs shadow-2xs"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {step.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${originMeta.className}`}
                  >
                    {originMeta.label}
                  </span>
                  {step.origin === 'override' && (
                    <button
                      type="button"
                      onClick={() => clearSlotOverride(step.id)}
                      className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Manuel seçimi kaldır"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {activeBirimList.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value
                    if (!val) return
                    updateSlotOverride(step.id, {
                      id: `unit_${val}`,
                      name: val
                    })
                  }}
                  className="w-full text-[11px] px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value="">🏢 Kayıtlı Birim / Makam Seç...</option>
                  {activeBirimList.map((b: any, bIdx: number) => {
                    const label = (b.sunum_makami || b.birim_adi || b.ad || '').trim().toUpperCase()
                    if (!label) return null
                    return (
                      <option key={b.id || bIdx} value={label}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              )}

              <input
                type="text"
                value={currentUnit?.name || ''}
                onChange={(e) => {
                  const val = e.target.value
                  updateSlotOverride(
                    step.id,
                    val.trim() ? { id: `unit_${val}`, name: val } : null
                  )
                }}
                placeholder="Örn: DESTEK HİZMETLERİ MÜDÜRLÜĞÜNE"
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          )
        })}
      </div>

      {/* Varsayılan Olarak Kaydet Aksiyonları */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() =>
              handleSaveAsDefault(
                templateId || GLOBAL_ROTA_KEY,
                'Bu şablon için varsayılan rota kaydedildi'
              )
            }
            className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            title="Bu görevli/rota atamalarını seçili şablon için varsayılan yap"
          >
            📌 Şablon Varsayılanı Yap
          </button>
          <button
            type="button"
            onClick={() =>
              handleSaveAsDefault(
                GLOBAL_ROTA_KEY,
                'Tüm belgeler için genel varsayılan yapıldı'
              )
            }
            className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            title="Bu görevli/rota atamalarını tüm belgeler için genel varsayılan yap"
          >
            🌐 Genel Varsayılan Yap
          </button>
        </div>
        {savedFeedback && (
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 text-center bg-emerald-50 dark:bg-emerald-950/40 py-1 rounded-lg flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{savedFeedback}</span>
          </div>
        )}
      </div>
    </div>
  )
}
