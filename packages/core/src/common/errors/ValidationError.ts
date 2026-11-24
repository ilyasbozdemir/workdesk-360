import { AppError } from "./AppError";

/**
 * Tek bir alan için doğrulama hatası.
 */
export interface ValidationIssue {
    /** Hatanın ilişkili olduğu alan. */
    field: string;

    /** Doğrulama hata mesajı. */
    message: string;

    /** İsteğe bağlı hata kodu. */
    code?: string;
}

/**
 * Uygulama genelindeki doğrulama hataları.
 *
 * Bir veya birden fazla alanın doğrulama başarısızlığını
 * standart şekilde temsil eder.
 */
export class ValidationError extends AppError {
    /** Doğrulama hatalarının listesi. */
    public readonly issues: ValidationIssue[];

    constructor(
        message = "Girilen bilgiler doğrulanamadı.",
        issues: ValidationIssue[] = [],
    ) {
        super({
            code: "VALIDATION_ERROR",
            message,
            details: { issues },
        });

        this.issues = issues;
    }
}

/*
throw new ValidationError("Form bilgileri hatalı.", [
  {
    field: "email",
    message: "Geçerli bir e-posta adresi giriniz.",
    code: "INVALID_EMAIL",
  },
  {
    field: "name",
    message: "Ad alanı zorunludur.",
    code: "REQUIRED",
  },
]);
*/
