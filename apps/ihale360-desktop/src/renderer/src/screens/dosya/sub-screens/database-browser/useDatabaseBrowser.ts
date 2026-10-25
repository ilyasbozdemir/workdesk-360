import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWorkspaceStore } from '../../../../store/workspaceStore'
import { TableInfo, ColumnInfo, EditingCell, TabType, StatusMessage } from './types'

export function useDatabaseBrowser() {
  const { activeFilePath, openWorkspace } = useWorkspaceStore()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [tableSearch, setTableSearch] = useState<string>('')
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [dataSearch, setDataSearch] = useState<string>('')
  const [debouncedDataSearch, setDebouncedDataSearch] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('data')
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)

  // Server-side / Disk Paging States
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalRows, setTotalRows] = useState<number>(0)

  // Cell Editing State
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  // Add Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [newRowData, setNewRowData] = useState<Record<string, string>>({})

  // Delete Confirm Modal State
  const [deletingRow, setDeletingRow] = useState<Record<string, unknown> | null>(null)

  // SQL Console states
  const [consoleQuery, setConsoleQuery] = useState<string>('')
  const [consoleResults, setConsoleResults] = useState<Record<string, unknown>[]>([])
  const [consoleError, setConsoleError] = useState<string | null>(null)
  const [consoleLoading, setConsoleLoading] = useState<boolean>(false)

  // Primary key column(s) detector - supports Composite Primary Keys
  const pkColumns = useMemo(() => {
    return columns.filter((c) => c.pk > 0)
  }, [columns])

  const pkColumn = useMemo(() => {
    return pkColumns[0] || columns[0]
  }, [pkColumns, columns])

  // Total pages calculation
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalRows / pageSize))
  }, [totalRows, pageSize])

  // Debounce search input to avoid hammering IPC on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDataSearch(dataSearch)
      setPage(1)
    }, 250)
    return () => clearTimeout(handler)
  }, [dataSearch])

  // Reset page and search when switching table
  const prevTableRef = useRef<string>('')
  useEffect(() => {
    if (prevTableRef.current !== selectedTable) {
      prevTableRef.current = selectedTable
      setPage(1)
      setDataSearch('')
      setDebouncedDataSearch('')
    }
  }, [selectedTable])

  // Fast Table List & Row Count loader using a single UNION ALL query
  const loadTables = useCallback(async (): Promise<void> => {
    setLoading(true)
    setDbError(null)
    try {
      let res = await window.electron.ipcRenderer.invoke(
        'db:query',
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )

      // Eğer ana süreçte aktif veritabanı yoksa ama renderer tarafında dosya yolu kayıtlıysa tekrar açmayı dene
      if (!res.success && activeFilePath) {
        const openRes = await openWorkspace(activeFilePath)
        if (openRes.success) {
          res = await window.electron.ipcRenderer.invoke(
            'db:query',
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
          )
        }
      }

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const tableNames: string[] = res.data.map((t: { name: string }) => t.name)

        // Tek bir UNION ALL sorgusu ile tüm tabloların satır sayısını TEK IPC turunda getir
        const unionSql = tableNames
          .map(
            (name) =>
              `SELECT '${name.replace(/'/g, "''")}' as name, COUNT(*) as row_count FROM "${name.replace(/"/g, '""')}"`
          )
          .join(' UNION ALL ')

        const countMap: Record<string, number> = {}
        try {
          const unionRes = await window.electron.ipcRenderer.invoke('db:query', unionSql)
          if (unionRes.success && Array.isArray(unionRes.data)) {
            for (const item of unionRes.data) {
              countMap[item.name] = Number(item.row_count ?? 0)
            }
          }
        } catch {
          // Fallback: Paralel toplu sorgulama
          const counts = await Promise.all(
            tableNames.map(async (name) => {
              const cRes = await window.electron.ipcRenderer.invoke(
                'db:query',
                `SELECT COUNT(*) as row_count FROM "${name.replace(/"/g, '""')}"`
              )
              return {
                name,
                count: cRes.success && cRes.data?.[0] ? Number(cRes.data[0].row_count) : 0
              }
            })
          )
          for (const item of counts) {
            countMap[item.name] = item.count
          }
        }

        const list: TableInfo[] = tableNames.map((name) => ({
          name,
          count: countMap[name] ?? 0
        }))

        setTables(list)
        setSelectedTable((prev) => prev || (list.length > 0 ? list[0].name : ''))
      } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
        setTables([])
        setSelectedTable('')
      } else {
        setDbError(res.error || 'Açık bir çalışma veritabanı (.temin) bulunamadı.')
      }
    } catch (e) {
      console.error('Failed to load sqlite tables:', e)
      const err = e as { message?: string }
      setDbError(err?.message || 'Veritabanına erişilemedi.')
    } finally {
      setLoading(false)
    }
  }, [activeFilePath, openWorkspace])

  // Initial table list load
  useEffect(() => {
    void loadTables()
  }, [loadTables])

  // Load paginated table details (schema + paginated rows directly from SQLite disk)
  const loadTableDetails = useCallback(async (): Promise<void> => {
    if (!selectedTable) return
    setLoading(true)
    setEditingCell(null)
    setStatusMessage(null)
    try {
      const safeTableName = `"${selectedTable.replace(/"/g, '""')}"`

      // 1. Fetch column schema
      const schemaRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `PRAGMA table_info(${safeTableName})`
      )
      const cols: ColumnInfo[] = schemaRes.success ? schemaRes.data || [] : []
      setColumns(cols)

      // 2. Build where filter for search
      const trimmedSearch = debouncedDataSearch.trim()
      let whereClause = ''
      const whereParams: string[] = []

      if (trimmedSearch && cols.length > 0) {
        const likePredicates = cols
          .map((c) => `CAST("${c.name.replace(/"/g, '""')}" AS TEXT) LIKE ?`)
          .join(' OR ')
        whereClause = ` WHERE ${likePredicates}`
        const searchParam = `%${trimmedSearch}%`
        cols.forEach(() => whereParams.push(searchParam))
      }

      // 3. Query total count matching the search criteria
      const countRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT COUNT(*) as total FROM ${safeTableName}${whereClause}`,
        whereParams
      )
      const total = countRes.success && countRes.data?.[0] ? Number(countRes.data[0].total) : 0
      setTotalRows(total)

      // 4. Query only the requested page of rows (LIMIT ? OFFSET ?)
      const offset = Math.max(0, (page - 1) * pageSize)
      const dataRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT * FROM ${safeTableName}${whereClause} LIMIT ? OFFSET ?`,
        [...whereParams, pageSize, offset]
      )
      if (dataRes.success) {
        setRows(dataRes.data || [])
      } else {
        setRows([])
      }
    } catch (e) {
      console.error('Failed to load table details:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedTable, page, pageSize, debouncedDataSearch])

  // Trigger paginated fetch when table, page, pageSize, or search changes
  useEffect(() => {
    void loadTableDetails()
  }, [loadTableDetails])

  const filteredTables = useMemo(() => {
    const query = tableSearch.toLowerCase().trim()
    if (!query) return tables
    return tables.filter((t) => t.name.toLowerCase().includes(query))
  }, [tables, tableSearch])

  // Dual filtering: Native SQLite query for debounced search, plus instant client-side filtering on current page
  const filteredRows = useMemo(() => {
    const q = dataSearch.toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) =>
      columns.some((c) =>
        String(r[c.name] ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
  }, [rows, dataSearch, columns])

  // Start cell editing with direct row snapshot
  const handleCellClick = (
    rowIndex: number,
    colName: string,
    val: unknown,
    row?: Record<string, unknown>
  ): void => {
    const targetRow = row || filteredRows[rowIndex] || rows[rowIndex] || {}
    setEditingCell({ rowIndex, colName, originalValue: val, row: targetRow })
    setEditValue(val === null || val === undefined ? '' : String(val))
  }

  // Save edited cell value to SQLite
  const handleSaveCell = async (): Promise<void> => {
    if (!editingCell || !selectedTable) return
    const { colName, originalValue, row } = editingCell
    if (!row) return

    if (String(originalValue ?? '') === editValue.trim()) {
      setEditingCell(null)
      return
    }

    try {
      let query = ''
      const params: unknown[] = []
      const safeTableName = `"${selectedTable.replace(/"/g, '""')}"`
      const safeColName = `"${colName.replace(/"/g, '""')}"`
      const newValue = editValue.trim() === '' ? null : editValue

      // 1. Composite & Single Primary Key handling:
      // If table has primary key(s) and the target row has non-null values for all PK columns
      const hasValidPks =
        pkColumns.length > 0 &&
        pkColumns.every((pk) => row[pk.name] !== undefined && row[pk.name] !== null)

      if (hasValidPks) {
        const pkWhereClauses = pkColumns
          .map((pk) => `"${pk.name.replace(/"/g, '""')}" = ?`)
          .join(' AND ')
        query = `UPDATE ${safeTableName} SET ${safeColName} = ? WHERE ${pkWhereClauses}`
        params.push(newValue, ...pkColumns.map((pk) => row[pk.name]))
      } else {
        // Fallback for tables without primary key: match all snapshot column values of the target row
        const whereClauses = columns
          .map((c) =>
            row[c.name] === null || row[c.name] === undefined
              ? `"${c.name.replace(/"/g, '""')}" IS NULL`
              : `"${c.name.replace(/"/g, '""')}" = ?`
          )
          .join(' AND ')
        const whereParams = columns
          .filter((c) => row[c.name] !== null && row[c.name] !== undefined)
          .map((c) => row[c.name])

        // STRICT FAIL-SAFE PRE-CHECK:
        // We MUST verify that matching all columns targets EXACTLY ONE unique row.
        // If the query fails, returns null/empty data, or match_count !== 1, WE MUST HALT!
        const countCheckRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(*) as match_count FROM ${safeTableName} WHERE ${whereClauses}`,
          whereParams
        )

        if (!countCheckRes?.success || !countCheckRes.data || countCheckRes.data.length === 0) {
          setStatusMessage({
            type: 'error',
            text: `Doğrulama sorgusu başarısız oldu (${countCheckRes?.error || 'Bilinmeyen hata'}). Veri güvenliği nedeniyle işlem durduruldu.`
          })
          return
        }

        const rawCount = countCheckRes.data[0]?.match_count
        const matchCount = rawCount !== undefined && rawCount !== null ? Number(rawCount) : NaN

        if (isNaN(matchCount) || matchCount !== 1) {
          if (matchCount > 1) {
            setStatusMessage({
              type: 'error',
              text: `Bu tabloda birincil anahtar (Primary Key) bulunmamaktadır ve bu değerlere sahip ${matchCount} adet özdeş kayıt mevcuttur. Yanlış kayıtların güncellenmesini önlemek için işlem durduruldu.`
            })
          } else {
            setStatusMessage({
              type: 'error',
              text: `Güncellenecek kayıt veritabanında bulunamadı (eşleşen: ${matchCount}). Kayıt başka bir işlem tarafından değiştirilmiş veya silinmiş olabilir.`
            })
          }
          return
        }

        query = `UPDATE ${safeTableName} SET ${safeColName} = ? WHERE ${whereClauses}`
        params.push(newValue, ...whereParams)
      }

      const res = await window.electron.ipcRenderer.invoke('db:run', query, params)
      if (res.success && res.changes === 1) {
        setStatusMessage({
          type: 'success',
          text: `Hücre (${colName}) başarıyla güncellendi.`
        })
        // Update the target row in state by PK match or exact reference (guarantees correct row update)
        setRows((prev) =>
          prev.map((r) => {
            if (hasValidPks) {
              const matches = pkColumns.every((pk) => r[pk.name] === row[pk.name])
              return matches ? { ...r, [colName]: newValue } : r
            }
            return r === row ? { ...r, [colName]: newValue } : r
          })
        )
      } else if (res.success && res.changes !== 1) {
        setStatusMessage({
          type: 'error',
          text: `Beklenmeyen durum: Güncelleme sonucunda tam 1 satır yerine ${res.changes ?? 0} satır etkilendi! Veriler yeniden yükleniyor.`
        })
        await loadTableDetails()
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Güncelleme başarısız oldu.'
        })
      }
    } catch (err: unknown) {
      const error = err as Error
      setStatusMessage({
        type: 'error',
        text: error.message || 'Güncelleme hatası.'
      })
    } finally {
      setEditingCell(null)
    }
  }

  // Insert new record
  const handleInsertRow = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!selectedTable) return

    const colsToInsert = Object.keys(newRowData).filter((k) => newRowData[k].trim() !== '')
    if (colsToInsert.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Lütfen en az bir alan doldurun.'
      })
      return
    }

    const safeTableName = `"${selectedTable.replace(/"/g, '""')}"`
    const escapedCols = colsToInsert.map((k) => `"${k.replace(/"/g, '""')}"`).join(', ')
    const placeholders = colsToInsert.map(() => '?').join(', ')
    const values = colsToInsert.map((k) => newRowData[k])
    const sql = `INSERT INTO ${safeTableName} (${escapedCols}) VALUES (${placeholders})`

    try {
      const res = await window.electron.ipcRenderer.invoke('db:run', sql, values)
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Yeni kayıt başarıyla eklendi.'
        })
        setIsAddModalOpen(false)
        setNewRowData({})
        // Update local table count state without refetching all tables
        setTables((prev) =>
          prev.map((t) => (t.name === selectedTable ? { ...t, count: t.count + 1 } : t))
        )
        setTotalRows((prev) => prev + 1)
        await loadTableDetails()
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Kayıt eklenemedi.'
        })
      }
    } catch (err: unknown) {
      const error = err as Error
      setStatusMessage({
        type: 'error',
        text: error.message || 'Ekleme hatası.'
      })
    }
  }

  // Delete row - fully supports composite primary keys and row snapshot matching
  const handleDeleteRowConfirm = async (): Promise<void> => {
    if (!deletingRow || !selectedTable) return

    try {
      let sql = ''
      const params: unknown[] = []
      const safeTableName = `"${selectedTable.replace(/"/g, '""')}"`

      const hasValidPks =
        pkColumns.length > 0 &&
        pkColumns.every((pk) => deletingRow[pk.name] !== undefined && deletingRow[pk.name] !== null)

      if (hasValidPks) {
        const pkWhereClauses = pkColumns
          .map((pk) => `"${pk.name.replace(/"/g, '""')}" = ?`)
          .join(' AND ')
        sql = `DELETE FROM ${safeTableName} WHERE ${pkWhereClauses}`
        params.push(...pkColumns.map((pk) => deletingRow[pk.name]))
      } else {
        const whereClauses = columns
          .map((c) =>
            deletingRow[c.name] === null || deletingRow[c.name] === undefined
              ? `"${c.name.replace(/"/g, '""')}" IS NULL`
              : `"${c.name.replace(/"/g, '""')}" = ?`
          )
          .join(' AND ')
        const whereParams = columns
          .filter((c) => deletingRow[c.name] !== null && deletingRow[c.name] !== undefined)
          .map((c) => deletingRow[c.name])

        // STRICT FAIL-SAFE PRE-CHECK:
        // We MUST verify that matching all columns targets EXACTLY ONE unique row.
        // If the query fails, returns null/empty data, or match_count !== 1, WE MUST HALT!
        const countCheckRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(*) as match_count FROM ${safeTableName} WHERE ${whereClauses}`,
          whereParams
        )

        if (!countCheckRes?.success || !countCheckRes.data || countCheckRes.data.length === 0) {
          setStatusMessage({
            type: 'error',
            text: `Doğrulama sorgusu başarısız oldu (${countCheckRes?.error || 'Bilinmeyen hata'}). Veri güvenliği nedeniyle silme işlemi durduruldu.`
          })
          setDeletingRow(null)
          return
        }

        const rawCount = countCheckRes.data[0]?.match_count
        const matchCount = rawCount !== undefined && rawCount !== null ? Number(rawCount) : NaN

        if (isNaN(matchCount) || matchCount !== 1) {
          if (matchCount > 1) {
            setStatusMessage({
              type: 'error',
              text: `Bu tabloda birincil anahtar (Primary Key) bulunmamaktadır ve bu değerlere sahip ${matchCount} adet özdeş kayıt mevcuttur. Yanlış kayıtların silinmesini önlemek için işlem engellendi.`
            })
          } else {
            setStatusMessage({
              type: 'error',
              text: `Silinecek kayıt veritabanında bulunamadı (eşleşen: ${matchCount}). Kayıt başka bir işlem tarafından silinmiş veya değiştirilmiş olabilir.`
            })
          }
          setDeletingRow(null)
          return
        }

        params.push(...whereParams)
        sql = `DELETE FROM ${safeTableName} WHERE ${whereClauses}`
      }

      const res = await window.electron.ipcRenderer.invoke('db:run', sql, params)
      if (res.success && res.changes === 1) {
        setStatusMessage({
          type: 'success',
          text: 'Kayıt veritabanından silindi.'
        })
        setDeletingRow(null)
        // Update local count state
        setTables((prev) =>
          prev.map((t) =>
            t.name === selectedTable ? { ...t, count: Math.max(0, t.count - 1) } : t
          )
        )
        setTotalRows((prev) => Math.max(0, prev - 1))
        await loadTableDetails()
      } else if (res.success && res.changes !== 1) {
        setStatusMessage({
          type: 'error',
          text: `Beklenmeyen durum: Silme sonucunda tam 1 satır yerine ${res.changes ?? 0} satır etkilendi! Veriler yeniden yükleniyor.`
        })
        setDeletingRow(null)
        await loadTableDetails()
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Silme işlemi başarısız.'
        })
      }
    } catch (err: unknown) {
      const error = err as Error
      setStatusMessage({
        type: 'error',
        text: error.message || 'Silme hatası.'
      })
    }
  }

  // Export data as CSV/Excel (fetches up to 10,000 records of table directly from SQLite)
  const handleExportCsv = async (): Promise<void> => {
    if (!selectedTable || columns.length === 0) return

    try {
      const safeTableName = `"${selectedTable.replace(/"/g, '""')}"`
      const allRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT * FROM ${safeTableName} LIMIT 10000`
      )
      const exportRows: Record<string, unknown>[] =
        allRes.success && Array.isArray(allRes.data) && allRes.data.length > 0 ? allRes.data : rows

      if (exportRows.length === 0) return

      const headers = columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',')
      const csvLines = exportRows.map((r) =>
        columns
          .map((c) => {
            const val = r[c.name]
            if (val === null || val === undefined) return '""'
            return `"${String(val).replace(/"/g, '""')}"`
          })
          .join(',')
      )

      const csvContent = '\uFEFF' + [headers, ...csvLines].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedTable}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export CSV failed:', err)
    }
  }

  // Run SQL Console query with accurate CTE & mutation detection and automatic view sync
  const handleRunQuery = async (): Promise<void> => {
    const rawSql = consoleQuery.trim()
    if (!rawSql) return
    setConsoleLoading(true)
    setConsoleError(null)
    setConsoleResults([])

    try {
      const strippedForDetection = rawSql
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/--.*$/gm, ' ')
        .trim()

      // Accurately detect mutations, including CTEs (WITH ... INSERT/UPDATE/DELETE)
      const isMutation =
        /^(DELETE|INSERT|UPDATE|DROP|ALTER|CREATE|REPLACE|PRAGMA|VACUUM)\b/i.test(
          strippedForDetection
        ) || /^WITH\s+[\s\S]*?\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i.test(strippedForDetection)

      const channel = isMutation ? 'db:run' : 'db:query'
      const res = await window.electron.ipcRenderer.invoke(channel, rawSql)

      if (res.success) {
        // Detect if mutation actually altered data (even if CTE executed via db:query)
        const hasMutations =
          isMutation ||
          (res.changes !== undefined && res.changes !== null && Number(res.changes) > 0) ||
          (res.lastInsertRowid !== undefined && res.lastInsertRowid !== null)

        if (hasMutations) {
          setConsoleResults([
            {
              durum: 'Başarılı',
              etkilenen_satir: res.changes ?? 1,
              son_eklenen_id: res.lastInsertRowid ?? '-',
              mesaj: 'SQL komutu başarıyla yürütüldü ve veritabanı görünümü güncellendi.'
            }
          ])
          await loadTableDetails()
          await loadTables()
        } else {
          setConsoleResults(res.data || [])
        }
      } else {
        setConsoleError(res.error || 'Sorgu çalıştırılırken bilinmeyen bir hata oluştu.')
      }
    } catch (e) {
      const err = e as Error
      setConsoleError(err.message || 'Hata: Sorgu yürütülemedi.')
    } finally {
      setConsoleLoading(false)
    }
  }

  return {
    tables,
    selectedTable,
    setSelectedTable,
    tableSearch,
    setTableSearch,
    columns,
    rows,
    dataSearch,
    setDataSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalRows,
    totalPages,
    loading,
    dbError,
    activeTab,
    setActiveTab,
    statusMessage,
    setStatusMessage,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue,
    isAddModalOpen,
    setIsAddModalOpen,
    newRowData,
    setNewRowData,
    deletingRow,
    setDeletingRow,
    consoleQuery,
    setConsoleQuery,
    consoleResults,
    consoleError,
    consoleLoading,
    pkColumn,
    pkColumns,
    filteredTables,
    filteredRows,
    loadTables,
    loadTableDetails,
    handleCellClick,
    handleSaveCell,
    handleInsertRow,
    handleDeleteRowConfirm,
    handleExportCsv,
    handleRunQuery
  }
}
