import type { SqlExecutor, SqlStatement } from "../../application/ports";

/**
 * better-sqlite3 veritabanı sürücüsünün temel arayüz tanımı.
 * Node.js ana (main) sürecinde veya test harness ortamlarında kullanılır.
 */
export interface BetterSqliteLike {
  /**
   * SQL ifadesini derler.
   * @param sql - Hazırlanacak SQL sorgusu.
   */
  prepare(
    sql: string,
  ): { all(...p: unknown[]): unknown[]; run(...p: unknown[]): unknown };
  /**
   * Bir fonksiyonu veritabanı işlemi (transaction) içinde sarmalar.
   * @param fn - Yürütülecek fonksiyon.
   */
  transaction<F extends (...a: never[]) => unknown>(fn: F): F;
}

/**
 * better-sqlite3 sürücüsü üzerinden SQL sorgusu ve transaction çalıştıran adaptör.
 *
 * @remarks
 * **Önemli:** Bu adaptör yalnızca birim/entegrasyon testleri ve CLI betikleri için tasarlanmıştır.
 * Elektronik masaüstü uygulamasının gerçek main sürecinde `sqlGuard`, çalışma dosyası koruması
 * ve mutation kaydı sağlayan `MainSqlExecutor` adaptörü kullanılmalıdır.
 */
export class BetterSqliteExecutor implements SqlExecutor {
  /**
   * @param db - better-sqlite3 veritabanı örneği.
   */
  constructor(private readonly db: BetterSqliteLike) {}

  /**
   * SQL sorgusu çalıştırır ve sonuç satırlarını dizi olarak döndürür.
   * @param sql - SQL sorgu metni.
   * @param params - Sorgu parametreleri.
   */
  async query<T>(sql: string, params: readonly unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  /**
   * Birden fazla SQL ifadesini atomik bir veritabanı işlemi (transaction) içinde yürütür.
   * @param statements - Yürütülecek SQL ifadeleri ve parametreleri.
   */
  async transaction(statements: readonly SqlStatement[]): Promise<void> {
    const run = this.db.transaction(() => {
      for (const s of statements) {
        this.db.prepare(s.sql).run(...(s.params ?? []));
      }
    });
    run();
  }
}
