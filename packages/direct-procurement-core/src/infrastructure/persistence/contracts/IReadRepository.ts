/**
 * WorkDesk 360 salt okunur repository sözleşmesi.
 *
 * Veri kaynaklarından kayıt okuma işlemlerini tanımlar.
 * Prisma, SQLite ve InMemory implementasyonları tarafından
 * uygulanabilir.
 *
 * Kullanım:
 *
 * interface IPersonelRepository
 *   extends IReadRepository<Personel, string> {}
 *
 * const result = await repository.getById("123");
 *
 * if (result.success) {
 *   console.log(result.data);
 * }
 */

import type { Result } from "../../../common/types/Result";
import type { AppError } from "../../../common/errors/AppError";

export interface IReadRepository<TEntity, TId> {
    /**
     * Kimliğe göre kayıt getirir.
     */
    getById(id: TId): Promise<Result<TEntity, AppError>>;

    /**
     * Bütün kayıtları getirir.
     */
    getAll(): Promise<Result<TEntity[], AppError>>;

    /**
     * Kaydın mevcut olup olmadığını kontrol eder.
     */
    exists(id: TId): Promise<Result<boolean, AppError>>;
}
