import { describe, expect, it } from "vitest";
import { failure, isFailure, isSuccess, success, type Result } from "../../src/common/types/Result";

describe("Result", () => {
    describe("success()", () => {
        it("başarılı sonuç nesnesi oluşturur", () => {
            const res = success({ id: 1, name: "Test" });
            expect(res.success).toBe(true);
            expect(res.data).toEqual({ id: 1, name: "Test" });
        });

        it("primitive değerlerle doğru çalışır", () => {
            expect(success(42).data).toBe(42);
            expect(success("merhaba").data).toBe("merhaba");
            expect(success(true).data).toBe(true);
            expect(success(null).data).toBeNull();
            expect(success(undefined).data).toBeUndefined();
        });

        it("dizi değerleriyle doğru çalışır", () => {
            const list = [1, 2, 3];
            const res = success(list);
            expect(res.data).toEqual([1, 2, 3]);
        });
    });

    describe("failure()", () => {
        it("başarısız sonuç nesnesi oluşturur", () => {
            const err = new Error("İşlem başarısız");
            const res = failure(err);
            expect(res.success).toBe(false);
            expect(res.error).toBe(err);
            expect(res.error.message).toBe("İşlem başarısız");
        });

        it("özel hata nesnesi veya string ile çalışır", () => {
            const res = failure("Özel Hata Kodu");
            expect(res.success).toBe(false);
            expect(res.error).toBe("Özel Hata Kodu");
        });
    });

    describe("isSuccess() and isFailure() type guards", () => {
        it("isSuccess başarılı sonuçta true, başarısızda false döner", () => {
            const ok: Result<number, string> = success(100);
            const fail: Result<number, string> = failure("Hata");

            expect(isSuccess(ok)).toBe(true);
            expect(isSuccess(fail)).toBe(false);

            if (isSuccess(ok)) {
                expect(ok.data).toBe(100);
            }
        });

        it("isFailure başarısız sonuçta true, başarılıda false döner", () => {
            const ok: Result<number, string> = success(100);
            const fail: Result<number, string> = failure("Hata");

            expect(isFailure(ok)).toBe(false);
            expect(isFailure(fail)).toBe(true);

            if (isFailure(fail)) {
                expect(fail.error).toBe("Hata");
            }
        });
    });
});
