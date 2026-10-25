/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * TEMİN 360 - Merkezi Sürüm Yöneticisi (Version Manager)
 *
 * Bu modül SemVer uyumlu sürüm ayrıştırma, karşılaştırma, kanal yönetimi,
 * sonraki sürüm hesaplama ve updater doğrulama kurallarını tek bir merkezde toplar.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { createRequire } from 'module'

export type Channel = 'alpha' | 'beta' | 'rc' | 'stable'

export interface ChannelMeta {
  name: string
  label: string
  header: string
  description: string
  isPrerelease: boolean
}

export interface VersionPolicy {
  versioning: {
    scheme: 'semver'
    channels: Channel[]
    channelOrder: Record<Channel, number>
    defaultChannel: Channel
    tagPrefix: string
    prerelease: {
      allowAutoUpdate: boolean
      allowChannelUpgrade: boolean
      allowChannelDowngrade: boolean
    }
    channelMeta: Record<Channel, ChannelMeta>
  }
}

export interface ParsedVersion {
  raw: string
  hasPrefix: boolean
  major: number
  minor: number
  patch: number
  channel: Channel
  iteration: number
  isPrerelease: boolean
  baseVersion: string
}

export interface ComputeVersionOptions {
  channel?: Channel | string
  rc?: boolean
  patch?: boolean
  policy?: VersionPolicy
}

export interface UpdateEligibility {
  eligible: boolean
  reason: string
}

/**
 * Merkezi varsayılan sürüm politikası (Fallback)
 */
export const DEFAULT_VERSION_POLICY: VersionPolicy = {
  versioning: {
    scheme: 'semver',
    channels: ['alpha', 'beta', 'rc', 'stable'],
    channelOrder: {
      alpha: 1,
      beta: 2,
      rc: 3,
      stable: 4
    },
    defaultChannel: 'rc',
    tagPrefix: 'v',
    prerelease: {
      allowAutoUpdate: true,
      allowChannelUpgrade: true,
      allowChannelDowngrade: false
    },
    channelMeta: {
      alpha: {
        name: 'Alpha',
        label: 'Geliştirici / Alpha Sürümü',
        header: '🚀 **TEMİN 360 {tag} (Geliştirici / Alpha Sürümü)**',
        description: 'Geliştirme aşamasındaki deneysel sürümdür.',
        isPrerelease: true
      },
      beta: {
        name: 'Beta',
        label: 'Erken Erişim (Early Access)',
        header: '🚀 **TEMİN 360 {tag} (Erken Erişim / Early Access)**',
        description: 'Bu sürümdeki en son değişiklikler ve geliştirmeler aşağıda listelenmiştir.',
        isPrerelease: true
      },
      rc: {
        name: 'Release Candidate',
        label: 'Sürüm Adayı (Release Candidate)',
        header: '🎯 **TEMİN 360 {tag} (Sürüm Adayı / Release Candidate)**',
        description:
          'Kararlı sürüm öncesi test ve doğrulama sürümüdür. Bu sürümdeki değişiklikler aşağıda listelenmiştir.',
        isPrerelease: true
      },
      stable: {
        name: 'Stable',
        label: 'Kararlı Sürüm',
        header: '⚖️ **TEMİN 360 {tag} (Kararlı Sürüm)**',
        description: 'Kamu Harcama, İhale, Doğrudan Temin ve Hakediş Yönetim Sistemi.',
        isPrerelease: false
      }
    }
  }
}

function getCurrentDir(): string {
  if (typeof __dirname !== 'undefined') {
    return __dirname
  }
  try {
    // Windows path fix: /D:/path -> D:/path
    const urlPath = new URL(import.meta.url).pathname
    return path.dirname(urlPath.replace(/^\/([a-zA-Z]:)/, '$1'))
  } catch {
    return process.cwd()
  }
}

/**
 * Yüklenen sürüm politikasının tüm zorunlu alanlarını doğrular.
 * Eksik veya geçersiz bir alan varsa açık ve açıklayıcı bir hata fırlatır.
 */
