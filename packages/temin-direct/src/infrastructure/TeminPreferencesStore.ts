import type { AcceptanceRecord } from '../domain/file/AcceptanceRecord'
import type { SqlExecutor, SqlStatement } from '../application/ports'
import { acceptancesFromJson, acceptancesToJson, type ItemRef, type KabulTutanakJson } from './mappers/AcceptanceJsonMapper'

export interface PrefsRead {
  acceptances: KabulTutanakJson[]
  resultApprovedAt?: string
  /** Okunan ham değerlerin imzası: değişmediyse yazma yapılmaz. */
  signature: string
}

/**
 * `DATA_TeminDosyasi.sablon_tercihleri` JSON'unun bu pakete ait iki anahtarını yönetir:
 *   kabulTutanaklari  (uygulamanın mevcut anahtarı)
 *   sonucOnayDurumu   (bu paketin eklediği: { onaylandi, tarih })
 * Diğer tüm anahtarlar (faturalar, vb.) dokunulmaz: yazma `json_set` ile yalnızca bu anahtarlara yapılır,
 * okuma-değiştirme-yazma yarışı olmaz. Yeni tablo / migration gerekmez.
 */
export class TeminPreferencesStore {
  constructor(private readonly db: SqlExecutor) {}

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

  toRecords(prefs: PrefsRead, items: readonly ItemRef[]): AcceptanceRecord[] {
    return acceptancesFromJson(prefs.acceptances, items)
  }

  /** Değişiklik yoksa undefined döner (çalışma dosyası gereksiz yere kirlenmesin). */
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
