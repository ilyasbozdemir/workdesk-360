import { describe, expect, it } from "vitest";
import { AggregateRoot } from "../../src/domain/AggregateRoot";
import { DomainEvent } from "../../src/domain/DomainEvent";
import { DomainError } from "../../src/domain/DomainError";

class SampleCreatedEvent extends DomainEvent {
    constructor(dosyaId: number, occurredAt: string, readonly detail: string) {
        super("SampleCreated", dosyaId, occurredAt);
    }
}

class SampleStatusChangedEvent extends DomainEvent {
    constructor(dosyaId: number, occurredAt: string, readonly newStatus: string) {
        super("SampleStatusChanged", dosyaId, occurredAt);
    }
}

class SampleAggregate extends AggregateRoot {
    constructor(readonly id: number) {
        super();
    }

    create(detail: string): void {
        this.raise(new SampleCreatedEvent(this.id, "2026-11-22T10:00:00Z", detail));
    }

    changeStatus(newStatus: string): void {
        this.raise(
            new SampleStatusChangedEvent(this.id, "2026-11-22T10:05:00Z", newStatus),
        );
    }
}

describe("Domain Layer: AggregateRoot, DomainEvent, DomainError", () => {
    describe("AggregateRoot & DomainEvent", () => {
        it("raise() ile eklenen olayları pullEvents() sırayla döndürür ve kuyruğu sıfırlar", () => {
            const agg = new SampleAggregate(101);
            expect(agg.pullEvents()).toEqual([]);

            agg.create("İlk test detayı");
            agg.changeStatus("AKTIF");

            const events = agg.pullEvents();
            expect(events).toHaveLength(2);

            const [e1, e2] = events as [SampleCreatedEvent, SampleStatusChangedEvent];
            expect(e1.name).toBe("SampleCreated");
            expect(e1.dosyaId).toBe(101);
            expect(e1.occurredAt).toBe("2026-11-22T10:00:00Z");
            expect(e1.detail).toBe("İlk test detayı");

            expect(e2.name).toBe("SampleStatusChanged");
            expect(e2.dosyaId).toBe(101);
            expect(e2.newStatus).toBe("AKTIF");

            // İkinci çağrıda kuyruk boş olmalıdır
            expect(agg.pullEvents()).toEqual([]);
        });

        it("farklı aggregate örnekleri bağımsız olay kuyruklarına sahiptir", () => {
            const agg1 = new SampleAggregate(1);
            const agg2 = new SampleAggregate(2);

            agg1.create("Agg 1 Olayı");

            expect(agg1.pullEvents()).toHaveLength(1);
            expect(agg2.pullEvents()).toHaveLength(0);
        });
    });

    describe("DomainError", () => {
        it("code ve message alanlarını doğru saklar ve Error sınıfından türer", () => {
            const err = new DomainError("INVALID_BUDGET", "Bütçe aşımı gerçekleşti.");
            expect(err.name).toBe("DomainError");
            expect(err.code).toBe("INVALID_BUDGET");
            expect(err.message).toBe("Bütçe aşımı gerçekleşti.");
            expect(err).toBeInstanceOf(Error);
            expect(err).toBeInstanceOf(DomainError);
            expect(err.stack).toBeDefined();
        });
    });
});
