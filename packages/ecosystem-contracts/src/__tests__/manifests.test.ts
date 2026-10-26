import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ECOSYSTEM_MANIFESTS,
  TEMIN_360_MANIFEST,
  WORKSPACE_360_MANIFEST,
  DOSYA_360_MANIFEST,
  validateManifest,
  isValidManifest,
  checkAppIdUniqueness,
  filterCatalog
} from '../index.js'

describe('WorkSuite 360 Contracts & Manifests', () => {
  it('tüm yerleşik uygulama manifestoları Zod şemasını başarıyla doğrulamalıdır', () => {
    for (const manifest of DEFAULT_ECOSYSTEM_MANIFESTS) {
      expect(isValidManifest(manifest)).toBe(true)
      const validated = validateManifest(manifest)
      expect(validated.id).toBe(manifest.id)
      expect(validated.name).toBe(manifest.name)
    }
  })

  it('Temin 360 manifestosu doğru ürün kimliğini ve .temin dosya ilişkisini korumalıdır', () => {
    expect(TEMIN_360_MANIFEST.id).toBe('temin-360')
    expect(TEMIN_360_MANIFEST.appId).toBe('dev.ilyasbozdemir.temin360')
    expect(TEMIN_360_MANIFEST.executableName).toBe('TEMIN360.exe')
    expect(TEMIN_360_MANIFEST.category).toBe('procurement')
    expect(TEMIN_360_MANIFEST.installState).toBe('installed')

    const teminExt = TEMIN_360_MANIFEST.fileAssociations.find((f) => f.ext === 'temin')
    expect(teminExt).toBeDefined()
    expect(teminExt?.isPrimary).toBe(true)
  })

  it('Workspace 360, Temin 360 ile çakışmayan bağımsız bir kimliğe sahip olmalıdır', () => {
    expect(WORKSPACE_360_MANIFEST.id).toBe('workspace-360')
    expect(WORKSPACE_360_MANIFEST.appId).toBe('dev.ilyasbozdemir.workspace360')
    expect(WORKSPACE_360_MANIFEST.executableName).toBe('Workspace360.exe')
    expect(WORKSPACE_360_MANIFEST.appId).not.toBe(TEMIN_360_MANIFEST.appId)
    // Workspace 360, .temin dosya ilişkisi içermemelidir
    expect(WORKSPACE_360_MANIFEST.fileAssociations).toHaveLength(0)
  })

  it('Dosya 360; Hızlı Arama, Etiketler, Yinelenen Dosyalar, Temizlik/Karantina, İndeksleme ve Ayarlar modüllerini birleştirmelidir', () => {
    expect(DOSYA_360_MANIFEST.id).toBe('dosya-360')
    expect(DOSYA_360_MANIFEST.category).toBe('file-management')
    expect(DOSYA_360_MANIFEST.installState).toBe('planned')
    expect(DOSYA_360_MANIFEST.modules).toContain('Hızlı Arama')
    expect(DOSYA_360_MANIFEST.modules).toContain('Etiketler ve Koleksiyonlar')
    expect(DOSYA_360_MANIFEST.modules).toContain('Yinelenen Dosyalar')
    expect(DOSYA_360_MANIFEST.modules).toContain('Temizlik ve Karantina')
    expect(DOSYA_360_MANIFEST.modules).toContain('İndeksleme ve Depolama')
    expect(DOSYA_360_MANIFEST.modules).toContain('Genel Bakış ve Ayarlar')
  })

  it('tüm ekosistem ürünlerinin appId, id ve executableName değerleri benzersiz olmalıdır', () => {
    expect(() => checkAppIdUniqueness(DEFAULT_ECOSYSTEM_MANIFESTS)).not.toThrow()
  })

  it('filterCatalog arama ve filtreleme seçeneklerini doğru uygulamalıdır', () => {
    // 1. Kategori filtresi
    const procurementApps = filterCatalog(DEFAULT_ECOSYSTEM_MANIFESTS, {
      category: 'procurement'
    })
    expect(procurementApps).toHaveLength(3)
    expect(procurementApps.map((a) => a.id)).toEqual(
      expect.arrayContaining(['temin-360', 'ihale-360', 'devlet-ihale-2886'])
    )

    // 2. Kurulum durumu filtresi
    const installedApps = filterCatalog(DEFAULT_ECOSYSTEM_MANIFESTS, {
      installState: 'installed'
    })
    expect(installedApps.length).toBeGreaterThanOrEqual(1)
    expect(installedApps.every((a) => a.installState === 'installed')).toBe(true)

    // 3. Arama kelimesi filtresi
    const searchResults = filterCatalog(DEFAULT_ECOSYSTEM_MANIFESTS, {
      search: 'hakediş'
    })
    expect(searchResults.some((a) => a.id === 'temin-360')).toBe(true)

    // 4. Modül ismiyle arama
    const searchModule = filterCatalog(DEFAULT_ECOSYSTEM_MANIFESTS, {
      search: 'Hızlı Arama'
    })
    expect(searchModule.some((a) => a.id === 'dosya-360')).toBe(true)
  })
})
