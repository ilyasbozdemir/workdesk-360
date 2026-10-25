/* eslint-disable */
const fs = require('fs')
const path = require('path')

const appDir = path.join(__dirname, '..')
const outputFile = path.join(appDir, 'src/renderer/src/generated-loc.json')

const allowedExtensions = ['.ts', '.tsx', '.css', '.html', '.js', '.jsx']
const ignoredDirs = new Set([
  'node_modules',
  'dist',
  'out',
  'build',
  '.git',
  '.turbo',
  'coverage',
  '.next',
  'dist-local',
  'dist-electron',
  '.gemini',
  '.agents',
  '.vscode',
  '.idea'
])
const SCOPES = ['app', 'app+deps', 'repo']
const DEFAULT_SCOPE = 'app+deps'

/** @returns {string} */
function parseScope(args = process.argv.slice(2)) {
  let value = DEFAULT_SCOPE
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--scope=')) value = args[i].slice('--scope='.length)
    else if (args[i] === '--scope' && args[i + 1]) value = args[i + 1]
  }
  if (!SCOPES.includes(value)) {
    console.error(
      `[LOC Counter] Geçersiz kapsam: "${value}". Geçerli değerler: ${SCOPES.join(', ')}`
    )
    process.exit(1)
  }
  return value
}

