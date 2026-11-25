import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { syncDatabaseSchema, recreateTableSafely } from "../../database/src/index";

describe("Declarative Schema Synchronizer (schema-sync)", () => {
    it("mevcut tablodaki eksik kolonları veri kaybı olmadan otomatik ekler", () => {
        const db = new Database(":memory:");

        // 1. Eski versiyon tablo oluştur ve veri ekle
        db.exec(`CREATE TABLE TEST_Birim (id INTEGER PRIMARY KEY, ad TEXT NOT NULL);`);
        db.exec(`INSERT INTO TEST_Birim (id, ad) VALUES (1, 'Bilgi İşlem');`);

        // 2. Yeni şemada 'kod' ve 'aktif_mi' kolonları eklenmiş olsun
        const targetSchema = {
            tables: [
                {
                    name: "TEST_Birim",
                    columns: [
                        { name: "id", type: "INTEGER", primaryKey: true },
                        { name: "ad", type: "TEXT", notNull: true },
                        { name: "kod", type: "TEXT", default: "GENEL" },
                        { name: "aktif_mi", type: "INTEGER", default: 1 },
                    ],
                },
            ],
        };

        const result = syncDatabaseSchema(db, targetSchema);

        expect(result.columnsAdded).toHaveLength(2);
        expect(result.columnsAdded.map((c) => c.column)).toContain("kod");
        expect(result.columnsAdded.map((c) => c.column)).toContain("aktif_mi");

        // 3. Mevcut verinin korunduğunu ve yeni kolonların değer aldığını doğrula
        const row = db.prepare("SELECT * FROM TEST_Birim WHERE id = 1").get() as any;
        expect(row.ad).toBe("Bilgi İşlem");
        expect(row.kod).toBe("GENEL");
        expect(row.aktif_mi).toBe(1);

        // 4. Tekrar çalıştırıldığında idempotent olduğunu doğrula (aynı kolonları tekrar eklemeye çalışmaz)
        const secondRun = syncDatabaseSchema(db, targetSchema);
        expect(secondRun.columnsAdded).toHaveLength(0);
    });

    it("recreateTableSafely ile yapısal tablo dönüşümünü veriyi koruyarak yapar", () => {
        const db = new Database(":memory:");

        db.exec(`CREATE TABLE TEST_Personel (id INTEGER PRIMARY KEY, ad_soyad TEXT, tc TEXT);`);
        db.exec(`INSERT INTO TEST_Personel (id, ad_soyad, tc) VALUES (10, 'Ali Veli', '12345678901');`);

        // Yeni tabloda 'tc' kalksın, 'unvan' gelsin
        const newTableDef = {
            name: "TEST_Personel",
            columns: [
                { name: "id", type: "INTEGER", primaryKey: true },
                { name: "ad_soyad", type: "TEXT", notNull: true },
                { name: "unvan", type: "TEXT", default: "Memur" },
            ],
        };

        recreateTableSafely(db, "TEST_Personel", newTableDef);

        const row = db.prepare("SELECT * FROM TEST_Personel WHERE id = 10").get() as any;
        expect(row.id).toBe(10);
        expect(row.ad_soyad).toBe("Ali Veli");
        expect(row.unvan).toBe("Memur");
        expect(row.tc).toBeUndefined();
    });
});
