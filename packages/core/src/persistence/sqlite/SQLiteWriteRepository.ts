/**
 * SQLiteWriteRepository
 *
 * SQLite üzerinde çalışan yazma repository altyapısı.
 *
 * Sorumlulukları:
 * - Yeni kayıt oluşturmak.
 * - Mevcut kaydı güncellemek.
 * - Kaydı silmek.
 * - Veritabanı hatalarını Result yapısına dönüştürmek.
 *
 * Kullanım örneği:
 *
 * class UserWriteRepository extends SQLiteWriteRepository<User, number> {
 *   constructor(connection: IDatabaseConnection) {
 *     super(connection, "users");
 *   }
 * }
 *
 * const result = await repository.create({
 *   id: 1,
 *   name: "İlyas",
 * });
 */

import type {
    IWriteRepository,
    CreateEntity,
    UpdateEntity,
} from "../contracts/IWriteRepository";
import type { Result } from "../../common/types/Result";
import { AppError } from "../../common/errors/AppError";
import { NotFoundError } from "../../common/errors/NotFoundError";
import { SQLiteRepositoryBase } from "./SQLiteRepositoryBase";

export abstract class SQLiteWriteRepository<
    TEntity extends { id: TId },
    TId,
> extends SQLiteRepositoryBase<TEntity, TId>
    implements IWriteRepository<TEntity, TId> {
    /**
     * Yeni kayıt oluşturur.
     */
    async create(
        data: CreateEntity<TEntity, TId>,
    ): Promise<Result<TEntity, AppError>> {
        try {
            const entity = data as TEntity;
            const entries = Object.entries(entity);

            if (entries.length === 0) {
                throw new Error("Entity data cannot be empty.");
            }

            const columns = entries.map(([column]) => this.quoteColumn(column));
            const placeholders = entries.map(() => "?").join(", ");
            const values = entries.map(([, value]) => value);

            const sql = `
        INSERT INTO ${this.getTableName()}
        (${columns.join(", ")})
        VALUES (${placeholders})
      `;

            await this.connection.execute(sql, values);

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
     * Mevcut kaydı günceller.
     */
    async update(
        id: TId,
        data: UpdateEntity<TEntity>,
    ): Promise<Result<TEntity, AppError>> {
        try {
            const entries = Object.entries(data);

            if (entries.length === 0) {
                throw new Error("Update data cannot be empty.");
            }

            const columns = entries.map(
                ([column]) => `${this.quoteColumn(column)} = ?`,
            );

            const values = entries.map(([, value]) => value);

            const sql = `
        UPDATE ${this.getTableName()}
        SET ${columns.join(", ")}
        WHERE ${this.getIdColumn()} = ?
      `;

            await this.connection.execute(sql, [...values, id]);

            const rows = await this.connection.query<TEntity>(
                `
          SELECT *
          FROM ${this.getTableName()}
          WHERE ${this.getIdColumn()} = ?
          LIMIT 1
        `,
                [id],
            );

            const entity = rows[0];

            if (!entity) {
                return {
                    success: false,
                    error: new NotFoundError({
                        resource: this.tableName,
                        resourceId: String(id),
                        message: "Entity not found after update.",
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
     * Kaydı siler.
     */
    async delete(id: TId): Promise<Result<void, AppError>> {
        try {
            const sql = `
        DELETE FROM ${this.getTableName()}
        WHERE ${this.getIdColumn()} = ?
      `;

            const res = await this.connection.execute(sql, [id]);

            if (res.changes === 0) {
                return {
                    success: false,
                    error: new NotFoundError({
                        resource: this.tableName,
                        resourceId: String(id),
                        message: "Entity not found for deletion.",
                    }),
                };
            }

            return {
                success: true,
                data: undefined,
            };
        } catch (error) {
            return {
                success: false,
                error: this.toAppError(error),
            };
        }
    }

    /**
     * SQL sütun adını doğrular ve çift tırnak içine alır.
     */
    protected quoteColumn(column: string): string {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
            throw new Error(`Invalid SQLite column name: ${column}`);
        }

        return `"${column}"`;
    }

    /**
     * Hataları AppError yapısına dönüştürür.
     */
    protected toAppError(error: unknown): AppError {
        if (error instanceof AppError) {
            return error;
        }

        if (error instanceof Error) {
            return new AppError({
                code: "SQLITE_WRITE_ERROR",
                message: error.message,
                cause: error,
            });
        }

        return new AppError("An unexpected database error occurred.");
    }
}
