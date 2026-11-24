/**
 * WorkDesk 360 birleşik repository sözleşmesi.
 *
 * Okuma ve yazma işlemlerini tek bir sözleşmede birleştirir.
 *
 * Kullanım:
 *
 * interface IPersonelRepository
 *   extends IRepository<Personel, string> {}
 */

import type { IReadRepository } from "./IReadRepository";
import type { IWriteRepository } from "./IWriteRepository";

export interface IRepository<TEntity, TId>
    extends IReadRepository<TEntity, TId>, IWriteRepository<TEntity, TId> {}
