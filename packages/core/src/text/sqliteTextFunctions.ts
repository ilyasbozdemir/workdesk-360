/**
 * @file sqliteTextFunctions.ts
 * @description SQLite better-sqlite3 bağlantılarına Türkçe arama ve sıralama fonksiyonlarını kaydeder.
 *
 * ⚠️ KESİN MİMARİ VE GÜVENLİK KURALLARI:
 * 1. Bu fonksiyonları ASLA şemaya (CREATE TABLE), index'e (CREATE INDEX ... tr_key),
 *    view'a veya trigger'a EKLEMEYİN.
 * 2. Yalnızca çalışma anındaki SELECT / WHERE / ORDER BY sorgularında kullanılmalıdır.
 *    (Dosya başka bir araçta açıldığında "no such function: tr_key" hatası vermemesi için kalıcı şemaya yazılamaz.)
 * 3. COLLATE kullanılmaz (better-sqlite3 db.collation desteklemediği için).
 *
 * KULLANIM ŞEKLİ:
 * Arama:    SELECT * FROM TANIM_Personel WHERE instr(tr_key(ad_soyad), tr_key(?)) > 0
 * Sıralama: SELECT * FROM TANIM_Personel ORDER BY tr_sort(ad_soyad)
 */

import { trKey } from "./trKey";
import { trSortKey } from "./trSortKey";

export interface SqliteFunctionRegistrar {
  function(
    name: string,
    options: { deterministic?: boolean },
    fn: (...args: any[]) => any
  ): any;
}

/**
 * SQLite veritabanı oturumuna `tr_key` ve `tr_sort` deterministic fonksiyonlarını kaydeder.
 *
 * @param db - better-sqlite3 Database nesnesi
 */
export function registerSqliteTextFunctions(db: SqliteFunctionRegistrar): void {
  if (!db || typeof db.function !== "function") {
    return;
  }

  // 1. tr_key: Türkçe arama için kanonik anahtar
  db.function("tr_key", { deterministic: true }, (val: unknown) => {
    if (val === null || val === undefined) {
      return "";
    }
    return trKey(String(val));
  });

  // 2. tr_sort: Türkçe alfabesini koruyan sıralama anahtarı
  db.function("tr_sort", { deterministic: true }, (val: unknown) => {
    if (val === null || val === undefined) {
      return "";
    }
    return trSortKey(String(val));
  });
}
