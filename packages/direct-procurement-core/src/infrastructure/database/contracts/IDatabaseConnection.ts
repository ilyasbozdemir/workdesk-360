/**
 * Veritabanı bağlantısı için ortak sözleşme.
 *
 * SQLite, Prisma veya farklı bir veritabanı adaptörünün
 * uygulayabileceği teknoloji bağımsız bağlantı arayüzüdür.
 *
 * Repository sınıfları doğrudan veritabanı sürücüsüne değil,
 * bu sözleşmeye bağımlı olur.
 *
 * Kullanım örneği:
 *
 * const users = await connection.query<UserRow>(
 *   "SELECT * FROM users WHERE id = ?",
 *   [userId]
 * );
 *
 * const result = await connection.execute(
 *   "DELETE FROM users WHERE id = ?",
 *   [userId]
 * );
 *
 * await connection.close();
 */

/**
 * Veritabanı sorgularında kullanılabilecek parametreler.
 */
export type DatabaseQueryParameters =
    | readonly unknown[]
    | Readonly<Record<string, unknown>>;

/**
 * INSERT, UPDATE ve DELETE işlemlerinin sonucunu temsil eder.
 */
export interface DatabaseExecutionResult {
    /**
     * Etkilenen kayıt sayısı.
     */
    changes: number;

    /**
     * Son eklenen kaydın ID değeri.
     * INSERT işlemi için anlamlıdır.
     */
    lastInsertRowId?: number | bigint;
}

/**
 * Veritabanı bağlantısı sözleşmesi.
 */
export interface IDatabaseConnection {
    /**
     * SQL sorgusu çalıştırır ve sonuç kayıtlarını döndürür.
     */
    query<TResult = Record<string, unknown>>(
        sql: string,
        parameters?: DatabaseQueryParameters,
    ): Promise<TResult[]>;

    /**
     * INSERT, UPDATE veya DELETE gibi değişiklik yapan
     * SQL komutlarını çalıştırır.
     */
    execute(
        sql: string,
        parameters?: DatabaseQueryParameters,
    ): Promise<DatabaseExecutionResult>;

    /**
     * Veritabanı bağlantısını kapatır.
     */
    close(): Promise<void>;
}
