export interface TableColumn {
  name: string
  type: string
  constraints?: string[]
  defaultValue?: string
}

export interface TableIndex {
  columns: string[]
  unique?: boolean
}

export interface TableSchema {
  name: string
  description?: string
  columns: TableColumn[]
  hasAudit?: boolean
  indexes?: TableIndex[]
}
