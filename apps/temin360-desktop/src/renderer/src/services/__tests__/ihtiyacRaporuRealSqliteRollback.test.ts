// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import {
  executeDbTransaction,
  handleDbTransaction,
  SqliteDatabaseLike
} from '../../../../main/ipc/db/dbTransaction'
import { ihtiyacRaporuService } from '../ihtiyacRaporuService'
import { dbClient } from '../db/dbClient'

/**
 * Gerçek SQLite Veritabanı ile Transaction Rollback & Atomiklik Doğrulama Testi
 *
 * Bu test, uygulamanın ÜRETİM kodundaki gerçek transaction motorunu (executeDbTransaction / handleDbTransaction)
 * doğrudan Node.js v22'nin yerleşik SQLite motoru (node:sqlite DatabaseSync) üzerinde çalıştırır:
 * 1. Transaction içindeki işlemlerin bir SQL veya kısıtlama hatası aldığında fiziksel SQLite motoru
 *    tarafından anında ROLLBACK yapıldığını doğrular.
 * 2. Mutation (onMutation) bildirimlerinin transaction sırasında anlık olarak tetiklenmediğini,
 *    rollback anında çalışma alanı değişiklik geçmişini (workspace dirty state) kirletmediğini,
 *    yalnızca başarılı COMMIT sonrası iletildiğini doğrular.
 * 3. onSave() dosya yazma hatasının, başarılı bir veritabanı COMMIT işlemini "başarısız / geri alındı"
 *    olarak maskelemediğini ({ success: true, saveError, warning }) kanıtlar.
 * 4. ihtiyacRaporuService.linkToDosya() servisinin bu gerçek transaction motoruyla fiziksel
 *    veritabanında atomik çalıştığını ve kalem ekleme hatasında rapor güncellemesini de geri alarak
 *    eksiksiz ROLLBACK yaptığını fiziki olarak belgeler.
 */
