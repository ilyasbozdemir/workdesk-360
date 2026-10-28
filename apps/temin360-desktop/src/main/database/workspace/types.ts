import crypto from 'crypto'
import Database from 'better-sqlite3'
import { TABLE_FRIENDLY_NAMES } from '../../../shared/constants/databaseConstants'

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
  is_read_only?: boolean
  is_tampered?: boolean
  tamper_reason?: string
}

export interface MutationSummaryItem {
  tableName: string
  title: string
  action: 'insert' | 'update' | 'delete' | 'other'
  actionLabel: string
  count: number
  lastTime: string
}

export { TABLE_FRIENDLY_NAMES }

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
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

import { deriveDeterministicProjectId } from '../../../shared/types/workspaceMeta'
export { deriveDeterministicProjectId }

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
    raw?.temin_no ||
    raw?.file_name ||
    raw?.fileName

  return {
    dtal_version: raw?.dtal_version || raw?.dtm_version || '1.0',
    app_version: raw?.app_version || raw?.version || '1.0.0',
    created_at: createdAt,
    institution,
    schema_version: parseInt(raw?.schema_version || raw?.schemaVersion || '1', 10) || 1,
    platform: raw?.platform || process.platform,
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

export { extractTableAndAction } from '../../ipc/utils/sqlGuard'

export function extractDbInfo(
  sqliteFilePath: string,
  fallbackName?: string
): { schemaVersion: number; institutionName: string; projectDifferentiator?: string } {
  let schemaVersion = 1
  let institutionName = fallbackName || 'Bilinmeyen Kurum'
  let projectDifferentiator: string | undefined = undefined
  try {
    const tempDb = new Database(sqliteFilePath, { readonly: true })
    try {
      const row = tempDb
        .prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'")
        .get() as { value: string } | undefined
      if (row?.value) {
        const parsed = parseInt(row.value, 10)
        if (!isNaN(parsed) && parsed > 0) {
          schemaVersion = parsed
        }
      } else {
        const migRow = tempDb
          .prepare('SELECT MAX(version) as max_v FROM schema_migrations')
          .get() as { max_v: number } | undefined
        if (migRow?.max_v && migRow.max_v > 0) {
          schemaVersion = migRow.max_v
        }
      }
    } catch {
      // settings / schema_migrations tablosu yoksa varsayilan 1
    }

    try {
      const instRow = tempDb
        .prepare("SELECT value FROM settings WHERE key = 'institutionName'")
        .get() as { value: string } | undefined
      if (instRow?.value && instRow.value.trim()) {
        institutionName = instRow.value.trim()
      }
    } catch {
      // institutionName yoksa fallbackName
    }

    try {
      const dossierRow = tempDb
        .prepare('SELECT id, temin_no, konu FROM DATA_TeminDosyasi ORDER BY id LIMIT 1')
        .get() as { id?: number; temin_no?: string; konu?: string } | undefined
      if (dossierRow) {
        projectDifferentiator =
          dossierRow.konu ||
          dossierRow.temin_no ||
          (dossierRow.id ? `dosya_${dossierRow.id}` : undefined)
      }
    } catch {
      // DATA_TeminDosyasi may not exist yet
    }

    tempDb.close()
  } catch (e) {
    console.warn('[Workspace] DB bilgileri okunurken uyari:', e)
  }
  return {
    schemaVersion,
    institutionName,
    projectDifferentiator: projectDifferentiator || fallbackName
  }
}
