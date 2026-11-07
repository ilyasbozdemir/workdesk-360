import fs from 'fs'
import path from 'path'
import { rootDir, parseSourceFile, traverseAst, getTypeScript } from './tsLoader.js'

/**
 * Monorepo Paket ve Modül Bağımlılık Grafiği Analizörü
 * - Paketler arası izin verilen ve yasaklanan bağımlılık yönlerini doğrular
 * - Döngüsel bağımlılıkları tespit eder (Circular dependencies)
 * - Katman ihlallerini tespit eder (Package -> App, Templates -> Database vb.)
 */
export function analyzePackageDependencies(files) {
  const ts = getTypeScript()
  const findings = []

  const packages = [
    { name: '@temin360/contracts', path: 'packages/contracts', dir: 'packages/contracts' },
    { name: '@worksuite-360/contracts', path: 'packages/ecosystem-contracts', dir: 'packages/ecosystem-contracts' },
    { name: '@dt/database', path: 'packages/database', dir: 'packages/database' },
    { name: '@worksuite-360/document-engine', path: 'packages/document-engine', dir: 'packages/document-engine' },
    { name: '@temin360/document-templates', path: 'packages/document-templates', dir: 'packages/document-templates' },
    { name: '@temin360/domain', path: 'packages/domain', dir: 'packages/domain' },
    { name: '@temin360/pdf-generator', path: 'packages/pdf-generator', dir: 'packages/pdf-generator' }
  ]

  // 1. Her paketin dosya içi gerçek importlarını topla
  const packageImports = new Map()
  packages.forEach(p => packageImports.set(p.name, new Set()))

  const allImportStatements = []

  files.forEach(f => {
    if (!f.endsWith('.ts') && !f.endsWith('.tsx')) return
    const fullPath = path.join(rootDir, f)
    if (!fs.existsSync(fullPath)) return

    const content = fs.readFileSync(fullPath, 'utf-8')
    let sf
    try {
      sf = parseSourceFile(f, content)
    } catch {
      return
    }

    const currentPkg = packages.find(p => f.startsWith(p.dir))
    const isUnderApp = f.startsWith('apps/')

    traverseAst(sf, node => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const importPath = node.moduleSpecifier.text
          allImportStatements.push({ file: f, importPath, node })

          // Kural Kontrol 1: Package -> App ters bağımlılığı
          if (currentPkg && (importPath.startsWith('../../../apps') || importPath.includes('apps/') || importPath.startsWith('@renderer/'))) {
            const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
            findings.push({
              id: `DEP-REV-PKG-APP-${findings.length + 1}`,
              priority: 'P0',
              file: `${f}:L${line + 1}`,
              evidence: `import ... from '${importPath}' in package ${currentPkg.name}`,
              affectedModules: [currentPkg.name, 'apps'],
              confidence: 'YÜKSEK',
              recommendedSolution: 'Paket katmanından uygulama (@renderer veya apps/*) katmanına olan doğrudan bağımlılık kaldırılmalı, bağımlılık enjeksiyonu veya kontrat kullanılmalıdır.',
              requiredRegressionTests: `pnpm --filter ${path.basename(currentPkg.dir)} test`
            })
          }

          // Kural Kontrol 2: Document Templates -> Database doğrudan bağımlılık ihlali
          if (currentPkg?.name === '@temin360/document-templates') {
            if (importPath === '@dt/database' || importPath.includes('database') || importPath.includes('better-sqlite3')) {
              const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
              findings.push({
                id: `DEP-TMPL-DB-${findings.length + 1}`,
                priority: 'P0',
                file: `${f}:L${line + 1}`,
                evidence: `document-templates directly imports database module: '${importPath}'`,
                affectedModules: ['@temin360/document-templates', '@dt/database'],
                confidence: 'YÜKSEK',
                recommendedSolution: 'Şablonlar doğrudan veritabanı kütüphanesine bağlanmamalı; veri sağlayıcı (DataProvider) veya Resolver kontratları üzerinden veri almalıdır.',
                requiredRegressionTests: 'pnpm --filter @temin360/document-templates test'
              })
            }
          }

          // Kural Kontrol 3: Document Engine -> Document Templates / Database bağımlılık ihlali
          if (currentPkg?.name === '@worksuite-360/document-engine') {
            if (importPath === '@temin360/document-templates' || importPath === '@dt/database') {
              const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
              findings.push({
                id: `DEP-ENG-LEAK-${findings.length + 1}`,
                priority: 'P1',
                file: `${f}:L${line + 1}`,
                evidence: `document-engine imports higher-level package: '${importPath}'`,
                affectedModules: ['@worksuite-360/document-engine', importPath],
                confidence: 'YÜKSEK',
                recommendedSolution: 'Document Engine çekirdek motor olup üst seviye şablon veya veritabanı paketlerine bağımlı olmamalıdır.',
                requiredRegressionTests: 'pnpm --filter @worksuite-360/document-engine test'
              })
            }
          }

          // Kural Kontrol 4: Çapraz Masaüstü Uygulaması İhlali (App -> Another App)
          if (isUnderApp) {
            const appName = f.split('/')[1]
            if (importPath.startsWith('../') || importPath.startsWith('../../')) {
              const resolvedImport = path.normalize(path.join(path.dirname(f), importPath)).replace(/\\/g, '/')
              if (resolvedImport.startsWith('apps/') && !resolvedImport.startsWith(`apps/${appName}/`)) {
                const targetApp = resolvedImport.split('/')[1]
                const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
                findings.push({
                  id: `DEP-CROSS-APP-${findings.length + 1}`,
                  priority: 'P1',
                  file: `${f}:L${line + 1}`,
                  evidence: `Application '${appName}' directly imports from '${targetApp}': '${importPath}'`,
                  affectedModules: [appName, targetApp],
                  confidence: 'YÜKSEK',
                  recommendedSolution: 'Farklı masaüstü uygulamaları birbirlerinin iç dosyalarını doğrudan import etmemeli; ortak kodlar packages/* altında toplanmalıdır.',
                  requiredRegressionTests: `pnpm --filter ${appName} test`
                })
              }
            }
          }

          // Paket bağımlılık haritasına ekle
          if (currentPkg) {
            packages.forEach(target => {
              if (target.name !== currentPkg.name && (importPath === target.name || importPath.startsWith(target.name + '/'))) {
                packageImports.get(currentPkg.name).add(target.name)
              }
            })
          }
        }
      }
    })
  })

  // Döngüsel Bağımlılık Tespiti (Cycle detection via DFS)
  const visited = new Set()
  const recStack = new Set()

  function checkCycle(node, pathStack = []) {
    visited.add(node)
    recStack.add(node)
    pathStack.push(node)

    const neighbors = packageImports.get(node) || new Set()
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        checkCycle(neighbor, [...pathStack])
      } else if (recStack.has(neighbor)) {
        findings.push({
          id: `DEP-CYCLE-${findings.length + 1}`,
          priority: 'P0',
          file: 'packages/package.json',
          evidence: `Circular dependency detected: ${pathStack.join(' -> ')} -> ${neighbor}`,
          affectedModules: pathStack,
          confidence: 'YÜKSEK',
          recommendedSolution: 'Döngüsel paket bağımlılığı kırılarak ortak tipler/kontratlar @temin360/contracts paketine taşınmalıdır.',
          requiredRegressionTests: 'pnpm test'
        })
      }
    }

    recStack.delete(node)
  }

  for (const pkg of packages) {
    if (!visited.has(pkg.name)) {
      checkCycle(pkg.name)
    }
  }

  return {
    packageGraph: Object.fromEntries(Array.from(packageImports.entries()).map(([k, v]) => [k, Array.from(v)])),
    findings
  }
}

