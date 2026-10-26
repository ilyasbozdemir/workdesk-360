import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import {
  parseVersion,
  tryParseVersion,
  isValidVersion,
  compareVersions,
  computeNextVersion,
  isUpdateEligible,
  getReleaseHeader,
  loadVersionPolicy,
  validateVersionPolicy,
  checkTagExists,
  DEFAULT_VERSION_POLICY,
  VersionManager,
  VersionPolicy
} from '../../src/shared/version/versionManager'

const GIT_ROOT = path.resolve(__dirname, '../../../..')

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKF]/g, '')
}

describe('Merkezi Version Manager & Sürüm Karşılaştırma Testleri', () => {
  describe('1. SemVer Karşılaştırma Kuralları (compareVersions)', () => {
    it('aynı kanal içindeki sayısal artışları doğrular (örn: alpha.1 < alpha.2)', () => {
      expect(compareVersions('1.0.0-alpha.1', '1.0.0-alpha.2')).toBe(-1)
      expect(compareVersions('1.0.0-alpha.2', '1.0.0-alpha.1')).toBe(1)
    })

    it('sayısal çok basamaklı iterasyonları doğru karşılaştırır (alpha.2 < alpha.10, beta.9 < beta.10)', () => {
      expect(compareVersions('1.0.0-alpha.2', '1.0.0-alpha.10')).toBe(-1)
      expect(compareVersions('1.0.0-beta.9', '1.0.0-beta.10')).toBe(-1)
      expect(compareVersions('1.0.0-rc.9', '1.0.0-rc.10')).toBe(-1)
    })

    it('kanallar arası öncelik hiyerarşisini uygular (alpha < beta < rc < stable)', () => {
      expect(compareVersions('1.0.0-alpha.79', '1.0.0-beta.1')).toBe(-1)
      expect(compareVersions('1.0.0-beta.255', '1.0.0-beta.256')).toBe(-1)
      expect(compareVersions('1.0.0-beta.256', '1.0.0-rc.1')).toBe(-1)
      expect(compareVersions('1.0.0-rc.1', '1.0.0-rc.2')).toBe(-1)
      expect(compareVersions('1.0.0-rc.2', '1.0.0')).toBe(-1)
    })

    it('kararlı sürüm (stable), aynı taban sürümün tüm prerelease sürümlerinden büyüktür', () => {
      expect(compareVersions('1.0.0', '1.0.0-rc.1')).toBe(1)
      expect(compareVersions('1.0.0', '1.0.0-beta.256')).toBe(1)
      expect(compareVersions('1.0.0', '1.0.0-alpha.99')).toBe(1)
    })

    it('taban sürüm artışında (major/minor/patch) prerelease kararlıdan büyük olabilir', () => {
      expect(compareVersions('1.0.0', '1.0.1-alpha.1')).toBe(-1)
      expect(compareVersions('1.0.1-alpha.1', '1.0.0')).toBe(1)
      expect(compareVersions('1.0.0', '1.1.0-alpha.1')).toBe(-1)
      expect(compareVersions('1.0.0', '2.0.0-alpha.1')).toBe(-1)
    })

    it('aynı sürümler karşılaştırıldığında 0 döner', () => {
      expect(compareVersions('1.0.0-rc.1', '1.0.0-rc.1')).toBe(0)
      expect(compareVersions('v1.0.0-rc.1', '1.0.0-rc.1')).toBe(0)
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
    })

    it('rastgele geçerli sürümleri de SemVer ile doğru karşılaştırır', () => {
      expect(compareVersions('3.4.5-rc.8', '3.4.5-rc.9')).toBe(-1)
      expect(compareVersions('4.0.0', '3.9.9')).toBe(1)
    })
  })

  describe('2. Sürüm Ayrıştırma ve Doğrulama (parseVersion & isValidVersion)', () => {
    it('geçerli SemVer sürümlerini başarıyla ayrıştırır', () => {
      const p1 = parseVersion('v1.0.0-beta.256')
      expect(p1.major).toBe(1)
      expect(p1.minor).toBe(0)
      expect(p1.patch).toBe(0)
      expect(p1.channel).toBe('beta')
      expect(p1.iteration).toBe(256)
      expect(p1.isPrerelease).toBe(true)
      expect(p1.baseVersion).toBe('1.0.0')

      const p2 = parseVersion('1.2.3')
      expect(p2.major).toBe(1)
      expect(p2.minor).toBe(2)
      expect(p2.patch).toBe(3)
      expect(p2.channel).toBe('stable')
      expect(p2.iteration).toBe(0)
      expect(p2.isPrerelease).toBe(false)
    })

    it('geçersiz veya desteklenmeyen sürüm formatlarında açık hata fırlatır', () => {
      expect(() => parseVersion('invalid-version')).toThrow(/Desteklenmeyen veya geçersiz/)
      expect(() => parseVersion('1.0')).toThrow(/Desteklenmeyen veya geçersiz/)
      expect(() => parseVersion('')).toThrow(/Geçersiz versiyon/)
      expect(() => parseVersion('1.0.0-unsupported.1')).toThrow(/Geçersiz veya desteklenmeyen/)
    })

    it('tryParseVersion ve isValidVersion sessiz doğrulama yapar', () => {
      expect(isValidVersion('1.0.0-rc.1')).toBe(true)
      expect(isValidVersion('not-semver')).toBe(false)
      expect(tryParseVersion('not-semver')).toBeNull()
    })
  })

  describe('3. Sonraki Sürüm Hesaplama (computeNextVersion)', () => {
    it('1.0.0-alpha.79 + alpha → 1.0.0-alpha.80', () => {
      expect(computeNextVersion('1.0.0-alpha.79', { channel: 'alpha' })).toBe('1.0.0-alpha.80')
    })

    it('1.0.0-beta.256 + beta → 1.0.0-beta.257', () => {
      expect(computeNextVersion('1.0.0-beta.256', { channel: 'beta' })).toBe('1.0.0-beta.257')
      expect(computeNextVersion('1.0.0-beta.256', { patch: true })).toBe('1.0.0-beta.257')
    })

    it('1.0.0-beta.256 + rc → 1.0.0-rc.1 (ve --rc / --rc --patch kombinasyonları)', () => {
      expect(computeNextVersion('1.0.0-beta.256', { channel: 'rc' })).toBe('1.0.0-rc.1')
      expect(computeNextVersion('1.0.0-beta.256', { rc: true })).toBe('1.0.0-rc.1')
      expect(computeNextVersion('1.0.0-beta.256', { rc: true, patch: true })).toBe('1.0.0-rc.1')
    })

    it('1.0.0-rc.1 + rc → 1.0.0-rc.2', () => {
      expect(computeNextVersion('1.0.0-rc.1', { channel: 'rc' })).toBe('1.0.0-rc.2')
      expect(computeNextVersion('1.0.0-rc.1', { rc: true })).toBe('1.0.0-rc.2')
      expect(computeNextVersion('1.0.0-rc.1', { patch: true })).toBe('1.0.0-rc.2')
    })

    it('1.0.0-rc.2 + stable → 1.0.0', () => {
      expect(computeNextVersion('1.0.0-rc.2', { channel: 'stable' })).toBe('1.0.0')
    })

    it('stable sürümden sonra yeniden prerelease kanalına geçiş taban sürümü artırır', () => {
      expect(computeNextVersion('1.0.0', { channel: 'alpha' })).toBe('1.0.1-alpha.1')
      expect(computeNextVersion('1.0.0', { channel: 'beta' })).toBe('1.0.1-beta.1')
      expect(computeNextVersion('1.0.0', { channel: 'rc' })).toBe('1.0.1-rc.1')
      expect(computeNextVersion('1.0.0', { channel: 'stable' })).toBe('1.0.1')
      expect(computeNextVersion('1.0.0', { patch: true })).toBe('1.0.1')
    })

    it('kanal düşürme teşebbüslerini engeller (örn: rc -> beta)', () => {
      expect(() => computeNextVersion('1.0.0-rc.1', { channel: 'beta' })).toThrow(
        /Kanal düşürme engellendi/
      )
    })

    it('allowChannelUpgrade: false olduğunda kanal yükseltmeyi engeller', () => {
      const noUpgradePolicy: VersionPolicy = {
        ...DEFAULT_VERSION_POLICY,
        versioning: {
          ...DEFAULT_VERSION_POLICY.versioning,
          prerelease: {
            ...DEFAULT_VERSION_POLICY.versioning.prerelease,
            allowChannelUpgrade: false
          }
        }
      }

      // beta -> rc geçişi engellenmeli
      expect(() =>
        computeNextVersion('1.0.0-beta.256', { channel: 'rc', policy: noUpgradePolicy })
      ).toThrow(/Kanal yükseltme engellendi/)

      // rc -> stable geçişi engellenmeli
      expect(() =>
        computeNextVersion('1.0.0-rc.1', { channel: 'stable', policy: noUpgradePolicy })
      ).toThrow(/Kanal yükseltme engellendi/)
    })
  })

  describe('4. Electron Updater Uygunluk Doğrulaması (isUpdateEligible)', () => {
    it('yeni ve geçerli bir sürüm geldiğinde güncellemeyi kabul eder', () => {
      const res = isUpdateEligible('1.0.0-beta.256', '1.0.0-rc.1')
      expect(res.eligible).toBe(true)
    })

    it('RC sürümünden Stable sürüme geçişi onaylar (kanal yükseltme açıkken)', () => {
      const res = isUpdateEligible('1.0.0-rc.3', '1.0.0')
      expect(res.eligible).toBe(true)
    })

    it('aynı sürüm veya daha eski sürüm geldiğinde güncellemeyi kesinlikle reddeder', () => {
      const same = isUpdateEligible('1.0.0-rc.2', '1.0.0-rc.2')
      expect(same.eligible).toBe(false)
      expect(same.reason).toMatch(/daha eski veya aynı/)

      const older = isUpdateEligible('1.0.0-rc.2', '1.0.0-rc.1')
      expect(older.eligible).toBe(false)
      expect(older.reason).toMatch(/daha eski veya aynı/)
    })

    it('geçersiz formatlı gelen sürümleri reddeder', () => {
      const invalid = isUpdateEligible('1.0.0-rc.2', 'bad-format')
      expect(invalid.eligible).toBe(false)
      expect(invalid.reason).toMatch(/Geçersiz/)
    })

    it('aynı temel sürümde kanal düşürmeyi reddeder (örn: rc.1 iken beta.256 gelmesi)', () => {
      const downgrade = isUpdateEligible('1.0.0-rc.1', '1.0.0-beta.256')
      expect(downgrade.eligible).toBe(false)
      expect(downgrade.reason).toMatch(/Kanal düşürme engellendi/)
    })

    it('Stable → RC geçişi taban sürüm farklı olsa bile reddedilir (1.0.0 stable -> 1.0.1-rc.1)', () => {
      // Kurulu uygulama stable (1.0.0), gelen yeni sürüm rc (1.0.1-rc.1)
      const res = isUpdateEligible('1.0.0', '1.0.1-rc.1')
      expect(res.eligible).toBe(false)
      expect(res.reason).toMatch(/Kanal düşürme engellendi: stable -> rc/)

      // 1.0.0 stable -> 1.1.0-rc.1 veya 2.0.0-beta.1 geçişleri de kanal düşürme sebebiyle engellenir
      const minorRc = isUpdateEligible('1.0.0', '1.1.0-rc.1')
      expect(minorRc.eligible).toBe(false)
      expect(minorRc.reason).toMatch(/Kanal düşürme engellendi: stable -> rc/)

      const majorBeta = isUpdateEligible('1.0.0', '2.0.0-beta.1')
      expect(majorBeta.eligible).toBe(false)
      expect(majorBeta.reason).toMatch(/Kanal düşürme engellendi: stable -> beta/)
    })

    it('allowChannelDowngrade: true ayarlandığında Stable → RC geçişine izin verir', () => {
      const downgradeAllowedPolicy: VersionPolicy = {
        ...DEFAULT_VERSION_POLICY,
        versioning: {
          ...DEFAULT_VERSION_POLICY.versioning,
          prerelease: {
            ...DEFAULT_VERSION_POLICY.versioning.prerelease,
            allowChannelDowngrade: true
          }
        }
      }

      const res = isUpdateEligible('1.0.0', '1.0.1-rc.1', downgradeAllowedPolicy)
      expect(res.eligible).toBe(true)
    })

    it('allowChannelUpgrade: false ayarlandığında updater kanal yükseltmelerini engeller', () => {
      const noUpgradePolicy: VersionPolicy = {
        ...DEFAULT_VERSION_POLICY,
        versioning: {
          ...DEFAULT_VERSION_POLICY.versioning,
          prerelease: {
            ...DEFAULT_VERSION_POLICY.versioning.prerelease,
            allowChannelUpgrade: false
          }
        }
      }

      // beta -> rc geçişi engellenmeli
      const betaToRc = isUpdateEligible('1.0.0-beta.256', '1.0.0-rc.1', noUpgradePolicy)
      expect(betaToRc.eligible).toBe(false)
      expect(betaToRc.reason).toMatch(/Kanal yükseltme engellendi: beta -> rc/)

      // rc -> stable geçişi engellenmeli
      const rcToStable = isUpdateEligible('1.0.0-rc.3', '1.0.0', noUpgradePolicy)
      expect(rcToStable.eligible).toBe(false)
      expect(rcToStable.reason).toMatch(/Kanal yükseltme engellendi: rc -> stable/)

      // Aynı kanal içinde iterasyon artışına (rc.1 -> rc.2) izin verilir
      const sameChannel = isUpdateEligible('1.0.0-rc.1', '1.0.0-rc.2', noUpgradePolicy)
      expect(sameChannel.eligible).toBe(true)
    })
  })

  describe('5. Politika Doğrulama & Katı Hata Yönetimi (validateVersionPolicy & loadVersionPolicy)', () => {
    it('version-policy.yaml dosyasını kök dizinden yükler ve doğrular', () => {
      const policy = loadVersionPolicy()
      expect(policy.versioning.scheme).toBe('semver')
      expect(policy.versioning.channels).toEqual(['alpha', 'beta', 'rc', 'stable'])
      expect(policy.versioning.defaultChannel).toBe('rc')
      expect(policy.versioning.prerelease.allowChannelUpgrade).toBe(true)
      expect(policy.versioning.prerelease.allowChannelDowngrade).toBe(false)
    })

    it('validateVersionPolicy zorunlu alanlar eksik olduğunda açık ve net hata fırlatır', () => {
      // 1. null nesne
      expect(() => validateVersionPolicy(null)).toThrow(/Yapılandırma nesnesi bulunamadı/)

      // 2. versioning bloğu eksik
      expect(() => validateVersionPolicy({})).toThrow(/versioning.*yapılandırma bloğu eksik/)

      // 3. Geçersiz scheme
      expect(() =>
        validateVersionPolicy({
          versioning: { scheme: 'custom' }
        })
      ).toThrow(/Desteklenmeyen sürüm şeması/)

      // 4. channels eksik
      expect(() =>
        validateVersionPolicy({
          versioning: { scheme: 'semver', channels: [] }
        })
      ).toThrow(/channels.*geçerli bir dizi olmalıdır/)

      // 5. channelOrder eksik
      expect(() =>
        validateVersionPolicy({
          versioning: {
            scheme: 'semver',
            channels: ['beta', 'stable'],
            channelOrder: null
          }
        })
      ).toThrow(/channelOrder.*nesnesi eksik/)

      // 6. Bir kanalın channelOrder sıralaması eksik
      expect(() =>
        validateVersionPolicy({
          versioning: {
            scheme: 'semver',
            channels: ['beta', 'stable'],
            channelOrder: { beta: 1 }
          }
        })
      ).toThrow(/"stable" kanalı için "channelOrder" sıralaması tanımlanmamış/)

      // 7. defaultChannel tanımsız
      expect(() =>
        validateVersionPolicy({
          versioning: {
            scheme: 'semver',
            channels: ['beta', 'stable'],
            channelOrder: { beta: 1, stable: 2 },
            defaultChannel: 'unknown'
          }
        })
      ).toThrow(/Geçersiz varsayılan kanal/)

      // 7.1 tagPrefix eksik veya geçersiz
      expect(() =>
        validateVersionPolicy({
          versioning: {
            scheme: 'semver',
            channels: ['beta', 'stable'],
            channelOrder: { beta: 1, stable: 2 },
            defaultChannel: 'beta',
            tagPrefix: ''
          }
        })
      ).toThrow(/tagPrefix.*geçerli ve boş olmayan/)

      // 8. prerelease boolean alanları eksik
      expect(() =>
        validateVersionPolicy({
          versioning: {
            scheme: 'semver',
            channels: ['beta', 'stable'],
            channelOrder: { beta: 1, stable: 2 },
            defaultChannel: 'beta',
            tagPrefix: 'v',
            prerelease: { allowChannelUpgrade: 'yes' }
          }
        })
      ).toThrow(/allowChannelUpgrade.*boolean olmalıdır/)

      // 9. channelMeta eksik
      expect(() =>
        validateVersionPolicy({
          versioning: {
            scheme: 'semver',
            channels: ['beta', 'stable'],
            channelOrder: { beta: 1, stable: 2 },
            defaultChannel: 'beta',
            tagPrefix: 'v',
            prerelease: {
              allowChannelUpgrade: true,
              allowChannelDowngrade: false,
              allowAutoUpdate: true
            },
            channelMeta: {}
          }
        })
      ).toThrow(/meta veriler.*eksik/)
    })

    it('loadVersionPolicy bulunamayan veya bozuk dosyalarda açık hata fırlatır', () => {
      // Bulunamayan dosya
      expect(() => loadVersionPolicy('/non/existent/path/policy.yaml')).toThrow(
        /Belirtilen sürüm politikası dosyası bulunamadı/
      )

      // Bozuk YAML dosyası testi
      const tempCorruptYaml = path.join(__dirname, 'temp-corrupt.yaml')
      try {
        fs.writeFileSync(tempCorruptYaml, 'versioning: [unclosed bracket')
        expect(() => loadVersionPolicy(tempCorruptYaml)).toThrow()
      } finally {
        if (fs.existsSync(tempCorruptYaml)) {
          fs.unlinkSync(tempCorruptYaml)
        }
      }
    })

    it('loadVersionPolicy hiçbir aday konumda dosya bulunamazsa sessizce varsayılana dönmez ve aranılan yolları listeleyerek hata fırlatır', () => {
      const originalExistsSync = fs.existsSync
      try {
        // version-policy.yaml arayan tüm aday yol çağrılarını false yap
        fs.existsSync = (p: fs.PathLike) => {
          if (String(p).includes('version-policy.yaml')) {
            return false
          }
          return originalExistsSync(p)
        }

        // 1. fallbackToDefault belirtilmediğinde (katı mod) açık hata fırlatmalı
        expect(() => loadVersionPolicy()).toThrow(
          /\[VersionManager\] Sürüm politikası dosyası \(version-policy\.yaml\) bulunamadı/
        )

        // 2. fallbackToDefault: true verildiğinde kontrollü fallback yapmalı
        expect(loadVersionPolicy({ fallbackToDefault: true })).toEqual(DEFAULT_VERSION_POLICY)

        // 3. customPath için fallbackToDefault: true
        expect(loadVersionPolicy('/non/existent/policy.yaml', { fallbackToDefault: true })).toEqual(
          DEFAULT_VERSION_POLICY
        )
      } finally {
        fs.existsSync = originalExistsSync
      }
    })

    it('loadVersionPolicy paketlenmiş Electron uygulamasında (process.resourcesPath) dosyayı doğru konumdan bulur', () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'resourcesPath')
      const originalResourcesPath = (process as unknown as { resourcesPath?: string }).resourcesPath
      const tempResourcesDir = fs.mkdtempSync(path.join(GIT_ROOT, 'temp-electron-res-'))
      const tempPolicyFile = path.join(tempResourcesDir, 'version-policy.yaml')

      try {
        // Paket içi resources dizinine geçerli politika kopyala
        const realPolicyContent = fs.readFileSync(
          path.join(GIT_ROOT, 'version-policy.yaml'),
          'utf-8'
        )
        fs.writeFileSync(tempPolicyFile, realPolicyContent, 'utf-8')

        // Electron packaged resourcesPath taklit et (Electron ortamında read-only tanımlanabileceğinden Object.defineProperty kullan)
        Object.defineProperty(process, 'resourcesPath', {
          value: tempResourcesDir,
          configurable: true,
          writable: true
        })

        // 1. Doğrudan resourcesPath üzerindeki aday yol üzerinden yükleme testi
        const loadedDirect = loadVersionPolicy(tempPolicyFile)
        expect(loadedDirect.versioning.channels).toEqual(['alpha', 'beta', 'rc', 'stable'])
        expect(loadedDirect.versioning.defaultChannel).toBe('rc')

        // 2. Diğer tüm yollar bulunamazken sadece process.resourcesPath mevcut olduğunda otomatik bulma testi
        const originalExistsSync = fs.existsSync
        try {
          fs.existsSync = (p: fs.PathLike) => {
            const pStr = String(p)
            // Sadece process.resourcesPath altındaki version-policy.yaml'e izin ver
            if (pStr === tempPolicyFile) {
              return true
            }
            if (pStr.includes('version-policy.yaml')) {
              return false
            }
            return originalExistsSync(p)
          }

          const discoveredFromPackaged = loadVersionPolicy()
          expect(discoveredFromPackaged.versioning.channels).toEqual([
            'alpha',
            'beta',
            'rc',
            'stable'
          ])
          expect(discoveredFromPackaged.versioning.defaultChannel).toBe('rc')
        } finally {
          fs.existsSync = originalExistsSync
        }
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(process, 'resourcesPath', originalDescriptor)
        } else if (originalResourcesPath !== undefined) {
          Object.defineProperty(process, 'resourcesPath', {
            value: originalResourcesPath,
            configurable: true,
            writable: true
          })
        } else {
          delete (process as unknown as { resourcesPath?: string }).resourcesPath
        }
        if (fs.existsSync(tempResourcesDir)) {
          fs.rmSync(tempResourcesDir, { recursive: true, force: true })
        }
      }
    })

    it('DEFAULT_VERSION_POLICY parseVersion ve compareVersions fonksiyonlarında varsayılan parametre olarak çalışmaya devam eder', () => {
      const parsed = parseVersion('1.0.0-beta.1')
      expect(parsed.channel).toBe('beta')
      expect(parsed.iteration).toBe(1)

      const cmp = compareVersions('1.0.0-beta.1', '1.0.0-rc.1')
      expect(cmp).toBe(-1)
    })

    it('getReleaseHeader tüm kanallar için doğru başlık ve açıklamayı üretir', () => {
      const rcHeader = getReleaseHeader('v1.0.0-rc.1')
      expect(rcHeader).toContain('🎯 **TEMİN 360 v1.0.0-rc.1 (Sürüm Adayı / Release Candidate)**')

      const betaHeader = getReleaseHeader('v1.0.0-beta.256')
      expect(betaHeader).toContain('🚀 **TEMİN 360 v1.0.0-beta.256 (Erken Erişim / Early Access)**')

      const stableHeader = getReleaseHeader('v1.0.0')
      expect(stableHeader).toContain('⚖️ **TEMİN 360 v1.0.0 (Kararlı Sürüm)**')
    })

    it('VersionManager sınıfı tüm yetenekleri OOP arayüzüyle sunar', () => {
      const vm = new VersionManager()
      expect(vm.compare('1.0.0-alpha.1', '1.0.0-beta.1')).toBe(-1)
      expect(vm.computeNext('1.0.0-rc.1', { channel: 'rc' })).toBe('1.0.0-rc.2')
      expect(vm.isEligible('1.0.0-rc.1', '1.0.0-rc.2').eligible).toBe(true)
    })
  })

  describe('6. Git Hata Yönetimi & checkTagExists', () => {
    it('var olmayan bir etiket için false döner', () => {
      expect(checkTagExists('v999.999.999-nonexistent', GIT_ROOT)).toBe(false)
    })

    it('boş veya geçersiz etiket verildiğinde açıkça hata fırlatır', () => {
      expect(() => checkTagExists('', GIT_ROOT)).toThrow(/Geçersiz etiket/)
      expect(() => checkTagExists('   ', GIT_ROOT)).toThrow(/Geçersiz etiket/)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => checkTagExists(null as any, GIT_ROOT)).toThrow(/Geçersiz etiket/)
    })

    it('geçersiz veya var olmayan bir dizin verildiğinde Git hatasını açıkça fırlatır', () => {
      const invalidPath = path.join(GIT_ROOT, 'non/existent/folder/path')
      expect(() => checkTagExists('v1.0.0', invalidPath)).toThrow(
        /Git etiket kontrolü başarısız oldu/
      )
    })
  })

  describe('6.1 Kök ve Paket İçi version-policy.yaml Dosyalarının Tutarlılığı', () => {
    it('kök (root) ve paket içi (resources) version-policy.yaml dosyaları birebir aynı ve tutarlıdır', () => {
      const rootPolicyPath = path.join(GIT_ROOT, 'version-policy.yaml')
      const packagePolicyPath = path.join(
        GIT_ROOT,
        'apps/temin360-desktop/resources/version-policy.yaml'
      )

      expect(fs.existsSync(rootPolicyPath)).toBe(true)
      expect(fs.existsSync(packagePolicyPath)).toBe(true)

      const rootContent = fs.readFileSync(rootPolicyPath, 'utf-8').trim()
      const packageContent = fs.readFileSync(packagePolicyPath, 'utf-8').trim()

      expect(packageContent).toBe(rootContent)

      const rootPolicy = loadVersionPolicy(rootPolicyPath)
      const packagePolicy = loadVersionPolicy(packagePolicyPath)

      expect(rootPolicy).toEqual(packagePolicy)
      expect(rootPolicy.versioning.channels).toEqual(['alpha', 'beta', 'rc', 'stable'])
      expect(rootPolicy.versioning.prerelease.allowChannelUpgrade).toBe(true)
      expect(rootPolicy.versioning.prerelease.allowChannelDowngrade).toBe(false)
    })
  })

  describe('7. CLI & Dry-run Entegrasyonu', () => {
    it('--channel rc --dry-run çalıştırıldığında RC geçişini simüle eder', () => {
      const currentVersion = JSON.parse(
        fs.readFileSync(path.join(GIT_ROOT, 'package.json'), 'utf-8')
      ).version
      const expectedNext = computeNextVersion(currentVersion, { channel: 'rc' })
      const raw = execSync('node apps/temin360-desktop/scripts/release.js --channel rc --dry-run', {
        cwd: GIT_ROOT,
        encoding: 'utf-8'
      })
      const output = stripAnsi(raw)
      expect(output).toContain(`${currentVersion} → ${expectedNext}`)
      expect(output).toContain(`Tag:      v${expectedNext}`)
      expect(output).toContain('DRY RUN - Hiçbir değişiklik yapılmadı')
    }, 20000)

    it('--channel beta --patch --dry-run çalıştırıldığında kanal kuralını doğru uygular', () => {
      const currentVersion = JSON.parse(
        fs.readFileSync(path.join(GIT_ROOT, 'package.json'), 'utf-8')
      ).version
      const parsed = parseVersion(currentVersion)

      // Eğer mevcut sürüm zaten rc veya stable ise kanal düşürme (downgrade) engellenmelidir
      if (parsed.channel === 'rc' || parsed.channel === 'stable') {
        expect(() => {
          execSync('node apps/temin360-desktop/scripts/release.js --channel beta --patch --dry-run', {
            cwd: GIT_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe'
          })
        }).toThrow(/Kanal düşürme engellendi/)
      } else {
        const raw = execSync(
          'node apps/temin360-desktop/scripts/release.js --channel beta --patch --dry-run',
          {
            cwd: GIT_ROOT,
            encoding: 'utf-8'
          }
        )
        const output = stripAnsi(raw)
        expect(output).toContain('DRY RUN - Hiçbir değişiklik yapılmadı')
      }
    }, 20000)

    it('--channel stable --dry-run çalıştırıldığında kararlı geçişini simüle eder', () => {
      const currentVersion = JSON.parse(
        fs.readFileSync(path.join(GIT_ROOT, 'package.json'), 'utf-8')
      ).version
      const expectedNext = computeNextVersion(currentVersion, { channel: 'stable' })
      const raw = execSync('node apps/temin360-desktop/scripts/release.js --channel stable --dry-run', {
        cwd: GIT_ROOT,
        encoding: 'utf-8'
      })
      const output = stripAnsi(raw)
      expect(output).toContain(`${currentVersion} → ${expectedNext}`)
      expect(output).toContain(`Tag:      v${expectedNext}`)
      expect(output).toContain('DRY RUN - Hiçbir değişiklik yapılmadı')
    }, 20000)
  })
})
