/**
 * Workspace 360 – başlatılabilir/algılanabilir uygulama allowlist'i (Electron'dan bağımsız, test edilebilir).
 *
 * Renderer'dan gelen `appId` GÜVENİLMEZ girdidir. Dosya yolu, EXE adı ve dev paket adı
 * yalnızca bu allowlist'teki sabit değerlerden türetilir; girdiden asla türetilmez.
 */

export interface EcosystemAppConfig {
  displayName: string
  folderName: string
  exeName: string
  installedFolderNames: string[]
}

export const WORKSPACE_APP_ID = 'dev.ilyasbozdemir.workspace360'

export const KNOWN_APPS: Readonly<Record<string, EcosystemAppConfig>> = Object.freeze({
  'dev.ilyasbozdemir.temin360': {
    displayName: 'TEMİN 360',
    folderName: 'temin360-desktop',
    exeName: 'TEMIN360.exe',
    installedFolderNames: ['temin360', 'TEMİN 360', 'Temin 360']
  },
  'dev.ilyasbozdemir.ihale360': {
    displayName: 'İHALE 360',
    folderName: 'ihale360-desktop',
    exeName: 'IHALE360.exe',
    installedFolderNames: ['ihale360', 'İHALE 360', 'Ihale 360']
  },
  'dev.ilyasbozdemir.personel360': {
    displayName: 'Personel 360',
    folderName: 'personel360-desktop',
    exeName: 'Personel360.exe',
    installedFolderNames: ['personel360', 'Personel 360', 'Personel360']
  },
  'dev.ilyasbozdemir.flowdesk360': {
    displayName: 'FLOWDESK 360',
    folderName: 'flowdesk-desktop',
    exeName: 'FlowDesk360.exe',
    installedFolderNames: ['flowdesk', 'FLOWDESK 360', 'FlowDesk 360']
  },
  'dev.ilyasbozdemir.diskanaliz360': {
    displayName: 'Disk Analiz 360',
    folderName: 'disk-analiz-360-desktop',
    exeName: 'DiskAnaliz360.exe',
    installedFolderNames: ['disk-analiz-360-desktop', 'Disk Analiz 360', 'DiskAnaliz360']
  }
})

/**
 * Girdi allowlist'te kayıtlı bir uygulama kimliği ise yapılandırmasını döndürür, değilse null.
 * Prototip anahtarları (`__proto__`, `constructor`, `toString` …) kabul edilmez.
 */
export function resolveKnownApp(appId: unknown): EcosystemAppConfig | null {
  if (typeof appId !== 'string') return null
  if (!Object.prototype.hasOwnProperty.call(KNOWN_APPS, appId)) return null
  return KNOWN_APPS[appId]
}

export function isWorkspaceAppId(appId: unknown): boolean {
  return appId === WORKSPACE_APP_ID
}

/**
 * Geliştirici modunda `pnpm --filter <paket> dev` çalıştırılmadan önce paket adı doğrulanır:
 * allowlist'teki klasör adıyla BİREBİR eşleşmeli (package.json içeriğine körü körüne güvenilmez).
 */
export function isTrustedDevPackage(config: EcosystemAppConfig, packageName: unknown): boolean {
  return typeof packageName === 'string' && packageName === config.folderName
}
