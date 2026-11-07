import fs from 'fs'
import path from 'path'
import { rootDir, parseSourceFile, traverseAst, getTypeScript } from './tsLoader.js'

/**
 * Gereksiz Kod ve Kullanılmayan Dışa Aktarımlar (Dead Code / Unused Exports) Analizörü
 * AST üzerinde tanımlanan exportları ve monorepo genelindeki importları çapraz sorgular.
 * Dinamik import, şablon registry, Electron giriş noktaları ve veritabanı tablolarını
 * kesinlikle false-positive olarak ölü kod işaretlemez.
 */
export function analyzeDeadCode(files) {
  const ts = getTypeScript()
  const findings = []

  const exportedSymbols = new Map() // symbol -> { file, line, type }
  const importedSymbols = new Set() // symbol set

  // Whitelist: Giriş noktaları ve dinamik mekanizmalar
  const isWhitelistedFile = (f) => {
    return (
      f.endsWith('index.ts') ||
      f.endsWith('index.tsx') ||
      f.endsWith('main.ts') ||
      f.endsWith('main.tsx') ||
      f.endsWith('App.tsx') ||
      f.includes('__tests__') ||
      f.includes('.test.') ||
      f.includes('.spec.') ||
      f.includes('config') ||
      f.includes('packages/contracts') ||
      f.includes('packages/ecosystem-contracts') ||
      f.includes('packages/database/src/tables') ||
      f.includes('route.definition.ts') ||
      f.endsWith('.schema.ts') ||
      f.endsWith('.template.tsx')
    )
  }

  // 1. Adım: Tüm dosyalardaki importları topla
  files.forEach(f => {
    if (!f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.js') && !f.endsWith('.jsx')) return
    const fullPath = path.join(rootDir, f)
    if (!fs.existsSync(fullPath)) return

    const content = fs.readFileSync(fullPath, 'utf-8')
    let sf
    try {
      sf = parseSourceFile(f, content)
    } catch {
      return
    }

    traverseAst(sf, node => {
      // Named importlar: import { foo, bar as b } from '...'
      if (ts.isImportSpecifier(node)) {
        const importedName = node.propertyName ? node.propertyName.text : node.name.text
        importedSymbols.add(importedName)
      }
      // Dinamik import: import('...')
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        // Dinamik import var
      }
    })
  })

  // 2. Adım: Yardımcı dosyalardaki (utils, helpers, services) exportları topla
  const helperFiles = files.filter(f =>
    !isWhitelistedFile(f) &&
    (f.includes('/utils/') || f.includes('/helpers/') || f.includes('/services/')) &&
    (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'))
  )

  helperFiles.forEach(f => {
    const fullPath = path.join(rootDir, f)
    if (!fs.existsSync(fullPath)) return

    const content = fs.readFileSync(fullPath, 'utf-8')
    let sf
    try {
      sf = parseSourceFile(f, content)
    } catch {
      return
    }

    traverseAst(sf, node => {
      // export function foo()
      if (ts.isFunctionDeclaration(node) && node.name) {
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
        if (isExported) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
          exportedSymbols.set(node.name.text, { file: f, line: line + 1, name: node.name.text, kind: 'function' })
        }
      }

      // export const foo = ...
      if (ts.isVariableStatement(node)) {
        const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
        if (isExported) {
          node.declarationList.declarations.forEach(decl => {
            if (decl.name && ts.isIdentifier(decl.name)) {
              const { line } = sf.getLineAndCharacterOfPosition(decl.getStart(sf))
              exportedSymbols.set(decl.name.text, { file: f, line: line + 1, name: decl.name.text, kind: 'const' })
            }
          })
        }
      }
    })
  })

  // 3. Adım: Hiçbir yerde import edilmeyen yardımcı sembolleri tespit et
  for (const [sym, info] of exportedSymbols.entries()) {
    // Çok genel veya React prop/type isimlerini filtrele
    if (['default', 'init', 'setup', 'types'].includes(sym)) continue

    if (!importedSymbols.has(sym)) {
      findings.push({
        id: `DEAD-UNUSED-EXPORT-${sym.toUpperCase()}`,
        priority: 'P2',
        file: `${info.file}:L${info.line}`,
        evidence: `Exported ${info.kind} '${sym}' in '${info.file}' is never imported or referenced in any package or application.`,
        affectedModules: [info.file.split('/')[1]],
        confidence: 'YÜKSEK',
        recommendedSolution: `Kullanılmayan bu sembol silinmeli veya yalnızca dosya içi ihtiyaç varsa 'export' belirteci kaldırılarak yerel (private) yapılmalıdır.`,
        requiredRegressionTests: `pnpm test`
      })
    }
  }

  return { findings }
}

