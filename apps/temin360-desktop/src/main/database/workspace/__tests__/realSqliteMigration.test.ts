// @vitest-environment node
import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { DatabaseSync } from 'node:sqlite'
import { initializeDatabase, runMigrations, schema } from '@dt/database'

describe('Gerçek RC.8 / v44 SQLite Veritabanı Migration ve Bütünlük Testleri', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/temin-rc8-schema-v44.sqlite')

  it('1. Fixture dosyası var olmalı, PRAGMA doğrulamalarından geçmeli ve gerçek v44 şemasında olmalıdır', () => {
    expect(fs.existsSync(fixturePath)).toBe(true)
    const rawDb = new DatabaseSync(fixturePath)

    try {
      // Bütünlük ve Foreign Key denetimleri
      const integrity = rawDb.prepare('PRAGMA integrity_check').all() as { integrity_check: string }[]
      expect(integrity[0].integrity_check).toBe('ok')

      const fk = rawDb.prepare('PRAGMA foreign_key_check').all()
      expect(fk.length).toBe(0)

      // Gerçek v44 şema sürümü kontrolü
      const verRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as { value: string }
      expect(verRow.value).toBe('44')

      // v45 (Belgelerim / Kütüphane) tabloları henüz OLMAMALI
      const tables = rawDb.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]
      const hasKutuphane = tables.some((t) => t.name.includes('Kutuphane'))
      expect(hasKutuphane).toBe(false)

      // v46 kolonları (is_locked vb.) DATA_TeminDosyasi içinde henüz OLMAMALI
      const dosyaCols = rawDb.prepare('PRAGMA table_info(DATA_TeminDosyasi)').all() as { name: string }[]
      expect(dosyaCols.some((c) => c.name === 'is_locked')).toBe(false)
      expect(dosyaCols.some((c) => c.name === 'lock_reason')).toBe(false)
    } finally {
      rawDb.close()
    }
  })

  it('2. Gerçek v44 SQLite dosyası v46 seviyesine yükseltilmeli, tüm kullanıcı verileri ve ilişkileri korunmalıdır', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-real-migration-test-'))
    const testDbPath = path.join(tempDir, 'active_workspace.sqlite')

    // Fixture'ı izole test dizinine kopyala
    fs.copyFileSync(fixturePath, testDbPath)

    try {
      // 1. ADIM: Migration öncesi durum ve verileri oku
      const rawDbBefore = new DatabaseSync(testDbPath)
      const countPersBefore = (rawDbBefore.prepare('SELECT COUNT(*) as c FROM TANIM_Personel').get() as { c: number }).c
      const countFirmaBefore = (rawDbBefore.prepare('SELECT COUNT(*) as c FROM TANIM_Firma').get() as { c: number }).c
      const countDosyaBefore = (rawDbBefore.prepare('SELECT COUNT(*) as c FROM DATA_TeminDosyasi').get() as { c: number }).c
      const countKalemBefore = (rawDbBefore.prepare('SELECT COUNT(*) as c FROM DATA_TeminKalem').get() as { c: number }).c
      const countTeklifBefore = (rawDbBefore.prepare('SELECT COUNT(*) as c FROM DATA_TeminKalemTeklif').get() as { c: number }).c

      expect(countPersBefore).toBe(2)
      expect(countFirmaBefore).toBe(2)
      expect(countDosyaBefore).toBe(1)
      expect(countKalemBefore).toBe(2)
      expect(countTeklifBefore).toBe(4)

      rawDbBefore.close()

      // 2. ADIM: Migration çalıştır (v44 -> v46)
      const rawDbMigrate = new DatabaseSync(testDbPath)
      const wrapDb = {
        exec: (sql: string) => rawDbMigrate.exec(sql),
        prepare: (sql: string) => {
          const stmt = rawDbMigrate.prepare(sql)
          return {
            run: (...args: any[]) => stmt.run(...args),
            get: (...args: any[]) => stmt.get(...args),
            all: (...args: any[]) => stmt.all(...args)
          }
        },
        transaction: <T extends (...args: any[]) => any>(fn: T): T => {
          return ((...args: any[]) => {
            rawDbMigrate.exec('BEGIN TRANSACTION;')
            try {
              const res = fn(...args)
              rawDbMigrate.exec('COMMIT;')
              return res
            } catch (err) {
              rawDbMigrate.exec('ROLLBACK;')
              throw err
            }
          }) as T
        }
      }

      runMigrations(wrapDb as any, 44, schema, { appId: 'temin360-desktop' })
      rawDbMigrate.close()

      // 3. ADIM: Veritabanını yeniden aç ve initializeDatabase ile başlat
      const rawDbAfter = new DatabaseSync(testDbPath)
      const wrapDbAfter = {
        exec: (sql: string) => rawDbAfter.exec(sql),
        prepare: (sql: string) => {
          const stmt = rawDbAfter.prepare(sql)
          return {
            run: (...args: any[]) => stmt.run(...args),
            get: (...args: any[]) => stmt.get(...args),
            all: (...args: any[]) => stmt.all(...args)
          }
        },
        transaction: <T extends (...args: any[]) => any>(fn: T): T => {
          return ((...args: any[]) => {
            rawDbAfter.exec('BEGIN TRANSACTION;')
            try {
              const res = fn(...args)
              rawDbAfter.exec('COMMIT;')
              return res
            } catch (err) {
              rawDbAfter.exec('ROLLBACK;')
              throw err
            }
          }) as T
        }
      }

      initializeDatabase(wrapDbAfter as any, 'Yeni Açılış Kurumu Adı', '1.0.0-rc.10')

      // 4. ADIM: Doğrulamalar - Şema sürümü ve yeni tablolar
      const schemaVerRow = rawDbAfter.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as { value: string }
      expect(schemaVerRow.value).toBe('46')

      // v45 tabloları (DATA_KutuphaneGrup vb.) artık oluşmuş olmalı
      const tablesAfter = rawDbAfter.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]
      expect(tablesAfter.some((t) => t.name === 'DATA_KutuphaneBelge')).toBe(true)
      expect(tablesAfter.some((t) => t.name === 'DATA_KutuphaneBelgeSurum')).toBe(true)

      // v46 kolonları (is_locked, lock_reason) eklenmiş olmalı
      const dosyaColsAfter = rawDbAfter.prepare('PRAGMA table_info(DATA_TeminDosyasi)').all() as { name: string }[]
      expect(dosyaColsAfter.some((c) => c.name === 'is_locked')).toBe(true)
      expect(dosyaColsAfter.some((c) => c.name === 'lock_reason')).toBe(true)

      // Kullanıcının kayıtlı kurum ayarları EZİLMEMELİ
      const instRow = rawDbAfter.prepare("SELECT value FROM settings WHERE key = 'institutionName'").get() as { value: string }
      const adminRow = rawDbAfter.prepare("SELECT value FROM settings WHERE key = 'adminName'").get() as { value: string }
      const titleRow = rawDbAfter.prepare("SELECT value FROM settings WHERE key = 'adminTitle'").get() as { value: string }
      expect(instRow.value).toBe('Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü')
      expect(adminRow.value).toBe('Mustafa Kemal Erdem')
      expect(titleRow.value).toBe('Destek Hizmetleri Müdürü')

      // Kullanıcının personelleri, firmaları, dosyaları, teklifleri aynen korunmalı
      const countPersAfter = (rawDbAfter.prepare('SELECT COUNT(*) as c FROM TANIM_Personel').get() as { c: number }).c
      const countFirmaAfter = (rawDbAfter.prepare('SELECT COUNT(*) as c FROM TANIM_Firma').get() as { c: number }).c
      const countDosyaAfter = (rawDbAfter.prepare('SELECT COUNT(*) as c FROM DATA_TeminDosyasi').get() as { c: number }).c
      const countKalemAfter = (rawDbAfter.prepare('SELECT COUNT(*) as c FROM DATA_TeminKalem').get() as { c: number }).c
      const countTeklifAfter = (rawDbAfter.prepare('SELECT COUNT(*) as c FROM DATA_TeminKalemTeklif').get() as { c: number }).c

      expect(countPersAfter).toBe(countPersBefore)
      expect(countFirmaAfter).toBe(countFirmaBefore)
      expect(countDosyaAfter).toBe(countDosyaBefore)
      expect(countKalemAfter).toBe(countKalemBefore)
      expect(countTeklifAfter).toBe(countTeklifBefore)

      // Test personeli sızıntısı olmamalı
      const allPers = rawDbAfter.prepare('SELECT ad_soyad FROM TANIM_Personel').all() as { ad_soyad: string }[]
      expect(allPers.map((p) => p.ad_soyad)).toEqual(['Ahmet Yılmaz', 'Fatma Kaya'])

      // SQLite bütünlük ve FK doğrulaması
      const integrityCheck = rawDbAfter.prepare('PRAGMA integrity_check').all() as { integrity_check: string }[]
      expect(integrityCheck[0].integrity_check).toBe('ok')

      const fkCheck = rawDbAfter.prepare('PRAGMA foreign_key_check').all()
      expect(fkCheck.length).toBe(0)

      rawDbAfter.close()
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}
    }
  })

  it('3. Migration hatası durumunda transaction rollback çalışmalı, veri bozulmamalı ve sürüm v44 kalmalıdır', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-rollback-test-'))
    const testDbPath = path.join(tempDir, 'active_workspace.sqlite')
    const backupDbPath = path.join(tempDir, 'active_workspace.sqlite.bak')

    fs.copyFileSync(fixturePath, testDbPath)

    try {
      // 1. ADIM: Migration öncesi güvenlik yedeği oluştur (.bak)
      fs.copyFileSync(testDbPath, backupDbPath)
      expect(fs.existsSync(backupDbPath)).toBe(true)
      expect(fs.statSync(backupDbPath).size).toBeGreaterThan(0)

      const rawDb = new DatabaseSync(testDbPath)
      const wrapDb = {
        exec: (sql: string) => rawDb.exec(sql),
        prepare: (sql: string) => {
          const stmt = rawDb.prepare(sql)
          return {
            run: (...args: any[]) => stmt.run(...args),
            get: (...args: any[]) => stmt.get(...args),
            all: (...args: any[]) => stmt.all(...args)
          }
        },
        transaction: <T extends (...args: any[]) => any>(fn: T): T => {
          return ((...args: any[]) => {
            rawDb.exec('BEGIN TRANSACTION;')
            try {
              const res = fn(...args)
              rawDb.exec('COMMIT;')
              return res
            } catch (err) {
              rawDb.exec('ROLLBACK;')
              throw err
            }
          }) as T
        }
      }

      // Hatalı şema: Olmayan bir tabloya kolon eklemeye çalışan bozuk SQL
      const faultySchema = {
        ...schema,
        tables: schema.tables.map((t: any) => {
          if (t.name === 'DATA_KutuphaneBelge') {
            return {
              ...t,
              columns: [...t.columns, { name: 'invalid_col', type: 'INVALID SYNTAX TYPE !!!' }]
            }
          }
          return t
        })
      }

      // 2. ADIM: Migration'ın hata fırlattığını doğrula
      expect(() => {
        runMigrations(wrapDb as any, 44, faultySchema, { appId: 'temin360-desktop' })
      }).toThrow()

      rawDb.close()

      // 3. ADIM: Rollback sonrası veritabanının sağlam olduğunu ve v44 kaldığını doğrula
      const rawDbRollback = new DatabaseSync(testDbPath)
      const verRow = rawDbRollback.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as { value: string }
      expect(verRow.value).toBe('44')

      // Yarım kalmış v45 veya v46 tabloları oluşturulmamış olmalı (Rollback koruması)
      const tables = rawDbRollback.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]
      expect(tables.some((t) => t.name === 'DATA_KutuphaneBelge')).toBe(false)

      // Eski kayıtların korunduğunu doğrula
      const persCount = (rawDbRollback.prepare('SELECT COUNT(*) as c FROM TANIM_Personel').get() as { c: number }).c
      expect(persCount).toBe(2)

      const integrity = rawDbRollback.prepare('PRAGMA integrity_check').all() as { integrity_check: string }[]
      expect(integrity[0].integrity_check).toBe('ok')

      rawDbRollback.close()

      // 4. ADIM: Güvenlik yedeğinin (.bak) sağlam ve orijinal v44 olduğunu doğrula
      const backupDb = new DatabaseSync(backupDbPath)
      const backupVer = backupDb.prepare("SELECT value FROM settings WHERE key = 'dbSchemaVersion'").get() as { value: string }
      expect(backupVer.value).toBe('44')
      backupDb.close()
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}
    }
  })
})

