import type { AcceptanceRecord } from "../../../domain/file/AcceptanceRecord";
import type { SqlStatement } from "../../../application/ports";
import type { ItemRef, KabulTutanakJson } from "../mappers/AcceptanceJsonMapper";

/**
 * `DATA_TeminDosyasi.sablon_tercihleri` alanından okunan tercih ve tutanak verileri.
 */
export interface PrefsRead {
  /** Dosyaya ait kabul tutanakları JSON listesi */
  acceptances: KabulTutanakJson[];
  /** Sonuç onayının verildiği tarih (varsa) */
  resultApprovedAt?: string;
  /** Okunan ham değerlerin JSON imzası (değişiklik tespitinde gereksiz yazmaları önlemek için) */
  signature: string;
}

/**
 * Doğrudan temin şablon tercihleri ve kabul tutanakları depo sözleşmesi.
 */
export interface ITeminPreferencesStore {
  /**
   * Belirtilen temin dosyasının şablon tercihlerini okur ve ayrıştırır.
   * @param dosyaId - Temin dosya ID.
   * @returns Tercihler, kabul tutanakları ve imza özeti.
   */
  read(dosyaId: number): Promise<PrefsRead>;

  /**
   * JSON kabul tutanaklarını etki alanı `AcceptanceRecord` nesnelerine dönüştürür.
   * @param prefs - Okunan tercihler nesnesi.
   * @param items - İhtiyaç kalemleri referans listesi.
   */
  toRecords(prefs: PrefsRead, items: readonly ItemRef[]): AcceptanceRecord[];

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
  ): SqlStatement | undefined;
}
