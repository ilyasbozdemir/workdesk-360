#!/usr/bin/env node
/* eslint-disable */

/**
 * release.js - Otomatik Release & Tag Yönetim Scripti
 *
 * Yapılanlar:
 *   1. package.json'dan mevcut versiyonu okur
 *   2. Monorepo paket sürümlerini ve şema manifestini günceller
 *   3. İlgili release dosyalarını stage eder
 *   4. "chore: release vX.Y.Z" commit mesajı ile commit atar
 *   5. "vX.Y.Z" tag'i oluşturur
 *   6. (Opsiyonel) commit ve tag'i remote'a push eder
 *
 * Kullanım:
 *   node scripts/release.js                  # Tam release (commit + tag + push)
 *   node scripts/release.js --no-push        # Push yapmadan (sadece commit + tag)
 *   node scripts/release.js --dry-run        # Hiçbir şey yapmadan ne yapılacağını göster
 *   node scripts/release.js --message "msg"  # Özel commit mesajı
 *   node scripts/release.js --patch          # Otomatik patch bump (rc.1 → rc.2)
 *   node scripts/release.js --skip-manifest  # Şema manifestini dondurmayı atlar
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ─── Renk Yardımcıları ────────────────────────────────────
const c = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`
}

// ─── Argüman Parse ────────────────────────────────────────
const args = process.argv.slice(2)

let channelArg = null
const chanIdx = args.indexOf('--channel')
if (chanIdx !== -1 && args[chanIdx + 1]) {
  channelArg = args[chanIdx + 1].toLowerCase().trim()
}
const chanEqual = args.find((a) => a.startsWith('--channel='))
if (chanEqual) {
  channelArg = chanEqual.split('=')[1].toLowerCase().trim()
}

const flags = {
  channel: channelArg,
  rc: args.includes('--rc') || channelArg === 'rc',
  patch: args.includes('--patch'),
  dryRun: args.includes('--dry-run'),
  noPush: args.includes('--no-push'),
  fixSchema: args.includes('--fix-schema'),
  skipManifest: args.includes('--skip-manifest') || args.includes('--skip-versions'),
  allowDirty: args.includes('--allow-dirty'),
  help: args.includes('--help') || args.includes('-h')
}

// --message "mesaj" desteği
let customMessage = null
const msgIdx = args.indexOf('--message')
if (msgIdx !== -1 && args[msgIdx + 1]) {
  customMessage = args[msgIdx + 1]
}
const msgShortIdx = args.indexOf('-m')
if (msgShortIdx !== -1 && args[msgShortIdx + 1]) {
  customMessage = args[msgShortIdx + 1]
}

// ─── Yardım ───────────────────────────────────────────────
if (flags.help) {
  console.log(`
${c.bold('📦 TEMİN 360 - Release Script')}

${c.cyan('Kullanım:')}
  node scripts/release.js [seçenekler]

${c.cyan('Seçenekler:')}
  ${c.yellow('--channel <ad>')}     Hedef release kanalını seçer: alpha, beta, rc, stable
  ${c.yellow('--rc')}              RC (Release Candidate) kanalını seçer (--channel rc kısayolu)
  ${c.yellow('--patch')}           Versiyon numarasını otomatik artırır (rc.1 → rc.2)
  ${c.yellow('--dry-run')}         Hiçbir değişiklik yapmadan ne yapılacağını gösterir
  ${c.yellow('--no-push')}         Sadece commit + tag oluşturur, push yapmaz
  ${c.yellow('--skip-manifest')}   Şema manifestini dondurmayı atlar
  ${c.yellow('--allow-dirty')}     Kirli çalışma alanını yok sayarak release yapmaya izin verir
  ${c.yellow('--message, -m')}     Özel commit mesajı belirler
  ${c.yellow('--help, -h')}        Bu yardım mesajını gösterir

${c.cyan('Örnekler:')}
  node scripts/release.js                          # Mevcut versiyonla release akışı
  node scripts/release.js --channel rc             # RC kanalına geç / sonraki RC'ye yükselt
  node scripts/release.js --channel beta --patch   # Beta kanalında patch sürümü yayınla
  node scripts/release.js --channel stable         # Kararlı sürüme geç (örn: 1.0.0-rc.3 → 1.0.0)
  node scripts/release.js --rc                     # RC kanalına geç (--channel rc)
  node scripts/release.js --rc --patch             # Sonraki RC sürümünü yayınla
  node scripts/release.js --rc --dry-run           # RC sürüm geçişini önizle
  node scripts/release.js --patch                  # Standart patch release (mevcut kanalda artırır)
  node scripts/release.js --no-push                # Push'suz release (yerel commit ve tag)
  node scripts/release.js --dry-run                # Önizleme modu
  node scripts/release.js -m "feat: yeni özellik"  # Özel mesaj
`)
  process.exit(0)
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────
const ROOT = path.resolve(__dirname, '..')
const GIT_ROOT = path.resolve(__dirname, '../../..')

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      cwd: opts.cwd || GIT_ROOT,
      encoding: 'utf-8',
      stdio: opts.silent ? 'pipe' : 'inherit',
      ...opts
    })
  } catch (err) {
    if (opts.ignoreError) return err.stdout || ''
    console.error(c.red(`\n❌ Komut başarısız: ${cmd}`))
    console.error(c.dim(err.message))
    process.exit(1)
  }
}

function execSilent(cmd) {
  return exec(cmd, { silent: true, ignoreError: true }).trim()
}

function readJSON(filePath) {
  const full = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath)
  return JSON.parse(fs.readFileSync(full, 'utf-8'))
}

function writeJSON(filePath, data) {
  const full = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath)
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

/**
 * Sürüm hesaplama ve yükseltme fonksiyonu
 * @param {string} currentVersion - Mevcut versiyon (örn: "1.0.0-beta.256", "1.0.0-rc.1")
 * @param {object} options - { rc?: boolean, patch?: boolean }
 * @returns {string} Yeni versiyon
 */
