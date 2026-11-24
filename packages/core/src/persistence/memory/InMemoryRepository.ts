/**
 * WorkDesk 360 InMemory Repository.
 *
 * ReadRepositoryBase ve WriteRepositoryBase sınıflarını
 * composition yöntemiyle birleştiren concrete implementasyondur.
 *
 * Test, prototip ve veritabanı gerektirmeyen ortamlar için kullanılır.
 *
 * Kullanım:
 *
 * interface Personel {
 *   id: string;
 *   name: string;
 * }
 *
 * const repository = new InMemoryRepository<Personel, string>();
 *
 * await repository.create({
 *   id: "1",
 *   name: "İlyas",
 * });
 *
 * const result = await repository.getById("1");
 *
 * if (result.success) {
 *   console.log(result.data);
 * }
 */

import type { Result } from "../../common/types/Result";
import type { AppError } from "../../common/errors/AppError";

import { RepositoryBase } from "../base/RepositoryBase";
import { ReadRepositoryBase } from "../base/ReadRepositoryBase";
import { WriteRepositoryBase } from "../base/WriteRepositoryBase";
import type { IRepository } from "../contracts/IRepository";
import type { CreateEntity, UpdateEntity } from "../contracts/IWriteRepository";

export class InMemoryRepository<
    TEntity extends { id: TId },
    TId,
> extends RepositoryBase<TEntity, TId> implements IRepository<TEntity, TId> {
    private readonly reader: ReadRepositoryBase<TEntity, TId>;
    private readonly writer: WriteRepositoryBase<TEntity, TId>;

    constructor() {
        super();

        const sharedStore = this.store;

        this.reader = new class extends ReadRepositoryBase<TEntity, TId> {
            constructor() {
                super(sharedStore);
            }
        }();

        this.writer = new class extends WriteRepositoryBase<TEntity, TId> {
            constructor() {
                super(sharedStore);
            }
        }();
    }

    async getById(id: TId): Promise<Result<TEntity, AppError>> {
        return this.reader.getById(id);
    }

    async getAll(): Promise<Result<TEntity[], AppError>> {
        return this.reader.getAll();
    }

    async exists(id: TId): Promise<Result<boolean, AppError>> {
        return this.reader.exists(id);
    }

    async create(
        data: CreateEntity<TEntity, TId>,
    ): Promise<Result<TEntity, AppError>> {
        return this.writer.create(data);
    }

    async update(
        id: TId,
        data: UpdateEntity<TEntity>,
    ): Promise<Result<TEntity, AppError>> {
        return this.writer.update(id, data);
    }

    async delete(id: TId): Promise<Result<void, AppError>> {
        return this.writer.delete(id);
    }

    /**
     * Bellekteki bütün kayıtları temizler.
     * Yalnızca test ve geliştirme amaçlıdır.
     */
    clear(): void {
        this.store.clear();
    }
}
