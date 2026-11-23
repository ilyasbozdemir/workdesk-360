import type { EventPublisher } from "../ports";
import type { DomainEvent } from "../../domain/shared/DomainEvent";

type EventClass<E extends DomainEvent> = abstract new (...args: never[]) => E;
type Handler<E extends DomainEvent> = (event: E) => Promise<void>;

/**
 * Olay işleyicisi (handler) çalışırken oluşan hata detayı.
 */
export interface HandlerFailure {
  /** Tetiklenen etki alanı olayı */
  event: DomainEvent;
  /** Hata veren işleyicinin adı */
  handler: string;
  /** Oluşan hata nesnesi */
  error: unknown;
}

/**
 * Süreç içi (in-memory) senkron/asenkron olay dağıtım veriyolu.
 *
 * Temel mimari kurallar:
 * 1. Olaylar dosya aggregate'i veritabanına **kaydedildikten sonra** yayınlanır.
 * 2. Bir yan etki (handler) hata verse bile aggregate durumu geri alınmaz (rollback olmaz).
 * 3. Hatalar sessizce yutulmaz; `onFailure` geri çağırımı ile raporlanır veya loglanır.
 * 4. Tüm handler'lar tekrar çalıştırılabilir (idempotent) tasarlanmalıdır.
 */
export class InProcessEventBus implements EventPublisher {
  private readonly handlers: {
    type: EventClass<DomainEvent>;
    name: string;
    fn: Handler<DomainEvent>;
  }[] = [];

  /**
   * @param onFailure - Bir olay dinleyicisi hata fırlattığında çağrılacak hata yakalayıcı fonksiyon.
   */
  constructor(
    private readonly onFailure: (f: HandlerFailure) => void | Promise<void> =
      () => {},
  ) {}

  /**
   * Belirli bir olay sınıfına dinleyici (handler) kaydeder.
   * @param type - Dinlenecek etki alanı olay sınıfı.
   * @param name - Dinleyicinin açıklayıcı adı (hata ayıklama ve izleme için).
   * @param fn - Olay gerçekleştiğinde yürütülecek asenkron fonksiyon.
   * @returns Zincirleme çağrı için veriyolu örneği.
   */
  on<E extends DomainEvent>(
    type: EventClass<E>,
    name: string,
    fn: Handler<E>,
  ): this {
    this.handlers.push({ type, name, fn: fn as Handler<DomainEvent> });
    return this;
  }

  /**
   * Verilen olay listesini sırayla ilgili tüm dinleyicilere dağıtır.
   * @param events - Dağıtılacak etki alanı olayları dizisi.
   */
  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      for (const h of this.handlers) {
        if (!(event instanceof h.type)) continue;
        try {
          await h.fn(event);
        } catch (error) {
          await this.onFailure({ event, handler: h.name, error });
        }
      }
    }
  }
}