export function validateVersionPolicy(policy: any): VersionPolicy {
  if (!policy || typeof policy !== 'object') {
    throw new Error('Geçersiz sürüm politikası: Yapılandırma nesnesi bulunamadı.')
  }

  const v = policy.versioning
  if (!v || typeof v !== 'object') {
    throw new Error('Geçersiz sürüm politikası: "versioning" yapılandırma bloğu eksik.')
  }

  if (v.scheme !== 'semver') {
    throw new Error(`Desteklenmeyen sürüm şeması: "${v.scheme}". Yalnızca "semver" desteklenir.`)
  }

  if (!Array.isArray(v.channels) || v.channels.length === 0) {
    throw new Error('Geçersiz sürüm politikası: "versioning.channels" geçerli bir dizi olmalıdır.')
  }

  if (!v.channelOrder || typeof v.channelOrder !== 'object') {
    throw new Error('Geçersiz sürüm politikası: "versioning.channelOrder" nesnesi eksik.')
  }

  for (const ch of v.channels) {
    if (typeof v.channelOrder[ch] !== 'number') {
      throw new Error(
        `Geçersiz sürüm politikası: "${ch}" kanalı için "channelOrder" sıralaması tanımlanmamış.`
      )
    }
  }

  if (!v.defaultChannel || !v.channels.includes(v.defaultChannel)) {
    throw new Error(
      `Geçersiz varsayılan kanal: "${v.defaultChannel}". Tanımlı kanallardan biri olmalıdır: ${v.channels.join(', ')}`
    )
  }

  if (typeof v.tagPrefix !== 'string' || v.tagPrefix.length === 0) {
    throw new Error(
      'Geçersiz sürüm politikası: "versioning.tagPrefix" geçerli ve boş olmayan bir dize olmalıdır.'
    )
  }

  if (!v.prerelease || typeof v.prerelease !== 'object') {
    throw new Error('Geçersiz sürüm politikası: "versioning.prerelease" yapılandırması eksik.')
  }

  if (typeof v.prerelease.allowChannelUpgrade !== 'boolean') {
    throw new Error(
      'Geçersiz sürüm politikası: "versioning.prerelease.allowChannelUpgrade" boolean olmalıdır.'
    )
  }

  if (typeof v.prerelease.allowChannelDowngrade !== 'boolean') {
    throw new Error(
      'Geçersiz sürüm politikası: "versioning.prerelease.allowChannelDowngrade" boolean olmalıdır.'
    )
  }

  if (typeof v.prerelease.allowAutoUpdate !== 'boolean') {
    throw new Error(
      'Geçersiz sürüm politikası: "versioning.prerelease.allowAutoUpdate" boolean olmalıdır.'
    )
  }

  if (!v.channelMeta || typeof v.channelMeta !== 'object') {
    throw new Error('Geçersiz sürüm politikası: "versioning.channelMeta" nesnesi eksik.')
  }

  for (const ch of v.channels) {
    const meta = v.channelMeta[ch]
    if (!meta || typeof meta.header !== 'string' || typeof meta.description !== 'string') {
      throw new Error(
        `Geçersiz sürüm politikası: "${ch}" kanalı için meta veriler (header, description) eksik.`
      )
    }
  }

  return policy as VersionPolicy
}

function findGitRoot(startDir: string): string | null {
  let curr = startDir
  while (curr && curr !== path.dirname(curr)) {
    if (
      fs.existsSync(path.join(curr, '.git')) ||
      fs.existsSync(path.join(curr, 'pnpm-workspace.yaml'))
    ) {
      return curr
    }
    curr = path.dirname(curr)
  }
  return null
}

