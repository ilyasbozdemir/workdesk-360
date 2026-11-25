/**
 * WorkDesk 360 yazma repository temel sınıfı.
 *
 * RepositoryBase üzerinden ortak depolama altyapısını kullanır.
 *
 * Kayıt oluşturma, güncelleme ve silme işlemlerini sağlar.
 *
 * Kullanım:
 *
 * class MyWriteRepository
 *   extends WriteRepositoryBase<MyEntity, string> {}
 */

import type {
    CreateEntity,
    IWriteRepository,
    UpdateEntity,
} from "../contracts/IWriteRepository";

import type { Result } from "../../common/types/Result";
import type { AppError } from "../../common/errors/AppError";

import { failure, success } from "../../common/types/Result";
import { NotFoundError } from "../../common/errors/NotFoundError";
import { ConflictError } from "../../common/errors/ConflictError";

import { RepositoryBase } from "./RepositoryBase";

export abstract class WriteRepositoryBase<
    TEntity extends { id: TId },
    TId,
> extends RepositoryBase<TEntity, TId>
    implements IWriteRepository<TEntity, TId> {
    async create(
        data: CreateEntity<TEntity, TId>,
    ): Promise<Result<TEntity, AppError>> {
        const entity = data as TEntity;

        if (this.store.has(entity.id)) {
            return failure(
                new ConflictError({
                    resource: "Entity",
                    resourceId: String(entity.id),
                }),
            );
        }

        this.store.set(entity.id, { ...entity });

        return success({ ...entity });
    }

    async update(
        id: TId,
        data: UpdateEntity<TEntity>,
    ): Promise<Result<TEntity, AppError>> {
        const existing = this.store.get(id);

        if (!existing) {
            return failure(
                new NotFoundError({
                    resource: "Entity",
                    resourceId: String(id),
                }),
            );
        }

        const updated = {
            ...existing,
            ...data,
            id,
        } as TEntity;

        this.store.set(id, updated);

        return success({ ...updated });
    }

    async delete(id: TId): Promise<Result<void, AppError>> {
        if (!this.store.has(id)) {
            return failure(
                new NotFoundError({
                    resource: "Entity",
                    resourceId: String(id),
                }),
            );
        }

        this.store.delete(id);

        return success(undefined);
    }
}
