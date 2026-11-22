import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import type {
    IDatabaseConnection,
    DatabaseExecutionResult,
} from "../../src/index";
import { SQLiteReadRepository } from "../../src/index";
import { SQLiteWriteRepository } from "../../src/index";
import { NotFoundError } from "../../src/index";
import { AppError } from "../../src/index";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

interface TestUser {
    id: number;
    name: string;
    email: string;
}

function createMemoryConnection(): {
    conn: IDatabaseConnection;
    rawDb: any;
} {
    const rawDb = new DatabaseSync(":memory:");
    rawDb.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    );
  `);

    const conn: IDatabaseConnection = {
        async query<TResult = Record<string, unknown>>(
            sql: string,
            params: readonly unknown[] = [],
        ): Promise<TResult[]> {
            const stmt = rawDb.prepare(sql);
            return stmt.all(...params) as TResult[];
        },
        async execute(
            sql: string,
            params: readonly unknown[] = [],
        ): Promise<DatabaseExecutionResult> {
            const stmt = rawDb.prepare(sql);
            const res = stmt.run(...params);
            return {
                changes: Number(res.changes),
                lastInsertRowId: Number(res.lastInsertRowid),
            };
        },
        async close(): Promise<void> {
            rawDb.close();
        },
    };

    return { conn, rawDb };
}

class UserReadRepo extends SQLiteReadRepository<TestUser, number> {
    constructor(conn: IDatabaseConnection) {
        super(conn, "users");
    }
}

class UserWriteRepo extends SQLiteWriteRepository<TestUser, number> {
    constructor(conn: IDatabaseConnection) {
        super(conn, "users");
    }
}

describe("SQLiteReadRepository & SQLiteWriteRepository", () => {
    let conn: IDatabaseConnection;
    let readRepo: UserReadRepo;
    let writeRepo: UserWriteRepo;

    beforeEach(() => {
        const mem = createMemoryConnection();
        conn = mem.conn;
        readRepo = new UserReadRepo(conn);
        writeRepo = new UserWriteRepo(conn);
    });

    describe("SQLiteWriteRepository.create", () => {
        it("yeni kayıt oluşturur ve oluşturulan varlığı döndürür", async () => {
            const result = await writeRepo.create({
                name: "Personel A",
                email: "personel.a@kurum.gov.tr",
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe("Personel A");
                expect(result.data.email).toBe("personel.a@kurum.gov.tr");
            }
        });

        it("boş veri gönderildiğinde hata fırlatır ve AppError döner", async () => {
            const result = await writeRepo.create({} as any);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(AppError);
            }
        });
    });

    describe("SQLiteReadRepository.getById", () => {
        it("var olan kaydı başarıyla getirir", async () => {
            await writeRepo.create({
                id: 1,
                name: "Personel A",
                email: "personel.a@kurum.gov.tr",
            });

            const result = await readRepo.getById(1);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(1);
                expect(result.data.name).toBe("Personel A");
            }
        });

        it("kayıt bulunamadığında NotFoundError döner", async () => {
            const result = await readRepo.getById(999);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(NotFoundError);
                expect((result.error as NotFoundError).resourceId).toBe("999");
            }
        });
    });

    describe("SQLiteReadRepository.exists", () => {
        it("kaydın varlığını doğrular", async () => {
            await writeRepo.create({
                id: 1,
                name: "Personel A",
                email: "personel.a@kurum.gov.tr",
            });

            const existsRes = await readRepo.exists(1);
            expect(existsRes.success).toBe(true);
            if (existsRes.success) {
                expect(existsRes.data).toBe(true);
            }

            const notExistsRes = await readRepo.exists(404);
            expect(notExistsRes.success).toBe(true);
            if (notExistsRes.success) {
                expect(notExistsRes.data).toBe(false);
            }
        });
    });

    describe("SQLiteReadRepository.getAll", () => {
        it("tablodaki tüm kayıtları listeler", async () => {
            await writeRepo.create({
                id: 1,
                name: "Personel A",
                email: "a@kurum.gov.tr",
            });
            await writeRepo.create({
                id: 2,
                name: "Personel B",
                email: "b@kurum.gov.tr",
            });

            const result = await readRepo.getAll();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.length).toBe(2);
                expect(result.data.map((u) => u.name)).toEqual([
                    "Personel A",
                    "Personel B",
                ]);
            }
        });
    });

    describe("SQLiteWriteRepository.update", () => {
        it("mevcut kaydı günceller ve güncellenmiş nesneyi döner", async () => {
            await writeRepo.create({
                id: 1,
                name: "Personel A",
                email: "a@kurum.gov.tr",
            });

            const updateRes = await writeRepo.update(1, {
                name: "Personel A (Güncellendi)",
            });

            expect(updateRes.success).toBe(true);
            if (updateRes.success) {
                expect(updateRes.data.name).toBe("Personel A (Güncellendi)");
                expect(updateRes.data.email).toBe("a@kurum.gov.tr");
            }

            const fetchRes = await readRepo.getById(1);
            if (fetchRes.success) {
                expect(fetchRes.data.name).toBe("Personel A (Güncellendi)");
            }
        });

        it("var olmayan kaydı güncellemeye çalışınca NotFoundError döner", async () => {
            const updateRes = await writeRepo.update(888, {
                name: "Hayali Personel",
            });
            expect(updateRes.success).toBe(false);
            if (!updateRes.success) {
                expect(updateRes.error).toBeInstanceOf(NotFoundError);
            }
        });
    });

    describe("SQLiteWriteRepository.delete", () => {
        it("kaydı veritabanından siler", async () => {
            await writeRepo.create({
                id: 1,
                name: "Personel A",
                email: "a@kurum.gov.tr",
            });

            const deleteRes = await writeRepo.delete(1);
            expect(deleteRes.success).toBe(true);

            const check = await readRepo.exists(1);
            if (check.success) {
                expect(check.data).toBe(false);
            }
        });
    });

    describe("Güvenlik & SQL Enjeksiyon Koruması", () => {
        it("geçersiz tablo adlarında hata fırlatır", () => {
            expect(() => {
                new (class extends SQLiteReadRepository<TestUser, number> {
                    constructor() {
                        super(conn, "users; DROP TABLE users;");
                    }
                })();
            }).toThrow();
        });
    });
});
