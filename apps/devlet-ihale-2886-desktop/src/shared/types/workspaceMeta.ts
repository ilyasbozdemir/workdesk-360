export interface WorkspaceMeta {
  dtal_version: string
  app_version: string
  created_at: string
  institution: string
  schema_version: number
  platform: string
  file_version: number
  active_db_file?: string
  updated_at?: string
  last_user_mutation_at?: string
  integrity_hash?: string
  project_id?: string
  data_revision?: number
  last_backup_id?: string | null
  warnings?: string[]
}

/**
 * RFC 4122 Standard UUID Namespace for Temin 360 Projects.
 * Canonical namespace ensures interoperability and consistent derivation.
 */
export const TEMIN360_PROJECT_NAMESPACE = '7e31fee6-42db-2519-a154-c0acd01a5891'

/**
 * Standard RFC 3174 SHA-1 digest calculation.
 * Isomorphic, self-contained implementation with zero external dependencies.
 */
function sha1Bytes(bytes: Uint8Array): Uint8Array {
  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  const len = bytes.length
  const bitLen = len * 8
  const padLen = len % 64 < 56 ? 56 - (len % 64) : 120 - (len % 64)
  const totalLen = len + padLen + 8
  const padded = new Uint8Array(totalLen)
  padded.set(bytes)
  padded[len] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(totalLen - 4, bitLen >>> 0, false)
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false)

  const w = new Uint32Array(80)

  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = view.getUint32(i + t * 4, false)
    }
    for (let t = 16; t < 80; t++) {
      const val = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]
      w[t] = (val << 1) | (val >>> 31)
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4

    for (let t = 0; t < 80; t++) {
      let f = 0
      let k = 0
      if (t < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (t < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[t]) | 0
      e = d
      d = c
      c = (b << 30) | (b >>> 2)
      b = a
      a = temp
    }

    h0 = (h0 + a) | 0
    h1 = (h1 + b) | 0
    h2 = (h2 + c) | 0
    h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0
  }

  const result = new Uint8Array(20)
  const resView = new DataView(result.buffer)
  resView.setUint32(0, h0, false)
  resView.setUint32(4, h1, false)
  resView.setUint32(8, h2, false)
  resView.setUint32(12, h3, false)
  resView.setUint32(16, h4, false)
  return result
}

/**
 * Generates an RFC 4122 Version 5 (SHA-1 based) UUID from a name and namespace.
 * Conforms strictly to RFC 4122 Section 4.3.
 */
export function generateUuidV5(
  name: string,
  namespace: string = TEMIN360_PROJECT_NAMESPACE
): string {
  const cleanNs = namespace.replace(/-/g, '')
  const nsBytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    nsBytes[i] = parseInt(cleanNs.substr(i * 2, 2), 16)
  }

  const nameBytes = new TextEncoder().encode(name)
  const combined = new Uint8Array(nsBytes.length + nameBytes.length)
  combined.set(nsBytes)
  combined.set(nameBytes, nsBytes.length)

  const hash = sha1Bytes(combined)

  // RFC 4122 v5: Set version 5 (0x50) in octet 6
  hash[6] = (hash[6] & 0x0f) | 0x50
  // RFC 4122 variant: Set variant 1 (0x80) in octet 8
  hash[8] = (hash[8] & 0x3f) | 0x80

  let hex = ''
  for (let i = 0; i < 16; i++) {
    hex += hash[i].toString(16).padStart(2, '0')
  }

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-')
}

/**
 * Generates an RFC 4122 UUID v5 identifier for legacy workspaces without project_id.
 * Completely deterministic and independent of local file paths or filenames.
 * Ensures that two computers opening the exact same legacy project derive the IDENTICAL project_id.
 */
export function deriveDeterministicProjectId(
  institution?: string,
  createdAt?: string,
  discriminator?: string
): string {
  const cleanInst = (institution || 'DefaultInstitution').trim().toLowerCase()
  const cleanDate = (createdAt || '2026-01-01').trim()
  const cleanDisc = (discriminator || '').trim().toLowerCase()
  const seed = cleanDisc
    ? `temin360:proj:${cleanInst}:${cleanDate}:${cleanDisc}`
    : `temin360:proj:${cleanInst}:${cleanDate}`

  return generateUuidV5(seed, TEMIN360_PROJECT_NAMESPACE)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeMeta(raw: any, discriminator?: string): WorkspaceMeta {
  const institution = raw?.institution || raw?.institutionName || 'Bilinmeyen Kurum'
  const createdAt =
    raw?.created_at ||
    (raw?.createdAt ? raw.createdAt.split('T')[0] : new Date().toISOString().split('T')[0])
  const effectiveDiscriminator =
    discriminator ||
    raw?.project_name ||
    raw?.projectName ||
    raw?.title ||
    raw?.subject ||
    raw?.konu ||
    raw?.temin_no

  return {
    dtal_version: raw?.dtal_version || raw?.dtm_version || '1.0',
    app_version: raw?.app_version || raw?.version || '1.0.0',
    created_at: createdAt,
    institution,
    schema_version: parseInt(raw?.schema_version || raw?.schemaVersion || '1', 10) || 1,
    platform: raw?.platform || (typeof process !== 'undefined' ? process.platform : 'win32'),
    file_version: raw?.file_version || parseInt(raw?.fileVersion || '1', 10) || 1,
    active_db_file: raw?.active_db_file || 'database.sqlite',
    updated_at: raw?.updated_at || raw?.updatedAt || new Date().toISOString(),
    last_user_mutation_at:
      raw?.last_user_mutation_at ||
      raw?.lastUserMutationAt ||
      raw?.updated_at ||
      new Date().toISOString(),
    integrity_hash: raw?.integrity_hash,
    project_id:
      raw?.project_id ||
      raw?.projectId ||
      deriveDeterministicProjectId(institution, createdAt, effectiveDiscriminator),
    data_revision:
      typeof raw?.data_revision === 'number'
        ? raw.data_revision
        : typeof raw?.dataRevision === 'number'
          ? raw.dataRevision
          : 1,
    last_backup_id: raw?.last_backup_id || raw?.lastBackupId || null,
    warnings: []
  }
}

export function calculateIntegrityHash(meta: Partial<WorkspaceMeta>): string {
  const payload = {
    dtal_version: meta.dtal_version,
    app_version: meta.app_version,
    schema_version: meta.schema_version,
    created_at: meta.created_at,
    institution: meta.institution,
    platform: meta.platform,
    project_id: meta.project_id,
    data_revision: meta.data_revision
  }
  const str = JSON.stringify(payload)
  // Simple hex hash calculation compatible with both Node and Web
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}
