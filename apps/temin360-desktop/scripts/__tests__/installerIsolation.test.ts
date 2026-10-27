// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

// Dosya apps/temin360-desktop/scripts/__tests__/ altında olduğundan REPO_ROOT 3 seviye yukarısıdır
const REPO_ROOT = path.resolve(__dirname, '../../../..')

const TEMIN_INSTALLER_PATH = path.join(REPO_ROOT, 'apps/temin360-desktop/build/installer.nsh')
const IHALE_INSTALLER_PATH = path.join(REPO_ROOT, 'apps/ihale360-desktop/build/installer.nsh')

const TEMIN_PLATFORM_FA_PATH = path.join(
  REPO_ROOT,
  'apps/temin360-desktop/src/main/platform/fileAssociations.ts'
)
const IHALE_PLATFORM_FA_PATH = path.join(
  REPO_ROOT,
  'apps/ihale360-desktop/src/main/platform/fileAssociations.ts'
)

const TEMIN_BUILDER_PATH = path.join(REPO_ROOT, 'apps/temin360-desktop/electron-builder.yml')
const IHALE_BUILDER_PATH = path.join(REPO_ROOT, 'apps/ihale360-desktop/electron-builder.yml')
const FLOWDESK_BUILDER_PATH = path.join(REPO_ROOT, 'apps/flowdesk-desktop/electron-builder.yml')

