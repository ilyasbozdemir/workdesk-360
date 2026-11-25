import type {
  LogicalConstraint,
  UniqueConstraint,
  ForeignKeyConstraint,
  CheckConstraint,
  UnresolvedConstraint,
  ReferentialAction,
} from '../types';

/**
 * Desteklenen referans eylemlerini normalize eder.
 */
function normalizeReferentialAction(action?: string): ReferentialAction | undefined {
  if (!action) return undefined;
  const upper = action.trim().toUpperCase().replace(/\s+/g, ' ');
  if (upper === 'CASCADE') return 'CASCADE';
  if (upper === 'SET NULL') return 'SET NULL';
  if (upper === 'RESTRICT') return 'RESTRICT';
  if (upper === 'NO ACTION') return 'NO ACTION';
  return undefined;
}

/**
 * SQLite ham tablo kısıt string'lerini tipli LogicalConstraint nesnelerine ayrıştırır.
 *
 * Güvenlik İlkeleri:
 * 1. Yalnızca tanımlı ve güvenli gramer alt kümesini ayrıştırır.
 * 2. Tanınmayan veya karmaşık ifadeleri kesinlikle sessizce yutmaz.
 * 3. Ayrıştırılamayanları `UnresolvedConstraint` olarak işaretleyerek dışa aktarım engelini etkinleştirir.
 */
export function parseRawConstraint(raw: string, tableName?: string): LogicalConstraint {
  const trimmed = raw.trim();

  // 1. UNIQUE Kısıtı: UNIQUE(col1, col2, ...)
  const uniqueMatch = trimmed.match(/^UNIQUE\s*\(([^)]+)\)$/i);
  if (uniqueMatch && uniqueMatch[1]) {
    const columns = uniqueMatch[1]
      .split(',')
      .map((c) => c.trim().replace(/^[`"']|[`"']$/g, ''))
      .filter(Boolean);

    const result: UniqueConstraint = {
      type: 'UNIQUE',
      name: tableName ? `uq_${tableName}_${columns.join('_')}` : undefined,
      columns,
    };
    return result;
  }

  // 2. FOREIGN KEY Kısıtı: FOREIGN KEY(c1) REFERENCES TargetTable(c2) [ON DELETE ...] [ON UPDATE ...]
  const fkMatch = trimmed.match(
    /^FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))?(?:\s+ON\s+UPDATE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))?$/i
  );
  if (fkMatch && fkMatch[1] && fkMatch[2] && fkMatch[3]) {
    const columns = fkMatch[1]
      .split(',')
      .map((c) => c.trim().replace(/^[`"']|[`"']$/g, ''))
      .filter(Boolean);
    const foreignTable = fkMatch[2].trim();
    const foreignColumns = fkMatch[3]
      .split(',')
      .map((c) => c.trim().replace(/^[`"']|[`"']$/g, ''))
      .filter(Boolean);
    const onDelete = normalizeReferentialAction(fkMatch[4]);
    const onUpdate = normalizeReferentialAction(fkMatch[5]);

    const result: ForeignKeyConstraint = {
      type: 'FOREIGN_KEY',
      name: tableName ? `fk_${tableName}_${columns.join('_')}_${foreignTable}` : undefined,
      columns,
      foreignTable,
      foreignColumns,
      onDelete,
      onUpdate,
    };
    return result;
  }

  // 3. CHECK Kısıtı: CHECK(col IN ('val1', 'val2', ...))
  const checkInMatch = trimmed.match(
    /^CHECK\s*\(\s*([a-zA-Z0-9_]+)\s+IN\s*\(([^)]+)\)\s*\)$/i
  );
  if (checkInMatch && checkInMatch[1] && checkInMatch[2]) {
    const column = checkInMatch[1].trim();
    const values = checkInMatch[2]
      .split(',')
      .map((v) => {
        const cleaned = v.trim();
        // Tırnak işaretlerini ayıkla
        if (
          (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
          (cleaned.startsWith('"') && cleaned.endsWith('"'))
        ) {
          return cleaned.slice(1, -1);
        }
        // Sayı ise sayıya çevir
        const num = Number(cleaned);
        return isNaN(num) ? cleaned : num;
      });

    const result: CheckConstraint = {
      type: 'CHECK',
      name: tableName ? `chk_${tableName}_${column}` : undefined,
      predicate: {
        kind: 'in',
        column,
        values,
      },
      rawDefinition: trimmed,
    };
    return result;
  }

  // 4. Ayrıştırılamayan İfade: UnresolvedConstraint olarak sakla
  const unresolved: UnresolvedConstraint = {
    type: 'UNRESOLVED',
    rawDefinition: trimmed,
    reason: `İfade standart desteklenen SQL kısıt grameri (UNIQUE, FOREIGN KEY, CHECK IN) ile eşleşmedi.`,
  };
  return unresolved;
}
