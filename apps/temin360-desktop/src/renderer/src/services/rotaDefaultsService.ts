import {
  resolveTemplateKey,
  getTemplateRouteDefinition
} from '@temin360/document-templates'
import type {
  ResolvedDocumentRoute,
  RouteAssignee,
  RouteOverride,
  RouteValues
} from '@temin360/contracts'
import {
  resolveRoute,
  extractDocumentRouteValues,
  applyResolvedRouteToDocumentData
} from '@worksuite-360/document-engine'
import type {
  BelgeModuType,
  RotaAdimItem
} from '../screens/dosya/components/DocumentPreviewModalV3/components/DocumentPreviewRotaSection'

export interface TemplateRotaConfig {
  belgeModu?: BelgeModuType
  rota?: RotaAdimItem[]
  /** Şablon bazlı slot atamaları (hazirlayan, onaylayan, komisyon, muayeneKomisyonu, sunulacakMakam vb.) */
  slots?: RouteValues
  /** Seçili harcama/işlem birimi (TANIM_Birim.id) */
  birimId?: number | string | null
  birimAdi?: string
  antetEkSatir?: string
  kurumAdi?: string
  /** Kurum + Birim resmi antet satırları */
  antetSatirlari?: string[]
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  gerceklestirmeGorevlisiAdi?: string
  gerceklestirmeGorevlisiUnvani?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  sunulacakMakamAdi?: string
  komisyonUyeleri?: Array<{
    id?: string | number
    adSoyad: string
    unvan?: string
    gorevi?: string
    imzaTuru?: 'Paraf' | 'Koordinasyon' | 'İmza' | string
    asilMi?: number | boolean
    birimId?: number | string | null
    birim?: string
  }>
  olurYazisi?: boolean
  /** Şablon antetinde birim satırının gösterilip gösterilmeyeceği (false ise sadece kurum üst anteti gösterilir) */
  antetBirimGosterilsin?: boolean
  updatedAt?: string
}

const STORAGE_KEY = 'temin360_template_rota_defaults_v1'
export const GLOBAL_ROTA_KEY = '__global__'

function normalizeKey(templateId?: string | null): string {
  if (!templateId || templateId === GLOBAL_ROTA_KEY) return GLOBAL_ROTA_KEY
  return (resolveTemplateKey(templateId) as string) || templateId.replace(/-/g, '_').toLowerCase()
}

function makeScopedKey(templateId?: string | null, dosyaId?: number | string | null): string {
  const norm = normalizeKey(templateId)
  if (dosyaId !== undefined && dosyaId !== null && String(dosyaId).trim() !== '') {
    return `dosya_${dosyaId}__${norm}`
  }
  return norm
}

export function getAllSavedRotaConfigs(): Record<string, TemplateRotaConfig> {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistAllRotaConfigs(map: Record<string, TemplateRotaConfig>): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('temin360:rota-defaults-updated'))
  } catch (err) {
    console.error('Rota varsayılanları kaydedilemedi:', err)
  }
}

/**
 * Belirli bir şablon (ve varsa aktif dosya) için varsayılan rota ayarını döndürür.
 * Öncelik sırası:
 * 1. Aktif dosyaya özel şablon rotası (dosya_12__ihtiyac_listesi)
 * 2. Aktif dosyaya özel genel rota (dosya_12____global__)
 * 3. Genel şablon rotası (ihtiyac_listesi)
 * 4. Genel varsayılan rota (__global__)
 */
export function getRotaConfigForTemplate(
  templateId?: string | null,
  dosyaId?: number | string | null
): TemplateRotaConfig | null {
  const all = getAllSavedRotaConfigs()
  const norm = normalizeKey(templateId)

  if (dosyaId !== undefined && dosyaId !== null && String(dosyaId).trim() !== '') {
    const dosyaTemplateKey = makeScopedKey(norm, dosyaId)
    if (all[dosyaTemplateKey]) return all[dosyaTemplateKey]

    const dosyaGlobalKey = makeScopedKey(GLOBAL_ROTA_KEY, dosyaId)
    if (all[dosyaGlobalKey]) return all[dosyaGlobalKey]
  }

  if (all[norm]) return all[norm]
  if (all[GLOBAL_ROTA_KEY]) return all[GLOBAL_ROTA_KEY]

  return null
}

/**
 * Doğrudan belirli bir anahtarın (override olmadan) kaydını kontrol eder.
 */
export function getDirectRotaConfig(
  templateId: string,
  dosyaId?: number | string | null
): TemplateRotaConfig | null {
  const all = getAllSavedRotaConfigs()
  const key = makeScopedKey(templateId, dosyaId)
  return all[key] || null
}

export function saveRotaConfigForTemplate(
  templateId: string,
  config: TemplateRotaConfig,
  dosyaId?: number | string | null
): void {
  const all = getAllSavedRotaConfigs()
  const key = makeScopedKey(templateId, dosyaId)
  all[key] = {
    belgeModu: config.belgeModu || 'standart',
    rota: config.rota || [],
    ...config,
    updatedAt: new Date().toISOString()
  }
  persistAllRotaConfigs(all)
}

