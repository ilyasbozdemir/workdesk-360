import { DomainEvent } from '../shared/DomainEvent'

/** Teklif fiyatı değişti -> bağlı belgeler "bayat" işaretlenmeli. */
export class QuoteChanged extends DomainEvent {
  constructor(dosyaId: number, at: string, readonly itemId: number, readonly bidderId: number) {
    super('QuoteChanged', dosyaId, at)
  }
}
export class WinnerSelected extends DomainEvent {
  constructor(dosyaId: number, at: string, readonly bidderId: number) {
    super('WinnerSelected', dosyaId, at)
  }
}
/** Sonuç onaylandı -> araştırma belgeleri kilitlenmeli. */
export class ResultApproved extends DomainEvent {
  constructor(dosyaId: number, at: string, readonly bidderId: number) {
    super('ResultApproved', dosyaId, at)
  }
}
/** Kabul onaylandı -> stok düşümü / TİF hazırlığı. */
export class AcceptanceApproved extends DomainEvent {
  constructor(dosyaId: number, at: string, readonly seqNo: number) {
    super('AcceptanceApproved', dosyaId, at)
  }
}
