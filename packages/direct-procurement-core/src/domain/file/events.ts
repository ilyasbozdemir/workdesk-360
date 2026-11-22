import { DomainEvent } from "@worksuite-360/core";

/**
 * Teklif Değişti Olayı (Domain Event).
 *
 * Bir kaleme verilen istekli firma teklif fiyatı değiştiğinde yayınlanır.
 * Bu olay, ilişkili piyasa araştırma tutanaklarının ve yaklaşık maliyet cetvellerinin
 * "bayat" (stale) olarak işaretlenmesini veya yeniden hesaplanmasını tetikler.
 */
export class QuoteChanged extends DomainEvent {
  constructor(
    dosyaId: number,
    at: string,
    readonly itemId: number,
    readonly bidderId: number,
  ) {
    super("QuoteChanged", dosyaId, at);
  }
}

/**
 * Kazanan İstekli Seçildi Olayı (Domain Event).
 *
 * Piyasa fiyat araştırması teklifleri değerlendirilip en avantajlı teklifi veren
 * istekli belirlendiğinde yayınlanır.
 */
export class WinnerSelected extends DomainEvent {
  constructor(
    dosyaId: number,
    at: string,
    readonly bidderId: number,
  ) {
    super("WinnerSelected", dosyaId, at);
  }
}

/**
 * Alım Sonucu Onaylandı Olayı (Domain Event).
 *
 * Harcama yetkilisi veya komisyon tarafından alım kararı onaylandığında yayınlanır.
 * Bu olay ile birlikte dosyanın araştırma ve teklif aşaması kilitlenir; sipariş/sözleşme süreci başlar.
 */
export class ResultApproved extends DomainEvent {
  constructor(
    dosyaId: number,
    at: string,
    readonly bidderId: number,
  ) {
    super("ResultApproved", dosyaId, at);
  }
}

/**
 * Muayene ve Kabul Onaylandı Olayı (Domain Event).
 *
 * Mal, hizmet veya yapım işi teslim alınarak muayene kabul tutanağı onaylandığında yayınlanır.
 * Taşınır İşlem Fişi (TİF) ve ambar stok girişleri bu olay dinlenerek tetiklenir.
 */
export class AcceptanceApproved extends DomainEvent {
  constructor(
    dosyaId: number,
    at: string,
    readonly seqNo: number,
  ) {
    super("AcceptanceApproved", dosyaId, at);
  }
}