function findWorkspaceRoot(start) {
  let dir = start
  while (true) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function readWorkspacePatterns(root) {
  const file = path.join(root, 'pnpm-workspace.yaml')
  if (!fs.existsSync(file)) return ['apps/*', 'packages/*']
  const patterns = []
  let inPackages = false
  for (const raw of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    if (/^packages\s*:/.test(raw)) {
      inPackages = true
      continue
    }
    if (inPackages) {
      if (/^\S/.test(raw) && raw.trim() !== '') break
      const m = raw.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*(#.*)?$/)
      if (m && !m[1].startsWith('!')) patterns.push(m[1].trim())
    }
  }
  return patterns.length ? patterns : ['apps/*', 'packages/*']
}

function expandPattern(root, pattern) {
  const clean = pattern.replace(/\/+$/, '')
  if (clean.endsWith('/*') || clean.endsWith('/**')) {
    const base = path.join(root, clean.replace(/\/\*+$/, ''))
    if (!fs.existsSync(base)) return []
    return fs
      .readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !ignoredDirs.has(d.name))
      .map((d) => path.join(base, d.name))
  }
  const exact = path.join(root, clean)
  return fs.existsSync(exact) ? [exact] : []
}

function loadWorkspacePackages(root) {
  const packages = []
  for (const pattern of readWorkspacePatterns(root)) {
    for (const dir of expandPattern(root, pattern)) {
      const pkgFile = path.join(dir, 'package.json')
      if (!fs.existsSync(pkgFile)) continue
      try {
        const json = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'))
        const deps = { ...json.dependencies, ...json.devDependencies, ...json.optionalDependencies }
        const workspaceDeps = Object.entries(deps)
          .filter(([, v]) => typeof v === 'string' && v.startsWith('workspace:'))
          .map(([name]) => name)
        packages.push({ name: json.name || path.basename(dir), dir, workspaceDeps })
      } catch (err) {
        console.warn(`[LOC Counter] Uyarı: ${pkgFile} okunamadı, atlandı (${err.message})`)
      }
    }
  }
  return packages
}

function resolvePackages(scope, root, currentAppDir = appDir) {
  if (!root) {
    if (scope !== 'app')
      console.warn(
        '[LOC Counter] Uyarı: pnpm-workspace.yaml bulunamadı, yalnızca uygulama sayılıyor.'
      )
    return [{ name: 'app-desktop', dir: currentAppDir, workspaceDeps: [] }]
  }
  const all = loadWorkspacePackages(root)
  const app = all.find((p) => path.resolve(p.dir) === path.resolve(currentAppDir))
  if (!app) return [{ name: 'app-desktop', dir: currentAppDir, workspaceDeps: [] }]

  if (scope === 'repo') return all
  if (scope === 'app') return [app]

  const byName = new Map(all.map((p) => [p.name, p]))
  const seen = new Set([app.name])
  const queue = [app]
  while (queue.length) {
    const current = queue.shift()
    for (const depName of current.workspaceDeps) {
      const dep = byName.get(depName)
      if (dep && !seen.has(dep.name)) {
        seen.add(dep.name)
        queue.push(dep)
      }
    }
  }
  return all.filter((p) => seen.has(p.name))
}

function sourceDirOf(pkg) {
  const src = path.join(pkg.dir, 'src')
  return fs.existsSync(src) ? src : pkg.dir
}

/**
 * Normalizes content and splits into lines, treating trailing newline as line terminator.
 * - Empty string "" yields 0 lines.
 * - Single trailing newline (\n or \r\n) is treated as terminator, avoiding phantom empty line.
 * @param {string} content
 * @returns {string[]}
 */
function getFileLines(content) {
  if (!content || content.length === 0) return []
  let text = content
  if (text.endsWith('\r\n')) {
    text = text.slice(0, -2)
  } else if (text.endsWith('\n')) {
    text = text.slice(0, -1)
  }
  return text.split(/\r?\n/)
}

/**
 * Detects whether a file is a test/spec/mock/fixture file.
 * Prevents double-counting across test categories.
 * @param {string} filePath
 * @returns {boolean}
 */
function isTestFile(filePath) {
  const normalized = filePath.split(path.sep).join('/')
  return (
    normalized.includes('/__tests__/') ||
    normalized.includes('/__mocks__/') ||
    normalized.includes('/__fixtures__/') ||
    /\.(test|spec)\.[jt]sx?$/.test(normalized) ||
    normalized.includes('/e2e/') ||
    normalized.includes('/tests/')
  )
}

/**
 * Counts lines and metrics for a single file.
 * NOTE: 'code' represents nonBlank lines (non-empty lines including comments/docstrings),
 * matching standard nonBlankLines measurement.
 * @param {string} fullPath
 */
function countFile(fullPath) {
  const content = fs.readFileSync(fullPath, 'utf-8')
  const lines = getFileLines(content)
  let nonBlank = 0
  for (const line of lines) {
    if (line.trim().length > 0) nonBlank++
  }
  const total = lines.length
  const blank = total - nonBlank
  const isTest = isTestFile(fullPath)
  return {
    lines: total,
    code: nonBlank, // nonBlankLines (boş olmayan satırlar)
    blank,
    isTest
  }
}

function countDir(dir, acc, outPath = outputFile) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue
    const full = path.join(dir, entry.name)

    // Guard against counting output files or temporary files
    if (outPath && path.resolve(full) === path.resolve(outPath)) continue
    if (entry.name.endsWith('.tmp')) continue

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) countDir(full, acc, outPath)
      continue
    }

    const lower = entry.name.toLowerCase()
    if (lower.endsWith('.d.ts') || lower.includes('.min.')) continue
    if (!allowedExtensions.includes(path.extname(lower))) continue

    try {
      const stat = countFile(full)
      acc.files++
      acc.lines += stat.lines
      acc.code += stat.code
      acc.blank += stat.blank

      if (stat.isTest) {
        acc.testFiles++
        acc.testLines += stat.lines
        acc.testCode += stat.code
      } else {
        acc.prodFiles++
        acc.prodLines += stat.lines
        acc.prodCode += stat.code
      }
    } catch (err) {
      console.warn(`[LOC Counter] Uyarı: ${full} okunamadı, atlandı (${err.message})`)
    }
  }
}

/**
 * Synchronous sleep using Atomics.wait (zero CPU utilization).
 * @param {number} ms
 */
function sleepSync(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
  } catch {
    const start = Date.now()
    while (Date.now() - start < ms) {}
  }
}

/**
 * Checks if existing LOC JSON data is equivalent to incoming data
 * (comparing metrics and breakdown, ignoring variable timestamp).
 */