describe('Gerçek SQLite Motoru: İhtiyaç Raporu Transaction & Rollback Güvencesi', () => {
  let db: DatabaseSync

  beforeEach(() => {
    // 1. Gerçek fiziksel in-memory SQLite veritabanı oluştur
    db = new DatabaseSync(':memory:')

    // Foreign key ve kısıtlama kontrollerini aktif et
    db.exec('PRAGMA foreign_keys = ON;')

    // Üretim şemasıyla birebir uyumlu gerçek tabloları oluştur
    db.exec(`
      CREATE TABLE DATA_TeminDosyasi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_no TEXT,
        dosya_no TEXT,
        konu TEXT,
        tur TEXT DEFAULT 'mal',
        evrak_sayisi TEXT,
        isin_aciklamasi TEXT,
        talep_eden_personel_id INTEGER,
        ihtiyac_yeri TEXT
      );

      CREATE TABLE DATA_IhtiyacRaporu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rapor_no TEXT NOT NULL UNIQUE,
        baslik TEXT NOT NULL,
        gerekce TEXT,
        durum TEXT DEFAULT 'taslak',
        temin_dosya_id INTEGER,
        tarih DATE DEFAULT CURRENT_DATE,
        onay_tarihi DATE,
        evrak_sayisi TEXT,
        talep_eden_personel_id INTEGER,
        talep_eden_personel TEXT,
        talep_eden_unvan TEXT,
        birim_id INTEGER,
        birim_adi TEXT,
        tahmini_butce REAL DEFAULT 0,
        notlar TEXT,
        updated_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(temin_dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE SET NULL
      );

      CREATE TABLE DATA_IhtiyacRaporuKalem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rapor_id INTEGER NOT NULL,
        sira_no INTEGER,
        kalem_adi TEXT NOT NULL,
        tipi TEXT DEFAULT 'Mal',
        birim TEXT DEFAULT 'Adet',
        miktar REAL NOT NULL,
        kdv_orani REAL DEFAULT 20,
        tasinir_kodu TEXT,
        okas_kodu TEXT,
        poz_no TEXT,
        aciklama TEXT,
        tahmini_birim_fiyat REAL,
        FOREIGN KEY(rapor_id) REFERENCES DATA_IhtiyacRaporu(id) ON DELETE CASCADE
      );

      CREATE TABLE DATA_TeminKalem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temin_dosya_id INTEGER NOT NULL,
        sira_no INTEGER,
        kalem_adi TEXT NOT NULL,
        tipi TEXT DEFAULT 'Mal',
        birim TEXT DEFAULT 'Adet',
        miktar REAL NOT NULL,
        kdv_orani REAL DEFAULT 20,
        tasinir_kodu TEXT,
        okas_kodu TEXT,
        poz_no TEXT,
        aciklama TEXT,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY(temin_dosya_id) REFERENCES DATA_TeminDosyasi(id) ON DELETE CASCADE
      );
    `)

    // Başlangıç verilerini yerleştir: 1 hedef dosya, 2 taslak ihtiyaç raporu ve kalemleri
    db.exec(`
      INSERT INTO DATA_TeminDosyasi (id, temin_no, dosya_no, konu, evrak_sayisi, isin_aciklamasi)
      VALUES (10, 'DT-2026/01', '2026/01', 'Kırtasiye Alımı', 'E-2026-100', 'Müdürlük kırtasiye ihtiyacı');

      INSERT INTO DATA_IhtiyacRaporu (id, rapor_no, baslik, gerekce, durum, temin_dosya_id, tarih, birim_adi)
      VALUES (1, 'IR-2026/001', 'A4 Kağıt İhtiyacı', 'Yazışmalar için', 'taslak', NULL, '2026-03-25', 'Yazı İşleri Müdürlüğü');

      INSERT INTO DATA_IhtiyacRaporuKalem (id, rapor_id, sira_no, kalem_adi, tipi, birim, miktar, kdv_orani)
      VALUES (101, 1, 1, 'Fotokopi Kağıdı A4', 'Mal', 'Paket', 50, 20);

      INSERT INTO DATA_IhtiyacRaporu (id, rapor_no, baslik, gerekce, durum, temin_dosya_id, tarih, birim_adi)
      VALUES (2, 'IR-2026/002', 'Toner İhtiyacı', 'Baskı işleri için', 'taslak', NULL, '2026-03-26', 'Bilgi İşlem Müdürlüğü');

      INSERT INTO DATA_IhtiyacRaporuKalem (id, rapor_id, sira_no, kalem_adi, tipi, birim, miktar, kdv_orani)
      VALUES (102, 2, 1, 'HATALI_KALEM_ROLLBACK_TESTI', 'Mal', 'Adet', 5, 20);
    `)

    // Servis aktarımı sırasında fiziksel transaction rollback senaryosunu test etmek için SQLite trigger'ı
    db.exec(`
      CREATE TRIGGER trigger_abort_simulated_kalem
      BEFORE INSERT ON DATA_TeminKalem
      FOR EACH ROW WHEN NEW.kalem_adi = 'HATALI_KALEM_ROLLBACK_TESTI'
      BEGIN
        SELECT RAISE(ABORT, 'Simüle edilen SQLite kalem aktarım hatası (Fiziksel Rollback Kanıtı)');
      END;
    `)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    try {
      db.close()
    } catch {
      // ignore
    }
  })

  it('1. GERÇEK ROLLBACK KANITI (Üretim executeDbTransaction): SQL hatasında önceki işlemler geri alınmalı ve hata fırlatılmalıdır', () => {
    // 1. Adım: Başlangıç durumunu doğrula
    const initialRapor = db
      .prepare('SELECT durum, temin_dosya_id FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
      temin_dosya_id: number | null
    }
    expect(initialRapor.durum).toBe('taslak')
    expect(initialRapor.temin_dosya_id).toBeNull()

    const initialKalemCount = db
      .prepare('SELECT COUNT(*) as count FROM DATA_TeminKalem WHERE temin_dosya_id = 10')
      .get() as {
      count: number
    }
    expect(initialKalemCount.count).toBe(0)

    // 2. Adım: İhtiyaç Raporu aktarım transaction listesi oluştur
    const transactionStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET temin_dosya_id = ?, durum = 'dosyaya_aktarildi' WHERE id = ?`,
        params: [10, 1]
      },
      {
        sql: `INSERT INTO DATA_TeminKalem (temin_dosya_id, sira_no, kalem_adi, miktar) VALUES (?, ?, ?, ?)`,
        params: [10, 1, 'Fotokopi Kağıdı A4', 20]
      },
      {
        sql: `INSERT INTO NON_EXISTING_TABLE_TO_FORCE_SQLITE_ROLLBACK (id) VALUES (1)`,
        params: []
      }
    ]

    // 3. Adım: Üretim executeDbTransaction çağrısı -> Hata fırlatmalı
    expect(() => {
      executeDbTransaction(db, transactionStatements, { validateSql: true })
    }).toThrow(/no such table: NON_EXISTING_TABLE_TO_FORCE_SQLITE_ROLLBACK/)

    // 4. Adım: GERÇEK SQLITE VERİTABANI KONTROLÜ (Rollback kanıtı):
    const postRollbackRapor = db
      .prepare('SELECT durum, temin_dosya_id FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
      temin_dosya_id: number | null
    }
    expect(postRollbackRapor.durum).toBe('taslak')
    expect(postRollbackRapor.temin_dosya_id).toBeNull()

    const postRollbackKalemCount = db
      .prepare('SELECT COUNT(*) as count FROM DATA_TeminKalem WHERE temin_dosya_id = 10')
      .get() as {
      count: number
    }
    expect(postRollbackKalemCount.count).toBe(0)
  })

  it('2. GERÇEK FOREIGN KEY ROLLBACK KANITI (Üretim executeDbTransaction): Yabancı anahtar kısıtlaması ihlal edildiğinde tüm transaction geri alınmalıdır', () => {
    const transactionStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET temin_dosya_id = ?, durum = 'dosyaya_aktarildi' WHERE id = ?`,
        params: [10, 1]
      },
      {
        sql: `INSERT INTO DATA_TeminKalem (temin_dosya_id, sira_no, kalem_adi, miktar) VALUES (?, ?, ?, ?)`,
        params: [999999, 1, 'Geçersiz Dosya Kalemi', 5] // 999999 ID'li dosya yok!
      }
    ]

    expect(() => {
      executeDbTransaction(db, transactionStatements, { validateSql: true })
    }).toThrow(/FOREIGN KEY constraint failed/)

    const savedRapor = db
      .prepare('SELECT durum, temin_dosya_id FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
      temin_dosya_id: number | null
    }
    expect(savedRapor.durum).toBe('taslak')
    expect(savedRapor.temin_dosya_id).toBeNull()
  })

  it('3. GERÇEK COMMIT KANITI (Üretim executeDbTransaction): Hata olmadığında tüm transaction atomik olarak başarıyla onaylanmalıdır (COMMIT)', () => {
    const validStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET temin_dosya_id = ?, durum = 'dosyaya_aktarildi' WHERE id = ?`,
        params: [10, 1]
      },
      {
        sql: `INSERT INTO DATA_TeminKalem (temin_dosya_id, sira_no, kalem_adi, miktar) VALUES (?, ?, ?, ?)`,
        params: [10, 1, 'Birinci Kalem', 10]
      },
      {
        sql: `INSERT INTO DATA_TeminKalem (temin_dosya_id, sira_no, kalem_adi, miktar) VALUES (?, ?, ?, ?)`,
        params: [10, 2, 'İkinci Kalem', 5]
      }
    ]

    const result = executeDbTransaction(db, validStatements, { validateSql: true })
    expect(result.success).toBe(true)

    const committedRapor = db
      .prepare('SELECT durum, temin_dosya_id FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
      temin_dosya_id: number | null
    }
    expect(committedRapor.durum).toBe('dosyaya_aktarildi')
    expect(committedRapor.temin_dosya_id).toBe(10)

    const committedKalemler = db
      .prepare(
        'SELECT sira_no, kalem_adi, miktar FROM DATA_TeminKalem WHERE temin_dosya_id = 10 ORDER BY sira_no ASC'
      )
      .all() as {
      sira_no: number
      kalem_adi: string
      miktar: number
    }[]
    expect(committedKalemler.length).toBe(2)
    expect(committedKalemler[0].kalem_adi).toBe('Birinci Kalem')
    expect(committedKalemler[1].kalem_adi).toBe('İkinci Kalem')
  })

  it('4. MUTATION BİLGİSİ BÜTÜNLÜĞÜ: Transaction rollback olduğunda onMutation asla çağrılmamalı, yalnızca COMMIT sonrası bildirilmelidir', () => {
    const recordedMutations: string[] = []
    const onMutation = (table: string, action: string) => {
      recordedMutations.push(`${table}:${action}`)
    }

    // A: Rollback senaryosu -> 1. işlem başarılı, 2. işlem hatalı
    const failingStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET durum = 'dosyaya_aktarildi' WHERE id = 1`,
        params: []
      },
      {
        sql: `INSERT INTO OLMAYAN_TABLO_HATA (id) VALUES (1)`,
        params: []
      }
    ]

    expect(() => {
      executeDbTransaction(db, failingStatements, { validateSql: true, onMutation })
    }).toThrow(/no such table/)

    // Önemli Güvence: Rollback anında onMutation dizisi BOŞ kalmalı, workspace kirlenmemelidir!
    expect(recordedMutations.length).toBe(0)

    // B: Başarılı commit senaryosu -> Değişiklikler topluca iletilmeli
    const successfulStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET durum = 'onaylandi' WHERE id = 1`,
        params: []
      },
      {
        sql: `INSERT INTO DATA_TeminKalem (temin_dosya_id, sira_no, kalem_adi, miktar) VALUES (10, 1, 'Kalem A', 1)`,
        params: []
      }
    ]

    executeDbTransaction(db, successfulStatements, { validateSql: true, onMutation })
    expect(recordedMutations.length).toBe(2)
    expect(recordedMutations[0]).toBe('DATA_IhtiyacRaporu:update')
    expect(recordedMutations[1]).toBe('DATA_TeminKalem:insert')
  })

  it('5. ÜRETİM IPC İŞLEYİCİSİ DOĞRULAMASI (handleDbTransaction): Hata durumunda rollback yapıp { success: false, error } dönmeli, onSave çağrılmamalıdır', async () => {
    let saveCalled = false
    const mutations: string[] = []

    const faultyStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET temin_dosya_id = ?, durum = 'dosyaya_aktarildi' WHERE id = ?`,
        params: [10, 1]
      },
      {
        sql: `INSERT INTO INVALID_TABLE_NAME (col) VALUES (123)`,
        params: []
      }
    ]

    const response = await handleDbTransaction(db, faultyStatements, {
      validateSql: true,
      onMutation: (tbl, action) => {
        mutations.push(`${tbl}:${action}`)
      },
      onSave: () => {
        saveCalled = true
      }
    })

    expect(response.success).toBe(false)
    expect(response.error).toMatch(/no such table: INVALID_TABLE_NAME/)
    expect(saveCalled).toBe(false) // Rollback anında dosya kaydedilmemeli
    expect(mutations.length).toBe(0) // Rollback anında mutation bildirilmemeli

    const savedRapor = db
      .prepare('SELECT durum, temin_dosya_id FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
      temin_dosya_id: number | null
    }
    expect(savedRapor.durum).toBe('taslak')
    expect(savedRapor.temin_dosya_id).toBeNull()
  })

  it('6. ONSAVE HATASI AYRIMI: Başarılı COMMIT sonrası dosya kaydetme (onSave) hatası transaction sonucunu maskelememeli, success: true dönmelidir', async () => {
    const validStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET durum = 'onaylandi' WHERE id = 1`,
        params: []
      }
    ]

    // onSave fonksiyonu diske yazarken hata fırlatsın (örn. disk dolu veya dosya kilitli)
    const response = await handleDbTransaction(db, validStatements, {
      validateSql: true,
      onSave: () => {
        throw new Error('Diske yazma hatası (Simüle edilmiş I/O hatası)')
      }
    })

    // 1. Veritabanı COMMIT işlemi başarılı olduğu için success true kalmalı
    expect(response.success).toBe(true)
    // 2. Çağıran tarafa kaydetme uyarısı iletilmeli
    expect(response.saveError).toMatch(/Diske yazma hatası/)
    expect(response.warning).toBeDefined()

    // 3. Veritabanındaki değişiklik kalıcı olmalı (commit geri alınmamış olmalı)
    const committedRapor = db
      .prepare('SELECT durum FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
    }
    expect(committedRapor.durum).toBe('onaylandi')
  })

  it('7. SQL GÜVENLİK KORUMASI (sqlGuard Entegrasyonu): Güvenlik kuralını ihlal eden sorgular SQLite motoruna gitmeden engellenmeli ve işlem durdurulmalıdır', () => {
    const maliciousStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET durum = 'dosyaya_aktarildi' WHERE id = 1`,
        params: []
      },
      {
        sql: `SELECT * FROM SETTINGS WHERE key = 'license'`,
        params: []
      }
    ]

    expect(() => {
      executeDbTransaction(db, maliciousStatements, { validateSql: true })
    }).toThrow(/sqlGuard.*restricted/i)

    const savedRapor = db.prepare('SELECT durum FROM DATA_IhtiyacRaporu WHERE id = 1').get() as {
      durum: string
    }
    expect(savedRapor.durum).toBe('taslak')
  })

  it('8. END-TO-END SERVİS ENTEGRASYONU VE FİZİKSEL ROLLBACK: ihtiyacRaporuService.linkToDosya(), üretim transaction motoru üzerinden SQLite üzerinde atomik çalışmalı ve kalem ekleme hatasında rapor güncellemesini de geri almalıdır', async () => {
    // dbClient köprüsünü doğrudan fiziksel SQLite veritabanımıza bağla
    vi.spyOn(dbClient, 'query').mockImplementation(async (sql: string, params: any[] = []) => {
      const stmt = db.prepare(sql)
      return stmt.all(...params) as any
    })

    vi.spyOn(dbClient, 'queryFirst').mockImplementation(async (sql: string, params: any[] = []) => {
      const stmt = db.prepare(sql)
      const rows = stmt.all(...params) as any[]
      return rows.length > 0 ? rows[0] : null
    })

    vi.spyOn(dbClient, 'run').mockImplementation(async (sql: string, params: any[] = []) => {
      const stmt = db.prepare(sql)
      const info = stmt.run(...params)
      return {
        success: true,
        lastInsertRowid: info.lastInsertRowid,
        changes: Number(info.changes || 0)
      }
    })

    vi.spyOn(dbClient, 'transaction').mockImplementation(
      async (statements: { sql: string; params?: unknown[] }[]) => {
        const res = await handleDbTransaction(db, statements as any, { validateSql: true })
        if (!res.success) {
          throw new Error(res.error || 'Transaction failed')
        }
        return {
          success: true,
          lastInsertRowid: res.lastInsertRowid,
          changes: Number(res.changes || 0)
        }
      }
    )

    // Senaryo A: Başarılı aktarım (Rapor 1 -> Dosya 10)
    const successResult = await ihtiyacRaporuService.linkToDosya(1, 10, {
      copyItemsToDosya: true,
      transferMode: 'append_if_missing'
    })
    expect(successResult.success).toBe(true)
    expect(successResult.transferredCount).toBe(1)

    const linkedRapor = db
      .prepare('SELECT durum, temin_dosya_id FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
      temin_dosya_id: number
    }
    expect(linkedRapor.durum).toBe('dosyaya_aktarildi')
    expect(linkedRapor.temin_dosya_id).toBe(10)

    // Senaryo B: FİZİKSEL ROLLBACK KANITI (Rapor 2 -> Dosya 10)
    // Rapor 2'nin kalemi 'HATALI_KALEM_ROLLBACK_TESTI' adını taşır.
    // linkToDosya() önce Rapor 2 durumunu 'dosyaya_aktarildi' yapar, ardından kalemi eklemeye çalışır.
    // SQLite trigger'ı kalem eklemede RAISE(ABORT) fırlatarak fiziksel transaction hatası üretir.
    await expect(
      ihtiyacRaporuService.linkToDosya(2, 10, {
        copyItemsToDosya: true,
        transferMode: 'append_all'
      })
    ).rejects.toThrow(/Simüle edilen SQLite kalem aktarım hatası/)

    // Fiziksel SQLite Doğrulaması:
    // Kalem ekleme başarısız olduğu için, İLK ADIMDA yapılan 'UPDATE DATA_IhtiyacRaporu' işlemi de SQLite tarafından ROLLBACK yapılmış olmalıdır!
    const rolledBackRapor = db
      .prepare('SELECT durum, temin_dosya_id FROM DATA_IhtiyacRaporu WHERE id = 2')
      .get() as {
      durum: string
      temin_dosya_id: number | null
    }
    expect(rolledBackRapor.durum).toBe('taslak') // Asla 'dosyaya_aktarildi' olarak kalmamış!
    expect(rolledBackRapor.temin_dosya_id).toBeNull() // Dosya bağlantısı atanmamış!
  })

  it('9. NODE.JS TEST ORTAMI DOĞRULAMASI: node:sqlite DatabaseSync desteği için Node.js sürümünün >= 22.5.0 olduğunu fiziki olarak doğrular', () => {
    const [majorStr, minorStr] = process.versions.node.split('.')
    const major = parseInt(majorStr, 10)
    const minor = parseInt(minorStr, 10)

    const isCompatible = major > 22 || (major === 22 && minor >= 5)
    expect(isCompatible).toBe(true)
    expect(typeof DatabaseSync).toBe('function')
  })

  it('10. BETTER-SQLITE3 UYUMLULUĞU: db.transaction sarmalayıcısına sahip motorlarda (Electron çalışma zamanı) native transaction yolunu kullanmalıdır', () => {
    let nativeTransactionCalled = false
    let preparedSql = ''

    const mockBetterSqliteDb: SqliteDatabaseLike = {
      prepare: (sql: string) => ({
        run: () => {
          preparedSql = sql
          return { lastInsertRowid: 1, changes: 1 }
        }
      }),
      transaction: (fn: (stmts: any[]) => void) => {
        return (stmts: any[]) => {
          nativeTransactionCalled = true
          fn(stmts)
        }
      }
    }

    const testStatements = [
      { sql: 'UPDATE DATA_IhtiyacRaporu SET durum = ? WHERE id = ?', params: ['onaylandi', 1] }
    ]

    const result = executeDbTransaction(mockBetterSqliteDb, testStatements, { validateSql: false })
    expect(result.success).toBe(true)
    expect(nativeTransactionCalled).toBe(true)
    expect(preparedSql).toBe('UPDATE DATA_IhtiyacRaporu SET durum = ? WHERE id = ?')
  })

  it('11. ONMUTATION HATA YÖNETİMİ: Başarılı COMMIT sonrası onMutation callback hatası commit sonucunu maskelememeli, success: true kalmalıdır', async () => {
    const validStatements = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET durum = 'onaylandi' WHERE id = 1`,
        params: []
      }
    ]

    // onMutation callback'i hata fırlatsın (örn. UI store veya abonelik hatası)
    const result = executeDbTransaction(db, validStatements, {
      validateSql: true,
      onMutation: () => {
        throw new Error('Simüle edilmiş UI değişiklik takip hatası')
      }
    })

    // 1. Veritabanı COMMIT işlemi başarılı olduğu için success: true kalmalı
    expect(result.success).toBe(true)
    // 2. mutationError ve warning alanları doldurulmalı
    expect(result.mutationError).toMatch(/Simüle edilmiş UI değişiklik takip hatası/)
    expect(result.warning).toBeDefined()

    // 3. Veritabanındaki değişiklik kalıcı olmalı
    const committedRapor = db
      .prepare('SELECT durum FROM DATA_IhtiyacRaporu WHERE id = 1')
      .get() as {
      durum: string
    }
    expect(committedRapor.durum).toBe('onaylandi')

    // 4. Çoklu mutation durumunda tüm hata mesajlarının biriktirildiğini doğrula
    const multiStatements = [
      { sql: `UPDATE DATA_IhtiyacRaporu SET durum = 'taslak' WHERE id = 1`, params: [] },
      { sql: `UPDATE DATA_IhtiyacRaporu SET baslik = 'Yeni Baslik' WHERE id = 1`, params: [] }
    ]
    let callIndex = 0
    const multiResult = executeDbTransaction(db, multiStatements, {
      validateSql: true,
      onMutation: () => {
        callIndex++
        throw new Error(`Callback hatası #${callIndex}`)
      }
    })
    expect(multiResult.success).toBe(true)
    expect(multiResult.mutationError).toContain('Callback hatası #1')
    expect(multiResult.mutationError).toContain('Callback hatası #2')
    expect(multiResult.mutationError).toContain(';')

    // handleDbTransaction üzerinden de aynı güvenceyi doğrula
    const ipcResult = await handleDbTransaction(db, validStatements, {
      validateSql: true,
      onMutation: () => {
        throw new Error('IPC onMutation hatası')
      }
    })
    expect(ipcResult.success).toBe(true)
    expect(ipcResult.mutationError).toMatch(/IPC onMutation hatası/)
  })

  it('12. SIFIR DEĞİŞİKLİK GÜVENCESİ: Hiçbir satırı etkilemeyen sorgularda (changes === 0) onMutation tetiklenmemeli ve sahte değişiklik bildirilmemelidir', () => {
    let onMutationCalled = false
    const statementsWithNoChanges = [
      {
        sql: `UPDATE DATA_IhtiyacRaporu SET durum = 'onaylandi' WHERE id = 999999`,
        params: []
      }
    ]

    const result = executeDbTransaction(db, statementsWithNoChanges, {
      validateSql: true,
      onMutation: () => {
        onMutationCalled = true
      }
    })

    expect(result.success).toBe(true)
    expect(result.changes).toBe(0)
    expect(onMutationCalled).toBe(false)
  })
})