function getYamlParser(): any {
  if (typeof require !== 'undefined') {
    try {
      return require('js-yaml')
    } catch {
      // ignore
    }
  }

  const baseDir = getCurrentDir()
  const gitRoot = findGitRoot(baseDir) || findGitRoot(process.cwd()) || process.cwd()
  const candidateDirs = [
    baseDir,
    path.resolve(baseDir, '../../../'),
    path.resolve(gitRoot, 'apps/app-desktop'),
    path.resolve(gitRoot, 'packages/database'),
    gitRoot
  ]

  let reqFn: any = null
  let reqResolve: any = null

  if (typeof require !== 'undefined') {
    reqFn = require
    reqResolve = require.resolve.bind(require)
  } else {
    try {
      const req = createRequire(import.meta.url)
      reqFn = req
      reqResolve = req.resolve.bind(req)
    } catch {
      // ignore
    }
  }

  if (reqFn && reqResolve) {
    for (const dir of candidateDirs) {
      try {
        const resolved = reqResolve('js-yaml', { paths: [dir] })
        const loaded = reqFn(resolved)
        if (loaded && typeof loaded.load === 'function') {
          return loaded
        }
      } catch {
        // try next directory
      }
    }
  }

  return null
}

export interface LoadVersionPolicyOptions {
  /**
   * Eğer politika dosyası hiçbir aday konumda bulunamazsa DEFAULT_VERSION_POLICY'ye geri dönülsün mü?
   * Varsayılan: false (sessizce varsayılana dönmeyi engeller, açık hata fırlatır).
   */
  fallbackToDefault?: boolean
}

/**
 * YAML veya JSON dosyasından sürüm politikasını yükler ve doğrular.
 * - Dosya bulunamazsa açık hata fırlatır (sessizce varsayılana geri dönmez, fallbackToDefault: true hariç).
 * - Dosya mevcutsa ancak bozuk/geçersizse açık hata fırlatır.
 */
export function loadVersionPolicy(
  customPathOrOptions?: string | LoadVersionPolicyOptions,
  maybeOptions?: LoadVersionPolicyOptions
): VersionPolicy {
  let customPath: string | undefined
  let options: LoadVersionPolicyOptions = {}

  if (typeof customPathOrOptions === 'string') {
    customPath = customPathOrOptions
    if (maybeOptions) options = maybeOptions
  } else if (customPathOrOptions && typeof customPathOrOptions === 'object') {
    options = customPathOrOptions
  }

  const yamlLib = getYamlParser()
  if (!yamlLib || typeof yamlLib.load !== 'function') {
    throw new Error('YAML ayrıştırıcı (js-yaml) yüklenemedi.')
  }

  if (customPath) {
    if (!fs.existsSync(customPath)) {
      if (options.fallbackToDefault) {
        return DEFAULT_VERSION_POLICY
      }
      throw new Error(`Belirtilen sürüm politikası dosyası bulunamadı: "${customPath}"`)
    }
    const content = fs.readFileSync(customPath, 'utf-8')
    const loaded = yamlLib.load(content)
    return validateVersionPolicy(loaded)
  }

  const baseDir = getCurrentDir()
  const gitRoot = findGitRoot(baseDir) || findGitRoot(process.cwd())

  const candidatePaths: string[] = []

  // 1. Monorepo kök dizini (Tek Doğruluk Kaynağı / Single Source of Truth)
  if (gitRoot) {
    candidatePaths.push(path.join(gitRoot, 'version-policy.yaml'))
    candidatePaths.push(path.join(gitRoot, 'apps/app-desktop/resources/version-policy.yaml'))
  }

  candidatePaths.push(path.resolve(process.cwd(), 'version-policy.yaml'))
  candidatePaths.push(path.resolve(process.cwd(), 'resources/version-policy.yaml'))
  candidatePaths.push(path.resolve(baseDir, '../../../../../version-policy.yaml'))
  candidatePaths.push(path.resolve(baseDir, '../../../resources/version-policy.yaml'))

  // 2. Electron packaged resources dizini
  if (typeof process !== 'undefined' && (process as any).resourcesPath) {
    candidatePaths.push(path.join((process as any).resourcesPath, 'version-policy.yaml'))
    candidatePaths.push(
      path.join((process as any).resourcesPath, 'resources', 'version-policy.yaml')
    )
  }

  // 3. Electron app path
  try {
    if (typeof process !== 'undefined' && (process as any).type) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { app } = require('electron')
      if (app && typeof app.getAppPath === 'function') {
        const appPath = app.getAppPath()
        candidatePaths.push(path.join(appPath, 'version-policy.yaml'))
        candidatePaths.push(path.join(appPath, 'resources', 'version-policy.yaml'))
        candidatePaths.push(path.join(path.dirname(appPath), 'version-policy.yaml'))
        candidatePaths.push(path.join(path.dirname(appPath), 'resources', 'version-policy.yaml'))
      }
    }
  } catch {
    // ignore
  }

  const uniqueCandidatePaths = Array.from(new Set(candidatePaths))

  for (const p of uniqueCandidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8')
        const loaded = yamlLib.load(content)
        return validateVersionPolicy(loaded)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`[VersionManager] Politika dosyası (${p}) bozuk veya geçersiz: ${msg}`)
      }
    }
  }

  if (options.fallbackToDefault) {
    return DEFAULT_VERSION_POLICY
  }

  const checkedList = uniqueCandidatePaths.map((p) => `  - ${p}`).join('\n')
  throw new Error(
    `[VersionManager] Sürüm politikası dosyası (version-policy.yaml) bulunamadı.\n` +
      `Uygulamanın yapılandırma dosyası eksik olduğunda sessizce varsayılan ayarlarla çalışması engellenmiştir.\n` +
      `Kontrol edilen aday konumlar:\n${checkedList}`
  )
}

