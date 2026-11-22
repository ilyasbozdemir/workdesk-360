/**
 * PrismaWriteRepository
 *
 * Prisma üzerinde çalışan yazma repository altyapısı.
 *
 * Sorumlulukları:
 * - Yeni kayıt oluşturmak.
 * - Mevcut kaydı güncellemek.
 * - Kaydı silmek.
 *
 * Kullanım örneği:
 *
 * class UserWriteRepository extends PrismaWriteRepository<User, number> {
 *   constructor(prisma: PrismaClient) {
 *     super(prisma.user, "User");
 *   }
 * }
 */

import type {
    IWriteRepository,
    CreateEntity,
    UpdateEntity,
} from "../../contracts/IWriteRepository";

import type { Result } from "../../../../common/types/Result";
import type { AppError } from "../../../../common/errors/AppError";

import {
    type PrismaDelegate,
    PrismaRepositoryBase,
} from "./PrismaRepositoryBase";

export abstract class PrismaWriteRepository<
    TEntity extends { id: TId },
    TId,
> extends PrismaRepositoryBase<TEntity, TId>
    implements IWriteRepository<TEntity, TId> {
    protected constructor(
        delegate: PrismaDelegate<TEntity, TId>,
        modelName: string,
    ) {
        super(delegate, modelName);
    }

    /**
     * Yeni kayıt oluşturur.
     */
    async create(
        data: CreateEntity<TEntity, TId>,
    ): Promise<Result<TEntity, AppError>> {
        try {
            const entity = await this.delegate.create({
                data: data as Record<string, unknown>,
            });

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
            const entity = await this.delegate.update({
                where: this.getIdWhere(id),
                data: data as Record<string, unknown>,
            });

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
            await this.delegate.delete({
                where: this.getIdWhere(id),
            });

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
}
