import { describe, it, expect } from 'vitest';
import {
  rawTables,
  legacyTableToLogicalSchema,
  convertAllTablesToLogicalSchema,
  parseRawConstraint,
  COLUMN_OVERRIDE_REGISTRY,
  INDEX_REGISTRY,
} from '../../../database/src/index';
import type {
  LogicalTable,
  UniqueConstraint,
  ForeignKeyConstraint,
  CheckConstraint,
  UnresolvedConstraint,
} from '../../src/index';

describe('Adım 1: Logical Schema & 7-Layer Structural Verification', () => {
  const { logicalTables, auditReport } = convertAllTablesToLogicalSchema(rawTables);
  const tableMap = new Map<string, LogicalTable>(logicalTables.map((t) => [t.name, t]));

  // =========================================================================
  // Layer 1: Tablo Tamlık ve Varlık Güvencesi (55 Tablo)
  // =========================================================================
  describe('Layer 1: 55 Tablo Tamlık ve Katalog Bütünlüğü', () => {
    it('sistemdeki tüm 55 tablo eksiksiz olarak dönüştürülmeli', () => {
      expect(rawTables.length).toBe(55);
      expect(logicalTables.length).toBe(55);
      expect(auditReport.totalTables).toBe(55);
    });

    it('tablo isimleri benzersiz olmalı, mükerrer tablo bulunmamalı', () => {
      const names = logicalTables.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(55);
    });
  });

  // =========================================================================
  // Layer 2: Kolon Sayısı ve İsim Bütünlüğü
  // =========================================================================
  describe('Layer 2: Kolon Sayısı, İsimleri ve Nullability Bütünlüğü', () => {
    it('kaynak tablolardaki tüm kolonlar eksiksiz mantıksal şemaya aktarılmalı', () => {
      for (const raw of rawTables) {
        const logical = tableMap.get(raw.name)!;
        expect(logical).toBeDefined();

        const rawColNames = raw.columns.map((c) => c.name);
        const logicalColNames = Object.keys(logical.columns);

        expect(logicalColNames.length).toBe(rawColNames.length);
        for (const name of rawColNames) {
          expect(logical.columns[name]).toBeDefined();
        }
      }
    });

    it('kolon nullability bayrakları notNull kuralına sadık kalmalı', () => {
      const dosyaTable = tableMap.get('DATA_TeminKalemTeklif')!;
      // id primary key -> nullable: false
      expect(dosyaTable.columns.id.nullable).toBe(false);
      // temin_dosya_id notNull: true -> nullable: false
      expect(dosyaTable.columns.temin_dosya_id.nullable).toBe(false);
      // dosya_id (alias) notNull tanımlanmamış -> nullable: true
      expect(dosyaTable.columns.dosya_id.nullable).toBe(true);
    });
  });

  // =========================================================================
  // Layer 3: Primary Key Gerçeklik Denetimi (Yapay PK Uydurulamaz)
  // =========================================================================
  describe('Layer 3: Primary Key Gerçeklik Denetimi', () => {
    it('PK bulunan tablolarda hasPrimaryKey true ve primaryKey dizisi dolu olmalı', () => {
      const dosyaTable = tableMap.get('DATA_TeminDosyasi')!;
      expect(dosyaTable.hasPrimaryKey).toBe(true);
      expect(dosyaTable.primaryKey).toContain('id');
      expect(dosyaTable.columns.id.isPrimaryKey).toBe(true);
    });

    it('hiçbir tabloda yapay PK üretilmemeli, durum raporda dürüstçe belgelenmeli', () => {
      for (const lt of logicalTables) {
        if (!lt.hasPrimaryKey) {
          expect(lt.primaryKey.length).toBe(0);
        } else {
          expect(lt.primaryKey.length).toBeGreaterThan(0);
        }
      }
      expect(auditReport.tablesWithPrimaryKey + auditReport.tablesWithoutPrimaryKey.length).toBe(55);
    });
  });

  // =========================================================================
  // Layer 4: Yabancı Anahtar Referans Bütünlüğü (Broken Reference Kontrolü)
  // =========================================================================
  describe('Layer 4: Foreign Key Referans Bütünlüğü', () => {
    it('tüm foreign key referansları 55 tablo kataloğundaki geçerli bir tabloya işaret etmeli', () => {
      const allTableNames = new Set(logicalTables.map((t) => t.name));

      for (const lt of logicalTables) {
        const foreignKeys = lt.constraints.filter(
          (c): c is ForeignKeyConstraint => c.type === 'FOREIGN_KEY'
        );

        for (const fk of foreignKeys) {
          expect(
            allTableNames.has(fk.foreignTable),
            `${lt.name} tablosundaki FK geçersiz hedef tabloya işaret ediyor: ${fk.foreignTable}`
          ).toBe(true);

          const targetTable = tableMap.get(fk.foreignTable)!;
          for (const targetCol of fk.foreignColumns) {
            expect(
              targetTable.columns[targetCol],
              `${lt.name} FK hedef kolonu ${fk.foreignTable}.${targetCol} mevcut değil`
            ).toBeDefined();
          }
        }
      }
    });

    it('DATA_TeminKalemTeklif kaskad foreign key referansları doğru ayrıştırılmalı', () => {
      const teklifTable = tableMap.get('DATA_TeminKalemTeklif')!;
      const fks = teklifTable.constraints.filter(
        (c): c is ForeignKeyConstraint => c.type === 'FOREIGN_KEY'
      );

      expect(fks.length).toBeGreaterThanOrEqual(3);
      const dosyaFk = fks.find((f) => f.foreignTable === 'DATA_TeminDosyasi');
      expect(dosyaFk).toBeDefined();
      expect(dosyaFk?.columns).toContain('temin_dosya_id');
      expect(dosyaFk?.foreignColumns).toContain('id');
      expect(dosyaFk?.onDelete).toBe('CASCADE');
    });
  });

  // =========================================================================
  // Layer 5: Tablo + Kolon Eşleşmeli Finansal Hassasiyet Denetimi
  // =========================================================================
  describe('Layer 5: Tablo + Kolon Eşleşmeli Finansal Alan Denetimi (Scale 4)', () => {
    it('tüm parasal kolonlar decimal, scale: 4 ve isFinancial: true olmalı', () => {
      const financialChecks = [
        { table: 'DATA_TeminKalemTeklif', col: 'birim_fiyat' },
        { table: 'DATA_TeminKalemTeklif', col: 'kdv_tutari' },
        { table: 'DATA_TeminDosyasi', col: 'yaklasik_maliyet' },
        { table: 'DATA_IhtiyacRaporuKalem', col: 'tahmini_birim_fiyat' },
        { table: 'DATA_AmbarHareket', col: 'birim_fiyat' },
        { table: 'DATA_AmbarHareket', col: 'toplam_tutar' },
        { table: 'TANIM_Poz', col: 'birim_fiyat' },
        { table: 'DATA_IhaleDosyasi', col: 'yaklasik_maliyet' },
        { table: 'DATA_IhaleDosyasi', col: 'sozlesme_bedeli' },
        { table: 'TANIM_ButceOdenek', col: 'yillik_odenek' },
        { table: 'TANIM_KikLimitDonemleri', col: 'buyuksehir_limit' },
        { table: 'TANIM_Proje', col: 'toplam_butce' },
      ];

      for (const item of financialChecks) {
        const table = tableMap.get(item.table)!;
        expect(table, `${item.table} bulunamadı`).toBeDefined();
        const col = table.columns[item.col];
        expect(col, `${item.table}.${item.col} bulunamadı`).toBeDefined();
        expect(col.type).toBe('decimal');
        expect(col.scale).toBe(4);
        expect(col.isFinancial).toBe(true);
      }
    });

    it('miktar ve oran kolonları isFinancial: false olarak korunmalı', () => {
      const nonFinancialChecks = [
        { table: 'DATA_TeminKalem', col: 'miktar' },
        { table: 'DATA_TeminKalem', col: 'kdv_orani' },
        { table: 'DATA_IhaleKalem', col: 'miktar' },
        { table: 'DATA_AmbarStok', col: 'toplam_miktar' },
        { table: 'TANIM_BirimDonusum', col: 'donusum_faktoru' },
      ];

      for (const item of nonFinancialChecks) {
        const table = tableMap.get(item.table)!;
        const col = table.columns[item.col];
        expect(col.type).toBe('decimal');
        expect(col.isFinancial).toBe(false);
      }
    });
  });

  // =========================================================================
  // Layer 6: Yapısal Kısıtlar ve Sınırlandırılmış Parser Güvenliği
  // =========================================================================
  describe('Layer 6: Yapısal Kısıtlar ve Bounded Parser Güvenliği', () => {
    it('DATA_AmbarStok composite UNIQUE kısıtı bir koşul değil yapısal UNIQUE olmalı', () => {
      const stokTable = tableMap.get('DATA_AmbarStok')!;
      const uq = stokTable.constraints.find(
        (c): c is UniqueConstraint => c.type === 'UNIQUE' && c.columns.includes('ambar_id')
      );
      expect(uq).toBeDefined();
      expect(uq?.columns).toEqual(['ambar_id', 'kalem_adi']);
    });

    it('TANIM_Sablon CHECK(dosya_turu IN (...)) kısıtı InPredicate nesnesine ayrıştırılmalı', () => {
      const sablonTable = tableMap.get('TANIM_Sablon')!;
      const chk = sablonTable.constraints.find(
        (c): c is CheckConstraint => c.type === 'CHECK' && c.predicate?.kind === 'in'
      );
      expect(chk).toBeDefined();
      expect(chk?.predicate?.kind).toBe('in');
      if (chk?.predicate?.kind === 'in') {
        expect(chk.predicate.column).toBe('dosya_turu');
        expect(chk.predicate.values).toContain('xlsx');
        expect(chk.predicate.values).toContain('docx');
        expect(chk.predicate.values).toContain('html');
      }
    });

    it('tanınmayan kural UNRESOLVED olmalı ve dışa aktarımı engellemeli', () => {
      const unparsed = parseRawConstraint('SOME BIZARRE SQL SYNTAX THAT CANNOT BE PARSED', 'TestTable');
      expect(unparsed.type).toBe('UNRESOLVED');
      const unresolved = unparsed as UnresolvedConstraint;
      expect(unresolved.rawDefinition).toBe('SOME BIZARRE SQL SYNTAX THAT CANNOT BE PARSED');
      expect(unresolved.reason).toContain('standart desteklenen SQL kısıt grameri');
    });

    it('mevcut 55 tabloda çözümlenemeyen kısıt bulunmamalı, ihracata hazır olmalı', () => {
      expect(auditReport.unresolvedConstraints.length).toBe(0);
      expect(auditReport.isFullyExportReady).toBe(true);
      for (const lt of logicalTables) {
        expect(lt.isExportReady).toBe(true);
        expect(lt.unresolvedConstraintsCount).toBe(0);
      }
    });
  });

  // =========================================================================
  // Layer 7: İndeks Envanteri ve Denetim Raporu
  // =========================================================================
  describe('Layer 7: İndeks Kataloğu ve Şema Denetim Raporu', () => {
    it('TANIM_TasinirKod ve TANIM_OkasKod hardcoded indeksleri şemada yer almalı', () => {
      const tasinirTable = tableMap.get('TANIM_TasinirKod')!;
      expect(tasinirTable.indexes.length).toBeGreaterThanOrEqual(2);
      expect(tasinirTable.indexes.some((idx) => idx.name === 'idx_tasinirkod_tam_kod')).toBe(true);
      expect(tasinirTable.indexes.some((idx) => idx.name === 'idx_tasinirkod_hesap')).toBe(true);

      const okasTable = tableMap.get('TANIM_OkasKod')!;
      expect(okasTable.indexes.some((idx) => idx.name === 'idx_okaskod_kod')).toBe(true);
    });

    it('audit raporu tüm sistem metriklerini doğru özetlemeli', () => {
      expect(auditReport.totalTables).toBe(55);
      expect(auditReport.totalColumns).toBeGreaterThan(200);
      expect(auditReport.financialColumnsCount).toBeGreaterThan(15);
      expect(auditReport.totalConstraints).toBeGreaterThan(40);
      expect(auditReport.totalIndexes).toBeGreaterThan(0);
      expect(auditReport.isFullyExportReady).toBe(true);
    });
  });
});
