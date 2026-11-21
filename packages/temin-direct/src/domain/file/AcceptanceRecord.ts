import { DomainError } from '../shared/DomainError'

export interface AcceptanceLine { itemId: number; quantity: number }
export type AcceptanceStatus = 'draft' | 'approved'

/** Muayene kabul tutanağı. Parçalı teslimatta birden fazla olabilir, hepsi geçerlidir. */
export class AcceptanceRecord {
  private _status: AcceptanceStatus = 'draft'
  private _approvedAt?: string

  constructor(
    readonly seqNo: number,
    readonly date: string,
    readonly lines: readonly AcceptanceLine[],
  ) {}

  /** Kayıttan geri yükleme (kurallar tekrar işletilmez, kayıt zaten geçerli kabul edilir). */
  static restore(
    seqNo: number,
    date: string,
    lines: readonly AcceptanceLine[],
    status: AcceptanceStatus,
    approvedAt?: string,
  ): AcceptanceRecord {
    const r = new AcceptanceRecord(seqNo, date, lines)
    r._status = status
    r._approvedAt = approvedAt
    return r
  }

  get status(): AcceptanceStatus { return this._status }
  get approvedAt(): string | undefined { return this._approvedAt }

  approve(at: string): void {
    if (this._status === 'approved') throw new DomainError('ACC_ALREADY_APPROVED', `Tutanak #${this.seqNo} zaten onaylı.`)
    this._status = 'approved'
    this._approvedAt = at
  }
}
