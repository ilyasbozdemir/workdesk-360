export interface TableInfo {
  name: string
  count: number
}

export interface ColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: unknown
  pk: number
}

export interface EditingCell {
  rowIndex: number
  colName: string
  originalValue: unknown
  row: Record<string, unknown>
}

export type TabType = 'data' | 'schema' | 'console'

export interface StatusMessage {
  type: 'success' | 'error'
  text: string
}

export interface PaginationState {
  page: number
  pageSize: number
  totalRows: number
  totalPages: number
}
