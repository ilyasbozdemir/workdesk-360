/**
 * SQLiteReadRepository
 *
 * SQLite üzerinde çalışan salt okunur repository altyapısı.
 *
 * Sorumlulukları:
 * - ID üzerinden kayıt getirmek.
 * - Tüm kayıtları listelemek.
 * - Kaydın varlığını kontrol etmek.
 * - Veritabanı hatalarını Result yapısına dönüştürmek.
 *
 * Kullanım örneği:
 *
 * class UserReadRepository extends SQLiteReadRepository<User, number> {
 *   constructor(connection: IDatabaseConnection) {
 *     super(connection, "users");
 *   }
 * }
 *
 * const result = await repository.getById(1);
 */

import type { IReadRepository } from "../contracts/IReadRepository";
import type { Result } from "../../../common/types/Result";
import { AppError } from "../../../common/errors/AppError";
import { NotFoundError } from "../../../common/errors/NotFoundError";

import { SQLiteRepositoryBase } from "./SQLiteRepositoryBase";

export abstract class SQLiteReadRepository<
    TEntity extends { id: TId },
    TId,
> extends SQLiteRepositoryBase<TEntity, TId>
    implements IReadRepository<TEntity, TId> {
    /**
     * ID üzerinden kayıt getirir.
     */
    async getById(id: TId): Promise<Result<TEntity, AppError>> {
        try {
            const sql = `
        SELECT *
        FROM ${this.getTableName()}
        WHERE ${this.getIdColumn()} = ?
        LIMIT 1
      `;

            const rows = await this.connection.query<TEntity>(
                sql,
                this.getIdParameter(id),
            );

            const entity = rows[0];

            if (!entity) {
                return {
                    success: false,
                    error: new NotFoundError({
                        resource: this.tableName,
                        message: "Entity not found.",
                        resourceId: String(id),
                    }),
                };
            }

            return {
                success: true,
                data: entity,
            };
        } catch (error) {
            return {
                success: false,
                error: this.toAppError(error),
            };
        }
    }

    /**
     * Tüm kayıtları getirir.
     */
    async getAll(): Promise<Result<TEntity[], AppError>> {
        try {
            const sql = `
        SELECT *
        FROM ${this.getTableName()}
      `;

            const rows = await this.connection.query<TEntity>(sql);

            return {
                success: true,
                data: rows,
            };
        } catch (error) {
            return {
                success: false,
                error: this.toAppError(error),
            };
        }
    }

    /**
     * Kayıt varlığını kontrol eder.
     */
    async exists(id: TId): Promise<Result<boolean, AppError>> {
        try {
            const sql = `
        SELECT 1 AS exists
        FROM ${this.getTableName()}
        WHERE ${this.getIdColumn()} = ?
        LIMIT 1
      `;

            const rows = await this.connection.query<{ exists: number }>(
                sql,
                this.getIdParameter(id),
            );

            return {
                success: true,
                data: rows.length > 0,
            };
        } catch (error) {
            return {
                success: false,
                error: this.toAppError(error),
            };
        }
    }

    /**
     * Bilinmeyen hataları AppError yapısına dönüştürür.
     */
    protected toAppError(error: unknown): AppError {
        if (error instanceof Error) {
            return new AppError(error.message);
        }

        return new AppError("An unexpected database error occurred.");
    }
}
