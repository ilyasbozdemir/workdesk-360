#!/usr/bin/env node
/**
 * WorkDesk 360 - Schema Manifest Compiler & Synchronizer (YAML -> TypeScript)
 * 
 * Sorumluluk:
 *   YAML dosyalarını Tek Gerçeklik Kaynağı (Single Source of Truth - SSOT) olarak kabul eder.
 *   YAML'deki şema ve migration tanımlarını okuyarak ilgili .ts dosyalarını otomatik üretir.
 * 
 * Kullanım:
 *   node scripts/sync-manifests.mjs            # Tüm manifestleri YAML'den TS'ye derler ve senkronize eder
 *   node scripts/sync-manifests.mjs --check    # YAML ile TS arasında fark olup olmadığını kontrol eder (CI)
 *   node scripts/sync-manifests.mjs --propagate # beta.current'taki değişiklikleri aktif RC ve app manifestine de yayar
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// js-yaml yükle
function getYamlParser() {
  const req = createRequire(path.resolve(rootDir, 'packages/database/package.json'))
  return req('js-yaml')
}

const yaml = getYamlParser()

const schemaManifestDir = path.join(rootDir, 'packages', 'database', 'src', 'schema-manifest')

/**
 * JS nesnesini temiz TypeScript object literal formatına dönüştürür
 */
function toTsLiteral(obj, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel)
  const nextIndent = '  '.repeat(indentLevel + 1)

  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj)
  if (typeof obj === 'string') return JSON.stringify(obj)

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    // Basit string veya number dizileri tek satırda tutulabilir
    const allPrimitive = obj.every((item) => typeof item === 'string' || typeof item === 'number')
    if (allPrimitive && obj.length <= 4) {
      return `[${obj.map((item) => JSON.stringify(item)).join(', ')}]`
    }
    const items = obj.map((item) => `${nextIndent}${toTsLiteral(item, indentLevel + 1)}`).join(',\n')
    return `[\n${items}\n${indent}]`
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) return '{}'
    const entries = keys.map((key) => {
      // Güvenli anahtar adı kontrolü (tire, nokta veya boşluk içeriyorsa tırnak içine al)
      const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
      return `${nextIndent}${formattedKey}: ${toTsLiteral(obj[key], indentLevel + 1)}`
    })
    return `{\n${entries.join(',\n')}\n${indent}}`
  }

  return String(obj)
}

/**
 * Bir YAML dosyasını okuyup TypeScript içeriği üretir
 */
export function compileYamlToTs(yamlPath, options = {}) {
  const {
    namedExport,
    commentBanner,
    exportDefault = true
  } = options

  if (!fs.existsSync(yamlPath)) {
    throw new Error(`YAML dosyası bulunamadı: ${yamlPath}`)
  }

  const rawYaml = fs.readFileSync(yamlPath, 'utf8')
  const data = yaml.load(rawYaml)
  if (!data || typeof data !== 'object') {
    throw new Error(`Geçersiz YAML verisi: ${yamlPath}`)
  }

  const banner = commentBanner || `/**\n * OTOMATİK DERLENMİŞ ŞEMA MANİFESTİ\n * Kaynak: ${path.relative(rootDir, yamlPath).replace(/\\/g, '/')}\n * Lütfen doğrudan düzenlemeyin; YAML dosyasını güncelleyip 'pnpm manifest:sync' çalıştırın.\n */`

  let tsOutput = `/* eslint-disable */\n${banner}\n`

  if (namedExport) {
    tsOutput += `export const ${namedExport} = ${toTsLiteral(data)};\n`
    if (exportDefault) {
      tsOutput += `\nexport default ${namedExport};\n`
    }
  } else {
    tsOutput += `export default ${toTsLiteral(data)};\n`
  }

  return { data, tsOutput }
}

/**
 * Manifest eşlemeleri listesi
 */
