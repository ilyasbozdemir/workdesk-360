import { describe, expect, it } from "vitest";
import {
    createPaginationMeta,
    DEFAULT_PAGINATION,
} from "../../src/common/types/Pagination";

describe("Pagination", () => {
    describe("DEFAULT_PAGINATION", () => {
        it("varsayılan sayfa 1 ve sayfa boyutu 20 olmalıdır", () => {
            expect(DEFAULT_PAGINATION.page).toBe(1);
            expect(DEFAULT_PAGINATION.pageSize).toBe(20);
        });
    });

    describe("createPaginationMeta()", () => {
        it("ilk sayfa için meta bilgilerini doğru hesaplar", () => {
            const meta = createPaginationMeta(1, 10, 25);
            expect(meta).toEqual({
                page: 1,
                pageSize: 10,
                totalItems: 25,
                totalPages: 3,
                hasPreviousPage: false,
                hasNextPage: true,
            });
        });

        it("orta sayfa için hem önceki hem sonraki sayfa mevcuttur", () => {
            const meta = createPaginationMeta(2, 10, 25);
            expect(meta).toEqual({
                page: 2,
                pageSize: 10,
                totalItems: 25,
                totalPages: 3,
                hasPreviousPage: true,
                hasNextPage: true,
            });
        });

        it("son sayfa için hasNextPage false olmalıdır", () => {
            const meta = createPaginationMeta(3, 10, 25);
            expect(meta).toEqual({
                page: 3,
                pageSize: 10,
                totalItems: 25,
                totalPages: 3,
                hasPreviousPage: true,
                hasNextPage: false,
            });
        });

        it("tek sayfalık veride hem hasPreviousPage hem hasNextPage false olmalıdır", () => {
            const meta = createPaginationMeta(1, 10, 5);
            expect(meta).toEqual({
                page: 1,
                pageSize: 10,
                totalItems: 5,
                totalPages: 1,
                hasPreviousPage: false,
                hasNextPage: false,
            });
        });

        it("hiç kayıt olmadığında totalPages 0 ve her iki yön false olmalıdır", () => {
            const meta = createPaginationMeta(1, 10, 0);
            expect(meta).toEqual({
                page: 1,
                pageSize: 10,
                totalItems: 0,
                totalPages: 0,
                hasPreviousPage: false,
                hasNextPage: false,
            });
        });

        it("geçersiz sayfa numarasında hata fırlatır", () => {
            expect(() => createPaginationMeta(0, 10, 100)).toThrow(
                "Sayfa numarası en az 1 olmalıdır.",
            );
            expect(() => createPaginationMeta(-1, 10, 100)).toThrow(
                "Sayfa numarası en az 1 olmalıdır.",
            );
            expect(() => createPaginationMeta(1.5, 10, 100)).toThrow(
                "Sayfa numarası en az 1 olmalıdır.",
            );
        });

        it("geçersiz sayfa boyutunda hata fırlatır", () => {
            expect(() => createPaginationMeta(1, 0, 100)).toThrow(
                "Sayfa boyutu en az 1 olmalıdır.",
            );
            expect(() => createPaginationMeta(1, -5, 100)).toThrow(
                "Sayfa boyutu en az 1 olmalıdır.",
            );
            expect(() => createPaginationMeta(1, 10.5, 100)).toThrow(
                "Sayfa boyutu en az 1 olmalıdır.",
            );
        });

        it("negatif toplam kayıt sayısında hata fırlatır", () => {
            expect(() => createPaginationMeta(1, 10, -1)).toThrow(
                "Toplam kayıt sayısı negatif olamaz.",
            );
            expect(() => createPaginationMeta(1, 10, 2.5)).toThrow(
                "Toplam kayıt sayısı negatif olamaz.",
            );
        });
    });
});
