import type { DomainEvent } from "../../domain/DomainEvent";

/**
 * Genel Olay Yayınlayıcı Arayüzü (Event Publisher Port).
 *
 * Domain veya uygulama tarafından üretilen etki alanı olaylarını
 * dinleyicilere (handlers, log, UI, audit) iletir.
 * Tekil olay veya olay dizisi kabul eder.
 */
export interface EventPublisher {
  publish(events: readonly DomainEvent[] | DomainEvent): Promise<void> | void;
  publishAll?(events: readonly DomainEvent[]): Promise<void> | void;
}
