import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { rootDir, parseSourceFile, traverseAst, getTypeScript } from './tsLoader.js'

/**
 * Normalize edilmiş AST Tabanlı Yapısal Kod Tekrarı (Clone) Analizörü
 * Fonksiyon isimlerine değil, normalize edilmiş AST gövdesine ve yapısal benzerliğe bakar.
 * `handleSubmit`, `formatDate`, `onClick` gibi ortak fonksiyon isimlerini tek başına tekrar saymaz.
 * Yalnızca gövdesi yapısal olarak klonlanmış (> 10 AST ifadesi) gerçek tekrarları raporlar.
 */
export function analyzeStructuralClones(files) {
  const ts = getTypeScript()
  const findings = []
  const hashMap = new Map()

  const targetFiles = files.filter(f =>
    !f.includes('__tests__') &&
    !f.includes('.test.') &&
    !f.includes('.spec.') &&
    !f.endsWith('.d.ts') &&
    (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'))
  )

  /**
   * AST Düğümünü İsim ve Değerlerden Arındırarak Normalize Eder
   */
  function normalizeAstNode(node, sf) {
    if (!node) return ''
    const syntaxKind = ts.SyntaxKind[node.kind]

    // İsimleri ve değişkenleri jenerik hale getir
    if (ts.isIdentifier(node)) {
      return 'ID'
    }
    // Sabit literalleri jenerik hale getir
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
      return 'LIT'
    }

    const children = []
    ts.forEachChild(node, child => {
      children.push(normalizeAstNode(child, sf))
    })

    return `${syntaxKind}(${children.join(',')})`
  }

  targetFiles.forEach(f => {
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
      let funcName = ''
      let bodyNode = null

      if (ts.isFunctionDeclaration(node) && node.body) {
        funcName = node.name ? node.name.text : 'anonymous'
        bodyNode = node.body
      } else if (ts.isArrowFunction(node) && node.body) {
        if (ts.isBlock(node.body)) {
          bodyNode = node.body
          if (node.parent && ts.isVariableDeclaration(node.parent) && node.parent.name) {
            funcName = node.parent.name.getText(sf)
          }
        }
      } else if (ts.isMethodDeclaration(node) && node.body) {
        funcName = node.name ? node.name.getText(sf) : 'method'
        bodyNode = node.body
      }

      if (!bodyNode || !ts.isBlock(bodyNode)) return

      // Yalnızca 8 veya daha fazla ifadesi olan kayda değer fonksiyonları incele
      if (bodyNode.statements.length < 8) return

      const normalized = normalizeAstNode(bodyNode, sf)
      if (normalized.length < 200) return

      const hash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16)
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))

      if (!hashMap.has(hash)) {
        hashMap.set(hash, [])
      }
      hashMap.get(hash).push({
        file: f,
        line: line + 1,
        funcName,
        statementCount: bodyNode.statements.length
      })
    })
  })

  // Birden fazla farklı dosyada aynı AST hash'ine sahip olanları topla
  for (const [hash, occurrences] of hashMap.entries()) {
    const uniqueFiles = new Map()
    occurrences.forEach(o => {
      if (!uniqueFiles.has(o.file)) {
        uniqueFiles.set(o.file, o)
      }
    })

    if (uniqueFiles.size > 1) {
      const occList = Array.from(uniqueFiles.values())
      const fileListStr = occList.map(o => `${o.file}:${o.line} (${o.funcName})`).join(' <=> ')
      const affectedMods = Array.from(new Set(occList.map(o => o.file.split('/')[1])))

      findings.push({
        id: `DUP-STRUCTURAL-CLONE-${findings.length + 1}`,
        priority: occList.length >= 3 ? 'P1' : 'P2',
        file: occList[0].file + `:L${occList[0].line}`,
        evidence: `Identical AST structure (${occList[0].statementCount} statements) duplicated across ${occList.length} files: ${fileListStr}`,
        affectedModules: affectedMods,
        confidence: 'YÜKSEK',
        recommendedSolution: `Yapısal olarak birebir aynı olan bu mantık ortak bir yardımcı fonksiyona (utility/helper) veya paylaşılan bir pakete çıkartılmalıdır.`,
        requiredRegressionTests: `pnpm test`
      })
    }
  }

  return { findings }
}

