import type { DomainEvent } from './DomainEvent'

export abstract class AggregateRoot {
  private events: DomainEvent[] = []

  protected raise(event: DomainEvent): void {
    this.events.push(event)
  }

  /** Birikmiş olayları verir ve listeyi boşaltır (application katmanı yayınlar). */
  pullEvents(): DomainEvent[] {
    const e = this.events
    this.events = []
    return e
  }
}