function getManifestMappings() {
  const mappings = [
    // 1. beta.current
    {
      yamlPath: path.join(schemaManifestDir, '1.0.0-beta.current.yaml'),
      tsPath: path.join(schemaManifestDir, 'versions', 'beta.current.ts'),
      commentBanner: `/**\n * AKTİF GELİŞTİRME ŞEMA MANİFESTİ (Workdesk 360 Monorepo Suite)\n * Bu dosya 1.0.0-beta.current.yaml dosyasından otomatik derlenir.\n */`
    },
    // 2. Apps manifests
    {
      yamlPath: path.join(schemaManifestDir, 'apps', 'temin360', 'manifest.yaml'),
      tsPath: path.join(schemaManifestDir, 'apps', 'temin360', 'manifest.ts'),
      namedExport: 'temin360Manifest',
      commentBanner: `/**\n * TEMİN 360 (Doğrudan Temin - 4734 KİK Md. 22) Şema Manifesti\n * Bu dosya apps/temin360/manifest.yaml dosyasından otomatik derlenir.\n */`
    },
    {
      yamlPath: path.join(schemaManifestDir, 'apps', 'ihale360', 'manifest.yaml'),
      tsPath: path.join(schemaManifestDir, 'apps', 'ihale360', 'manifest.ts'),
      namedExport: 'ihale360Manifest',
      commentBanner: `/**\n * İHALE 360 (4734 Sayılı Kamu İhale Kanunu Md. 19 / 21) Şema Manifesti\n * Bu dosya apps/ihale360/manifest.yaml dosyasından otomatik derlenir.\n */`
    },
    {
      yamlPath: path.join(schemaManifestDir, 'apps', 'devlet-ihale-2886', 'manifest.yaml'),
      tsPath: path.join(schemaManifestDir, 'apps', 'devlet-ihale-2886', 'manifest.ts'),
      namedExport: 'devletIhale2886Manifest',
      commentBanner: `/**\n * DEVLET İHALE 2886 (2886 Sayılı Devlet İhale Kanunu) Şema Manifesti\n * Bu dosya apps/devlet-ihale-2886/manifest.yaml dosyasından otomatik derlenir.\n */`
    }
  ]

  // 3. RC Sürüm Manifestleri (yaml/rc/*.yaml -> versions/rc/*.ts)
  const yamlRcDir = path.join(schemaManifestDir, 'yaml', 'rc')
  const tsRcDir = path.join(schemaManifestDir, 'versions', 'rc')
  if (fs.existsSync(yamlRcDir)) {
    const rcFiles = fs.readdirSync(yamlRcDir).filter((f) => f.endsWith('.yaml'))
    for (const file of rcFiles) {
      // 1.0.0-rc.12.yaml -> rc.12.ts
      const match = file.match(/^1\.0\.0-rc\.(\d+)\.yaml$/)
      if (match) {
        const rcNum = match[1]
        mappings.push({
          yamlPath: path.join(yamlRcDir, file),
          tsPath: path.join(tsRcDir, `rc.${rcNum}.ts`),
          commentBanner: `/**\n * RC SÜRÜM ŞEMA MANİFESTİ (1.0.0-rc.${rcNum})\n * Bu dosya yaml/rc/${file} dosyasından otomatik derlenir.\n */`
        })
      }
    }
  }

  return mappings
}

/**
 * Aktif sürüm yayılımı (beta.current -> aktif rc ve app manifesti)
 */
