import { describe, expect, it } from "vitest";
import { AppError } from "../../src/common/errors/AppError";
import { ValidationError } from "../../src/common/errors/ValidationError";
import { NotFoundError } from "../../src/common/errors/NotFoundError";
import { ConflictError } from "../../src/common/errors/ConflictError";

describe("AppError and Specialized Errors", () => {
    describe("AppError", () => {
        it("string mesaj ile oluşturulduğunda varsayılan kod APP_ERROR atanır", () => {
            const err = new AppError("Beklenmeyen bir hata oluştu.");
            expect(err.message).toBe("Beklenmeyen bir hata oluştu.");
            expect(err.code).toBe("APP_ERROR");
            expect(err.name).toBe("AppError");
            expect(err.details).toBeUndefined();
            expect(err).toBeInstanceOf(Error);
            expect(err).toBeInstanceOf(AppError);
        });

        it("options nesnesi ile oluşturulduğunda tüm alanları korur", () => {
            const cause = new Error("Kök neden");
            const err = new AppError({
                code: "DB_CONNECTION_FAIL",
                message: "Veritabanına bağlanılamadı.",
                cause,
                details: { host: "localhost", port: 5432 },
            });

            expect(err.code).toBe("DB_CONNECTION_FAIL");
            expect(err.message).toBe("Veritabanına bağlanılamadı.");
            expect(err.cause).toBe(cause);
            expect(err.details).toEqual({ host: "localhost", port: 5432 });
        });
    });

    describe("ValidationError", () => {
        it("varsayılan parametrelerle oluşturulabilir", () => {
            const err = new ValidationError();
            expect(err.code).toBe("VALIDATION_ERROR");
            expect(err.message).toBe("Girilen bilgiler doğrulanamadı.");
            expect(err.issues).toEqual([]);
            expect(err.details).toEqual({ issues: [] });
            expect(err).toBeInstanceOf(AppError);
            expect(err).toBeInstanceOf(ValidationError);
        });

        it("özel mesaj ve issue listesi ile oluşturulabilir", () => {
            const issues = [
                { field: "email", message: "Geçersiz e-posta.", code: "INVALID_EMAIL" },
                { field: "ad", message: "Ad alanı zorunludur." },
            ];
            const err = new ValidationError("Form hataları mevcut.", issues);
            expect(err.message).toBe("Form hataları mevcut.");
            expect(err.issues).toHaveLength(2);
            expect(err.issues[0].field).toBe("email");
            expect(err.issues[1].code).toBeUndefined();
            expect(err.details).toEqual({ issues });
        });
    });

    describe("NotFoundError", () => {
        it("varsayılan değerlerle Entity kaydı bulunamadı mesajı üretir", () => {
            const err = new NotFoundError();
            expect(err.code).toBe("NOT_FOUND");
            expect(err.message).toBe("Entity kaydı bulunamadı.");
            expect(err.resource).toBe("Entity");
            expect(err.resourceId).toBeUndefined();
            expect(err).toBeInstanceOf(AppError);
            expect(err).toBeInstanceOf(NotFoundError);
        });

        it("özel kaynak adı ve resourceId kabul eder", () => {
            const err = new NotFoundError({
                resource: "Personel",
                resourceId: "per-99",
            });
            expect(err.message).toBe("Personel kaydı bulunamadı.");
            expect(err.resource).toBe("Personel");
            expect(err.resourceId).toBe("per-99");
            expect(err.details).toEqual({
                resource: "Personel",
                resourceId: "per-99",
            });
        });

        it("özel mesaj verildiğinde varsayılan mesajı ezer", () => {
            const err = new NotFoundError({
                resource: "Dosya",
                message: "İlgili temin dosyası sistemde mevcut değil.",
            });
            expect(err.message).toBe("İlgili temin dosyası sistemde mevcut değil.");
            expect(err.resource).toBe("Dosya");
        });
    });

    describe("ConflictError", () => {
        it("çakışan kaynak ve kimlik ile oluşturulur", () => {
            const err = new ConflictError({
                resource: "Kullanıcı",
                resourceId: "usr-42",
            });
            expect(err.code).toBe("CONFLICT");
            expect(err.message).toBe("Kullanıcı için işlem çakışması oluştu.");
            expect(err.resource).toBe("Kullanıcı");
            expect(err.resourceId).toBe("usr-42");
            expect(err.details).toEqual({
                resource: "Kullanıcı",
                resourceId: "usr-42",
            });
            expect(err).toBeInstanceOf(AppError);
            expect(err).toBeInstanceOf(ConflictError);
        });

        it("özel mesaj verildiğinde özel mesajı korur", () => {
            const err = new ConflictError({
                resource: "Teklif",
                resourceId: "tek-1",
                message: "Aynı istekli için birden fazla teklif girilemez.",
            });
            expect(err.message).toBe("Aynı istekli için birden fazla teklif girilemez.");
            expect(err.resource).toBe("Teklif");
            expect(err.resourceId).toBe("tek-1");
        });
    });
});
