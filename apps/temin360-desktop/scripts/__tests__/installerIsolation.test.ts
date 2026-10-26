import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Dosya apps/temin360-desktop/scripts/__tests__/ altında olduğundan REPO_ROOT 3 seviye yukarısıdır
const REPO_ROOT = path.resolve(__dirname, '../../../..')

const TEMIN_INSTALLER_PATH = path.join(REPO_ROOT, 'apps/temin360-desktop/build/installer.nsh')
const IHALE_INSTALLER_PATH = path.join(REPO_ROOT, 'apps/ihale360-desktop/build/installer.nsh')
const DIHALE_INSTALLER_PATH = path.join(
  REPO_ROOT,
  'apps/devlet-ihale-2886-desktop/build/installer.nsh'
)

describe('Windows Installer & File Association Isolation Tests', () => {
  const teminNsh = fs.readFileSync(TEMIN_INSTALLER_PATH, 'utf-8')
  const ihaleNsh = fs.readFileSync(IHALE_INSTALLER_PATH, 'utf-8')
  const dihaleNsh = fs.readFileSync(DIHALE_INSTALLER_PATH, 'utf-8')

  describe('1. İhale 360 Installer İzolasyonu', () => {
    it('customInstall yalnızca İhale 360 uzantılarını ve ProgID tanımlarını içermeli', () => {
      expect(ihaleNsh).toContain('Ihale360.Document')
      expect(ihaleNsh).toContain('.ihale')
      expect(ihaleNsh).toContain('.ihale360')
      expect(ihaleNsh).toContain('IHALE360.exe')

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
  })

  describe('2. Devlet İhale 2886 Installer İzolasyonu', () => {
    it('customInstall yalnızca Devlet İhale 2886 uzantılarını ve ProgID tanımlarını içermeli', () => {
      expect(dihaleNsh).toContain('DevletIhale2886.Document')
      expect(dihaleNsh).toContain('.ihale2886')
      expect(dihaleNsh).toContain('.dihale')
      expect(dihaleNsh).toContain('DEVLETIHALE2886.exe')

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
  })

  describe('3. Temin 360 Installer İzolasyonu ve Geriye Dönük Uyumluluk', () => {
    it('customInstall yalnızca Temin 360 ve geriye dönük uzantıları içermeli', () => {
      expect(teminNsh).toContain('Temin360.Document')
      expect(teminNsh).toContain('.temin')
      expect(teminNsh).toContain('.hkmp')
      expect(teminNsh).toContain('TEMIN360.exe')

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
})
