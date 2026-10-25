/* eslint-disable */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function getGitRoot() {
  return path.resolve(__dirname, '../../..')
}

function execSilent(cmd) {
  try {
    return execSync(cmd, { cwd: getGitRoot(), encoding: 'utf-8', stdio: 'pipe' }).trim()
  } catch {
    return ''
  }
}

const {
  getReleaseHeader,
  findPreviousTag,
  loadVersionPolicy
} = require('../src/shared/version/versionManager.ts')

function generateReleaseNotes(currentTag, customPolicy) {
  const policy = customPolicy || loadVersionPolicy()
  let tag = currentTag
  if (!tag) {
    try {
      tag =
        execSilent('git describe --tags --exact-match HEAD') ||
        execSilent('git describe --tags --abbrev=0 HEAD') ||
        'v1.0.0'
    } catch {
      tag = 'v1.0.0'
    }
  }

  // Find previous tag
  let prevTag = ''
  try {
    prevTag = findPreviousTag(tag, getGitRoot())
  } catch {
    prevTag = ''
  }

  let logOutput = ''
  if (prevTag) {
    const tagExists = execSilent(`git rev-parse --verify "${tag}^{commit}"`)
    const targetRef = tagExists ? tag : 'HEAD'
    logOutput = execSilent(`git log "${prevTag}..${targetRef}" --pretty=format:"%h%x09%s"`)
    if (!logOutput && targetRef !== 'HEAD') {
      logOutput = execSilent(`git log "${prevTag}..HEAD" --pretty=format:"%h%x09%s"`)
    }
  }
  if (!logOutput) {
    logOutput = execSilent(`git log -n 25 --pretty=format:"%h%x09%s"`)
  }

  const lines = logOutput.split('\n').filter(Boolean)

  const categories = {
    feat: { title: '🚀 Yeni Özellikler & Geliştirmeler', items: [] },
    fix: { title: '🐛 Hata Düzeltmeleri', items: [] },
    refactor: { title: '⚡ Refaktör & Performans İyileştirmeleri', items: [] },
    test: { title: '🧪 Test & Kalite', items: [] },
    docs: { title: '📝 Dokümantasyon', items: [] },
    other: { title: '🔧 Diğer Değişiklikler', items: [] }
  }

  for (const line of lines) {
    const [hash, ...rest] = line.split('\t')
    const message = rest.join('\t').trim()
    if (!message) continue

    // Skip version bump commit itself
    if (message.startsWith('chore: release') || message.startsWith('chore(release):')) {
      continue
    }

    const lower = message.toLowerCase()

    if (lower.startsWith('feat') || lower.includes('özellik') || lower.includes('eklendi')) {
      const cleanMsg = message.replace(/^feat(\([^)]+\))?:\s*/i, '')
      categories.feat.items.push(`- ${cleanMsg} (\`${hash}\`)`)
    } else if (lower.startsWith('fix') || lower.includes('düzelt') || lower.includes('hata')) {
      const cleanMsg = message.replace(/^fix(\([^)]+\))?:\s*/i, '')
      categories.fix.items.push(`- ${cleanMsg} (\`${hash}\`)`)
    } else if (
      lower.startsWith('refactor') ||
      lower.startsWith('perf') ||
      lower.startsWith('style')
    ) {
      const cleanMsg = message.replace(/^(refactor|perf|style)(\([^)]+\))?:\s*/i, '')
      categories.refactor.items.push(`- ${cleanMsg} (\`${hash}\`)`)
    } else if (lower.startsWith('test')) {
      const cleanMsg = message.replace(/^test(\([^)]+\))?:\s*/i, '')
      categories.test.items.push(`- ${cleanMsg} (\`${hash}\`)`)
    } else if (lower.startsWith('docs')) {
      const cleanMsg = message.replace(/^docs(\([^)]+\))?:\s*/i, '')
      categories.docs.items.push(`- ${cleanMsg} (\`${hash}\`)`)
    } else {
      categories.other.items.push(`- ${message} (\`${hash}\`)`)
    }
  }

  const sections = []
  sections.push(getReleaseHeader(tag, policy))

  sections.push('\n### 📋 Bu Sürümde Yapılan Değişiklikler\n')

  let hasItems = false
  for (const key of ['feat', 'fix', 'refactor', 'test', 'docs', 'other']) {
    const cat = categories[key]
    if (cat.items.length > 0) {
      hasItems = true
      sections.push(`#### ${cat.title}`)
      sections.push(cat.items.join('\n'))
      sections.push('')
    }
  }

  if (!hasItems) {
    sections.push('- Genel hata düzeltmeleri ve performans iyileştirmeleri yapıldı.')
  }

  if (prevTag) {
    sections.push(`\n---\n*Önceki sürümden (${prevTag}) bu yana yapılan değişiklikler.*`)
  }

  return sections.join('\n')
}

// If run directly from CLI
if (require.main === module) {
  const targetTag = process.argv[2] || process.env.GITHUB_REF_NAME
  const notes = generateReleaseNotes(targetTag)

  const outputFile = process.argv[3]
  if (outputFile) {
    fs.writeFileSync(outputFile, notes, 'utf-8')
    console.log(`Release notes written to ${outputFile}`)
  } else {
    console.log(notes)
  }
}

module.exports = { generateReleaseNotes }
