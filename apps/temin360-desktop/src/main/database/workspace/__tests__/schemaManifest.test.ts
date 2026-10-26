// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  getAppManifest,
  getAppSchemaMax,
  appManifests
} from '@dt/database'

describe('Uygulama Bazlı Şema Manifestleri (Multi-Desktop Architecture)', () => {
  it('her masaüstü uygulaması için bağımsız manifest tanımları mevcuttur', () => {
    expect(appManifests).toBeDefined()
    expect(appManifests['temin360-desktop']).toBeDefined()
    expect(appManifests['ihale360-desktop']).toBeDefined()
    expect(appManifests['devlet-ihale-2886-desktop']).toBeDefined()
  })

  it('temin360-desktop için doğru şema ve sürüm bilgisi döner', () => {
    const manifest = getAppManifest('temin360-desktop')
    expect(manifest.app).toBe('temin360-desktop')
    expect(manifest.target_scope).toBe('dogrudan-temin')
    expect(manifest.version).toBe('1.0.0-rc.7')
    expect(manifest.schema_max).toBe(46)
    expect(getAppSchemaMax('temin360-desktop')).toBe(46)
  })

  it('ihale360-desktop için doğru şema ve sürüm bilgisi döner', () => {
    const manifest = getAppManifest('ihale360-desktop')
    expect(manifest.app).toBe('ihale360-desktop')
    expect(manifest.target_scope).toBe('ihale')
    expect(manifest.version).toBe('1.0.0-beta.1')
    expect(manifest.schema_max).toBe(1)
    expect(getAppSchemaMax('ihale360-desktop')).toBe(1)
  })

  it('devlet-ihale-2886-desktop için doğru şema ve sürüm bilgisi döner', () => {
    const manifest = getAppManifest('devlet-ihale-2886-desktop')
    expect(manifest.app).toBe('devlet-ihale-2886-desktop')
    expect(manifest.target_scope).toBe('devlet_ihale_2886')
    expect(manifest.version).toBe('1.0.0-beta.1')
    expect(manifest.schema_max).toBe(1)
    expect(getAppSchemaMax('devlet-ihale-2886-desktop')).toBe(1)
  })

  it('kısayol isimlerle aramalarda doğru hedef manifesti eşleştirir', () => {
    expect(getAppManifest('temin').app).toBe('temin360-desktop')
    expect(getAppManifest('ihale360').app).toBe('ihale360-desktop')
    expect(getAppManifest('2886').app).toBe('devlet-ihale-2886-desktop')
  })
})