export function removeRotaConfigForTemplate(
  templateId: string,
  dosyaId?: number | string | null
): void {
  const all = getAllSavedRotaConfigs()
  const key = makeScopedKey(templateId, dosyaId)
  delete all[key]
  persistAllRotaConfigs(all)
}

export function applyRotaConfigToAllTemplates(
  templateIds: string[],
  config: TemplateRotaConfig,
  dosyaId?: number | string | null
): void {
  const all = getAllSavedRotaConfigs()
  const now = new Date().toISOString()
  const normalizedConfig: TemplateRotaConfig = {
    belgeModu: config.belgeModu || 'standart',
    rota: config.rota || [],
    ...config,
    updatedAt: now
  }
  const globalKey = makeScopedKey(GLOBAL_ROTA_KEY, dosyaId)
  all[globalKey] = normalizedConfig

  for (const tplId of templateIds) {
    const key = makeScopedKey(tplId, dosyaId)
    all[key] = normalizedConfig
  }
  persistAllRotaConfigs(all)
}

function configToRouteValues(conf: TemplateRotaConfig | null): RouteValues {
  if (!conf) return {}
  const values: RouteValues = { ...(conf.slots || {}) }

  if (!values.hazirlayan && conf.hazirlayanPersonelAdi?.trim()) {
    values.hazirlayan = {
      id: `settings_hazirlayan_${conf.hazirlayanPersonelAdi.trim()}`,
      name: conf.hazirlayanPersonelAdi.trim(),
      title: conf.hazirlayanPersonelUnvan?.trim() || undefined
    }
  }

  if (!values.gerceklestirmeGorevlisi && conf.gerceklestirmeGorevlisiAdi?.trim()) {
    values.gerceklestirmeGorevlisi = {
      id: `settings_gerceklestirme_${conf.gerceklestirmeGorevlisiAdi.trim()}`,
      name: conf.gerceklestirmeGorevlisiAdi.trim(),
      title: conf.gerceklestirmeGorevlisiUnvani?.trim() || undefined
    }
  } else if (!values.gerceklestirmeGorevlisi && values.hazirlayan && !Array.isArray(values.hazirlayan)) {
    values.gerceklestirmeGorevlisi = values.hazirlayan
  }

  if (!values.onaylayan && conf.onaylayanPersonelAdi?.trim()) {
    values.onaylayan = {
      id: `settings_onaylayan_${conf.onaylayanPersonelAdi.trim()}`,
      name: conf.onaylayanPersonelAdi.trim(),
      title: conf.onaylayanPersonelUnvan?.trim() || undefined
    }
  }

  if (!values.sunulacakMakam && conf.sunulacakMakamAdi?.trim()) {
    values.sunulacakMakam = {
      id: `settings_unit_${conf.sunulacakMakamAdi.trim()}`,
      name: conf.sunulacakMakamAdi.trim()
    }
  }

  if (Array.isArray(conf.komisyonUyeleri) && conf.komisyonUyeleri.length > 0) {
    const list: RouteAssignee[] = conf.komisyonUyeleri
      .filter((u) => u && u.adSoyad && u.adSoyad.trim() !== '')
      .map((u) => ({
        id: String(u.id || `settings_member_${u.adSoyad.trim()}`),
        name: u.adSoyad.trim(),
        title: u.unvan?.trim() || undefined,
        role: u.gorevi?.trim() || undefined
      }))
    if (list.length > 0) {
      if (!values.komisyon) values.komisyon = list
      if (!values.fiyatArastirmaGorevlileri) values.fiyatArastirmaGorevlileri = list
      if (!values.muayeneKomisyonu) values.muayeneKomisyonu = list
    }
  }

  return values
}

/**
 * Seçili şablon ve aktif dosya için "settings" (varsayılan ayarlar) kaynaklı RouteValues sözlüğünü oluşturur.
 * Önce genel ayarları alır, üstüne şablona/dosyaya özel ayarları birleştirir.
 */
export function buildSettingsRouteValues(
  templateId?: string | null,
  dosyaId?: number | string | null
): RouteValues {
  const globalConf = getRotaConfigForTemplate(GLOBAL_ROTA_KEY, dosyaId)
  const templateConf = getRotaConfigForTemplate(templateId, dosyaId)
  return {
    ...configToRouteValues(globalConf),
    ...configToRouteValues(templateConf)
  }
}

/**
 * temin360-route-example mimarisine uygun olarak:
 * 1) Şablonun TemplateRouteDefinition şemasını Registry'den alır.
 * 2) settings (varsayılan rota ayarları) + document (aktif dosya verisi) + overrides (manuel seçimler)
 *    kaynaklarını resolveRoute ile çözer.
 * 3) Çözülen adımları (steps) belge verisine (formData) standart alan isimleriyle yazar.
 */
