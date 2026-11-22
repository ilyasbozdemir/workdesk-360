/**
 * WorkDesk 360 ortak sayfalama tipleri.
 *
 * Listeleme, sıralama ve sayfalama işlemlerinde
 * bütün modüllerin kullanabileceği sözleşmeleri içerir.
 */

/**
 * Sıralama yönü.
 */
export type SortDirection = "asc" | "desc";

/**
 * Tek bir alan için sıralama seçeneği.
 */
export interface SortOption {
    field: string;
    direction: SortDirection;
}

/**
 * Sayfalama parametreleri.
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
}

/**
 * Genel listeleme parametreleri.
 */
export interface QueryParams extends PaginationParams {
    search?: string;
    sort?: SortOption[];
}

/**
 * Sayfalama meta bilgileri.
 */
export interface PaginationMeta {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

/**
 * Sayfalanmış veri sonucu.
 */
export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationMeta;
}

/**
 * Sayfalama meta bilgilerini oluşturur.
 */
export function createPaginationMeta(
    page: number,
    pageSize: number,
    totalItems: number,
): PaginationMeta {
    if (!Number.isInteger(page) || page < 1) {
        throw new Error("Sayfa numarası en az 1 olmalıdır.");
    }

    if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new Error("Sayfa boyutu en az 1 olmalıdır.");
    }

    if (!Number.isInteger(totalItems) || totalItems < 0) {
        throw new Error("Toplam kayıt sayısı negatif olamaz.");
    }

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
    };
}

/**
 * Sayfalama parametrelerinin başlangıç değerleri.
 */
export const DEFAULT_PAGINATION: Readonly<PaginationParams> = {
    page: 1,
    pageSize: 20,
};

/*
Kullanım örneği

const result: PaginatedResult<TeminDosyasi> = {
  items: dosyalar,
  pagination: createPaginationMeta(1, 20, 125),
};

Örnek sonuç:
{
  items: [...],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 125,
    totalPages: 7,
    hasPreviousPage: false,
    hasNextPage: true
  }
}

*/
