import type Database from "better-sqlite3";

export interface ColumnDiff {
    table: string;
    column: string;
    type: string;
}

export interface SchemaSyncResult {
    tablesCreated: string[];
    columnsAdded: ColumnDiff[];
    indexesEnsured: string[];
    warnings: string[];
}

/**
 * SQLite ALTER TABLE ADD COLUMN için güvenli SQL default değer biçimlendirici.
 */
function formatSqlDefault(defaultVal: any): string {
    if (defaultVal === null || defaultVal === undefined) return "NULL";
    if (typeof defaultVal === "number" || typeof defaultVal === "boolean") {
        return typeof defaultVal === "boolean" ? (defaultVal ? "1" : "0") : String(defaultVal);
    }
    const str = String(defaultVal).trim();
    const upper = str.toUpperCase();
    if (
        upper === "CURRENT_TIMESTAMP" ||
        upper === "CURRENT_DATE" ||
        upper === "CURRENT_TIME" ||
        upper === "NULL" ||
        !isNaN(Number(str))
    ) {
        return str;
    }
    return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Canlı veritabanındaki tüm kullanıcı tablolarının listesini döndürür.
 */
export function getExistingTableNames(db: Database.Database): Set<string> {
    const rows = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];
    return new Set(rows.map((r) => r.name));
}

/**
 * Belirtilen tablonun mevcut kolonlarını `PRAGMA table_info` üzerinden döndürür.
 */
export function getExistingTableColumns(
    db: Database.Database,
    tableName: string,
): Map<string, { cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }> {
    try {
        const rows = db.prepare(`PRAGMA table_info("${tableName}")`).all() as {
            cid: number;
            name: string;
            type: string;
            notnull: number;
            dflt_value: any;
            pk: number;
        }[];
        const map = new Map();
        for (const r of rows) {
            map.set(r.name.toLowerCase(), r);
        }
        return map;
    } catch {
        return new Map();
    }
}

/**
 * SQLite CREATE TABLE için kolon SQL satırını üretir.
 */
export function buildColumnSql(col: any, forAddColumn = false): string {
    let sql = `"${col.name}" ${col.type || "TEXT"}`;

    if (!forAddColumn) {
        if (col.primaryKey) sql += " PRIMARY KEY";
        if (col.autoIncrement) sql += " AUTOINCREMENT";
        if (col.unique) sql += " UNIQUE";
        if (col.notNull) sql += " NOT NULL";
    }

    if (col.default !== undefined) {
        const upper = String(col.default).trim().toUpperCase();
        if (forAddColumn && (upper === "CURRENT_TIMESTAMP" || upper === "CURRENT_DATE" || upper === "CURRENT_TIME")) {
            // SQLite ALTER TABLE ADD COLUMN ile dinamik fonksiyon/ifade varsayılanlarına izin vermez
        } else {
            sql += ` DEFAULT ${formatSqlDefault(col.default)}`;
        }
    }

    if (forAddColumn && col.notNull && col.default !== undefined) {
        sql += " NOT NULL";
    }

    return sql;
}

/**
 * Bildirime dayalı otomatik şema eşitleyici (Declarative Auto-Schema Synchronizer).
 *
 * `tables/*.ts` tanımlarını canlı SQLite veritabanıyla kıyaslar:
 * 1. Olmayan tabloları oluşturur (`CREATE TABLE IF NOT EXISTS`).
 * 2. Var olan tablolarda eksik kolonları güvenle ekler (`ALTER TABLE ADD COLUMN`).
 * 3. Eksik indeksleri tesis eder.
 *
 * @param db - BetterSqlite3 veritabanı bağlantısı.
 * @param schemaDef - Hedef şema tanımı (`schema` veya `targetSchema`).
 */
