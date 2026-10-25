import { describe, it, expect } from 'vitest'
import { validateSqlQuery, extractTableAndAction } from '../sqlGuard'

describe('SQL Guard Security Suite (sqlGuard.ts)', () => {
  describe('1. Multi-statement Injection Protection', () => {
    it('noktalı virgül ile ayrılmış çoklu sorguları engeller', () => {
      expect(() => {
        validateSqlQuery('SELECT * FROM DATA_TeminDosyasi; DELETE FROM DATA_TeminDosyasi')
      }).toThrow(/Multi-statement SQL injection detected/)
    })

    it('string içinde geçen noktalı virgüllere izin verir (false positive oluşturmaz)', () => {
      expect(() => {
        validateSqlQuery(
          "INSERT INTO DATA_TeminDosyasi (konu) VALUES ('Dosya No: 1; İhale Bilgisi')"
        )
      }).not.toThrow()
    })
  })

  describe('2. Destructive DDL & Attach/Detach Protection', () => {
    it('DROP TABLE / DROP VIEW komutlarını engeller', () => {
      expect(() => {
        validateSqlQuery('DROP TABLE DATA_TeminDosyasi')
      }).toThrow(/Destructive DDL operations/)

      expect(() => {
        validateSqlQuery('DROP VIEW IF EXISTS v_ozet')
      }).toThrow(/Destructive DDL operations/)
    })

    it('TRUNCATE TABLE ve ALTER TABLE komutlarını engeller', () => {
      expect(() => {
        validateSqlQuery('TRUNCATE TABLE TANIM_Birim')
      }).toThrow(/Destructive DDL operations/)

      expect(() => {
        validateSqlQuery('ALTER TABLE TANIM_Birim ADD COLUMN gizli TEXT')
      }).toThrow(/Destructive DDL operations/)
    })

    it('harici dosya bağlama (ATTACH DATABASE / DETACH DATABASE) saldırılarını engeller', () => {
      expect(() => {
        validateSqlQuery("ATTACH DATABASE 'malicious.db' AS ext")
      }).toThrow(/Destructive DDL operations/)

      expect(() => {
        validateSqlQuery('DETACH DATABASE ext')
      }).toThrow(/Destructive DDL operations/)
    })
  })

  describe('3. Mass UPDATE / DELETE Without WHERE Clause Protection (including CTEs)', () => {
    it('WHERE koşulu olmayan doğrudan DELETE FROM komutunu engeller', () => {
      expect(() => {
        validateSqlQuery('DELETE FROM DATA_TeminDosyasi')
      }).toThrow(/Unparameterized mass DELETE without WHERE clause/)
    })

    it('CREATE TABLE içindeki ON DELETE / ON UPDATE foreign key kurallarını toplu DELETE saymaz', () => {
      expect(() => {
        validateSqlQuery(
          `CREATE TABLE IF NOT EXISTS DATA_IhtiyacRaporu (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temin_dosya_id INTEGER,
            birim_id INTEGER,
            FOREIGN KEY(temin_dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE SET NULL,
            FOREIGN KEY(birim_id) REFERENCES TANIM_Birim(id) ON UPDATE CASCADE ON DELETE CASCADE
          )`
        )
      }).not.toThrow()
      expect(
        extractTableAndAction(
          'CREATE TABLE T (a INTEGER, FOREIGN KEY(a) REFERENCES X(id) ON DELETE SET NULL)'
        ).action
      ).toBe('other')
      // Gerçek toplu DELETE hâlâ engellenir
      expect(() => {
        validateSqlQuery('DELETE FROM DATA_TeminDosyasi')
      }).toThrow(/Unparameterized mass DELETE without WHERE clause/)
    })

    it('WHERE koşulu olan DELETE FROM komutuna izin verir', () => {
      expect(() => {
        validateSqlQuery('DELETE FROM DATA_TeminDosyasi WHERE id = ?', [1])
      }).not.toThrow()
    })

    it('WHERE koşulu olmayan doğrudan UPDATE komutunu engeller', () => {
      expect(() => {
        validateSqlQuery("UPDATE DATA_TeminDosyasi SET durum = 'İptal'")
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)
    })

    it('WHERE koşulu olan UPDATE komutuna izin verir', () => {
      expect(() => {
        validateSqlQuery("UPDATE DATA_TeminDosyasi SET durum = 'İptal' WHERE id = ?", [1])
      }).not.toThrow()
    })

    it('CTE (WITH ... DELETE) ile yazılan ve WHERE içermeyen sorguları engeller', () => {
      expect(() => {
        validateSqlQuery(
          'WITH cte AS (SELECT id FROM DATA_TeminDosyasi) DELETE FROM DATA_TeminDosyasi'
        )
      }).toThrow(/Unparameterized mass DELETE without WHERE clause/)
    })

    it('CTE (WITH ... UPDATE) ile yazılan ve WHERE içeren sorgulara izin verir', () => {
      expect(() => {
        validateSqlQuery(
          'WITH cte AS (SELECT 1 as x) UPDATE DATA_TeminDosyasi SET konu = ? WHERE id = 1',
          ['test']
        )
      }).not.toThrow()
    })

    it('CTE içinde WHERE bulunsa dahi ana UPDATE/DELETE ifadesinde WHERE yoksa kitle güncellemeyi/silmeyi engeller', () => {
      // Saldırı vektörü: CTE içinde WHERE id = 1 var fakat ana UPDATE T ifadesinde WHERE yok!
      expect(() => {
        validateSqlQuery(
          "WITH cte AS ( SELECT id FROM DATA_TeminDosyasi WHERE id = 1 ) UPDATE DATA_TeminDosyasi SET durum = 'X'"
        )
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)

      // Saldırı vektörü: CTE içinde WHERE id = 1 var fakat ana DELETE ifadesinde WHERE yok!
      expect(() => {
        validateSqlQuery(
          'WITH cte AS ( SELECT id FROM DATA_TeminDosyasi WHERE id = 1 ) DELETE FROM DATA_TeminDosyasi'
        )
      }).toThrow(/Unparameterized mass DELETE without WHERE clause/)

      // Alt sorgu içinde WHERE var fakat ana UPDATE ifadesinde WHERE yok!
      expect(() => {
        validateSqlQuery(
          'UPDATE DATA_TeminDosyasi SET konu = (SELECT baslik FROM sablonlar WHERE id = 1)'
        )
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)

      // Hem CTE içinde hem de ana UPDATE ifadesinde WHERE varsa izin verir
      expect(() => {
        validateSqlQuery(
          "WITH cte AS ( SELECT id FROM DATA_TeminDosyasi WHERE id = 1 ) UPDATE DATA_TeminDosyasi SET durum = 'X' WHERE id IN (SELECT id FROM cte)"
        )
      }).not.toThrow()
    })

    it('kolon veya tanımlayıcı adı "WHERE" veya [WHERE] olduğunda bunu WHERE koşulu sanmaz ve kitle güncellemeyi engeller', () => {
      expect(() => {
        validateSqlQuery('UPDATE "T" SET "WHERE" = 1')
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)

      expect(() => {
        validateSqlQuery('UPDATE T SET [WHERE] = 1')
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)

      expect(() => {
        validateSqlQuery('UPDATE T SET `WHERE` = 1')
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)
    })

    it('string içinde geçen "WHERE" kelimesini WHERE koşulu sanmaz ve kitle güncellemeyi engeller', () => {
      expect(() => {
        validateSqlQuery("UPDATE DATA_TeminDosyasi SET durum = 'WHERE'")
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)

      expect(() => {
        validateSqlQuery("UPDATE DATA_TeminDosyasi SET durum = 'hello /* comment */ WHERE'")
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)
    })

    it('string literalleri içinde geçen yorum sembolleri ve noktalı virgülleri bozmaz', () => {
      expect(() => {
        validateSqlQuery(
          "SELECT * FROM DATA_TeminDosyasi WHERE konu = 'test /* not a comment */ data'"
        )
      }).not.toThrow()

      expect(() => {
        validateSqlQuery("SELECT * FROM DATA_TeminDosyasi WHERE konu = 'test -- not a comment'")
      }).not.toThrow()
    })
  })

  describe('4. Sensitive Settings / TANIM_Ayar Protection', () => {
    it('settings ve TANIM_Ayar tablolarına doğrudan ham SQL çalıştırmayı engeller', () => {
      expect(() => {
        validateSqlQuery('SELECT * FROM settings')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('SELECT * FROM TANIM_Ayar WHERE id = 1')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)
    })

    it('çift tırnaklı ("settings"), köşeli parantezli ([SETTINGS]) ve backtick ile yazılmış tanımlayıcıları engeller', () => {
      expect(() => {
        validateSqlQuery('SELECT * FROM "settings"')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('SELECT * FROM [SETTINGS]')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('SELECT * FROM `settings`')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('SELECT * FROM "TANIM_AYAR"')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('UPDATE "settings" SET val = ? WHERE key = ?')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('SELECT * FROM main."settings"')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('WITH cte AS (SELECT 1) SELECT * FROM "settings"')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)
    })

    it('sütun adı veya takma ad (alias) olarak "settings" kullanılmasına izin verir (yalnızca tablo referansını korur)', () => {
      // Sütun adı olarak settings
      expect(() => {
        validateSqlQuery('SELECT id, settings FROM DATA_KullaniciAyar WHERE id = 1')
      }).not.toThrow()

      // SET atamasında sütun adı olarak settings
      expect(() => {
        validateSqlQuery("UPDATE DATA_KullaniciAyar SET settings = 'dark' WHERE id = 1")
      }).not.toThrow()

      // WHERE koşulunda sütun adı olarak settings
      expect(() => {
        validateSqlQuery("SELECT * FROM DATA_KullaniciAyar WHERE settings = 'on'")
      }).not.toThrow()

      // Tablo takma adı (alias) olarak settings
      expect(() => {
        validateSqlQuery('SELECT * FROM DATA_KullaniciAyar AS settings WHERE id = 1')
      }).not.toThrow()
    })

    it('çift tırnaklı tanımlayıcı içeren silme ve güncelleme işlemlerinde WHERE zorunluluğunu korur', () => {
      expect(() => {
        validateSqlQuery('DELETE FROM "DATA_TeminDosyasi"')
      }).toThrow(/Unparameterized mass DELETE without WHERE clause/)

      expect(() => {
        validateSqlQuery('UPDATE "DATA_TeminDosyasi" SET "durum" = ?')
      }).toThrow(/Unparameterized mass UPDATE without WHERE clause/)
    })
  })

  describe('5. extractTableAndAction Parsing', () => {
    it('doğrudan UPDATE/INSERT/DELETE ifadelerinden tablo ve aksiyonu çıkarır', () => {
      expect(extractTableAndAction('UPDATE "TANIM_Birim" SET ad = ? WHERE id = ?')).toEqual({
        tableName: 'TANIM_Birim',
        action: 'update'
      })

      expect(extractTableAndAction('INSERT INTO DATA_TeminDosyasi (konu) VALUES (?)')).toEqual({
        tableName: 'DATA_TeminDosyasi',
        action: 'insert'
      })

      expect(extractTableAndAction('DELETE FROM `DATA_TeminKalem` WHERE id = 5')).toEqual({
        tableName: 'DATA_TeminKalem',
        action: 'delete'
      })
    })

    it('CTE (WITH ...) ile başlayan yazma sorgularından tabloyu doğru çıkarır', () => {
      expect(
        extractTableAndAction(
          'WITH eskiler AS (SELECT id FROM DATA_TeminDosyasi WHERE id < 10) DELETE FROM DATA_TeminDosyasi WHERE id IN (SELECT id FROM eskiler)'
        )
      ).toEqual({
        tableName: 'DATA_TeminDosyasi',
        action: 'delete'
      })
    })
  })

  describe('6. PRAGMA & Schema Tampering Protection', () => {
    it('güvenli şema inceleme PRAGMA komutlarına izin verir', () => {
      expect(() => {
        validateSqlQuery('PRAGMA table_info("DATA_TeminDosyasi")')
      }).not.toThrow()

      expect(() => {
        validateSqlQuery('PRAGMA foreign_key_list(DATA_TeminKalem)')
      }).not.toThrow()

      expect(() => {
        validateSqlQuery('PRAGMA index_list(DATA_TeminDosyasi)')
      }).not.toThrow()

      expect(() => {
        validateSqlQuery('PRAGMA quick_check')
      }).not.toThrow()
    })

    it('PRAGMA writable_schema saldırısını engeller', () => {
      expect(() => {
        validateSqlQuery('PRAGMA writable_schema = ON')
      }).toThrow(/PRAGMA writable_schema is prohibited/)

      expect(() => {
        validateSqlQuery('PRAGMA writable_schema = 1')
      }).toThrow(/PRAGMA writable_schema is prohibited/)
    })

    it('veritabanı ayarlarını değiştiren atamalı PRAGMA komutlarını engeller', () => {
      expect(() => {
        validateSqlQuery('PRAGMA foreign_keys = OFF')
      }).toThrow(/Modifying database configuration via PRAGMA assignment/)

      expect(() => {
        validateSqlQuery('PRAGMA journal_mode = OFF')
      }).toThrow(/Modifying database configuration via PRAGMA assignment/)

      expect(() => {
        validateSqlQuery('PRAGMA auto_vacuum = 1')
      }).toThrow(/Modifying database configuration via PRAGMA assignment/)
    })

    it('onay listesinde (allowlist) olmayan PRAGMA komutlarını engeller', () => {
      expect(() => {
        validateSqlQuery('PRAGMA compile_options')
      }).toThrow(/Execution of unapproved PRAGMA/)
    })

    it('CREATE TRIGGER ve CREATE VIRTUAL TABLE şema manipülasyonlarını engeller', () => {
      expect(() => {
        validateSqlQuery(
          'CREATE TRIGGER trg_malicious AFTER INSERT ON DATA_TeminDosyasi BEGIN UPDATE DATA_TeminDosyasi SET durum = 1; END;'
        )
      }).toThrow(/Schema tampering operations/)

      expect(() => {
        validateSqlQuery('CREATE VIRTUAL TABLE v_table USING fts5(data)')
      }).toThrow(/Schema tampering operations/)
    })

    it('CREATE TEMP TRIGGER ve CREATE TEMPORARY TRIGGER varyasyonlarını engeller', () => {
      expect(() => {
        validateSqlQuery(
          'CREATE TEMP TRIGGER trg_temp AFTER INSERT ON DATA_TeminDosyasi BEGIN UPDATE DATA_TeminDosyasi SET durum = 1; END;'
        )
      }).toThrow(/Schema tampering operations/)

      expect(() => {
        validateSqlQuery(
          'CREATE TEMPORARY TRIGGER trg_temp2 AFTER INSERT ON DATA_TeminDosyasi BEGIN UPDATE DATA_TeminDosyasi SET durum = 1; END;'
        )
      }).toThrow(/Schema tampering operations/)

      expect(() => {
        validateSqlQuery(
          'CREATE TEMP TRIGGER IF NOT EXISTS trg_temp3 AFTER UPDATE ON DATA_TeminDosyasi BEGIN SELECT 1; END;'
        )
      }).toThrow(/Schema tampering operations/)
    })

    it('CREATE TEMP VIRTUAL TABLE ve CREATE TEMPORARY VIRTUAL TABLE varyasyonlarını engeller', () => {
      expect(() => {
        validateSqlQuery('CREATE TEMP VIRTUAL TABLE temp_v USING fts5(data)')
      }).toThrow(/Schema tampering operations/)

      expect(() => {
        validateSqlQuery('CREATE TEMPORARY VIRTUAL TABLE temp_v2 USING fts5(data)')
      }).toThrow(/Schema tampering operations/)
    })

    it('PRAGMA şema niteleyicisi (schema-qualified) ile güvenli sorgulara izin verir, zararlıları engeller', () => {
      // İzin verilen şema niteleyicili PRAGMA
      expect(() => {
        validateSqlQuery('PRAGMA main.table_info("DATA_TeminDosyasi")')
      }).not.toThrow()

      expect(() => {
        validateSqlQuery('PRAGMA "main"."table_info"(\'DATA_TeminDosyasi\')')
      }).not.toThrow()

      // Engellenen şema niteleyicili writable_schema
      expect(() => {
        validateSqlQuery('PRAGMA main.writable_schema = ON')
      }).toThrow(/PRAGMA writable_schema is prohibited/)

      expect(() => {
        validateSqlQuery('PRAGMA "main"."writable_schema" = 1')
      }).toThrow(/PRAGMA writable_schema is prohibited/)

      expect(() => {
        validateSqlQuery('PRAGMA main.writable_schema(1)')
      }).toThrow(/PRAGMA writable_schema is prohibited/)
    })

    it('parantez içi atama / fonksiyon sözdizimi ile ayar değiştiren PRAGMA komutlarını engeller', () => {
      expect(() => {
        validateSqlQuery('PRAGMA writable_schema(1)')
      }).toThrow(/PRAGMA writable_schema is prohibited/)

      expect(() => {
        validateSqlQuery('PRAGMA user_version(5)')
      }).toThrow(/Modifying database configuration via PRAGMA assignment/)

      expect(() => {
        validateSqlQuery('PRAGMA schema_version(10)')
      }).toThrow(/Modifying database configuration via PRAGMA assignment/)

      expect(() => {
        validateSqlQuery('PRAGMA user_version = 5')
      }).toThrow(/Modifying database configuration via PRAGMA assignment/)
    })

    it('çift tırnaklı DDL komutlarını ("TABLE") engeller', () => {
      expect(() => {
        validateSqlQuery('DROP "TABLE" DATA_TeminDosyasi')
      }).toThrow(/Destructive DDL operations/)

      expect(() => {
        validateSqlQuery('ALTER "TABLE" DATA_TeminDosyasi ADD COLUMN test TEXT')
      }).toThrow(/Destructive DDL operations/)
    })
  })

  describe('7. Subqueries and Comma Joins on Restricted Tables', () => {
    it('alt sorgu (subquery) içinde settings tablosuna erişimi engeller', () => {
      expect(() => {
        validateSqlQuery('SELECT (SELECT value FROM settings WHERE key = "admin")')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('SELECT * FROM (SELECT * FROM settings)')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)
    })

    it('virgüllü kartezyen join (comma join) ile settings tablosuna erişimi engeller', () => {
      expect(() => {
        validateSqlQuery('SELECT * FROM DATA_TeminDosyasi, settings')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)

      expect(() => {
        validateSqlQuery('SELECT * FROM settings, DATA_TeminDosyasi')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)
    })

    it('CTE içinde settings tablosunu kaynak alan sorguları engeller', () => {
      expect(() => {
        validateSqlQuery('WITH s AS (SELECT * FROM settings) SELECT * FROM s')
      }).toThrow(/Direct raw SQL query on settings\/TANIM_Ayar/)
    })
  })
})
