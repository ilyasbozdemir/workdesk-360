/**
 * IDatabaseTransaction
 *
 * Veritabanı transaction işlemlerinin sözleşmesi.
 *
 * Sorumlulukları:
 * - Transaction başlatmak.
 * - İşlemleri onaylamak (commit).
 * - İşlemleri geri almak (rollback).
 * - Transaction durumunu takip etmek.
 *
 * Kullanım örneği:
 *
 * const transaction = await connection.beginTransaction();
 *
 * try {
 *   await transaction.execute(
 *     "INSERT INTO users (id, name) VALUES (?, ?)",
 *     [1, "İlyas"]
 *   );
 *
 *   await transaction.commit();
 * } catch (error) {
 *   await transaction.rollback();
 *   throw error;
 * }
 */

export interface IDatabaseTransaction {
    /**
     * Transaction içerisindeki SQL komutunu çalıştırır.
     */
    execute(
        sql: string,
        parameters?: unknown[],
    ): Promise<void>;

    /**
     * Transaction işlemlerini kalıcı hale getirir.
     */
    commit(): Promise<void>;

    /**
     * Transaction işlemlerini geri alır.
     */
    rollback(): Promise<void>;

    /**
     * Transaction'ın aktif olup olmadığını belirtir.
     */
    readonly isActive: boolean;
}
