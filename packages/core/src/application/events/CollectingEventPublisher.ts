import type { DomainEvent } from "../../domain/DomainEvent";
import type { EventPublisher } from "./EventPublisher";

/**
 * Toplayıcı Olay Yayınlayıcısı (Collecting Event Publisher).
 *
 * Olayları anında fırlatmak yerine bellekte biriktirir.
 * Hem birim testlerde yayınlanan olayları doğrulamak için bir test adaptörü olarak,
 * hem de transaction süresince olayları toplayıp topluca flush etmek için kullanılabilir.
 */
export class CollectingEventPublisher implements EventPublisher {
  readonly published: DomainEvent[] = [];

  constructor(private readonly innerPublisher?: EventPublisher) {}

  async publish(events: readonly DomainEvent[] | DomainEvent): Promise<void> {
    const list = Array.isArray(events) ? events : [events as DomainEvent];
    this.published.push(...list);
    if (this.innerPublisher) {
      await this.innerPublisher.publish(events);
    }
  }

  async publishAll(events: readonly DomainEvent[]): Promise<void> {
    await this.publish(events);
  }

  async flush(): Promise<void> {
    if (this.innerPublisher) {
      await this.innerPublisher.publish(this.published);
    }
    this.published.length = 0;
  }

  clear(): void {
    this.published.length = 0;
  }

  get collectedEvents(): readonly DomainEvent[] {
    return this.published;
  }
}
