import { validateSqlQuery, extractTableAndAction } from '../utils/sqlGuard'

export interface TransactionQuery {
  sql: string
  params?: unknown[]
}

export interface TransactionResult {
  success: boolean
  lastInsertRowid?: number | bigint
  rootInsertRowid?: number | bigint
  changes?: number
  error?: string
  warning?: string
  saveError?: string
  mutationError?: string
}

export interface ExecuteDbTransactionOptions {
  validateSql?: boolean
  onMutation?: (
    tableName: string,
    action: 'insert' | 'update' | 'delete' | 'other',
    count: number
  ) => void
}

export interface HandleDbTransactionOptions extends ExecuteDbTransactionOptions {
  onSave?: () => void
}

export interface SqliteDatabaseLike {
  transaction?: (fn: (stmts: TransactionQuery[]) => void) => (stmts: TransactionQuery[]) => void
  prepare: (sql: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    run: (...params: any[]) => { lastInsertRowid?: number | bigint; changes?: number | bigint }
  }
  exec?: (sql: string) => void
}

/**
 * Çoklu SQL sorgularını tek bir atomik SQLite transaction'ı içinde yürütür.
 * Hem better-sqlite3 (Electron çalışma zamanı) hem de node:sqlite (test ortamı / Node 22+)
 * motorları ile doğrudan ve şeffaf olarak çalışır.
 *
 * Önemli Bütünlük Kuralı:
 * Mutation bildirimleri (onMutation) transaction sırasında anlık olarak tetiklenmez;
 * geçici bir dizide toplanır. Yalnızca veritabanı işlemi (COMMIT) başarıyla tamamlandığında
 * topluca iletilir. Bu sayede ara bir sorgu hata alıp ROLLBACK yapıldığında JavaScript
 * tarafındaki dosya değişiklik geçmişi (workspace dirty state) kirlenmez.
 *
 * Herhangi bir sorgu veya kısıtlama (FK, UNIQUE, CHECK vb.) hatasında transaction geri alınır (ROLLBACK)
 * ve hata yukarı fırlatılır.
 */
export function executeDbTransaction(
  db: SqliteDatabaseLike,
  queries: TransactionQuery[],
  options?: ExecuteDbTransactionOptions
): {
  success: true
  lastInsertRowid: number | bigint
  rootInsertRowid: number | bigint
  changes: number
  mutationError?: string
  warning?: string
} {
  if (!db) {
    throw new Error('[dbTransaction] Veritabanı bağlantısı sağlanamadı.')
  }

  if (options?.validateSql !== false) {
    for (const q of queries) {
      validateSqlQuery(q.sql, q.params || [])
    }
  }

  let lastInsertRowid: number | bigint = 0
  let rootInsertRowid: number | bigint = 0
  let totalChanges = 0

  // Mutation bilgilerini transaction süresince biriktir; asla COMMIT öncesi bildirme!
  const pendingMutations: Array<{
    tableName: string
    action: 'insert' | 'update' | 'delete' | 'other'
    count: number
  }> = []

  const runAll = (stmts: TransactionQuery[]): void => {
    for (let i = 0; i < stmts.length; i++) {
      const q = stmts[i]
      const stmt = db.prepare(q.sql)
      // Dinamik ID Yayılımı: yalnızca açık referans nesnesi ({ __txRef: 'ROOT_ID' | 'PARENT_ID' })
      // ilk INSERT'ün rowid'si ile değiştirilir. Sıradan metin değerleri asla dönüştürülmez.
      const params = (q.params || []).map((p) =>
        p !== null &&
        typeof p === 'object' &&
        ((p as { __txRef?: unknown }).__txRef === 'ROOT_ID' ||
          (p as { __txRef?: unknown }).__txRef === 'PARENT_ID')
          ? rootInsertRowid
          : p
      )
      const info = stmt.run(...params)
      lastInsertRowid = info.lastInsertRowid ?? lastInsertRowid
      if (rootInsertRowid === 0 && info.lastInsertRowid && /^\s*INSERT\b/i.test(q.sql)) {
        rootInsertRowid = info.lastInsertRowid
      }
      const changesCount = Number(info.changes ?? 0)
      totalChanges += changesCount
      if (options?.onMutation && changesCount > 0) {
        const { tableName, action } = extractTableAndAction(q.sql)
        pendingMutations.push({
          tableName,
          action,
          count: changesCount
        })
      }
    }
  }

  if (typeof db.transaction === 'function') {
    // 1. Native better-sqlite3 transaction API (db.transaction)
    const tx = db.transaction((stmts: TransactionQuery[]): void => {
      runAll(stmts)
    })
    tx(queries)
  } else if (typeof db.exec === 'function') {
    // 2. node:sqlite (DatabaseSync) veya genel SQLite motoru (BEGIN IMMEDIATE / COMMIT / ROLLBACK)
    db.exec('BEGIN IMMEDIATE;')
    try {
      runAll(queries)
      db.exec('COMMIT;')
    } catch (error) {
      try {
        db.exec('ROLLBACK;')
      } catch (rollbackError) {
        console.error('[dbTransaction] Rollback execution failed:', rollbackError)
      }
      throw error
    }
  } else {
    throw new Error(
      '[dbTransaction] Veritabanı motoru ne db.transaction ne de db.exec destekliyor.'
    )
  }

  // 3. Veritabanı COMMIT işlemi başarıyla bitti: Şimdi mutation'ları güvenle bildir.
  // Not: Commit sonrasındaki JavaScript callback'lerinde oluşabilecek bir istisna,
  // veritabanındaki başarılı COMMIT işlemini asla geçersiz kılmaz veya başarısız göstermez.
  const mutationErrors: string[] = []
  if (options?.onMutation && pendingMutations.length > 0) {
    for (const m of pendingMutations) {
      try {
        options.onMutation(m.tableName, m.action, m.count)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[dbTransaction] Commit sonrası onMutation bildirim hatası:', msg)
        mutationErrors.push(msg)
      }
    }
  }

  const result: {
    success: true
    lastInsertRowid: number | bigint
    rootInsertRowid: number | bigint
    changes: number
    mutationError?: string
    warning?: string
  } = {
    success: true,
    lastInsertRowid,
    rootInsertRowid,
    changes: totalChanges
  }

  if (mutationErrors.length > 0) {
    const combinedMsg = mutationErrors.join('; ')
    result.mutationError = combinedMsg
    result.warning = `Veritabanı işlemi commit edildi fakat değişiklik bildirimi sırasında uyarı oluştu: ${combinedMsg}`
  }

  return result
}

