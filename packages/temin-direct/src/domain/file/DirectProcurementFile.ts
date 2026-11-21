import { Money } from '@temin360/domain'
import { AggregateRoot } from '../shared/AggregateRoot'
import { DomainError } from '../shared/DomainError'
import { lineTotal, roundQty, withKdv } from '../shared/numeric'
import { DIRECT_PROCUREMENT_PROFILE } from '../profile/profiles'
import type { ProcurementProfile } from '../profile/ProcurementProfile'
import { ApproximateCostCalculator, type ApproximateCostResult } from '../pricing/ApproximateCostCalculator'
import type { PricingBasis } from '../pricing/PricingBasis'
import type { WinnerResult, WinnerSelectionStrategy } from '../winner/WinnerSelectionStrategy'
import { AcceptanceRecord, type AcceptanceLine } from './AcceptanceRecord'
import type { Bidder } from './Bidder'
import { AcceptanceApproved, QuoteChanged, ResultApproved, WinnerSelected } from './events'
import type { NeedItem } from './NeedItem'
import { QuoteMatrix } from './QuoteMatrix'

export type FileStage = 'hazirlik' | 'arastirma' | 'yuklenici' | 'kabul'

/** UI metninden: "istekli firmalar (en az 2, en fazla 3)". Mevzuat değişirse burası tek yer. */
export const MIN_BIDDERS = 2
export const MAX_BIDDERS = 3

export interface FileTotals { haric: Money; dahil: Money }

/** Kalıcılık için düz veri görüntüsü (memento). Repository bununla okur/yazar, aggregate'in iç alanlarına dokunmaz. */
export interface FileSnapshot {
  id: number
  subject: string
  openedOn: string
  profile: ProcurementProfile
  items: readonly NeedItem[]
  bidders: readonly Bidder[]
  quotes: readonly { itemId: number; bidderId: number; unitPrice: Money }[]
  winnerId?: number
  resultApprovedAt?: string
  acceptances: readonly AcceptanceRecord[]
  /** DATA_TeminDosyasi.is_locked = 1 (imzalı aktarım, EKAP gönderimi, manuel kilit). Dosya tümüyle salt okunurdur. */
  externalLock?: { reason?: string }
}

/**
 * Doğrudan temin dosyası (aggregate root).
 * Tüm değişiklikler bu sınıfın metotlarından geçer; dışarıdan alan elle değiştirilmez.
 */
export class DirectProcurementFile extends AggregateRoot {
  private readonly _items: NeedItem[] = []
  private readonly _bidders: Bidder[] = []
  private readonly _quotes = new QuoteMatrix()
  private readonly _acceptances: AcceptanceRecord[] = []
  private _winnerId?: number
  private _resultApproved = false
  private _resultApprovedAt?: string
  private _externalLock?: { reason?: string }

  private constructor(
    readonly id: number,
    readonly subject: string,
    readonly openedOn: string, // ISO YYYY-MM-DD
    readonly profile: ProcurementProfile,
  ) {
    super()
  }

  static open(id: number, subject: string, openedOn: string, profile: ProcurementProfile = DIRECT_PROCUREMENT_PROFILE) {
    if (!subject.trim()) throw new DomainError('FILE_SUBJECT', 'Dosya konusu boş olamaz.')
    return new DirectProcurementFile(id, subject, openedOn, profile)
  }

  /** Kayıttan geri yükleme: olay üretmez, kuralları yeniden işletmez. */
  static restore(s: FileSnapshot): DirectProcurementFile {
    const f = new DirectProcurementFile(s.id, s.subject, s.openedOn, s.profile)
    f._items.push(...s.items)
    f._bidders.push(...s.bidders)
    s.quotes.forEach((q) => f._quotes.set(q.itemId, q.bidderId, q.unitPrice))
    f._acceptances.push(...s.acceptances)
    f._winnerId = s.winnerId
    f._resultApproved = s.resultApprovedAt !== undefined
    f._resultApprovedAt = s.resultApprovedAt
    f._externalLock = s.externalLock
    return f
  }

  toSnapshot(): FileSnapshot {
    return {
      id: this.id, subject: this.subject, openedOn: this.openedOn, profile: this.profile,
      items: [...this._items], bidders: [...this._bidders], quotes: this._quotes.entries(),
      winnerId: this._winnerId, resultApprovedAt: this._resultApprovedAt,
      acceptances: [...this._acceptances],
      externalLock: this._externalLock,
    }
  }