function areJsonObjectsEquivalent(existing, incoming) {
  if (existing === incoming) return true
  if (!existing || !incoming || typeof existing !== 'object' || typeof incoming !== 'object') {
    return false
  }

  // If both are LOC counter result structures, compare metrics and ignore variable timestamp
  if (
    typeof existing.totalFiles === 'number' &&
    typeof incoming.totalFiles === 'number' &&
    typeof existing.codeLines === 'number' &&
    typeof incoming.codeLines === 'number'
  ) {
    const keys = [
      'totalFiles',
      'totalLines',
      'codeLines',
      'nonBlankLines',
      'blankLines',
      'testFiles',
      'testLines',
      'testNonBlankLines',
      'prodFiles',
      'prodLines',
      'prodNonBlankLines',
      'scope'
    ]
    for (const k of keys) {
      if (existing[k] !== incoming[k]) return false
    }
    return JSON.stringify(existing.breakdown) === JSON.stringify(incoming.breakdown)
  }

  // Fallback for general objects (used in unit tests)
  return JSON.stringify(existing) === JSON.stringify(incoming)
}

/**
 * Acquires a cross-process lockfile to prevent parallel execution collisions.
 */
function acquireLock(lockFile, maxWaitMs = 5000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    try {
      const fd = fs.openSync(lockFile, 'wx')
      fs.writeSync(fd, `${process.pid}\n${Date.now()}`)
      fs.closeSync(fd)
      return true
    } catch (err) {
      if (err.code === 'EEXIST') {
        // Stale lock check (older than 10 seconds)
        try {
          const stats = fs.statSync(lockFile)
          if (Date.now() - stats.mtimeMs > 10000) {
            try {
              fs.unlinkSync(lockFile)
            } catch {}
            continue
          }
        } catch {}
        sleepSync(30 + Math.floor(Math.random() * 20))
      } else {
        try {
          fs.mkdirSync(path.dirname(lockFile), { recursive: true })
        } catch {}
      }
    }
  }
  return false
}

function releaseLock(lockFile) {
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile)
    }
  } catch {}
}

const RETRY_CODES = new Set(['EPERM', 'EBUSY', 'EACCES'])

/**
 * Atomically writes JSON to targetPath with retry logic for Windows file locking (EPERM / EBUSY).
 * Skips write if content has not changed.
 * Cleans up temporary file on failure.
 *
 * @param {string} targetPath
 * @param {object} data
 * @param {object} [options]
 * @param {number} [options.maxRetries=10]
 * @param {number} [options.baseDelayMs=25]
 * @param {boolean} [options.force=false]
 * @returns {boolean} true if file was written, false if skipped
 */
