import { DomainError } from "../shared/DomainError";

/**
 * Muayene kabul tutanağında teslim alınan tek bir kalemi ve miktarını temsil eder.
 */
export interface AcceptanceLine {
  /** Teslim alınan ihtiyaç kalemi ID'si */
  itemId: number;
  /** Teslim alınan miktar */
  quantity: number;
}

/**
 * Muayene kabul tutanağının onay durumu.
 * - `draft`: Taslak tutanak (henüz stok/depo onaylanmadı, ihtiyaç miktarından düşülmez).
 * - `approved`: Onaylı tutanak (resmî kabul tamamlandı, kalan miktar güncellenir).
 */
export type AcceptanceStatus = "draft" | "approved";

/**
 * Muayene ve Kabul Tutanağı (Entity).
 *
 * Doğrudan temin sürecinde yüklenicinin teslim ettiği mal, hizmet veya yapım işlerinin
 * muayene ve kabul komisyonu / yetkilisi tarafından incelenerek teslim alınmasını belgeler.
 * Parçalı teslimatlarda birden fazla kabul tutanağı düzenlenebilir.
 */
export class AcceptanceRecord {
  private _status: AcceptanceStatus = "draft";
  private _approvedAt?: string;

  /**
   * Yeni bir muayene kabul tutanağı oluşturur.
   *
   * @param seqNo - Tutanak sıra numarası (1, 2, 3...)
   * @param date - Kabul tarihi (ISO YYYY-MM-DD)
   * @param lines - Teslim alınan kalemler ve miktarları
   */
  constructor(
    readonly seqNo: number,
    readonly date: string,
    readonly lines: readonly AcceptanceLine[],
  ) {}

  /**
   * Veritabanından veya snapshot'tan tutanak kaydını yeniden yükler.
   *
   * @param seqNo - Tutanak sıra no
   * @param date - Kabul tarihi
   * @param lines - Teslimat satırları
   * @param status - Tutanak durumu
   * @param approvedAt - Onay zaman damgası
   */
  static restore(
    seqNo: number,
    date: string,
    lines: readonly AcceptanceLine[],
    status: AcceptanceStatus,
    approvedAt?: string,
  ): AcceptanceRecord {
    const r = new AcceptanceRecord(seqNo, date, lines);
    r._status = status;
    r._approvedAt = approvedAt;
    return r;
  }

  /** Tutanağın onay durumu ('draft' veya 'approved') */
  get status(): AcceptanceStatus {
    return this._status;
  }
  /** Tutanağın onaylandığı zaman damgası */
  get approvedAt(): string | undefined {
    return this._approvedAt;
  }

  /**
   * Muayene ve kabul tutanağını onaylar.
   *
   * @param at - Onay zaman damgası (ISO formatı)
   * @throws {DomainError} `ACC_ALREADY_APPROVED` tutanak zaten onaylanmışsa
   */
  approve(at: string): void {
    if (this._status === "approved") {
      throw new DomainError(
        "ACC_ALREADY_APPROVED",
        `Tutanak #${this.seqNo} zaten onaylı.`,
      );
    }
    this._status = "approved";
    this._approvedAt = at;
  }
}
