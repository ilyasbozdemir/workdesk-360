import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ECOSYSTEM_MANIFESTS,
  TEMIN_360_MANIFEST,
  IHALE_360_MANIFEST,
  WORKSPACE_360_MANIFEST,
  DOSYA_360_MANIFEST,
  FLOWDESK_360_MANIFEST,
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
    // 1. Kategori filtresi (Artık yalnızca temin-360 ve ihale-360)
    const procurementApps = filterCatalog(DEFAULT_ECOSYSTEM_MANIFESTS, {
      category: 'procurement'
    })
    expect(procurementApps).toHaveLength(2)
    expect(procurementApps.map((a) => a.id)).toEqual(
      expect.arrayContaining(['temin-360', 'ihale-360'])
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

  it('tüm dosya formatları ve MIME türleri standarda uygun ve uygulamalar arası ayrık olmalıdır', () => {
    // 1. Temin 360 formatları
    const teminExt = TEMIN_360_MANIFEST.fileAssociations.find((f) => f.ext === 'temin')
    expect(teminExt).toBeDefined()
    expect(teminExt?.mimeType).toBe('application/x-temin')
    expect(teminExt?.progId).toBe('Temin360.Document')
    expect(teminExt?.perceivedType).toBe('document')

    const hkmpExt = TEMIN_360_MANIFEST.fileAssociations.find((f) => f.ext === 'hkmp')
    expect(hkmpExt).toBeDefined()
    expect(hkmpExt?.mimeType).toBe('application/x-hkmp')
    expect(hkmpExt?.progId).toBe('Temin360.Document')
    expect(hkmpExt?.isLegacy).toBe(true)

    // 2. İhale 360 formatları
    const ihaleManifest = DEFAULT_ECOSYSTEM_MANIFESTS.find((m) => m.id === 'ihale-360')
    expect(ihaleManifest).toBeDefined()
    const ihaleExt = ihaleManifest?.fileAssociations.find((f) => f.ext === 'ihale')
    expect(ihaleExt?.mimeType).toBe('application/x-ihale')
    expect(ihaleExt?.progId).toBe('Ihale360.Document')

    // 3. Kesin ayrıklık (Hiçbir uzantı iki farklı uygulamada birden bulunamaz)
    const seenExtensions = new Map<string, string>()
    for (const app of DEFAULT_ECOSYSTEM_MANIFESTS) {
      for (const fa of app.fileAssociations) {
        expect(
          seenExtensions.has(fa.ext),
          `Extension .${fa.ext} is shared between ${seenExtensions.get(fa.ext)} and ${app.id}`
        ).toBe(false)
        seenExtensions.set(fa.ext, app.id)
      }
    }
  })

  it('Evraktron bağımsız masaüstü ürünü olarak .etap formatı ve Arşiv modülüyle doğrulanmalıdır', () => {
    const evraktron = DEFAULT_ECOSYSTEM_MANIFESTS.find((m) => m.id === 'evraktron')
    expect(evraktron).toBeDefined()
    expect(evraktron?.appId).toBe('dev.ilyasbozdemir.evraktron')
    expect(evraktron?.executableName).toBe('Evraktron.exe')
    expect(evraktron?.modules).toContain('Arşiv Modülü (.etap)')
    expect(evraktron?.modules).toContain('FlowDesk Entegrasyonu')

    const etap = evraktron?.fileAssociations.find((f) => f.ext === 'etap')
    expect(etap).toBeDefined()
    expect(etap?.mimeType).toBe('application/x-evraktron-etap')
    expect(etap?.progId).toBe('Evraktron.Document')
    expect(etap?.isPrimary).toBe(true)
  })

  it('Personel 360 bağımsız bir .exe masaüstü uygulaması sözleşmesine ve iş kurallarına sahip olmalıdır', async () => {
    const { PERSONEL_360_MANIFEST, calculateIzinGunu, validateIzinTalebiKurallari } = await import('../index.js')
    expect(PERSONEL_360_MANIFEST.id).toBe('personel-360')
    expect(PERSONEL_360_MANIFEST.appId).toBe('dev.ilyasbozdemir.personel360')
    expect(PERSONEL_360_MANIFEST.executableName).toBe('Personel360.exe')
    expect(PERSONEL_360_MANIFEST.category).toBe('hr')
    expect(PERSONEL_360_MANIFEST.modules).toContain('İzin Yönetimi & Bakiye')

    // İş kuralı: Gün hesabı
    const gun = calculateIzinGunu('2026-06-01', '2026-06-05')
    expect(gun).toBe(5)

    // İş kuralı: Bakiye aşımı kontrolü
    const validationResult = validateIzinTalebiKurallari({
      talep: {
        personelId: 'p-1',
        personelAdSoyad: 'Ali Veli',
        sicilNo: '1234',
        izinTuru: 'yillik',
        baslangicTarihi: '2026-07-01',
        bitisTarihi: '2026-07-15',
        gunSayisi: 15,
        aciklama: 'Yıllık dinlenme'
      },
      bakiye: {
        id: 'b-1',
        personelId: 'p-1',
        yil: 2026,
        hakEdilenGun: 14,
        devredenGun: 0,
        kullanilanGun: 4,
        kalanGun: 10
      },
      mevcutTalepler: []
    })
    expect(validationResult.gecerli).toBe(false)
    expect(validationResult.hata).toContain('kalan yıllık izin bakiyesinden (10) fazladır')
  })

  it('Genel Kurumsal Süreç tanımları aşamalı akış, şemalar ve şablonlarla doğrulanmalıdır', async () => {
    const { GENERIC_FLOW_DEFINITION, FORM_SCHEMA_KURUMSAL_TALEP, DOCUMENT_TEMPLATE_TALEP_ONAY_YAZISI } = await import('../index.js')
    expect(GENERIC_FLOW_DEFINITION.id).toBe('flow-kurumsal-talep-yonetimi')
    expect(GENERIC_FLOW_DEFINITION.groups).toHaveLength(2)

    const stageIds = GENERIC_FLOW_DEFINITION.groups.map((g) => g.id)
    expect(stageIds).toEqual(['grup-talep', 'grup-yurutme'])

    expect(FORM_SCHEMA_KURUMSAL_TALEP.id).toBe('form-kurumsal-talep')
    expect(DOCUMENT_TEMPLATE_TALEP_ONAY_YAZISI.id).toBe('DOC-TALEP-01')
  })

  it('FLOWDESK 360 bağımsız dinamik süreç masası olarak kendi kimlik ve dosya formatlarıyla doğrulanmalıdır', async () => {
    const { FLOWDESK_360_MANIFEST, getFileFormatsByAppId } = await import('../index.js')
    expect(FLOWDESK_360_MANIFEST.id).toBe('flowdesk-360')
    expect(FLOWDESK_360_MANIFEST.appId).toBe('dev.ilyasbozdemir.flowdesk360')
    expect(FLOWDESK_360_MANIFEST.executableName).toBe('FlowDesk360.exe')
    expect(FLOWDESK_360_MANIFEST.category).toBe('workflow')
    expect(FLOWDESK_360_MANIFEST.installState).toBe('installed')

    // Dosya formatları: .flowdesk (birincil) ve .flow (şablon)
    const formats = getFileFormatsByAppId('flowdesk-360')
    expect(formats).toHaveLength(2)
    expect(formats.map((f) => f.ext)).toEqual(['flowdesk', 'flow'])

    // TEMİN 360 ve İHALE 360 izolasyonu: FlowDesk bunlara ait hiçbir format içermemelidir
    const extList = FLOWDESK_360_MANIFEST.fileAssociations.map((f) => f.ext)
    expect(extList).not.toContain('temin')
    expect(extList).not.toContain('hkmp')
    expect(extList).not.toContain('ihale')
  })
})