/**
 * SemVer formatında sürüm dizesini ayrıştırır.
 * Biçim: MAJOR.MINOR.PATCH[-KANAL.SIRA] (örn: 1.0.0-rc.1, v1.0.0-beta.256, 1.0.0)
 */
export function parseVersion(
  versionStr: string,
  policy: VersionPolicy = DEFAULT_VERSION_POLICY
): ParsedVersion {
  if (!versionStr || typeof versionStr !== 'string') {
    throw new Error('Geçersiz versiyon: Boş veya string olmayan değer verildi.')
  }

  const trimmed = versionStr.trim()
  const hasPrefix = trimmed.startsWith('v') || trimmed.startsWith('V')
  const clean = hasPrefix ? trimmed.slice(1) : trimmed

  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+)\.(\d+))?$/
  const match = clean.match(semverRegex)

  if (!match) {
    throw new Error(
      `Desteklenmeyen veya geçersiz sürüm formatı: "${versionStr}". Beklenen format: MAJOR.MINOR.PATCH[-KANAL.SIRA] (örn: 1.0.0-rc.1)`
    )
  }

  const major = parseInt(match[1], 10)
  const minor = parseInt(match[2], 10)
  const patch = parseInt(match[3], 10)
  const rawChannel = match[4]?.toLowerCase()
  const rawIteration = match[5] ? parseInt(match[5], 10) : 0

  let channel: Channel = 'stable'
  let iteration = 0
  let isPrerelease = false

  if (rawChannel) {
    const validChannels = policy.versioning.channels
    if (!validChannels.includes(rawChannel as Channel)) {
      throw new Error(
        `Geçersiz veya desteklenmeyen sürüm kanalı: "${rawChannel}". İzin verilen kanallar: ${validChannels.join(', ')}`
      )
    }
    channel = rawChannel as Channel
    iteration = rawIteration
    isPrerelease = true
  }

  return {
    raw: trimmed,
    hasPrefix,
    major,
    minor,
    patch,
    channel,
    iteration,
    isPrerelease,
    baseVersion: `${major}.${minor}.${patch}`
  }
}

/**
 * Güvenli ayrıştırma (hata fırlatmaz, geçersizse null döner)
 */
export function tryParseVersion(
  versionStr: string,
  policy: VersionPolicy = DEFAULT_VERSION_POLICY
): ParsedVersion | null {
  try {
    return parseVersion(versionStr, policy)
  } catch {
    return null
  }
}

/**
 * Sürüm dizesinin geçerli olup olmadığını doğrular
 */
export function isValidVersion(
  versionStr: string,
  policy: VersionPolicy = DEFAULT_VERSION_POLICY
): boolean {
  return tryParseVersion(versionStr, policy) !== null
}

