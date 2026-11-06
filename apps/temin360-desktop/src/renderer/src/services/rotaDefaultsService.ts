import { resolveTemplateKey } from '@temin360/document-templates'
import type {
  BelgeModuType,
  RotaAdimItem
} from '../screens/dosya/components/DocumentPreviewModalV3/components/DocumentPreviewRotaSection'

export interface TemplateRotaConfig {
  belgeModu: BelgeModuType
  rota: RotaAdimItem[]
  hazirlayanPersonelAdi?: string
  hazirlayanPersonelUnvan?: string
  onaylayanPersonelAdi?: string
  onaylayanPersonelUnvan?: string
  olurYazisi?: boolean
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
  const globalKey = makeScopedKey(GLOBAL_ROTA_KEY, dosyaId)
  all[globalKey] = { ...config, updatedAt: now }

  for (const tplId of templateIds) {
    const key = makeScopedKey(tplId, dosyaId)
    all[key] = { ...config, updatedAt: now }
  }
  persistAllRotaConfigs(all)
}

