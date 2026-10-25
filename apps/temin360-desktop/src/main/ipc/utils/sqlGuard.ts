/**
 * SQL Security Guard for validating IPC SQL queries.
 * Tokenizer-based SQL validation engine that strictly differentiates
 * SQL keywords, identifiers (quoted and unquoted), string literals, comments,
 * and scope depths (parentheses).
 * Prevents multi-statement injections, mass unparameterized modifications,
 * destructive schema tampering, CTE-based where bypasses, and raw SQL exfiltration of sensitive key-value tables.
 */

const RESTRICTED_TABLES = ['SETTINGS', 'TANIM_AYAR']

export type TokenType = 'KEYWORD' | 'IDENTIFIER' | 'STRING' | 'NUMBER' | 'PUNCTUATION' | 'OPERATOR'

export interface SqlToken {
  type: TokenType
  value: string
  raw: string
  depth: number
}

const SQL_KEYWORDS = new Set([
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'FROM',
  'WHERE',
  'SET',
  'INTO',
  'VALUES',
  'WITH',
  'AS',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'ON',
  'GROUP',
  'BY',
  'ORDER',
  'LIMIT',
  'OFFSET',
  'UNION',
  'ALL',
  'CREATE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'TABLE',
  'VIEW',
  'INDEX',
  'TRIGGER',
  'VIRTUAL',
  'ATTACH',
  'DETACH',
  'DATABASE',
  'PRAGMA',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'LIKE',
  'BETWEEN',
  'EXISTS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'HAVING',
  'DISTINCT',
  'RETURNING',
  'TEMP',
  'TEMPORARY',
  'IF'
])

export function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = []
  let i = 0
  let depth = 0
  const len = sql.length

  while (i < len) {
    const ch = sql[i]

    // 1. Whitespace
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // 2. Line comment: --
    if (ch === '-' && sql[i + 1] === '-') {
      i += 2
      while (i < len && sql[i] !== '\n') i++
      continue
    }

    // 3. Block comment: /* ... */
    if (ch === '/' && sql[i + 1] === '*') {
      i += 2
      while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      if (i < len) i += 2
      continue
    }

    // 4. Parentheses (Scope depth tracking)
    if (ch === '(') {
      tokens.push({ type: 'PUNCTUATION', value: '(', raw: '(', depth })
      depth++
      i++
      continue
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1)
      tokens.push({ type: 'PUNCTUATION', value: ')', raw: ')', depth })
      i++
      continue
    }

    // 5. String literal: '...' (with '' escape)
    if (ch === "'") {
      let str = ''
      const start = i
      i++
      while (i < len) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            str += "'"
            i += 2
          } else {
            i++
            break
          }
        } else {
          str += sql[i]
          i++
        }
      }
      tokens.push({ type: 'STRING', value: str, raw: sql.slice(start, i), depth })
      continue
    }

    // 6. Double-quoted identifier: "..." (with "" escape)
    if (ch === '"') {
      let id = ''
      const start = i
      i++
      while (i < len) {
        if (sql[i] === '"') {
          if (sql[i + 1] === '"') {
            id += '"'
            i += 2
          } else {
            i++
            break
          }
        } else {
          id += sql[i]
          i++
        }
      }
      tokens.push({ type: 'IDENTIFIER', value: id, raw: sql.slice(start, i), depth })
      continue
    }

    // 7. Bracketed identifier: [...]
    if (ch === '[') {
      let id = ''
      const start = i
      i++
      while (i < len && sql[i] !== ']') {
        id += sql[i]
        i++
      }
      if (i < len && sql[i] === ']') i++
      tokens.push({ type: 'IDENTIFIER', value: id, raw: sql.slice(start, i), depth })
      continue
    }

    // 8. Backtick identifier: `...`
    if (ch === '`') {
      let id = ''
      const start = i
      i++
      while (i < len && sql[i] !== '`') {
        id += sql[i]
        i++
      }
      if (i < len && sql[i] === '`') i++
      tokens.push({ type: 'IDENTIFIER', value: id, raw: sql.slice(start, i), depth })
      continue
    }

    // 9. Numeric literals
    if (/\d/.test(ch)) {
      const start = i
      while (i < len && /[0-9.xXa-fA-F]/.test(sql[i])) i++
      tokens.push({ type: 'NUMBER', value: sql.slice(start, i), raw: sql.slice(start, i), depth })
      continue
    }

    // 10. Word (Keywords or unquoted identifiers)
    if (/[A-Za-z_\u0080-\uFFFF]/.test(ch)) {
      const start = i
      while (i < len && /[A-Za-z0-9_\u0080-\uFFFF]/.test(sql[i])) i++
      const word = sql.slice(start, i)
      const upper = word.toUpperCase()

      if (SQL_KEYWORDS.has(upper)) {
        tokens.push({ type: 'KEYWORD', value: upper, raw: word, depth })
      } else {
        tokens.push({ type: 'IDENTIFIER', value: word, raw: word, depth })
      }
      continue
    }

    // 11. Statement separator
    if (ch === ';') {
      tokens.push({ type: 'PUNCTUATION', value: ';', raw: ';', depth })
      i++
      continue
    }

    // 12. Operators and symbols
    tokens.push({ type: 'OPERATOR', value: ch, raw: ch, depth })
    i++
  }

  return tokens
}

