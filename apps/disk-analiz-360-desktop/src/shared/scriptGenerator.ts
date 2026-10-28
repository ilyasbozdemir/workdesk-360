/**
 * <summary>
 * Disk Analiz 360 & Arşiv 360 — Güvenli, Çakışmasız (No-Clobber) ve Özel Karakter Korumalı
 * Çoklu Platform Temizleme/Karantina Betik Üreticisi (PowerShell, CMD, Bash).
 *
 * Çözülen Kritik Bulgular:
 * 1. Karantina taşımasında dosya üzerine yazma riski:
 *    - Kaynak dosyanın göreli klasör yapısı (_SILINECEK_KOPYALAR altında) korunur.
 *    - Aynı partide veya önceki çalışmadan kalan aynı adlı hedefler için çalışma zamanında
 *      (_1, _2...) soneki üretilir; asla Move-Item -Force, move /y veya mv -f kullanılmaz.
 * 2. Dosya yolu kaçış güvenliği (Path Escaping):
 *    - PowerShell: Tek tırnaklı literal ('...'), tek tırnaklar '' olarak kaçırılır ($ ve ` genişlemez).
 *    - Bash: POSIX tek tırnaklı literal ('...'), tek tırnaklar '\'' olarak kaçırılır ($, `, !, " genişlemez).
 *    - CMD: setlocal DisableDelayedExpansion + % -> %% kaçışı ve tırnak/satır sonu arındırması.
 * </summary>
 */

export type ScriptPlatform = 'powershell' | 'cmd' | 'bash'

/**
 * PowerShell için 100% literal tek tırnaklı dizge üretir.
 * PowerShell'de '...' içerisinde $, `, ", $(...) asla çalıştırılmaz; yalnızca ' -> '' yapılır.
 */
export function quotePowerShellLiteral(rawPath: string): string {
  const clean = String(rawPath || '').replace(/[\r\n\0]/g, '')
  return `'${clean.replace(/'/g, "''")}'`
}

/**
 * Bash / POSIX kabuğu için 100% literal tek tırnaklı dizge üretir.
 * Tek tırnak içinde $, `, ", \, ! asla genişlemez; yalnızca ' -> '\'' yapılır.
 */
export function quoteBashLiteral(rawPath: string): string {
  const clean = String(rawPath || '').replace(/[\r\n\0]/g, '')
  return `'${clean.replace(/'/g, "'\\''")}'`
}

/**
 * Windows CMD (.bat) için çift tırnaklı güvenli yol dizgesi üretir.
 * DisableDelayedExpansion modunda çift tırnak içinde yalnızca % genişler (% -> %%).
 * Güvenlik için " ve satır sonu karakterleri temizlenir.
 */
