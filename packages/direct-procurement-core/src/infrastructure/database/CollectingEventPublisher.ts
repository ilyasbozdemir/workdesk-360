import type { DomainEvent } from "../../domain/shared/DomainEvent";
import type { EventPublisher } from "../../application/ports";

/**
 * Yayınlanan etki alanı olaylarını bellek içi bir listede toplayan test adaptörü.
 *
 * Birim testlerinde use-case'lerin doğru olayları doğru verilerle tetikleyip tetiklemediğini
 * doğrulamak için kullanılır.
 */
export class CollectingEventPublisher implements EventPublisher {
  /** Yayınlanan tüm olayların sırayla tutulduğu dizi */
  readonly published: DomainEvent[] = [];

  /**
   * Gelen olayları dahili listeye ekler.
   * @param events - Yayınlanan olaylar.
   */
  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}
