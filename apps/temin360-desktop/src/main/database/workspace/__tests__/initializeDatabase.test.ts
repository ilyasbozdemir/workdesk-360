// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { initializeDatabase } from '@dt/database'

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
})

