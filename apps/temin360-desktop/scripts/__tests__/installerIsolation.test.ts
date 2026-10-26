// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// Dosya apps/temin360-desktop/scripts/__tests__/ altında olduğundan REPO_ROOT 3 seviye yukarısıdır
const REPO_ROOT = path.resolve(__dirname, '../../../..')

const TEMIN_INSTALLER_PATH = path.join(REPO_ROOT, 'apps/temin360-desktop/build/installer.nsh')
const IHALE_INSTALLER_PATH = path.join(REPO_ROOT, 'apps/ihale360-desktop/build/installer.nsh')
const DIHALE_INSTALLER_PATH = path.join(
  REPO_ROOT,
  'apps/devlet-ihale-2886-desktop/build/installer.nsh'
)

const TEMIN_PLATFORM_FA_PATH = path.join(
  REPO_ROOT,
  'apps/temin360-desktop/src/main/platform/fileAssociations.ts'
)
const IHALE_PLATFORM_FA_PATH = path.join(
  REPO_ROOT,
  'apps/ihale360-desktop/src/main/platform/fileAssociations.ts'
)
const DIHALE_PLATFORM_FA_PATH = path.join(
  REPO_ROOT,
  'apps/devlet-ihale-2886-desktop/src/main/platform/fileAssociations.ts'
)

const TEMIN_BUILDER_PATH = path.join(REPO_ROOT, 'apps/temin360-desktop/electron-builder.yml')
const IHALE_BUILDER_PATH = path.join(REPO_ROOT, 'apps/ihale360-desktop/electron-builder.yml')
const DIHALE_BUILDER_PATH = path.join(
  REPO_ROOT,
  'apps/devlet-ihale-2886-desktop/electron-builder.yml'
)

