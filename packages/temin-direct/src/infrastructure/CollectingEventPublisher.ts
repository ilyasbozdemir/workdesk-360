import type { DomainEvent } from '../domain/shared/DomainEvent'
import type { EventPublisher } from '../application/ports'

/** Olayları listede toplar (test). Uygulamada burası LOG_SystemLog yazımı + bayatlama/kilit tepkilerine bağlanır. */
export class CollectingEventPublisher implements EventPublisher {
  readonly published: DomainEvent[] = []
  async publish(events: readonly DomainEvent[]) { this.published.push(...events) }
}
