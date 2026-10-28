import { describe, expect, it } from 'vitest'
import {
  generateSafeCleanupScript,
  planQuarantineTargets,
  quoteBashLiteral,
  quoteCmdLiteral,
  quotePowerShellLiteral
} from '../scriptGenerator.js'

describe('Güvenli Karantina & Betik Üretici Testleri (Bulgular #1 ve #3)', () => {
  it('1. Aynı adlı farklı klasörlerdeki kopyaları çakışmasız karantina hedeflerine eşler ve üzerine yazmayı engeller', () => {
    const sources = [
      'D:\\Proje_2025\\Ihale\\teknik_sartname.pdf',
      'D:\\Yedek_Eski\\Ihale\\teknik_sartname.pdf',
      'D:\\Proje_2025\\Ihale\\teknik_sartname.pdf'
    ]

    const planned = planQuarantineTargets(sources)
    expect(planned).toHaveLength(3)
    expect(planned[0].target).toBe(
      'D:\\_SILINECEK_KOPYALAR\\Proje_2025\\Ihale\\teknik_sartname.pdf'
    )
    expect(planned[1].target).toBe(
      'D:\\_SILINECEK_KOPYALAR\\Yedek_Eski\\Ihale\\teknik_sartname.pdf'
    )
    expect(planned[2].target).toBe(
      'D:\\_SILINECEK_KOPYALAR\\Proje_2025\\Ihale\\teknik_sartname_kopya_1.pdf'
    )

    const psScript = generateSafeCleanupScript('powershell', sources, true, '15 MB')
    expect(psScript).toContain('Get-UniqueTargetPath')
    expect(psScript).not.toContain('Move-Item -LiteralPath $f -Destination $destFolder -Force')
    expect(psScript).not.toContain('Move-Item -LiteralPath $src -Destination $finalDst -Force')

    const cmdScript = generateSafeCleanupScript('cmd', sources, true, '15 MB')
    expect(cmdScript).toContain('setlocal DisableDelayedExpansion')
    expect(cmdScript).toContain('move /-y')
    expect(cmdScript).not.toContain('move /y')

    const bashScript = generateSafeCleanupScript('bash', sources, true, '15 MB')
    expect(bashScript).toContain('move_quarantine_safe')
    expect(bashScript).toContain('mv -n --')
    expect(bashScript).not.toContain('mv -f')
  })

  it('2. PowerShell, CMD ve Bash için özel karakterli (tırnak, $, `, %, !) dosya yollarını güvenli kaçırır', () => {
    const trickyPath = `D:\\Arşiv '2026'\\$HOME $(calc) \`test\` %TEMP% !bang! & rapor.pdf`

    // PowerShell: tek tırnak içinde yalnızca ' -> '' yapılır; $, `, $(...) genişlemez
    const psQuoted = quotePowerShellLiteral(trickyPath)
    expect(psQuoted).toBe(
      `'D:\\Arşiv ''2026''\\$HOME $(calc) \`test\` %TEMP% !bang! & rapor.pdf'`
    )

    // Bash: tek tırnak içinde yalnızca ' -> '\'' yapılır
    const bashQuoted = quoteBashLiteral(trickyPath)
    expect(bashQuoted).toBe(
      `'D:\\Arşiv '\\''2026'\\''\\$HOME $(calc) \`test\` %TEMP% !bang! & rapor.pdf'`
    )

    // CMD: çift tırnak içinde % -> %% yapılır ve " temizlenir
    const cmdQuoted = quoteCmdLiteral(trickyPath)
    expect(cmdQuoted).toBe(
      `"D:\\Arşiv '2026'\\$HOME $(calc) \`test\` %%TEMP%% !bang! & rapor.pdf"`
    )
  })
})