describe('Windows Installer, MIME Types & File Association Isolation Tests', () => {
  const teminNsh = fs.readFileSync(TEMIN_INSTALLER_PATH, 'utf-8')
  const ihaleNsh = fs.readFileSync(IHALE_INSTALLER_PATH, 'utf-8')
  const dihaleNsh = fs.readFileSync(DIHALE_INSTALLER_PATH, 'utf-8')

  const teminFa = fs.readFileSync(TEMIN_PLATFORM_FA_PATH, 'utf-8')
  const ihaleFa = fs.readFileSync(IHALE_PLATFORM_FA_PATH, 'utf-8')
  const dihaleFa = fs.readFileSync(DIHALE_PLATFORM_FA_PATH, 'utf-8')

  describe('1. İhale 360 Installer & Runtime İzolasyonu', () => {
    it('customInstall yalnızca İhale 360 uzantılarını, MIME türlerini ve ProgID tanımlarını içermeli', () => {
      expect(ihaleNsh).toContain('Ihale360.Document')
      expect(ihaleNsh).toContain('.ihale')
      expect(ihaleNsh).toContain('.ihale360')
      expect(ihaleNsh).toContain('IHALE360.exe')
      expect(ihaleNsh).toContain('application/x-ihale')
      expect(ihaleNsh).toContain('application/x-ihale360')
      expect(ihaleNsh).toContain('PerceivedType')

      // Temin veya 2886 ProgID / uzantılarını ASLA içermemeli
      expect(ihaleNsh).not.toContain('Temin360.Document')
      expect(ihaleNsh).not.toContain('DevletIhale2886.Document')
      expect(ihaleNsh).not.toContain('.temin')
      expect(ihaleNsh).not.toContain('.hkmp')
      expect(ihaleNsh).not.toContain('.ihale2886')
      expect(ihaleNsh).not.toContain('.dihale')
      expect(ihaleNsh).not.toContain('TEMIN360.exe')
      expect(ihaleNsh).not.toContain('DEVLETIHALE2886.exe')
    })

    it('customUnInstall diğer uygulamaların kayıtlarını silmemeli', () => {
      expect(ihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.temin"')
      expect(ihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.hkmp"')
      expect(ihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\Temin360.Document"')
      expect(ihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\DevletIhale2886.Document"')
    })

    it('İhale 360 runtime fileAssociations.ts kendi ProgID ve MIME türlerini izole kaydetmeli', () => {
      expect(ihaleFa).toContain('Ihale360.Document')
      expect(ihaleFa).toContain('IHALE360.exe')
      expect(ihaleFa).toContain('application/x-ihale')
      expect(ihaleFa).toContain('application/x-ihale360')
      expect(ihaleFa).not.toContain('Temin360.Document')
      expect(ihaleFa).not.toContain('TEMIN360.exe')
      expect(ihaleFa).not.toContain('DevletIhale2886.Document')
    })
  })

  describe('2. Devlet İhale 2886 Installer & Runtime İzolasyonu', () => {
    it('customInstall yalnızca Devlet İhale 2886 uzantılarını, MIME türlerini ve ProgID tanımlarını içermeli', () => {
      expect(dihaleNsh).toContain('DevletIhale2886.Document')
      expect(dihaleNsh).toContain('.ihale2886')
      expect(dihaleNsh).toContain('.dihale')
      expect(dihaleNsh).toContain('DEVLETIHALE2886.exe')
      expect(dihaleNsh).toContain('application/x-ihale2886')
      expect(dihaleNsh).toContain('application/x-dihale')
      expect(dihaleNsh).toContain('PerceivedType')

      // Temin veya İhale 360 ProgID / uzantılarını ASLA içermemeli
      expect(dihaleNsh).not.toContain('Temin360.Document')
      expect(dihaleNsh).not.toContain('Ihale360.Document')
      expect(dihaleNsh).not.toContain('.temin')
      expect(dihaleNsh).not.toContain('.hkmp')
      expect(dihaleNsh).not.toContain('.ihale"')
      expect(dihaleNsh).not.toContain('.ihale360')
      expect(dihaleNsh).not.toContain('TEMIN360.exe')
      expect(dihaleNsh).not.toContain('IHALE360.exe')
    })

    it('customUnInstall diğer uygulamaların kayıtlarını silmemeli', () => {
      expect(dihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.temin"')
      expect(dihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.ihale"')
      expect(dihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\Temin360.Document"')
      expect(dihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\Ihale360.Document"')
    })

    it('Devlet İhale 2886 runtime fileAssociations.ts kendi ProgID ve MIME türlerini izole kaydetmeli', () => {
      expect(dihaleFa).toContain('DevletIhale2886.Document')
      expect(dihaleFa).toContain('DEVLETIHALE2886.exe')
      expect(dihaleFa).toContain('application/x-ihale2886')
      expect(dihaleFa).toContain('application/x-dihale')
      expect(dihaleFa).not.toContain('Temin360.Document')
      expect(dihaleFa).not.toContain('TEMIN360.exe')
      expect(dihaleFa).not.toContain('Ihale360.Document')
    })
  })

  describe('3. Temin 360 Installer & Runtime İzolasyonu ve Geriye Dönük Uyumluluk', () => {
    it('customInstall yalnızca Temin 360 ve geriye dönük uzantıları içermeli', () => {
      expect(teminNsh).toContain('Temin360.Document')
      expect(teminNsh).toContain('.temin')
      expect(teminNsh).toContain('.hkmp')
      expect(teminNsh).toContain('.tmn360')
      expect(teminNsh).toContain('TEMIN360.exe')
      expect(teminNsh).toContain('application/x-temin')
      expect(teminNsh).toContain('application/x-hkmp')
      expect(teminNsh).toContain('application/x-temin360')
      expect(teminNsh).toContain('PerceivedType')

      // İhale 360 veya 2886 ProgID / uzantılarını ASLA içermemeli
      expect(teminNsh).not.toContain('Ihale360.Document')
      expect(teminNsh).not.toContain('DevletIhale2886.Document')
      expect(teminNsh).not.toContain('.ihale')
      expect(teminNsh).not.toContain('.ihale360')
      expect(teminNsh).not.toContain('.ihale2886')
      expect(teminNsh).not.toContain('.dihale')
      expect(teminNsh).not.toContain('IHALE360.exe')
      expect(teminNsh).not.toContain('DEVLETIHALE2886.exe')
    })

    it('customUnInstall diğer uygulamaların uzantılarını ASLA silmemeli', () => {
      expect(teminNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.ihale"')
      expect(teminNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.ihale360"')
      expect(teminNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.ihale2886"')
      expect(teminNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.dihale"')
    })

    it('Temin 360 runtime fileAssociations.ts kendi ProgID ve MIME türlerini izole kaydetmeli', () => {
      expect(teminFa).toContain('Temin360.Document')
      expect(teminFa).toContain('TEMIN360.exe')
      expect(teminFa).toContain('application/x-temin')
      expect(teminFa).toContain('application/x-hkmp')
      expect(teminFa).toContain('application/x-temin360')
      expect(teminFa).not.toContain('Ihale360.Document')
      expect(teminFa).not.toContain('DevletIhale2886.Document')
    })
  })

  describe('4. Windows Registry Güvenlik ve Uyumluluk Standartları', () => {
    it('Hiçbir installer betiği UserChoice anahtarını silmemeli (Windows 10/11 koruması)', () => {
      expect(teminNsh).not.toContain('UserChoice')
      expect(ihaleNsh).not.toContain('UserChoice')
      expect(dihaleNsh).not.toContain('UserChoice')
    })

    it('Her installer ve uninstaller SHChangeNotify ile Explorer önbelleğini yenilemeli', () => {
      expect(teminNsh).toContain('SHChangeNotify')
      expect(ihaleNsh).toContain('SHChangeNotify')
      expect(dihaleNsh).toContain('SHChangeNotify')
    })
  })

  describe('5. electron-builder.yml MIME Türleri ve Dosya İlişkilendirmeleri Doğrulaması', () => {
    it('her uygulamanın electron-builder yapılandırması doğru MIME türlerini içermeli', () => {
      const teminConfig = yaml.load(fs.readFileSync(TEMIN_BUILDER_PATH, 'utf-8')) as Record<
        string,
        unknown
      >
      const ihaleConfig = yaml.load(fs.readFileSync(IHALE_BUILDER_PATH, 'utf-8')) as Record<
        string,
        unknown
      >
      const dihaleConfig = yaml.load(fs.readFileSync(DIHALE_BUILDER_PATH, 'utf-8')) as Record<
        string,
        unknown
      >

      const teminAssocs = teminConfig.fileAssociations as Array<{ ext: string; mimeType: string }>
      expect(teminAssocs.find((a) => a.ext === 'temin')?.mimeType).toBe('application/x-temin')
      expect(teminAssocs.find((a) => a.ext === 'hkmp')?.mimeType).toBe('application/x-hkmp')
      expect(teminAssocs.find((a) => a.ext === 'tmn360')?.mimeType).toBe('application/x-temin360')

      const ihaleAssocs = ihaleConfig.fileAssociations as Array<{ ext: string; mimeType: string }>
      expect(ihaleAssocs.find((a) => a.ext === 'ihale')?.mimeType).toBe('application/x-ihale')
      expect(ihaleAssocs.find((a) => a.ext === 'ihale360')?.mimeType).toBe('application/x-ihale360')

      const dihaleAssocs = dihaleConfig.fileAssociations as Array<{ ext: string; mimeType: string }>
      expect(dihaleAssocs.find((a) => a.ext === 'ihale2886')?.mimeType).toBe('application/x-ihale2886')
      expect(dihaleAssocs.find((a) => a.ext === 'dihale')?.mimeType).toBe('application/x-dihale')
    })
  })
})
