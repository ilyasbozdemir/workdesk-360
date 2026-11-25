import { describe, expect, it, vi } from "vitest";
import { PrismaReadRepository } from "../../src/persistence/prisma/PrismaReadRepository";
import { PrismaWriteRepository } from "../../src/persistence/prisma/PrismaWriteRepository";
import type { PrismaDelegate } from "../../src/persistence/prisma/PrismaRepositoryBase";
import { NotFoundError } from "../../src/common/errors/NotFoundError";
import { AppError } from "../../src/common/errors/AppError";

interface UserEntity {
    id: number;
    username: string;
    role: string;
}

class UserPrismaReadRepo extends PrismaReadRepository<UserEntity, number> {
    constructor(delegate: PrismaDelegate<UserEntity, number>) {
        super(delegate, "User");
    }
}

class UserPrismaWriteRepo extends PrismaWriteRepository<UserEntity, number> {
    constructor(delegate: PrismaDelegate<UserEntity, number>) {
        super(delegate, "User");
    }
}

describe("Prisma Repositories (PrismaReadRepository & PrismaWriteRepository)", () => {
    describe("PrismaReadRepository", () => {
        it("getById: var olan kaydı başarıyla getirir", async () => {
            const mockDelegate = {
                findUnique: vi.fn().mockResolvedValue({
                    id: 1,
                    username: "ali",
                    role: "ADMIN",
                }),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaReadRepo(mockDelegate);
            const result = await repo.getById(1);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ id: 1, username: "ali", role: "ADMIN" });
            }
            expect(mockDelegate.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it("getById: kayıt bulunamadığında NotFoundError döner", async () => {
            const mockDelegate = {
                findUnique: vi.fn().mockResolvedValue(null),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaReadRepo(mockDelegate);
            const result = await repo.getById(404);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(NotFoundError);
                expect((result.error as NotFoundError).resourceId).toBe("404");
            }
        });

        it("getById: veritabanı hatası fırlatıldığında AppError döner", async () => {
            const mockDelegate = {
                findUnique: vi.fn().mockRejectedValue(new Error("Database connection lost")),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaReadRepo(mockDelegate);
            const result = await repo.getById(1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(AppError);
                expect(result.error.message).toContain("Database connection lost");
            }
        });

        it("getAll: tüm kayıtları getirir", async () => {
            const mockDelegate = {
                findMany: vi.fn().mockResolvedValue([
                    { id: 1, username: "ali", role: "ADMIN" },
                    { id: 2, username: "ayse", role: "USER" },
                ]),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaReadRepo(mockDelegate);
            const result = await repo.getAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
            }
        });

        it("exists: kayıt var ise true, yok ise false döner", async () => {
            const mockDelegate = {
                count: vi.fn()
                    .mockResolvedValueOnce(1)
                    .mockResolvedValueOnce(0),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaReadRepo(mockDelegate);

            const resTrue = await repo.exists(1);
            expect(resTrue.success).toBe(true);
            if (resTrue.success) expect(resTrue.data).toBe(true);

            const resFalse = await repo.exists(999);
            expect(resFalse.success).toBe(true);
            if (resFalse.success) expect(resFalse.data).toBe(false);
        });
    });

    describe("PrismaWriteRepository", () => {
        it("create: yeni kayıt oluşturur", async () => {
            const mockDelegate = {
                create: vi.fn().mockResolvedValue({
                    id: 10,
                    username: "fatma",
                    role: "EDITOR",
                }),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaWriteRepo(mockDelegate);
            const result = await repo.create({ username: "fatma", role: "EDITOR" });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(10);
            }
            expect(mockDelegate.create).toHaveBeenCalledWith({
                data: { username: "fatma", role: "EDITOR" },
            });
        });

        it("update: kaydı günceller ve güncel halini döner", async () => {
            const mockDelegate = {
                update: vi.fn().mockResolvedValue({
                    id: 10,
                    username: "fatma-updated",
                    role: "EDITOR",
                }),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaWriteRepo(mockDelegate);
            const result = await repo.update(10, { username: "fatma-updated" });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.username).toBe("fatma-updated");
            }
            expect(mockDelegate.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { username: "fatma-updated" },
            });
        });

        it("delete: kaydı siler", async () => {
            const mockDelegate = {
                delete: vi.fn().mockResolvedValue({ id: 10 }),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaWriteRepo(mockDelegate);
            const result = await repo.delete(10);

            expect(result.success).toBe(true);
            expect(mockDelegate.delete).toHaveBeenCalledWith({
                where: { id: 10 },
            });
        });

        it("delete: silme sırasında hata olursa AppError döner", async () => {
            const mockDelegate = {
                delete: vi.fn().mockRejectedValue(new Error("Record not found")),
            } as unknown as PrismaDelegate<UserEntity, number>;

            const repo = new UserPrismaWriteRepo(mockDelegate);
            const result = await repo.delete(999);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(AppError);
            }
        });
    });
});
