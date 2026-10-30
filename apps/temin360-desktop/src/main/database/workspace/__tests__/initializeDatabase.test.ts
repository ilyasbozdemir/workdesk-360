// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { initializeDatabase, runMigrations, schema } from '@dt/database'

function createRealSqliteDb(): {
  rawDb: DatabaseSync
  db: {
    exec: (sql: string) => void
    prepare: (sql: string) => {
      run: (...args: any[]) => void
      get: (...args: any[]) => any
      all: (...args: any[]) => any[]
    }
    transaction: <T extends (...args: any[]) => any>(fn: T) => T
  }
} {
  const rawDb = new DatabaseSync(':memory:')
  const db = {
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
  return { rawDb, db }
}

describe('initializeDatabase — Aşama 1: Üretim Güvenliği ve Kullanıcı Verisi Koruma Testleri', () => {
  it('1. Varsayılan başlatmada test personeli eklenmemeli ve tarafsız yönetici bilgileri atanmalı', () => {
    const { rawDb, db } = createRealSqliteDb()

    initializeDatabase(db as any, 'Örnek Belediye Başkanlığı', '1.0.0')

    // 1.1 Test personeli tablosu tertemiz kalmalı
    const persCount = rawDb.prepare('SELECT COUNT(*) as cnt FROM TANIM_Personel').get() as { cnt: number }
    expect(persCount.cnt).toBe(0)

    // 1.2 Kişiye özel sabit isim yerine tarafsız unvan atanmalı
    const adminName = rawDb.prepare("SELECT value FROM settings WHERE key = 'adminName'").get() as { value: string }
    const adminTitle = rawDb.prepare("SELECT value FROM settings WHERE key = 'adminTitle'").get() as { value: string }
    expect(adminName.value).toBe('Sistem Yöneticisi')
    expect(adminName.value).not.toBe('İlyas BOZDEMİR')
    expect(adminTitle.value).toBe('Yönetici')
  })

  it('2. Kullanıcı tarafından kaydedilmiş kurum ve yönetici bilgileri üzerine yazılmamalı (INSERT OR IGNORE)', () => {
    const { rawDb, db } = createRealSqliteDb()

    // Kullanıcı önceden ayarlarını yapmış olsun
    rawDb.exec(`
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      INSERT INTO settings (key, value) VALUES ('institutionName', 'Gerçek Kullanıcı Belediyesi');
      INSERT INTO settings (key, value) VALUES ('adminName', 'Av. Ayşe Demir');
      INSERT INTO settings (key, value) VALUES ('adminTitle', 'Hukuk İşleri Müdürü');
    `)

    // initializeDatabase yeniden çalıştırılıyor (örn. dosya açılışı veya sürüm kontrolü)
    initializeDatabase(db as any, 'Farklı Bir Kurum Adı', '1.0.5')

    const instRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'institutionName'").get() as { value: string }
    const nameRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'adminName'").get() as { value: string }
    const titleRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'adminTitle'").get() as { value: string }
    const verRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'dbVersion'").get() as { value: string }

    // Kullanıcı verileri kesinlikle korunmuş olmalı
    expect(instRow.value).toBe('Gerçek Kullanıcı Belediyesi')
    expect(nameRow.value).toBe('Av. Ayşe Demir')
    expect(titleRow.value).toBe('Hukuk İşleri Müdürü')

    // Sistem sürümü ise güncellenmiş olmalı
    expect(verRow.value).toBe('1.0.5')
  })

  it('3. Yalnızca açıkça seedTestData: true istendiğinde test personelleri eklenmeli', () => {
    const { rawDb, db } = createRealSqliteDb()

    initializeDatabase(db as any, 'Test Kurumu', '1.0.0', { seedTestData: true })

    const persRows = rawDb.prepare('SELECT ad_soyad FROM TANIM_Personel').all() as { ad_soyad: string }[]
    expect(persRows.length).toBe(5)
    expect(persRows.some((p) => p.ad_soyad.includes('Test'))).toBe(true)

    // İkinci kez çağrıldığında mükerrer kayıt üretmemeli
    initializeDatabase(db as any, 'Test Kurumu', '1.0.0', { seedTestData: true })
    const secondCount = rawDb.prepare('SELECT COUNT(*) as cnt FROM TANIM_Personel').get() as { cnt: number }
    expect(secondCount.cnt).toBe(5)
  })

  it('4. Özel adminName ve adminTitle seçenekleri verildiğinde doğru atanmalı', () => {
    const { rawDb, db } = createRealSqliteDb()

    initializeDatabase(db as any, 'Milli Eğitim Müdürlüğü', '1.0.0', {
      adminName: 'Mehmet Kaya',
      adminTitle: 'İl Müdürü'
    })

    const nameRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'adminName'").get() as { value: string }
    const titleRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'adminTitle'").get() as { value: string }
    expect(nameRow.value).toBe('Mehmet Kaya')
    expect(titleRow.value).toBe('İl Müdürü')
  })

  it('5. Geriye dönük uyumluluk: 4 parametreli çağrı (appName ile) hatasız çalışmalı', () => {
    const { rawDb, db } = createRealSqliteDb()

    initializeDatabase(db as any, 'İhale Kurumu', '1.0.0-beta.1', 'ihale360-desktop')

    const titleRow = rawDb.prepare("SELECT value FROM settings WHERE key = 'appTitle'").get() as { value: string }
    expect(titleRow.value).toBe('İHALE 360')

    // Test personeli sızmamalı
    const persCount = rawDb.prepare('SELECT COUNT(*) as cnt FROM TANIM_Personel').get() as { cnt: number }
    expect(persCount.cnt).toBe(0)
  })

  it(
    '6. Gerçek disk tabanlı SQLite dosyasında eski kullanıcı verisi, ayarların korunması, migrasyon ve yeniden açılış doğrulanmalı',
    () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin-db-migration-test-'))
    const dbPath = path.join(tempDir, 'user_workspace.sqlite')

    try {
      // 1. Aşama: Kullanıcının rc.8 sürümünde oluşturduğu gerçek çalışma alanı veritabanını simüle et
      const rawDb1 = new DatabaseSync(dbPath)
      const wrapDb1 = {
        exec: (sql: string) => rawDb1.exec(sql),
        prepare: (sql: string) => {
          const stmt = rawDb1.prepare(sql)
          return {
            run: (...args: any[]) => stmt.run(...args),
            get: (...args: any[]) => stmt.get(...args),
            all: (...args: any[]) => stmt.all(...args)
          }
        },
        transaction: <T extends (...args: any[]) => any>(fn: T): T => {
          return ((...args: any[]) => {
            rawDb1.exec('BEGIN TRANSACTION;')
            try {
              const res = fn(...args)
              rawDb1.exec('COMMIT;')
              return res
            } catch (err) {
              rawDb1.exec('ROLLBACK;')
              throw err
            }
          }) as T
        }
      }

      // İlk kurulum: Kullanıcı adıyla ve eski sürümle başlatılır
      initializeDatabase(wrapDb1 as any, 'Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü', '1.0.0-rc.8')

      // Kullanıcı arayüzünden amir bilgilerini ve personellerini özelleştirmiş olsun
      rawDb1.exec(`
        UPDATE settings SET value = 'Mustafa Kemal Erdem' WHERE key = 'adminName';
        UPDATE settings SET value = 'Destek Hizmetleri Müdürü' WHERE key = 'adminTitle';
        UPDATE settings SET value = '44' WHERE key = 'dbSchemaVersion';

        -- Kullanıcının sisteme kaydettiği gerçek personeller
        INSERT INTO TANIM_Personel (ad_soyad, unvan, aktif_mi) VALUES ('Ahmet Yılmaz', 'Satınalma Şefi', 1);
        INSERT INTO TANIM_Personel (ad_soyad, unvan, aktif_mi) VALUES ('Fatma Kaya', 'Mali Hizmetler Uzmanı', 1);

        -- Kullanıcının açtığı gerçek ihale / doğrudan temin dosyası
        INSERT INTO DATA_TeminDosyasi (temin_no, konu, tur, ihale_sekli) VALUES ('2026/DT-101', 'Kırtasiye Alımı', 'mal', '22/d');
      `)

      rawDb1.close()

      // 2. Aşama: Uygulama güncellendi (1.0.0-rc.10) ve dosya yeniden açıldı
      // DtmWorkspace.openWorkspace akışı: Önce DB açılır, migrasyonlar koşulur, ardından initializeDatabase çağrılır
      const rawDb2 = new DatabaseSync(dbPath)
      const wrapDb2 = {
        exec: (sql: string) => rawDb2.exec(sql),
        prepare: (sql: string) => {
          const stmt = rawDb2.prepare(sql)
          return {
            run: (...args: any[]) => stmt.run(...args),
            get: (...args: any[]) => stmt.get(...args),
            all: (...args: any[]) => stmt.all(...args)
          }
        },
        transaction: <T extends (...args: any[]) => any>(fn: T): T => {
          return ((...args: any[]) => {
            rawDb2.exec('BEGIN TRANSACTION;')
            try {
              const res = fn(...args)
              rawDb2.exec('COMMIT;')
              return res
            } catch (err) {
              rawDb2.exec('ROLLBACK;')
              throw err
            }
          }) as T
        }
      }

      // Migrasyonlar çalıştırılır (v44 -> v46)
      runMigrations(wrapDb2 as any, 44, schema, { appId: 'temin360-desktop' })

      // initializeDatabase açılış sırasında çağrılır
      initializeDatabase(wrapDb2 as any, 'Varsayılan Parametre Adı', '1.0.0-rc.10')

      // 3. Aşama: Doğrulamalar - Kullanıcı kurum ve yetkili ayarları ASLA ezilmemeli
      const instRow = rawDb2.prepare("SELECT value FROM settings WHERE key = 'institutionName'").get() as { value: string }
      const adminRow = rawDb2.prepare("SELECT value FROM settings WHERE key = 'adminName'").get() as { value: string }
      const titleRow = rawDb2.prepare("SELECT value FROM settings WHERE key = 'adminTitle'").get() as { value: string }
      const verRow = rawDb2.prepare("SELECT value FROM settings WHERE key = 'dbVersion'").get() as { value: string }

      expect(instRow.value).toBe('Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü')
      expect(adminRow.value).toBe('Mustafa Kemal Erdem')
      expect(titleRow.value).toBe('Destek Hizmetleri Müdürü')
      expect(verRow.value).toBe('1.0.0-rc.10')

      // Kullanıcının kayıtlı personelleri ve açılmış dosyası korunmalı
      const allPers = rawDb2.prepare('SELECT ad_soyad FROM TANIM_Personel').all() as { ad_soyad: string }[]
      expect(allPers.length).toBe(2)
      expect(allPers.map((p) => p.ad_soyad)).toEqual(['Ahmet Yılmaz', 'Fatma Kaya'])
      expect(allPers.some((p) => p.ad_soyad.includes('(Test)'))).toBe(false)

      const dosyaRow = rawDb2.prepare("SELECT konu FROM DATA_TeminDosyasi WHERE temin_no = '2026/DT-101'").get() as { konu: string }
      expect(dosyaRow.konu).toBe('Kırtasiye Alımı')

      rawDb2.close()

      // 4. Aşama: Dosyayı üçüncü kez açıp kapat (tekrar açılış idempotency testi)
      const rawDb3 = new DatabaseSync(dbPath)
      const wrapDb3 = {
        exec: (sql: string) => rawDb3.exec(sql),
        prepare: (sql: string) => {
          const stmt = rawDb3.prepare(sql)
          return {
            run: (...args: any[]) => stmt.run(...args),
            get: (...args: any[]) => stmt.get(...args),
            all: (...args: any[]) => stmt.all(...args)
          }
        },
        transaction: <T extends (...args: any[]) => any>(fn: T): T => {
          return ((...args: any[]) => {
            rawDb3.exec('BEGIN TRANSACTION;')
            try {
              const res = fn(...args)
              rawDb3.exec('COMMIT;')
              return res
            } catch (err) {
              rawDb3.exec('ROLLBACK;')
              throw err
            }
          }) as T
        }
      }

      initializeDatabase(wrapDb3 as any, 'Bir Başka Parametre', '1.0.0-rc.10')

      const reCheckInst = rawDb3.prepare("SELECT value FROM settings WHERE key = 'institutionName'").get() as { value: string }
      const reCheckAdmin = rawDb3.prepare("SELECT value FROM settings WHERE key = 'adminName'").get() as { value: string }
      const reCheckPersCount = rawDb3.prepare('SELECT COUNT(*) as cnt FROM TANIM_Personel').get() as { cnt: number }

      expect(reCheckInst.value).toBe('Kadıköy Belediyesi Destek Hizmetleri Müdürlüğü')
      expect(reCheckAdmin.value).toBe('Mustafa Kemal Erdem')
      expect(reCheckPersCount.cnt).toBe(2)

      rawDb3.close()
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch {}
    }
  }, 30000)
})

