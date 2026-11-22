import type { DomainEvent } from "./DomainEvent";

/**
 * Kök Varlık (Aggregate Root - Soyut Temel Sınıf).
 *
 * Domain-Driven Design (DDD) modelinde bir aggregate sınırını ve tutarlılık kuralını
 * yöneten ana varlıktır.
 *
 * Aggregate içinde gerçekleşen durum değişiklikleri `raise()` ile olay kuyruğuna eklenir.
 * Transaction tamamlandığında application katmanı `pullEvents()` ile bu olayları çekip yayınlar.
 */
export abstract class AggregateRoot {
  private events: DomainEvent[] = [];

  /**
   * Aggregate içinde yeni bir alan olayı kaydeder.
   *
   * @param event - Gerçekleşen etki alanı olayı
   */
  protected raise(event: DomainEvent): void {
    this.events.push(event);
  }

  /**
   * Birikmiş etki alanı olaylarını döndürür ve aggregate'in iç kuyruğunu boşaltır.
   * Genellikle repository veya use case tarafından transaction bitiminde çağrılır.
   *
   * @returns Yayınlanmayı bekleyen etki alanı olayları listesi
   */
  pullEvents(): DomainEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }
}
