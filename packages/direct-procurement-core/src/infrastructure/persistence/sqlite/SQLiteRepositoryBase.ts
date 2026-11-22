/**
 * SQLiteRepositoryBase
 *
 * SQLite repository sınıfları için ortak altyapıyı sağlar.
 *
 * Sorumlulukları:
 * - Veritabanı bağlantısını yönetmek.
 * - Tablo adını saklamak.
 * - Ortak SQL parametrelerini hazırlamak.
 * - SQLite repository sınıflarına ortak yardımcı metotlar sunmak.
 *
 * Kullanım örneği:
 *
 * class UserRepository extends SQLiteRepositoryBase<User, number> {
 *   constructor(connection: IDatabaseConnection) {
 *     super(connection, "users");
 *   }
 * }
 */

import type { IDatabaseConnection } from "../../database/contracts/IDatabaseConnection";

export abstract class SQLiteRepositoryBase<
    TEntity extends { id: TId },
    TId,
> {
    protected readonly connection: IDatabaseConnection;
    protected readonly tableName: string;

    protected constructor(
        connection: IDatabaseConnection,
        tableName: string,
    ) {
        if (!tableName.trim()) {
            throw new Error("Table name cannot be empty.");
        }

        this.connection = connection;
        this.tableName = tableName;
    }

    /**
     * Tablo adını güvenli şekilde SQL içerisinde kullanmak için doğrular.
     */
    protected getTableName(): string {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.tableName)) {
            throw new Error(`Invalid SQLite table name: ${this.tableName}`);
        }

        return `"${this.tableName}"`;
    }

    /**
     * Entity ID değerini SQL parametresi olarak hazırlar.
     */
    protected getIdParameter(id: TId): unknown[] {
        return [id];
    }

    /**
     * Entity ID alanının SQL sütun adını döndürür.
     */
    protected getIdColumn(): string {
        return '"id"';
    }
}
