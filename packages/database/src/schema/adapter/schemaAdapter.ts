import type {
  LogicalTable,
  LogicalColumn,
  LogicalConstraint,
  PrimaryKeyConstraint,
  ForeignKeyConstraint,
  UniqueConstraint,
  SchemaAuditReport,
  LogicalColumnType,
  EngineExportReadiness,
} from '../types';
import type { TableSchema, TableColumn } from '../../types';
import { COLUMN_OVERRIDE_REGISTRY } from '../registry/columnOverrides';
import { INDEX_REGISTRY } from '../registry/indexRegistry';
import { CONSTRAINT_OVERRIDE_REGISTRY } from '../registry/constraintOverrides';
import { parseRawConstraint } from './constraintParser';

/**
 * SQLite fiziksel kolonundan varsayılan mantıksal tip çıkarımı yapar.
 */
function inferDefaultLogicalType(col: TableColumn): LogicalColumnType {
  const upperType = (col.type || '').toUpperCase().trim();
  const lowerName = col.name.toLowerCase();

  if (col.primaryKey && (col.autoIncrement || upperType.includes('INT'))) {
    return 'id';
  }

  if (upperType.includes('INT')) {
    if (
      lowerName.endsWith('_mi') ||
      lowerName.endsWith('_mu') ||
      lowerName.endsWith('_mı') ||
      lowerName.endsWith('_midir') ||
      lowerName === 'aktif' ||
      lowerName.startsWith('is_') ||
      lowerName.startsWith('has_')
    ) {
      return 'boolean';
    }
    return 'integer';
  }

  if (upperType === 'REAL' || upperType === 'NUMERIC' || upperType === 'DECIMAL' || upperType === 'FLOAT') {
    return 'decimal';
  }

  if (upperType === 'DATETIME' || upperType === 'TIMESTAMP') {
    return 'datetime';
  }

  if (upperType === 'DATE') {
    return 'date';
  }

  if (upperType === 'BLOB') {
    return 'blob';
  }

  if (lowerName.endsWith('_json') || lowerName.endsWith('_data') || lowerName.includes('parametreler')) {
    return 'json';
  }

  if (lowerName.endsWith('_uid') || lowerName.endsWith('_uuid') || lowerName === 'uuid' || lowerName === 'guid') {
    return 'uuid';
  }

  return 'text';
}

/**
 * Tekil bir TableSchema nesnesini LogicalTable modeline dönüştürür.
 *
 * İlkeler:
 * 1. Orijinal tabloyu asla mutasyona uğratmaz.
 * 2. PK yoksa yapay PK uydurmaz; hasPrimaryKey: false olarak kaydeder.
 * 3. Finansal alanları COLUMN_OVERRIDE_REGISTRY üzerinden birebir garanti eder.
 * 4. Ayrıştırılamayan kısıtları UNRESOLVED olarak işaretleyip ihracata kilit vurur.
 */
