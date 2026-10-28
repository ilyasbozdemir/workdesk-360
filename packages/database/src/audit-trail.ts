import type Database from 'better-sqlite3'
import os from 'os'
import crypto from 'crypto'

export interface AuditLogEntry {
  id: number
  table_name: string
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE'
  record_id: number
  old_values: string | null
  new_values: string | null
  changed_by: string
  mac_hash: string
  prev_hash?: string | null
  current_hash?: string | null
  timestamp: string
}

/**
 * Cihazın ilk aktif fiziksel ağ arayüzünün MAC adresini bulur ve SHA-256 ile hash'ler.
 * NOT: Bu değer adli bilişim (forensics) ve cihaz ilişkilendirmesi (telemetry) amacıyla
 * kayıt altına alınır; tek başına bir yetkilendirme anahtarı veya gizli parola değildir.
 */
export function getMacHash(): string {
  try {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          return crypto.createHash('sha256').update(net.mac).digest('hex')
        }
      }
    }
  } catch {}
  return crypto.createHash('sha256').update('UNKNOWN_DEVICE').digest('hex')
}

/**
 * SQLite hafızasında (RAM) geçici oturum tablosunu açar ve donanım kimliğini enjekte eder.
 */
export function initSessionContext(
  db: Database.Database,
  options?: { macHash?: string; userId?: string; appInstance?: string }
): void {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sys_session_context (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `)

    const macHash = options?.macHash || getMacHash()
    const userId = options?.userId || 'SYSTEM'
    const appInstance = options?.appInstance || 'WorkDesk360'

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sys_session_context (key, value)
      VALUES (?, ?);
    `)

    stmt.run('mac_hash', macHash)
    stmt.run('user_id', userId)
    stmt.run('app_instance', appInstance)
  } catch (error) {
    console.warn('[AuditTrail] Session context initialization warning:', error)
  }
}

/**
 * sys_audit_logs tablosunu ve anti-tampering (silinemez/değiştirilemez) kilitlerini kurar.
 */