/**
 * İki sürümü SemVer kurallarına göre karşılaştırır.
 *
 * Sıralama Kuralları:
 * 1. MAJOR, MINOR, PATCH sayısal karşılaştırılır.
 * 2. Temel sürüm aynıysa: Stable sürüm (`1.0.0`), prerelease sürümlerden (`1.0.0-rc.1`) büyüktür.
 * 3. Her ikisi de prerelease ise: Kanal önceliği `alpha < beta < rc` karşılaştırılır.
 * 4. Kanallar aynıysa: İterasyon numarası sayısal karşılaştırılır (`beta.10 > beta.9`).
 *
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2
 */
export function compareVersions(
  v1: string | ParsedVersion,
  v2: string | ParsedVersion,
  policy: VersionPolicy = DEFAULT_VERSION_POLICY
): number {
  const p1 = typeof v1 === 'string' ? parseVersion(v1, policy) : v1
  const p2 = typeof v2 === 'string' ? parseVersion(v2, policy) : v2

  // 1. Major karşılaştırması
  if (p1.major !== p2.major) {
    return p1.major > p2.major ? 1 : -1
  }

  // 2. Minor karşılaştırması
  if (p1.minor !== p2.minor) {
    return p1.minor > p2.minor ? 1 : -1
  }

  // 3. Patch karşılaştırması
  if (p1.patch !== p2.patch) {
    return p1.patch > p2.patch ? 1 : -1
  }

  // 4. Temel sürüm aynı (Major.Minor.Patch eşit)
  // Durum A: Biri stable, biri prerelease ise Stable > Prerelease
  if (!p1.isPrerelease && p2.isPrerelease) {
    return 1
  }
  if (p1.isPrerelease && !p2.isPrerelease) {
    return -1
  }

  // Durum B: Her ikisi de stable
  if (!p1.isPrerelease && !p2.isPrerelease) {
    return 0
  }

  // Durum C: Her ikisi de prerelease
  const order = policy.versioning.channelOrder
  const p1Rank = order[p1.channel] || 0
  const p2Rank = order[p2.channel] || 0

  if (p1Rank !== p2Rank) {
    return p1Rank > p2Rank ? 1 : -1
  }

  // Kanallar aynı: İterasyon numarası sayısal karşılaştırılır (örn: rc.10 > rc.9)
  if (p1.iteration !== p2.iteration) {
    return p1.iteration > p2.iteration ? 1 : -1
  }

  return 0
}

/**
 * Verilen mevcut sürüm ve seçeneklere göre sonraki sürümü dinamik olarak hesaplar.
 */