function propagateCurrentManifest() {
  const currentYamlPath = path.join(schemaManifestDir, '1.0.0-beta.current.yaml')
  if (!fs.existsSync(currentYamlPath)) return

  const currentData = yaml.load(fs.readFileSync(currentYamlPath, 'utf8'))
  if (!currentData || !currentData.apps) return

  const teminVersion = currentData.apps['temin360-desktop']
  if (!teminVersion) return

  console.log(`\x1b[36m🔄 [sync-manifests] Aktif beta.current şeması (max: ${currentData.schema_max}) hedeflere aktarılıyor...\x1b[0m`)

  // 1. apps/temin360/manifest.yaml güncelle
  const teminYamlPath = path.join(schemaManifestDir, 'apps', 'temin360', 'manifest.yaml')
  if (fs.existsSync(teminYamlPath)) {
    const teminData = yaml.load(fs.readFileSync(teminYamlPath, 'utf8')) || {}
    teminData.version = teminVersion
    teminData.schema_max = currentData.schema_max
    teminData.release_date = currentData.release_date
    teminData.changes = currentData.changes
    fs.writeFileSync(teminYamlPath, yaml.dump(teminData, { indent: 2, lineWidth: -1 }), 'utf8')
    console.log(`  ✔ Güncellendi: apps/temin360/manifest.yaml`)
  }

  // 2. Aktif RC YAML güncelle (örn. 1.0.0-rc.12.yaml)
  if (teminVersion.includes('-rc.')) {
    const rcYamlPath = path.join(schemaManifestDir, 'yaml', 'rc', `${teminVersion}.yaml`)
    if (fs.existsSync(rcYamlPath)) {
      const rcData = yaml.load(fs.readFileSync(rcYamlPath, 'utf8')) || {}
      rcData.app = teminVersion
      rcData.apps = currentData.apps
      rcData.schema_max = currentData.schema_max
      rcData.release_date = currentData.release_date
      rcData.changes = currentData.changes
      fs.writeFileSync(rcYamlPath, yaml.dump(rcData, { indent: 2, lineWidth: -1 }), 'utf8')
      console.log(`  ✔ Güncellendi: yaml/rc/${teminVersion}.yaml`)
    }
  }
}

/**
 * Ana yürütme
 */
function main() {
  const args = process.argv.slice(2)
  const isCheck = args.includes('--check')
  const isPropagate = args.includes('--propagate')

  if (isPropagate) {
    propagateCurrentManifest()
  }

  const mappings = getManifestMappings()
  let diffCount = 0
  let updatedCount = 0

  for (const mapping of mappings) {
    if (!fs.existsSync(mapping.yamlPath)) continue

    const { tsOutput } = compileYamlToTs(mapping.yamlPath, mapping)
    const relYaml = path.relative(rootDir, mapping.yamlPath).replace(/\\/g, '/')
    const relTs = path.relative(rootDir, mapping.tsPath).replace(/\\/g, '/')

    const existingTs = fs.existsSync(mapping.tsPath) ? fs.readFileSync(mapping.tsPath, 'utf8') : null

    // Normalize satır sonları karşılaştırması
    const normalizedNew = tsOutput.replace(/\r\n/g, '\n').trim()
    const normalizedOld = existingTs ? existingTs.replace(/\r\n/g, '\n').trim() : ''

    if (normalizedNew !== normalizedOld) {
      if (isCheck) {
        console.error(`\x1b[31m✖ [sync-manifests] Uyumsuzluk: ${relTs} dosyası ${relYaml} ile senkron değil!\x1b[0m`)
        diffCount++
      } else {
        fs.mkdirSync(path.dirname(mapping.tsPath), { recursive: true })
        fs.writeFileSync(mapping.tsPath, tsOutput, 'utf8')
        console.log(`\x1b[32m✔ [sync-manifests] Derlendi: ${relYaml} -> ${relTs}\x1b[0m`)
        updatedCount++
      }
    }
  }

  if (isCheck) {
    if (diffCount > 0) {
      console.error(`\x1b[31m\n❌ Toplam ${diffCount} manifest dosyası senkronize değil! 'pnpm manifest:sync' komutunu çalıştırın.\x1b[0m\n`)
      process.exit(1)
    } else {
      console.log(`\x1b[32m✔ [sync-manifests] Tüm manifest TypeScript dosyaları YAML kaynaklarıyla tamamen uyumlu.\x1b[0m`)
      process.exit(0)
    }
  } else {
    if (updatedCount > 0) {
      console.log(`\x1b[32m\n✨ Başarılı: ${updatedCount} adet TypeScript manifest dosyası güncellendi.\x1b[0m\n`)
    } else {
      console.log(`\x1b[32m✔ [sync-manifests] Tüm manifest dosyaları zaten güncel ve senkronize.\x1b[0m`)
    }
  }
}

main()