export function ensureAuditLogSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sys_session_context (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sys_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      old_values TEXT,
      new_values TEXT,
      changed_by TEXT DEFAULT 'SYSTEM',
      mac_hash TEXT,
      prev_hash TEXT,
      current_hash TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_delete
    BEFORE DELETE ON sys_audit_logs
    BEGIN
      SELECT RAISE(FAIL, 'HATA: Adli bilişim ve teftiş güvenliği nedeniyle sistem günlük kayıtları silinemez!');
    END;

    DROP TRIGGER IF EXISTS trg_prevent_audit_update;
    CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE ON sys_audit_logs
    FOR EACH ROW
    WHEN OLD.current_hash IS NOT NULL
    BEGIN
      SELECT RAISE(FAIL, 'HATA: Adli bilişim ve teftiş güvenliği nedeniyle mühürlenmiş sistem günlük kayıtları değiştirilemez!');
    END;
  `)

  // Geriye dönük uyumluluk: Mevcut tablolara prev_hash ve current_hash sütunlarını güvenle ekle
  try {
    db.exec(`ALTER TABLE sys_audit_logs ADD COLUMN prev_hash TEXT;`)
  } catch {}
  try {
    db.exec(`ALTER TABLE sys_audit_logs ADD COLUMN current_hash TEXT;`)
  } catch {}
}

/**
 * Belirtilen bir tablo için otomatik SQLite Audit Log tetikleyicilerini hazırlar ve çalıştırır.
 */
export function enableAuditLogForTable(
  db: Database.Database,
  tableName: string,
  columns: string[]
): void {
  ensureAuditLogSchema(db)

  // Tablodaki mevcut sütunları dinamik olarak doğrula
  let validColumns = columns
  try {
    const tableInfo = db.prepare(`PRAGMA table_info("${tableName}")`).all() as { name: string }[]
    if (tableInfo && tableInfo.length > 0) {
      const existingCols = new Set(tableInfo.map((c) => c.name))
      validColumns = columns.filter((col) => existingCols.has(col))
    }
  } catch {
    // PRAGMA hatası olursa verilen sütun listesiyle devam et
  }

  if (validColumns.length === 0) return

  // JSON nesnesi oluşturmak için sütunları map'liyoruz
  const oldJsonFields = validColumns.map((col) => `'${col}', OLD."${col}"`).join(', ')
  const newJsonFields = validColumns.map((col) => `'${col}', NEW."${col}"`).join(', ')

  const insertTriggerSQL = `
    DROP TRIGGER IF EXISTS trg_audit_${tableName}_insert;
    CREATE TRIGGER trg_audit_${tableName}_insert
    AFTER INSERT ON "${tableName}"
    FOR EACH ROW
    BEGIN
      INSERT INTO sys_audit_logs (
        table_name,
        operation_type,
        record_id,
        old_values,
        new_values,
        mac_hash,
        changed_by
      )
      VALUES (
        '${tableName}',
        'INSERT',
        NEW.id,
        NULL,
        json_object(${newJsonFields}),
        IFNULL((SELECT value FROM sys_session_context WHERE key = 'mac_hash'), 'UNAUTHORIZED_EXTERNAL_CLIENT'),
        IFNULL((SELECT value FROM sys_session_context WHERE key = 'user_id'), 'SYSTEM')
      );
    END;
  `

  const updateTriggerSQL = `
    DROP TRIGGER IF EXISTS trg_audit_${tableName}_update;
    CREATE TRIGGER trg_audit_${tableName}_update
    AFTER UPDATE ON "${tableName}"
    FOR EACH ROW
    BEGIN
      INSERT INTO sys_audit_logs (
        table_name,
        operation_type,
        record_id,
        old_values,
        new_values,
        mac_hash,
        changed_by
      )
      VALUES (
        '${tableName}',
        'UPDATE',
        OLD.id,
        json_object(${oldJsonFields}),
        json_object(${newJsonFields}),
        IFNULL((SELECT value FROM sys_session_context WHERE key = 'mac_hash'), 'UNAUTHORIZED_EXTERNAL_CLIENT'),
        IFNULL((SELECT value FROM sys_session_context WHERE key = 'user_id'), 'SYSTEM')
      );
    END;
  `

  const deleteTriggerSQL = `
    DROP TRIGGER IF EXISTS trg_audit_${tableName}_delete;
    CREATE TRIGGER trg_audit_${tableName}_delete
    AFTER DELETE ON "${tableName}"
    FOR EACH ROW
    BEGIN
      INSERT INTO sys_audit_logs (
        table_name,
        operation_type,
        record_id,
        old_values,
        new_values,
        mac_hash,
        changed_by
      )
      VALUES (
        '${tableName}',
        'DELETE',
        OLD.id,
        json_object(${oldJsonFields}),
        NULL,
        IFNULL((SELECT value FROM sys_session_context WHERE key = 'mac_hash'), 'UNAUTHORIZED_EXTERNAL_CLIENT'),
        IFNULL((SELECT value FROM sys_session_context WHERE key = 'user_id'), 'SYSTEM')
      );
    END;
  `

  db.exec(insertTriggerSQL)
  db.exec(updateTriggerSQL)
  db.exec(deleteTriggerSQL)
}

/**
 * Uygulama bazında kritik tablolar için varsayılan denetim tetikleyicilerini kaydeder.
 */
export function registerDefaultAuditTriggers(
  db: Database.Database,
  appName: string = 'temin360-desktop'
): void {
  try {
    ensureAuditLogSchema(db)
    initSessionContext(db)

    const tableExists = (name: string): boolean => {
      const res = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name)
      return !!res
    }

    if (appName.includes('temin') || appName === 'temin360-desktop') {
      if (tableExists('DATA_TeminKalemTeklif')) {
        enableAuditLogForTable(db, 'DATA_TeminKalemTeklif', [
          'birim_fiyat',
          'kdv_tutari',
          'teklif_verildi_mi',
          'temin_firma_id',
          'temin_kalem_id'
        ])
      }
      if (tableExists('DATA_TeminFirma')) {
        enableAuditLogForTable(db, 'DATA_TeminFirma', [
          'unvan',
          'vergi_no',
          'telefon',
          'email',
          'ilgili_kisi',
          'teklif_verdi_mi'
        ])
      }
      if (tableExists('DATA_TeminDosyasi')) {
        enableAuditLogForTable(db, 'DATA_TeminDosyasi', [
          'temin_no',
          'dosya_no',
          'konu',
          'yaklasik_maliyet',
          'is_locked',
          'lock_reason'
        ])
      }
      if (tableExists('DATA_TeminKalem')) {
        enableAuditLogForTable(db, 'DATA_TeminKalem', [
          'kalem_adi',
          'miktar',
          'birim',
          'yaklasik_maliyet'
        ])
      }
    }

    if (appName.includes('ihale') || appName === 'ihale360-desktop') {
      if (tableExists('DATA_IhaleKalemTeklif')) {
        enableAuditLogForTable(db, 'DATA_IhaleKalemTeklif', [
          'birim_fiyat',
          'teklif_tutari',
          'is_valid'
        ])
      }
      if (tableExists('DATA_IhaleDosyasi')) {
        enableAuditLogForTable(db, 'DATA_IhaleDosyasi', [
          'ihale_kayit_no',
          'isin_adi',
          'yaklasik_maliyet',
          'durum'
        ])
      }
    }
  } catch (error) {
    console.warn('[AuditTrail] Error registering default triggers:', error)
  }
}

/**
 * Denetim günlüğü kayıtlarını filtreleyerek getirir.
 * Çağrılmadan önce bekleyen mühürsüz logları blokzincirine bağlar.
 */
export function getAuditHistory(
  db: Database.Database,
  filter?: { recordId?: number; tableName?: string; limit?: number }
): AuditLogEntry[] {
  try {
    ensureAuditLogSchema(db)

    // Yeni tetikleyici loglarını hemen zincire bağla
    AuditChainService.secureAllPendingLogs(db)

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (filter?.tableName) {
      conditions.push('table_name = ?')
      params.push(filter.tableName)
    }

    if (filter?.recordId !== undefined && filter?.recordId !== null) {
      conditions.push('record_id = ?')
      params.push(filter.recordId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limitClause = `LIMIT ${Math.min(filter?.limit || 100, 500)}`

    const query = `
      SELECT id, table_name, operation_type, record_id, old_values, new_values, changed_by, mac_hash, prev_hash, current_hash, timestamp
      FROM sys_audit_logs
      ${whereClause}
      ORDER BY id DESC
      ${limitClause}
    `

    return db.prepare(query).all(...params) as AuditLogEntry[]
  } catch (error) {
    console.warn('[AuditTrail] Error querying audit history:', error)
    return []
  }
}

/**
 * İlk blok (Genesis) için standart SHA-256 tohum değeri.
 */
export const GENESIS_HASH: string = crypto
  .createHash('sha256')
  .update('WORKDESK_360_GENESIS_BLOCK')
  .digest('hex')

export interface LogBlockPayload {
  id: number
  tableName: string
  opType: string
  recId: number
  oldVal: string | null
  newVal: string | null
  time: string
  mac: string | null
  prevHash: string
}

/**
 * Bir denetim günlüğü satırı için deterministik blok hash'i hesaplar.
 */
export function calculateLogBlockHash(block: LogBlockPayload): string {
  const logBlockData = JSON.stringify({
    id: block.id,
    tableName: block.tableName,
    opType: block.opType,
    recId: block.recId,
    oldVal: block.oldVal,
    newVal: block.newVal,
    time: block.time,
    mac: block.mac,
    prevHash: block.prevHash
  })
  return crypto.createHash('sha256').update(logBlockData).digest('hex')
}

/**
 * Blokzincir Mantığında Zincirleme Hash Motoru (Chained Hashing Service)
 *
 * MİMARİ GÜVENLİK SINIRI & TEHDİT MODELİ:
 * 1. Bu mekanizma, SQLite içerisindeki denetim izinin (sys_audit_logs) kronolojik sırasını
 *    kriptografik olarak mühürler.
 * 2. SQLite seviyesinde harici bir GUI aracıyla (DB Browser vb.) yapılan aradan kayıt silme,
 *    eski kayıtları manipüle etme veya satır değiştirme girişimlerinde zincir kırılır ve
 *    dosya açılışında adli teftiş kalkanı (Startup Shield) dosyayı kilitler.
 * 3. Dosyayı fiziksel olarak diskte yeniden yazabilen bir saldırgana karşı mutlak
 *    değiştirilemezlik (immutability), ileriki aşamada devreye girecek olan SQLCipher veritabanı
 *    şifrelemesi ve çalışma alanı dijital imza (HMAC/Asymmetric Signature) katmanları ile
 *    tamamlanacaktır.
 */
export class AuditChainService {
  /**
   * sys_audit_logs tablosundaki en son eklenen mühürlenmemiş satırı bulur,
   * bir önceki satırın hash'ini alarak yeni bir blok hash'i üretir ve zincire bağlar.
   */
  public static secureNextLog(db: Database.Database): boolean {
    ensureAuditLogSchema(db)

    const unhashedLog = db
      .prepare(
        `
      SELECT id, table_name, operation_type, record_id, old_values, new_values, timestamp, mac_hash
      FROM sys_audit_logs 
      WHERE current_hash IS NULL 
      ORDER BY id ASC 
      LIMIT 1
    `
      )
      .get() as any

    if (!unhashedLog || typeof unhashedLog.id !== 'number') return false

    const lastLog = db
      .prepare(
        `
      SELECT current_hash 
      FROM sys_audit_logs 
      WHERE current_hash IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 1
    `
      )
      .get() as any

    const prevHash = lastLog && lastLog.current_hash ? lastLog.current_hash : GENESIS_HASH

    const currentHash = calculateLogBlockHash({
      id: unhashedLog.id,
      tableName: unhashedLog.table_name,
      opType: unhashedLog.operation_type,
      recId: unhashedLog.record_id,
      oldVal: unhashedLog.old_values,
      newVal: unhashedLog.new_values,
      time: unhashedLog.timestamp,
      mac: unhashedLog.mac_hash,
      prevHash
    })

    db.prepare(
      `
      UPDATE sys_audit_logs 
      SET prev_hash = ?, current_hash = ? 
      WHERE id = ?
    `
    ).run(prevHash, currentHash, unhashedLog.id)

    return true
  }

  /**
   * Bekleyen tüm mühürsüz log satırlarını sırayla blokzincirine bağlar.
   */
  public static secureAllPendingLogs(db: Database.Database): number {
    ensureAuditLogSchema(db)
    let count = 0
    const maxIterations = 10000
    try {
      if (typeof db.transaction === 'function') {
        const processBatch = db.transaction(() => {
          while (count < maxIterations && AuditChainService.secureNextLog(db)) {
            count++
          }
        })
        processBatch()
      } else {
        while (count < maxIterations && AuditChainService.secureNextLog(db)) {
          count++
        }
      }
    } catch (err) {
      console.warn('[AuditChainService] secureAllPendingLogs uyarısı:', err)
    }
    return count
  }
}

export interface ChainVerificationResult {
  isValid: boolean
  totalRecords: number
  unhashedRecords: number
  brokenRecordId?: number
  error?: string
}

/**
 * Adli Teftiş Esnasında Blokzincir Bütünlük Doğrulayıcısı (Integrity Verifier)
 */
export class AuditIntegrityVerifier {
  /**
   * Tüm log geçmişini tarayarak zincir bütünlüğünü doğrular.
   * @returns ChainVerificationResult
   */
  public static verifyChain(db: Database.Database): ChainVerificationResult {
    ensureAuditLogSchema(db)

    let unhashedCount = 0
    try {
      const res = db
        .prepare(`SELECT COUNT(*) as cnt FROM sys_audit_logs WHERE current_hash IS NULL`)
        .get() as { cnt: number }
      unhashedCount = res?.cnt || 0
    } catch {}

    const logs = db
      .prepare(`SELECT * FROM sys_audit_logs WHERE current_hash IS NOT NULL ORDER BY id ASC`)
      .all() as any[]

    if (logs.length === 0) {
      return {
        isValid: true,
        totalRecords: 0,
        unhashedRecords: unhashedCount
      }
    }

    let expectedPrevHash = GENESIS_HASH

    for (const log of logs) {
      // 1. Kaydedilmiş prev_hash beklenen hash ile eşleşiyor mu?
      if (log.prev_hash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecords: logs.length,
          unhashedRecords: unhashedCount,
          brokenRecordId: log.id,
          error: `Zincir kırılması: Kayıt #${log.id} için beklenen prev_hash '${expectedPrevHash}', ancak '${log.prev_hash}' bulundu!`
        }
      }

      // 2. Blok verisinin hash'ini yeniden hesapla
      const recalculatedHash = calculateLogBlockHash({
        id: log.id,
        tableName: log.table_name,
        opType: log.operation_type,
        recId: log.record_id,
        oldVal: log.old_values,
        newVal: log.new_values,
        time: log.timestamp,
        mac: log.mac_hash,
        prevHash: log.prev_hash
      })

      // 3. Yeniden hesaplanan hash veritabanındaki current_hash ile eşleşiyor mu?
      if (log.current_hash !== recalculatedHash) {
        return {
          isValid: false,
          totalRecords: logs.length,
          unhashedRecords: unhashedCount,
          brokenRecordId: log.id,
          error: `Veri tahrifatı: Kayıt #${log.id} içeriği sonradan değiştirilmiş! Blok bütünlüğü bozuldu.`
        }
      }

      expectedPrevHash = log.current_hash
    }

    return {
      isValid: true,
      totalRecords: logs.length,
      unhashedRecords: unhashedCount
    }
  }
}

