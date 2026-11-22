/**
 * WorkDesk 360 IRepository sözleşme testleri.
 *
 * InMemoryRepository concrete implementasyonu üzerinden
 * ortak CRUD davranışlarını doğrular.
 *
 * Test kapsamı:
 * - create: Kayıt oluşturma ve duplicate ID kontrolü
 * - getById: ID ile kayıt getirme
 * - getAll: Bütün kayıtları listeleme
 * - exists: Kayıt varlığı kontrolü
 * - update: Kayıt güncelleme ve ID koruma
 * - delete: Kayıt silme
 * - NotFoundError: Bulunamayan kayıt kontrolleri
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryRepository } from "../../../../../src/infrastructure/persistence/memory/InMemoryRepository";

interface TestEntity {
    id: string;
    name: string;
}

describe("IRepository", () => {
    let repository: InMemoryRepository<TestEntity, string>;

    beforeEach(() => {
        repository = new InMemoryRepository<TestEntity, string>();
    });

    describe("create", () => {
        it("yeni kayıt oluşturabilmeli", async () => {
            const result = await repository.create({
                id: "1",
                name: "ACME",
            });

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data).toEqual({
                    id: "1",
                    name: "ACME",
                });
            }
        });

        it("aynı ID ile ikinci kayıt oluşturamamalı", async () => {
            await repository.create({
                id: "1",
                name: "ACME",
            });

            const result = await repository.create({
                id: "1",
                name: "Contoso",
            });

            expect(result.success).toBe(false);
        });
    });

    describe("getById", () => {
        it("ID üzerinden kayıt getirebilmeli", async () => {
            await repository.create({
                id: "1",
                name: "ACME",
            });

            const result = await repository.getById("1");

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.name).toBe("ACME");
            }
        });

        it("bulunamayan kayıt için hata döndürmeli", async () => {
            const result = await repository.getById("999");

            expect(result.success).toBe(false);
        });
    });

    describe("getAll", () => {
        it("bütün kayıtları getirebilmeli", async () => {
            await repository.create({
                id: "1",
                name: "ACME",
            });

            await repository.create({
                id: "2",
                name: "Contoso",
            });

            const result = await repository.getAll();

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data).toHaveLength(2);
                expect(result.data.map((item) => item.id)).toEqual([
                    "1",
                    "2",
                ]);
            }
        });

        it("kayıt yoksa boş liste döndürmeli", async () => {
            const result = await repository.getAll();

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data).toEqual([]);
            }
        });
    });

    describe("exists", () => {
        it("kayıt varsa true döndürmeli", async () => {
            await repository.create({
                id: "1",
                name: "ACME",
            });

            const result = await repository.exists("1");

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data).toBe(true);
            }
        });

        it("kayıt yoksa false döndürmeli", async () => {
            const result = await repository.exists("999");

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data).toBe(false);
            }
        });
    });

    describe("update", () => {
        it("mevcut kaydı güncelleyebilmeli", async () => {
            await repository.create({
                id: "1",
                name: "ACME",
            });

            const result = await repository.update("1", {
                name: "ACME Teknoloji",
            });

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data).toEqual({
                    id: "1",
                    name: "ACME Teknoloji",
                });
            }
        });

        it("bulunamayan kaydı güncellememeli", async () => {
            const result = await repository.update("999", {
                name: "Yeni İsim",
            });

            expect(result.success).toBe(false);
        });

        it("güncelleme sırasında ID değerini korumalı", async () => {
            await repository.create({
                id: "1",
                name: "ACME",
            });

            const result = await repository.update("1", {
                id: "999",
                name: "Yeni İsim",
            } as Partial<TestEntity>);

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.id).toBe("1");
            }
        });
    });

    describe("delete", () => {
        it("mevcut kaydı silebilmeli", async () => {
            await repository.create({
                id: "1",
                name: "ACME",
            });

            const result = await repository.delete("1");

            expect(result.success).toBe(true);

            const existsResult = await repository.exists("1");

            expect(existsResult.success).toBe(true);

            if (existsResult.success) {
                expect(existsResult.data).toBe(false);
            }
        });

        it("bulunamayan kaydı silmeye çalıştığında hata döndürmeli", async () => {
            const result = await repository.delete("999");

            expect(result.success).toBe(false);
        });
    });
});
