import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const rootDir = path.resolve(__dirname, '../..')

let cachedTs = null

/**
 * Dynamically resolves TypeScript compiler API from the monorepo
 */
export function getTypeScript() {
  if (cachedTs) return cachedTs

  const req = createRequire(path.join(rootDir, 'package.json'))

  // 1. Try standard require
  try {
    cachedTs = req('typescript')
    return cachedTs
  } catch {}

  // 2. Try pnpm virtual store
  const pnpmDir = path.join(rootDir, 'node_modules/.pnpm')
  if (fs.existsSync(pnpmDir)) {
    const entries = fs.readdirSync(pnpmDir)
    const tsEntry = entries.find(e => e.startsWith('typescript@'))
    if (tsEntry) {
      try {
        cachedTs = req(path.join(pnpmDir, tsEntry, 'node_modules/typescript'))
        return cachedTs
      } catch {}
    }
  }

  // 3. Try app-level node_modules
  const candidatePaths = [
    path.join(rootDir, 'apps/temin360-desktop/node_modules/typescript'),
    path.join(rootDir, 'packages/document-engine/node_modules/typescript')
  ]
  for (const cp of candidatePaths) {
    if (fs.existsSync(cp)) {
      try {
        cachedTs = req(cp)
        return cachedTs
      } catch {}
    }
  }

  throw new Error('TypeScript compiler API could not be loaded from monorepo.')
}

/**
 * Parses a source file into a TypeScript AST
 */
export function parseSourceFile(filePath, content) {
  const ts = getTypeScript()
  const scriptKind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : filePath.endsWith('.jsx')
    ? ts.ScriptKind.JSX
    : filePath.endsWith('.ts')
    ? ts.ScriptKind.TS
    : ts.ScriptKind.JS

  return ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  )
}

/**
 * Traverses an AST with a visitor function
 */
export function traverseAst(node, visitor) {
  if (!node) return
  visitor(node)
  const ts = getTypeScript()
  ts.forEachChild(node, child => traverseAst(child, visitor))
}

/**
 * Gets line and column number from node position
 */
export function getNodeLocation(node, sourceFile) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return { line: line + 1, column: character + 1 }
}

