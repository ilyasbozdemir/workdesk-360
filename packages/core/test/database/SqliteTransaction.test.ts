import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import type {
    IDatabaseConnection,
    DatabaseExecutionResult,
} from "../../src/database/contracts/IDatabaseConnection";
import { SqliteTransaction } from "../../src/database/sqlite/SqliteTransaction";
import { AppError } from "../../src/common/errors/AppError";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

function createRealSqliteConnection(): {
    conn: IDatabaseConnection;
    rawDb: any;
} {
    const rawDb = new DatabaseSync(":memory:");
    rawDb.exec(`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY,
      owner TEXT NOT NULL,
      balance INTEGER NOT NULL
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
        async beginTransaction(): Promise<SqliteTransaction> {
            return SqliteTransaction.begin(this);
        },
        async close(): Promise<void> {
            rawDb.close();
        },
    };

    return { conn, rawDb };
}

describe("SqliteTransaction (ACID Compliance Verification)", () => {
    let conn: IDatabaseConnection;
    let rawDb: any;

    beforeEach(async () => {
        const fixture = createRealSqliteConnection();
        conn = fixture.conn;
        rawDb = fixture.rawDb;

        // Başlangıç verisi
        await conn.execute("INSERT INTO accounts (id, owner, balance) VALUES (?, ?, ?)", [
            1,
            "Ahmet",
            1000,
        ]);
        await conn.execute("INSERT INTO accounts (id, owner, balance) VALUES (?, ?, ?)", [
            2,
            "Mehmet",
            500,
        ]);
    });

    it("başlatıldığında isActive true olmalıdır", async () => {
        const tx = await SqliteTransaction.begin(conn);
        expect(tx.isActive).toBe(true);
        await tx.commit();
        expect(tx.isActive).toBe(false);
    });

    it("Atomicity & Commit: Birden fazla işlemi tek seferde kalıcı hale getirir", async () => {
        const tx = await SqliteTransaction.begin(conn);

        // Ahmet'ten 200 TL çek, Mehmet'e 200 TL yatır
        await tx.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", [200, 1]);
        await tx.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [200, 2]);

        await tx.commit();

        expect(tx.isActive).toBe(false);

        // Değişiklikler veritabanına gerçekten yansıdı mı?
        const rows = await conn.query<{ id: number; balance: number }>(
            "SELECT id, balance FROM accounts ORDER BY id",
        );
        expect(rows[0].balance).toBe(800);
        expect(rows[1].balance).toBe(700);
    });

    it("Atomicity & Rollback: Rollback yapıldığında veritabanı durumunu eksiksiz olarak eski haline geri döndürür", async () => {
        const tx = await SqliteTransaction.begin(conn);

        // Yeni bir hesap ekle ve mevcut hesabı güncelle
        await tx.execute("INSERT INTO accounts (id, owner, balance) VALUES (?, ?, ?)", [
            3,
            "Ayşe",
            2500,
        ]);
        await tx.execute("UPDATE accounts SET balance = 0 WHERE id = 1");

        // Rollback çağrısı
        await tx.rollback();

        expect(tx.isActive).toBe(false);

        // ACID Testi: Eklenen kayıt silinmiş ve güncellenen bakiye eski haline dönmüş olmalıdır
        const rows = await conn.query<{ id: number; owner: string; balance: number }>(
            "SELECT id, owner, balance FROM accounts ORDER BY id",
        );
        expect(rows).toHaveLength(2);
        expect(rows[0].balance).toBe(1000);
        expect(rows.find((r) => r.id === 3)).toBeUndefined();
    });

    it("Hata durumunda rollback: SQL yürütme hatası oluştuğunda bağlantı bozulmaz ve rollback yapılabilir", async () => {
        const tx = await SqliteTransaction.begin(conn);

        await tx.execute("UPDATE accounts SET balance = 9999 WHERE id = 1");

        // Unique constraint ihlali (Primary Key çakışması)
        await expect(
            tx.execute("INSERT INTO accounts (id, owner, balance) VALUES (?, ?, ?)", [
                1,
                "Çakışan ID",
                100,
            ]),
        ).rejects.toThrow(AppError);

        // Hata sonrası rollback çağırılır
        await tx.rollback();

        // 1 numaralı hesabın bakiyesi 1000 olarak kalmalıdır, 9999 olmamalıdır
        const rows = await conn.query<{ balance: number }>(
            "SELECT balance FROM accounts WHERE id = 1",
        );
        expect(rows[0].balance).toBe(1000);
    });

    it("İç içe (Nested) Savepoint Isolation: İç transaction rollback olsa dahi dış transaction bağımsız çalışır", async () => {
        const outerTx = await SqliteTransaction.begin(conn, "outer");
        await outerTx.execute("UPDATE accounts SET balance = 900 WHERE id = 1");

        // İç Savepoint
        const innerTx = await SqliteTransaction.begin(conn, "inner");
        await innerTx.execute("INSERT INTO accounts (id, owner, balance) VALUES (?, ?, ?)", [
            4,
            "Fatma",
            300,
        ]);
        // İç transaction rollback yapılıyor
        await innerTx.rollback();

        // Dış transaction commit ediliyor
        await outerTx.commit();

        const rows = await conn.query<{ id: number; owner: string; balance: number }>(
            "SELECT id, owner, balance FROM accounts ORDER BY id",
        );
        // Ahmet 900 olmalı (dış tx commit edildi)
        expect(rows.find((r) => r.id === 1)?.balance).toBe(900);
        // Fatma olmamalı (iç tx rollback edildi)
        expect(rows.find((r) => r.id === 4)).toBeUndefined();
    });

    it("Sonlanmış transaction üzerinde işlem yapmayı engeller", async () => {
        const tx = await SqliteTransaction.begin(conn);
        await tx.commit();

        // Tekrar execute çağrılamaz
        await expect(tx.execute("SELECT 1")).rejects.toThrow(
            "Cannot execute statement: transaction is no longer active.",
        );

        // Tekrar commit çağrılamaz
        await expect(tx.commit()).rejects.toThrow(
            "Cannot commit: transaction has already been committed.",
        );

        // Tekrar rollback çağrılamaz
        await expect(tx.rollback()).rejects.toThrow(
            "Cannot rollback: transaction has already been committed.",
        );
    });

    it("Rollback sonrası tekrar commit veya rollback çağrılamaz", async () => {
        const tx = await SqliteTransaction.begin(conn);
        await tx.rollback();

        await expect(tx.commit()).rejects.toThrow(
            "Cannot commit: transaction has already been rolled back.",
        );

        await expect(tx.rollback()).rejects.toThrow(
            "Cannot rollback: transaction has already been rolled back.",
        );
    });
});
