import type Database from 'better-sqlite3';
import type { LogicalIndex } from '../types';
import { INDEX_REGISTRY } from '../registry/indexRegistry';
import { sanitizeIdentifier, compilePredicateToSqlite } from '../compiler/sqlitePredicateCompiler';

/**
 * İndeks oluşturma sürecinde fırlatılan özel hata sınıfı.
 */
export class IndexCreationError extends Error {
  readonly indexName: string;
  readonly tableName: string;
  readonly ddl: string;

  constructor(indexName: string, tableName: string, ddl: string, cause: unknown) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(`[IndexCreationError] "${tableName}" üzerindeki "${indexName}" indeksi oluşturulamadı: ${causeMsg}\nDDL: ${ddl}`);
    this.name = 'IndexCreationError';
    this.indexName = indexName;
    this.tableName = tableName;
    this.ddl = ddl;
  }
}

/**
 * İndeks çalıştırma ve oluşturma denetim raporu.
 */
export interface IndexExecutionReport {
  readonly totalRegistered: number;
  readonly createdCount: number;
  readonly skippedCount: number;
  readonly failedCount: number;
  readonly errors: ReadonlyArray<{
    readonly indexName: string;
    readonly tableName: string;
    readonly ddl: string;
    readonly error: string;
  }>;
}

/**
 * LogicalIndex tanımından SQLite uyumlu DDL (Data Definition Language) cümlesi üretir.
 * Partial index (filterPredicate) ve UNIQUE bayraklarını destekler.
 */
export function buildSqliteIndexDdl(idx: LogicalIndex): string {
  if (!idx || !idx.name || !idx.tableName || !Array.isArray(idx.columns) || idx.columns.length === 0) {
    throw new Error(`Geçersiz LogicalIndex tanımı: ${JSON.stringify(idx)}`);
  }

  const safeIdxName = sanitizeIdentifier(idx.name);
  const safeTableName = sanitizeIdentifier(idx.tableName);
  const safeCols = idx.columns.map(sanitizeIdentifier).join(', ');
  const uniqueClause = idx.unique ? 'UNIQUE ' : '';

  let ddl = `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${safeIdxName} ON ${safeTableName}(${safeCols})`;

  if (idx.filterPredicate) {
    const whereSql = compilePredicateToSqlite(idx.filterPredicate);
    ddl += ` WHERE ${whereSql}`;
  }

  return `${ddl};`;
}

export interface CreateRegisteredIndexesOptions {
  /**
   * Katı hata modu.
   * true ise: İlk indeks oluşturma hatasında `IndexCreationError` fırlatılır.
   * false ise: Hatalar raporlanır ve console.warn basılır, süreç devam eder.
   * Varsayılan: false
   */
  strict?: boolean;
  /**
   * Hedef şema nesnesi (varsa sadece şemada mevcut tablolara indeks oluşturulur).
   */
  targetSchema?: { tables?: Array<{ name: string }> };
  /**
   * Özel veya test amaçlı indeks kataloğu (varsayılan: INDEX_REGISTRY).
   */
  registry?: Record<string, LogicalIndex[]>;
}

/**
 * Veritabanında tanımlı tablolar için INDEX_REGISTRY içerisindeki tüm indeksleri oluşturur.
 */
export function createRegisteredIndexes(
  db: Database.Database,
  options?: CreateRegisteredIndexesOptions
): IndexExecutionReport {
  const strict = Boolean(options?.strict);
  const registry = options?.registry || INDEX_REGISTRY;
  const targetSchema = options?.targetSchema;

  let totalRegistered = 0;
  let createdCount = 0;
  let skippedCount = 0;
  const errors: Array<{
    indexName: string;
    tableName: string;
    ddl: string;
    error: string;
  }> = [];

  for (const [tableName, indexes] of Object.entries(registry)) {
    // Hedef şemada bu tablo tanımlı değilse atla
    if (targetSchema?.tables && !targetSchema.tables.some((t) => t.name === tableName)) {
      skippedCount += indexes.length;
      continue;
    }

    for (const idx of indexes) {
      totalRegistered++;
      let ddl = '';
      try {
        ddl = buildSqliteIndexDdl(idx);
        db.exec(ddl);
        createdCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errRecord = {
          indexName: idx.name,
          tableName: idx.tableName,
          ddl,
          error: errorMsg,
        };
        errors.push(errRecord);

        if (strict) {
          throw new IndexCreationError(idx.name, idx.tableName, ddl, err);
        } else {
          console.warn(`[IndexRegistry] ${idx.name} oluşturulamadı (strict: false):`, errorMsg);
        }
      }
    }
  }

  return {
    totalRegistered,
    createdCount,
    skippedCount,
    failedCount: errors.length,
    errors,
  };
}
