/**
 * PrismaRepositoryBase
 *
 * Prisma repository sınıfları için ortak altyapıyı sağlar.
 *
 * Sorumlulukları:
 * - Prisma model delegate erişimini yönetmek.
 * - Model işlemleri için ortak yardımcı metotlar sağlamak.
 * - Repository sınıflarına ortak hata dönüşümü sunmak.
 *
 * Kullanım örneği:
 *
 * class UserRepository extends PrismaReadRepository<User, number> {
 *   constructor(prisma: PrismaClient) {
 *     super(prisma.user, "User");
 *   }
 * }
 */

import type { AppError } from "../../common/errors/AppError";
import { AppError as ApplicationError } from "../../common/errors/AppError";

export interface PrismaDelegate<TEntity, TId> {
    findUnique(args: {
        where: Record<string, unknown>;
    }): Promise<TEntity | null>;

    findMany(): Promise<TEntity[]>;

    create(args: {
        data: Record<string, unknown>;
    }): Promise<TEntity>;

    update(args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
    }): Promise<TEntity>;

    delete(args: {
        where: Record<string, unknown>;
    }): Promise<TEntity>;

    count(args: {
        where: Record<string, unknown>;
    }): Promise<number>;
}

export abstract class PrismaRepositoryBase<
    TEntity extends { id: TId },
    TId,
> {
    protected readonly delegate: PrismaDelegate<TEntity, TId>;
    protected readonly modelName: string;

    protected constructor(
        delegate: PrismaDelegate<TEntity, TId>,
        modelName: string,
    ) {
        if (!modelName.trim()) {
            throw new Error("Model name cannot be empty.");
        }

        this.delegate = delegate;
        this.modelName = modelName;
    }

    /**
     * ID üzerinden Prisma where koşulu oluşturur.
     */
    protected getIdWhere(id: TId): Record<string, unknown> {
        return { id };
    }

    /**
     * Bilinmeyen hataları AppError yapısına dönüştürür.
     */
    protected toAppError(error: unknown): AppError {
        if (error instanceof Error) {
            return new ApplicationError(error.message);
        }

        return new ApplicationError(
            `An unexpected ${this.modelName} database error occurred.`,
        );
    }
}
