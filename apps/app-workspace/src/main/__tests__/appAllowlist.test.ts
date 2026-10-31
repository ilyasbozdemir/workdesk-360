// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  KNOWN_APPS,
  WORKSPACE_APP_ID,
  resolveKnownApp,
  isWorkspaceAppId,
  isTrustedDevPackage
} from '../appAllowlist'

describe('appAllowlist – güvenilmeyen appId girdisi', () => {
  it('kayıtlı uygulama kimliklerini çözer', () => {
    for (const id of Object.keys(KNOWN_APPS)) {
      expect(resolveKnownApp(id)).toBe(KNOWN_APPS[id])
    }
    expect(resolveKnownApp('dev.ilyasbozdemir.temin360')?.folderName).toBe('temin360-desktop')
  })

  it.each([
    ['boş metin', ''],
    ['bilinmeyen kimlik', 'dev.ilyasbozdemir.dosya360'],
    ['yol geçişi', 'dev.ilyasbozdemir.../../../Windows/System32/calc'],
    ['ters eğik çizgi geçişi', '..\\..\\evil'],
    ['komut enjeksiyonu', 'dev.ilyasbozdemir.temin360 && calc'],
    ['büyük/küçük harf farkı', 'DEV.ILYASBOZDEMIR.TEMIN360'],
    ['sondaki boşluk', 'dev.ilyasbozdemir.temin360 '],
    ['__proto__', '__proto__'],
    ['constructor', 'constructor'],
    ['toString', 'toString'],
    ['hasOwnProperty', 'hasOwnProperty']
  ])('reddeder: %s', (_name, input) => {
    expect(resolveKnownApp(input)).toBeNull()
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['sayı', 42],
    ['nesne', { toString: () => 'dev.ilyasbozdemir.temin360' }],
    ['dizi', ['dev.ilyasbozdemir.temin360']]
  ])('string olmayan girdiyi reddeder: %s', (_name, input) => {
    expect(resolveKnownApp(input)).toBeNull()
  })

  it('allowlist değiştirilemez (frozen)', () => {
    expect(Object.isFrozen(KNOWN_APPS)).toBe(true)
  })

  it('her kayıt için klasör adı güvenli bir paket adıdır (yol ayracı/boşluk/kabuk karakteri yok)', () => {
    for (const cfg of Object.values(KNOWN_APPS)) {
      expect(cfg.folderName).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('workspace kimliği yalnızca tam eşleşmeyle tanınır ve allowlist\'te başlatılabilir kayıt değildir', () => {
    expect(isWorkspaceAppId(WORKSPACE_APP_ID)).toBe(true)
    expect(isWorkspaceAppId(`${WORKSPACE_APP_ID} `)).toBe(false)
    expect(isWorkspaceAppId(undefined)).toBe(false)
    expect(resolveKnownApp(WORKSPACE_APP_ID)).toBeNull()
  })

  it('dev paket adı klasör adıyla birebir eşleşmeli', () => {
    const cfg = KNOWN_APPS['dev.ilyasbozdemir.temin360']
    expect(isTrustedDevPackage(cfg, 'temin360-desktop')).toBe(true)
    expect(isTrustedDevPackage(cfg, 'temin360-desktop && calc')).toBe(false)
    expect(isTrustedDevPackage(cfg, 'ihale360-desktop')).toBe(false)
    expect(isTrustedDevPackage(cfg, '--filter')).toBe(false)
    expect(isTrustedDevPackage(cfg, undefined)).toBe(false)
  })
})