/**
 * Checks whether an identifier token at `idx` is being used as a target table reference
 * (e.g. in FROM, JOIN, UPDATE, INTO, TABLE clauses) rather than as a column name or alias.
 */
function isTableReference(tokens: SqlToken[], idx: number): boolean {
  let prevIdx = idx - 1
  // Skip optional schema dot: e.g. main.settings or "main"."settings"
  if (prevIdx >= 0 && tokens[prevIdx].value === '.') {
    prevIdx -= 2
  }

  if (prevIdx < 0) return false

  // If preceded by 'AS', it's an alias (e.g. SELECT x AS settings or FROM data AS settings), NOT a table source
  if (tokens[prevIdx].type === 'KEYWORD' && tokens[prevIdx].value === 'AS') {
    return false
  }

  // Scan backwards at the same scope depth to find the clause keyword
  let scanIdx = prevIdx
  while (scanIdx >= 0 && tokens[scanIdx].depth === tokens[idx].depth) {
    const st = tokens[scanIdx]
    if (st.type === 'KEYWORD') {
      if (['FROM', 'JOIN', 'UPDATE', 'INTO', 'TABLE'].includes(st.value)) {
        return true
      }
      if (
        ['SELECT', 'SET', 'WHERE', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'VALUES', 'ON'].includes(
          st.value
        )
      ) {
        return false
      }
    }
    scanIdx--
  }

  return false
}

