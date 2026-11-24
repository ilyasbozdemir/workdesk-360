import { describe, expect, it, vi } from "vitest";
import { BetterSqliteExecutor } from "../../src/database/sqlite/BetterSqliteExecutor";
import { IpcSqlExecutor } from "../../src/database/sqlite/IpcSqlExecutor";

describe("SqlExecutors: BetterSqliteExecutor & IpcSqlExecutor", () => {
    describe("BetterSqliteExecutor", () => {
        it("query() fonksiyonu sorguyu hazırlar ve all() sonucunu döner", async () => {
            const mockAll = vi.fn().mockReturnValue([{ id: 1, name: "Test" }]);
            const mockPrepare = vi.fn().mockReturnValue({ all: mockAll });
            const mockDb = {
                prepare: mockPrepare,
                transaction: vi.fn(),
            };

            const executor = new BetterSqliteExecutor(mockDb as any);
            const results = await executor.query("SELECT * FROM test WHERE id = ?", [1]);

            expect(mockPrepare).toHaveBeenCalledWith("SELECT * FROM test WHERE id = ?");
            expect(mockAll).toHaveBeenCalledWith(1);
            expect(results).toEqual([{ id: 1, name: "Test" }]);
        });

        it("execute() fonksiyonu run() sonucundaki changes değerini döner", async () => {
            const mockRun = vi.fn().mockReturnValue({ changes: 3, lastInsertRowid: 10 });
            const mockPrepare = vi.fn().mockReturnValue({ run: mockRun });
            const mockDb = {
                prepare: mockPrepare,
                transaction: vi.fn(),
            };

            const executor = new BetterSqliteExecutor(mockDb as any);
            const res = await executor.execute("DELETE FROM test WHERE id > ?", [5]);

            expect(mockPrepare).toHaveBeenCalledWith("DELETE FROM test WHERE id > ?");
            expect(mockRun).toHaveBeenCalledWith(5);
            expect(res).toEqual({ changes: 3 });
        });

        it("transaction() fonksiyonu ifadeleri transaction bloğu içinde çalıştırır", async () => {
            const run1 = vi.fn().mockReturnValue({ changes: 1 });
            const run2 = vi.fn().mockReturnValue({ changes: 1 });
            const prepare1 = { run: run1 };
            const prepare2 = { run: run2 };

            const mockPrepare = vi.fn().mockImplementation((sql: string) => {
                if (sql.includes("stmt1")) return prepare1;
                return prepare2;
            });

            const mockDb = {
                prepare: mockPrepare,
                transaction: (fn: () => unknown) => () => fn(),
            };

            const executor = new BetterSqliteExecutor(mockDb as any);
            const results = await executor.transaction([
                { sql: "stmt1", params: ["p1"] },
                { sql: "stmt2", params: ["p2"] },
            ]);

            expect(mockPrepare).toHaveBeenCalledWith("stmt1");
            expect(mockPrepare).toHaveBeenCalledWith("stmt2");
            expect(results).toHaveLength(2);
        });
    });

    describe("IpcSqlExecutor", () => {
        it("query() db:query kanalına çağrı yapar ve veri döner", async () => {
            const mockInvoke = vi.fn().mockResolvedValue({
                success: true,
                data: [{ id: 10, title: "Dosya" }],
            });
            const executor = new IpcSqlExecutor({ invoke: mockInvoke });

            const data = await executor.query("SELECT * FROM dosyalar WHERE id = ?", [10]);
            expect(mockInvoke).toHaveBeenCalledWith(
                "db:query",
                "SELECT * FROM dosyalar WHERE id = ?",
                [10],
            );
            expect(data).toEqual([{ id: 10, title: "Dosya" }]);
        });

        it("query() hata durumunda fırlatır", async () => {
            const mockInvoke = vi.fn().mockResolvedValue({
                success: false,
                error: "Sorgu hatası",
            });
            const executor = new IpcSqlExecutor({ invoke: mockInvoke });

            await expect(executor.query("SELECT 1")).rejects.toThrow(
                "[IpcSqlExecutor.query] Sorgu hatası",
            );
        });

        it("execute() db:run kanalına çağrı yapar ve changes döner", async () => {
            const mockInvoke = vi.fn().mockResolvedValue({
                success: true,
                data: { changes: 1 },
            });
            const executor = new IpcSqlExecutor({ invoke: mockInvoke });

            const res = await executor.execute("UPDATE dosyalar SET status = ?", ["ONAY"]);
            expect(mockInvoke).toHaveBeenCalledWith(
                "db:run",
                "UPDATE dosyalar SET status = ?",
                ["ONAY"],
            );
            expect(res).toEqual({ changes: 1 });
        });

        it("execute() başarısızlıkta hata fırlatır", async () => {
            const mockInvoke = vi.fn().mockResolvedValue({
                success: false,
                error: "Kilit hatası",
            });
            const executor = new IpcSqlExecutor({ invoke: mockInvoke });

            await expect(executor.execute("UPDATE dosyalar SET x = 1")).rejects.toThrow(
                "[IpcSqlExecutor.execute] Kilit hatası",
            );
        });

        it("transaction() db:transaction kanalına çağrı yapar", async () => {
            const mockInvoke = vi.fn().mockResolvedValue({
                success: true,
                data: [{ changes: 1 }],
            });
            const executor = new IpcSqlExecutor({ invoke: mockInvoke });

            const res = await executor.transaction([{ sql: "INSERT INTO x VALUES (1)" }]);
            expect(mockInvoke).toHaveBeenCalledWith("db:transaction", [
                { sql: "INSERT INTO x VALUES (1)" },
            ]);
            expect(res).toEqual([{ changes: 1 }]);
        });

        it("transaction() başarısızlıkta hata fırlatır", async () => {
            const mockInvoke = vi.fn().mockResolvedValue({
                success: false,
                error: "Rollback oldu",
            });
            const executor = new IpcSqlExecutor({ invoke: mockInvoke });

            await expect(executor.transaction([])).rejects.toThrow(
                "[IpcSqlExecutor.transaction] Rollback oldu",
            );
        });
    });
});
