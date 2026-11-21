import type { SqlExecutor, SqlStatement } from '../application/ports'

type IpcResult = { success: boolean; data?: unknown[]; error?: string }
type Invoke = (channel: string, ...args: unknown[]) => Promise<IpcResult>

/**
 * Renderer'da kullanım: new IpcSqlExecutor(window.electron.ipcRenderer.invoke)
 * Mevcut 'db:query' ve 'db:transaction' kanallarını kullanır.
 */
export class IpcSqlExecutor implements SqlExecutor {
  constructor(private readonly invoke: Invoke) {}

  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    const res = await this.invoke('db:query', sql, [...params])
    if (!res?.success) throw new Error(res?.error ?? 'db:query başarısız')
    return (res.data ?? []) as T[]
  }

  async transaction(statements: readonly SqlStatement[]): Promise<void> {
    const res = await this.invoke('db:transaction', statements.map((s) => ({ sql: s.sql, params: [...(s.params ?? [])] })))
    if (!res?.success) throw new Error(res?.error ?? 'db:transaction başarısız')
  }
}
