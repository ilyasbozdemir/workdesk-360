import type { AcceptanceRecord } from '../domain/file/AcceptanceRecord'
import type { SqlExecutor, SqlStatement } from '../application/ports'
import { acceptancesFromJson, acceptancesToJson, type ItemRef, type KabulTutanakJson } from './mappers/AcceptanceJsonMapper'

/**
 * `DATA_TeminDosyasi.sablon_tercihleri` alanından okunan tercih ve tutanak verileri.
 */
export interface PrefsRead {
  /** Dosyaya ait kabul tutanakları JSON listesi */
  acceptances: KabulTutanakJson[]
  /** Sonuç onayının verildiği tarih (varsa) */
  resultApprovedAt?: string
  /** Okunan ham değerlerin JSON imzası (değişiklik tespitinde gereksiz yazmaları önlemek için) */
  signature: string
}

/**
 * `DATA_TeminDosyasi.sablon_tercihleri` JSON sütununun kabul ve sonuç onayı anahtarlarını yöneten depo adaptörü.
 *
 * Yönetilen anahtarlar:
 * - `kabulTutanaklari`: Uygulamanın mevcut ekranlarıyla uyumlu tutanak listesi.
 * - `sonucOnayDurumu`: Karar onayının verildiğini gösteren `{ onaylandi, tarih }` nesnesi.
 *
 * @remarks
 * Diğer tüm anahtarlara (fatura bilgileri, özel ayarlar vb.) dokunulmaz.
 * SQLite'ın yerel `json_set` fonksiyonu kullanılarak yalnızca ilgili anahtarlar atomik olarak güncellenir.
 * Böylece ek bir tablo veya karmaşık veri tabanı göçü (migration) gerekmez.
 */
export class TeminPreferencesStore {
  /**
   * @param db - SQL sorgu yürütücü adaptörü.
   */
  constructor(private readonly db: SqlExecutor) {}

  /**
   * Belirtilen temin dosyasının şablon tercihlerini okur ve ayrıştırır.
   * @param dosyaId - Temin dosya ID.
   * @returns Tercihler, kabul tutanakları ve imza özeti.
   */
  async read(dosyaId: number): Promise<PrefsRead> {
    const [row] = await this.db.query<{ sablon_tercihleri: string | null }>(
      'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?', [dosyaId])
    let obj: Record<string, unknown> = {}
    try {
      const parsed: unknown = typeof row?.sablon_tercihleri === 'string' ? JSON.parse(row.sablon_tercihleri) : {}
      if (parsed && typeof parsed === 'object') obj = parsed as Record<string, unknown>
    } catch { /* bozuk JSON: boş say, yazarken json_set hata verir ve işlem geri alınır */ }

    const acceptances = Array.isArray(obj.kabulTutanaklari) ? (obj.kabulTutanaklari as KabulTutanakJson[]) : []
    const onay = obj.sonucOnayDurumu as { onaylandi?: boolean; tarih?: string } | undefined
    const resultApprovedAt = onay?.onaylandi ? (onay.tarih ?? '') : undefined
    return { acceptances, resultApprovedAt, signature: JSON.stringify([acceptances, resultApprovedAt ?? null]) }
  }

  /**
   * JSON kabul tutanaklarını etki alanı `AcceptanceRecord` nesnelerine dönüştürür.
   * @param prefs - Okunan tercihler nesnesi.
   * @param items - İhtiyaç kalemleri referans listesi.
   */
  toRecords(prefs: PrefsRead, items: readonly ItemRef[]): AcceptanceRecord[] {
    return acceptancesFromJson(prefs.acceptances, items)
  }

  /**
   * Tercihlerde bir değişiklik varsa güncelleyecek SQL `UPDATE` ifadesini üretir.
   * Değişiklik yoksa `undefined` döner; böylece gereksiz disk I/O ve log kirliliği önlenir.
   *
   * @param dosyaId - Temin dosya ID.
   * @param before - Okuma anındaki önceki tercihler.
   * @param records - Güncel kabul tutanakları.
   * @param resultApprovedAt - Güncel sonuç onay tarihi.
   * @param items - İhtiyaç kalemleri referansları.
   * @returns Yürütülecek SQL ifadesi veya undefined.
   */
  statementFor(
    dosyaId: number,
    before: PrefsRead,
    records: readonly AcceptanceRecord[],
    resultApprovedAt: string | undefined,
    items: readonly ItemRef[],
  ): SqlStatement | undefined {
    const nextAcc = acceptancesToJson(before.acceptances, records, items, dosyaId)
    if (JSON.stringify([nextAcc, resultApprovedAt ?? null]) === before.signature) return undefined

    const onay = resultApprovedAt !== undefined ? { onaylandi: true, tarih: resultApprovedAt } : null
    return {
      sql: `UPDATE DATA_TeminDosyasi
            SET sablon_tercihleri = json_set(COALESCE(NULLIF(sablon_tercihleri, ''), '{}'),
                  '$.kabulTutanaklari', json(?), '$.sonucOnayDurumu', json(?))
            WHERE id = ?`,
      params: [JSON.stringify(nextAcc), JSON.stringify(onay), dosyaId],
    }
  }
}