export function syncDatabaseSchema(
    db: Database.Database,
    schemaDef: { tables: any[] },
): SchemaSyncResult {
    const result: SchemaSyncResult = {
        tablesCreated: [],
        columnsAdded: [],
        indexesEnsured: [],
        warnings: [],
    };

    if (!schemaDef || !Array.isArray(schemaDef.tables)) {
        return result;
    }

    const existingTables = getExistingTableNames(db);

    for (const table of schemaDef.tables) {
        const tableName = table.name;
        if (!tableName) continue;

        if (!existingTables.has(tableName)) {
            // Tablo hiç yok -> CREATE TABLE
            const columnsSql = (table.columns || [])
                .map((col: any) => buildColumnSql(col, false))
                .join(", ");
            const constraintsSql = table.constraints ? `, ${table.constraints.join(", ")}` : "";

            db.exec(`CREATE TABLE IF NOT EXISTS "${tableName}" (${columnsSql}${constraintsSql});`);
            existingTables.add(tableName);
            result.tablesCreated.push(tableName);

            // Başlangıç verisi (seed) varsa ekle
            if (table.initialData && table.initialData.length > 0) {
                for (const row of table.initialData) {
                    const keys = Object.keys(row);
                    const values = Object.values(row).map((v) =>
                        typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : v === null ? "NULL" : v
                    );
                    db.exec(
                        `INSERT OR IGNORE INTO "${tableName}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${values.join(", ")});`
                    );
                }
            }
        } else {
            // Tablo mevcut -> Eksik kolonları tespit et ve ekle
            const existingColumns = getExistingTableColumns(db, tableName);

            for (const col of table.columns || []) {
                const colNameLower = col.name.toLowerCase();
                if (!existingColumns.has(colNameLower)) {
                    const addColSql = buildColumnSql(col, true);
                    try {
                        db.exec(`ALTER TABLE "${tableName}" ADD COLUMN ${addColSql};`);
                        existingColumns.set(colNameLower, {
                            cid: existingColumns.size,
                            name: col.name,
                            type: col.type,
                            notnull: col.notNull ? 1 : 0,
                            dflt_value: col.default,
                            pk: col.primaryKey ? 1 : 0,
                        });
                        result.columnsAdded.push({
                            table: tableName,
                            column: col.name,
                            type: col.type,
                        });
                    } catch (err: any) {
                        const errMsg = err?.message || String(err);
                        if (errMsg.includes("duplicate column") || errMsg.includes("already exists")) {
                            // Zaten eklenmiş, yoksay
                        } else {
                            result.warnings.push(
                                `[SchemaSync] ${tableName}.${col.name} eklenirken hata: ${errMsg}`
                            );
                        }
                    }
                }
            }
        }
    }

    return result;
}

/**
 * SQLite Resmi 12-Adım Tablo Yeniden Yapılandırma Yardımcısı (Table Recreation).
 *
 * Kolon tipi değişimi, kolon silme veya yapısal kısıt değişikliklerinde
 * veriyi kaybetmeden güvenli göç sağlar.
 */
export function recreateTableSafely(
    db: Database.Database,
    tableName: string,
    newTableDef: any,
): void {
    const existingColumns = getExistingTableColumns(db, tableName);
    if (existingColumns.size === 0) return;

    const tempTableName = `${tableName}__migration_backup`;

    db.exec("PRAGMA foreign_keys = OFF;");
    const runTransaction = db.transaction(() => {
        // 1. Yeni tanıma sahip geçici tablo oluştur
        const columnsSql = (newTableDef.columns || [])
            .map((col: any) => buildColumnSql(col, false))
            .join(", ");
        const constraintsSql = newTableDef.constraints ? `, ${newTableDef.constraints.join(", ")}` : "";
        db.exec(`CREATE TABLE "${tempTableName}" (${columnsSql}${constraintsSql});`);

        // 2. Ortak kolonları bul
        const newColNames = new Set((newTableDef.columns || []).map((c: any) => c.name.toLowerCase()));
        const commonCols: string[] = [];
        for (const [colLower, colInfo] of existingColumns.entries()) {
            if (newColNames.has(colLower)) {
                commonCols.push(`"${colInfo.name}"`);
            }
        }

        // 3. Verileri kopyala
        if (commonCols.length > 0) {
            const colsJoined = commonCols.join(", ");
            db.exec(`INSERT INTO "${tempTableName}" (${colsJoined}) SELECT ${colsJoined} FROM "${tableName}";`);
        }

        // 4. Eski tabloyu düşür
        db.exec(`DROP TABLE "${tableName}";`);

        // 5. Geçici tabloyu asıl adıyla yeniden adlandır
        db.exec(`ALTER TABLE "${tempTableName}" RENAME TO "${tableName}";`);
    });

    try {
        runTransaction();
    } finally {
        db.exec("PRAGMA foreign_keys = ON;");
    }
}
