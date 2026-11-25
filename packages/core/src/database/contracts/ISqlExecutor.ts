/**
 * Genel SQL komut ve sorgu çalıştırma sözleşmesi.
 */

export interface SqlStatement {
  sql: string;
  params?: readonly unknown[];
}

export interface SqlExecutor {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<T[]>;
  execute?(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ changes?: number }>;
  transaction<T = unknown>(
    statements: readonly SqlStatement[],
  ): Promise<T[] | void>;
}