export function computeNextVersion(
  currentVersionStr: string,
  options: ComputeVersionOptions = {}
): string {
  const policy = options.policy || loadVersionPolicy()
  const current = parseVersion(currentVersionStr, policy)

  // Hedef kanal belirleme
  let targetChannel: Channel = policy.versioning.defaultChannel

  if (options.channel) {
    const rawChan = options.channel.toLowerCase().trim() as Channel
    if (!policy.versioning.channels.includes(rawChan)) {
      throw new Error(
        `Geçersiz hedef kanal: "${options.channel}". İzin verilen kanallar: ${policy.versioning.channels.join(', ')}`
      )
    }
    targetChannel = rawChan
  } else if (options.rc) {
    targetChannel = 'rc'
  } else if (options.patch) {
    // --patch tek başına verildiğinde mevcut kanalı koru
    targetChannel = current.channel
  }

  const order = policy.versioning.channelOrder
  const currentRank = order[current.channel]
  const targetRank = order[targetChannel]

  // Kanal düşürme kuralı: Prerelease kanalları arasında hedef kanal mevcut kanaldan daha düşükse denetlenir (örn: rc -> beta)
  if (
    current.channel !== 'stable' &&
    targetRank < currentRank &&
    !policy.versioning.prerelease.allowChannelDowngrade
  ) {
    throw new Error(
      `Kanal düşürme engellendi: "${current.channel}" kanalından daha düşük bir kanal olan "${targetChannel}" kanalına geçişe izin verilmiyor.`
    )
  }

  // Kanal yükseltme kuralı: Hedef kanal mevcut kanaldan daha yüksekse denetlenir
  if (targetRank > currentRank && !policy.versioning.prerelease.allowChannelUpgrade) {
    throw new Error(
      `Kanal yükseltme engellendi: "${current.channel}" kanalından daha yüksek bir kanal olan "${targetChannel}" kanalına geçişe izin verilmiyor.`
    )
  }

  // Senaryo 1: Mevcut sürüm zaten Stable (Örn: 1.0.0)
  if (current.channel === 'stable') {
    if (targetChannel === 'stable') {
      // 1.0.0 + stable/patch -> 1.0.1
      return `${current.major}.${current.minor}.${current.patch + 1}`
    } else {
      // 1.0.0 + alpha/beta/rc -> bir sonraki patch'in prerelease'i (1.0.1-rc.1)
      return `${current.major}.${current.minor}.${current.patch + 1}-${targetChannel}.1`
    }
  }

  // Senaryo 2: Hedef kanal Stable (Örn: 1.0.0-rc.2 + stable -> 1.0.0)
  if (targetChannel === 'stable') {
    return current.baseVersion
  }

  // Senaryo 3: Aynı kanal içinde iterasyon artışı (Örn: 1.0.0-beta.256 -> 1.0.0-beta.257, 1.0.0-rc.1 -> 1.0.0-rc.2)
  if (current.channel === targetChannel) {
    return `${current.baseVersion}-${targetChannel}.${current.iteration + 1}`
  }

  // Senaryo 4: Kanal geçişi (Örn: alpha -> beta, beta -> rc)
  return `${current.baseVersion}-${targetChannel}.1`
}

/**
 * Geriye dönük uyumluluk patch artışı
 */
export function bumpPatch(
  versionStr: string,
  policy: VersionPolicy = DEFAULT_VERSION_POLICY
): string {
  return computeNextVersion(versionStr, { patch: true, policy })
}

/**
 * Electron Updater: Gelen güncellemenin indirilmeye ve kurulmaya uygun olup olmadığını doğrular.
 */
export function isUpdateEligible(
  currentVersionStr: string,
  incomingVersionStr: string,
  policy: VersionPolicy = DEFAULT_VERSION_POLICY
): UpdateEligibility {
  const current = tryParseVersion(currentVersionStr, policy)
  if (!current) {
    return { eligible: false, reason: `Geçersiz mevcut sürüm formatı: "${currentVersionStr}"` }
  }

  const incoming = tryParseVersion(incomingVersionStr, policy)
  if (!incoming) {
    return { eligible: false, reason: `Geçersiz gelen sürüm formatı: "${incomingVersionStr}"` }
  }

  const order = policy.versioning.channelOrder
  const currentRank = order[current.channel] ?? 0
  const incomingRank = order[incoming.channel] ?? 0

  // 1. Kanal düşürme (Downgrade) kontrolü:
  // BaseVersion farklı olsa dahi (örn: 1.0.0 stable -> 1.0.1-rc.1 rc),
  // daha yüksek bir kanaldan daha düşük kanala geçişe allowChannelDowngrade kapalıysa ASLA izin verilmez.
  if (incomingRank < currentRank && !policy.versioning.prerelease.allowChannelDowngrade) {
    return {
      eligible: false,
      reason: `Kanal düşürme engellendi: ${current.channel} -> ${incoming.channel}`
    }
  }

  // 2. Kanal yükseltme (Upgrade) kontrolü:
  // Daha düşük seviyeli bir kanaldan daha yüksek seviyeli bir kanala geçişe (örn: beta -> rc)
  // allowChannelUpgrade kapalıysa izin verilmez.
  if (incomingRank > currentRank && !policy.versioning.prerelease.allowChannelUpgrade) {
    return {
      eligible: false,
      reason: `Kanal yükseltme engellendi: ${current.channel} -> ${incoming.channel}`
    }
  }

  // 3. Genel Sürüm Karşılaştırması
  const comparison = compareVersions(incoming, current, policy)
  if (comparison <= 0) {
    return {
      eligible: false,
      reason: `Gelen sürüm (${incoming.raw}) mevcut sürümden (${current.raw}) daha eski veya aynı.`
    }
  }

  return { eligible: true, reason: 'Geçerli yeni sürüm' }
}