export function validateSqlQuery(sql: string, _params?: unknown[]): void {
  void _params
  if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
    return
  }

  const tokens = tokenizeSql(sql)
  if (tokens.length === 0) return

  // 1. Reject destructive DDL operations & schema tampering (DROP, TRUNCATE, ALTER, ATTACH, DETACH, CREATE TRIGGER, PRAGMA)
  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx]
    if (t.type === 'KEYWORD') {
      const nextToken = tokens[idx + 1]
      const nextVal = nextToken?.value?.toUpperCase()
      const isNextIdOrKeyword = nextToken?.type === 'KEYWORD' || nextToken?.type === 'IDENTIFIER'

      if (
        t.value === 'DROP' &&
        isNextIdOrKeyword &&
        ['TABLE', 'VIEW', 'DATABASE', 'INDEX', 'TRIGGER'].includes(nextVal)
      ) {
        throw new Error(
          '[sqlGuard] Destructive DDL operations (DROP/TRUNCATE/ALTER/ATTACH/DETACH) are prohibited via IPC.'
        )
      }
      if (t.value === 'TRUNCATE' && isNextIdOrKeyword && nextVal === 'TABLE') {
        throw new Error(
          '[sqlGuard] Destructive DDL operations (DROP/TRUNCATE/ALTER/ATTACH/DETACH) are prohibited via IPC.'
        )
      }
      if (t.value === 'ALTER' && isNextIdOrKeyword && nextVal === 'TABLE') {
        throw new Error(
          '[sqlGuard] Destructive DDL operations (DROP/TRUNCATE/ALTER/ATTACH/DETACH) are prohibited via IPC.'
        )
      }
      if (
        t.value === 'ATTACH' &&
        (nextVal === 'DATABASE' || nextToken?.type === 'STRING' || nextToken?.type === 'IDENTIFIER')
      ) {
        throw new Error(
          '[sqlGuard] Destructive DDL operations (DROP/TRUNCATE/ALTER/ATTACH/DETACH) are prohibited via IPC.'
        )
      }
      if (t.value === 'DETACH' && (nextVal === 'DATABASE' || nextToken?.type === 'IDENTIFIER')) {
        throw new Error(
          '[sqlGuard] Destructive DDL operations (DROP/TRUNCATE/ALTER/ATTACH/DETACH) are prohibited via IPC.'
        )
      }

      // Reject CREATE TRIGGER / CREATE VIRTUAL TABLE schema tampering (including TEMP and TEMPORARY variations)
      if (t.value === 'CREATE') {
        let lookIdx = idx + 1
        const firstVal = tokens[lookIdx]?.value?.toUpperCase()
        if (firstVal === 'TEMP' || firstVal === 'TEMPORARY') {
          lookIdx++
        }
        const targetVal = tokens[lookIdx]?.value?.toUpperCase()
        if (targetVal === 'TRIGGER' || targetVal === 'VIRTUAL') {
          throw new Error(
            '[sqlGuard] Schema tampering operations (CREATE TRIGGER/VIRTUAL TABLE) are prohibited via IPC.'
          )
        }
      }

      // PRAGMA security checks: restrict to safe read-only inspection PRAGMAs
      if (t.value === 'PRAGMA') {
        let pIdx = idx + 1
        if (!tokens[pIdx]) {
          throw new Error('[sqlGuard] Invalid PRAGMA syntax.')
        }

        // Support optional schema qualification: PRAGMA main.table_info or PRAGMA "main"."writable_schema"
        if (tokens[pIdx + 1]?.value === '.' && tokens[pIdx + 2]) {
          pIdx += 2
        }

        const pragmaToken = tokens[pIdx]
        const pragmaName = pragmaToken?.value?.toUpperCase()

        if (!pragmaToken || !pragmaName) {
          throw new Error('[sqlGuard] Invalid PRAGMA syntax.')
        }

        if (pragmaName === 'WRITABLE_SCHEMA') {
          throw new Error(
            '[sqlGuard] Tampering with database internal schema via PRAGMA writable_schema is prohibited.'
          )
        }

        // Check for modifying PRAGMA assignments (PRAGMA ... = ...)
        let isAssignment = false
        for (let sIdx = idx + 1; sIdx < tokens.length; sIdx++) {
          if (tokens[sIdx].value === ';') break
          if (tokens[sIdx].value === '=' && tokens[sIdx].depth === t.depth) {
            isAssignment = true
            break
          }
        }

        if (isAssignment) {
          throw new Error(
            `[sqlGuard] Modifying database configuration via PRAGMA assignment ('PRAGMA ${pragmaName} = ...') is prohibited via IPC.`
          )
        }

        const SAFE_READ_PRAGMAS = new Set([
          'TABLE_INFO',
          'TABLE_XINFO',
          'FOREIGN_KEY_LIST',
          'INDEX_LIST',
          'INDEX_INFO',
          'INDEX_XINFO',
          'DATABASE_LIST',
          'USER_VERSION',
          'SCHEMA_VERSION',
          'QUICK_CHECK',
          'INTEGRITY_CHECK',
          'DATA_VERSION',
          'COLLATION_LIST'
        ])

        if (!SAFE_READ_PRAGMAS.has(pragmaName)) {
          throw new Error(
            `[sqlGuard] Execution of unapproved PRAGMA '${pragmaName}' is prohibited via IPC.`
          )
        }

        // For pragmas that take NO arguments when reading (e.g. user_version, schema_version, data_version, database_list, collation_list),
        // passing an argument via parentheses (e.g. PRAGMA user_version(5)) acts as an assignment in SQLite!
        const NO_ARG_SAFE_PRAGMAS = new Set([
          'USER_VERSION',
          'SCHEMA_VERSION',
          'DATA_VERSION',
          'DATABASE_LIST',
          'COLLATION_LIST'
        ])
        if (NO_ARG_SAFE_PRAGMAS.has(pragmaName)) {
          const nextTok = tokens[pIdx + 1]
          if (nextTok?.value === '(') {
            throw new Error(
              `[sqlGuard] Modifying database configuration via PRAGMA assignment ('PRAGMA ${pragmaName}(...)') is prohibited via IPC.`
            )
          }
        }
      }
    }
  }

  // 2. Check for multi-statement injection (semicolons followed by non-punctuation tokens)
  for (let idx = 0; idx < tokens.length; idx++) {
    if (tokens[idx].type === 'PUNCTUATION' && tokens[idx].value === ';') {
      const hasSubsequentTokens = tokens.slice(idx + 1).some((t) => t.type !== 'PUNCTUATION')
      if (hasSubsequentTokens) {
        throw new Error('[sqlGuard] Multi-statement SQL injection detected and blocked.')
      }
    }
  }

  // 3. Reject mass DELETE / UPDATE without WHERE clause at the same statement depth (including CTEs)
  // Each UPDATE or DELETE statement at depth d must be matched by a WHERE keyword at the exact same depth d!
  // A WHERE inside a CTE (depth > d) or in a subquery does NOT satisfy the WHERE clause of the outer modification!
  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx]
    if (t.type === 'KEYWORD' && (t.value === 'DELETE' || t.value === 'UPDATE')) {
      // Foreign key referential action ("... ON DELETE SET NULL", "... ON UPDATE CASCADE") bir DML ifadesi değildir
      if (tokens[idx - 1]?.type === 'KEYWORD' && tokens[idx - 1].value === 'ON') continue
      const stmtDepth = t.depth
      const action = t.value

      // Look ahead for a WHERE keyword at the exact same statement depth, before any statement separator ';'
      let hasWhereClause = false
      for (let lookIdx = idx + 1; lookIdx < tokens.length; lookIdx++) {
        const next = tokens[lookIdx]
        if (next.type === 'PUNCTUATION' && next.value === ';' && next.depth === stmtDepth) {
          break
        }
        if (next.type === 'KEYWORD' && next.value === 'WHERE' && next.depth === stmtDepth) {
          hasWhereClause = true
          break
        }
      }

      if (!hasWhereClause) {
        throw new Error(
          `[sqlGuard] Unparameterized mass ${action} without WHERE clause is prohibited.`
        )
      }
    }
  }

  // 4. Default-Deny rule for restricted key-value tables (settings / TANIM_Ayar)
  // Only blocks when the restricted name is used as an actual table reference (FROM, JOIN, UPDATE, INTO, TABLE),
  // allowing columns or aliases named 'settings' in legitimate application queries.
  const RESTRICTED_SET = new Set(RESTRICTED_TABLES.map((t) => t.toUpperCase()))
  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx]
    if (t.type === 'IDENTIFIER' || t.type === 'KEYWORD') {
      if (RESTRICTED_SET.has(t.value.toUpperCase())) {
        if (isTableReference(tokens, idx)) {
          throw new Error(
            '[sqlGuard] Direct raw SQL query on settings/TANIM_Ayar table is restricted. ' +
              'Use dedicated named handlers (e.g. db:get-settings, db:save-settings) instead.'
          )
        }
      }
    }
  }
}

