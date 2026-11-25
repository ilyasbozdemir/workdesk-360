import { Money } from "@temin360/domain";
import type {
  FileRepository,
} from "../../application/ports";
import type { SqlExecutor, SqlStatement } from "@worksuite-360/core";
import { Bidder } from "../../domain/file/Bidder";
import { DirectProcurementFile } from "../../domain/file/DirectProcurementFile";
import { NeedItem } from "../../domain/file/NeedItem";
import { DIRECT_PROCUREMENT_PROFILE } from "../../domain/profile/profiles";
import { DomainError } from "@worksuite-360/core";
import { lineTotal } from "../../domain/numeric";
import { TeminPreferencesStore } from "./TeminPreferencesStore";
import type { ItemRef } from "./mappers/AcceptanceJsonMapper";

const toMoney = (tl: number): Money => Money.fromKurus(Math.round(tl * 100));
const toTL = (m: Money): number => m.toKurusNumber() / 100;

/**
 * Temin 360 veritabanındaki tabloları (`DATA_TeminDosyasi`, `DATA_TeminKalem`, `DATA_TeminFirma`,
 * `DATA_TeminKalemTeklif`) `DirectProcurementFile` aggregate root nesnesine dönüştüren ve kaydeden repo adaptörü.
 *
 * @remarks
 * **Sahiplik ve Yetki Kuralları (Separation of Concerns):**
 * - **Kalem ve İstekli Satırları:** Mevcut ekranlar tarafından yönetilir; bu repository tarafından **yalnızca okunur**.
 * - **Teklif Fiyatları, Kazanan İstekli, Sonuç Onayı ve Kabul Tutanakları:** Bu repository tarafından atomik olarak yazılır.
 * - **Kilitli Dosyalar:** `is_locked = 1` olan dosyalar (dışa aktarılmış veya EKAP'a gönderilmiş) salt okunur yüklenir.
 * - **Kazanan İstekli Yazımı:** Uygulamanın `winnerSyncService` sözleşmesiyle tam uyumlu çalışır
 *   (`DATA_TeminDosyasi.firma_id`, `DATA_TeminFirma.kazandi_mi / kazanan_mi`).
 */
export class SqliteFileRepository implements FileRepository {
  /**
   * @param db - SQL sorgu yürütücü adaptörü.
   * @param prefs - Şablon tercihleri ve kabul tutanakları deposu.
   */
  constructor(
    private readonly db: SqlExecutor,
    private readonly prefs = new TeminPreferencesStore(db),
  ) {}

  /**
   * Dosyayı SQLite tablolarından okuyarak etki alanı aggregate nesnesini yeniden kurar (restore).
   * @param id - Dosya ID numarası.
   * @returns Dosya aggregate örneği veya bulunamazsa `undefined`.
   * @throws {DomainError} Dosya ihale türü "Doğrudan Temin" değilse `PROFILE_UNSUPPORTED` koduyla fırlatılır.
   */
  async findById(id: number): Promise<DirectProcurementFile | undefined> {
    const [head] = await this.db.query<{
      id: number;
      konu: string | null;
      dosya_acilis_tarihi: string | null;
      ihale_tipi: string | null;
      is_locked: number | null;
      lock_reason: string | null;
    }>(
      "SELECT id, konu, dosya_acilis_tarihi, ihale_tipi, is_locked, lock_reason FROM DATA_TeminDosyasi WHERE id = ? AND COALESCE(is_deleted, 0) = 0",
      [id],
    );
    if (!head) return undefined;
    if (head.ihale_tipi && head.ihale_tipi !== "Doğrudan Temin") {
      throw new DomainError(
        "PROFILE_UNSUPPORTED",
        `Bu repository yalnızca Doğrudan Temin dosyalarını okur (dosya türü: ${head.ihale_tipi}).`,
      );
    }

    const items = await this.db.query<
      {
        id: number;
        sira_no: number | null;
        kalem_adi: string;
        miktar: number;
        birim: string | null;
        kdv_orani: number | null;
      }
    >(
      "SELECT id, sira_no, kalem_adi, miktar, birim, kdv_orani FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY sira_no, id",
      [id],
    );
    const bidders = await this.db.query<
      { id: number; unvan: string; vergi_no: string | null }
    >(
      "SELECT id, unvan, vergi_no FROM DATA_TeminFirma WHERE temin_dosya_id = ? AND COALESCE(aktif_mi, 1) = 1 ORDER BY id",
      [id],
    );
    const quotes = await this.db.query<
      { temin_kalem_id: number; temin_firma_id: number; birim_fiyat: number }
    >(
      "SELECT temin_kalem_id, temin_firma_id, birim_fiyat FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ? AND COALESCE(teklif_verildi_mi, 1) = 1 AND birim_fiyat > 0",
      [id],
    );
    const [winner] = await this.db.query<{ id: number }>(
      "SELECT id FROM DATA_TeminFirma WHERE temin_dosya_id = ? AND COALESCE(kazandi_mi, 0) = 1 ORDER BY id LIMIT 1",
      [id],
    );
    const prefs = await this.prefs.read(id);
    const refs = SqliteFileRepository.refs(items);

    return DirectProcurementFile.restore({
      id: head.id,
      subject: head.konu?.trim() || `Dosya #${head.id}`,
      openedOn: (head.dosya_acilis_tarihi ?? "").slice(0, 10),
      profile: DIRECT_PROCUREMENT_PROFILE,
      items: items.map((i) =>
        new NeedItem(
          i.id,
          i.kalem_adi,
          i.miktar,
          i.birim ?? "Adet",
          i.kdv_orani ?? 20,
        )
      ),
      bidders: bidders.map((b) =>
        new Bidder(b.id, b.unvan, b.vergi_no ?? undefined)
      ),
      quotes: quotes.map((q) => ({
        itemId: q.temin_kalem_id,
        bidderId: q.temin_firma_id,
        unitPrice: toMoney(q.birim_fiyat),
      })),
      winnerId: winner?.id,
      resultApprovedAt: prefs.resultApprovedAt,
      acceptances: this.prefs.toRecords(prefs, refs),
      externalLock: head.is_locked === 1
        ? { reason: head.lock_reason ?? undefined }
        : undefined,
    });
  }

