import { describe, it, expect } from 'vitest';
import type {
  LogicalColumnType,
  ComparisonOperator,
  StructuredPredicate,
  PrimaryKeyConstraint,
  UniqueConstraint,
  ForeignKeyConstraint,
  CheckConstraint,
  UnresolvedConstraint,
  LogicalIndex,
  LogicalColumn,
  LogicalTable,
  SchemaAuditReport,
  TargetEngine,
  EngineExportReadiness,
} from '../../src/database/schema/LogicalTypes';

describe('@worksuite-360/core: Logical Schema Contracts & AST Model', () => {
  describe('StructuredPredicate Type Contracts', () => {
    it('compare predicate tip güvenli oluşturulabilmeli', () => {
      const pred: StructuredPredicate = {
        kind: 'compare',
        column: 'tutar',
        operator: 'gte',
        value: 1000,
      };
      expect(pred.kind).toBe('compare');
      expect(pred.column).toBe('tutar');
      expect(pred.operator).toBe('gte');
      expect(pred.value).toBe(1000);
    });

    it('in predicate dizi değerlerini desteklemeli', () => {
      const pred: StructuredPredicate = {
        kind: 'in',
        column: 'durum',
        values: ['taslak', 'onaylandi', 'iptal'],
      };
      expect(pred.kind).toBe('in');
      expect(pred.values).toHaveLength(3);
    });

    it('and / or birleşik koşulları özyinelemeli (recursive) yapılandırabilmeli', () => {
      const complexPred: StructuredPredicate = {
        kind: 'and',
        conditions: [
          { kind: 'notNull', column: 'onay_kodu' },
          {
            kind: 'or',
            conditions: [
              { kind: 'compare', column: 'limit', operator: 'lt', value: 50000 },
              { kind: 'isNull', column: 'istisna_sebebi' },
            ],
          },
        ],
      };
      expect(complexPred.kind).toBe('and');
      expect(complexPred.conditions).toHaveLength(2);
      expect(complexPred.conditions[1].kind).toBe('or');
    });
  });

  describe('LogicalColumn & Financial Scale Contracts', () => {
    it('finansal alanlar decimal ve 4 hane ölçek standardına uymalı', () => {
      const finCol: LogicalColumn = {
        name: 'toplam_tutar',
        type: 'decimal',
        nullable: false,
        isPrimaryKey: false,
        originType: 'INTEGER',
        isFinancial: true,
        scale: 4,
        precision: 18,
      };
      expect(finCol.type).toBe('decimal');
      expect(finCol.isFinancial).toBe(true);
      expect(finCol.scale).toBe(4);
    });
  });

  describe('Constraint Discriminated Union Contracts', () => {
    it('tüm yapısal kısıtlar type alanı üzerinden ayırt edilebilmeli', () => {
      const pk: PrimaryKeyConstraint = { type: 'PRIMARY_KEY', columns: ['id'] };
      const uq: UniqueConstraint = { type: 'UNIQUE', columns: ['kod'] };
      const fk: ForeignKeyConstraint = {
        type: 'FOREIGN_KEY',
        columns: ['dosya_id'],
        foreignTable: 'DATA_TeminDosyasi',
        foreignColumns: ['id'],
        onDelete: 'CASCADE',
      };
      const chk: CheckConstraint = {
        type: 'CHECK',
        predicate: { kind: 'notNull', column: 'ad' },
      };
      const unres: UnresolvedConstraint = {
        type: 'UNRESOLVED',
        rawDefinition: 'COMPLEX SQL NOT SUPPORTED',
        reason: 'Custom engine syntax',
      };

      expect(pk.type).toBe('PRIMARY_KEY');
      expect(uq.type).toBe('UNIQUE');
      expect(fk.type).toBe('FOREIGN_KEY');
      expect(chk.type).toBe('CHECK');
      expect(unres.type).toBe('UNRESOLVED');
    });
  });
});