export function resolveTemplateRouteForDocument<T extends Record<string, any>>(
  templateId: string,
  documentData: T,
  dosyaId?: number | string | null,
  overrides?: readonly RouteOverride[]
): {
  resolvedRoute: ResolvedDocumentRoute
  enrichedData: T
} {
  const definition = getTemplateRouteDefinition(templateId)
  const documentValues = extractDocumentRouteValues(documentData, definition)
  const settingsValues = buildSettingsRouteValues(templateId, dosyaId)
  const activeOverrides: readonly RouteOverride[] =
    overrides ||
    (Array.isArray(documentData?.routeOverrides) ? documentData.routeOverrides : [])

  // Şablonda tanımlı olmayan eski override slotlarını filtrele
  const allowedSlots = new Set(definition.slots.map((s) => s.id))
  const validOverrides = activeOverrides.filter((o) => o && allowedSlots.has(o.slotId))

  const resolvedRoute = resolveRoute({
    definition,
    settings: settingsValues,
    document: documentValues,
    overrides: validOverrides,
    strict: false
  })

  const enrichedData = applyResolvedRouteToDocumentData(documentData, resolvedRoute)
  const effectiveConf = getRotaConfigForTemplate(templateId, dosyaId)
  const directScopedConf =
    (dosyaId !== undefined && dosyaId !== null && String(dosyaId).trim() !== ''
      ? getDirectRotaConfig(templateId, dosyaId) || getDirectRotaConfig(GLOBAL_ROTA_KEY, dosyaId)
      : null) || getDirectRotaConfig(templateId, null)

  const isBaseDefaultAntet = Boolean((documentData as any)?._isBaseDefaultAntet)

  if (effectiveConf) {
    const shouldOverrideBirimFromConfig =
      isBaseDefaultAntet &&
      directScopedConf &&
      ((directScopedConf.birimId !== undefined &&
        directScopedConf.birimId !== null &&
        String(directScopedConf.birimId).trim() !== '') ||
        Boolean(directScopedConf.birimAdi?.trim()))

    if (
      shouldOverrideBirimFromConfig ||
      ((enrichedData.birimId === undefined ||
        enrichedData.birimId === null ||
        enrichedData.birimId === '') &&
        (enrichedData.birim_id === undefined ||
          enrichedData.birim_id === null ||
          enrichedData.birim_id === ''))
    ) {
      if (
        effectiveConf.birimId !== undefined &&
        effectiveConf.birimId !== null &&
        String(effectiveConf.birimId).trim() !== ''
      ) {
        ;(enrichedData as any).birimId = effectiveConf.birimId
        ;(enrichedData as any).birim_id = effectiveConf.birimId
      }
      if (effectiveConf.birimAdi?.trim()) {
        const bAdi = effectiveConf.birimAdi.trim()
        ;(enrichedData as any).birimAdi = bAdi
        ;(enrichedData as any).birim_adi = bAdi
        ;(enrichedData as any).birim = bAdi
        ;(enrichedData as any).harcamaBirimi = bAdi
        ;(enrichedData as any).harcama_birimi = bAdi
        ;(enrichedData as any).ihalesiYapilacakBirim = bAdi
        ;(enrichedData as any).mudurluk = bAdi
      }
    } else if (!enrichedData.birimAdi && effectiveConf.birimAdi) {
      ;(enrichedData as any).birimAdi = effectiveConf.birimAdi
      ;(enrichedData as any).birim = enrichedData.birim || effectiveConf.birimAdi
      ;(enrichedData as any).mudurluk = enrichedData.mudurluk || effectiveConf.birimAdi
    }

    if (effectiveConf.antetBirimGosterilsin !== undefined) {
      ;(enrichedData as any).antetBirimGosterilsin = effectiveConf.antetBirimGosterilsin
    }

    if (effectiveConf.antetEkSatir && (isBaseDefaultAntet || !enrichedData.antetEkSatir)) {
      ;(enrichedData as any).antetEkSatir = effectiveConf.antetEkSatir
      ;(enrichedData as any).antet_ek_satir = effectiveConf.antetEkSatir
    }

    const shouldOverrideAntetFromConfig =
      isBaseDefaultAntet &&
      directScopedConf &&
      Array.isArray(directScopedConf.antetSatirlari) &&
      directScopedConf.antetSatirlari.length > 0

    if (
      shouldOverrideAntetFromConfig ||
      !Array.isArray(enrichedData.antetSatirlari) ||
      enrichedData.antetSatirlari.length === 0
    ) {
      if (
        Array.isArray(effectiveConf.antetSatirlari) &&
        effectiveConf.antetSatirlari.length > 0
      ) {
        ;(enrichedData as any).antetSatirlari = [...effectiveConf.antetSatirlari]
      }
    }
  }
  return { resolvedRoute, enrichedData }
}