  /**
   * Doğrudan temin dosyasının değişen teklif, kazanan ve kabul durumlarını atomik bir transaction ile kaydeder.
   * @param file - Kaydedilecek dosya aggregate'i.
   * @throws {DomainError} Dosya veritabanında henüz oluşturulmamışsa `FILE_NOT_PERSISTABLE` koduyla fırlatılır.
   */
  async save(file: DirectProcurementFile): Promise<void> {
    const s = file.toSnapshot();
    const [exists] = await this.db.query(
      "SELECT 1 AS x FROM DATA_TeminDosyasi WHERE id = ?",
      [s.id],
    );
    if (!exists) {
      throw new DomainError(
        "FILE_NOT_PERSISTABLE",
        `Dosya #${s.id} veritabanında yok. Dosya kartı mevcut ekranlardan açılır, burada yalnızca güncellenir.`,
      );
    }

    const tx: SqlStatement[] = [];

    // 1) Teklifler (mevcut ekranla aynı: INSERT OR REPLACE) ve firma toplamları
    const perBidder = new Map<number, Money>();
    for (const q of s.quotes) {
      // Şemada (kalem, firma) için UNIQUE yok; INSERT OR REPLACE çift satır üretir. Bu yüzden sil + ekle.
      tx.push({
        sql:
          "DELETE FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ? AND temin_kalem_id = ? AND temin_firma_id = ?",
        params: [s.id, q.itemId, q.bidderId],
      });
      tx.push({
        sql:
          "INSERT INTO DATA_TeminKalemTeklif (temin_dosya_id, temin_kalem_id, temin_firma_id, birim_fiyat, kdv_tutari, teklif_verildi_mi) VALUES (?, ?, ?, ?, 0, 1)",
        params: [s.id, q.itemId, q.bidderId, toTL(q.unitPrice)],
      });
      const item = s.items.find((i) => i.id === q.itemId);
      if (item) {
        perBidder.set(
          q.bidderId,
          (perBidder.get(q.bidderId) ?? Money.ZERO).plus(
            lineTotal(q.unitPrice, item.quantity),
          ),
        );
      }
    }
    for (const [bidderId, total] of perBidder) {
      tx.push({
        sql:
          "UPDATE DATA_TeminFirma SET teklif_toplami = ?, teklif_verdi_mi = 1, teklif_durumu = 'Teklif Verildi' WHERE id = ? AND temin_dosya_id = ?",
        params: [toTL(total), bidderId, s.id],
      });
    }

    // 2) Kazanan (winnerSyncService ile aynı sözleşme)
    if (s.winnerId !== undefined) {
      tx.push({
        sql:
          "UPDATE DATA_TeminDosyasi SET firma_id = (SELECT COALESCE(firma_id, id) FROM DATA_TeminFirma WHERE id = ? AND temin_dosya_id = ?) WHERE id = ?",
        params: [s.winnerId, s.id, s.id],
      });
      tx.push({
        sql:
          "UPDATE DATA_TeminFirma SET kazandi_mi = CASE WHEN id = ? THEN 1 ELSE 0 END, kazanan_mi = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE temin_dosya_id = ?",
        params: [s.winnerId, s.winnerId, s.id],
      });
    }

    // 3) Sonuç onayı + kabul tutanakları: sablon_tercihleri JSON'unun ilgili anahtarları (json_set)
    const rows = await this.db.query<
      {
        id: number;
        sira_no: number | null;
        kalem_adi: string;
        miktar: number;
        birim: string | null;
      }
    >(
      "SELECT id, sira_no, kalem_adi, miktar, birim FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY sira_no, id",
      [s.id],
    );
    const before = await this.prefs.read(s.id);
    const stmt = this.prefs.statementFor(
      s.id,
      before,
      s.acceptances,
      s.resultApprovedAt,
      SqliteFileRepository.refs(rows),
    );
    if (stmt) tx.push(stmt);

    await this.db.transaction(tx);
  }

  private static refs(
    rows: readonly {
      id: number;
      sira_no: number | null;
      kalem_adi: string;
      miktar: number;
      birim: string | null;
    }[],
  ): ItemRef[] {
    return rows.map((r, i) => ({
      id: r.id,
      siraNo: r.sira_no ?? i + 1,
      name: r.kalem_adi,
      unit: r.birim ?? "Adet",
      quantity: r.miktar,
    }));
  }
}