  /* ---------- okuma ---------- */
  get items(): readonly NeedItem[] { return this._items }
  get bidders(): readonly Bidder[] { return this._bidders }
  get quotes(): QuoteMatrix { return this._quotes }
  get acceptances(): readonly AcceptanceRecord[] { return this._acceptances }
  get winnerId(): number | undefined { return this._winnerId }
  get isResultApproved(): boolean { return this._resultApproved }
  get isExternallyLocked(): boolean { return this._externalLock !== undefined }

  /* ---------- Aşama 1-2: hazırlık ve araştırma ---------- */
  addNeedItem(item: NeedItem): void {
    this.assertEditable()
    if (this._items.some((i) => i.id === item.id)) throw new DomainError('ITEM_DUP', `Kalem zaten var: ${item.id}`)
    this._items.push(item)
  }

  addBidder(bidder: Bidder): void {
    this.assertEditable()
    if (this._bidders.length >= MAX_BIDDERS)
      throw new DomainError('BIDDER_MAX', `En fazla ${MAX_BIDDERS} firmadan fiyat istenebilir.`)
    if (this._bidders.some((b) => b.id === bidder.id)) throw new DomainError('BIDDER_DUP', `Firma zaten ekli: ${bidder.title}`)
    this._bidders.push(bidder)
  }

  enterQuote(itemId: number, bidderId: number, unitPriceKdvHaric: Money, at: string): void {
    this.assertEditable()
    if (!this._items.some((i) => i.id === itemId)) throw new DomainError('ITEM_UNKNOWN', `Bilinmeyen kalem: ${itemId}`)
    if (!this._bidders.some((b) => b.id === bidderId)) throw new DomainError('BIDDER_UNKNOWN', `Bilinmeyen firma: ${bidderId}`)
    if (unitPriceKdvHaric.compareTo(Money.ZERO) <= 0) throw new DomainError('PRICE_POSITIVE', 'Birim fiyat pozitif olmalı.')
    this._quotes.set(itemId, bidderId, unitPriceKdvHaric)
    this.raise(new QuoteChanged(this.id, at, itemId, bidderId))
  }

  approximateCost(
    basis: PricingBasis,
    calculator: ApproximateCostCalculator = new ApproximateCostCalculator(),
  ): ApproximateCostResult {
    return calculator.calculate(this._items, this._bidders.map((b) => b.id), this._quotes, basis)
  }

  selectWinner(strategy: WinnerSelectionStrategy, at: string): WinnerResult {
    this.assertEditable()
    const result = strategy.select(this._items, this._bidders, this._quotes)
    this._winnerId = result.bidderId
    this.raise(new WinnerSelected(this.id, at, result.bidderId))
    return result
  }

  /** Bir firmanın toplamı (KDV hariç/dahil). Eksik teklifliyse undefined. */
  totalsOf(bidderId: number): FileTotals | undefined {
    if (!this._quotes.isCompleteFor(bidderId, this._items)) return undefined
    let haric = Money.ZERO
    let dahil = Money.ZERO
    for (const i of this._items) {
      const line = lineTotal(this._quotes.get(i.id, bidderId)!, i.quantity)
      haric = haric.plus(line)
      dahil = dahil.plus(withKdv(line, i.kdvPercent))
    }
    return { haric, dahil }
  }

  /* ---------- Aşama 3: sonuç onayı ---------- */
  approveResult(at: string): void {
    this.assertEditable()
    const blockers = this.exitBlockers('arastirma')
    if (blockers.length > 0) throw new DomainError('RESULT_BLOCKED', blockers.join(' '))
    this._resultApproved = true
    this._resultApprovedAt = at
    this.raise(new ResultApproved(this.id, at, this._winnerId!))
  }

  /* ---------- Aşama 4: muayene kabul (parçalı, birikimli) ---------- */
  /** Kalan = ihtiyaç − ONAYLI kabuller. Taslaklar düşmez. */
  remainingQuantities(): Map<number, number> {
    const remaining = new Map(this._items.map((i) => [i.id, i.quantity]))
    for (const rec of this._acceptances) {
      if (rec.status !== 'approved') continue
      for (const l of rec.lines) remaining.set(l.itemId, roundQty((remaining.get(l.itemId) ?? 0) - l.quantity))
    }
    return remaining
  }

