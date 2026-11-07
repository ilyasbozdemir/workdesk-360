import fs from 'fs'
import path from 'path'
import { rootDir, parseSourceFile, traverseAst, getTypeScript } from './tsLoader.js'

/**
 * Çok Boyutlu God-Component ve Mimari Karmaşıklık Analizörü
 * Yalnızca satır sayısını değil; state sayısı, effect sayısı, hook sayısı,
 * doğrudan IPC bağımlılığı, import sayısı ve JSX karmaşıklığını hesaplayarak
 * gerçek God Component'ları tespit eder.
 * Salt konfigürasyon ve veri haritalama dosyalarını false-positive olarak elemez.
 */
export function analyzeGodComponents(files) {
  const ts = getTypeScript()
  const findings = []
  const componentStats = []

  const tsxFiles = files.filter(f => f.startsWith('apps/') && f.endsWith('.tsx') && !f.includes('__tests__') && !f.includes('.test.') && !f.includes('.spec.'))

  tsxFiles.forEach(f => {
    const fullPath = path.join(rootDir, f)
    if (!fs.existsSync(fullPath)) return

    const content = fs.readFileSync(fullPath, 'utf-8')
    const lines = content.split(/\r?\n/).length

    // 400 satır altındakileri God Component adayı yapma
    if (lines < 400) return

    let sf
    try {
      sf = parseSourceFile(f, content)
    } catch {
      return
    }

    let stateCount = 0
    let effectCount = 0
    let memoCallbackCount = 0
    let refCount = 0
    let customHookCount = 0
    let importCount = 0
    let directIpcCallCount = 0
    let jsxElementCount = 0
    let hasReactComponent = false

    traverseAst(sf, node => {
      // Import sayacı
      if (ts.isImportDeclaration(node)) {
        importCount++
      }

      // JSX Varlığı (React bileşeni olduğunu doğrulamak için)
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        jsxElementCount++
        hasReactComponent = true
      }

      // Hook ve IPC Çağrıları
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText(sf)

        if (text === 'useState' || text === 'useReducer' || text.endsWith('.useState') || text.endsWith('.useReducer')) {
          stateCount++
        } else if (text === 'useEffect' || text === 'useLayoutEffect' || text.endsWith('.useEffect')) {
          effectCount++
        } else if (text === 'useMemo' || text === 'useCallback' || text.endsWith('.useMemo') || text.endsWith('.useCallback')) {
          memoCallbackCount++
        } else if (text === 'useRef' || text.endsWith('.useRef')) {
          refCount++
        } else if (/^use[A-Z]/.test(text)) {
          customHookCount++
        }

        // Doğrudan IPC çağrısı (ipcRenderer.invoke / window.electron / window.api)
        if (text.includes('ipcRenderer') || text.includes('electron.ipcRenderer') || text.includes('window.api') || text.includes('workspaceAPI')) {
          directIpcCallCount++
        }
      }
    })

    // React bileşeni değilse (örneğin sadece veri listesi veya nesne dizisi ise) God Component sayma
    if (!hasReactComponent) return

    const totalHooks = stateCount + effectCount + memoCallbackCount + refCount + customHookCount

    // Çok Boyutlu God Puanı (Composite God Score)
    const godScore =
      Math.round(lines * 0.4) +
      (stateCount * 15) +
      (effectCount * 25) +
      (memoCallbackCount * 5) +
      (customHookCount * 10) +
      (directIpcCallCount * 20) +
      (importCount * 2)

    componentStats.push({
      file: f,
      lines,
      stateCount,
      effectCount,
      totalHooks,
      importCount,
      directIpcCallCount,
      godScore
    })

    if (godScore >= 200 && lines >= 500) {
      const priority = godScore >= 350 || lines >= 1000 ? 'P0' : 'P1'
      findings.push({
        id: `GOD-COMPONENT-${path.basename(f, '.tsx').toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
        priority,
        file: `${f}:L1`,
        evidence: `God Component Score: ${godScore} (Satır: ${lines}, State: ${stateCount}, Effect: ${effectCount}, Toplam Hook: ${totalHooks}, Import: ${importCount}, Doğrudan IPC: ${directIpcCallCount})`,
        affectedModules: [f.split('/')[1]],
        confidence: 'YÜKSEK',
        recommendedSolution: `Bileşen mimari sorumluluklarına göre parçalanmalı: 1) Veri getirme ve IPC mantığı özel bir Custom Hook'a taşınmalı, 2) Alt paneller bağımsız saf sunum bileşenlerine (Presenter Components) ayrılmalıdır.`,
        requiredRegressionTests: `pnpm --filter ${f.split('/')[1]} test`
      })
    }
  })

  componentStats.sort((a, b) => b.godScore - a.godScore)

  return { findings, componentStats }
}

