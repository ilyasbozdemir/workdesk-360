/**
 * PrismaReadRepository
 *
 * Prisma üzerinde çalışan salt okunur repository altyapısı.
 *
 * Sorumlulukları:
 * - ID üzerinden kayıt getirmek.
 * - Tüm kayıtları listelemek.
 * - Kaydın varlığını kontrol etmek.
 *
 * Kullanım örneği:
 *
 * class UserReadRepository extends PrismaReadRepository<User, number> {
 *   constructor(prisma: PrismaClient) {
 *     super(prisma.user, "User");
 *   }
 * }
 */

import type { IReadRepository } from "../../contracts/IReadRepository";
import type { Result } from "../../../../common/types/Result";
import type { AppError } from "../../../../common/errors/AppError";

import { NotFoundError } from "../../../../common/errors/NotFoundError";
import {
    type PrismaDelegate,
    PrismaRepositoryBase,
} from "./PrismaRepositoryBase";

export abstract class PrismaReadRepository<
    TEntity extends { id: TId },
    TId,
> extends PrismaRepositoryBase<TEntity, TId>
    implements IReadRepository<TEntity, TId> {
    protected constructor(
        delegate: PrismaDelegate<TEntity, TId>,
        modelName: string,
    ) {
        super(delegate, modelName);
    }

    /**
     * ID üzerinden kayıt getirir.
     */
    async getById(id: TId): Promise<Result<TEntity, AppError>> {
        try {
            const entity = await this.delegate.findUnique({
                where: this.getIdWhere(id),
            });

            if (!entity) {
                return {
                    success: false,
                    error: new NotFoundError({
                        message: `${this.modelName} not found.`,
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
            const entities = await this.delegate.findMany();

            return {
                success: true,
                data: entities,
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
            const count = await this.delegate.count({
                where: this.getIdWhere(id),
            });

            return {
                success: true,
                data: count > 0,
            };
        } catch (error) {
            return {
                success: false,
                error: this.toAppError(error),
            };
        }
    }
}
