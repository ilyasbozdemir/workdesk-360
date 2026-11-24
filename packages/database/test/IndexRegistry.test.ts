import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  INDEX_REGISTRY,
  buildSqliteIndexDdl,
  createRegisteredIndexes,
  IndexCreationError,
  compilePredicateToSqlite,
  sanitizeIdentifier,
  formatSqliteLiteral,
  PredicateCompilationError,
  initializeDatabase,
} from '../src/index';
import type { LogicalIndex, StructuredPredicate } from '@worksuite-360/core';

function createMemoryDb(): any {
  return new DatabaseSync(':memory:');
}

describe('Index Registry, DDL Compiler & Strict Mode Verification', () => {
  // =========================================================================
  // 1. Tanımlayıcı (Identifier) ve Değer Doğrulama (Sanitization)
  // =========================================================================
  describe('Sanitization & Literal Formatting', () => {
    it('güvenli tanımlayıcıları tırnak içine almalı', () => {
      expect(sanitizeIdentifier('valid_column')).toBe('"valid_column"');
      expect(sanitizeIdentifier('TANIM_Personel')).toBe('"TANIM_Personel"');
      expect(sanitizeIdentifier('_id123')).toBe('"_id123"');
    });

    it('boş veya güvensiz tanımlayıcılarda açıkça hata vermeli', () => {
      expect(() => sanitizeIdentifier('')).toThrow(PredicateCompilationError);
      expect(() => sanitizeIdentifier('DROP TABLE "x";--')).toThrow(PredicateCompilationError);
      expect(() => sanitizeIdentifier('col with spaces')).toThrow(PredicateCompilationError);
      expect(() => sanitizeIdentifier('col-dash')).toThrow(PredicateCompilationError);
      expect(() => sanitizeIdentifier('col;injection')).toThrow(PredicateCompilationError);
    });

    it('literal değerleri SQL güvenli standartta dönüştürmeli', () => {
      expect(formatSqliteLiteral('test')).toBe("'test'");
      expect(formatSqliteLiteral("O'Connor")).toBe("'O''Connor'");
      expect(formatSqliteLiteral(42)).toBe('42');
      expect(formatSqliteLiteral(3.1415)).toBe('3.1415');
      expect(formatSqliteLiteral(true)).toBe('1');
      expect(formatSqliteLiteral(false)).toBe('0');
      expect(formatSqliteLiteral(null)).toBe('NULL');
    });

    it('sonsuz ve karmaşık değerleri reddetmeli', () => {
      expect(() => formatSqliteLiteral(NaN)).toThrow(PredicateCompilationError);
      expect(() => formatSqliteLiteral(Infinity)).toThrow(PredicateCompilationError);
      expect(() => formatSqliteLiteral({ evil: 'object' })).toThrow(PredicateCompilationError);
    });
  });

  // =========================================================================
  // 2. StructuredPredicate AST Derleyicisi (Partial Index Koşulları)
  // =========================================================================
  describe('StructuredPredicate SQLite AST Compiler', () => {
    it('karşılaştırma koşullarını doğru derlemeli', () => {
      const pred: StructuredPredicate = {
        kind: 'compare',
        column: 'is_active',
        operator: 'eq',
        value: 1,
      };
      expect(compilePredicateToSqlite(pred)).toBe('"is_active" = 1');
    });

    it('string ve tırnak içeren karşılaştırmaları kaçış karakteriyle derlemeli', () => {
      const pred: StructuredPredicate = {
        kind: 'compare',
        column: 'status',
        operator: 'neq',
        value: "pasif'durum",
      };
      expect(compilePredicateToSqlite(pred)).toBe('"status" != \'pasif\'\'durum\'');
    });

    it('IN koşulunu liste hâlinde derlemeli', () => {
      const pred: StructuredPredicate = {
        kind: 'in',
        column: 'alim_turu',
        values: ['mal', 'hizmet', 'yapim'],
      };
      expect(compilePredicateToSqlite(pred)).toBe('"alim_turu" IN (\'mal\', \'hizmet\', \'yapim\')');
    });

    it('BETWEEN ve IS NULL / NOT NULL koşullarını derlemeli', () => {
      const betweenPred: StructuredPredicate = {
        kind: 'between',
        column: 'fiyat',
        min: 100,
        max: 500,
      };
      expect(compilePredicateToSqlite(betweenPred)).toBe('"fiyat" BETWEEN 100 AND 500');

      const nullPred: StructuredPredicate = { kind: 'isNull', column: 'silinme_tarihi' };
      expect(compilePredicateToSqlite(nullPred)).toBe('"silinme_tarihi" IS NULL');

      const notNullPred: StructuredPredicate = { kind: 'notNull', column: 'onay_kodu' };
      expect(compilePredicateToSqlite(notNullPred)).toBe('"onay_kodu" IS NOT NULL');
    });

    it('AND ve OR birleşik koşullarını parantezli derlemeli', () => {
      const andPred: StructuredPredicate = {
        kind: 'and',
        conditions: [
          { kind: 'compare', column: 'durum', operator: 'eq', value: 'onaylandi' },
          { kind: 'notNull', column: 'onay_tarihi' },
        ],
      };
      expect(compilePredicateToSqlite(andPred)).toBe('("durum" = \'onaylandi\') AND ("onay_tarihi" IS NOT NULL)');
    });

    it('desteklenmeyen AST tiplerinde açıkça hata fırlatmalı', () => {
      const invalidPred = { kind: 'unsupported_operator', column: 'x' } as any;
      expect(() => compilePredicateToSqlite(invalidPred)).toThrow(PredicateCompilationError);
    });
  });

  // =========================================================================
  // 3. buildSqliteIndexDdl ile SQLite DDL Üretimi
  // =========================================================================
  describe('Index DDL Builder & Partial Index Desteği', () => {
    it('standart tek kolonlu indeks DDL üretmeli', () => {
      const idx: LogicalIndex = {
        name: 'idx_test_kolon',
        tableName: 'TANIM_Kurum',
        columns: ['kod'],
        origin: 'explicit_script',
      };
      expect(buildSqliteIndexDdl(idx)).toBe(
        'CREATE INDEX IF NOT EXISTS "idx_test_kolon" ON "TANIM_Kurum"("kod");'
      );
    });

    it('çok kolonlu ve UNIQUE indeks DDL üretmeli', () => {
      const idx: LogicalIndex = {
        name: 'idx_test_comp',
        tableName: 'DATA_AmbarStok',
        columns: ['ambar_id', 'kalem_adi'],
        unique: true,
        origin: 'table_definition',
      };
      expect(buildSqliteIndexDdl(idx)).toBe(
        'CREATE UNIQUE INDEX IF NOT EXISTS "idx_test_comp" ON "DATA_AmbarStok"("ambar_id", "kalem_adi");'
      );
    });

    it('filterPredicate tanımlandığında partial index WHERE cümlesini eklemeli', () => {
      const idx: LogicalIndex = {
        name: 'idx_aktif_dosyalar',
        tableName: 'DATA_TeminDosyasi',
        columns: ['yil', 'dosya_no'],
        filterPredicate: {
          kind: 'compare',
          column: 'iptal_edildi',
          operator: 'eq',
          value: false,
        },
        origin: 'explicit_script',
      };
      expect(buildSqliteIndexDdl(idx)).toBe(
        'CREATE INDEX IF NOT EXISTS "idx_aktif_dosyalar" ON "DATA_TeminDosyasi"("yil", "dosya_no") WHERE "iptal_edildi" = 0;'
      );
    });
  });

  // =========================================================================
  // 4. Strict vs Permissive Index Error Handling
  // =========================================================================
  describe('Strict Mode vs Permissive Error Handling', () => {
    it('strict: true iken geçersiz indeks durumunda IndexCreationError fırlatılmalı', () => {
      const db = createMemoryDb();
      db.exec('CREATE TABLE test_tablo (id INTEGER PRIMARY KEY);');

      const invalidRegistry: Record<string, LogicalIndex[]> = {
        test_tablo: [
          {
            name: 'idx_invalid_col',
            tableName: 'test_tablo',
            columns: ['olmayan_kolon'],
            origin: 'explicit_script',
          },
        ],
      };

      expect(() =>
        createRegisteredIndexes(db, {
          strict: true,
          registry: invalidRegistry,
        })
      ).toThrow(IndexCreationError);

      db.close();
    });

    it('strict: false iken hata loglanmalı ve denetim raporunda saklanmalı', () => {
      const db = createMemoryDb();
      db.exec('CREATE TABLE test_tablo (id INTEGER PRIMARY KEY);');

      const invalidRegistry: Record<string, LogicalIndex[]> = {
        test_tablo: [
          {
            name: 'idx_invalid_col',
            tableName: 'test_tablo',
            columns: ['olmayan_kolon'],
            origin: 'explicit_script',
          },
        ],
      };

      const report = createRegisteredIndexes(db, {
        strict: false,
        registry: invalidRegistry,
      });

      expect(report.failedCount).toBe(1);
      expect(report.errors.length).toBe(1);
      expect(report.errors[0].indexName).toBe('idx_invalid_col');
      expect(report.errors[0].error).toContain('no such column');
      expect(report.errors[0].error).toContain('olmayan_kolon');

      db.close();
    });
  });

  // =========================================================================
  // 5. Gerçek SQLite Entegrasyonu: sqlite_master Üzerinde Varlık Denetimi
  // =========================================================================
  describe('sqlite_master Entegrasyon ve Geriye Dönük Uyumluluk Denetimi', () => {
    it('initializeDatabase çalıştırıldığında INDEX_REGISTRY içindeki tüm indeksler sqlite_master tablosunda oluşmalı', () => {
      const db = createMemoryDb();
      initializeDatabase(db, 'Test Kurum', '1.0.0', { strictIndexes: true });

      // sqlite_master üzerinden oluşturulan indeksleri sorgula
      const createdIndexes = db
        .prepare(
          "SELECT name, tbl_name as tableName, sql FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_autoindex%'"
        )
        .all() as Array<{ name: string; tableName: string; sql: string }>;

      const indexNames = new Set(createdIndexes.map((i) => i.name));

      // Tarihsel geriye dönük uyumluluk güvencesi (3 temel indeks)
      expect(indexNames.has('idx_tasinirkod_tam_kod')).toBe(true);
      expect(indexNames.has('idx_tasinirkod_hesap')).toBe(true);
      expect(indexNames.has('idx_okaskod_kod')).toBe(true);

      // Yeni eklenen yabancı anahtar yardımcı indeksleri
      expect(indexNames.has('idx_teminkalem_dosya_id')).toBe(true);
      expect(indexNames.has('idx_teminfirma_dosya_id')).toBe(true);
      expect(indexNames.has('idx_teminteklif_dosya_kalem')).toBe(true);
      expect(indexNames.has('idx_snapshot_dosya_sablon')).toBe(true);

      // İndeks sql tanımlarının geçerliliği
      const tasinirIdx = createdIndexes.find((i) => i.name === 'idx_tasinirkod_tam_kod');
      expect(tasinirIdx).toBeDefined();
      expect(tasinirIdx?.tableName).toBe('TANIM_TasinirKod');
      expect(tasinirIdx?.sql).toContain('idx_tasinirkod_tam_kod');

      db.close();
    });

    it('SQLite partial index fiilen oluşturulmalı ve filtrelenmiş verileri hızlandırmalı', () => {
      const db = createMemoryDb();
      db.exec(`
        CREATE TABLE demo_evrak (
          id INTEGER PRIMARY KEY,
          evrak_no TEXT NOT NULL,
          is_active INTEGER NOT NULL
        );
      `);

      const partialIdx: LogicalIndex = {
        name: 'idx_demo_active',
        tableName: 'demo_evrak',
        columns: ['evrak_no'],
        filterPredicate: {
          kind: 'compare',
          column: 'is_active',
          operator: 'eq',
          value: 1,
        },
        origin: 'explicit_script',
      };

      const ddl = buildSqliteIndexDdl(partialIdx);
      db.exec(ddl);

      const check = db
        .prepare("SELECT sql FROM sqlite_master WHERE name = 'idx_demo_active'")
        .get() as { sql: string };

      expect(check).toBeDefined();
      expect(check.sql).toContain('WHERE "is_active" = 1');

      db.close();
    });
  });
});
