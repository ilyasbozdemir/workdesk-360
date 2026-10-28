// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import {
  ensureAuditLogSchema,
  initSessionContext,
  enableAuditLogForTable,
  getAuditHistory,
  getMacHash,
  AuditChainService,
  AuditIntegrityVerifier,
  GENESIS_HASH
} from '@dt/database'

function createRealSqliteDb(): {
  rawDb: DatabaseSync
  db: {
    exec: (sql: string) => void
    prepare: (sql: string) => {
      run: (...args: any[]) => void
      get: (...args: any[]) => any
      all: (...args: any[]) => any[]
    }
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
    }
  }
  return { rawDb, db }
}

describe('SQLite Audit Trail & Anti-Tampering Triggers', () => {
  let rawDb: DatabaseSync
  let db: any

  beforeEach(() => {
    const fixture = createRealSqliteDb()
    rawDb = fixture.rawDb
    db = fixture.db
    db.exec(`
      CREATE TABLE test_teklif (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firma_adi TEXT,
        teklif_fiyati REAL
      );
    `)
  })

  afterEach(() => {
    rawDb.close()
  })

  it('getMacHash fiziksel veya varsayılan geçerli bir SHA-256 hash üretir', () => {
    const hash = getMacHash()
    expect(hash).toBeDefined()
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('tabloya yeni kayıt eklenmesinde (INSERT) eklenen verileri günlüğe yazar', () => {
    initSessionContext(db, { macHash: 'mock-mac-hash-insert', userId: 'USER_KATIP' })
    enableAuditLogForTable(db, 'test_teklif', ['firma_adi', 'teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, firma_adi, teklif_fiyati) VALUES (10, 'Firma Yeni', 3500)`).run()

    const history = getAuditHistory(db, { tableName: 'test_teklif', recordId: 10 })
    expect(history.length).toBe(1)
    expect(history[0].operation_type).toBe('INSERT')
    expect(history[0].old_values).toBeNull()
    expect(history[0].mac_hash).toBe('mock-mac-hash-insert')
    expect(history[0].changed_by).toBe('USER_KATIP')

    const newVals = JSON.parse(history[0].new_values!)
    expect(newVals.firma_adi).toBe('Firma Yeni')
    expect(newVals.teklif_fiyati).toBe(3500)
  })

  it('tablo güncellemesinde (UPDATE) eski ve yeni verileri ve mac_hash değerini günlüğe yazar', () => {
    initSessionContext(db, { macHash: 'mock-mac-hash-12345', userId: 'USER_MUDUR' })
    enableAuditLogForTable(db, 'test_teklif', ['firma_adi', 'teklif_fiyati'])

    // Insert initial record (logs INSERT)
    db.prepare(`INSERT INTO test_teklif (id, firma_adi, teklif_fiyati) VALUES (1, 'Firma A', 1000)`).run()

    // Update record (logs UPDATE)
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 1250, firma_adi = 'Firma A Revize' WHERE id = 1`).run()

    const history = getAuditHistory(db, { tableName: 'test_teklif', recordId: 1 })
    expect(history.length).toBe(2)
    expect(history[0].operation_type).toBe('UPDATE')
    expect(history[0].mac_hash).toBe('mock-mac-hash-12345')
    expect(history[0].changed_by).toBe('USER_MUDUR')

    const oldVals = JSON.parse(history[0].old_values!)
    const newVals = JSON.parse(history[0].new_values!)
    expect(oldVals.teklif_fiyati).toBe(1000)
    expect(oldVals.firma_adi).toBe('Firma A')
    expect(newVals.teklif_fiyati).toBe(1250)
    expect(newVals.firma_adi).toBe('Firma A Revize')

    expect(history[1].operation_type).toBe('INSERT')
  })

  it('tablo silinmesinde (DELETE) silinen veriyi kanıt olarak saklar', () => {
    initSessionContext(db, { macHash: 'mock-mac-hash-99999' })
    enableAuditLogForTable(db, 'test_teklif', ['firma_adi', 'teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, firma_adi, teklif_fiyati) VALUES (2, 'Silinecek Firma', 500)`).run()
    db.prepare(`DELETE FROM test_teklif WHERE id = 2`).run()

    const history = getAuditHistory(db, { tableName: 'test_teklif', recordId: 2 })
    expect(history.length).toBe(2)
    expect(history[0].operation_type).toBe('DELETE')
    expect(history[0].mac_hash).toBe('mock-mac-hash-99999')
    const oldVals = JSON.parse(history[0].old_values!)
    expect(oldVals.teklif_fiyati).toBe(500)
    expect(oldVals.firma_adi).toBe('Silinecek Firma')

    expect(history[1].operation_type).toBe('INSERT')
  })

  it('oturum açılmadan yapılan dış müdahaleleri UNAUTHORIZED_EXTERNAL_CLIENT olarak damgalar', () => {
    // Session context olmadan (örneğin DB Browser ile doğrudan açılmış gibi)
    ensureAuditLogSchema(db)
    enableAuditLogForTable(db, 'test_teklif', ['firma_adi', 'teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, firma_adi, teklif_fiyati) VALUES (3, 'Harici Firma', 200)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 350 WHERE id = 3`).run()

    const history = getAuditHistory(db, { tableName: 'test_teklif', recordId: 3 })
    expect(history.length).toBe(2)
    expect(history[0].mac_hash).toBe('UNAUTHORIZED_EXTERNAL_CLIENT')
    expect(history[1].mac_hash).toBe('UNAUTHORIZED_EXTERNAL_CLIENT')
  })

  it('Anti-Tampering: sys_audit_logs tablosundan log silinmesini (DELETE) engeller', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (4, 100)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 200 WHERE id = 4`).run()

    const history = getAuditHistory(db, { recordId: 4 })
    expect(history.length).toBe(2)
    const logId = history[0].id

    // Log silme girişimi RAISE(FAIL) ile engellenmeli
    expect(() => {
      db.prepare(`DELETE FROM sys_audit_logs WHERE id = ?`).run(logId)
    }).toThrow(/silinemez/i)
  })

  it('Anti-Tampering: sys_audit_logs tablosundaki kayıtların değiştirilmesini (UPDATE) engeller', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (5, 100)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 300 WHERE id = 5`).run()

    const history = getAuditHistory(db, { recordId: 5 })
    expect(history.length).toBe(2)
    const logId = history[0].id

    // Log değiştirme girişimi RAISE(FAIL) ile engellenmeli
    expect(() => {
      db.prepare(`UPDATE sys_audit_logs SET new_values = '{"teklif_fiyati": 999}' WHERE id = ?`).run(logId)
    }).toThrow(/değiştirilemez/i)
  })

  it('Chained Hashing: ilk log kaydını GENESIS_HASH ile bağlar ve zincir doğrulanır', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    // Yalnızca 1 işlem (ilk INSERT kaydı)
    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (6, 500)`).run()

    const history = getAuditHistory(db, { recordId: 6 })
    expect(history.length).toBe(1)
    const log1 = history[0]

    expect(log1.operation_type).toBe('INSERT')
    expect(log1.prev_hash).toBe(GENESIS_HASH)
    expect(log1.current_hash).toBeDefined()
    expect(log1.current_hash).toMatch(/^[a-f0-9]{64}$/)

    // Doğrulama kontrolü: zincir sağlam olmalı
    const verifyResult = AuditIntegrityVerifier.verifyChain(db)
    expect(verifyResult.isValid).toBe(true)
    expect(verifyResult.totalRecords).toBeGreaterThanOrEqual(1)
  })

  it('Chained Hashing: birden fazla log satırını kriptografik zincirle birbirine bağlar', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (7, 1000)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 1100 WHERE id = 7`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 1200 WHERE id = 7`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 1300 WHERE id = 7`).run()

    AuditChainService.secureAllPendingLogs(db)

    const allLogs = db.prepare(`SELECT * FROM sys_audit_logs WHERE record_id = 7 ORDER BY id ASC`).all() as any[]
    expect(allLogs.length).toBe(4) // 1 INSERT + 3 UPDATEs

    // Blok 0 (ilk log) prev_hash = GENESIS_HASH veya önceki son kayıt
    // Blok 1 prev_hash = Blok 0 current_hash
    expect(allLogs[1].prev_hash).toBe(allLogs[0].current_hash)
    // Blok 2 prev_hash = Blok 1 current_hash
    expect(allLogs[2].prev_hash).toBe(allLogs[1].current_hash)
    // Blok 3 prev_hash = Blok 2 current_hash
    expect(allLogs[3].prev_hash).toBe(allLogs[2].current_hash)

    // Bütünlük doğrulaması
    const verify = AuditIntegrityVerifier.verifyChain(db)
    expect(verify.isValid).toBe(true)
  })

  it('Chained Hashing: aradaki bir satır manipüle edilirse bütünlük kontrolü alarm verir', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (8, 2000)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 2100 WHERE id = 8`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 2200 WHERE id = 8`).run()

    AuditChainService.secureAllPendingLogs(db)

    const logs = db.prepare(`SELECT id FROM sys_audit_logs WHERE record_id = 8 ORDER BY id ASC`).all() as any[]
    const targetId = logs[0].id

    // Dışarıdan manipülasyon simülasyonu: tetikleyiciyi geçici devre dışı bırakıp veriyi bozma
    db.exec(`DROP TRIGGER IF EXISTS trg_prevent_audit_update;`)
    db.prepare(`UPDATE sys_audit_logs SET new_values = '{"teklif_fiyati": 999999}' WHERE id = ?`).run(targetId)

    // Doğrulama başarısız olmalı
    const verify = AuditIntegrityVerifier.verifyChain(db)
    expect(verify.isValid).toBe(false)
    expect(verify.status).toBe('TAMPERED_CONTENT')
    expect(verify.brokenRecordId).toBe(targetId)
    expect(verify.error).toContain('tahrifatı')
  })

  it('Audit Doğrulama: boş log tablosu CLEAN ve isValid: true döner', () => {
    const { db: emptyDb, rawDb } = createRealSqliteDb()
    const result = AuditIntegrityVerifier.verifyChain(emptyDb as any)
    expect(result.isValid).toBe(true)
    expect(result.isFullySealed).toBe(true)
    expect(result.hasPendingUnhashed).toBe(false)
    expect(result.status).toBe('CLEAN')
    expect(result.totalRecords).toBe(0)
    expect(result.sealedRecords).toBe(0)
    expect(result.unhashedRecords).toBe(0)
    rawDb.close()
  })

  it('Audit Doğrulama: yalnızca mühürsüz kayıtlar varken strict modda isValid: false, PENDING_UNSEALED döner', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    // Mühürleme yapmadan INSERT yapıyoruz
    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (9, 3000)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 3500 WHERE id = 9`).run()

    // 1. Strict adli doğrulama (varsayılan)
    const strictVerify = AuditIntegrityVerifier.verifyChain(db)
    expect(strictVerify.isValid).toBe(false)
    expect(strictVerify.isFullySealed).toBe(false)
    expect(strictVerify.hasPendingUnhashed).toBe(true)
    expect(strictVerify.status).toBe('PENDING_UNSEALED')
    expect(strictVerify.unhashedRecords).toBeGreaterThanOrEqual(2)
    expect(strictVerify.error).toContain('mühürsüz kayıt bulundu')

    // 2. allowPendingUnhashed: true ile kontrol
    const permissiveVerify = AuditIntegrityVerifier.verifyChain(db, { allowPendingUnhashed: true })
    expect(permissiveVerify.isValid).toBe(true)
    expect(permissiveVerify.isFullySealed).toBe(false)
    expect(permissiveVerify.status).toBe('PENDING_UNSEALED')

    // 3. Mühürleme yapıldıktan sonra CLEAN ve %100 mühürlü olmalı
    const sealed = AuditChainService.secureAllPendingLogs(db)
    expect(sealed).toBeGreaterThanOrEqual(2)

    const sealedVerify = AuditIntegrityVerifier.verifyChain(db)
    expect(sealedVerify.isValid).toBe(true)
    expect(sealedVerify.isFullySealed).toBe(true)
    expect(sealedVerify.hasPendingUnhashed).toBe(false)
    expect(sealedVerify.status).toBe('CLEAN')
  })

  it('Audit Doğrulama: araya mühürsüz kayıt sızdırıldığında (INTERLEAVED_HOLE) alarm verir ve sıra dışı mühürlemeyi engeller', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (10, 4000)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 4100 WHERE id = 10`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 4200 WHERE id = 10`).run()

    AuditChainService.secureAllPendingLogs(db)

    // Tüm kayıtlar mühürlü
    const initialVerify = AuditIntegrityVerifier.verifyChain(db)
    expect(initialVerify.isValid).toBe(true)
    expect(initialVerify.status).toBe('CLEAN')

    // Saldırgan simülasyonu: aradaki bir kaydın current_hash değerini NULL yapıyor (veya araya satır enjekte ediyor)
    const logs = db.prepare(`SELECT id FROM sys_audit_logs WHERE record_id = 10 ORDER BY id ASC`).all() as any[]
    const middleId = logs[1].id

    db.exec(`DROP TRIGGER IF EXISTS trg_prevent_audit_update;`)
    db.prepare(`UPDATE sys_audit_logs SET current_hash = NULL WHERE id = ?`).run(middleId)

    // Bütünlük denetleyicisi INTERLEAVED_HOLE anomalisini anında yakalamalı
    const holeVerify = AuditIntegrityVerifier.verifyChain(db)
    expect(holeVerify.isValid).toBe(false)
    expect(holeVerify.status).toBe('INTERLEAVED_HOLE')
    expect(holeVerify.brokenRecordId).toBe(middleId)
    expect(holeVerify.error).toContain('mühürlü blokların arasında veya öncesinde')

    // AuditChainService.secureNextLog aradaki deliği sıra dışı mühürlemeyi reddetmeli
    expect(() => AuditChainService.secureNextLog(db)).toThrow(/Sıra dışı mühürleme engellendi/i)
  })

  it('Audit Doğrulama: aradan kayıt tamamen silindiğinde BROKEN_CHAIN yakalar', () => {
    initSessionContext(db)
    enableAuditLogForTable(db, 'test_teklif', ['teklif_fiyati'])

    db.prepare(`INSERT INTO test_teklif (id, teklif_fiyati) VALUES (11, 5000)`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 5100 WHERE id = 11`).run()
    db.prepare(`UPDATE test_teklif SET teklif_fiyati = 5200 WHERE id = 11`).run()

    AuditChainService.secureAllPendingLogs(db)

    const logs = db.prepare(`SELECT id FROM sys_audit_logs WHERE record_id = 11 ORDER BY id ASC`).all() as any[]
    const deleteId = logs[1].id
    const nextId = logs[2].id

    // Dışarıdan satır silme (DB Browser vb.)
    db.exec(`DROP TRIGGER IF EXISTS trg_prevent_audit_delete;`)
    db.prepare(`DELETE FROM sys_audit_logs WHERE id = ?`).run(deleteId)

    const verify = AuditIntegrityVerifier.verifyChain(db)
    expect(verify.isValid).toBe(false)
    expect(verify.status).toBe('BROKEN_CHAIN')
    expect(verify.brokenRecordId).toBe(nextId)
    expect(verify.error).toContain('Zincir kırılması')
  })
})

