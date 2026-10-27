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

    // Güvenli kayıt defteri komut çalıştırıcısı (hata fırlatmaz, sessizce loglar)
    const runReg = (args: string[]): void => {
      try {
        execFile('reg.exe', args, (err) => {
          if (err) {
            console.warn(`[FileAssoc] reg.exe ${args[1] || ''} uyarısı:`, err.message)
          }
        })
      } catch (err: unknown) {
        console.warn('[FileAssoc] reg.exe çalıştırma hatası:', err)
      }
    }

    // 1. Temin360.Document ProgID Tanımı
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Temin360.Document',
      '/ve',
      '/d',
      'TEMİN 360 Proje Dosyası',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Temin360.Document',
      '/v',
      'FriendlyTypeName',
      '/d',
      'TEMİN 360 Proje Dosyası',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Temin360.Document\\DefaultIcon',
      '/ve',
      '/d',
      iconPath,
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Temin360.Document\\shell',
      '/ve',
      '/d',
      'open',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Temin360.Document\\shell\\open',
      '/ve',
      '/d',
      'TEMİN 360 ile Aç',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Temin360.Document\\shell\\open\\command',
      '/ve',
      '/d',
      `"${exePath}" "%1"`,
      '/f'
    ])

    // 2. Applications Kaydı
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Applications\\TEMIN360.exe',
      '/v',
      'FriendlyAppName',
      '/d',
      'TEMİN 360',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Applications\\TEMIN360.exe\\DefaultIcon',
      '/ve',
      '/d',
      iconPath,
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Applications\\TEMIN360.exe\\shell\\open\\command',
      '/ve',
      '/d',
      `"${exePath}" "%1"`,
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Applications\\TEMIN360.exe\\SupportedTypes',
      '/v',
      '.temin',
      '/d',
      '',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Applications\\TEMIN360.exe\\SupportedTypes',
      '/v',
      '.hkmp',
      '/d',
      '',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\Applications\\TEMIN360.exe\\SupportedTypes',
      '/v',
      '.tmn360',
      '/d',
      '',
      '/f'
    ])

    // 3. .temin (Birincil Format)
    runReg([
      'add',
      'HKCU\\Software\\Classes\\.temin',
      '/ve',
      '/d',
      'Temin360.Document',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\.temin',
      '/v',
      'Content Type',
      '/d',
      'application/x-temin',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\.temin',
      '/v',
      'PerceivedType',
      '/d',
      'document',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\.temin\\OpenWithProgids',
      '/v',
      'Temin360.Document',
      '/t',
      'REG_SZ',
      '/d',
      '',
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Classes\\.temin\\DefaultIcon',
      '/ve',
      '/d',
      iconPath,
      '/f'
    ])
    runReg([
      'add',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.temin\\OpenWithProgids',
      '/v',
      'Temin360.Document',
      '/t',
      'REG_NONE',
      '/d',
      '',
      '/f'
    ])

    // 4. .hkmp ve .tmn360 (Geriye Dönük Uyumluluk)
    for (const legacy of [
      { ext: 'hkmp', mime: 'application/x-hkmp' },
      { ext: 'tmn360', mime: 'application/x-temin360' }
    ]) {
      runReg([
        'add',
        `HKCU\\Software\\Classes\\.${legacy.ext}`,
        '/v',
        'Content Type',
        '/d',
        legacy.mime,
        '/f'
      ])
      runReg([
        'add',
        `HKCU\\Software\\Classes\\.${legacy.ext}`,
        '/v',
        'PerceivedType',
        '/d',
        'document',
        '/f'
      ])
      runReg([
        'add',
        `HKCU\\Software\\Classes\\.${legacy.ext}\\OpenWithProgids`,
        '/v',
        'Temin360.Document',
        '/t',
        'REG_SZ',
        '/d',
        '',
        '/f'
      ])
      runReg([
        'add',
        `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.${legacy.ext}\\OpenWithProgids`,
        '/v',
        'Temin360.Document',
        '/t',
        'REG_NONE',
        '/d',
        '',
        '/f'
      ])
    }

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