const {
  VersionManager,
  loadVersionPolicy,
  parseVersion,
  compareVersions,
  computeNextVersion: vmComputeNextVersion,
  bumpPatch: vmBumpPatch,
  checkTagExists
} = require('../src/shared/version/versionManager.ts')

function computeNextVersion(currentVersion, options = {}) {
  return vmComputeNextVersion(currentVersion, options)
}

function bumpPatch(version) {
  return vmBumpPatch(version)
}

function getRangeFolder(num) {
  if (num <= 100) return 'beta-001-100'
  if (num <= 200) return 'beta-101-200'
  if (num <= 300) return 'beta-201-300'
  const lower = Math.floor((num - 1) / 100) * 100 + 1
  const upper = lower + 99
  return `beta-${String(lower).padStart(3, '0')}-${upper}`
}

function finalizeCurrentSchemaManifest(version, dryRun) {
  const currentTsPath = path.join(
    GIT_ROOT,
    'packages/database/src/schema-manifest/apps/devlet-ihale-2886/manifest.ts'
  )
  const currentYamlPath = path.join(
    GIT_ROOT,
    'packages/database/src/schema-manifest/apps/devlet-ihale-2886/manifest.yaml'
  )

  if (!fs.existsSync(currentTsPath)) return

  console.log(c.green(`✅ Devlet İhale 2886 Şema manifesti güncelleniyor: ${version}`))

  if (!dryRun) {
    let tsContent = fs.readFileSync(currentTsPath, 'utf-8')
    tsContent = tsContent.replace(/app:\s*["'][^"']+["']/, `app: "${version}"`)
    fs.writeFileSync(currentTsPath, tsContent, 'utf-8')

    if (fs.existsSync(currentYamlPath)) {
      let yamlContent = fs.readFileSync(currentYamlPath, 'utf-8')
      yamlContent = yamlContent.replace(/app:\s*[^\n]+/, `app: ${version}`)
      fs.writeFileSync(currentYamlPath, yamlContent, 'utf-8')
    }
  }
}

const releaseTargets = [
  'package.json',
  'apps/devlet-ihale-2886-desktop/package.json',
  'packages/database/package.json',
  'packages/database/schema-snapshot.json',
  'packages/database/src/schema-manifest',
  'packages/database/src/schema-snapshot',
  'apps/devlet-ihale-2886-desktop/src/renderer/src/generated-loc.json'
]

function stageReleaseFiles() {
  const existing = releaseTargets.filter((t) => fs.existsSync(path.join(GIT_ROOT, t)))
  if (existing.length > 0) {
    exec(`git add ${existing.map((f) => `"${f}"`).join(' ')}`)
  }
}

