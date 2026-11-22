/**
 * WorkDesk 360 ortak uygulama hata sınıfı.
 *
 * Uygulamanın farklı modüllerinde oluşan hataların
 * standart bir yapıda temsil edilmesini sağlar.
 *
 * Veritabanı, Electron veya UI bağımlılığı içermez.
 */

export interface AppErrorOptions {
    /** Hatanın benzersiz kodu. */
    code: string;

    /** Kullanıcıya veya log sistemine gösterilecek mesaj. */
    message: string;

    /** Hatanın oluşmasına neden olan asıl hata. */
    cause?: unknown;

    /** Hatanın ek bağlam bilgileri. */
    details?: Record<string, unknown>;
}

export class AppError extends Error {
    /** Hatanın benzersiz kodu. */
    public readonly code: string;

    /** Hatanın ek bağlam bilgileri. */
    public readonly details?: Record<string, unknown>;

    constructor(options: AppErrorOptions) {
        super(options.message, { cause: options.cause });

        this.name = new.target.name;
        this.code = options.code;
        this.details = options.details;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}