export function quoteCmdLiteral(rawPath: string): string {
  const clean = String(rawPath || '')
    .replace(/[\r\n\0"]/g, '')
    .replace(/%/g, '%%')
  return `"${clean}"`
}

/**
 * Bir kaynak dosya yolu için çakışmasız karantina hedef yolu planlar.
 * Kaynak klasör hiyerarşisini korur ve aynı listede çakışma olursa _1, _2 ekler.
 */
export function planQuarantineTargets(
  sourcePaths: string[],
  quarantineFolderName = '_SILINECEK_KOPYALAR'
): Array<{ source: string; target: string; posixSource: string; posixTarget: string }> {
  const usedTargets = new Set<string>()
  const results: Array<{
    source: string
    target: string
    posixSource: string
    posixTarget: string
  }> = []

  for (const rawSrc of sourcePaths) {
    const winSrc = String(rawSrc || '').replace(/\//g, '\\')
    const driveMatch = winSrc.match(/^([a-zA-Z]:)\\?(.*)$/)
    const drive = driveMatch ? driveMatch[1].toUpperCase() : 'C:'
    const relPath = driveMatch ? driveMatch[2].replace(/^\\+/, '') : winSrc.replace(/^\\+/, '')

    const lastSlash = relPath.lastIndexOf('\\')
    const relDir = lastSlash >= 0 ? relPath.slice(0, lastSlash) : ''
    const fileName = lastSlash >= 0 ? relPath.slice(lastSlash + 1) : relPath || 'dosya'

    const dotIdx = fileName.lastIndexOf('.')
    const stem = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName
    const ext = dotIdx > 0 ? fileName.slice(dotIdx) : ''

    const baseTargetDir = relDir
      ? `${drive}\\${quarantineFolderName}\\${relDir}`
      : `${drive}\\${quarantineFolderName}`

    let candidate = `${baseTargetDir}\\${fileName}`
    let counter = 1
    while (usedTargets.has(candidate.toLowerCase())) {
      candidate = `${baseTargetDir}\\${stem}_kopya_${counter}${ext}`
      counter++
    }
    usedTargets.add(candidate.toLowerCase())

    const posixSource = rawSrc.replace(/\\/g, '/')
    const posixRel = relPath.replace(/\\/g, '/')
    let posixCandidate = `./${quarantineFolderName}/${posixRel}`
    if (counter > 1) {
      const posixDir = relDir ? `./${quarantineFolderName}/${relDir.replace(/\\/g, '/')}` : `./${quarantineFolderName}`
      posixCandidate = `${posixDir}/${stem}_kopya_${counter - 1}${ext}`
    }

    results.push({
      source: winSrc,
      target: candidate,
      posixSource,
      posixTarget: posixCandidate
    })
  }

  return results
}

export function generateSafeCleanupScript(
  platform: ScriptPlatform,
  paths: string[],
  isSafeQuarantine: boolean,
  selectedSizeFormatted = '0 B'
): string {
  if (!paths || paths.length === 0) {
    return "# Henüz silinecek dosya seçilmedi.\n# Lütfen listeden dosyaları işaretleyin veya 'İlkini Tut, Kalanları Seç' butonuna tıklayın."
  }

  const now = new Date().toLocaleString('tr-TR')
  const planned = planQuarantineTargets(paths, '_SILINECEK_KOPYALAR')

  if (platform === 'powershell') {
    if (isSafeQuarantine) {
      const pairLines = planned
        .map(
          (item) =>
            `    @{ Src = ${quotePowerShellLiteral(item.source)}; Dst = ${quotePowerShellLiteral(item.target)} }`
        )
        .join(',\n')

      return (
        `# ========================================================\n` +
        `# Disk Analiz 360 & Arşiv 360 - Çakışmasız Güvenli Karantina Betiği (PowerShell)\n` +
        `# Tarih: ${now} | Dosya: ${planned.length} adet (${selectedSizeFormatted})\n` +
        `# Not: Üzerine yazma (overwrite) engellenmiştir; çakışma durumunda otomatik sonek eklenir.\n` +
        `# ========================================================\n` +
        `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n` +
        `$ErrorActionPreference = 'Stop'\n\n` +
        `function Get-UniqueTargetPath([string]$PreferredPath) {\n` +
        `    if (-not (Test-Path -LiteralPath $PreferredPath)) { return $PreferredPath }\n` +
        `    $dir = Split-Path -Parent $PreferredPath\n` +
        `    $leaf = Split-Path -Leaf $PreferredPath\n` +
        `    $stem = [System.IO.Path]::GetFileNameWithoutExtension($leaf)\n` +
        `    $ext  = [System.IO.Path]::GetExtension($leaf)\n` +
        `    $idx  = 1\n` +
        `    while ($true) {\n` +
        `        $cand = Join-Path $dir ("{0}_karantina_{1}{2}" -f $stem, $idx, $ext)\n` +
        `        if (-not (Test-Path -LiteralPath $cand)) { return $cand }\n` +
        `        $idx++\n` +
        `    }\n` +
        `}\n\n` +
        `$items = @(\n${pairLines}\n)\n\n` +
        `$success = 0; $fail = 0\n` +
        `foreach ($it in $items) {\n` +
        `    $src = $it.Src\n` +
        `    if (Test-Path -LiteralPath $src) {\n` +
        `        try {\n` +
        `            $finalDst = Get-UniqueTargetPath $it.Dst\n` +
        `            $parentDir = Split-Path -Parent $finalDst\n` +
        `            if (-not (Test-Path -LiteralPath $parentDir)) {\n` +
        `                New-Item -ItemType Directory -Path $parentDir -Force | Out-Null\n` +
        `            }\n` +
        `            Move-Item -LiteralPath $src -Destination $finalDst -ErrorAction Stop\n` +
        `            Write-Host "  [✓ Taşındı] $src -> $finalDst" -ForegroundColor Green\n` +
        `            $success++\n` +
        `        } catch {\n` +
        `            Write-Host "  [X Hata] $src ($($_.Exception.Message))" -ForegroundColor Red\n` +
        `            $fail++\n` +
        `        }\n` +
        `    } else {\n` +
        `        Write-Host "  [-] Bulunamadı: $src" -ForegroundColor Yellow\n` +
        `    }\n` +
        `}\n` +
        `Write-Host "\\nİşlem Tamamlandı! Başarılı: $success | Hata: $fail" -ForegroundColor Cyan\n`
      )
    }

    const fileLines = planned.map((item) => `    ${quotePowerShellLiteral(item.source)}`).join(',\n')
    return (
      `# ========================================================\n` +
      `# Disk Analiz 360 & Arşiv 360 - Kalıcı Kopya Silme Betiği (PowerShell)\n` +
      `# Tarih: ${now} | Silinecek Dosya: ${planned.length} adet (${selectedSizeFormatted})\n` +
      `# ========================================================\n` +
      `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n` +
      `$confirm = Read-Host '${planned.length} adet kopya dosya KALICI OLARAK silinecektir. Devam etmek için EVET yazın'\n` +
      `if ($confirm -ne 'EVET') { Write-Host 'İşlem iptal edildi.' -ForegroundColor Yellow; exit }\n\n` +
      `$files = @(\n${fileLines}\n)\n` +
      `foreach ($f in $files) {\n` +
      `    if (Test-Path -LiteralPath $f) {\n` +
      `        Remove-Item -LiteralPath $f -ErrorAction Continue\n` +
      `    }\n` +
      `}\n`
    )
  }

  if (platform === 'cmd') {
    const lines = [
      `@echo off`,
      `setlocal DisableDelayedExpansion`,
      `chcp 65001 > nul`,
      `echo ========================================================`,
      `echo Disk Analiz 360 - ${planned.length} dosya (${selectedSizeFormatted})`,
      `echo ========================================================`
    ]
    if (isSafeQuarantine) {
      for (const item of planned) {
        const lastSlash = item.target.lastIndexOf('\\')
        const targetDir = lastSlash > 0 ? item.target.slice(0, lastSlash) : 'C:\\_SILINECEK_KOPYALAR'
        lines.push(`if not exist ${quoteCmdLiteral(targetDir)} mkdir ${quoteCmdLiteral(targetDir)} >nul 2>&1`)
        lines.push(
          `if exist ${quoteCmdLiteral(item.target)} (echo [ATLANDI - HEDEF MEVCUT] ${quoteCmdLiteral(item.target)}) else (move /-y ${quoteCmdLiteral(item.source)} ${quoteCmdLiteral(item.target)} >nul 2>&1 && echo [OK] ${quoteCmdLiteral(item.source)} || echo [HATA] ${quoteCmdLiteral(item.source)})`
        )
      }
    } else {
      lines.push(`set /p onay="Kalıcı silmeyi onaylıyor musunuz? (E/H): "`)
      lines.push(`if /i not "%onay%"=="E" exit /b`)
      for (const item of planned) {
        lines.push(`del /f /q ${quoteCmdLiteral(item.source)}`)
      }
    }
    lines.push(`endlocal`, `pause`)
    return lines.join('\n')
  }

  // Bash (.sh)
  const lines = [
    `#!/usr/bin/env bash`,
    `# ========================================================`,
    `# Disk Analiz 360 & Arşiv 360 - Çakışmasız Kopya Yönetimi (Bash)`,
    `# Dosya Sayısı: ${planned.length} adet (${selectedSizeFormatted})`,
    `# ========================================================`,
    `set -euo pipefail`
  ]

  if (isSafeQuarantine) {
    lines.push(
      `move_quarantine_safe() {`,
      `  local src="$1"`,
      `  local dst="$2"`,
      `  if [ ! -e "$src" ]; then`,
      `    echo "  [-] Bulunamadı: $src"`,
      `    return 0`,
      `  fi`,
      `  local dir`,
      `  dir="$(dirname -- "$dst")"`,
      `  mkdir -p -- "$dir"`,
      `  local final_dst="$dst"`,
      `  local idx=1`,
      `  while [ -e "$final_dst" ]; do`,
      `    final_dst="\${dst}_karantina_\${idx}"`,
      `    idx=$((idx + 1))`,
      `  done`,
      `  mv -n -- "$src" "$final_dst"`,
      `  echo "  [OK] $src -> $final_dst"`,
      `}`
    )
    for (const item of planned) {
      lines.push(
        `move_quarantine_safe ${quoteBashLiteral(item.posixSource)} ${quoteBashLiteral(item.posixTarget)}`
      )
    }
  } else {
    lines.push(
      `read -r -p "Dosyaları kalıcı olarak silmek istiyor musunuz? (e/h): " onay`,
      `if [[ "$onay" != "e" && "$onay" != "E" ]]; then echo "İptal edildi."; exit 0; fi`
    )
    for (const item of planned) {
      lines.push(`rm -f -- ${quoteBashLiteral(item.posixSource)}`)
    }
  }
  lines.push(`echo "İşlem tamamlandı!"`)
  return lines.join('\n')
}

