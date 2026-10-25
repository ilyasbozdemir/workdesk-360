import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

// Import functions from release.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { computeNextVersion, bumpPatch, releaseTargets } = require('../release.js')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateReleaseNotes } = require('../generate-release-notes.js')

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKF]/g, '')
}

const GIT_ROOT = path.resolve(__dirname, '../../../..')

describe('Release Script RC & Versioning (Release Candidate Support)', () => {
  describe('Sürüm Geçiş Kuralları (computeNextVersion)', () => {
    it('1.0.0-beta.256 sürümünden --rc ile 1.0.0-rc.1 üretir', () => {
      const next = computeNextVersion('1.0.0-beta.256', { rc: true })
      expect(next).toBe('1.0.0-rc.1')
    })

    it('1.0.0-beta.256 sürümünden --rc ve --patch kombinasyonu ile yine 1.0.0-rc.1 üretir', () => {
      const next = computeNextVersion('1.0.0-beta.256', { rc: true, patch: true })
      expect(next).toBe('1.0.0-rc.1')
    })

    it('1.0.0-rc.1 sürümünden --rc ile 1.0.0-rc.2 üretir', () => {
      const next = computeNextVersion('1.0.0-rc.1', { rc: true })
      expect(next).toBe('1.0.0-rc.2')
    })

    it('1.0.0-rc.1 sürümünden --rc ve --patch kombinasyonu ile 1.0.0-rc.2 üretir', () => {
      const next = computeNextVersion('1.0.0-rc.1', { rc: true, patch: true })
      expect(next).toBe('1.0.0-rc.2')
    })

    it('1.0.0-rc.9 sürümünden --rc ile 1.0.0-rc.10 üretir (çift basamak geçişi)', () => {
      const next = computeNextVersion('1.0.0-rc.9', { rc: true })
      expect(next).toBe('1.0.0-rc.10')
    })

    it('1.0.0-rc.9 sürümünden --rc ve --patch ile 1.0.0-rc.10 üretir', () => {
      const next = computeNextVersion('1.0.0-rc.9', { rc: true, patch: true })
      expect(next).toBe('1.0.0-rc.10')
    })

    it('--rc olmadan mevcut beta patch davranışı: 1.0.0-beta.256 → 1.0.0-beta.257', () => {
      const next = computeNextVersion('1.0.0-beta.256', { patch: true })
      expect(next).toBe('1.0.0-beta.257')
    })

    it('bumpPatch geriye dönük uyumluluk fonksiyonu patch artışını doğrular', () => {
      expect(bumpPatch('1.0.0-beta.256')).toBe('1.0.0-beta.257')
      expect(bumpPatch('1.0.0-rc.1')).toBe('1.0.0-rc.2')
    })

    it('1.0.0 tabanına sabitlenmemiş dinamik versiyonlarda da çalışır (örn: 2.1.0-beta.5 → 2.1.0-rc.1)', () => {
      const next = computeNextVersion('2.1.0-beta.5', { rc: true })
      expect(next).toBe('2.1.0-rc.1')
    })

    it('kararlı sürüm patch artışını destekler (örn: 1.0.0 → 1.0.1)', () => {
      const next = computeNextVersion('1.0.0', { patch: true })
      expect(next).toBe('1.0.1')
    })

    it('desteklenmeyen veya geçersiz sürüm formatlarında açık hata fırlatır', () => {
      expect(() => computeNextVersion('invalid-format', { rc: true })).toThrowError(
        /Desteklenmeyen veya geçersiz/
      )
      expect(() => computeNextVersion('', { rc: true })).toThrowError(/Geçersiz versiyon/)
      expect(() => computeNextVersion('1.0.0-rc.1', { channel: 'beta' })).toThrowError(
        /Kanal düşürme engellendi/
      )
    })

    it('kararlı sürümden sonra yeniden prerelease istendiğinde sonraki patch tabanından başlar', () => {
      expect(computeNextVersion('1.0.0', { rc: true })).toBe('1.0.1-rc.1')
    })
  })

  describe('Dry-run Güvenlik Kontrolleri & Dosya Bütünlüğü', () => {
    it('--rc --dry-run çalıştırıldığında exit code 0 döner ve RC simülasyonunu görüntüler', () => {
      const currentVersion = JSON.parse(
        fs.readFileSync(path.join(GIT_ROOT, 'package.json'), 'utf-8')
      ).version
      const expectedNext = computeNextVersion(currentVersion, { rc: true })
      const rawOutput = execSync('node apps/app-desktop/scripts/release.js --rc --dry-run', {
        cwd: GIT_ROOT,
        encoding: 'utf-8'
      })
      const output = stripAnsi(rawOutput)

      expect(output).toContain('TEMİN 360 - Release Script')
      expect(output).toContain('DRY RUN modu - hiçbir değişiklik yapılmayacak')
      expect(output).toContain(expectedNext)
      expect(output).toContain(`Tag:      v${expectedNext}`)
      expect(output).toContain('DRY RUN - Hiçbir değişiklik yapılmadı')
    })

    it('--rc --dry-run sonrasında hiçbir dosya değişmemiş (git working tree temiz) kalır', () => {
      const beforeStatus = execSync('git status --porcelain', {
        cwd: GIT_ROOT,
        encoding: 'utf-8'
      }).trim()

      execSync('node apps/app-desktop/scripts/release.js --rc --dry-run', {
        cwd: GIT_ROOT,
        encoding: 'utf-8'
      })

      const afterStatus = execSync('git status --porcelain', {
        cwd: GIT_ROOT,
        encoding: 'utf-8'
      }).trim()

      expect(afterStatus).toBe(beforeStatus)
    }, 15000)

    it('--no-push parametresi ile remote push adımı atlanır ve konsola kılavuz yazılır', () => {
      const rawOutput = execSync(
        'node apps/app-desktop/scripts/release.js --rc --dry-run --no-push',
        {
          cwd: GIT_ROOT,
          encoding: 'utf-8'
        }
      )
      const output = stripAnsi(rawOutput)

      expect(output).toContain('Push      : Hayır')
      expect(output).toContain('Push atlandı (--no-push)')
    })

    it('Mevcut bir git tag için release çalıştırıldığında işlem durdurulur ve hata verilir', () => {
      // Mevcut sürüm (v1.0.0-beta.256) tag'ini patch veya rc vermeden tetiklemeyi deneyelim
      // Eğer mevcut tag zaten git tag listesinde varsa durmalıdır
      const existingTags = execSync('git tag --list', { cwd: GIT_ROOT, encoding: 'utf-8' })
      if (existingTags.includes('v1.0.0-beta.256')) {
        expect(() => {
          execSync('node apps/app-desktop/scripts/release.js --dry-run --skip-versions', {
            cwd: GIT_ROOT,
            encoding: 'utf-8',
            stdio: 'pipe'
          })
        }).toThrow()
      }
    })

    it('releaseTargets listesi güvenli ve seçicidir, tüm monorepo paketlerini ve şemaları içerir', () => {
      expect(releaseTargets).toContain('package.json')
      expect(releaseTargets).toContain('apps/app-desktop/package.json')
      expect(releaseTargets).toContain('packages/database/package.json')
      expect(releaseTargets).toContain('packages/document-templates/package.json')
      expect(releaseTargets).toContain('packages/database/schema-snapshot.json')
      expect(releaseTargets).toContain('packages/database/src/schema-manifest')
    })
  })

  describe('Release Notes Generator (generate-release-notes)', () => {
    it('RC tag verildiğinde Sürüm Adayı (Release Candidate) başlığı üretir', () => {
      const notes = generateReleaseNotes('v1.0.0-rc.1')
      expect(notes).toContain('🎯 **TEMİN 360 v1.0.0-rc.1 (Sürüm Adayı / Release Candidate)**')
      expect(notes).toContain('Kararlı sürüm öncesi test ve doğrulama sürümüdür')
    })

    it('Beta tag verildiğinde Erken Erişim (Early Access) başlığı üretir', () => {
      const notes = generateReleaseNotes('v1.0.0-beta.256')
      expect(notes).toContain('🚀 **TEMİN 360 v1.0.0-beta.256 (Erken Erişim / Early Access)**')
    })
  })

  describe('Monorepo Paket Sürümleri ve Şema Manifest Bütünlüğü', () => {
    it('Tüm monorepo package.json dosyaları mevcut ve geçerlidir', () => {
      const rootPkg = JSON.parse(fs.readFileSync(path.join(GIT_ROOT, 'package.json'), 'utf-8'))
      const desktopPkg = JSON.parse(
        fs.readFileSync(path.join(GIT_ROOT, 'apps/app-desktop/package.json'), 'utf-8')
      )
      const dbPkg = JSON.parse(
        fs.readFileSync(path.join(GIT_ROOT, 'packages/database/package.json'), 'utf-8')
      )
      const docPkg = JSON.parse(
        fs.readFileSync(path.join(GIT_ROOT, 'packages/document-templates/package.json'), 'utf-8')
      )

      expect(rootPkg.version).toBeDefined()
      expect(desktopPkg.version).toBe(rootPkg.version)
      expect(dbPkg.version).toBe(rootPkg.version)
      expect(docPkg.version).toBe(rootPkg.version)
    })
  })
})
