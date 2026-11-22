import { AppError } from "./AppError";

/**
 * Bulunamayan kaynak bilgileri.
 */
export interface NotFoundErrorOptions {
    /** Bulunamayan kaynak türü. */
    resource: string;

    /** Kaynağın kimliği. */
    resourceId?: string;

    /** Özel hata mesajı. */
    message?: string;
}

/**
 * Aranan kaynağın bulunamadığını temsil eder.
 */
export class NotFoundError extends AppError {
    public readonly resource: string;
    public readonly resourceId?: string;

    constructor(options: NotFoundErrorOptions) {
        super({
            code: "NOT_FOUND",
            message: options.message ??
                `${options.resource} kaydı bulunamadı.`,
            details: {
                resource: options.resource,
                resourceId: options.resourceId,
            },
        });

        this.resource = options.resource;
        this.resourceId = options.resourceId;
    }
}