export function extractTableAndAction(sql: string): {
  tableName: string
  action: 'insert' | 'update' | 'delete' | 'other'
} {
  if (!sql || typeof sql !== 'string') return { tableName: 'Veritabanı', action: 'other' }
  const tokens = tokenizeSql(sql)

  let action: 'insert' | 'update' | 'delete' | 'other' = 'other'
  let tableName = 'Veritabanı'

  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx]
    if (t.type === 'KEYWORD') {
      // FK referential action (ON DELETE / ON UPDATE) eylem olarak sayılmaz
      if (
        (t.value === 'DELETE' || t.value === 'UPDATE') &&
        tokens[idx - 1]?.type === 'KEYWORD' &&
        tokens[idx - 1].value === 'ON'
      ) {
        continue
      }
      if (t.value === 'INSERT' && tokens[idx + 1]?.value === 'INTO') {
        action = 'insert'
        let targetIdx = idx + 2
        if (tokens[targetIdx]?.type === 'IDENTIFIER') {
          if (
            tokens[targetIdx + 1]?.value === '.' &&
            tokens[targetIdx + 2]?.type === 'IDENTIFIER'
          ) {
            targetIdx += 2
          }
          tableName = tokens[targetIdx].value
        }
        break
      } else if (t.value === 'UPDATE') {
        action = 'update'
        let targetIdx = idx + 1
        if (tokens[targetIdx]?.type === 'IDENTIFIER') {
          if (
            tokens[targetIdx + 1]?.value === '.' &&
            tokens[targetIdx + 2]?.type === 'IDENTIFIER'
          ) {
            targetIdx += 2
          }
          tableName = tokens[targetIdx].value
        }
        break
      } else if (t.value === 'DELETE' && tokens[idx + 1]?.value === 'FROM') {
        action = 'delete'
        let targetIdx = idx + 2
        if (tokens[targetIdx]?.type === 'IDENTIFIER') {
          if (
            tokens[targetIdx + 1]?.value === '.' &&
            tokens[targetIdx + 2]?.type === 'IDENTIFIER'
          ) {
            targetIdx += 2
          }
          tableName = tokens[targetIdx].value
        }
        break
      }
    }
  }

  return { tableName, action }
}
