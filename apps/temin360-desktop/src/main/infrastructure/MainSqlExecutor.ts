import type { SqlExecutor, SqlStatement } from '@temin360/direct-procurement-core'
import { handleDbTransaction, type SqliteDatabaseLike } from '../ipc/db/dbTransaction'
import { assertReadOnlyQuery, validateSqlQuery } from '../ipc/utils/sqlGuard'

/** Okuma için gereken yüzey (better-sqlite3 ve node:sqlite ikisi de uyar). */
type ReadableStatement = ReturnType<SqliteDatabaseLike['prepare']> & {
  all: (...params: unknown[]) => unknown[]
  /** better-sqlite3'te var; node:sqlite'ta yok. */
  reader?: boolean
}
export interface MainDb extends SqliteDatabaseLike {
  prepare: (sql: string) => ReadableStatement
}

/** `workspaceManager`'ın bu sınıfın kullandığı kısmı. Gerçek nesne yapısal olarak uyar. */
export interface WorkspaceLike {
  getDb(): MainDb
  recordMutation(tableName: string, action: 'insert' | 'update' | 'delete' | 'other', count: number): void
  isDirty(): boolean
  save(): void
}

/**
 * Main süreçte `direct-procurement-core` için SqlExecutor.
 *
 * `db:query` ve `db:transaction` IPC işleyicileriyle AYNI yolu izler:
 *  - her SQL `sqlGuard`'dan geçer (DDL/PRAGMA engeli, okuma sorgusunda yalnızca SELECT),
 *  - yazmalar `handleDbTransaction` ile tek atomik işlemde çalışır,
 *  - COMMIT sonrası değişiklikler `recordMutation` ile iş takibine ve denetim izine bildirilir,
 *  - değişiklik varsa çalışma dosyası kaydedilir (`save`).
 * Ham db üzerinden çalıştırmak bu üçünü atlar, o yüzden main'de bunun yerine bu sınıf kullanılır.
 */
export class MainSqlExecutor implements SqlExecutor {
  constructor(
    private readonly workspace: WorkspaceLike,
    /** COMMIT edilmiş ama kaydetme/bildirim aşamasında uyarı çıkan durumlar (veri kaybı yok). */
    private readonly onWarning: (message: string) => void = (m) => console.warn('[MainSqlExecutor]', m),
  ) {}

  async query<T = Record<string, unknown>>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    validateSqlQuery(sql, [...params])
    assertReadOnlyQuery(sql)
    const stmt = this.workspace.getDb().prepare(sql) // her çağrıda: çalışma dosyası değişmiş olabilir
    if (stmt.reader === false) throw new Error('[MainSqlExecutor] query yalnızca okuma sorguları içindir.')
    return stmt.all(...params) as T[]
  }

  async transaction(statements: readonly SqlStatement[]): Promise<void> {
    if (statements.length === 0) return
    const queries = statements.map((s) => ({ sql: s.sql, params: s.params ? [...s.params] : [] }))

    const res = await handleDbTransaction(this.workspace.getDb(), queries, {
      validateSql: true,
      onMutation: (table, action, count) => this.workspace.recordMutation(table, action, count),
      onSave: () => {
        if (this.workspace.isDirty()) this.workspace.save()
      },
    })

    if (!res.success) throw new Error(res.error ?? 'Veritabanı işlemi başarısız.')
    const warning = res.warning ?? res.saveError
    if (warning) this.onWarning(warning)
  }
}
