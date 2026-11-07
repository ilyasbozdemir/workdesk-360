import fs from 'fs'
import path from 'path'
import { rootDir, parseSourceFile, traverseAst, getTypeScript } from './tsLoader.js'

/**
 * Electron IPC Güvenlik ve Yetkilendirme Analizörü
 * - Preload contextBridge izolasyonunu ve kanal whitelist kontrolünü inceler
 * - Raw `electronAPI` maruziyetini (exposure) tespit eder
 * - Main IPC işleyicilerinde girdi doğrulamasını (validation), SQL guard ve parameterized sorgu disiplinini kontrol eder
 * - Yalnızca `any` kullanımını güvenlik açığı saymaz; gerçek çalıştırma yollarını denetler
 */
export function analyzeIpcSecurity(files) {
  const ts = getTypeScript()
  const findings = []

  const preloadFiles = files.filter(f => f.includes('preload') && (f.endsWith('index.ts') || f.endsWith('index.js')))
  const mainIpcFiles = files.filter(f => f.startsWith('apps/') && f.includes('src/main/') && (f.endsWith('.ts') || f.endsWith('.js')))

  // 1. Preload Gatekeeper ve Raw electronAPI İncelemesi
  preloadFiles.forEach(pf => {
    const fullPath = path.join(rootDir, pf)
    if (!fs.existsSync(fullPath)) return
    const content = fs.readFileSync(fullPath, 'utf-8')
    let sf
    try {
      sf = parseSourceFile(pf, content)
    } catch {
      return
    }

    const appName = pf.split('/')[1]

    // contextBridge.exposeInMainWorld('electron', electronAPI) kontrolü
    const exposesRawElectronApi = /exposeInMainWorld\(\s*['"]electron['"]\s*,\s*electronAPI\s*\)/.test(content)
    if (exposesRawElectronApi) {
      const lineNo = content.substring(0, content.indexOf('exposeInMainWorld')).split('\n').length
      findings.push({
        id: `SEC-PRELOAD-RAW-EXPOSURE-${appName.toUpperCase()}`,
        priority: 'P0',
        file: `${pf}:L${lineNo}`,
        evidence: `contextBridge.exposeInMainWorld('electron', electronAPI) exposes unrestricted ipcRenderer methods (send, on, invoke) to the renderer process.`,
        affectedModules: [appName],
        confidence: 'YÜKSEK',
        recommendedSolution: 'Doğrudan ham electronAPI maruziyeti kaldırılmalı; izin verilen IPC kanalları (allowlist) üzerinden filtrelenmiş bir proxy veya yalnızca spesifik API metotları sunulmalıdır.',
        requiredRegressionTests: `pnpm --filter ${appName} test`
      })
    }

    // temin360-desktop preload'daki send/on açığı kontrolü
    if (appName === 'temin360-desktop') {
      const exposesUncheckedSend = /ipcRenderer:\s*\{\s*\.\.\.electronAPI\.ipcRenderer/.test(content)
      if (exposesUncheckedSend) {
        findings.push({
          id: 'SEC-PRELOAD-PARTIAL-GATEKEEPER-TEMIN',
          priority: 'P1',
          file: `${pf}:L223`,
          evidence: `secureElectronAPI overrides 'invoke' with allowedChannels, but inherits unfiltered 'send' and 'on' from ...electronAPI.ipcRenderer`,
          affectedModules: ['temin360-desktop/preload'],
          confidence: 'YÜKSEK',
          recommendedSolution: `'send' ve 'on' metotları da allowedChannels kontrolünden geçirilmeli veya renderer tarafına yalnızca invoke protokolü açılmalıdır.`,
          requiredRegressionTests: 'apps/temin360-desktop/src/preload/__tests__/preloadSecurity.test.ts'
        })
      }
    }
  })

  // 2. Main IPC Handlers: SQL String Interpolation & Guard Kontrolleri
  mainIpcFiles.forEach(mf => {
    const fullPath = path.join(rootDir, mf)
    if (!fs.existsSync(fullPath)) return
    const content = fs.readFileSync(fullPath, 'utf-8')

    // String interpolation inside db.prepare(`SELECT ... ${foo}`)
    const rawSqlInterpolationRegex = /db\.prepare\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/g
    let match
    while ((match = rawSqlInterpolationRegex.exec(content)) !== null) {
      const lineNo = content.substring(0, match.index).split('\n').length
      findings.push({
        id: `SEC-SQLI-INTERPOLATION-${findings.length + 1}`,
        priority: 'P0',
        file: `${mf}:L${lineNo}`,
        evidence: `Raw template string interpolation inside db.prepare(): ${match[0].slice(0, 80)}...`,
        affectedModules: [mf.split('/')[1]],
        confidence: 'YÜKSEK',
        recommendedSolution: 'SQL sorgularına değişkenler şablon dizgisi (${...}) ile eklenmemeli; parametrik (?) sorgular ve better-sqlite3 prepare().run(...params) kullanılmalıdır.',
        requiredRegressionTests: 'pnpm test'
      })
    }

    // Direct IPC handler missing validation on id / payload
    const unvalidatedHandlerRegex = /ipcMain\.handle\(\s*['"]([a-zA-Z0-9_:-]+)['"]\s*,\s*async\s*\(_(?:,\s*([a-zA-Z0-9_$]+))?\)\s*=>\s*\{/g
    let handlerMatch
    while ((handlerMatch = unvalidatedHandlerRegex.exec(content)) !== null) {
      const channel = handlerMatch[1]
      const paramName = handlerMatch[2]
      if (channel.startsWith('db:') || channel.startsWith('workspace:') || channel.startsWith('belge:')) {
        // Handler gövdesinde guard veya tip denetimi var mı bak
        const bodyStart = handlerMatch.index + handlerMatch[0].length
        const bodySnippet = content.slice(bodyStart, bodyStart + 400)
        const hasSqlGuard = bodySnippet.includes('validateSqlQuery') || bodySnippet.includes('sqlGuard') || bodySnippet.includes('zod') || bodySnippet.includes('Schema')
        if (channel === 'db:query' || channel === 'db:execute') {
          if (!hasSqlGuard) {
            const lineNo = content.substring(0, handlerMatch.index).split('\n').length
            findings.push({
              id: `SEC-IPC-SQLGUARD-MISSING-${channel.replace(':', '-')}`,
              priority: 'P0',
              file: `${mf}:L${lineNo}`,
              evidence: `IPC handler '${channel}' directly handles SQL without validateSqlQuery() check`,
              affectedModules: [mf.split('/')[1]],
              confidence: 'YÜKSEK',
              recommendedSolution: 'Tüm dinamik SQL çalıştıran IPC işleyicileri sqlGuard.validateSqlQuery() ile doğrulanmalıdır.',
              requiredRegressionTests: 'apps/temin360-desktop/src/main/ipc/utils/__tests__/sqlGuard.test.ts'
            })
          }
        }
      }
    }
  })

  return { findings }
}

