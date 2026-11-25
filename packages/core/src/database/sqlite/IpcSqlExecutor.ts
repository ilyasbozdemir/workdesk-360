import type { SqlExecutor, SqlStatement } from "../contracts/ISqlExecutor";

type IpcResult = { success: boolean; data?: unknown; error?: string };

type IpcRendererLike = {
  invoke(channel: string, ...args: unknown[]): Promise<IpcResult>;
};

/**
 * Electron Renderer sürecinden Main sürecine SQL komutları ileten güvenli adaptör.
 */
export class IpcSqlExecutor implements SqlExecutor {
  constructor(private readonly ipc: IpcRendererLike) {}

  async query<T = Record<string, unknown>>(
    sql: string,
    params: readonly unknown[] = [],
  ): Promise<T[]> {
    const res = await this.ipc.invoke("db:query", sql, params);
    if (!res.success) {
      throw new Error(`[IpcSqlExecutor.query] ${res.error ?? "Bilinmeyen hata"}`);
    }
    return (res.data as T[]) ?? [];
  }

  async execute(
    sql: string,
    params: readonly unknown[] = [],
  ): Promise<{ changes?: number }> {
    const res = await this.ipc.invoke("db:run", sql, params);
    if (!res.success) {
      throw new Error(`[IpcSqlExecutor.execute] ${res.error ?? "Bilinmeyen hata"}`);
    }
    const data = res.data as { changes?: number } | undefined;
    return { changes: data?.changes };
  }

  async transaction<T = unknown>(
    statements: readonly SqlStatement[],
  ): Promise<T[]> {
    const res = await this.ipc.invoke("db:transaction", statements);
    if (!res.success) {
      throw new Error(
        `[IpcSqlExecutor.transaction] ${res.error ?? "Bilinmeyen hata"}`,
      );
    }
    return (res.data as T[]) ?? [];
  }
}
