/**
 * @module @worksuite-360/core/database/schema
 * @description WorkDesk 360 Çoklu Veritabanı Mimarisi — Mantıksal Şema (Logical Schema) Sözleşmeleri.
 *
 * Bu modül, veritabanı motorlarından (SQLite, PostgreSQL, DuckDB vb.) tamamen bağımsız;
 * tip güvenli tablo, kolon, kısıt (constraint), indeks ve mantıksal koşul modellerini tanımlar.
 */

/**
 * Desteklenen temel mantıksal veri tipleri.
 */
export type LogicalColumnType =
  | 'id'         // Birincil anahtar kimliği (Auto-increment integer veya big identity)
  | 'uuid'       // 36 karakter standart UUID
  | 'string'     // Kısa/sabit metin (kod, unvan, fiş no - tipik VARCHAR(255))
  | 'text'       // Uzun metin, açıklama, gerekçe, şartname metni
  | 'integer'    // 32-bit işaretli tam sayı (adet, sıra no, durum kodu)
  | 'bigint'     // 64-bit tam sayı (büyük sayaçlar, zaman damgaları)
  | 'decimal'    // Sabit noktalı finansal tutar veya ölçüm (Scale: 4, Precision: 18)
  | 'boolean'    // Mantıksal bayrak (true / false)
  | 'date'       // Tarih (YYYY-MM-DD)
  | 'datetime'   // Zaman damgalı tarih (ISO-8601 UTC)
  | 'json'       // Yapılandırılmış JSON nesnesi veya dizisi
  | 'blob';      // İkili veri / bayt dizisi

/**
 * Karşılaştırma operatörleri.
 */
export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

/**
 * Motor bağımsız yapılandırılmış mantıksal koşul (Structured Predicate).
 * Check constraint ve partial index koşullarında raw SQL yerine bu AST kullanılır.
 */
export type StructuredPredicate =
  | { readonly kind: 'in'; readonly column: string; readonly values: Array<string | number | boolean> }
  | { readonly kind: 'compare'; readonly column: string; readonly operator: ComparisonOperator; readonly value: unknown }
  | { readonly kind: 'between'; readonly column: string; readonly min: number | string; readonly max: number | string }
  | { readonly kind: 'notNull'; readonly column: string }
  | { readonly kind: 'isNull'; readonly column: string }
  | { readonly kind: 'and'; readonly conditions: readonly StructuredPredicate[] }
  | { readonly kind: 'or'; readonly conditions: readonly StructuredPredicate[] };

/**
 * Özel / standart dışı SQL ifadeleri için motor bazlı override tanımı.
 */
export interface EngineExpression {
  readonly sqlite?: string;
  readonly postgres?: string;
  readonly duckdb?: string;
}

/**
 * Yabancı anahtar referans eylemleri.
 */
export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

/**
 * Birincil anahtar kısıtı (Tekil veya Composite PK).
 */
export interface PrimaryKeyConstraint {
  readonly type: 'PRIMARY_KEY';
  readonly name?: string;
  readonly columns: readonly string[];
}

/**
 * Benzersizlik kısıtı (Tekil veya Composite UNIQUE).
 */
export interface UniqueConstraint {
  readonly type: 'UNIQUE';
  readonly name?: string;
  readonly columns: readonly string[];
}

/**
 * Yabancı anahtar kısıtı (FOREIGN KEY).
 */
export interface ForeignKeyConstraint {
  readonly type: 'FOREIGN_KEY';
  readonly name?: string;
  readonly columns: readonly string[];
  readonly foreignTable: string;
  readonly foreignColumns: readonly string[];
  readonly onDelete?: ReferentialAction;
  readonly onUpdate?: ReferentialAction;
}

/**
 * Değer doğrulama kısıtı (CHECK CONSTRAINT).
 */
export interface CheckConstraint {
  readonly type: 'CHECK';
  readonly name?: string;
  readonly predicate?: StructuredPredicate;
  readonly rawEngineOverride?: EngineExpression;
  readonly rawDefinition?: string;
}

/**
 * Henüz ayrıştırılamayan veya özel kural gerektiren kısıt.
 * Kuralın sessizce kaybolmasını veya yanlışlıkla CHECK sayılmasını önler.
 */
export interface UnresolvedConstraint {
  readonly type: 'UNRESOLVED';
  readonly rawDefinition: string;
  readonly reason: string;
}

/**
 * Tüm mantıksal kısıt türlerinin birleşimi (Discriminated Union).
 */
