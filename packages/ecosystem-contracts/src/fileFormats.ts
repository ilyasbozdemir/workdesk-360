/**
 * WorkDesk 360 — Dosya Formatı, MIME Türü ve Windows Dosya İlişkilendirme Standardı
 * 
 * Bu dosya ekosistemdeki tüm masaüstü uygulamalarının sahip olduğu dosya uzantılarını,
 * IANA/Vendor MIME türlerini, Windows ProgID tanımlarını ve sahiplik sınırlarını
 * tek bir doğrulanmış kaynak (single source of truth) olarak tanımlar.
 */

export interface EcosystemFileFormatDefinition {
  /** Dosya uzantısı (noktasız, küçük harf, örn: 'temin') */
  ext: string
  /** Standart IANA/Vendor MIME Türü (örn: 'application/x-temin') */
  mimeType: string
  /** Windows Kayıt Defteri ProgID (örn: 'Temin360.Document') */
  progId: string
  /** Sahip uygulama ID'si (örn: 'temin-360') */
  appId: string
  /** Sahip Electron appId (örn: 'dev.ilyasbozdemir.temin360') */
  electronAppId: string
  /** Sahip uygulamanın çalıştırılabilir dosya adı (örn: 'TEMIN360.exe') */
  executableName: string
  /** Uygulama adı (örn: 'TEMİN 360') */
  appName: string
  /** Biçim başlığı / etiketi */
  label: string
  /** Dosya iletişim kutusu ve Windows Explorer açıklama metni */
  description: string
  /** Windows PerceivedType ('document') */
  perceivedType: 'document'
  /** Bu uzantı ilgili uygulamanın birincil ve varsayılan formatı mı? */
  isPrimary: boolean
  /** Geriye dönük uyumluluk için korunan eski sürüm uzantısı mı? */
  isLegacy?: boolean
  /** Alternatif uzantı mı? */
  isAlternative?: boolean
}