function writeLocJsonAtomic(targetPath, data, options = {}) {
  const maxRetries = options.maxRetries || 10
  const baseDelayMs = options.baseDelayMs || 25
  const force = options.force || false

  const dir = path.dirname(targetPath)
  fs.mkdirSync(dir, { recursive: true })

  // 1. Content check: if identical, avoid rewriting to eliminate file watcher triggers & lock contention
  if (!force && fs.existsSync(targetPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(targetPath, 'utf-8'))
      if (areJsonObjectsEquivalent(existing, data)) {
        return false
      }
    } catch {
      // If unreadable or invalid, proceed to rewrite
    }
  }

  // 2. Lockfile to handle concurrent script execution
  const lockFile = `${targetPath}.lock`
  const hasLock = acquireLock(lockFile)

  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`

  try {
    const jsonStr = JSON.stringify(data, null, 2)
    fs.writeFileSync(tmpPath, jsonStr, 'utf-8')

    if (!fs.existsSync(tmpPath) || fs.statSync(tmpPath).size === 0) {
      throw new Error(`[LOC Counter] Atomik yazma hatası: ${tmpPath} boş veya oluşturulamadı.`)
    }

    // 3. Rename with retry mechanism for Windows EPERM / EBUSY
    let lastError = null
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        fs.renameSync(tmpPath, targetPath)
        lastError = null
        break
      } catch (err) {
        if (RETRY_CODES.has(err.code)) {
          lastError = err
          if (attempt < maxRetries) {
            const delay = Math.min(
              baseDelayMs * Math.pow(1.5, attempt - 1) + Math.floor(Math.random() * 15),
              500
            )
            sleepSync(delay)
            continue
          }
        }
        // Non-retryable error (e.g. ENOSPC, ENOENT) or exhausted retries
        throw err
      }
    }

    if (lastError) {
      throw lastError
    }

    return true
  } catch (err) {
    // 4. Safe cleanup of temporary file on failure, preserving original error
    try {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath)
      }
    } catch {}
    throw err
  } finally {
    if (hasLock) {
      releaseLock(lockFile)
    }
  }
}

function runCount(options = {}) {
  const chosenScope = options.scope || parseScope()
  const customAppDir = options.appDir || appDir
  const customOutputFile = options.outputFile !== undefined ? options.outputFile : outputFile
  const root = findWorkspaceRoot(customAppDir)
  const packages = resolvePackages(chosenScope, root, customAppDir)

  let totalFiles = 0
  let totalLines = 0
  let codeLines = 0
  let blankLines = 0
  let testFiles = 0
  let testLines = 0
  let testNonBlankLines = 0
  let prodFiles = 0
  let prodLines = 0
  let prodNonBlankLines = 0
  const breakdown = []

  for (const pkg of packages) {
    const dir = sourceDirOf(pkg)
    if (!fs.existsSync(dir)) {
      console.warn(`[LOC Counter] Uyarı: ${dir} bulunamadı, atlandı.`)
      continue
    }
    const acc = {
      files: 0,
      lines: 0,
      code: 0,
      blank: 0,
      testFiles: 0,
      testLines: 0,
      testCode: 0,
      prodFiles: 0,
      prodLines: 0,
      prodCode: 0
    }
    countDir(dir, acc, customOutputFile)

    totalFiles += acc.files
    totalLines += acc.lines
    codeLines += acc.code
    blankLines += acc.blank
    testFiles += acc.testFiles
    testLines += acc.testLines
    testNonBlankLines += acc.testCode
    prodFiles += acc.prodFiles
    prodLines += acc.prodLines
    prodNonBlankLines += acc.prodCode

    breakdown.push({
      name: pkg.name,
      path:
        path
          .relative(root || customAppDir, pkg.dir)
          .split(path.sep)
          .join('/') || '.',
      files: acc.files,
      totalLines: acc.lines,
      codeLines: acc.code,
      nonBlankLines: acc.code,
      blankLines: acc.blank,
      testFiles: acc.testFiles,
      testLines: acc.testLines,
      testNonBlankLines: acc.testCode,
      prodFiles: acc.prodFiles,
      prodLines: acc.prodLines,
      prodNonBlankLines: acc.prodCode
    })
  }

  const result = {
    totalFiles,
    totalLines,
    codeLines,
    nonBlankLines: codeLines,
    blankLines,
    testFiles,
    testLines,
    testNonBlankLines,
    prodFiles,
    prodLines,
    prodNonBlankLines,
    timestamp: new Date().toISOString(),
    scope: chosenScope,
    breakdown
  }

  if (customOutputFile) {
    writeLocJsonAtomic(customOutputFile, result)
  }

  return result
}

if (require.main === module) {
  const scope = parseScope()
  const result = runCount({ scope })

  console.log(`[LOC Counter] Kapsam: ${result.scope}`)
  for (const b of result.breakdown) {
    console.log(
      `  - ${b.name} (${b.path}): ${b.codeLines} kod satırı (üretim: ${b.prodNonBlankLines}, test: ${b.testNonBlankLines}) / ${b.files} dosya`
    )
  }
  console.log(
    `[LOC Counter] Toplam: ${result.codeLines} kod satırı (${result.totalLines} satır: ${result.codeLines} dolu, ${result.blankLines} boş) / ${result.totalFiles} dosya (üretim: ${result.prodFiles}, test: ${result.testFiles}).`
  )
}

module.exports = {
  allowedExtensions,
  ignoredDirs,
  SCOPES,
  DEFAULT_SCOPE,
  parseScope,
  findWorkspaceRoot,
  readWorkspacePatterns,
  expandPattern,
  loadWorkspacePackages,
  resolvePackages,
  sourceDirOf,
  getFileLines,
  isTestFile,
  countFile,
  countDir,
  sleepSync,
  areJsonObjectsEquivalent,
  acquireLock,
  releaseLock,
  RETRY_CODES,
  writeLocJsonAtomic,
  runCount
}
