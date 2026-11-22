import type { SqlExecutor } from "@worksuite-360/core";

export interface SqlExecutionResult {
    changes?: number;
    lastInsertRowid?: number | bigint;
}

export interface ISqliteDatabaseConnection {
    query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
    execute(sql: string, params?: unknown[]): Promise<SqlExecutionResult>;
    transaction<T>(action: (conn: ISqliteDatabaseConnection) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}

export class SqliteDatabaseConnection implements ISqliteDatabaseConnection {
    constructor(private readonly executor: SqlExecutor) {}

    async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
        return this.executor.query<T>(sql, params as readonly unknown[]);
    }

    async execute(sql: string, params: unknown[] = []): Promise<SqlExecutionResult> {
        if (this.executor.execute) {
            return this.executor.execute(sql, params as readonly unknown[]);
        }
        await this.executor.query(sql, params as readonly unknown[]);
        return {};
    }

    async transaction<T>(action: (conn: ISqliteDatabaseConnection) => Promise<T>): Promise<T> {
        await this.execute("BEGIN TRANSACTION");
        try {
            const result = await action(this);
            await this.execute("COMMIT");
            return result;
        } catch (error) {
            await this.execute("ROLLBACK");
            throw error;
        }
    }

    async close(): Promise<void> {
        // no-op for pooled/adapter executor
    }
}
