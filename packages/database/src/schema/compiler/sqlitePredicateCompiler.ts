import type { StructuredPredicate, ComparisonOperator } from '../types';

/**
 * Predicate derleme hataları için özel hata sınıfı.
 */
export class PredicateCompilationError extends Error {
  constructor(message: string) {
    super(`[PredicateCompiler] ${message}`);
    this.name = 'PredicateCompilationError';
  }
}

/**
 * SQL tanımlayıcısı (Identifier - tablo veya kolon adı) güvenlik denetimi.
 * Yalnızca standart harf, rakam ve alt çizgi içeren güvenli tanımlayıcılara izin verir.
 */
export function sanitizeIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new PredicateCompilationError('Tanımlayıcı boş veya geçersiz metin.');
  }
  const trimmed = identifier.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    throw new PredicateCompilationError(
      `Geçersiz veya güvensiz SQL tanımlayıcısı tespit edildi: "${identifier}"`
    );
  }
  return `"${trimmed}"`;
}

/**
 * Karşılaştırma operatörü izin listesi (Whitelist).
 */
const ALLOWED_OPERATORS: Record<ComparisonOperator, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
};

/**
 * Değeri güvenli bir SQLite değişmezine (literal) dönüştürür.
 * Nesneler, fonksiyonlar ve geçersiz tipler açıkça reddedilir.
 */
export function formatSqliteLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new PredicateCompilationError(`Sonsuz (Infinite) veya NaN sayısal değer desteklenmez: ${value}`);
    }
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'string') {
    // SQLite tek tırnak kaçış standardı: ' yerine ''
    return `'${value.replace(/'/g, "''")}'`;
  }
  throw new PredicateCompilationError(
    `Desteklenmeyen veya karmaşık literal tipi (${typeof value}). Yalnızca string, number, boolean ve null desteklenir.`
  );
}

/**
 * StructuredPredicate AST düğümünü tip güvenli ve whitelist tabanlı olarak SQLite SQL ifadesine derler.
 * Desteklenmeyen veya bilinmeyen bir düğüm geldiğinde açık hata (PredicateCompilationError) üretir.
 */
export function compilePredicateToSqlite(predicate: StructuredPredicate): string {
  if (!predicate || typeof predicate !== 'object' || !('kind' in predicate)) {
    throw new PredicateCompilationError('Geçersiz veya boş predicate nesnesi.');
  }

  switch (predicate.kind) {
    case 'compare': {
      const safeCol = sanitizeIdentifier(predicate.column);
      const sqlOp = ALLOWED_OPERATORS[predicate.operator];
      if (!sqlOp) {
        throw new PredicateCompilationError(`Desteklenmeyen karşılaştırma operatörü: "${predicate.operator}"`);
      }
      if (predicate.value === null || predicate.value === undefined) {
        // SQL'de NULL karşılaştırması = NULL yerine IS NULL / IS NOT NULL olmalıdır
        if (predicate.operator === 'eq') return `${safeCol} IS NULL`;
        if (predicate.operator === 'neq') return `${safeCol} IS NOT NULL`;
        throw new PredicateCompilationError(`NULL değeri "${predicate.operator}" operatörü ile karşılaştırılamaz.`);
      }
      const safeVal = formatSqliteLiteral(predicate.value);
      return `${safeCol} ${sqlOp} ${safeVal}`;
    }

    case 'in': {
      const safeCol = sanitizeIdentifier(predicate.column);
      if (!Array.isArray(predicate.values) || predicate.values.length === 0) {
        throw new PredicateCompilationError(`"in" koşulu için en az bir değer sağlanmalıdır (kolon: ${predicate.column}).`);
      }
      const formattedValues = predicate.values.map(formatSqliteLiteral).join(', ');
      return `${safeCol} IN (${formattedValues})`;
    }

    case 'between': {
      const safeCol = sanitizeIdentifier(predicate.column);
      const minVal = formatSqliteLiteral(predicate.min);
      const maxVal = formatSqliteLiteral(predicate.max);
      return `${safeCol} BETWEEN ${minVal} AND ${maxVal}`;
    }

    case 'isNull': {
      const safeCol = sanitizeIdentifier(predicate.column);
      return `${safeCol} IS NULL`;
    }

    case 'notNull': {
      const safeCol = sanitizeIdentifier(predicate.column);
      return `${safeCol} IS NOT NULL`;
    }

    case 'and': {
      if (!Array.isArray(predicate.conditions) || predicate.conditions.length === 0) {
        throw new PredicateCompilationError('"and" koşulu için en az bir alt koşul gereklidir.');
      }
      const compiled = predicate.conditions.map((c) => `(${compilePredicateToSqlite(c)})`).join(' AND ');
      return compiled;
    }

    case 'or': {
      if (!Array.isArray(predicate.conditions) || predicate.conditions.length === 0) {
        throw new PredicateCompilationError('"or" koşulu için en az bir alt koşul gereklidir.');
      }
      const compiled = predicate.conditions.map((c) => `(${compilePredicateToSqlite(c)})`).join(' OR ');
      return compiled;
    }

    default: {
      const unknownKind = (predicate as any).kind;
      throw new PredicateCompilationError(`Tanınmayan veya desteklenmeyen predicate türü: "${unknownKind}"`);
    }
  }
}