export type LogicalConstraint =
  | PrimaryKeyConstraint
  | UniqueConstraint
  | ForeignKeyConstraint
  | CheckConstraint
  | UnresolvedConstraint;

/**
 * Mantıksal indeks tanımı.
 */
export interface LogicalIndex {
  readonly name: string;
  readonly tableName: string;
  readonly columns: readonly string[];
  readonly unique?: boolean;
  readonly filterPredicate?: StructuredPredicate; // Partial index koşulu
  readonly origin: 'explicit_script' | 'table_definition' | 'foreign_key_helper';
}

/**
 * Mantıksal tablo kolon tanımı.
 */
export interface LogicalColumn {
  readonly name: string;
  readonly type: LogicalColumnType;
  readonly nullable: boolean;
  readonly isPrimaryKey: boolean;
  readonly autoIncrement?: boolean;
  readonly defaultValue?: unknown;
  readonly description?: string;
  readonly originType: string; // Orijinal SQLite/DDL tipi (örn: 'REAL', 'INTEGER')
  // Finansal alan meta verileri (Scale = 4 standardı)
  readonly isFinancial?: boolean;
  readonly scale?: number;
  readonly precision?: number;
}

/**
 * Desteklenen hedef veritabanı motorları.
 */
export type TargetEngine = 'sqlite' | 'postgres' | 'duckdb';

/**
 * Tek bir veritabanı motoru için dışa aktarım hazırlık ayrıntısı.
 */
export interface EngineReadinessDetail {
  /** Motor bu tabloyu aktarabilir mi (kritik engel yok mu) */
  readonly ready: boolean;
  /** Aktarımı kesin olarak engelleyen kritik blokörler */
  readonly blockers: readonly string[];
  /** Aktarımı engellemeyen fakat veri bütünlüğü / kısıt farklarını bildiren uyarılar */
  readonly warnings: readonly string[];
  /**
   * PostgreSQL için mantıksal replikasyon / CDC (Change Data Capture) uygunluğu.
   * Tabloda açık bir Primary Key veya REPLICA IDENTITY FULL gereklidir.
   */
  readonly cdcReady?: boolean;
}

/**
 * Desteklenen tüm motorlar için ayrıntılı dışa aktarım hazırlık karnesi.
 */
export interface EngineExportReadiness {
  readonly sqlite: EngineReadinessDetail;
  readonly postgres: EngineReadinessDetail;
  readonly duckdb: EngineReadinessDetail;
}

/**
 * Mantıksal tablo tanımı (Logical Table Model).
 */
export interface LogicalTable {
  readonly name: string;
  readonly description?: string;
  readonly columns: Record<string, LogicalColumn>;
  readonly primaryKey: readonly string[];
  readonly hasPrimaryKey: boolean; // Gerçekte PK var mı (rowid vs explicit PK)
  readonly constraints: readonly LogicalConstraint[];
  readonly indexes: readonly LogicalIndex[];
  readonly hasAudit: boolean;
  // Dışa aktarım ve doğrulama durumu
  readonly isExportReady: boolean; // Geriye dönük uyumluluk (Varsayılan genel aktarım durumu)
  readonly exportReadiness: EngineExportReadiness; // Motor bazlı ayrıntılı hazırlık
  readonly unresolvedConstraintsCount: number;
  readonly exportBlockers: readonly string[]; // Birleşik blokör listesi
}

/**
 * Şema dönüşüm ve denetim raporu (Audit Report).
 */
export interface SchemaAuditReport {
  readonly totalTables: number;
  readonly tablesWithPrimaryKey: number;
  readonly tablesWithoutPrimaryKey: readonly string[];
  readonly totalColumns: number;
  readonly financialColumnsCount: number;
  readonly totalConstraints: number;
  readonly resolvedConstraintsCount: number;
  readonly unresolvedConstraints: ReadonlyArray<{
    readonly tableName: string;
    readonly rawDefinition: string;
    readonly reason: string;
  }>;
  readonly totalIndexes: number;
  readonly isFullyExportReady: boolean;
  readonly engineReadiness: {
    readonly sqlite: { readonly ready: boolean; readonly blockedTables: readonly string[]; readonly warningCount: number };
    readonly postgres: { readonly ready: boolean; readonly blockedTables: readonly string[]; readonly cdcBlockedTables: readonly string[]; readonly warningCount: number };
    readonly duckdb: { readonly ready: boolean; readonly blockedTables: readonly string[]; readonly warningCount: number };
  };
}
