import { auditColumns, auditColumnsNoRef } from './audit'
import type { TableSchema, TableColumn } from './types'

/**
 * Tablo tanımına standart audit (denetim) kolonlarını otomatik enjekte eden tablo fabrikası.
 * @param schema - Ham tablo şeması tanımı.
 * @returns Audit kolonları eklenmiş güncel tablo şeması.
 */
export const defineTable = <T extends TableSchema>(schema: T): T => {
  if (!schema || !Array.isArray(schema.columns)) return schema
  // 1. Audit istenmiyorsa (hasAudit: false) direkt dön
  if (schema.hasAudit === false) return schema

  // 2. Kolon listesini al
  const baseAuditCols: TableColumn[] =
    schema.name === 'TANIM_Personel' ? auditColumnsNoRef : auditColumns

  const existingColNames = new Set(
    schema.columns.map((c) => (c && c.name ? c.name.toLowerCase() : ''))
  )
  const columnsToAdd = baseAuditCols.filter(
    (auditCol) => !existingColNames.has(auditCol.name.toLowerCase())
  )

  return {
    ...schema,
    columns: [...schema.columns, ...columnsToAdd]
  }
}