export function legacyTableToLogicalSchema(rawTable: TableSchema): LogicalTable {
  const tableName = rawTable.name;
  const tableOverrides = COLUMN_OVERRIDE_REGISTRY[tableName] || {};
  const constraintOverrides = CONSTRAINT_OVERRIDE_REGISTRY[tableName] || [];

  const columnsRecord: Record<string, LogicalColumn> = {};
  const primaryKeyCols: string[] = [];
  const derivedConstraints: LogicalConstraint[] = [];

  // 1. Kolonları Dönüştür
  for (const col of rawTable.columns) {
    const override = tableOverrides[col.name];
    const isPk = Boolean(col.primaryKey);

    if (isPk) {
      primaryKeyCols.push(col.name);
    }

    let logicalType: LogicalColumnType;
    let isFinancial = false;
    let scale: number | undefined;
    let precision: number | undefined;

    if (override) {
      logicalType = override.logicalType;
      isFinancial = Boolean(override.isFinancial);
      scale = override.scale;
      precision = override.precision;
    } else {
      logicalType = inferDefaultLogicalType(col);
      if (logicalType === 'decimal') {
        scale = 4;
        precision = 18;
      }
    }

    const logicalCol: LogicalColumn = {
      name: col.name,
      type: logicalType,
      nullable: !col.notNull && !isPk,
      isPrimaryKey: isPk,
      autoIncrement: Boolean(col.autoIncrement),
      defaultValue: col.default !== undefined ? col.default : col.defaultValue,
      description: col.description,
      originType: col.type,
      isFinancial,
      scale,
      precision,
    };

    columnsRecord[col.name] = logicalCol;

    // Kolon bazlı tekil UNIQUE kısıtı
    if (col.unique && !isPk) {
      const uqConstraint: UniqueConstraint = {
        type: 'UNIQUE',
        name: `uq_${tableName}_${col.name}`,
        columns: [col.name],
      };
      derivedConstraints.push(uqConstraint);
    }

    // Kolon bazlı REFERENCES tanımları
    if (col.references) {
      if (typeof col.references === 'object') {
        const fkConstraint: ForeignKeyConstraint = {
          type: 'FOREIGN_KEY',
          name: `fk_${tableName}_${col.name}_${col.references.table}`,
          columns: [col.name],
          foreignTable: col.references.table,
          foreignColumns: [col.references.column],
          onDelete: col.references.onDelete as any,
          onUpdate: col.references.onUpdate as any,
        };
        derivedConstraints.push(fkConstraint);
      }
    }
  }

  // 2. Tablo Düzeyinde Primary Key Kısıtı
  if (primaryKeyCols.length > 0) {
    const pkConstraint: PrimaryKeyConstraint = {
      type: 'PRIMARY_KEY',
      name: `pk_${tableName}`,
      columns: primaryKeyCols,
    };
    derivedConstraints.unshift(pkConstraint);
  }

  // 3. Tablo Düzeyindeki Ham Constraints Dizisini Ayrıştır
  const rawConstraintsList: string[] = (rawTable as any).constraints || [];
  for (const rawConst of rawConstraintsList) {
    if (typeof rawConst === 'string') {
      const parsed = parseRawConstraint(rawConst, tableName);
      derivedConstraints.push(parsed);
    }
  }

  // 4. Override Kısıtlarını Ekle
  for (const overrideConst of constraintOverrides) {
    derivedConstraints.push(overrideConst);
  }

  // 5. İndeksleri Kataloğundan Çek
  const registeredIndexes = INDEX_REGISTRY[tableName] || [];

  // 6. Gelişmiş Motor Bazlı Dışa Aktarım Hazırlığı ve Engel/Uyarı Denetimi (Engine Export Readiness)
  const sqliteBlockers: string[] = [];
  const sqliteWarnings: string[] = [];

  const postgresBlockers: string[] = [];
  const postgresWarnings: string[] = [];

  const duckdbBlockers: string[] = [];
  const duckdbWarnings: string[] = [];

  // A. Kolon tiplerinin geçerlilik denetimi (Tüm motorlar için temel koşul)
  for (const col of Object.values(columnsRecord)) {
    if (!col.type) {
      const msg = `"${col.name}" kolonunun mantıksal tipi belirlenemedi.`;
      sqliteBlockers.push(msg);
      postgresBlockers.push(msg);
      duckdbBlockers.push(msg);
    }
  }

  // B. Çözümlenemeyen kısıtlar (UNRESOLVED)
  const unresolvedCount = derivedConstraints.filter((c) => c.type === 'UNRESOLVED').length;
  if (unresolvedCount > 0) {
    sqliteWarnings.push(`${unresolvedCount} adet çözümlenemeyen kısıt (UNRESOLVED) mevcut; SQLite raw/passthrough olarak çalışacaktır.`);
    // PostgreSQL strict DDL ürettiği için UNRESOLVED kısıtlar aktarımı engeller
    postgresBlockers.push(`${unresolvedCount} adet çözümlenemeyen kısıt (UNRESOLVED) PostgreSQL DDL derlemesini engelliyor.`);
    // DuckDB analitikte kısıtları zorlamaz ancak şeffaf uyarı olarak raporlar
    duckdbWarnings.push(`${unresolvedCount} adet çözümlenemeyen kısıt DuckDB analitik aktarımında göz ardı edilecektir.`);
  }

  // C. Primary Key Denetimi (Motor bazlı farklılaşma)
  const hasPk = primaryKeyCols.length > 0;
  if (!hasPk) {
    sqliteWarnings.push('Tabloda birincil anahtar (Primary Key) tanımlı değil; SQLite örtük rowid kullanacaktır.');
    postgresWarnings.push('Tabloda birincil anahtar tanımlı değil; standart tablo aktarılabilir ancak satır güncelleme performansı ve tekillik güvencesi zayıftır.');
    duckdbWarnings.push('Tabloda birincil anahtar tanımlı değil; DuckDB kolonsal OLAP analitiğinde PK zorunlu değildir.');
  }

  // D. DuckDB Kısıt Uyarıları (Analitik aktarımda uygulanmayacak kısıtların ve veri bütünlüğü etkisinin açık raporlanması)
  const fkCount = derivedConstraints.filter((c) => c.type === 'FOREIGN_KEY').length;
  if (fkCount > 0) {
    duckdbWarnings.push(`${fkCount} adet Foreign Key ilişkisi DuckDB analitik motorunda zorlanmayacaktır (Unenforced). İlişkisel referans bütünlüğü kaynak veritabanına bağlıdır.`);
  }

  const uqCount = derivedConstraints.filter((c) => c.type === 'UNIQUE').length;
  const chkCount = derivedConstraints.filter((c) => c.type === 'CHECK').length;
  if (uqCount > 0 || chkCount > 0) {
    duckdbWarnings.push(`${uqCount + chkCount} adet UNIQUE/CHECK kısıtı DuckDB analitik aktarımında uygulanmayacaktır. Mükerrer kayıt denetimi analitik seviyede yapılmalıdır.`);
  }

  // E. Motor bazlı karne
  const exportReadiness: EngineExportReadiness = {
    sqlite: {
      ready: sqliteBlockers.length === 0,
      blockers: sqliteBlockers,
      warnings: sqliteWarnings,
    },
    postgres: {
      ready: postgresBlockers.length === 0,
      blockers: postgresBlockers,
      warnings: postgresWarnings,
      // CDC / Mantıksal Replikasyon için açık PK zorunludur
      cdcReady: postgresBlockers.length === 0 && hasPk,
    },
    duckdb: {
      ready: duckdbBlockers.length === 0,
      blockers: duckdbBlockers,
      warnings: duckdbWarnings,
    },
  };

  const combinedExportBlockers = Array.from(
    new Set([...sqliteBlockers, ...postgresBlockers, ...duckdbBlockers])
  );
  const isExportReady =
    exportReadiness.sqlite.ready &&
    exportReadiness.postgres.ready &&
    exportReadiness.duckdb.ready;

  return {
    name: tableName,
    description: rawTable.description,
    columns: columnsRecord,
    primaryKey: primaryKeyCols,
    hasPrimaryKey: hasPk,
    constraints: derivedConstraints,
    indexes: registeredIndexes,
    hasAudit: rawTable.hasAudit !== false,
    isExportReady,
    exportReadiness,
    unresolvedConstraintsCount: unresolvedCount,
    exportBlockers: combinedExportBlockers,
  };
}

