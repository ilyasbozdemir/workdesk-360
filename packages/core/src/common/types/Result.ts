/**
 * WorkDesk 360 ortak işlem sonucu tipi.
 *
 * İşlemlerin başarılı veya başarısız sonuçlarını
 * standart bir yapı üzerinden temsil eder.
 *
 * Başarılı işlemlerde data, başarısız işlemlerde error
 * alanı üzerinden sonuca erişilir.
 *
 * Kullanım:
 *
 * const result = getPersonel("123");
 *
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 *
 * Hata sınıflarıyla kullanım:
 *
 * const result: Result<Personel, AppError> = failure(
 *   new NotFoundError({
 *     resource: "Personel",
 *     resourceId: "123",
 *   }),
 * );
 */

/** Başarılı işlem sonucu. */
export interface Success<T> {
    readonly success: true;
    readonly data: T;
}

/** Başarısız işlem sonucu. */
export interface Failure<E> {
    readonly success: false;
    readonly error: E;
}

/** Genel işlem sonucu. */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/** Başarılı sonuç oluşturur. */
export function success<T>(data: T): Success<T> {
    return {
        success: true,
        data,
    };
}

/** Başarısız sonuç oluşturur. */
export function failure<E>(error: E): Failure<E> {
    return {
        success: false,
        error,
    };
}

/** Sonucun başarılı olup olmadığını kontrol eder. */
export function isSuccess<T, E>(
    result: Result<T, E>,
): result is Success<T> {
    return result.success;
}

/** Sonucun başarısız olup olmadığını kontrol eder. */
export function isFailure<T, E>(
    result: Result<T, E>,
): result is Failure<E> {
    return !result.success;
}
