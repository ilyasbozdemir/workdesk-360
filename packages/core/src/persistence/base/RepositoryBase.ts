/**
 * WorkDesk 360 ortak Repository temel sınıfı.
 *
 * Bütün repository implementasyonlarının kullanabileceği
 * ortak bellek altyapısını sağlar.
 *
 * Okuma ve yazma işlemlerini doğrudan üstlenmez.
 *
 * Kullanım:
 *
 * class MyRepository extends RepositoryBase<MyEntity, string> {}
 */

export abstract class RepositoryBase<
    TEntity extends { id: TId },
    TId,
> {
    protected readonly store: Map<TId, TEntity>;

    protected constructor(store?: Map<TId, TEntity>) {
        this.store = store ?? new Map<TId, TEntity>();
    }
}
