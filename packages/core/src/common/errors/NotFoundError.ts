import { AppError } from "./AppError";

/**
 * Bulunamayan kaynak bilgileri.
 */
export interface NotFoundErrorOptions {
    /** Bulunamayan kaynak türü. */
    resource?: string;

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

    constructor(options: NotFoundErrorOptions = {}) {
        const resourceName = options.resource ?? "Entity";
        super({
            code: "NOT_FOUND",
            message: options.message ??
                `${resourceName} kaydı bulunamadı.`,
            details: {
                resource: resourceName,
                resourceId: options.resourceId,
            },
        });

        this.resource = resourceName;
        this.resourceId = options.resourceId;
    }
}
