/** Aggregate'in dışarıya bildirdiği olay. Zamanı dışarıdan alır (domain Date.now() bilmez). */
export abstract class DomainEvent {
  protected constructor(
    readonly name: string,
    readonly dosyaId: number,
    readonly occurredAt: string,
  ) {}
}
