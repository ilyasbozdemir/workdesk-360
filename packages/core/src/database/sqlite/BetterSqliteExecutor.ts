import type { SqlExecutor, SqlStatement } from "../contracts/ISqlExecutor";

type BetterSqliteDatabase = {
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  };
  transaction<T>(fn: () => T): () => T;
};

/**
 * Node.js / Electron main sürecinde doğrudan better-sqlite3 nesnesini saran çalıştırıcı.
 */
export class BetterSqliteExecutor implements SqlExecutor {
  constructor(private readonly db: BetterSqliteDatabase) {}

  async query<T = Record<string, unknown>>(
    sql: string,
    params: readonly unknown[] = [],
  ): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async execute(
    sql: string,
    params: readonly unknown[] = [],
  ): Promise<{ changes?: number }> {
    const res = this.db.prepare(sql).run(...params);
    return { changes: res.changes };
  }

  async transaction<T = unknown>(
    statements: readonly SqlStatement[],
  ): Promise<T[]> {
    const runAll = this.db.transaction(() => {
      const results: unknown[] = [];
      for (const s of statements) {
        results.push(this.db.prepare(s.sql).run(...(s.params ?? [])));
      }
      return results;
    });
    return runAll() as T[];
  }
}