describe('Windows Installer, MIME Types & File Association Isolation Tests', () => {
  const teminNsh = fs.readFileSync(TEMIN_INSTALLER_PATH, 'utf-8')
  const ihaleNsh = fs.readFileSync(IHALE_INSTALLER_PATH, 'utf-8')

  const teminFa = fs.readFileSync(TEMIN_PLATFORM_FA_PATH, 'utf-8')
  const ihaleFa = fs.readFileSync(IHALE_PLATFORM_FA_PATH, 'utf-8')

  describe('1. İhale 360 Installer & Runtime İzolasyonu', () => {
    it('customInstall yalnızca İhale 360 uzantılarını, MIME türlerini ve ProgID tanımlarını içermeli', () => {
      expect(ihaleNsh).toContain('Ihale360.Document')
      expect(ihaleNsh).toContain('.ihale')
      expect(ihaleNsh).toContain('.ihale360')
      expect(ihaleNsh).toContain('IHALE360.exe')
      expect(ihaleNsh).toContain('application/x-ihale')
      expect(ihaleNsh).toContain('application/x-ihale360')
      expect(ihaleNsh).toContain('PerceivedType')

      // Temin ProgID / uzantılarını ASLA içermemeli
      expect(ihaleNsh).not.toContain('Temin360.Document')
      expect(ihaleNsh).not.toContain('.temin')
      expect(ihaleNsh).not.toContain('.hkmp')
      expect(ihaleNsh).not.toContain('TEMIN360.exe')
    })

    it('customUnInstall diğer uygulamaların kayıtlarını silmemeli', () => {
      expect(ihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.temin"')
      expect(ihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.hkmp"')
      expect(ihaleNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\Temin360.Document"')
    })

    it('İhale 360 runtime fileAssociations.ts kendi ProgID ve MIME türlerini izole kaydetmeli', () => {
      expect(ihaleFa).toContain('Ihale360.Document')
      expect(ihaleFa).toContain('IHALE360.exe')
      expect(ihaleFa).toContain('application/x-ihale')
      expect(ihaleFa).toContain('application/x-ihale360')
      expect(ihaleFa).not.toContain('Temin360.Document')
      expect(ihaleFa).not.toContain('TEMIN360.exe')
    })
  })

  describe('2. FlowDesk 360 Yapılandırma ve İzolasyon Doğrulaması', () => {
    it('FlowDesk electron-builder.yml izole appId ve dosya uzantılarına sahip olmalı', () => {
      const flowConfig = yaml.load(fs.readFileSync(FLOWDESK_BUILDER_PATH, 'utf-8')) as Record<string, any>
      expect(flowConfig.appId).toBe('dev.ilyasbozdemir.flowdesk360')
      expect(flowConfig.productName).toBe('FLOWDESK 360')
      expect(flowConfig.win?.executableName).toBe('FlowDesk360')
      expect(flowConfig.publish?.updaterCacheDirName).toBe('flowdesk-updater')

      const assocs = flowConfig.fileAssociations as Array<{ ext: string; mimeType: string }>
      expect(assocs.find((a) => a.ext === 'flowdesk')?.mimeType).toBe('application/x-flowdesk')
      expect(assocs.find((a) => a.ext === 'flow')?.mimeType).toBe('application/x-flowdesk-template')

      // Temin veya İhale formatlarını içermemeli
      expect(assocs.some((a) => a.ext === 'temin')).toBe(false)
      expect(assocs.some((a) => a.ext === 'ihale')).toBe(false)
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

      // İhale 360 veya FlowDesk ProgID / uzantılarını ASLA içermemeli
      expect(teminNsh).not.toContain('Ihale360.Document')
      expect(teminNsh).not.toContain('.ihale')
      expect(teminNsh).not.toContain('.ihale360')
      expect(teminNsh).not.toContain('IHALE360.exe')
      expect(teminNsh).not.toContain('.flowdesk')
    })

    it('customUnInstall diğer uygulamaların uzantılarını ASLA silmemeli', () => {
      expect(teminNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.ihale"')
      expect(teminNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.ihale360"')
      expect(teminNsh).not.toContain('DeleteRegKey HKCU "Software\\Classes\\.flowdesk"')
    })

    it('Temin 360 runtime fileAssociations.ts kendi ProgID ve MIME türlerini izole kaydetmeli', () => {
      expect(teminFa).toContain('Temin360.Document')
      expect(teminFa).toContain('TEMIN360.exe')
      expect(teminFa).toContain('application/x-temin')
      expect(teminFa).toContain('application/x-hkmp')
      expect(teminFa).toContain('application/x-temin360')
      expect(teminFa).not.toContain('Ihale360.Document')
    })
  })

  describe('4. Windows Registry Güvenlik ve Uyumluluk Standartları', () => {
    it('Hiçbir installer betiği UserChoice anahtarını silmemeli (Windows 10/11 koruması)', () => {
      expect(teminNsh).not.toContain('UserChoice')
      expect(ihaleNsh).not.toContain('UserChoice')
    })

    it('Her installer ve uninstaller SHChangeNotify ile Explorer önbelleğini yenilemeli', () => {
      expect(teminNsh).toContain('SHChangeNotify')
      expect(ihaleNsh).toContain('SHChangeNotify')
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
      const flowConfig = yaml.load(fs.readFileSync(FLOWDESK_BUILDER_PATH, 'utf-8')) as Record<
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

      const flowAssocs = flowConfig.fileAssociations as Array<{ ext: string; mimeType: string }>
      expect(flowAssocs.find((a) => a.ext === 'flowdesk')?.mimeType).toBe('application/x-flowdesk')
      expect(flowAssocs.find((a) => a.ext === 'flow')?.mimeType).toBe('application/x-flowdesk-template')
    })
  })

  describe('6. Uygulama Kimlikleri, Çalıştırılabilir Dosyalar ve Paket İzolasyonu', () => {
    const teminConfig = yaml.load(fs.readFileSync(TEMIN_BUILDER_PATH, 'utf-8')) as any
    const ihaleConfig = yaml.load(fs.readFileSync(IHALE_BUILDER_PATH, 'utf-8')) as any
    const flowConfig = yaml.load(fs.readFileSync(FLOWDESK_BUILDER_PATH, 'utf-8')) as any

    it('her uygulamanın appId değeri benzersiz ve doğru tanımlanmış olmalı', () => {
      expect(teminConfig.appId).toBe('dev.ilyasbozdemir.temin360')
      expect(ihaleConfig.appId).toBe('dev.ilyasbozdemir.ihale360')
      expect(flowConfig.appId).toBe('dev.ilyasbozdemir.flowdesk360')

      const appIds = new Set([teminConfig.appId, ihaleConfig.appId, flowConfig.appId])
      expect(appIds.size).toBe(3)
    })

    it('her uygulamanın executableName değeri benzersiz olmalı', () => {
      expect(teminConfig.win.executableName).toBe('TEMIN360')
      expect(ihaleConfig.win.executableName).toBe('IHALE360')
      expect(flowConfig.win.executableName).toBe('FlowDesk360')

      const exeNames = new Set([
        teminConfig.win.executableName,
        ihaleConfig.win.executableName,
        flowConfig.win.executableName
      ])
      expect(exeNames.size).toBe(3)
    })

    it('İhale 360 ve FlowDesk klasörlerinde yanlışlıkla kopyalanmış electron-builder.dt.yml bulunmamalı', () => {
      const ihaleDtPath = path.join(REPO_ROOT, 'apps/ihale360-desktop/electron-builder.dt.yml')
      const flowDtPath = path.join(REPO_ROOT, 'apps/flowdesk-desktop/electron-builder.dt.yml')

      expect(fs.existsSync(ihaleDtPath)).toBe(false)
      expect(fs.existsSync(flowDtPath)).toBe(false)
    })

    it('her uygulamanın updaterCacheDirName değeri izole olmalı ve çakışmamalı', () => {
      expect(teminConfig.publish.updaterCacheDirName).toBe('temin360-updater')
      expect(ihaleConfig.publish.updaterCacheDirName).toBe('ihale360-updater')
      expect(flowConfig.publish.updaterCacheDirName).toBe('flowdesk-updater')

      const cacheDirs = new Set([
        teminConfig.publish.updaterCacheDirName,
        ihaleConfig.publish.updaterCacheDirName,
        flowConfig.publish.updaterCacheDirName
      ])
      expect(cacheDirs.size).toBe(3)
    })

    it('.hkmp formatı TEMİN 360 için açıklayıcı eski sürüm (HakimPro) olarak etiketlenmeli', () => {
      const hkmpTemin = (teminConfig.fileAssociations as any[]).find((a) => a.ext === 'hkmp')
      expect(hkmpTemin).toBeDefined()
      expect(hkmpTemin.name).toContain('TEMİN 360 Eski Sürüm')
      expect(hkmpTemin.description).toContain('TEMİN 360 ile Açılabilen')
    })
  })
})
