import type { SqlExecutor, SqlStatement } from '../application/ports'

type IpcResult = { success: boolean; data?: unknown[]; error?: string }
type Invoke = (channel: string, ...args: unknown[]) => Promise<IpcResult>

/**
 * Electron Renderer sürecinden Main sürece IPC üzerinden SQL sorgusu ve transaction ileten adaptör.
 *
 * `window.electron.ipcRenderer.invoke` fonksiyonunu kullanarak mevcut `db:query` ve
 * `db:transaction` kanalları üzerinden iletişim kurar. Böylece aynı use-case mantığı hem Main hem
 * Renderer sürecinde birebir çalışabilir.
 */
export class IpcSqlExecutor implements SqlExecutor {
  /**
   * @param invoke - Electron IPC invoke fonksiyonu (`window.electron.ipcRenderer.invoke`).
   */
  constructor(private readonly invoke: Invoke) {}

  /**
   * IPC kanalı üzerinden SQL sorgusu çalıştırır.
   * @param sql - SQL sorgu metni.
   * @param params - Sorgu parametreleri.
   * @throws {Error} IPC çağrısı başarısız olursa veya veritabanı hatası dönerse fırlatılır.
   */
  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    const res = await this.invoke('db:query', sql, [...params])
    if (!res?.success) throw new Error(res?.error ?? 'db:query başarısız')
    return (res.data ?? []) as T[]
  }

  /**
   * IPC kanalı üzerinden birden fazla SQL ifadesini transaction içinde çalıştırır.
   * @param statements - SQL ifadeleri ve parametreleri listesi.
   * @throws {Error} Transaction başarısız olursa fırlatılır.
   */
  async transaction(statements: readonly SqlStatement[]): Promise<void> {
    const res = await this.invoke('db:transaction', statements.map((s) => ({ sql: s.sql, params: [...(s.params ?? [])] })))
    if (!res?.success) throw new Error(res?.error ?? 'db:transaction başarısız')
  }
}