/**
 * IPC ve üst servis katmanları için güvenli transaction işleyicisi.
 *
 * Hata Yönetimi & Ayrım Kuralı:
 * 1. Transaction sırasında bir SQL veya kısıtlama hatası olursa rollback yapılır, onSave çağrılmaz
 *    ve { success: false, error: message } döner.
 * 2. Transaction başarıyla COMMIT edildikten sonra onSave() çalıştırılır. Eğer dosya kaydetme
 *    (onSave) aşamasında bir I/O veya zip hatası çıkarsa, bu durum COMMIT edilmiş veritabanı işlemini
 *    "başarısız / geri alındı" gibi göstermemelidir (zira veritabanı kalıcı olarak değişmiştir).
 *    Böyle bir durumda { success: true, saveError, warning } döndürülerek çağıran taraf doğru bilgilendirilir.
 */
export async function handleDbTransaction(
  db: SqliteDatabaseLike,
  queries: TransactionQuery[],
  options?: HandleDbTransactionOptions
): Promise<TransactionResult> {
  let result: {
    success: true
    lastInsertRowid: number | bigint
    rootInsertRowid: number | bigint
    changes: number
    mutationError?: string
    warning?: string
  }

  try {
    result = executeDbTransaction(db, queries, options)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }

  // Veritabanı COMMIT işlemi tamamlandı. Dosya kaydını gerçekleştir:
  if (options?.onSave) {
    try {
      options.onSave()
    } catch (saveError: unknown) {
      const saveMessage = saveError instanceof Error ? saveError.message : String(saveError)
      console.error(
        '[dbTransaction] Transaction veritabanında COMMIT edildi fakat onSave diske kaydederken hata oluştu:',
        saveMessage
      )
      return {
        ...result,
        saveError: saveMessage,
        warning: result.warning
          ? `${result.warning}; Dosya kaydedilirken de uyarı oluştu: ${saveMessage}`
          : `Veritabanı işlemi başarıyla uygulandı fakat çalışma dosyası kaydedilirken uyarı oluştu: ${saveMessage}`
      }
    }
  }

  return result
}
