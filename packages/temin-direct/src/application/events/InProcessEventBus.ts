import type { DomainEvent } from '../../domain/shared/DomainEvent'
import type { EventPublisher } from '../ports'

type EventClass<E extends DomainEvent> = abstract new (...args: never[]) => E
type Handler<E extends DomainEvent> = (event: E) => Promise<void>

export interface HandlerFailure { event: DomainEvent; handler: string; error: unknown }

/**
 * Süreç içi olay yolu. Olaylar dosya KAYDEDİLDİKTEN sonra yayınlanır; bu yüzden bir tepki (handler)
 * hata verse bile dosya durumu geri alınmaz. Hata yutulmaz, `onFailure` ile bildirilir.
 * Handler'lar tekrar çalıştırılabilir (idempotent) yazılmalıdır.
 */
export class InProcessEventBus implements EventPublisher {
  private readonly handlers: { type: EventClass<DomainEvent>; name: string; fn: Handler<DomainEvent> }[] = []

  constructor(private readonly onFailure: (f: HandlerFailure) => void | Promise<void> = () => {}) {}

  on<E extends DomainEvent>(type: EventClass<E>, name: string, fn: Handler<E>): this {
    this.handlers.push({ type, name, fn: fn as Handler<DomainEvent> })
    return this
  }

  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      for (const h of this.handlers) {
        if (!(event instanceof h.type)) continue
        try {
          await h.fn(event)
        } catch (error) {
          await this.onFailure({ event, handler: h.name, error })
        }
      }
    }
  }
}
