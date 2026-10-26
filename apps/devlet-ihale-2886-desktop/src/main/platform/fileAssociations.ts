import { app } from 'electron'
import { join, dirname } from 'path'
import { execFile } from 'child_process'
import fs from 'fs'

export function registerWindowsFileAssociations(): void {
  if (process.platform !== 'win32') return
  // Geliştirme (dev) ortamında process.execPath geçici dev electron.exe olduğu için
  // Windows kayıt defterini bozmasını önlüyoruz. Yalnızca paketlenmiş prod ortamda çalışır.
  if (!app.isPackaged) return
  try {
    const exePath = process.execPath

    // İkon dosyasını doğrudan resources/icon.ico olarak tespit et
    let iconPath = `${exePath},0`
    const p1 = join(process.resourcesPath, 'icon.ico')
    const p2 = join(process.resourcesPath, 'resources', 'icon.ico')
    const p3 = join(dirname(exePath), 'resources', 'icon.ico')
    const pDev = join(app.getAppPath(), 'resources', 'icon.ico')
    const pRoot = join(__dirname, '../../resources/icon.ico')

    if (fs.existsSync(p1)) iconPath = p1
    else if (fs.existsSync(p2)) iconPath = p2
    else if (fs.existsSync(p3)) iconPath = p3
    else if (fs.existsSync(pDev)) iconPath = pDev
    else if (fs.existsSync(pRoot)) iconPath = pRoot

    // 1. DevletIhale2886.Document ProgID Tanımı
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\DevletIhale2886.Document',
      '/ve',
      '/d',
      'Devlet İhale 2886 Proje Dosyası',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\DevletIhale2886.Document',
      '/v',
      'FriendlyTypeName',
      '/d',
      'Devlet İhale 2886 Proje Dosyası',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\DevletIhale2886.Document\\DefaultIcon',
      '/ve',
      '/d',
      iconPath,
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\DevletIhale2886.Document\\shell',
      '/ve',
      '/d',
      'open',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\DevletIhale2886.Document\\shell\\open',
      '/ve',
      '/d',
      'Devlet İhale 2886 ile Aç',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\DevletIhale2886.Document\\shell\\open\\command',
      '/ve',
      '/d',
      `"${exePath}" "%1"`,
      '/f'
    ])

    // 2. Applications Kaydı
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\Applications\\DEVLETIHALE2886.exe',
      '/v',
      'FriendlyAppName',
      '/d',
      'DEVLET İHALE 2886',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\Applications\\DEVLETIHALE2886.exe\\DefaultIcon',
      '/ve',
      '/d',
      iconPath,
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\Applications\\DEVLETIHALE2886.exe\\shell\\open\\command',
      '/ve',
      '/d',
      `"${exePath}" "%1"`,
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\Applications\\DEVLETIHALE2886.exe\\SupportedTypes',
      '/v',
      '.ihale2886',
      '/d',
      '',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\Applications\\DEVLETIHALE2886.exe\\SupportedTypes',
      '/v',
      '.dihale',
      '/d',
      '',
      '/f'
    ])

    // 3. .ihale2886 (Birincil Format)
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.ihale2886',
      '/ve',
      '/d',
      'DevletIhale2886.Document',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.ihale2886',
      '/v',
      'Content Type',
      '/d',
      'application/x-ihale2886',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.ihale2886',
      '/v',
      'PerceivedType',
      '/d',
      'document',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.ihale2886\\OpenWithProgids',
      '/v',
      'DevletIhale2886.Document',
      '/t',
      'REG_SZ',
      '/d',
      '',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.ihale2886\\DefaultIcon',
      '/ve',
      '/d',
      iconPath,
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.ihale2886\\OpenWithProgids',
      '/v',
      'DevletIhale2886.Document',
      '/t',
      'REG_NONE',
      '/d',
      '',
      '/f'
    ])

    // 4. .dihale (Alternatif Format)
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.dihale',
      '/v',
      'Content Type',
      '/d',
      'application/x-dihale',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.dihale',
      '/v',
      'PerceivedType',
      '/d',
      'document',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Classes\\.dihale\\OpenWithProgids',
      '/v',
      'DevletIhale2886.Document',
      '/t',
      'REG_SZ',
      '/d',
      '',
      '/f'
    ])
    execFile('reg.exe', [
      'add',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.dihale\\OpenWithProgids',
      '/v',
      'DevletIhale2886.Document',
      '/t',
      'REG_NONE',
      '/d',
      '',
      '/f'
    ])

    // 5. Windows Explorer İkon Önbelleğini Yenile (SHChangeNotify)
    const psCmd = `
      $code = '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int eventId, int flags, IntPtr item1, IntPtr item2);'
      Add-Type -MemberDefinition $code -Namespace Win32 -Name Shell
      [Win32.Shell]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
    `
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCmd],
      () => {}
    )
  } catch (regErr) {
    console.warn('Dosya ilişkilendirme kaydı hatası:', regErr)
  }
}