/**
 * Verilen tablo listesini LogicalTable nesnelerine dönüştürür ve kapsamlı denetim raporu üretir.
 */
export function convertAllTablesToLogicalSchema(tables: TableSchema[]): {
  logicalTables: LogicalTable[];
  auditReport: SchemaAuditReport;
} {
  const logicalTables = tables.map((t) => legacyTableToLogicalSchema(t));

  const tablesWithoutPk: string[] = [];
  let totalColumns = 0;
  let financialColumnsCount = 0;
  let totalConstraints = 0;
  let resolvedConstraintsCount = 0;
  const unresolvedConstraintsList: Array<{
    tableName: string;
    rawDefinition: string;
    reason: string;
  }> = [];
  let totalIndexes = 0;

  for (const lt of logicalTables) {
    if (!lt.hasPrimaryKey) {
      tablesWithoutPk.push(lt.name);
    }

    const cols = Object.values(lt.columns);
    totalColumns += cols.length;
    financialColumnsCount += cols.filter((c: LogicalColumn) => c.isFinancial).length;

    totalConstraints += lt.constraints.length;
    for (const c of lt.constraints) {
      const constraint = c as LogicalConstraint;
      if (constraint.type === 'UNRESOLVED') {
        unresolvedConstraintsList.push({
          tableName: lt.name,
          rawDefinition: constraint.rawDefinition,
          reason: constraint.reason,
        });
      } else {
        resolvedConstraintsCount++;
      }
    }

    totalIndexes += lt.indexes.length;
  }

  const auditReport: SchemaAuditReport = {
    totalTables: logicalTables.length,
    tablesWithPrimaryKey: logicalTables.length - tablesWithoutPk.length,
    tablesWithoutPrimaryKey: tablesWithoutPk,
    totalColumns,
    financialColumnsCount,
    totalConstraints,
    resolvedConstraintsCount,
    unresolvedConstraints: unresolvedConstraintsList,
    totalIndexes,
    isFullyExportReady: logicalTables.every((t) => t.isExportReady) && unresolvedConstraintsList.length === 0,
    engineReadiness: {
      sqlite: {
        ready: logicalTables.every((t) => t.exportReadiness.sqlite.ready),
        blockedTables: logicalTables.filter((t) => !t.exportReadiness.sqlite.ready).map((t) => t.name),
        warningCount: logicalTables.reduce((acc, t) => acc + t.exportReadiness.sqlite.warnings.length, 0),
      },
      postgres: {
        ready: logicalTables.every((t) => t.exportReadiness.postgres.ready),
        blockedTables: logicalTables.filter((t) => !t.exportReadiness.postgres.ready).map((t) => t.name),
        cdcBlockedTables: logicalTables.filter((t) => !t.exportReadiness.postgres.cdcReady).map((t) => t.name),
        warningCount: logicalTables.reduce((acc, t) => acc + t.exportReadiness.postgres.warnings.length, 0),
      },
      duckdb: {
        ready: logicalTables.every((t) => t.exportReadiness.duckdb.ready),
        blockedTables: logicalTables.filter((t) => !t.exportReadiness.duckdb.ready).map((t) => t.name),
        warningCount: logicalTables.reduce((acc, t) => acc + t.exportReadiness.duckdb.warnings.length, 0),
      },
    },
  };

  return {
    logicalTables,
    auditReport,
  };
}
