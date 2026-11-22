/**
 * WorkDesk 360 yazma repository sözleşmesi.
 *
 * Veri kaynaklarında kayıt oluşturma, güncelleme
 * ve silme işlemlerini tanımlar.
 *
 * Kullanım:
 *
 * interface IPersonelRepository
 *   extends IWriteRepository<Personel, string> {}
 *
 * const result = await repository.update("123", {
 *   name: "Yeni Personel",
 * });
 *
 * if (result.success) {
 *   console.log(result.data);
 * }
 */

import type { Result } from "../../../common/types/Result";
import type { AppError } from "../../../common/errors/AppError";

/**
 * Yeni kayıt oluşturma verisi.
 *
 * ID üretimi repository veya ayrı bir ID üretim
 * mekanizması tarafından gerçekleştirilebilir.
 */
export type CreateEntity<TEntity, TId> = Omit<TEntity, "id"> & { id?: TId };

/**
 * Mevcut kayıt güncelleme verisi.
 */
export type UpdateEntity<TEntity> = Partial<Omit<TEntity, "id">>;

export interface IWriteRepository<TEntity, TId> {
    /**
     * Yeni kayıt oluşturur.
     */
    create(
        data: CreateEntity<TEntity, TId>,
    ): Promise<Result<TEntity, AppError>>;

    /**
     * Mevcut kaydı günceller.
     */
    update(
        id: TId,
        data: UpdateEntity<TEntity>,
    ): Promise<Result<TEntity, AppError>>;

    /**
     * Kaydı siler.
     */
    delete(id: TId): Promise<Result<void, AppError>>;
}
