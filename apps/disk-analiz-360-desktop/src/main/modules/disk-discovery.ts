/**
 * <summary>
 * Disk Analiz 360 — Windows Sürücü ve Birim Keşif Modülü (disk-discovery).
 * C:, D:, E: gibi mevcut sürücüleri, kapasite/boş alan bilgilerini ve erişim durumlarını tespit eder.
 * </summary>
 */

import fs from 'fs'
import { execFileSync } from 'child_process'
import { DriveInfo } from '../../shared/types.js'

interface WindowsVolumeMeta {
  driveLetter: string
  label: string
  fileSystem: string
}

function queryWindowsVolumeMetadata(): Map<string, WindowsVolumeMeta> {
  const map = new Map<string, WindowsVolumeMeta>()
  if (process.platform !== 'win32') return map

  try {
    const psCommand =
      'Get-Volume | Where-Object { $_.DriveLetter -ne $null } | Select-Object DriveLetter,FileSystemLabel,FileSystem | ConvertTo-Json -Compress'
    const stdout = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', psCommand],
      {
        encoding: 'utf-8',
        timeout: 2500,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore']
      }
    ).trim()

    if (!stdout) return map
    const parsed = JSON.parse(stdout)
    const items = Array.isArray(parsed) ? parsed : [parsed]
    for (const item of items) {
      if (item && item.DriveLetter) {
        const code = `${String(item.DriveLetter).toUpperCase()}:`
        map.set(code, {
          driveLetter: code,
          label: item.FileSystemLabel ? String(item.FileSystemLabel).trim() : '',
          fileSystem: item.FileSystem ? String(item.FileSystem).trim() : 'NTFS'
        })
      }
    }
  } catch {
    // PowerShell kısıtlıysa statfsSync üzerinden devam edilir
  }

  return map
}

/**
 * <summary>
 * Sistemdeki kullanılabilir sürücüleri (C:\, D:\, E:\ vb.) gerçek dosya sistemi istatistikleriyle listeler.
 * Erişilemeyen sürücüler uygulamayı durdurmaz; accessible: false olarak raporlanır.
 * </summary>
 */
export function discoverSystemDrives(): DriveInfo[] {
  const drives: DriveInfo[] = []
  const systemDrive = (process.env.SystemDrive || 'C:').toUpperCase()
  const volumeMeta = queryWindowsVolumeMetadata()

  if (process.platform === 'win32') {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (const char of letters) {
      const driveCode = `${char}:`
      const mountPath = `${char}:\\`

      let exists = false
      try {
        fs.accessSync(mountPath, fs.constants.F_OK)
        exists = true
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException)?.code
        // EACCES veya EPERM ise sürücü var fakat kök erişimi kısıtlıdır
        if (code === 'EACCES' || code === 'EPERM' || code === 'EBUSY') {
          exists = true
        }
      }

      if (!exists && !volumeMeta.has(driveCode)) {
        continue
      }

      const meta = volumeMeta.get(driveCode)
      const isSystemDrive = driveCode === systemDrive
      const defaultLabel = isSystemDrive ? 'Sistem Diski (Windows)' : 'Yerel Disk'

      try {
        const statfs = fs.statfsSync(mountPath)
        const totalBytes = Math.max(0, Number(statfs.blocks) * Number(statfs.bsize))
        const freeBytes = Math.max(0, Number(statfs.bavail) * Number(statfs.bsize))
        const usedBytes = Math.max(0, totalBytes - freeBytes)
        const usagePercent =
          totalBytes > 0 ? Math.min(100, Math.round((usedBytes / totalBytes) * 1000) / 10) : 0

        drives.push({
          mountPath,
          driveCode,
          label: meta?.label || defaultLabel,
          fileSystem: meta?.fileSystem || 'NTFS',
          totalBytes,
          usedBytes,
          freeBytes,
          usagePercent,
          accessible: true,
          isSystemDrive
        })
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        drives.push({
          mountPath,
          driveCode,
          label: meta?.label || defaultLabel,
          fileSystem: meta?.fileSystem || 'Bilinmiyor',
          totalBytes: 0,
          usedBytes: 0,
          freeBytes: 0,
          usagePercent: 0,
          accessible: false,
          error: `Sürücü okunamadı: ${errMsg}`,
          isSystemDrive
        })
      }
    }
  } else {
    // Platform bağımsız yedek (Test ortamları için)
    try {
      const statfs = fs.statfsSync('/')
      const totalBytes = Number(statfs.blocks) * Number(statfs.bsize)
      const freeBytes = Number(statfs.bavail) * Number(statfs.bsize)
      const usedBytes = Math.max(0, totalBytes - freeBytes)
      drives.push({
        mountPath: '/',
        driveCode: '/',
        label: 'Kök Dizin',
        fileSystem: 'EXT4/APFS',
        totalBytes,
        usedBytes,
        freeBytes,
        usagePercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0,
        accessible: true,
        isSystemDrive: true
      })
    } catch {
      // ignore
    }
  }

  return drives
}

/**
 * <summary>
 * Belirli bir dizin veya sürücünün anlık boş alanını (bayt) ölçer.
 * Güvenli temizlik öncesi ve sonrası gerçek boş alan değişimini hesaplamak için kullanılır.
 * </summary>
 */
export function getPathFreeSpaceBytes(targetPath: string): number | undefined {
  try {
    const statfs = fs.statfsSync(targetPath)
    return Math.max(0, Number(statfs.bavail) * Number(statfs.bsize))
  } catch {
    try {
      const rootMatch = targetPath.match(/^[a-zA-Z]:\\/)
      if (rootMatch) {
        const statfs = fs.statfsSync(rootMatch[0])
        return Math.max(0, Number(statfs.bavail) * Number(statfs.bsize))
      }
    } catch {
      // ignore
    }
    return undefined
  }
}
