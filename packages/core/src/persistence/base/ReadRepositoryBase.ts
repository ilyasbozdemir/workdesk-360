/**
 * WorkDesk 360 okuma repository temel sınıfı.
 *
 * RepositoryBase üzerinden ortak depolama altyapısını kullanır.
 *
 * Okuma işlemlerinin ortak implementasyonunu sağlar.
 *
 * Kullanım:
 *
 * class MyReadRepository
 *   extends ReadRepositoryBase<MyEntity, string> {}
 */

import type { Result } from "../../common/types/Result";
import type { AppError } from "../../common/errors/AppError";

import { failure, success } from "../../common/types/Result";
import { NotFoundError } from "../../common/errors/NotFoundError";

import { RepositoryBase } from "./RepositoryBase";
import type { IReadRepository } from "../contracts/IReadRepository";

export abstract class ReadRepositoryBase<
    TEntity extends { id: TId },
    TId,
> extends RepositoryBase<TEntity, TId>
    implements IReadRepository<TEntity, TId> {
    async getById(id: TId): Promise<Result<TEntity, AppError>> {
        const entity = this.store.get(id);

        if (!entity) {
            return failure(
                new NotFoundError({
                    resource: "Entity",
                    resourceId: String(id),
                }),
            );
        }

        return success({ ...entity });
    }

    async getAll(): Promise<Result<TEntity[], AppError>> {
        const entities = Array.from(this.store.values()).map(
            (entity) => ({ ...entity }),
        );

        return success(entities);
    }

    async exists(id: TId): Promise<Result<boolean, AppError>> {
        return success(this.store.has(id));
    }
}