/**
 * Verilen etiket için Changelog sürüm başlığını üretir
 */
export function getReleaseHeader(
  tag: string,
  policy: VersionPolicy = DEFAULT_VERSION_POLICY
): string {
  const parsed = tryParseVersion(tag, policy)
  const channel = parsed
    ? parsed.channel
    : tag.includes('rc')
      ? 'rc'
      : tag.includes('beta')
        ? 'beta'
        : 'stable'
  const meta = policy.versioning.channelMeta[channel] || policy.versioning.channelMeta.stable

  const header = meta.header.replace(/\{tag\}/g, tag)
  const desc = meta.description

  return `> ${header}\n> ${desc}`
}

/**
 * Git deposunda belirtilen etiketin mevcut olup olmadığını kontrol eder.
 * Git çalıştırılamazsa veya depo yolu geçersizse açıkça hata fırlatır (hatayı sessizce yok saymaz).
 */
export function checkTagExists(tag: string, cwd?: string): boolean {
  if (!tag || typeof tag !== 'string' || !tag.trim()) {
    throw new Error('Geçersiz etiket: Etiket adı boş veya string olmayan bir değer olamaz.')
  }
  const cleanTag = tag.trim()
  const gitCwd = cwd || path.resolve(getCurrentDir(), '../../../../..')
  try {
    const output = execSync(`git tag -l "${cleanTag}"`, {
      cwd: gitCwd,
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim()
    const list = output
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
    return list.includes(cleanTag)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Git etiket kontrolü başarısız oldu (depo: "${gitCwd}", etiket: "${tag}"): ${msg}`
    )
  }
}

/**
 * Release Notes üretimi için bir önceki geçerli Git etiketini bulur
 */
export function findPreviousTag(currentTag: string, cwd?: string): string {
  const gitCwd = cwd || path.resolve(getCurrentDir(), '../../../../..')
  try {
    const prev = execSync(`git describe --tags --abbrev=0 "${currentTag}^"`, {
      cwd: gitCwd,
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim()
    return prev
  } catch {
    return ''
  }
}

/**
 * VersionManager ana sınıfı
 */
export class VersionManager {
  private policy: VersionPolicy
  private cwd: string

  constructor(policyPath?: string, cwd?: string) {
    this.policy = loadVersionPolicy(policyPath)
    this.cwd = cwd || path.resolve(getCurrentDir(), '../../../../..')
  }

  getPolicy(): VersionPolicy {
    return this.policy
  }

  parse(versionStr: string): ParsedVersion {
    return parseVersion(versionStr, this.policy)
  }

  compare(v1: string | ParsedVersion, v2: string | ParsedVersion): number {
    return compareVersions(v1, v2, this.policy)
  }

  computeNext(currentVersionStr: string, options: ComputeVersionOptions = {}): string {
    return computeNextVersion(currentVersionStr, { ...options, policy: this.policy })
  }

  isEligible(currentVersionStr: string, incomingVersionStr: string): UpdateEligibility {
    return isUpdateEligible(currentVersionStr, incomingVersionStr, this.policy)
  }

  getHeader(tag: string): string {
    return getReleaseHeader(tag, this.policy)
  }

  tagExists(tag: string): boolean {
    return checkTagExists(tag, this.cwd)
  }

  getPreviousTag(currentTag: string): string {
    return findPreviousTag(currentTag, this.cwd)
  }
}

// CommonJS uyumluluk dışa aktarımı
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Channel: {} as any,
    DEFAULT_VERSION_POLICY,
    loadVersionPolicy,
    parseVersion,
    tryParseVersion,
    isValidVersion,
    compareVersions,
    computeNextVersion,
    bumpPatch,
    isUpdateEligible,
    getReleaseHeader,
    checkTagExists,
    findPreviousTag,
    VersionManager
  }
}