export const ECOSYSTEM_FILE_FORMATS: readonly EcosystemFileFormatDefinition[] = [
  // -------------------------------------------------------------------------
  // 1. TEMİN 360 (Doğrudan Temin ve Satınalma Masası)
  // -------------------------------------------------------------------------
  {
    ext: 'temin',
    mimeType: 'application/x-temin',
    progId: 'Temin360.Document',
    appId: 'temin-360',
    electronAppId: 'dev.ilyasbozdemir.temin360',
    executableName: 'TEMIN360.exe',
    appName: 'TEMİN 360',
    label: 'TEMİN 360 Proje Dosyası',
    description: 'TEMİN 360 Doğrudan Temin Proje Dosyası (*.temin)',
    perceivedType: 'document',
    isPrimary: true
  },
  {
    ext: 'hkmp',
    mimeType: 'application/x-hkmp',
    progId: 'Temin360.Document',
    appId: 'temin-360',
    electronAppId: 'dev.ilyasbozdemir.temin360',
    executableName: 'TEMIN360.exe',
    appName: 'TEMİN 360',
    label: 'TEMİN 360 Eski Sürüm Proje Dosyası (HakimPro)',
    description: 'TEMİN 360 ile Açılabilen Eski Proje Dosyası (*.hkmp)',
    perceivedType: 'document',
    isPrimary: false,
    isLegacy: true
  },
  {
    ext: 'tmn360',
    mimeType: 'application/x-temin360',
    progId: 'Temin360.Document',
    appId: 'temin-360',
    electronAppId: 'dev.ilyasbozdemir.temin360',
    executableName: 'TEMIN360.exe',
    appName: 'TEMİN 360',
    label: 'Temin 360 Arşiv Dosyası',
    description: 'Temin 360 Arşiv Dosyası (*.tmn360)',
    perceivedType: 'document',
    isPrimary: false,
    isLegacy: true
  },

  // -------------------------------------------------------------------------
  // 2. İHALE 360 (4734 Sayılı Kanun Kamu İhalesi Masası)
  // -------------------------------------------------------------------------
  {
    ext: 'ihale',
    mimeType: 'application/x-ihale',
    progId: 'Ihale360.Document',
    appId: 'ihale-360',
    electronAppId: 'dev.ilyasbozdemir.ihale360',
    executableName: 'IHALE360.exe',
    appName: 'İHALE 360',
    label: 'İHALE 360 Proje Dosyası',
    description: 'İHALE 360 Kamu İhalesi Proje Dosyası (*.ihale)',
    perceivedType: 'document',
    isPrimary: true
  },
  {
    ext: 'ihale360',
    mimeType: 'application/x-ihale360',
    progId: 'Ihale360.Document',
    appId: 'ihale-360',
    electronAppId: 'dev.ilyasbozdemir.ihale360',
    executableName: 'IHALE360.exe',
    appName: 'İHALE 360',
    label: 'İHALE 360 Alternatif Proje Dosyası',
    description: 'İHALE 360 Alternatif Proje Dosyası (*.ihale360)',
    perceivedType: 'document',
    isPrimary: false,
    isAlternative: true
  },

  // -------------------------------------------------------------------------
  // 3. EVRAKTRON (Gelen-Giden Evrak Kayıt & Takip Masası - Planlanan)
  // -------------------------------------------------------------------------
  {
    ext: 'etap',
    mimeType: 'application/x-evraktron-etap',
    progId: 'Evraktron.Document',
    appId: 'evraktron',
    electronAppId: 'dev.ilyasbozdemir.evraktron',
    executableName: 'Evraktron.exe',
    appName: 'Evraktron',
    label: 'Evraktron Evrak Paketi',
    description: 'Evraktron Evrak Paketi (*.etap)',
    perceivedType: 'document',
    isPrimary: true
  },

  // -------------------------------------------------------------------------
  // 5. FLOWDESK 360 (Kurumsal Dinamik Süreç ve Görev Masası)
  // -------------------------------------------------------------------------
  {
    ext: 'flowdesk',
    mimeType: 'application/x-flowdesk',
    progId: 'FlowDesk360.Document',
    appId: 'flowdesk-360',
    electronAppId: 'dev.ilyasbozdemir.flowdesk360',
    executableName: 'FlowDesk360.exe',
    appName: 'FLOWDESK 360',
    label: 'FLOWDESK 360 Süreç Dosyası',
    description: 'FLOWDESK 360 Dinamik Süreç Dosyası (*.flowdesk)',
    perceivedType: 'document',
    isPrimary: true
  },
  {
    ext: 'flow',
    mimeType: 'application/x-flowdesk-template',
    progId: 'FlowDesk360.Document',
    appId: 'flowdesk-360',
    electronAppId: 'dev.ilyasbozdemir.flowdesk360',
    executableName: 'FlowDesk360.exe',
    appName: 'FLOWDESK 360',
    label: 'FLOWDESK Süreç Şablonu',
    description: 'FLOWDESK Süreç Şablonu (*.flow)',
    perceivedType: 'document',
    isPrimary: false,
    isAlternative: true
  }
] as const

/**
 * Uzantıya göre (örn: 'temin' veya '.temin') format tanımını getirir.
 */
export function getFileFormatByExtension(ext: string): EcosystemFileFormatDefinition | undefined {
  const cleanExt = ext.trim().toLowerCase().replace(/^\.+/, '')
  return ECOSYSTEM_FILE_FORMATS.find((f) => f.ext.toLowerCase() === cleanExt)
}

/**
 * Uygulama manifest ID'sine göre (örn: 'temin-360') format tanımlarını getirir.
 */
export function getFileFormatsByAppId(appId: string): EcosystemFileFormatDefinition[] {
  return ECOSYSTEM_FILE_FORMATS.filter((f) => f.appId === appId)
}

/**
 * Windows ProgID değerine göre (örn: 'Temin360.Document') format tanımlarını getirir.
 */
export function getFileFormatsByProgId(progId: string): EcosystemFileFormatDefinition[] {
  return ECOSYSTEM_FILE_FORMATS.filter((f) => f.progId === progId)
}

/**
 * Belirli bir uzantının hedeflenen uygulamaya ait olup olmadığını doğrular.
 */
export function isExtensionOwnedBy(ext: string, appId: string): boolean {
  const format = getFileFormatByExtension(ext)
  return format ? format.appId === appId : false
}