// ─── Ana Akış ─────────────────────────────────────────────
function main() {
  console.log(`\n${c.bold('📦 TEMİN 360 - Release Script')}\n`)

  // 0. Ön Kontrol: Çalışma Alanı Temizlik Kontrolü
  const initialStatus = execSilent('git status --porcelain')
  if (initialStatus.length > 0 && !flags.allowDirty && !flags.dryRun) {
    const dirtyFiles = initialStatus
      .split('\n')
      .filter(Boolean)
      .map((line) => line.substring(3).trim())
      .filter(
        (file) =>
          !releaseTargets.some(
            (target) =>
              file.replace(/\\/g, '/').startsWith(target) || file.replace(/\\/g, '/') === target
          )
      )

    if (dirtyFiles.length > 0) {
      console.error(
        c.red(
          '\n❌ Çalışma alanında release dışı commit edilmemiş veya stage edilmemiş değişiklikler var!'
        )
      )
      console.error(c.yellow('Release işlemi temiz bir git çalışma alanı gerektirir.'))
      console.error(c.dim('Değişen dosyalar:\n' + dirtyFiles.join('\n') + '\n'))
      console.error(
        c.yellow('Lütfen release öncesi değişikliklerinizi commit edin veya stash yapın.')
      )
      console.error(
        c.dim('Mevcut değişikliklerle zorlamak için: node scripts/release.js --allow-dirty')
      )
      process.exit(1)
    }
  }

  // 0.1 Ön Kontroller: Şema Doğrulama (Zorunlu Ön Koşul)
  const schemaScript = path.join(GIT_ROOT, 'scripts/check-schema.mjs')
  if (fs.existsSync(schemaScript)) {
    try {
      if (flags.fixSchema) {
        console.log(c.cyan('🔍 Şema kontrol ediliyor ve snapshot eşitleniyor (--fix-schema)...'))
        exec(`node "${schemaScript}" --fix`, { silent: false })
        console.log(c.green('✔ Şema snapshot başarıyla eşitlendi.\n'))
      } else {
        console.log(c.cyan('🔍 [Zorunlu Ön Koşul] Veritabanı şema ve snapshot tutarlılığı kontrol ediliyor...'))
        exec(`node "${schemaScript}"`, { silent: false })
        console.log(c.green('✔ Şema doğrulaması başarılı.\n'))
      }
    } catch (e) {
      console.error(c.red('\n❌ KRİTİK HATA: Veritabanı şema doğrulaması başarısız oldu!'))
      console.error(c.yellow('Veritabanı tablo tanımları ile schema-snapshot.json arasında tutarsızlık var.'))
      console.error(c.dim('Sürüm güvenliği için release işlemi durduruldu.'))
      console.error(c.cyan('Lütfen şemayı inceleyip pnpm fix:schema çalıştırın veya release komutuna --fix-schema ekleyin.\n'))
      process.exit(1)
    }
  }

  // 1. Mevcut versiyonu oku
  const pkg = readJSON('package.json')
  let version = pkg.version
  const oldVersion = version

  const shouldBump = flags.patch || flags.rc || Boolean(flags.channel)

  if (shouldBump) {
    try {
      version = computeNextVersion(oldVersion, {
        channel: flags.channel,
        rc: flags.rc,
        patch: flags.patch
      })
    } catch (err) {
      console.error(c.red(`\n❌ Sürüm hesaplama hatası: ${err.message}`))
      process.exit(1)
    }
  }

  const tag = `v${version}`

  console.log(c.cyan(`📌 Versiyon: ${c.bold(version)}`))
  console.log(c.cyan(`🏷️  Tag:      ${c.bold(tag)}`))

  if (flags.dryRun) {
    console.log(c.yellow('\n⚠️  DRY RUN modu - hiçbir değişiklik yapılmayacak\n'))
  }

  // 1.1 Mevcut tag kontrolü (dosyalar güncellenmeden önce)
  try {
    if (checkTagExists(tag, GIT_ROOT)) {
      console.error(c.red(`\n❌ Tag "${tag}" zaten mevcut!`))
      console.error(
        c.dim(
          'Versiyon numarasını artırın veya uygun parametreleri (--patch / --rc / --channel) kullanın.'
        )
      )
      process.exit(1)
    }
  } catch (err) {
    console.error(c.red(`\n❌ ${err.message}`))
    process.exit(1)
  }

  if (shouldBump && version !== oldVersion) {
    console.log(c.cyan(`🔄 Versiyon geçişi: ${oldVersion} → ${c.bold(version)}`))

    if (!flags.dryRun) {
      pkg.version = version
      writeJSON('package.json', pkg)

      const monorepoPkgs = [
        path.join(GIT_ROOT, 'package.json'),
        path.join(GIT_ROOT, 'packages/database/package.json'),
        path.join(GIT_ROOT, 'packages/document-templates/package.json')
      ]
      for (const pPath of monorepoPkgs) {
        if (fs.existsSync(pPath)) {
          try {
            const pData = JSON.parse(fs.readFileSync(pPath, 'utf-8'))
            pData.version = version
            fs.writeFileSync(pPath, JSON.stringify(pData, null, 2) + '\n', 'utf-8')
          } catch {}
        }
      }
    }
  }

  // 3. Şema manifestini dondur
  if (!flags.skipManifest) {
    finalizeCurrentSchemaManifest(version, flags.dryRun)
  } else {
    console.log(c.dim('ℹ️  Şema manifesti dondurma işlemi atlandı (--skip-manifest)'))
  }

  // 4. Git durumu kontrol et
  const status = execSilent('git status --porcelain')
  const hasChanges = status.length > 0

  if (hasChanges) {
    const changedFiles = status
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const flag = line.substring(0, 2).trim()
        const file = line.substring(3)
        const icon = flag === '??' ? '🆕' : flag === 'M' ? '📝' : flag === 'D' ? '🗑️' : '📄'
        return `  ${icon} ${file}`
      })

    console.log(c.cyan(`\n📂 Değişen dosyalar (${changedFiles.length}):`))
    changedFiles.forEach((f) => console.log(f))

    // Stage release targets
    if (!flags.dryRun) {
      console.log(c.cyan('\n📥 Release dosyaları stage ediliyor...'))
      stageReleaseFiles()
    } else {
      console.log(c.yellow('\n📥 [DRY RUN] Sadece release dosyaları stage edilecek'))
    }
  } else {
    console.log(c.dim('\nℹ️  Commit edilecek değişiklik yok (clean working tree)'))
  }

  // 5. Commit
  const commitMsg = customMessage || `chore: release ${tag}`

  if (hasChanges || !flags.skipManifest) {
    if (!flags.dryRun) {
      stageReleaseFiles()
    }

    const stagedCheck = execSilent('git diff --cached --name-only')
    if (stagedCheck.length > 0 || hasChanges) {
      console.log(c.cyan(`\n💾 Commit: "${commitMsg}"`))
      if (!flags.dryRun) {
        exec(`git commit -m "${commitMsg}"`)
      } else {
        console.log(c.yellow(`[DRY RUN] git commit -m "${commitMsg}"`))
      }
    }
  }

  // 6. Release Notlarını Üret ve Tag oluştur
  const { generateReleaseNotes } = require('./generate-release-notes')
  const notes = generateReleaseNotes(tag)

  console.log(c.cyan(`\n📝 Sürüm Değişiklik Notları (Changelog):`))
  console.log(c.dim('─'.repeat(40)))
  console.log(notes)
  console.log(c.dim('─'.repeat(40)))

  console.log(c.cyan(`\n🏷️  Tag oluşturuluyor: ${tag}`))
  if (!flags.dryRun) {
    exec(`git tag -a ${tag} -m "Release ${tag}"`)
    console.log(c.green(`✅ Tag "${tag}" oluşturuldu`))
  } else {
    console.log(c.yellow(`[DRY RUN] git tag -a ${tag} -m "Release ${tag}"`))
  }

  // 7. Push
  if (!flags.noPush && !flags.dryRun) {
    console.log(c.cyan("\n🚀 Remote'a push ediliyor..."))
    exec('git push')
    exec(`git push origin ${tag}`)
    console.log(c.green('✅ Commit ve tag push edildi'))
  } else if (flags.noPush) {
    console.log(c.yellow('\nℹ️  Push atlandı (--no-push). Manuel push için:'))
    console.log(c.dim(`    git push && git push origin ${tag}`))
  }

  // 8. Özet
  console.log(`\n${c.bold('─'.repeat(50))}`)
  console.log(c.bold(c.green('\n🎉 Release tamamlandı!\n')))
  console.log(`  📌 Versiyon  : ${c.bold(version)}`)
  console.log(`  🏷️  Tag       : ${c.bold(tag)}`)
  console.log(`  💾 Commit    : ${commitMsg}`)
  console.log(
    `  🚀 Push      : ${flags.noPush || flags.dryRun ? c.yellow('Hayır') : c.green('Evet')}`
  )

  if (flags.dryRun) {
    console.log(c.yellow('\n  ⚠️  DRY RUN - Hiçbir değişiklik yapılmadı'))
  }

  console.log('')
}

if (require.main === module) {
  main()
}

module.exports = {
  computeNextVersion,
  bumpPatch,
  finalizeCurrentSchemaManifest,
  getRangeFolder,
  releaseTargets,
  VersionManager,
  loadVersionPolicy
}