  recordAcceptance(lines: AcceptanceLine[], date: string): AcceptanceRecord {
    this.assertNotExternallyLocked()
    if (!this._resultApproved) throw new DomainError('ACC_NO_ORDER', 'Sonuç onaylanmadan kabul tutanağı açılamaz.')
    if (lines.length === 0) throw new DomainError('ACC_EMPTY', 'Tutanakta en az bir kalem olmalı.')
    this.assertWithinRemaining(lines)
    const seqNo = this._acceptances.reduce((m, r) => Math.max(m, r.seqNo), 0) + 1
    const rec = new AcceptanceRecord(seqNo, date, lines)
    this._acceptances.push(rec)
    return rec
  }

  approveAcceptance(seqNo: number, at: string): void {
    this.assertNotExternallyLocked()
    const rec = this._acceptances.find((r) => r.seqNo === seqNo)
    if (!rec) throw new DomainError('ACC_UNKNOWN', `Tutanak bulunamadı: #${seqNo}`)
    this.assertWithinRemaining(rec.lines) // taslaklar fazla rezerve etmiş olabilir; onayda tekrar doğrula
    rec.approve(at)
    this.raise(new AcceptanceApproved(this.id, at, seqNo))
  }

  /* ---------- aşama kapıları ve köprü ---------- */
  /** Bu aşamadan çıkışı engelleyen nedenler. Boşsa sonraki aşamaya geçilebilir. */
  exitBlockers(stage: FileStage): string[] {
    const b: string[] = []
    switch (stage) {
      case 'hazirlik':
        if (this._items.length === 0) b.push('En az bir ihtiyaç kalemi gerekli.')
        break
      case 'arastirma':
        if (this._bidders.length < MIN_BIDDERS) b.push(`En az ${MIN_BIDDERS} firmadan fiyat alınmalı.`)
        if (this._winnerId === undefined) b.push('Kazanan firma belirlenmedi.')
        else if (!this._quotes.isCompleteFor(this._winnerId, this._items)) b.push('Kazanan firmanın tüm kalemleri fiyatlanmamış.')
        break
      case 'yuklenici':
        if (!this._resultApproved) b.push('Sonuç onayı verilmedi.')
        break
      case 'kabul':
        if (!this._acceptances.some((r) => r.status === 'approved')) b.push('Onaylı kabul tutanağı yok.')
        break
    }
    return b
  }

  /**
   * Mevcut `@temin360/workflow-engine` WorkflowContext'ine uyumlu alanlar.
   * Böylece kural motoru dosyayı tanır, domain ise workflow paketine bağımlı olmaz.
   */
  toWorkflowFacts(basis: PricingBasis) {
    const cost = this.approximateCost(basis).total
    return {
      dosyaId: this.id,
      konu: this.subject,
      tur: 'mal' as const,
      yaklasikMaliyet: cost.toKurusNumber() / 100,
      teklifSayisi: this._bidders.length,
      kazananFirmaId: this._winnerId,
      hasOnayBelgesi: this._resultApproved,
      hasMuayeneKabul: this._acceptances.some((r) => r.status === 'approved'),
    }
  }

  /* ---------- iç kurallar ---------- */
  private assertNotExternallyLocked(): void {
    if (this._externalLock)
      throw new DomainError('FILE_LOCKED', `Dosya kilitli${this._externalLock.reason ? ` (${this._externalLock.reason})` : ''}, değiştirilemez.`)
  }

  private assertEditable(): void {
    this.assertNotExternallyLocked()
    if (this._resultApproved)
      throw new DomainError('LOCKED', 'Sonuç onaylandı, dosya kilitli. Değişiklik için onay geri alınmalı.')
  }

  private assertWithinRemaining(lines: readonly AcceptanceLine[]): void {
    const remaining = this.remainingQuantities()
    const errors: string[] = []
    for (const l of lines) {
      const left = remaining.get(l.itemId)
      if (left === undefined) errors.push(`Dosyada olmayan kalem: ${l.itemId}`)
      else if (!(l.quantity > 0)) errors.push(`Miktar pozitif olmalı: ${l.itemId}`)
      else if (l.quantity > left) errors.push(`Kalan miktar aşıldı: kalem ${l.itemId} (kalan ${left}, istenen ${l.quantity})`)
    }
    if (errors.length > 0) throw new DomainError('ACC_OVERRUN', errors.join(' '))
  }
}
