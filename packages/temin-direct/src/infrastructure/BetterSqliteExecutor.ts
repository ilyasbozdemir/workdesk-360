import type { SqlExecutor, SqlStatement } from '../application/ports'

/** better-sqlite3 veritabanının asgari yüzeyi (main süreç / test). */
export interface BetterSqliteLike {
  prepare(sql: string): { all(...p: unknown[]): unknown[]; run(...p: unknown[]): unknown }
  transaction<F extends (...a: never[]) => unknown>(fn: F): F
}

/**
 * YALNIZCA test ve araçlar için. Uygulamanın main sürecinde kullanma: sqlGuard, mutation kaydı
 * ve çalışma dosyası kaydını atlar. Main'de `MainSqlExecutor` (temin360-desktop-patch) kullanılır.
 */
export class BetterSqliteExecutor implements SqlExecutor {
  constructor(private readonly db: BetterSqliteLike) {}

  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[]
  }

  async transaction(statements: readonly SqlStatement[]): Promise<void> {
    const run = this.db.transaction(() => {
      for (const s of statements) this.db.prepare(s.sql).run(...(s.params ?? []))
    })
    run()
  }
}
