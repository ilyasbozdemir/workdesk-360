/**
 * WorkDesk 360 ortak çakışma hata sınıfı.
 *
 * Bir işlemin mevcut sistem durumu veya kayıtlarla
 * çakışması durumunda kullanılır.
 *
 * Kullanım:
 *
 * throw new ConflictError({
 *   resource: "Personel",
 *   resourceId: "123",
 *   message: "Bu personel zaten kayıtlı.",
 * });
 */

import { AppError } from "./AppError";

/** Çakışma hatası seçenekleri. */
export interface ConflictErrorOptions {
    /** Çakışmanın yaşandığı kaynak. */
    resource: string;

    /** Çakışmanın yaşandığı kaydın kimliği. */
    resourceId?: string;

    /** Özel hata mesajı. */
    message?: string;
}

/**
 * Mevcut durum veya kayıtlarla çakışan işlemleri temsil eder.
 */
export class ConflictError extends AppError {
    public readonly resource: string;
    public readonly resourceId?: string;

    constructor(options: ConflictErrorOptions) {
        super({
            code: "CONFLICT",
            message: options.message ??
                `${options.resource} için işlem çakışması oluştu.`,
            details: {
                resource: options.resource,
                resourceId: options.resourceId,
            },
        });

        this.resource = options.resource;
        this.resourceId = options.resourceId;
    }
}
