import type { EventPublisher } from "./EventPublisher";
import type { DomainEvent } from "../../domain/DomainEvent";

export type EventClass<E extends DomainEvent> = abstract new (...args: never[]) => E;
export type Handler<E extends DomainEvent> = (event: E) => Promise<void> | void;

export interface HandlerFailure {
  event: DomainEvent;
  handler: string;
  error: unknown;
}

/**
 * Süreç-İçi Olay Yolu (In-Process Event Bus).
 *
 * Olaylar dosya KAYDEDİLDİKTEN sonra yayınlanır; bir tepki (handler)
 * hata verse bile dosya durumu geri alınmaz. Hata yutulmaz, `onFailure` ile bildirilir.
 * Handler'lar tekrar çalıştırılabilir (idempotent) yazılmalıdır.
 */
export class InProcessEventBus implements EventPublisher {
  private readonly classHandlers: {
    type: EventClass<DomainEvent>;
    name: string;
    fn: Handler<DomainEvent>;
  }[] = [];
  private readonly nameHandlers = new Map<string, Handler<DomainEvent>[]>();

  constructor(
    private readonly onFailure: (f: HandlerFailure) => void | Promise<void> = () => {},
  ) {}

  on<E extends DomainEvent>(
    type: EventClass<E>,
    name: string,
    fn: Handler<E>,
  ): this {
    this.classHandlers.push({
      type: type as EventClass<DomainEvent>,
      name,
      fn: fn as Handler<DomainEvent>,
    });
    return this;
  }

  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: Handler<T>,
  ): () => void {
    const list = this.nameHandlers.get(eventName) ?? [];
    list.push(handler as Handler<DomainEvent>);
    this.nameHandlers.set(eventName, list);

    return () => {
      const current = this.nameHandlers.get(eventName);
      if (!current) return;
      const idx = current.indexOf(handler as Handler<DomainEvent>);
      if (idx !== -1) current.splice(idx, 1);
    };
  }

  async publish(events: readonly DomainEvent[] | DomainEvent): Promise<void> {
    const eventList = Array.isArray(events) ? events : [events as DomainEvent];

    for (const event of eventList) {
      // 1. Sınıf tabanlı dinleyiciler (.on)
      for (const h of this.classHandlers) {
        if (event instanceof h.type) {
          try {
            await h.fn(event);
          } catch (error) {
            await this.onFailure({ event, handler: h.name, error });
          }
        }
      }

      // 2. Olay adı tabanlı dinleyiciler (.subscribe)
      const named = this.nameHandlers.get(event.name);
      if (named) {
        for (const h of named) {
          try {
            await h(event);
          } catch (error) {
            await this.onFailure({ event, handler: event.name, error });
          }
        }
      }
    }
  }

  async publishAll(events: readonly DomainEvent[]): Promise<void> {
    await this.publish(events);
  }

  clear(): void {
    this.classHandlers.length = 0;
    this.nameHandlers.clear();
  }
}
